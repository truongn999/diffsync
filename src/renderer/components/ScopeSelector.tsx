import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

interface Props { onClose: () => void }

// Build tree structure from flat file paths
interface TreeNode {
  name: string
  path: string
  children: TreeNode[]
  files: string[]
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: 'root', path: '', children: [], files: [] }

  paths.forEach(filePath => {
    const parts = filePath.split('/')
    let current = root

    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current.files.push(filePath)
      } else {
        let child = current.children.find(c => c.name === part)
        if (!child) {
          child = { name: part, path: current.path ? `${current.path}/${part}` : part, children: [], files: [] }
          current.children.push(child)
        }
        current = child
      }
    })
  })

  return root
}

function getAllFiles(node: TreeNode): string[] {
  let result = [...node.files]
  node.children.forEach(c => result.push(...getAllFiles(c)))
  return result
}

export default function ScopeSelector({ onClose }: Props) {
  const { allScannedFiles, scopeSelectedPaths, setScopeSelectedPaths, setConfig, config, addToast } = useAppStore()

  // Work with a local copy during editing
  const allPaths = useMemo(() => {
    const paths = new Set(allScannedFiles.map(f => f.relativePath))
    return [...paths].sort()
  }, [allScannedFiles])

  const [selected, setSelected] = useState(new Set(scopeSelectedPaths))
  const [filter, setFilter] = useState('')
  const [collapsed, setCollapsed] = useState(new Set<string>())

  const filteredPaths = filter
    ? allPaths.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
    : allPaths

  const tree = useMemo(() => buildTree(filteredPaths), [filteredPaths])

  const toggleFolder = (path: string) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setCollapsed(next)
  }

  const toggleFolderCheck = (node: TreeNode, checked: boolean) => {
    const files = getAllFiles(node)
    const next = new Set(selected)
    files.forEach(f => checked ? next.add(f) : next.delete(f))
    setSelected(next)
  }

  const toggleFile = (path: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(path)
    else next.delete(path)
    setSelected(next)
  }

  const selectAll = () => setSelected(new Set(allPaths))
  const deselectAll = () => setSelected(new Set())

  const handleSave = () => {
    setScopeSelectedPaths(selected)
    setConfig({ ...config, selectedPaths: [...selected] })
    addToast(`Scope saved: ${selected.size} files selected`, 'success')
    onClose()
  }

  const renderNode = (node: TreeNode, depth: number): JSX.Element[] => {
    const elements: JSX.Element[] = []

    node.children.sort((a, b) => a.name.localeCompare(b.name)).forEach(child => {
      const nodeFiles = getAllFiles(child)
      const allChecked = nodeFiles.every(f => selected.has(f))
      const someChecked = nodeFiles.some(f => selected.has(f))
      const isCollapsed = collapsed.has(child.path)
      const selectedCount = nodeFiles.filter(f => selected.has(f)).length

      elements.push(
        <div key={child.path}>
          <div className="scope-folder-row" style={{ paddingLeft: 8 + depth * 20 }}>
            <svg
              className={`scope-folder-chevron ${!isCollapsed ? 'scope-folder-chevron--open' : ''}`}
              onClick={() => toggleFolder(child.path)}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
              onChange={(e) => toggleFolderCheck(child, e.target.checked)}
            />
            <label className="scope-folder-label" onClick={() => toggleFolder(child.path)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              {child.name}
            </label>
            <span className="scope-folder-count">{selectedCount}/{nodeFiles.length}</span>
          </div>
          <div className={`scope-children ${isCollapsed ? 'scope-children--collapsed' : ''}`}>
            {renderNode(child, depth + 1)}
          </div>
        </div>
      )
    })

    node.files.forEach(filePath => {
      const name = filePath.split('/').pop()!
      elements.push(
        <div key={filePath} className="scope-file-row" style={{ paddingLeft: 8 + depth * 20 + 20 }}>
          <input type="checkbox" checked={selected.has(filePath)} onChange={(e) => toggleFile(filePath, e.target.checked)} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          {name}
        </div>
      )
    })

    return elements
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal--scope">
        <div className="modal__header">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Select Files & Folders to Sync
          </h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        <div className="scope-toolbar">
          <div className="scope-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Filter files..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="scope-actions-top">
            <button className="btn btn--ghost btn--xs" onClick={selectAll}>Select All</button>
            <button className="btn btn--ghost btn--xs" onClick={deselectAll}>Deselect All</button>
            <span className="scope-counter">{selected.size} / {allPaths.length} selected</span>
          </div>
        </div>

        <div className="scope-tree">
          {renderNode(tree, 0)}
        </div>

        <div className="scope-footer">
          <div className="scope-footer__info">Selected files will be saved to sync.config.json</div>
          <div className="scope-footer__actions">
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSave}>Save Selection</button>
          </div>
        </div>
      </div>
    </div>
  )
}
