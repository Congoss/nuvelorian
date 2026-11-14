import { createReadStream, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.avif': 'image/avif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const immutableSceneAssets = new Set([
  '/ship-gum-queen/battle-poster-v1.webp',
  '/ship-gum-queen/character-edge-v6.webp',
]);

// Media under dist is public. Keep requests for it out of game initialization.
export function isPublicMediaPath(pathname) {
  return !/^\/(?:api|auth|admin)(?:\/|$)/i.test(pathname)
    && /\.(?:webp|avif|png|jpe?g|gif|svg|ico|woff2?|ttf|mp[34]|webm|ogg|wav|m4a)$/i.test(pathname);
}

export function createStaticHandler(root = resolve(process.cwd(), 'dist')) {
  root = resolve(root);
  const fileStat = (file) => { try { const stat = statSync(file); return stat.isFile() ? stat : null; } catch { return null; } };
  return function serve(urlPath, response, request = { headers: {}, method: 'GET' }) {
    let pathname;
    try {
      pathname = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
      if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin-build/index.html';
    }
    catch { response.writeHead(400); response.end(); return true; }
    let file = resolve(root, '.' + pathname);
    if (!file.startsWith(root + sep)) { response.writeHead(404); response.end(); return true; }
    let stat = fileStat(file);
    if (!stat) {
      if (extname(pathname) || pathname.startsWith('/assets/') || pathname.startsWith('/skills/')) {
        response.writeHead(404, { 'Cache-Control': 'no-cache' }); response.end(); return true;
      }
      file = resolve(root, 'index.html');
      stat = fileStat(file);
      if (!stat) return false;
      pathname = '/index.html';
    }
    const ext = extname(file).toLowerCase();
    const media = ['.mp4', '.webm'].includes(ext);
    const immutable = pathname.startsWith('/assets/') || immutableSceneAssets.has(pathname);
    const cacheControl = immutable ? 'public, max-age=31536000, immutable'
      : isPublicMediaPath(pathname) ? 'public, max-age=60' : 'no-cache';
    const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': cacheControl };
    if (media) headers['Accept-Ranges'] = 'bytes';
    if (['.js', '.css', '.html', '.svg', '.json'].includes(ext)) {
      headers.Vary = 'Accept-Encoding';
      const accepted = String(request.headers?.['accept-encoding'] || '').split(',').map((value) => value.trim().split(';'));
      const quality = (encoding) => {
        const entry = accepted.find(([name]) => name === encoding) || accepted.find(([name]) => name === '*');
        return entry ? Number(entry[1]?.trim().replace(/^q=/, '') ?? 1) : 0;
      };
      for (const encoding of ['br', 'gzip'].sort((a, b) => quality(b) - quality(a))) {
        const compressed = fileStat(file + (encoding === 'br' ? '.br' : '.gz'));
        if (quality(encoding) > 0 && compressed && compressed.mtimeMs >= stat.mtimeMs) { file += encoding === 'br' ? '.br' : '.gz'; stat = compressed; headers['Content-Encoding'] = encoding; break; }
      }
    }
    const etag = `"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}-${headers['Content-Encoding'] || 'identity'}"`;
    headers.ETag = etag;
    headers['Last-Modified'] = stat.mtime.toUTCString();
    if (String(request.headers?.['if-none-match'] || '').split(/,\s*/).includes(etag)) {
      response.writeHead(304, headers); response.end(); return true;
    }
    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    const range = request.headers?.range;
    if (media && range && (!request.headers['if-range'] || request.headers['if-range'] === etag || request.headers['if-range'] === headers['Last-Modified'])) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
        else start = Math.max(0, stat.size - Number(match[2]));
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
          response.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` }); response.end(); return true;
        }
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      }
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || !stat.size) response.end();
    else createReadStream(file, { start, end }).on('error', () => response.destroy()).pipe(response);
    return true;
  };
}

export const tryServeStatic = createStaticHandler();
