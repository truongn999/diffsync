/**
 * Watcher Service Tests
 *
 * Tests the file watcher using real file system events (chokidar).
 * Uses a mock BrowserWindow to verify IPC notifications.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock electron module so watcher.ts can import BrowserWindow type
vi.mock('electron', () => ({
  BrowserWindow: class {},
  app: { getPath: () => os.tmpdir() },
  ipcMain: { handle: vi.fn() },
  dialog: {}
}))

import { startWatching, stopWatching, isWatching } from '../../src/main/services/watcher'
import { IPC } from '../../src/shared/ipc-channels'

let tempP1: string
let tempP2: string

/** Creates a mock BrowserWindow with webContents.send spy */
function createMockWindow() {
  return {
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: {
      send: vi.fn()
    }
  } as any
}

/** Wait for debounce + chokidar stabilityThreshold + margin */
function waitForDebounce(ms = 2000): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

beforeEach(async () => {
  tempP1 = path.join(os.tmpdir(), `watcher-p1-${Date.now()}`)
  tempP2 = path.join(os.tmpdir(), `watcher-p2-${Date.now()}`)
  await fs.promises.mkdir(path.join(tempP1, 'src'), { recursive: true })
  await fs.promises.mkdir(path.join(tempP2, 'src'), { recursive: true })

  // Create initial files so the directories aren't empty
  await fs.promises.writeFile(path.join(tempP1, 'src/app.ts'), 'const a = 1')
  await fs.promises.writeFile(path.join(tempP2, 'src/app.ts'), 'const b = 2')
})

afterEach(async () => {
  await stopWatching()
  // Small delay to let chokidar fully release file handles
  await new Promise(r => setTimeout(r, 200))
  await fs.promises.rm(tempP1, { recursive: true, force: true }).catch(() => {})
  await fs.promises.rm(tempP2, { recursive: true, force: true }).catch(() => {})
})

describe('Watcher Service', () => {
  // ─────────────────────────────────────────────────────────
  // Start / Stop / isWatching
  // ─────────────────────────────────────────────────────────
  describe('Start and Stop', () => {
    it('should set isWatching to true after starting', async () => {
      const win = createMockWindow()
      expect(isWatching()).toBe(false)

      await startWatching(tempP1, tempP2, [], win)
      expect(isWatching()).toBe(true)
    })

    it('should set isWatching to false after stopping', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      expect(isWatching()).toBe(true)

      await stopWatching()
      expect(isWatching()).toBe(false)
    })

    it('should handle stopWatching when no watcher is active (no-op)', async () => {
      expect(isWatching()).toBe(false)
      await stopWatching() // Should not throw
      expect(isWatching()).toBe(false)
    })

    it('should stop previous watcher when starting a new one', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      expect(isWatching()).toBe(true)

      // Start again with different paths → old watcher should be closed
      await startWatching(tempP1, tempP2, [], win)
      expect(isWatching()).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────
  // File Change Detection
  // ─────────────────────────────────────────────────────────
  describe('File change detection', () => {
    it('should notify on file modification in P1', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500) // Let watcher initialize

      // Modify a file in P1
      await fs.promises.writeFile(path.join(tempP1, 'src/app.ts'), 'const a = 999')

      // Wait for debounce (1000ms) + awaitWriteFinish (300ms) + margin
      await waitForDebounce(2500)

      expect(win.webContents.send).toHaveBeenCalledWith(IPC.FILES_CHANGED)
    })

    it('should notify on file modification in P2', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      await fs.promises.writeFile(path.join(tempP2, 'src/app.ts'), 'const b = 999')
      await waitForDebounce(2500)

      expect(win.webContents.send).toHaveBeenCalledWith(IPC.FILES_CHANGED)
    })

    it('should notify on new file creation', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      await fs.promises.writeFile(path.join(tempP1, 'src/newfile.ts'), 'new file')
      await waitForDebounce(2500)

      expect(win.webContents.send).toHaveBeenCalledWith(IPC.FILES_CHANGED)
    })

    it('should notify on file deletion', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      await fs.promises.unlink(path.join(tempP1, 'src/app.ts'))
      await waitForDebounce(2500)

      expect(win.webContents.send).toHaveBeenCalledWith(IPC.FILES_CHANGED)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Debouncing
  // ─────────────────────────────────────────────────────────
  describe('Debouncing', () => {
    it('should debounce rapid changes into a single notification', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      // Make multiple rapid changes
      for (let i = 0; i < 5; i++) {
        await fs.promises.writeFile(
          path.join(tempP1, 'src/app.ts'),
          `const version = ${i}`
        )
        await new Promise(r => setTimeout(r, 50)) // 50ms apart
      }

      // Wait for debounce to fire
      await waitForDebounce(2500)

      // Due to debouncing, send should NOT be called 5 times
      // It should be called a small number of times (typically 1)
      const callCount = win.webContents.send.mock.calls.length
      expect(callCount).toBeGreaterThan(0)
      expect(callCount).toBeLessThanOrEqual(2) // At most 2 due to timing
    })
  })

  // ─────────────────────────────────────────────────────────
  // Window Destroyed Check
  // ─────────────────────────────────────────────────────────
  describe('Window state checks', () => {
    it('should NOT send event if window is destroyed', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      // Mark window as destroyed
      win.isDestroyed.mockReturnValue(true)

      await fs.promises.writeFile(path.join(tempP1, 'src/app.ts'), 'destroyed test')
      await waitForDebounce(2500)

      expect(win.webContents.send).not.toHaveBeenCalled()
    })
  })

  // ─────────────────────────────────────────────────────────
  // Ignore Patterns
  // ─────────────────────────────────────────────────────────
  describe('Ignore patterns', () => {
    it('should still notify for non-ignored directories when custom ignore is set', async () => {
      const win = createMockWindow()

      // Start watching with dist/** ignored — src/ should still trigger
      await startWatching(tempP1, tempP2, ['dist/**'], win)
      await waitForDebounce(500)

      // Write to non-ignored directory (src/)
      await fs.promises.writeFile(path.join(tempP1, 'src/app.ts'), 'changes here')
      await waitForDebounce(2500)

      expect(win.webContents.send).toHaveBeenCalledWith(IPC.FILES_CHANGED)
    })
  })

  // ─────────────────────────────────────────────────────────
  // No Notification After Stop
  // ─────────────────────────────────────────────────────────
  describe('After stopWatching', () => {
    it('should NOT notify after watcher is stopped', async () => {
      const win = createMockWindow()
      await startWatching(tempP1, tempP2, [], win)
      await waitForDebounce(500)

      await stopWatching()

      // Modify file after stop
      await fs.promises.writeFile(path.join(tempP1, 'src/app.ts'), 'after stop')
      await waitForDebounce(2500)

      expect(win.webContents.send).not.toHaveBeenCalled()
    })
  })
})
