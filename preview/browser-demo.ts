// Only imported by the standalone preview. Never bundled into the extension.
import type { BookmarkNode } from '@/shared/types';

// Keep provider connection tests and model-list requests inside the installed extension.
const previewFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init) => {
  const target = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (target.origin !== location.origin) {
    return Promise.reject(new Error('示例预览不连接 AI 服务。请安装扩展后测试连接。'));
  }
  return previewFetch(input, init);
};

const bookmark = (id: string, parentId: string, title: string, url: string): BookmarkNode =>
  ({ id, parentId, title, url, dateAdded: 1750000000000 + Number(id) * 1000 });
const initialTree: BookmarkNode[] = [{ id: '0', title: '', children: [
  { id: '1', parentId: '0', title: '书签栏', children: [
    { id: '10', parentId: '1', title: '开发工具', children: [
      bookmark('101', '10', 'React', 'https://react.dev/'),
      bookmark('102', '10', 'TypeScript', 'https://www.typescriptlang.org/'),
      bookmark('103', '10', 'Vite', 'https://vite.dev/'),
      bookmark('104', '10', 'Can I use', 'https://caniuse.com/'),
    ] },
    { id: '20', parentId: '1', title: '设计灵感', children: [
      bookmark('201', '20', 'Dribbble', 'https://dribbble.com/'),
      bookmark('202', '20', 'Are.na', 'https://www.are.na/'),
    ] },
    bookmark('301', '1', 'GitHub', 'https://github.com/'),
    bookmark('302', '1', 'Figma', 'https://www.figma.com/'),
    bookmark('303', '1', 'MDN Web Docs', 'https://developer.mozilla.org/'),
    bookmark('304', '1', 'Notion', 'https://www.notion.so/'),
  ] },
  { id: '2', parentId: '0', title: '其他书签', children: [] },
] }];

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
let tree = read('aibm-demo-tree', initialTree);
let storage: Record<string, unknown> = read('aibm-demo-storage', { aibm_browse_folder: '1' });
type Listener = (...args: unknown[]) => void;
function event() {
  const listeners = new Set<Listener>();
  return { addListener: (listener: Listener) => listeners.add(listener), removeListener: (listener: Listener) => listeners.delete(listener),
    emit: (...args: unknown[]) => listeners.forEach((listener) => listener(...args)) };
}
const events = { onCreated: event(), onRemoved: event(), onMoved: event(), onChanged: event() };
function find(id: string, nodes = tree): BookmarkNode {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) { try { return find(id, node.children); } catch { /* keep searching */ } }
  }
  throw new Error(`Bookmark ${id} not found`);
}
function persistTree() { localStorage.setItem('aibm-demo-tree', JSON.stringify(tree)); }
function persistStorage() { localStorage.setItem('aibm-demo-storage', JSON.stringify(storage)); }
function remove(id: string) {
  const node = find(id);
  const parent = find(node.parentId!);
  parent.children = parent.children!.filter((child) => child.id !== id);
  return node;
}

Object.defineProperty(globalThis, 'chrome', { configurable: true, value: {
  bookmarks: {
    ...events,
    getTree: async () => structuredClone(tree),
    create: async (details: { parentId?: string; title?: string; url?: string }) => {
      const parent = find(details.parentId ?? '1');
      const node: BookmarkNode = { ...details, parentId: parent.id, title: details.title ?? '',
        id: String(Date.now()), dateAdded: Date.now(), ...(details.url ? {} : { children: [] }) };
      parent.children!.push(node); persistTree(); events.onCreated.emit(node.id, node); return structuredClone(node);
    },
    update: async (id: string, details: Partial<BookmarkNode>) => {
      Object.assign(find(id), details); persistTree(); events.onChanged.emit(id, details); return structuredClone(find(id));
    },
    removeTree: async (id: string) => { remove(id); persistTree(); events.onRemoved.emit(id); },
    remove: async (id: string) => { remove(id); persistTree(); events.onRemoved.emit(id); },
    move: async (id: string, destination: { parentId?: string; index?: number }) => {
      const node = remove(id); const parent = find(destination.parentId ?? node.parentId!);
      node.parentId = parent.id; parent.children!.splice(destination.index ?? parent.children!.length, 0, node);
      persistTree(); events.onMoved.emit(id, destination); return structuredClone(node);
    },
  },
  storage: { local: {
    get: async (keys: string | string[] | null) => {
      if (!keys) return structuredClone(storage);
      return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, structuredClone(storage[key])]));
    },
    set: async (items: Record<string, unknown>) => { Object.assign(storage, items); persistStorage(); },
    remove: async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete storage[key]; persistStorage(); },
  } },
  runtime: {
    onMessage: event(),
    getURL: (path: string) => new URL(path, location.origin).href,
    openOptionsPage: async () => { location.href = '/?options'; },
    sendMessage: async (message: { type: string }) => message.type === 'GET_ANALYSIS_STATE'
      ? { success: true, data: { progress: { phase: 'idle', processed: 0, total: 0, currentBatch: 0, totalBatches: 0, currentItems: [] }, suggestions: [] } }
      : { success: false, error: '当前为示例预览。请安装扩展并配置 AI 服务后使用智能整理。' },
  },
  tabs: { create: async ({ url }: { url: string }) => { window.open(url, '_blank', 'noopener,noreferrer'); } },
} });
