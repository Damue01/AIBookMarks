import React, { useState, useEffect, useRef } from 'react';
import type { ClassifyToastPayload, ClassifyResultPayload } from '@/shared/types';

interface ClassifyToastProps {
  initial: ClassifyToastPayload;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 10_000;
const LOADING_TIMEOUT_MS = 30_000;

export default function ClassifyToast({ initial, onDismiss }: ClassifyToastProps) {
  const [result, setResult] = useState<ClassifyResultPayload | null>(null);
  const [exiting, setExiting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { bookmarkId, title, url, strings } = initial;

  // Extract domain for display
  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { domain = url; }

  // Favicon
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  // Listen for CLASSIFY_RESULT and DISMISS_CLASSIFY from background
  useEffect(() => {
    const handler = (message: any) => {
      if (message.payload?.bookmarkId !== bookmarkId) return;
      if (message.type === 'CLASSIFY_RESULT') {
        setResult(message.payload as ClassifyResultPayload);
      } else if (message.type === 'DISMISS_CLASSIFY') {
        // Show error briefly then dismiss
        if (message.payload?.error) {
          setErrorMsg(message.payload.error);
          setTimeout(() => dismiss(), 3000);
        } else {
          dismiss();
        }
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [bookmarkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety timeout: if no result arrives within 30s, auto-dismiss
  useEffect(() => {
    if (!result && !errorMsg) {
      const t = setTimeout(() => dismiss(), LOADING_TIMEOUT_MS);
      return () => clearTimeout(t);
    }
  }, [result, errorMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start auto-dismiss timer once result arrives
  useEffect(() => {
    if (result) {
      timerRef.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 260);
  };

  const handleAccept = () => {
    if (!result) return;
    setAccepted(true);
    chrome.runtime.sendMessage({
      type: 'ACCEPT_CLASSIFY',
      payload: { bookmarkId, suggestedFolder: result.suggestedFolder },
    });
    // Auto-dismiss after brief delay
    setTimeout(dismiss, 1200);
  };

  const handleIgnore = () => {
    dismiss();
  };

  return (
    <div
      className={`${exiting ? 'aibm-toast-exit' : 'aibm-toast-enter'}`}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 2147483546,
        width: '340px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px 8px',
        }}>
          {/* Extension icon */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'hsl(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </div>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
            letterSpacing: '-0.01em',
          }}>
            AIBookMarks
          </span>
          {/* Close button */}
          <button
            onClick={handleIgnore}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'hsl(var(--accent))'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Bookmark info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 14px 10px',
        }}>
          <img
            src={faviconUrl}
            alt=""
            width={24}
            height={24}
            style={{
              borderRadius: '6px',
              flexShrink: 0,
              background: 'hsl(var(--muted))',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'hsl(var(--foreground))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.3',
            }}>
              {title || domain}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'hsl(var(--muted-foreground))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {domain}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'hsl(var(--border))' }} />

        {/* Content: loading, error, or result */}
        {errorMsg ? (
          /* Error state */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
            </svg>
            <span style={{
              fontSize: '12px',
              color: 'hsl(var(--destructive))',
            }}>
              {errorMsg}
            </span>
          </div>
        ) : !result ? (
          /* Loading state */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
          }}>
            <svg className="aibm-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span style={{
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))',
            }}>
              {strings.analyzing}
            </span>
          </div>
        ) : accepted ? (
          /* Accepted state */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(142, 71%, 45%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span style={{ fontSize: '12px', color: 'hsl(142, 71%, 45%)', fontWeight: 500 }}>
              {strings.moved}
            </span>
          </div>
        ) : (
          /* Result state */
          <div style={{ padding: '10px 14px 12px' }}>
            {/* Suggestion */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 500,
                background: result.source === 'rule' ? 'hsl(var(--accent))' : 'hsl(221.2, 83.2%, 53.3%, 0.1)',
                color: result.source === 'rule' ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary))',
              }}>
                {result.source === 'rule' ? strings.ruleMatch : strings.aiSuggestion}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'hsl(var(--muted))',
              marginBottom: '10px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
              </svg>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'hsl(var(--foreground))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {result.suggestedFolder}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAccept}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                {strings.accept}
              </button>
              <button
                onClick={handleIgnore}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'hsl(var(--accent))'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'hsl(var(--background))'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
                {strings.ignore}
              </button>
            </div>
          </div>
        )}

        {/* Auto-dismiss progress bar (only when result is showing) */}
        {result && !accepted && (
          <div style={{
            height: '2px',
            background: 'hsl(var(--muted))',
            overflow: 'hidden',
          }}>
            <div
              className="aibm-progress-bar"
              style={{
                height: '100%',
                background: 'hsl(var(--primary))',
                animationDuration: `${AUTO_DISMISS_MS}ms`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
