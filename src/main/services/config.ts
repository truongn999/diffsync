import * as fs from 'fs'
import * as path from 'path'
import type { SyncConfig } from '../../shared/types'

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
    '.sync-backup/**',
    '.sync-manifest.json',
    'sync.config.json',
    '.env*',
    '*.log',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ],
  extensions: [],
  backup: {
    enabled: true,
    directory: '.sync-backup'
  },
  selectedPaths: []
}

const CONFIG_FILENAME = 'sync.config.json'

/**
 * Loads sync.config.json from project root.
 * If not found, returns default config.
 */
export async function loadConfig(projectRoot: string): Promise<SyncConfig> {
  const configPath = path.join(projectRoot, CONFIG_FILENAME)

  try {
    const content = await fs.promises.readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)

    // Merge with defaults to ensure all fields exist
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
 * Saves sync.config.json to project root.
 */
export async function saveConfig(projectRoot: string, config: SyncConfig): Promise<void> {
  const configPath = path.join(projectRoot, CONFIG_FILENAME)
  const content = JSON.stringify(config, null, 2)
  await fs.promises.writeFile(configPath, content, 'utf-8')
}

/**
 * Returns the default config.
 */
export function getDefaultConfig(): SyncConfig {
  return { ...DEFAULT_CONFIG }
}
