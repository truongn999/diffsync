import type { CompareItem } from '../../../shared/types'

export type FolderSelectionState = 'checked' | 'indeterminate' | 'unchecked'

/**
 * Determines whether a folder's checkbox should be checked, unchecked, or indeterminate.
 */
export function getFolderSelectionState(
  folderFiles: string[],
  selectedFiles: Set<string>
): FolderSelectionState {
  if (!folderFiles || folderFiles.length === 0) {
    return 'unchecked'
  }

  let selectedCount = 0
  for (const filePath of folderFiles) {
    if (selectedFiles.has(filePath)) {
      selectedCount++
    }
  }

  if (selectedCount === folderFiles.length) {
    return 'checked'
  }
  if (selectedCount > 0) {
    return 'indeterminate'
  }
  return 'unchecked'
}

/**
 * Recursively collects all relativePaths of files in a tree node and its descendants.
 */
export function getAllFilesInSubtree(node: any): string[] {
  const result: string[] = []

  if (node.__files__) {
    for (const file of node.__files__ as CompareItem[]) {
      result.push(file.relativePath)
    }
  }

  const subFolders = Object.keys(node).filter(k => k !== '__files__')
  for (const folder of subFolders) {
    result.push(...getAllFilesInSubtree(node[folder]))
  }

  return result
}
