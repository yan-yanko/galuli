import { useState, useEffect } from 'react'

// ── Toast singleton ──────────────────────────────────────────────────────────
// ES modules are singletons — every file that imports `toast` gets the same object.
let _addToast = () => { }

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    _addToast = (msg, type = 'info') => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
    }
  }, [])
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
    </div>
  )
}

export const toast = {
  success: m => _addToast(m, 'success'),
  error: m => _addToast(m, 'error'),
  info: m => _addToast(m, 'info'),
}
