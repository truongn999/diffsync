/**
 * Script to split globals.css into modular CSS files.
 * Run with: node scripts/split-css.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const stylesDir = join(__dirname, '..', 'src', 'renderer', 'styles')
const css = readFileSync(join(stylesDir, 'globals.css'), 'utf-8')
const lines = css.split(/\r?\n/)

// Define line ranges for each module (1-indexed, inclusive)
const modules = {
  'base.css': [[1, 108]],
  'layout.css': [[110, 155]],
  'buttons.css': [[157, 210], [1095, 1104]], // buttons + spinner
  'titlebar.css': [[1160, 1233]],
  'menubar.css': [[212, 304]],
  'toolbar.css': [[306, 425], [1235, 1249]],
  'sidebar.css': [[426, 524], [1130, 1158], [1251, 1275], [1277, 1389], [1391, 1616]],
  'file-panel.css': [[526, 680], [1113, 1128], [1618, 1637]],
  'diff-panel.css': [[682, 856], [1639, 1664]],
  'merge-editor.css': [[1666, 1770]],
  'modal.css': [[858, 931], [997, 1013], [1015, 1111]],
  'toast.css': [[933, 965]],
  'statusbar.css': [[967, 995], [1314, 1327]],
}

for (const [filename, ranges] of Object.entries(modules)) {
  let content = ''
  for (const [start, end] of ranges) {
    const chunk = lines.slice(start - 1, end).join('\n')
    content += chunk + '\n\n'
  }
  // Trim trailing whitespace
  content = content.trimEnd() + '\n'
  const outPath = join(stylesDir, filename)
  writeFileSync(outPath, content, 'utf-8')
  console.log(`✓ ${filename} (${content.split('\n').length} lines)`)
}

console.log('\nDone! All CSS modules created.')
