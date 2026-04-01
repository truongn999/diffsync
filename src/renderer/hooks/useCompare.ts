import { useAppStore } from '../store/useAppStore'

export function useCompare() {
  const {
    p1Path, p2Path, config, setCompareResult, setIsComparing,
    addToast, setCompareProgress
  } = useAppStore()

  const handleCompare = async () => {
    if (!p1Path || !p2Path) {
      addToast('Please select both project folders first', 'error')
      return
    }
    setIsComparing(true)
    try {
      const result = await window.electronAPI.compareProjects(p1Path, p2Path, config)
      setCompareResult(result)
      addToast(`Compared ${result.stats.total} files`, 'success')
    } catch (err) {
      addToast(`Compare failed: ${err}`, 'error')
    } finally {
      setIsComparing(false)
      setCompareProgress(null)
    }
  }

  return { handleCompare }
}
