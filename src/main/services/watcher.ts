import chokidar from 'chokidar'
import type { BrowserWindow } from 'electron'

let watcher: ReturnType<typeof chokidar.watch> | null = null
let debounceTimer: NodeJS.Timeout | null = null

const DEBOUNCE_MS = 1000

export function startWatching(
  p1Root: string,
  p2Root: string,
  ignore: string[],
  mainWindow: BrowserWindow
): void {
  // Stop any existing watcher
  stopWatching()

  const watchPaths = [p1Root, p2Root]
  const ignored = ignore.map(pattern => {
    // Convert glob patterns to regex-friendly patterns for chokidar
    if (pattern.endsWith('/**')) return pattern.slice(0, -3)
    return pattern
  })

  watcher = chokidar.watch(watchPaths, {
    ignored: [/(^|[\/\\])\../, ...ignored, '**/node_modules/**'],
    persistent: true,
    ignoreInitial: true,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })

  const notifyChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('files-changed')
      }
    }, DEBOUNCE_MS)
  }

  watcher
    .on('add', notifyChange)
    .on('change', notifyChange)
    .on('unlink', notifyChange)

  console.log('[Watcher] Started watching:', watchPaths.join(', '))
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close()
    watcher = null
    console.log('[Watcher] Stopped watching')
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

export function isWatching(): boolean {
  return watcher !== null
}
