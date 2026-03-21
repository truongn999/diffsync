import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

type MenuItem = {
  label: string
  onClick?: () => void
  shortcut?: string
  disabled?: boolean
} | { separator: true }

export default function MenuBar() {
  const {
    p1Path, p2Path, config, setP1Path, setP2Path, setConfig,
    toggleSidebar, theme, setTheme, addToast, compareResult,
    selectAllFiles, deselectAllFiles, selectedFiles,
    isComparing, isSyncing, setIsComparing, setCompareResult,
    setIsSyncing, setSyncProgress, setSyncHistory, setCompareProgress
  } = useAppStore()

  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelectFolder = async (target: 'p1' | 'p2') => {
    const folder = await window.electronAPI.selectFolder()
    if (folder) {
      if (target === 'p1') setP1Path(folder)
      else setP2Path(folder)
      addToast(`${target.toUpperCase()} set: ${folder}`, 'info')
    }
    setOpenMenu(null)
  }

  const handleCompare = async () => {
    setOpenMenu(null)
    if (!p1Path || !p2Path) {
      addToast('Please select both folders first', 'error')
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

  const handleSync = async (direction: 'p1-to-p2' | 'p2-to-p1') => {
    setOpenMenu(null)
    if (!p1Path || !p2Path || !compareResult) return
    if (selectedFiles.size === 0) {
      addToast('No files selected', 'error')
      return
    }
    setIsSyncing(true)
    try {
      await window.electronAPI.syncFiles({
        p1Root: p1Path, p2Root: p2Path,
        from: direction === 'p1-to-p2' ? 'p1' : 'p2',
        to: direction === 'p1-to-p2' ? 'p2' : 'p1',
        files: Array.from(selectedFiles)
      }, config)
      addToast(`Synced ${selectedFiles.size} files`, 'success')
      const result = await window.electronAPI.compareProjects(p1Path, p2Path, config)
      setCompareResult(result)
      const history = await window.electronAPI.getHistory()
      setSyncHistory(history)
    } catch (err) {
      addToast(`Sync failed: ${err}`, 'error')
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  const handleExportReport = async () => {
    setOpenMenu(null)
    if (!p1Path || !p2Path || !compareResult) {
      addToast('Compare first to export report', 'error')
      return
    }
    const filePath = await window.electronAPI.exportReport(p1Path, p2Path, compareResult)
    if (filePath) addToast(`Report exported: ${filePath}`, 'success')
  }

  const handleExportConfig = async () => {
    setOpenMenu(null)
    const filePath = await window.electronAPI.exportConfig(config)
    if (filePath) addToast(`Config exported: ${filePath}`, 'success')
  }

  const handleImportConfig = async () => {
    setOpenMenu(null)
    const imported = await window.electronAPI.importConfig()
    if (imported) {
      setConfig(imported)
      addToast('Config imported', 'success')
    }
  }

  // Load recent projects
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  useEffect(() => {
    if (openMenu === 'File') {
      window.electronAPI.getRecentProjects().then(setRecentProjects)
    }
  }, [openMenu])

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'Open P1 Folder...', onClick: () => handleSelectFolder('p1') },
      { label: 'Open P2 Folder...', onClick: () => handleSelectFolder('p2') },
      { separator: true },
      ...recentProjects.slice(0, 5).map(rp => ({
        label: `${rp.p1Path.split(/[/\\]/).pop()} ↔ ${rp.p2Path.split(/[/\\]/).pop()}`,
        onClick: () => {
          setP1Path(rp.p1Path)
          setP2Path(rp.p2Path)
          addToast('Project loaded', 'info')
          setOpenMenu(null)
        }
      })),
      ...(recentProjects.length > 0 ? [{ separator: true } as const] : []),
      { label: 'Export Report', onClick: handleExportReport, disabled: !compareResult },
      { separator: true },
      { label: 'Exit', onClick: () => window.close() }
    ],
    Config: [
      { label: 'Import Config...', onClick: handleImportConfig },
      { label: 'Export Config...', onClick: handleExportConfig },
      { separator: true },
      {
        label: 'Reset to Defaults', onClick: () => {
          setConfig({
            groups: [],
            ignore: ['node_modules', '.git', '.DS_Store', 'dist', 'build'],
            extensions: [], backup: { enabled: true, directory: '.sync-backup' }, selectedPaths: []
          })
          addToast('Config reset', 'info')
          setOpenMenu(null)
        }
      }
    ],
    View: [
      { label: 'Toggle Sidebar', onClick: () => { toggleSidebar(); setOpenMenu(null) }, shortcut: 'Ctrl+B' },
      { separator: true },
      { label: '☀ Light Theme', onClick: () => { setTheme('light'); setOpenMenu(null) }, disabled: theme === 'light' },
      { label: '🌙 Dark Theme', onClick: () => { setTheme('dark'); setOpenMenu(null) }, disabled: theme === 'dark' }
    ],
    Sync: [
      { label: 'Compare', onClick: handleCompare, disabled: !p1Path || !p2Path || isComparing, shortcut: '' },
      { separator: true },
      { label: 'Sync P1 → P2', onClick: () => handleSync('p1-to-p2'), disabled: !compareResult || isSyncing },
      { label: 'Sync P2 → P1', onClick: () => handleSync('p2-to-p1'), disabled: !compareResult || isSyncing },
      { separator: true },
      { label: 'Select All', onClick: () => { selectAllFiles(); setOpenMenu(null) }, disabled: !compareResult },
      { label: 'Deselect All', onClick: () => { deselectAllFiles(); setOpenMenu(null) }, disabled: !compareResult }
    ],
    Help: [
      { label: 'Keyboard Shortcuts', onClick: () => { setOpenMenu(null); document.dispatchEvent(new CustomEvent('show-shortcuts')) }, shortcut: '?' },
      { separator: true },
      { label: 'About DiffSync', onClick: () => { addToast('DiffSync v1.0.0 — File synchronization tool', 'info'); setOpenMenu(null) } }
    ]
  }

  return (
    <div className="menubar" ref={menuBarRef}>
      {Object.entries(menus).map(([name, items]) => (
        <div className="menubar__dropdown" key={name}>
          <button
            className={`menubar__trigger ${openMenu === name ? 'menubar__trigger--active' : ''}`}
            onClick={() => setOpenMenu(openMenu === name ? null : name)}
            onMouseEnter={() => openMenu && setOpenMenu(name)}
          >
            {name}
          </button>
          {openMenu === name && (
            <div className="menubar__menu">
              {items.map((item, i) =>
                'separator' in item ? (
                  <div className="menubar__separator" key={i} />
                ) : (
                  <button
                    className="menubar__item"
                    key={i}
                    onClick={item.onClick}
                    disabled={item.disabled}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="menubar__shortcut">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
