import { useAppStore } from '../store/useAppStore'
import { useCompare } from './useCompare'

export function useSync() {
  const {
    p1Path, p2Path, config, selectedFiles, addToast,
    setIsSyncing, setSyncProgress, setSyncHistory
  } = useAppStore()
  const { handleCompare } = useCompare()

  const handleSync = async (direction: 'p1-to-p2' | 'p2-to-p1') => {
    if (!p1Path || !p2Path || selectedFiles.size === 0) return
    setIsSyncing(true)
    try {
      const result = await window.electronAPI.syncFiles({
        from: direction === 'p1-to-p2' ? 'p1' : 'p2',
        to: direction === 'p1-to-p2' ? 'p2' : 'p1',
        files: [...selectedFiles],
        p1Root: p1Path,
        p2Root: p2Path
      }, config)

      if (result.success) {
        addToast(`Synced ${result.syncedFiles.length} files`, 'success')
      } else {
        addToast(`Sync completed with ${result.failedFiles.length} errors`, 'error')
      }

      const history = await window.electronAPI.getHistory()
      setSyncHistory(history)
      handleCompare()
    } catch (err) {
      addToast(`Sync failed: ${err}`, 'error')
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  return { handleSync }
}
