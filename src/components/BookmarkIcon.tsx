import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { getFaviconSources, isDefaultCachedFavicon } from '@/shared/favicon';
import { cn, extractDomain } from '@/shared/utils';

interface Props { url: string; title?: string; className?: string }

export default function BookmarkIcon(props: Props) {
  // A changed URL starts a fresh loading attempt, even when React reuses the row.
  return <IconImage key={props.url} {...props} />;
}

function IconImage({ url, title, className }: Props) {
  const sources = useMemo(() => getFaviconSources(url), [url]);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const loadAttempt = useRef(0);
  const source = sources[attempt];
  const letter = Array.from(extractDomain(url) || title || '')[0]?.toUpperCase();
  const advance = () => { loadAttempt.current++; setLoaded(false); setAttempt((value) => value + 1); };

  useEffect(() => {
    if (!source || loaded) return;
    const timeout = window.setTimeout(() => {
      loadAttempt.current++;
      setLoaded(false);
      setAttempt((value) => value + 1);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [source, loaded]);

  return (
    <span aria-hidden="true" className={cn('relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-xs font-semibold text-muted-foreground', className)}>
      {!loaded && (letter ? <span>{letter}</span> : <Globe className="h-4 w-4" />)}
      {source && <img key={source} src={source} alt="" referrerPolicy="no-referrer" draggable={false}
        className={cn('absolute h-5 w-5 object-contain', !loaded && 'opacity-0')}
        onLoad={async () => {
          const currentAttempt = loadAttempt.current;
          const generic = await isDefaultCachedFavicon(source);
          if (loadAttempt.current !== currentAttempt) return;
          if (generic) advance();
          else setLoaded(true);
        }} onError={advance} />}
    </span>
  );
}
