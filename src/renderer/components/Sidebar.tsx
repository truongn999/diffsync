import { useAppStore } from '../store/useAppStore'
import ProjectsTab from './sidebar/ProjectsTab'
import ConfigTab from './sidebar/ConfigTab'
import HistoryTab from './sidebar/HistoryTab'

interface SidebarProps {
  collapsed: boolean
  onOpenScopeSelector: () => void
}

export default function Sidebar({ collapsed, onOpenScopeSelector }: SidebarProps) {
  const { sidebarTab, setSidebarTab } = useAppStore()

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar-tabs">
        {(['projects', 'config', 'history'] as const).map(tab => (
          <button
            key={tab}
            className={`sidebar-tab ${sidebarTab === tab ? 'sidebar-tab--active' : ''}`}
            onClick={() => setSidebarTab(tab)}
          >
            {tab === 'projects' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
            {tab === 'config' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.07-7.07l-1.41 1.41M7.22 16.78l-1.41 1.41M19.07 19.07l-1.41-1.41M7.22 7.22L5.81 5.81"/></svg>}
            {tab === 'history' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {sidebarTab === 'projects' && <ProjectsTab onOpenScopeSelector={onOpenScopeSelector} />}
      {sidebarTab === 'config' && <ConfigTab />}
      {sidebarTab === 'history' && <HistoryTab />}
    </aside>
  )
}
