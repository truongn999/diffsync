import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { SyncHistoryEntry } from '../../shared/types'

const HISTORY_FILENAME = 'sync-history.json'

function getHistoryPath(): string {
  return path.join(app.getPath('userData'), HISTORY_FILENAME)
}

/**
 * Loads sync history from app data directory.
 */
export async function loadHistory(): Promise<SyncHistoryEntry[]> {
  try {
    const content = await fs.promises.readFile(getHistoryPath(), 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

/**
 * Saves sync history to app data directory.
 */
async function saveHistory(history: SyncHistoryEntry[]): Promise<void> {
  const historyPath = getHistoryPath()
  await fs.promises.mkdir(path.dirname(historyPath), { recursive: true })
  await fs.promises.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8')
}

/**
 * Adds a new entry to the sync history.
 */
export async function addHistoryEntry(entry: Omit<SyncHistoryEntry, 'id'>): Promise<SyncHistoryEntry> {
  const history = await loadHistory()
  const newEntry: SyncHistoryEntry = {
    ...entry,
    id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1
  }
  history.unshift(newEntry) // newest first

  // Keep max 100 entries
  if (history.length > 100) {
    history.splice(100)
  }

  await saveHistory(history)
  return newEntry
}

/**
 * Removes a history entry by ID.
 */
export async function removeHistoryEntry(entryId: number): Promise<SyncHistoryEntry | null> {
  const history = await loadHistory()
  const index = history.findIndex(h => h.id === entryId)
  if (index === -1) return null

  const [removed] = history.splice(index, 1)
  await saveHistory(history)
  return removed
}
