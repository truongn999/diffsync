import type { BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'

let watcher: any = null
let debounceTimer: NodeJS.Timeout | null = null

const DEBOUNCE_MS = 1000

export async function startWatching(
  p1Root: string,
  p2Root: string,
  ignore: string[],
  mainWindow: BrowserWindow
): Promise<void> {
  // Stop any existing watcher
  await stopWatching()

  // Dynamic import because chokidar v4 is ESM-only
  const chokidar = await import('chokidar')

  const watchPaths = [p1Root, p2Root]
  const ignored = ignore.map(pattern => {
    if (pattern.endsWith('/**')) return pattern.slice(0, -3)
    return pattern
  })

  watcher = chokidar.watch(watchPaths, {
    ignored: [/(^|[\/\\])\.\./, ...ignored, '**/node_modules/**'],
    persistent: true,
    ignoreInitial: true,
    depth: 20,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })

  const notifyChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.FILES_CHANGED)
      }
    }, DEBOUNCE_MS)
  }

  watcher
    .on('add', notifyChange)
    .on('change', notifyChange)
    .on('unlink', notifyChange)

  console.log('[Watcher] Started watching:', watchPaths.join(', '))
}

export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close()
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
