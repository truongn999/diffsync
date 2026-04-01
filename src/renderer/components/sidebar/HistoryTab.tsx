import { useAppStore } from '../../store/useAppStore'
import type { SyncHistoryEntry } from '../../../shared/types'

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function HistoryTab() {
  const { syncHistory, setSyncHistory, addToast } = useAppStore()

  const handleUndo = async (entry: SyncHistoryEntry) => {
    const success = await window.electronAPI.undoSync(entry.id)
    if (success) {
      addToast('Sync undone', 'success')
      const history = await window.electronAPI.getHistory()
      setSyncHistory(history)
    } else {
      addToast('Failed to undo sync', 'error')
    }
  }

  return (
    <div className="sidebar__section">
      {syncHistory.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No sync history yet</p>
      ) : (
        <>
          <div className="history-list">
            {syncHistory.map(entry => (
              <details key={entry.id} className="history-entry">
                <summary className="history-entry__summary">
                  <div className="history-entry__info">
                    <span className="history-entry__dir">{entry.from}</span>
                    <span className="history-entry__meta">
                      {entry.files.length} files · {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                </summary>
                <div className="history-entry__files">
                  {entry.files.map((f, i) => (
                    <div key={i} className="history-entry__file">{f}</div>
                  ))}
                  <button
                    className="btn btn--danger btn--xs"
                    style={{ marginTop: 6, width: '100%' }}
                    onClick={() => {
                      if (window.confirm(`Undo sync of ${entry.files.length} files?`)) {
                        handleUndo(entry)
                      }
                    }}
                  >↩ Undo this sync</button>
                </div>
              </details>
            ))}
          </div>
          <button
            className="btn btn--ghost btn--xs"
            style={{ marginTop: 8, width: '100%', fontSize: 10 }}
            onClick={async () => {
              if (window.confirm('Clear all sync history?')) {
                for (const entry of syncHistory) {
                  await window.electronAPI.undoSync(entry.id).catch(() => {})
                }
                setSyncHistory([])
                addToast('History cleared', 'info')
              }
            }}
          >Clear all history</button>
        </>
      )}
    </div>
  )
}
