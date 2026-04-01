import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { CompareItem } from '../../../shared/types'

interface TreeViewProps {
  files: CompareItem[]
  onFileClick: (f: CompareItem) => void
}

export default function TreeView({ files, onFileClick }: TreeViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Build tree
  const tree: Record<string, any> = {}
  files.forEach(file => {
    const parts = file.relativePath.split('/')
    let current = tree
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (!current.__files__) current.__files__ = []
        current.__files__.push(file)
      } else {
        if (!current[part]) current[part] = {}
        current = current[part]
      }
    })
  })

  const toggleFolder = (path: string) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setCollapsed(next)
  }

  const renderNode = (node: any, depth: number, pathPrefix: string): JSX.Element[] => {
    const elements: JSX.Element[] = []
    const folders = Object.keys(node).filter(k => k !== '__files__').sort()

    folders.forEach(folder => {
      const fullPath = pathPrefix + folder
      const isCollapsed = collapsed.has(fullPath)

      elements.push(
        <div key={fullPath} className="tree-node">
          <div className="tree-folder" style={{ paddingLeft: 8 + depth * 16 }} onClick={() => toggleFolder(fullPath)}>
            <svg className={`tree-folder__chevron ${!isCollapsed ? 'tree-folder__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <svg className="tree-folder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            {folder}
          </div>
          <div className={`tree-children ${isCollapsed ? 'tree-children--collapsed' : ''}`}>
            {renderNode(node[folder], depth + 1, fullPath + '/')}
          </div>
        </div>
      )
    })

    if (node.__files__) {
      node.__files__.forEach((file: CompareItem) => {
        const name = file.relativePath.split('/').pop()!
        elements.push(
          <div key={file.relativePath} className="file-row" style={{ paddingLeft: 8 + (depth) * 16 + 20 }} onClick={() => onFileClick(file)}>
            <div className="file-row__check" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={useAppStore.getState().selectedFiles.has(file.relativePath)}
                onChange={() => useAppStore.getState().toggleFileSelection(file.relativePath)} />
            </div>
            <div className="file-row__path"><span className="file-row__path-name">{name}</span></div>
            <span className={`status-badge status-badge--${file.status}`}>
              <span className="status-badge__dot" />
              {file.status.replace('_', ' ').toUpperCase()}
            </span>
            <div />
          </div>
        )
      })
    }

    return elements
  }

  return <>{renderNode(tree, 0, '')}</>
}
