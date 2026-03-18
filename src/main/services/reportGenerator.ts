import * as fs from 'fs'
import * as path from 'path'
import type { CompareResult } from '../../shared/types'

export async function generateReport(
  p1Root: string,
  p2Root: string,
  compareResult: CompareResult,
  outputPath: string
): Promise<void> {
  const { items, stats } = compareResult
  const timestamp = new Date().toLocaleString()
  const p1Name = path.basename(p1Root)
  const p2Name = path.basename(p2Root)

  // Read file contents for diffs
  const diffs: { relativePath: string; status: string; p1: string; p2: string }[] = []

  for (const item of items) {
    if (item.status === 'same') continue
    let p1Content = ''
    let p2Content = ''
    try {
      if (item.p1) p1Content = await fs.promises.readFile(path.join(p1Root, item.relativePath), 'utf-8')
    } catch { /* file not in p1 */ }
    try {
      if (item.p2) p2Content = await fs.promises.readFile(path.join(p2Root, item.relativePath), 'utf-8')
    } catch { /* file not in p2 */ }

    diffs.push({
      relativePath: item.relativePath,
      status: item.status,
      p1: p1Content,
      p2: p2Content
    })
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff Report — ${p1Name} vs ${p2Name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; }
  .header { background: linear-gradient(135deg, #161b22, #1c2333); padding: 32px; border-bottom: 1px solid #30363d; }
  .header h1 { font-size: 22px; color: #f0f6fc; margin-bottom: 8px; }
  .header p { font-size: 13px; color: #8b949e; }
  .stats { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  .stat { background: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; min-width: 100px; }
  .stat__value { font-size: 24px; font-weight: 700; display: block; }
  .stat__label { font-size: 11px; color: #8b949e; }
  .stat--modified .stat__value { color: #d29922; }
  .stat--p1 .stat__value { color: #3fb950; }
  .stat--p2 .stat__value { color: #f85149; }
  .stat--same .stat__value { color: #8b949e; }
  .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
  .file-list { margin-top: 16px; }
  .file-entry { border: 1px solid #30363d; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
  .file-entry__header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #161b22; cursor: pointer; }
  .file-entry__header:hover { background: #1c2333; }
  .file-entry__path { font-family: monospace; font-size: 13px; flex: 1; }
  .badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; }
  .badge--modified { background: rgba(210,153,34,0.2); color: #d29922; }
  .badge--only_in_p1 { background: rgba(63,185,80,0.2); color: #3fb950; }
  .badge--only_in_p2 { background: rgba(248,81,73,0.2); color: #f85149; }
  .badge--conflict { background: rgba(248,81,73,0.2); color: #f85149; }
  .diff-content { display: none; border-top: 1px solid #30363d; }
  .diff-content.open { display: block; }
  .diff-panes { display: flex; }
  .diff-pane { flex: 1; overflow-x: auto; }
  .diff-pane + .diff-pane { border-left: 1px solid #30363d; }
  .diff-pane__header { padding: 4px 12px; font-size: 11px; color: #8b949e; background: #161b22; border-bottom: 1px solid #30363d; }
  pre { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px; line-height: 1.6; padding: 12px; white-space: pre-wrap; word-break: break-all; color: #c9d1d9; max-height: 500px; overflow: auto; }
  .summary { margin-top: 24px; text-align: center; font-size: 12px; color: #484f58; padding: 16px; }
</style>
</head>
<body>
<div class="header">
  <h1>📊 Diff Report</h1>
  <p><strong>${escapeHtml(p1Name)}</strong> vs <strong>${escapeHtml(p2Name)}</strong> — ${timestamp}</p>
  <div class="stats">
    <div class="stat"><span class="stat__value">${stats.total}</span><span class="stat__label">Total Files</span></div>
    <div class="stat stat--modified"><span class="stat__value">${stats.modified}</span><span class="stat__label">Modified</span></div>
    <div class="stat stat--p1"><span class="stat__value">${stats.only_in_p1}</span><span class="stat__label">Only in P1</span></div>
    <div class="stat stat--p2"><span class="stat__value">${stats.only_in_p2}</span><span class="stat__label">Only in P2</span></div>
    <div class="stat stat--same"><span class="stat__value">${stats.same}</span><span class="stat__label">Same</span></div>
  </div>
</div>
<div class="container">
  <h2 style="font-size:16px; margin-bottom:8px; color:#f0f6fc;">Changed Files (${items.filter(i => i.status !== 'same').length})</h2>
  <div class="file-list">
    ${diffs.map((d, i) => `
    <div class="file-entry">
      <div class="file-entry__header" onclick="this.nextElementSibling.classList.toggle('open')">
        <span class="badge badge--${d.status}">${d.status.replace('_', ' ')}</span>
        <span class="file-entry__path">${escapeHtml(d.relativePath)}</span>
        <span style="font-size:11px;color:#484f58">▼</span>
      </div>
      <div class="diff-content${i === 0 ? ' open' : ''}">
        <div class="diff-panes">
          <div class="diff-pane">
            <div class="diff-pane__header">P1 — ${escapeHtml(p1Name)}</div>
            <pre>${escapeHtml(d.p1 || '(file not present)')}</pre>
          </div>
          <div class="diff-pane">
            <div class="diff-pane__header">P2 — ${escapeHtml(p2Name)}</div>
            <pre>${escapeHtml(d.p2 || '(file not present)')}</pre>
          </div>
        </div>
      </div>
    </div>`).join('\n')}
  </div>
  <div class="summary">
    Generated by DiffSync — ${timestamp}
  </div>
</div>
</body>
</html>`

  await fs.promises.writeFile(outputPath, html, 'utf-8')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
