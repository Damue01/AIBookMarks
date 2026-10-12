import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../src/shared/favicon.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function module(chrome, fetch) {
  const exports = {};
  runInNewContext(code, { exports, URL, chrome, fetch });
  return exports;
}
function sources(chrome) {
  const exports = module(chrome);
  return (url) => Array.from(exports.getFaviconSources(url));
}

test('Chromium uses the local cache before contacting the bookmark origin', () => {
  const get = sources({ runtime: { id: 'test-extension', getURL: (path) => `chrome-extension://test-extension${path}` } });
  const url = 'https://www.example.com/path?q=a&other=中文#section';
  const result = get(url);
  const native = new URL(result[0]);
  assert.equal(native.protocol, 'chrome-extension:');
  assert.equal(native.pathname, '/_favicon/');
  assert.equal(native.searchParams.get('pageUrl'), new URL(url).href);
  assert.equal(native.searchParams.get('size'), '32');
  assert.equal(result[1], 'https://www.example.com/favicon.ico');
});

test('a successful generic cache image triggers fallback and shares the default lookup', async () => {
  const requests = [];
  const { isDefaultCachedFavicon } = module(undefined, async (url) => {
    requests.push(url);
    const isBrand = new URL(url).searchParams.get('pageUrl') === 'https://branded.example/';
    return { ok: true, arrayBuffer: async () => Uint8Array.from(isBrand ? [1, 3, 9] : [1, 2, 3]).buffer };
  });
  const native = 'chrome-extension://test/_favicon/?size=32&pageUrl=';
  assert.equal(await isDefaultCachedFavicon(native + encodeURIComponent('https://empty.example/')), true);
  assert.equal(await isDefaultCachedFavicon(native + encodeURIComponent('https://branded.example/')), false);
  assert.equal(requests.filter(url => url.includes('favicon-fallback.invalid')).length, 1);
  const count = requests.length;
  assert.equal(await isDefaultCachedFavicon('https://example.com/favicon.ico'), false);
  assert.equal(requests.length, count);
});

test('a failed cache comparison preserves an otherwise loaded icon', async () => {
  const { isDefaultCachedFavicon } = module(undefined, async () => { throw new Error('unavailable'); });
  assert.equal(await isDefaultCachedFavicon('chrome-extension://test/_favicon/?size=32'), false);
});

test('Firefox uses the website origin, without an unsupported Chromium URL', () => {
  const get = sources({ runtime: { id: 'test', getURL: (path) => `moz-extension://test${path}` } });
  assert.deepEqual(get('https://example.com/private/page'), ['https://example.com/favicon.ico']);
});

test('preview and absent extension APIs still work', () => {
  assert.deepEqual(sources(undefined)('http://localhost:3000/docs'), ['http://localhost:3000/favicon.ico']);
  assert.deepEqual(sources({})('https://example.com'), ['https://example.com/favicon.ico']);
});

test('invalid URLs and non-web bookmarks never trigger remote requests', () => {
  const get = sources(undefined);
  for (const url of ['', 'invalid', 'javascript:alert(1)', 'file:///private/page', 'chrome://settings', 'about:blank', 'data:text/html,hello']) {
    assert.deepEqual(get(url), []);
  }
});

test('origin fallback preserves www and ports and excludes credentials and page paths', () => {
  assert.deepEqual(sources(undefined)('https://user:password@www.example.com:8443/private?token=secret'),
    ['https://www.example.com:8443/favicon.ico']);
});
