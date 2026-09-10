// server.js - Native, zero-dependency local dev server
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;

// Proper MIME types so the browser executes ES Modules and renders CSS
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Strip query parameters and decode URL paths
  let cleanUrl = decodeURI(req.url.split('?')[0]);
  if (cleanUrl === '/') cleanUrl = '/index.html';

  const filePath = path.join(process.cwd(), cleanUrl);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`404 Not Found: ${cleanUrl}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`500 Server Error: ${err.code}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Disable caching during development so changes show instantly
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Nature Camera dev server running:`);
  console.log(`➜ Local:   http://localhost:${PORT}`);
  console.log(`➜ Press Ctrl+C in Termux to stop`);
});
