import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { CompareItem } from '../../../shared/types'
import { getAllFilesInSubtree, getFolderSelectionState } from './tree-utils'

interface TreeViewProps {
  files: CompareItem[]
  onFileClick: (f: CompareItem) => void
  diffStatsCache: Map<string, { additions: number; deletions: number }>
}

interface TreeFolderRowProps {
  folder: string
  fullPath: string
  depth: number
  isCollapsed: boolean
  folderFiles: string[]
  selectedFiles: Set<string>
  onToggleCollapse: () => void
  onToggleSelection: (select: boolean) => void
}

function TreeFolderRow({
  folder,
  depth,
  isCollapsed,
  folderFiles,
  selectedFiles,
  onToggleCollapse,
  onToggleSelection
}: TreeFolderRowProps) {
  const selectionState = getFolderSelectionState(folderFiles, selectedFiles)
  const isChecked = selectionState === 'checked'
  const isIndeterminate = selectionState === 'indeterminate'
  const selectedCount = folderFiles.filter(f => selectedFiles.has(f)).length

  return (
    <div
      className="tree-folder"
      style={{ paddingLeft: 8 + depth * 16 }}
      onClick={onToggleCollapse}
    >
      <svg
        className={`tree-folder__chevron ${!isCollapsed ? 'tree-folder__chevron--open' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
      <div className="tree-folder__check" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isChecked}
          ref={el => {
            if (el) el.indeterminate = isIndeterminate
          }}
          onChange={() => {
            onToggleSelection(!isChecked)
          }}
        />
      </div>
      <svg className="tree-folder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
      <span className="tree-folder__name">{folder}</span>
      <span className="tree-folder__count">({selectedCount}/{folderFiles.length})</span>
    </div>
  )
}

export default function TreeView({ files, onFileClick, diffStatsCache }: TreeViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const { selectedFiles, toggleFileSelection, toggleFolderSelection, activeFile } = useAppStore()

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
      const folderFiles = getAllFilesInSubtree(node[folder])

      elements.push(
        <div key={fullPath} className="tree-node">
          <TreeFolderRow
            folder={folder}
            fullPath={fullPath}
            depth={depth}
            isCollapsed={isCollapsed}
            folderFiles={folderFiles}
            selectedFiles={selectedFiles}
            onToggleCollapse={() => toggleFolder(fullPath)}
            onToggleSelection={(select) => toggleFolderSelection(folderFiles, select)}
          />
          <div className={`tree-children ${isCollapsed ? 'tree-children--collapsed' : ''}`}>
            {renderNode(node[folder], depth + 1, fullPath + '/')}
          </div>
        </div>
      )
    })

    if (node.__files__) {
      node.__files__.forEach((file: CompareItem) => {
        const name = file.relativePath.split('/').pop()!
        const stats = diffStatsCache.get(file.relativePath)
        const isActive = activeFile?.relativePath === file.relativePath
        const isSelected = selectedFiles.has(file.relativePath)

        elements.push(
          <div
            key={file.relativePath}
            className={`file-row ${isActive ? 'file-row--active' : ''}`}
            style={{ paddingLeft: 8 + depth * 16 + 20 }}
            onClick={() => onFileClick(file)}
            data-file-path={file.relativePath}
          >
            <div className="file-row__check" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleFileSelection(file.relativePath)}
              />
            </div>
            <div className="file-row__path"><span className="file-row__path-name">{name}</span></div>
            <div className="file-row__stats">
              {file.status === 'same' ? null : stats ? (
                <>
                  {stats.additions > 0 && <span className="file-row__stats-add">+{stats.additions}</span>}
                  {stats.deletions > 0 && <span className="file-row__stats-del">-{stats.deletions}</span>}
                  {stats.additions === 0 && stats.deletions === 0 && <span className="file-row__stats-zero">±0</span>}
                </>
              ) : (
                <span className="file-row__stats-loading">···</span>
              )}
            </div>
            <span className={`status-badge status-badge--${file.status}`}>
              <span className="status-badge__dot" />
              {file.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )
      })
    }

    return elements
  }

  return <>{renderNode(tree, 0, '')}</>
}
