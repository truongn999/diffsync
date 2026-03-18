import * as fs from 'fs'
import * as path from 'path'
import type { SyncConfig } from '../../shared/types'
import { getProjectDataDir } from './dataDir'

const DEFAULT_CONFIG: SyncConfig = {
  groups: [],
  ignore: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'out/**',
    'release/**',
    '.next/**',
    '.nuxt/**',
    '.env*',
    '*.log',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ],
  extensions: [],
  backup: {
    enabled: true,
    directory: 'backup'
  },
  selectedPaths: []
}

const CONFIG_FILENAME = 'config.json'

/**
 * Loads config from AppData for a project pair.
 * Path: %APPDATA%/diffsync/projects/<hash>/config.json
 */
export async function loadConfig(p1Root: string, p2Root: string): Promise<SyncConfig> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  const configPath = path.join(dataDir, CONFIG_FILENAME)

  try {
    const content = await fs.promises.readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      backup: { ...DEFAULT_CONFIG.backup, ...parsed.backup }
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

/**
 * Saves config to AppData for a project pair.
 */
export async function saveConfig(p1Root: string, p2Root: string, config: SyncConfig): Promise<void> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  await fs.promises.mkdir(dataDir, { recursive: true })
  const configPath = path.join(dataDir, CONFIG_FILENAME)
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Returns the default config.
 */
export function getDefaultConfig(): SyncConfig {
  return { ...DEFAULT_CONFIG }
}
