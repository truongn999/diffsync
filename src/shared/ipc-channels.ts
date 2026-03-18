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

  GET_RECENT_PROJECTS: 'sync:get-recent-projects',
  ADD_RECENT_PROJECT: 'sync:add-recent-project',
  REMOVE_RECENT_PROJECT: 'sync:remove-recent-project',
  GET_FILE_CONTENT: 'sync:get-file-content',
  START_WATCHING: 'sync:start-watching',
  STOP_WATCHING: 'sync:stop-watching',
  EXPORT_REPORT: 'sync:export-report',
  LOAD_THEME: 'sync:load-theme',
  SAVE_THEME: 'sync:save-theme',

  // Events (main → renderer)
  SYNC_PROGRESS: 'sync:progress',
} as const
