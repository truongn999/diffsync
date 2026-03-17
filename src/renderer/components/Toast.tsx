import { useAppStore } from '../store/useAppStore'

export default function Toast() {
  const { toasts, removeToast } = useAppStore()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`} onClick={() => removeToast(toast.id)}>
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '✕'}
          {toast.type === 'info' && 'ℹ'}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
