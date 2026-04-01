import { useAppStore } from '../../store/useAppStore'

export default function ConfigTab() {
  const {
    p1Path, p2Path, config, setConfig, addToast, compareResult,
    setIsComparing, setCompareResult
  } = useAppStore()

  const handleSaveConfig = async () => {
    try {
      if (p1Path && p2Path) {
        await window.electronAPI.saveConfig(p1Path, p2Path, config)
        addToast('Config saved', 'success')
        if (compareResult) {
          setIsComparing(true)
          try {
            const freshConfig = await window.electronAPI.loadConfig(p1Path, p2Path)
            setConfig(freshConfig)
            const result = await window.electronAPI.compareProjects(p1Path, p2Path, freshConfig)
            setCompareResult(result)
            addToast(`Re-compared ${result.stats.total} files`, 'info')
          } finally {
            setIsComparing(false)
          }
        }
      } else {
        addToast('Please select both project folders first', 'error')
      }
    } catch {
      addToast('Failed to save config', 'error')
    }
  }

  return (
    <div className="sidebar__config-scroll">
      {/* Ignore Patterns */}
      <div className="sidebar__section">
        <label className="path-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 01.2 12.52M5.64 17.36a9 9 0 01-.2-12.52"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          Ignore Patterns
        </label>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
          Type glob pattern and press Enter to add.
        </p>
        <div className="config-chips">
          {config.ignore.map((pattern, i) => (
            <span key={i} className="config-chip">
              {pattern}
              <button className="config-chip__remove" onClick={() => {
                const next = { ...config, ignore: config.ignore.filter((_, idx) => idx !== i) }
                setConfig(next)
              }}>×</button>
            </span>
          ))}
          <input
            className="config-chip-input"
            placeholder="+ Add pattern"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                const val = (e.target as HTMLInputElement).value.trim()
                setConfig({ ...config, ignore: [...config.ignore, val] });
                (e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </div>
      </div>

      {/* Extensions Filter */}
      <div className="sidebar__section">
        <label className="path-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          Extensions Filter
        </label>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
          Empty = all files. Type extension and press Enter to add.
        </p>
        <div className="config-chips">
          {config.extensions.map((ext, i) => (
            <span key={i} className="config-chip config-chip--ext">
              {ext}
              <button className="config-chip__remove" onClick={() => {
                const next = { ...config, extensions: config.extensions.filter((_, idx) => idx !== i) }
                setConfig(next)
              }}>×</button>
            </span>
          ))}
          <input
            className="config-chip-input"
            placeholder="+ .ts, .tsx"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                let val = (e.target as HTMLInputElement).value.trim()
                if (!val.startsWith('.')) val = '.' + val
                setConfig({ ...config, extensions: [...config.extensions, val] });
                (e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </div>
      </div>

      {/* Backup Settings */}
      <div className="sidebar__section">
        <label className="path-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Backup
        </label>
        <div className="config-toggle-row">
          <span style={{ fontSize: 12 }}>Create backups before sync</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.backup.enabled}
              onChange={(e) => setConfig({ ...config, backup: { ...config.backup, enabled: e.target.checked } })}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>
        {config.backup.enabled && (
          <input
            className="config-dir-input"
            value={config.backup.directory}
            onChange={(e) => setConfig({ ...config, backup: { ...config.backup, directory: e.target.value } })}
            placeholder="Backup directory"
          />
        )}
      </div>

      {/* Advanced JSON toggle */}
      <div className="sidebar__section">
        <details className="config-advanced">
          <summary className="config-advanced__summary">Advanced (JSON)</summary>
          <textarea
            className="config-editor__textarea"
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setConfig(parsed)
              } catch { /* ignore parse errors while typing */ }
            }}
            spellCheck={false}
          />
        </details>
      </div>

      {/* Save / Reset */}
      <div className="sidebar__section">
        <div className="config-editor__actions">
          <button className="btn btn--sm" onClick={() => {
            const defaultConfig = {
              groups: [], ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'out/**', 'release/**', '.next/**', '.nuxt/**', '.sync-backup/**', '.sync-manifest.json', 'sync.config.json', '.env*', '*.log', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
              extensions: [], backup: { enabled: true, directory: '.sync-backup' }, selectedPaths: []
            }
            setConfig(defaultConfig)
            addToast('Config reset to defaults', 'info')
          }}>Reset</button>
          <button className="btn btn--ghost btn--sm" onClick={async () => {
            const imported = await window.electronAPI.importConfig()
            if (imported) {
              setConfig(imported)
              addToast('Config imported', 'success')
            }
          }}>Import</button>
          <button className="btn btn--ghost btn--sm" onClick={async () => {
            const filePath = await window.electronAPI.exportConfig(config)
            if (filePath) addToast(`Config exported: ${filePath}`, 'success')
          }}>Export</button>
          <button className="btn btn--primary btn--sm" onClick={handleSaveConfig}>Save</button>
        </div>
      </div>
    </div>
  )
}
