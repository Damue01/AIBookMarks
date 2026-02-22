import Dexie, { type Table } from 'dexie';
import type { BackupEntry, BookmarkNode } from '@/shared/types';
import { DB_NAME, DB_VERSION, BACKUP_TABLE, MAX_BACKUPS_DEFAULT } from '@/shared/constants';

class AIBookMarksDB extends Dexie {
  backups!: Table<BackupEntry, number>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      backups: '++id, timestamp, trigger',
    });
  }
}

const db = new AIBookMarksDB();

export const BackupService = {
  /** Create a backup snapshot of the bookmark tree */
  async create(
    snapshot: BookmarkNode[],
    trigger: BackupEntry['trigger'] = 'manual',
    label?: string,
  ): Promise<number> {
    const bookmarkCount = countLeaves(snapshot);
    const folderCount = countFolders(snapshot);
    const id = await db.backups.add({
      timestamp: Date.now(),
      trigger,
      bookmarkCount,
      folderCount,
      snapshot,
      label,
    });
    await this.pruneOld(MAX_BACKUPS_DEFAULT);
    return id as number;
  },

  /** List all backups, newest first */
  async list(): Promise<BackupEntry[]> {
    return db.backups.orderBy('timestamp').reverse().toArray();
  },

  /** Get a single backup by id */
  async get(id: number): Promise<BackupEntry | undefined> {
    return db.backups.get(id);
  },

  /** Delete a specific backup */
  async delete(id: number): Promise<void> {
    await db.backups.delete(id);
  },

  /** Delete all backups */
  async clear(): Promise<void> {
    await db.backups.clear();
  },

  /** Keep only the N most recent backups */
  async pruneOld(maxCount: number): Promise<void> {
    const all = await db.backups.orderBy('timestamp').reverse().toArray();
    if (all.length > maxCount) {
      const toDelete = all.slice(maxCount).map((b) => b.id!);
      await db.backups.bulkDelete(toDelete);
    }
  },

  /** Export a backup as a JSON blob for download */
  exportAsJSON(entry: BackupEntry): string {
    return JSON.stringify(entry.snapshot, null, 2);
  },

  /** Import from a JSON string — returns the parsed tree */
  importFromJSON(json: string): BookmarkNode[] {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Invalid backup format');
    return parsed as BookmarkNode[];
  },
};

function countLeaves(nodes: BookmarkNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.url) n++;
    else if (node.children) n += countLeaves(node.children);
  }
  return n;
}

function countFolders(nodes: BookmarkNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (!node.url) {
      n++;
      if (node.children) n += countFolders(node.children);
    }
  }
  return n;
}
