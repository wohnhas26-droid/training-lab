// Futbol Training Lab — cross-platform static file server
// Serves the frontend on http://localhost:8080 (override with PORT env var).
// Node-only replacement for serve.ps1 so the app runs on Linux/macOS/Windows.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const port = parseInt(process.env.FRONTEND_PORT || process.env.PORT || '8080', 10);
const host = process.env.HOST || '0.0.0.0';

const mimes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (urlPath === '/') urlPath = '/index.html';

    // Prevent path traversal outside the project root.
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('403 Forbidden');
      return;
    }

    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
      return;
    }

    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimes[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('500 Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Futbol Training Lab frontend running at http://localhost:${port}`);
});
