import { useLayoutEffect, useRef, useState } from 'react';

const revealedAssetKeys = new Set();

function isLoaded(node) {
  if (node instanceof HTMLImageElement) return node.complete && node.naturalWidth > 0;
  if (node instanceof HTMLVideoElement) return node.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  return true;
}

/**
 * Keeps a multilayer scene hidden until its already-rendered image/video layers
 * are available. This avoids the visible "one PNG at a time" build-up.
 */
export default function AssetStage({ assetKey, className = '', blocking = true, children }) {
  const rootRef = useRef(null);
  const [ready, setReady] = useState(() => revealedAssetKeys.has(assetKey));

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (!revealedAssetKeys.has(assetKey)) setReady(false);
    const assets = [...root.querySelectorAll('img, video')];
    if (!assets.length) {
      revealedAssetKeys.add(assetKey);
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    let pending = 0;
    const removers = [];
    const reveal = () => {
      if (!cancelled && pending === 0) {
        revealedAssetKeys.add(assetKey);
        setReady(true);
      }
    };

    assets.forEach((asset) => {
      const image = asset instanceof HTMLImageElement;
      if (image) {
        asset.decoding = 'async';
        asset.loading = 'eager';
        asset.fetchPriority = 'auto';
        if (asset.complete && !asset.naturalWidth) { const retry = new URL(asset.src); retry.searchParams.set('asset_retry','1'); asset.src=retry.href; }
      } else if (asset instanceof HTMLVideoElement) {
        asset.preload = 'auto';
      }
      if (isLoaded(asset)) {
        if (image && typeof asset.decode === 'function') {
          pending += 1;
          asset.decode().catch(() => {}).finally(() => {
            pending = Math.max(0, pending - 1);
            reveal();
          });
        }
        return;
      }
      pending += 1;
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        asset.removeEventListener('load', complete);
        asset.removeEventListener('error', complete);
        asset.removeEventListener('loadeddata', complete);
        pending = Math.max(0, pending - 1);
        reveal();
      };
      const complete = () => {
        if (image && typeof asset.decode === 'function') asset.decode().catch(() => {}).finally(settle);
        else settle();
      };
      asset.addEventListener('load', complete, { once: true });
      asset.addEventListener('error', settle, { once: true });
      asset.addEventListener('loadeddata', complete, { once: true });
      removers.push(() => {
        asset.removeEventListener('load', complete);
        asset.removeEventListener('error', settle);
        asset.removeEventListener('loadeddata', complete);
      });
    });

    reveal();
    // Release the loading cover if a slow decorative asset stalls.
    const timeoutId = window.setTimeout(() => {
      pending = 0;
      reveal();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      removers.forEach((remove) => remove());
    };
  }, [assetKey]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className={`h-full transition-opacity duration-200 ease-out ${ready || !blocking ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
      {!ready ? (
        <div className={blocking ? 'absolute inset-0 z-30 flex items-center justify-center bg-[#070a06]' : 'pointer-events-none absolute right-3 top-3 z-30 rounded-full bg-black/50 p-2'} aria-label="Loading scene">
          <span className="h-8 w-8 rounded-full border-2 border-[#83b83d]/25 border-t-[#a7d860] animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
