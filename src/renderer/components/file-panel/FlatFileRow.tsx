import type { CompareItem } from '../../../shared/types'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function buildTooltip(file: CompareItem): string {
  const lines: string[] = [file.relativePath]
  if (file.p1) lines.push(`P1: ${formatSize(file.p1.size)}  |  ${formatTime(file.p1.mtime)}`)
  if (file.p2) lines.push(`P2: ${formatSize(file.p2.size)}  |  ${formatTime(file.p2.mtime)}`)
  return lines.join('\n')
}

interface FlatFileRowProps {
  file: CompareItem
  isSelected: boolean
  isActive: boolean
  onToggle: () => void
  onClick: () => void
  statusLabel: string
}

export default function FlatFileRow({ file, isSelected, isActive, onToggle, onClick, statusLabel }: FlatFileRowProps) {
  const parts = file.relativePath.split('/')
  const name = parts.pop()!
  const dir = parts.join('/') + '/'

  return (
    <div className={`file-row ${isActive ? 'file-row--active' : ''}`} onClick={onClick} title={buildTooltip(file)}>
      <div className="file-row__check" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
      </div>
      <div className="file-row__path">
        <span className="file-row__path-dir">{dir}</span>
        <span className="file-row__path-name">{name}</span>
      </div>
      <div>
        <span className={`status-badge status-badge--${file.status}`}>
          <span className="status-badge__dot" />
          {statusLabel}
        </span>
      </div>
    </div>
  )
}
