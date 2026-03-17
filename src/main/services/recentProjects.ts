import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { RecentProject } from '../../shared/types'

const FILENAME = 'recent-projects.json'
const MAX_ENTRIES = 10

function getFilePath(): string {
  return path.join(app.getPath('userData'), FILENAME)
}

export async function loadRecentProjects(): Promise<RecentProject[]> {
  try {
    const content = await fs.promises.readFile(getFilePath(), 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function addRecentProject(p1Path: string, p2Path: string): Promise<RecentProject[]> {
  const projects = await loadRecentProjects()

  // Derive name from folder basename
  const p1Name = path.basename(p1Path)
  const p2Name = path.basename(p2Path)
  const name = p1Name === p2Name ? p1Name : `${p1Name} ↔ ${p2Name}`

  // Remove duplicate if exists
  const filtered = projects.filter(p => !(p.p1Path === p1Path && p.p2Path === p2Path))

  // Prepend new entry
  const newEntry: RecentProject = {
    id: Date.now(),
    p1Path,
    p2Path,
    name,
    lastUsed: new Date().toISOString()
  }
  filtered.unshift(newEntry)

  // Keep max entries
  const trimmed = filtered.slice(0, MAX_ENTRIES)
  await saveRecentProjects(trimmed)
  return trimmed
}

export async function removeRecentProject(id: number): Promise<RecentProject[]> {
  const projects = await loadRecentProjects()
  const filtered = projects.filter(p => p.id !== id)
  await saveRecentProjects(filtered)
  return filtered
}

async function saveRecentProjects(projects: RecentProject[]): Promise<void> {
  const filePath = getFilePath()
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, JSON.stringify(projects, null, 2), 'utf-8')
}
