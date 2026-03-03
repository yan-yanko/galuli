"""
Multi-tenant API key management.

Each tenant gets:
- A unique API key (prefix: cr_live_ or cr_test_)
- A name + email + hashed password
- Stripe customer + subscription tracking
- Usage tracking (requests, domains indexed)
- A plan tier (free | starter | pro | enterprise)

Storage: tenants table in the same SQLite DB.
"""
import sqlite3
import secrets
import string
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

logger = logging.getLogger(__name__)

CREATE_TENANTS = """
CREATE TABLE IF NOT EXISTS tenants (
    api_key     TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    plan        TEXT NOT NULL DEFAULT 'free',
    created_at  TEXT NOT NULL,
    last_seen   TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    domains_limit INTEGER NOT NULL DEFAULT 3,
    requests_today INTEGER NOT NULL DEFAULT 0,
    requests_total INTEGER NOT NULL DEFAULT 0,
    rate_limit_per_min INTEGER NOT NULL DEFAULT 10,
    password_hash TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    js_enabled INTEGER NOT NULL DEFAULT 0
)
"""

CREATE_MAGIC_TOKENS = """
CREATE TABLE IF NOT EXISTS magic_tokens (
    token       TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used        INTEGER NOT NULL DEFAULT 0
)
"""

CREATE_USAGE_LOG = """
CREATE TABLE IF NOT EXISTS usage_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key     TEXT NOT NULL,
    endpoint    TEXT NOT NULL,
    domain      TEXT,
    status_code INTEGER,
    ts          TEXT NOT NULL
)
"""

CREATE_TENANT_DOMAINS = """
CREATE TABLE IF NOT EXISTS tenant_domains (
    api_key     TEXT NOT NULL,
    domain      TEXT NOT NULL,
    registered_at TEXT NOT NULL,
    PRIMARY KEY (api_key, domain)
)
"""

PLAN_LIMITS = {
    "free":       {"domains": 3,   "rate_per_min": 10,  "requests_today": 50,    "js_enabled": 0},
    "starter":    {"domains": 1,   "rate_per_min": 30,  "requests_today": 500,   "js_enabled": 1},
    "pro":        {"domains": 10,  "rate_per_min": 60,  "requests_today": 2000,  "js_enabled": 1},
    "agency":     {"domains": 999, "rate_per_min": 300, "requests_today": 50000, "js_enabled": 1},
    "enterprise": {"domains": 999, "rate_per_min": 300, "requests_today": 50000, "js_enabled": 1},
}

KEY_ALPHABET = string.ascii_letters + string.digits


def _generate_key(prefix: str = "cr_live_") -> str:
    random_part = "".join(secrets.choice(KEY_ALPHABET) for _ in range(40))
    return f"{prefix}{random_part}"


class Tenant(BaseModel):
    api_key: str
    name: str
    email: str
    plan: str = "free"
    created_at: datetime
    last_seen: Optional[datetime] = None
    is_active: bool = True
    domains_limit: int = 3
    requests_today: int = 0
    requests_total: int = 0
    rate_limit_per_min: int = 10
    password_hash: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    js_enabled: bool = False


class TenantCreateRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    plan: str = "free"


