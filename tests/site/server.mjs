import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const port = Number(process.env.PLAYWRIGHT_TEST_SERVER_PORT || 4173);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
]);

function sendText(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'content-type': contentType });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

  if (url.pathname === '/health') {
    sendText(res, 200, 'ok');
    return;
  }

  const safePath = url.pathname === '/' ? '/capture-target.html' : url.pathname;
  const filePath = path.join(rootDir, safePath.replace(/^\/+/, ''));

  if (!filePath.startsWith(rootDir)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'content-type': contentTypes.get(ext) || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    sendText(res, 404, 'Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Playwright test site running at http://127.0.0.1:${port}\n`);
});
