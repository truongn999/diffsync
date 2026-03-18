import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { ElectronAPI, SyncConfig, SyncParams } from '../shared/types'

const api: ElectronAPI = {
  selectFolder: () => ipcRenderer.invoke(IPC.SELECT_FOLDER),

  scanProject: (rootPath: string, config: SyncConfig) =>
    ipcRenderer.invoke(IPC.SCAN_PROJECT, rootPath, config),

  compareProjects: (p1Root: string, p2Root: string, config: SyncConfig) =>
    ipcRenderer.invoke(IPC.COMPARE_PROJECTS, p1Root, p2Root, config),

  getDiff: (p1Root: string, p2Root: string, relativePath: string) =>
    ipcRenderer.invoke(IPC.GET_DIFF, p1Root, p2Root, relativePath),

  syncFiles: (params: SyncParams, config: SyncConfig) =>
    ipcRenderer.invoke(IPC.SYNC_FILES, params, config),

  loadConfig: (p1Root: string, p2Root: string) =>
    ipcRenderer.invoke(IPC.LOAD_CONFIG, p1Root, p2Root),

  saveConfig: (p1Root: string, p2Root: string, config: SyncConfig) =>
    ipcRenderer.invoke(IPC.SAVE_CONFIG, p1Root, p2Root, config),

  getHistory: () => ipcRenderer.invoke(IPC.GET_HISTORY),

  undoSync: (entryId: number) => ipcRenderer.invoke(IPC.UNDO_SYNC, entryId),

  getRecentProjects: () => ipcRenderer.invoke(IPC.GET_RECENT_PROJECTS),

  addRecentProject: (p1Path: string, p2Path: string) =>
    ipcRenderer.invoke(IPC.ADD_RECENT_PROJECT, p1Path, p2Path),

  removeRecentProject: (id: number) =>
    ipcRenderer.invoke(IPC.REMOVE_RECENT_PROJECT, id),

  getFileContent: (rootPath: string, relativePath: string) =>
    ipcRenderer.invoke(IPC.GET_FILE_CONTENT, rootPath, relativePath),

  startWatching: (p1Path: string, p2Path: string, ignore: string[]) =>
    ipcRenderer.invoke(IPC.START_WATCHING, p1Path, p2Path, ignore),

  stopWatching: () =>
    ipcRenderer.invoke(IPC.STOP_WATCHING),

  onFilesChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('files-changed', handler)
    return () => { ipcRenderer.removeListener('files-changed', handler) }
  },

  exportReport: (p1Path: string, p2Path: string, compareResult: any) =>
    ipcRenderer.invoke(IPC.EXPORT_REPORT, p1Path, p2Path, compareResult)
}

contextBridge.exposeInMainWorld('electronAPI', api)
