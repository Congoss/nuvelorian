import { useEffect, useMemo, useState } from 'react';
import i18n from '@/i18n';

function preloadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    const done = () => {
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(src);
    };
    const timeout = window.setTimeout(done, 8000);
    image.onload = done;
    image.onerror = done;
    image.decoding = 'async';
    image.loading = 'eager';
    image.fetchPriority = 'high';
    image.src = src;

    if (image.complete) {
      queueMicrotask(done);
    }
  });
}

export function useStartupLoadingManager({ loading, initError, bootstrapReady, bootProgress, criticalAssetPaths = [], criticalAssetUrls = [] }) {
  const [assetProgress, setAssetProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [i18nReady, setI18nReady] = useState(Boolean(i18n.isInitialized));
  const [shellReady, setShellReady] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);

  const resolvedAssetUrls = useMemo(
    () => [...new Set((criticalAssetUrls.length ? criticalAssetUrls : criticalAssetPaths.map((path) => new URL(path, import.meta.url).href)))],
    [criticalAssetPaths, criticalAssetUrls],
  );

  useEffect(() => {
    let cancelled = false;
    setAssetProgress(0);
    setAssetsReady(false);

    const total = resolvedAssetUrls.length;
    if (!total) {
      setAssetProgress(1);
      setAssetsReady(true);
      return () => {};
    }

    let loaded = 0;
    Promise.all(
      resolvedAssetUrls.map((src) =>
        preloadImage(src).finally(() => {
          loaded += 1;
          if (!cancelled) {
            setAssetProgress(loaded / total);
            if (loaded >= total) {
              setAssetsReady(true);
            }
          }
        })
      )
    ).then(() => {
      if (!cancelled) {
        setAssetProgress(1);
        setAssetsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedAssetUrls]);

  useEffect(() => {
    let cancelled = false;
    setFontsReady(false);

    if (typeof document === 'undefined' || !document.fonts?.ready) {
      setFontsReady(true);
      return () => {};
    }

    document.fonts.ready
      .then(() => {
        if (!cancelled) setFontsReady(true);
      })
      .catch(() => {
        if (!cancelled) setFontsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setI18nReady(true);
    };

    if (i18n.isInitialized) {
      markReady();
      return () => {};
    }

    i18n.on('initialized', markReady);
    i18n.on('loaded', markReady);
    return () => {
      cancelled = true;
      i18n.off('initialized', markReady);
      i18n.off('loaded', markReady);
    };
  }, []);

  const shellBootstrapReady = Boolean(bootstrapReady && !initError);
  const startupReady = shellBootstrapReady && assetsReady && fontsReady && i18nReady;

  useEffect(() => {
    if (!startupReady) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setShellReady(true);
      setStartupComplete(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [startupReady]);

  const loadingProgress = useMemo(() => {
    if (initError) return 0;
    const bootstrapWeight = Math.max(0, Math.min(1, bootProgress)) * 55;
    const assetsWeight = Math.max(0, Math.min(1, assetProgress)) * 30;
    const localizationWeight = i18nReady ? 5 : 0;
    const fontsWeight = fontsReady ? 5 : 0;
    const shellWeight = shellReady ? 5 : 0;
    return Math.min(100, Math.round(bootstrapWeight + assetsWeight + localizationWeight + fontsWeight + shellWeight));
  }, [assetProgress, bootProgress, fontsReady, i18nReady, initError, shellReady]);

  return {
    assetProgress,
    assetsReady,
    fontsReady,
    i18nReady,
    loadingProgress,
    shellReady,
    startupReady,
    startupComplete,
    loadingVisible: Boolean(!startupComplete && !initError && (loading || !shellBootstrapReady || !startupReady)),
  };
}