class TenantService:

    def __init__(self, db_path: str = None):
        if db_path is None:
            from app.config import settings
            db_path = settings.database_url
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute(CREATE_TENANTS)
            conn.execute(CREATE_USAGE_LOG)
            conn.execute(CREATE_TENANT_DOMAINS)
            conn.execute(CREATE_MAGIC_TOKENS)
            # Migrate: add new columns if they don't exist yet (safe ALTER TABLE)
            for col, defn in [
                ("password_hash", "TEXT"),
                ("stripe_customer_id", "TEXT"),
                ("stripe_subscription_id", "TEXT"),
                ("js_enabled", "INTEGER NOT NULL DEFAULT 0"),
            ]:
                try:
                    conn.execute(f"ALTER TABLE tenants ADD COLUMN {col} {defn}")
                except Exception:
                    pass  # Column already exists
            conn.commit()

    # ── Password helpers ────────────────────────────────────────────────────
    @staticmethod
    def _hash_password(password: str) -> str:
        salt = secrets.token_hex(16)
        h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return f"{salt}:{h}"

    @staticmethod
    def _verify_password(password: str, stored_hash: str) -> bool:
        try:
            salt, h = stored_hash.split(":", 1)
            return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == h
        except Exception:
            return False

    def create_tenant(self, name: str, email: str, plan: str = "free", password: str = None) -> Tenant:
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        api_key = _generate_key()
        now = datetime.utcnow().isoformat()
        pw_hash = self._hash_password(password) if password else None

        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO tenants
                    (api_key, name, email, plan, created_at, domains_limit,
                     rate_limit_per_min, requests_today, requests_total,
                     password_hash, js_enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
            """, (api_key, name, email, plan, now,
                  limits["domains"], limits["rate_per_min"],
                  pw_hash, limits["js_enabled"]))
            conn.commit()

        logger.info(f"Created tenant: {email} ({plan}) → {api_key[:20]}...")
        return self.get_tenant(api_key)

    def authenticate(self, email: str, password: str) -> Optional["Tenant"]:
        """Verify email+password. Returns tenant or None."""
        tenant = self.get_tenant_by_email(email)
        if not tenant or not tenant.is_active:
            return None
        if not tenant.password_hash:
            return None
        if not self._verify_password(password, tenant.password_hash):
            return None
        return tenant

    # ── Magic link tokens ───────────────────────────────────────────────────
    def create_magic_token(self, email: str, ttl_minutes: int = 15) -> str:
        token = secrets.token_urlsafe(32)
        expires = (datetime.utcnow() + timedelta(minutes=ttl_minutes)).isoformat()
        with self._get_conn() as conn:
            # Invalidate any previous unused tokens for this email
            conn.execute("UPDATE magic_tokens SET used=1 WHERE email=? AND used=0", (email,))
            conn.execute(
                "INSERT INTO magic_tokens (token, email, expires_at, used) VALUES (?,?,?,0)",
                (token, email, expires)
            )
            conn.commit()
        return token

    def verify_magic_token(self, token: str) -> Optional[str]:
        """Returns email if valid, marks as used. Returns None if expired/invalid."""
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT email, expires_at, used FROM magic_tokens WHERE token=?", (token,)
            ).fetchone()
            if not row:
                return None
            if row["used"]:
                return None
            if datetime.fromisoformat(row["expires_at"]) < datetime.utcnow():
                return None
            conn.execute("UPDATE magic_tokens SET used=1 WHERE token=?", (token,))
            conn.commit()
            return row["email"]

    # ── Lemon Squeezy helpers ────────────────────────────────────────────────

    def activate_ls_subscription(self, email: str, plan: str, ls_subscription_id: str) -> bool:
        """Called from LS webhook on order_created / subscription_created."""
        tenant = self.get_tenant_by_email(email)
        if not tenant:
            logger.warning(f"LS webhook: no tenant for email {email}")
            return False
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        with self._get_conn() as conn:
            conn.execute("""
                UPDATE tenants
                SET plan=?, domains_limit=?, rate_limit_per_min=?,
                    stripe_subscription_id=?, js_enabled=?
                WHERE email=?
            """, (plan, limits["domains"], limits["rate_per_min"],
                  ls_subscription_id, limits["js_enabled"], email))
            conn.commit()
        logger.info(f"✅ LS: activated {plan} for {email} (sub {ls_subscription_id})")
        return True

    def deactivate_ls_subscription(self, email: str) -> bool:
        """Called from LS webhook on subscription_expired / subscription_cancelled."""
        tenant = self.get_tenant_by_email(email)
        if not tenant:
            return False
        limits = PLAN_LIMITS["free"]
        with self._get_conn() as conn:
            conn.execute("""
                UPDATE tenants
                SET plan='free', domains_limit=?, rate_limit_per_min=?,
                    stripe_subscription_id=NULL, js_enabled=0
                WHERE email=?
            """, (limits["domains"], limits["rate_per_min"], email))
            conn.commit()
        logger.info(f"⬇️ LS: deactivated subscription for {email}")
        return True

    # ── Stripe helpers ───────────────────────────────────────────────────────
    def set_stripe_customer(self, api_key: str, stripe_customer_id: str):
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE tenants SET stripe_customer_id=? WHERE api_key=?",
                (stripe_customer_id, api_key)
            )
            conn.commit()

    def activate_subscription(self, stripe_customer_id: str, plan: str, subscription_id: str):
        """Called from Stripe webhook on checkout.session.completed."""
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        with self._get_conn() as conn:
            conn.execute("""
                UPDATE tenants
                SET plan=?, domains_limit=?, rate_limit_per_min=?,
                    stripe_subscription_id=?, js_enabled=?
                WHERE stripe_customer_id=?
            """, (plan, limits["domains"], limits["rate_per_min"],
                  subscription_id, limits["js_enabled"], stripe_customer_id))
            conn.commit()
        logger.info(f"Activated {plan} for Stripe customer {stripe_customer_id}")

    def deactivate_subscription(self, stripe_customer_id: str):
        """Called from Stripe webhook on subscription cancelled/unpaid."""
        limits = PLAN_LIMITS["free"]
        with self._get_conn() as conn:
            conn.execute("""
                UPDATE tenants
                SET plan='free', domains_limit=?, rate_limit_per_min=?,
                    stripe_subscription_id=NULL, js_enabled=0
                WHERE stripe_customer_id=?
            """, (limits["domains"], limits["rate_per_min"], stripe_customer_id))
            conn.commit()
        logger.info(f"Deactivated subscription for Stripe customer {stripe_customer_id}")

    def get_tenant(self, api_key: str) -> Optional[Tenant]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM tenants WHERE api_key = ? AND is_active = 1", (api_key,)
            ).fetchone()
            if not row:
                return None
            return self._row_to_tenant(dict(row))

    def get_tenant_by_email(self, email: str) -> Optional[Tenant]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM tenants WHERE email = ?", (email,)
            ).fetchone()
            if not row:
                return None
            return self._row_to_tenant(dict(row))

    def list_tenants(self) -> List[Tenant]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM tenants ORDER BY created_at DESC"
            ).fetchall()
            return [self._row_to_tenant(dict(r)) for r in rows]

    def get_tenant_domains(self, api_key: str) -> List[str]:
        """Return list of domains registered to this tenant."""
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT domain FROM tenant_domains WHERE api_key = ? ORDER BY registered_at",
                (api_key,)
            ).fetchall()
            return [r["domain"] for r in rows]

    def register_domain(self, api_key: str, domain: str) -> bool:
        """
        Register a domain for a tenant. Checks plan limits.
        Returns True if registered (or already registered), False if limit exceeded.
        """
        tenant = self.get_tenant(api_key)
        if not tenant:
            return False

        existing = self.get_tenant_domains(api_key)
        if domain in existing:
            return True  # already registered

        if len(existing) >= tenant.domains_limit:
            logger.warning(f"Tenant {api_key[:16]}… hit domain limit ({tenant.domains_limit}) trying to add {domain}")
            return False

        now = datetime.utcnow().isoformat()
        try:
            with self._get_conn() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO tenant_domains (api_key, domain, registered_at) VALUES (?, ?, ?)",
                    (api_key, domain, now)
                )
                conn.commit()
            logger.info(f"Registered domain {domain} for tenant {api_key[:16]}…")
            return True
        except Exception as e:
            logger.error(f"Failed to register domain: {e}")
            return False

    def is_domain_allowed(self, api_key: str, domain: str) -> bool:
        """
        Check if a domain is registered for this tenant.
        Auto-registers if tenant is under their domain limit.
        """
        tenant = self.get_tenant(api_key)
        if not tenant:
            return False
        return self.register_domain(api_key, domain)

    def record_request(self, api_key: str, endpoint: str, domain: str = None, status: int = 200):
        """Track usage. Fire-and-forget — never blocks the request."""
        now = datetime.utcnow().isoformat()
        try:
            with self._get_conn() as conn:
                conn.execute("""
                    INSERT INTO usage_log (api_key, endpoint, domain, status_code, ts)
                    VALUES (?, ?, ?, ?, ?)
                """, (api_key, endpoint, domain, status, now))
                conn.execute("""
                    UPDATE tenants
                    SET requests_today = requests_today + 1,
                        requests_total = requests_total + 1,
                        last_seen = ?
                    WHERE api_key = ?
                """, (now, api_key))
                conn.commit()
        except Exception as e:
            logger.warning(f"Usage tracking failed: {e}")

    def get_usage(self, api_key: str, limit: int = 100) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute("""
                SELECT endpoint, domain, status_code, ts
                FROM usage_log WHERE api_key = ?
                ORDER BY ts DESC LIMIT ?
            """, (api_key, limit)).fetchall()
            return [dict(r) for r in rows]

    def deactivate(self, api_key: str):
        with self._get_conn() as conn:
            conn.execute("UPDATE tenants SET is_active = 0 WHERE api_key = ?", (api_key,))
            conn.commit()

    def update_plan(self, api_key: str, plan: str):
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        with self._get_conn() as conn:
            conn.execute("""
                UPDATE tenants
                SET plan = ?, domains_limit = ?, rate_limit_per_min = ?
                WHERE api_key = ?
            """, (plan, limits["domains"], limits["rate_per_min"], api_key))
            conn.commit()

    def reset_daily_usage(self):
        """Reset requests_today to 0 for all tenants. Called by the nightly scheduler."""
        with self._get_conn() as conn:
            conn.execute("UPDATE tenants SET requests_today = 0")
            conn.commit()
        logger.info("Daily usage counters reset for all tenants")

    def _row_to_tenant(self, row: dict) -> Tenant:
        row["is_active"] = bool(row.get("is_active", 1))
        row["js_enabled"] = bool(row.get("js_enabled", 0))
        if row.get("created_at"):
            row["created_at"] = datetime.fromisoformat(row["created_at"])
        if row.get("last_seen"):
            row["last_seen"] = datetime.fromisoformat(row["last_seen"])
        # Only pass known Tenant fields
        known = {f for f in Tenant.model_fields}
        return Tenant(**{k: v for k, v in row.items() if k in known})
