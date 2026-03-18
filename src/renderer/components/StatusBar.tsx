import { useAppStore } from '../store/useAppStore'

export default function StatusBar() {
  const { compareResult, selectedFiles } = useAppStore()

  return (
    <footer className="status-bar">
      <div className="status-bar__left">
        <span>⚡ DiffSync</span>
        <span>v1.0.0</span>
      </div>
      <div className="status-bar__right">
        <span><kbd>Ctrl+Enter</kbd> Compare</span>
        <span><kbd>↑↓</kbd> Navigate</span>
        <span><kbd>Space</kbd> Select</span>
        {compareResult && (
          <span>{selectedFiles.size > 0 ? `${selectedFiles.size} selected` : `${compareResult.stats.total} files compared`}</span>
        )}
      </div>
    </footer>
  )
}
