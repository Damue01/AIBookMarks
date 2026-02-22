import type { BookmarkNode, SortField } from './types';
import { extractDomain } from './utils';

/** Sort an array of bookmark nodes (folders or bookmarks) by the given field */
export function sortBookmarkNodes(nodes: BookmarkNode[], sortField: SortField): BookmarkNode[] {
  if (sortField === 'default') return nodes;
  return [...nodes].sort((a, b) => {
    switch (sortField) {
      case 'name-asc':
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'name-desc':
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      case 'date-newest':
        return (b.dateAdded ?? 0) - (a.dateAdded ?? 0);
      case 'date-oldest':
        return (a.dateAdded ?? 0) - (b.dateAdded ?? 0);
      case 'domain': {
        const dA = a.url ? extractDomain(a.url) : a.title;
        const dB = b.url ? extractDomain(b.url) : b.title;
        return dA.localeCompare(dB, undefined, { sensitivity: 'base' });
      }
      default:
        return 0;
    }
  });
}

/**
 * Apply a sort order permanently to Chrome bookmark storage.
 * Re-indexes all items in the array under the given parentId.
 */
export async function applyPermanentSort(
  nodes: BookmarkNode[],
  parentId: string,
  sortField: SortField,
): Promise<void> {
  const sorted = sortBookmarkNodes(nodes, sortField);
  for (let i = 0; i < sorted.length; i++) {
    await chrome.bookmarks.move(sorted[i].id, { parentId, index: i });
  }
}
