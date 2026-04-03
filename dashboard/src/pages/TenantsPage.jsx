import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PageHeader, CopyBtn } from '../components'

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ name: '', email: '', plan: 'free' })
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState(null)

  const load = useCallback(() => {
    api.listTenants().then(r => setTenants(r.tenants || [])).catch(() => { })
  }, [])
  useEffect(() => { load() }, [load])

  const create = async (e) => {
    e.preventDefault(); setLoading(true); setNewKey(null)
    try {
      const res = await api.createTenant(form.name, form.email, form.plan)
      setNewKey(res.api_key)
      toast.success(`Tenant created: ${form.email}`)
      setForm({ name: '', email: '', plan: 'free' })
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const planBadge = { enterprise: 'badge-blue', pro: 'badge-green', agency: 'badge-purple', starter: 'badge-yellow', free: 'badge-gray' }

  return (
    <div className="flex col gap-24">
      <PageHeader title="Tenants" subtitle="Manage API keys and plans for your users." />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Create form */}
        <div className="card flex col gap-16">
          <div style={{ fontWeight: 700, fontSize: 13 }}>Create new tenant</div>
          <form onSubmit={create} className="flex col gap-14">
            <div>
              <label className="label">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@acme.com" required />
            </div>
            <div>
              <label className="label">Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="free">Free — 3 sites, 10 req/min</option>
                <option value="starter">Starter — 1 site, 30 req/min</option>
                <option value="pro">Pro — 10 sites, 60 req/min</option>
                <option value="agency">Agency — unlimited sites, 300 req/min</option>
                <option value="enterprise">Enterprise — unlimited sites, 300 req/min</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : 'Create tenant'}
            </button>
          </form>

          {newKey && (
            <div style={{ background: '#10b98110', border: '1px solid #10b98130', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>
                ✓ API key — save this now, it won't be shown again
              </div>
              <code style={{ fontSize: 13, wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>{newKey}</code>
              <CopyBtn text={newKey} label="Copy key" />
            </div>
          )}
        </div>

        {/* Tenant list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Sites</th>
                <th>Requests</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No tenants yet</td></tr>
              )}
              {tenants.map(t => (
                <tr key={t.api_key}>
                  <td style={{ fontWeight: 500 }}>{t.email}</td>
                  <td style={{ color: 'var(--muted)' }}>{t.name}</td>
                  <td><span className={`badge ${planBadge[t.plan] || 'badge-gray'}`}>{t.plan}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{t.domains_limit}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{t.requests_total}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.last_seen ? new Date(t.last_seen).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
