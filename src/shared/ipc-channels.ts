// IPC Channel constants — single source of truth for channel names
// Used by both main process handlers and preload bridge

export const IPC = {
  SELECT_FOLDER: 'sync:select-folder',
  SCAN_PROJECT: 'sync:scan-project',
  COMPARE_PROJECTS: 'sync:compare-projects',
  GET_DIFF: 'sync:get-diff',
  SYNC_FILES: 'sync:sync-files',
  LOAD_CONFIG: 'sync:load-config',
  SAVE_CONFIG: 'sync:save-config',
  GET_HISTORY: 'sync:get-history',
  UNDO_SYNC: 'sync:undo-sync',

  // Events (main → renderer)
  SYNC_PROGRESS: 'sync:progress',
} as const
