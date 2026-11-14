import pvpPrototypePlugin from './scripts/pvp-prototype-plugin.mjs';
import { randomUUID } from 'node:crypto';
import enhancementDemoPlugin from './scripts/enhancement-demo-plugin.mjs';
import { APP_VERSION } from './src/lib/appVersion.js';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeRaster, RASTER_EXTENSION, webpName } from './scripts/lib/webp-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function optimizedRasterImports() {
  const assetsRoot = path.join(__dirname, 'src', 'assets');
  return {
    name: 'optimized-raster-imports',
    enforce: 'pre',
    async resolveId(source, importer) {
      const queryIndex = source.indexOf('?');
      const file = queryIndex < 0 ? source : source.slice(0, queryIndex);
      const query = queryIndex < 0 ? '' : source.slice(queryIndex);
      if (!RASTER_EXTENSION.test(file)) return null;
      let absolute;
      if (file.startsWith('@/assets/')) absolute = path.join(assetsRoot, file.slice('@/assets/'.length));
      else if (file.startsWith('/src/assets/')) absolute = path.join(__dirname, file.slice(1));
      else if (path.isAbsolute(file)) absolute = file;
      else if (file.startsWith('.') && importer) absolute = path.resolve(path.dirname(importer.split('?')[0]), file);
      else return null;
      const relative = path.relative(assetsRoot, absolute);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.replaceAll('\\', '/').startsWith('optimized/')) return null;
      const output = path.join(assetsRoot, 'optimized/all', webpName(relative));
      await optimizeRaster(absolute, output);
      this.addWatchFile(absolute);
      return output.replaceAll('\\', '/') + query;
    },
  };
}

const buildId = randomUUID();

export default defineConfig({
  cacheDir: process.env.VITE_LOCAL_CACHE_DIR || 'node_modules/.vite',
  define: { __GAME_BUILD_ID__: JSON.stringify(buildId) },
  optimizeDeps: { entries: ['index.html'] },
  plugins: [
    {
      name: 'local-mock-telegram-sdk',
      transformIndexHtml(html, context) {
        if (!context.server || process.env.VITE_TELEGRAM_USE_MOCK !== 'true') return html;
        return html.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '');
      },
    },
    { name: 'release-version', generateBundle() { this.emitFile({ type: 'asset', fileName: 'release-version.json', source: JSON.stringify({version:APP_VERSION, buildId}) }); } },
    enhancementDemoPlugin(),
    pvpPrototypePlugin(),
    optimizedRasterImports(),
    react(),
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true, open: false })]
      : []),
  ],
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'assets/[hash].js',
        manualChunks(id) {
          const moduleId = id.replaceAll('\\', '/');
          if (!moduleId.includes('/node_modules/')) return;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(moduleId)) return 'react-vendor';
          if (/\/node_modules\/(i18next|react-i18next)\//.test(moduleId)) return 'i18n-vendor';
          if (/\/node_modules\/(tailwind-merge|clsx)\//.test(moduleId)) return 'ui-utils';
          if (moduleId.includes('/node_modules/@tonconnect/ui/')) return 'ton-ui';
          if (/\/node_modules\/@tonconnect\/(sdk|protocol)\//.test(moduleId)) return 'ton-sdk';
          if (moduleId.includes('/node_modules/@near-wallet-selector/core/')) return 'near-actions';
          if (id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/motion-dom/')) {
            return 'motion';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: { ignored: ['**/deploy/**', '**/.local/**', '**/.tmp/**', '**/.tmp-*/**'] },
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api/public/pl4-quote': {
        target: 'https://nearly.trade', changeOrigin: true,
        rewrite: () => '/api/launch/pl4.nearlytrade.near',
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/players': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/wallets': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/leaderboard': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/boss-fights': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/boss-damage-logs': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/attack-logs': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/raids': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/loot': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
});
