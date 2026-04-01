import type { SyncConfig } from '../../shared/types'

export const DEFAULT_CONFIG: SyncConfig = {
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
  backup: { enabled: true, directory: 'backup' },
  selectedPaths: []
}

export type ViewMode = 'flat' | 'tree'
export type SidebarTab = 'projects' | 'config' | 'history'
