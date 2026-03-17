export function PrivacyPage({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none' }}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </a>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/pricing" style={{ fontSize: 13, color: 'var(--subtle)', textDecoration: 'none' }}>Pricing</a>
          <a href="/blog" style={{ fontSize: 13, color: 'var(--subtle)', textDecoration: 'none' }}>Blog</a>
          <a href="/dashboard/" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Dashboard →</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--subtle)', fontSize: 13, marginBottom: 40 }}>Last updated: March 17, 2026</p>

        <Section title="1. Who We Are">
          <p>Galuli ("we", "our", "us") is a software service that helps websites become discoverable by AI search engines. Our registered contact is <a href="mailto:hello@galuli.io" style={{ color: 'var(--accent)' }}>hello@galuli.io</a>.</p>
        </Section>

        <Section title="2. What Data We Collect">
          <p><strong>Account data:</strong> When you sign up, we collect your email address to create your account and send transactional emails (e.g. login links).</p>
          <p><strong>Website data:</strong> When you scan a domain or install our snippet, we collect publicly available page content (title, headings, schema markup, text) to generate your AI Readiness Score. We do not collect private or gated content.</p>
          <p><strong>Usage data:</strong> We log API requests, page scans, and analytics events (AI agent hits on your site) to provide the service and enforce plan limits. These logs are tied to your account and domain.</p>
          <p><strong>Payment data:</strong> Payments are processed by Lemon Squeezy, our Merchant of Record. We do not store credit card numbers. Lemon Squeezy's privacy policy applies to payment processing.</p>
        </Section>

        <Section title="3. How We Use Data">
          <ul>
            <li>To provide, operate, and improve the Galuli service</li>
            <li>To calculate AI Readiness Scores and generate registries for your domains</li>
            <li>To send you transactional emails (login links, billing receipts)</li>
            <li>To enforce rate limits and plan quotas</li>
            <li>We do not sell your data to third parties</li>
            <li>We do not use your data to train AI models</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We share data only with the service providers necessary to operate Galuli:</p>
          <ul>
            <li><strong>Anthropic</strong> — LLM processing of your site's public content to generate structured metadata. Your content is submitted via API and subject to Anthropic's data processing terms.</li>
            <li><strong>Lemon Squeezy</strong> — Payment processing and subscription management.</li>
            <li><strong>Railway</strong> — Cloud infrastructure hosting. Data is stored in their data centers.</li>
            <li><strong>Resend</strong> — Transactional email delivery (login links).</li>
          </ul>
        </Section>

        <Section title="5. Cookies and Tracking">
          <p>We do not use advertising cookies or third-party tracking. We use localStorage in your browser to store your session API key and UI preferences. The Galuli.js snippet you install on your site collects page-level analytics (AI agent user-agent strings, page URLs, visit timestamps) and sends them to our API under your account.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain account data for as long as your account is active. Domain registries and analytics events are retained until you delete them via your dashboard or close your account. On account deletion we remove all associated data within 30 days.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:hello@galuli.io" style={{ color: 'var(--accent)' }}>hello@galuli.io</a>. We will respond within 30 days. You may also delete your own domain data at any time from your dashboard.</p>
        </Section>

        <Section title="8. Security">
          <p>We use HTTPS for all data in transit. API keys are stored as opaque tokens. We do not log full API keys in application logs. Our infrastructure runs on Railway's managed cloud with volume-backed SQLite storage.</p>
        </Section>

        <Section title="9. Children">
          <p>Galuli is not directed at children under 13 and we do not knowingly collect data from minors.</p>
        </Section>

        <Section title="10. Changes">
          <p>We may update this policy as the service evolves. Material changes will be communicated via email to registered users. Continued use after changes constitutes acceptance.</p>
        </Section>

        <Section title="11. Contact">
          <p>Questions about this policy: <a href="mailto:hello@galuli.io" style={{ color: 'var(--accent)' }}>hello@galuli.io</a></p>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 Galuli</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/terms" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>Privacy</a>
          <a href="mailto:hello@galuli.io" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>hello@galuli.io</a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}
