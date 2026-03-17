interface Props { onClose: () => void }

const SHORTCUTS = [
  ['Ctrl + Enter', 'Compare projects'],
  ['↑ / ↓', 'Navigate file list'],
  ['Space', 'Toggle file selection'],
  ['Ctrl + F', 'Focus search bar'],
  ['Ctrl + A', 'Select / Deselect all'],
  ['Ctrl + 1', 'Switch to List view'],
  ['Ctrl + 2', 'Switch to Tree view'],
  ['Ctrl + B', 'Toggle sidebar'],
  ['Escape', 'Clear search / Close modal'],
  ['?', 'Show this help'],
]

export default function ShortcutsModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal__header">
          <h3>⌨️ Keyboard Shortcuts</h3>
        </div>
        <div className="modal__body">
          <div className="shortcuts-grid">
            {SHORTCUTS.map(([key, desc]) => (
              <><kbd key={key}>{key}</kbd><span>{desc}</span></>
            ))}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
