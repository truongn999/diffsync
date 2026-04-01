import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useWatcher() {
  const {
    p1Path, p2Path, config, isWatching, setIsWatching, addToast
  } = useAppStore()
  const cleanupRef = useRef<(() => void) | null>(null)

  const handleToggleWatch = async () => {
    if (isWatching) {
      await window.electronAPI.stopWatching()
      if (cleanupRef.current) cleanupRef.current()
      cleanupRef.current = null
      setIsWatching(false)
      addToast('File watcher stopped', 'info')
    } else {
      if (!p1Path || !p2Path) {
        addToast('Select both projects first', 'error')
        return
      }
      try {
        await window.electronAPI.startWatching(p1Path, p2Path, config.ignore)
        cleanupRef.current = window.electronAPI.onFilesChanged(async () => {
          const state = useAppStore.getState()
          const { p1Path: currentP1, p2Path: currentP2, config: currentConfig } = state
          if (!currentP1 || !currentP2) return
          state.setIsComparing(true)
          try {
            const result = await window.electronAPI.compareProjects(currentP1, currentP2, currentConfig)
            useAppStore.getState().setCompareResult(result)
            useAppStore.getState().addToast(`Auto-refreshed: ${result.stats.total} files`, 'info')
          } catch (err) {
            useAppStore.getState().addToast(`Auto-refresh failed: ${err}`, 'error')
          } finally {
            useAppStore.getState().setIsComparing(false)
          }
        })
        setIsWatching(true)
        addToast('Watching for file changes...', 'success')
      } catch (err) {
        addToast(`Failed to start watcher: ${err}`, 'error')
      }
    }
  }

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      window.electronAPI.stopWatching().catch(() => {})
    }
  }, [])

  return { handleToggleWatch, isWatching }
}
