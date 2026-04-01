import { registerFileHandlers } from './handlers/file'
import { registerSyncHandlers } from './handlers/sync'
import { registerConfigHandlers } from './handlers/config'
import { registerAppHandlers } from './handlers/app'

export function registerIpcHandlers(): void {
  registerFileHandlers()
  registerSyncHandlers()
  registerConfigHandlers()
  registerAppHandlers()
}
