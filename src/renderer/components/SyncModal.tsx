import { useAppStore } from '../store/useAppStore'

export default function SyncModal() {
  const { syncProgress } = useAppStore()
  const pct = syncProgress ? Math.round((syncProgress.current / syncProgress.total) * 100) : 0

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h3>
            <span className="spinner" /> Syncing Files
          </h3>
        </div>
        <div className="modal__body">
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            {syncProgress
              ? `${syncProgress.current} / ${syncProgress.total} — ${syncProgress.file}`
              : 'Preparing...'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
