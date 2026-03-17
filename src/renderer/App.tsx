import { useEffect, useCallback } from 'react'
import { useAppStore } from './store/useAppStore'
import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import FilePanel from './components/FilePanel'
import DiffPanel from './components/DiffPanel'
import StatusBar from './components/StatusBar'
import Toast from './components/Toast'
import SyncModal from './components/SyncModal'
import ScopeSelector from './components/ScopeSelector'
import ShortcutsModal from './components/ShortcutsModal'
import { useState } from 'react'

export default function App() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    setFilter,
    setSearchQuery,
    isComparing,
    isSyncing,
    addToast,
    setViewMode
  } = useAppStore()

  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showScopeSelector, setShowScopeSelector] = useState(false)

  // ─── Keyboard Shortcuts ──────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

    // Escape: close modals / clear search
    if (e.key === 'Escape') {
      if (showShortcuts) { setShowShortcuts(false); return }
      if (!isInput) setSearchQuery('')
      return
    }

    // Don't process shortcuts if typing in an input
    if (isInput) return

    // ? → Show shortcuts
    if (e.key === '?') { setShowShortcuts(true); e.preventDefault(); return }

    // Ctrl shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          toggleSidebar()
          break
        case 'f':
          e.preventDefault()
          document.getElementById('searchInput')?.focus()
          break
        case '1':
          e.preventDefault()
          setViewMode('flat')
          break
        case '2':
          e.preventDefault()
          setViewMode('tree')
          break
      }
    }
  }, [showShortcuts, toggleSidebar, setSearchQuery, setFilter, setViewMode])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="app-container">
      <TitleBar />
      <Toolbar onShowShortcuts={() => setShowShortcuts(true)} />

      <main className="app-main">
        <Sidebar
          collapsed={sidebarCollapsed}
          onOpenScopeSelector={() => setShowScopeSelector(true)}
        />
        <FilePanel />
        <DiffPanel />
      </main>

      <StatusBar />
      <Toast />

      {isSyncing && <SyncModal />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showScopeSelector && <ScopeSelector onClose={() => setShowScopeSelector(false)} />}
    </div>
  )
}
