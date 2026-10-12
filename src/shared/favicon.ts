/** Prefer the browser's local favicon cache; never send bookmark URLs to an aggregator. */
export function getFaviconSources(url: string): string[] {
  try {
    const page = new URL(url);
    if (!['http:', 'https:'].includes(page.protocol)) return [];

    const sources: string[] = [];
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      const native = new URL(chrome.runtime.getURL('/_favicon/'));
      // Firefox doesn't support Chromium's favicon endpoint.
      if (native.protocol === 'chrome-extension:') {
        native.searchParams.set('pageUrl', page.href);
        native.searchParams.set('size', '32');
        sources.push(native.href);
      }
    }
    sources.push(new URL('/favicon.ico', page.origin).href);
    return sources;
  } catch {
    return [];
  }
}

let defaultIcon: Promise<Uint8Array | null> | undefined;

/** Chromium returns a valid generic image when a page has no cached favicon. */
export async function isDefaultCachedFavicon(source: string): Promise<boolean> {
  try {
    const native = new URL(source);
    if (native.protocol !== 'chrome-extension:' || native.pathname !== '/_favicon/') return false;
    const read = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Favicon unavailable');
      return new Uint8Array(await response.arrayBuffer());
    };
    if (!defaultIcon) {
      const fallback = new URL(native);
      // This is a local cache lookup; the reserved .invalid domain is never contacted.
      fallback.searchParams.set('pageUrl', 'https://favicon-fallback.invalid/');
      defaultIcon = read(fallback.href).catch(() => null);
    }
    const [candidate, generic] = await Promise.all([read(source), defaultIcon]);
    return !!generic && candidate.length === generic.length && candidate.every((byte, index) => byte === generic[index]);
  } catch {
    return false;
  }
}
