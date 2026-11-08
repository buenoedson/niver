/**
 * @file server.js
 * @description Servidor HTTP nativo em Node.js com MIME resolution e graceful shutdown.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.resolve(__dirname, 'public');

/**
 * Mapeamento estrito de tipos MIME.
 */
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * Criação da instância do servidor HTTP.
 */
const server = http.createServer((req, res) => {
    // Sanitização de método
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Method Not Allowed');
        return;
    }

    // Normalização e prevenção de Directory Traversal
    let safePath = path.normalize(req.url.split('?')[0]);
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }

    const filePath = path.join(PUBLIC_DIR, safePath);

    // Validação de isolamento do diretório público
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
            'Cache-Control': 'no-cache'
        });

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', (streamErr) => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
            }
            res.end('Internal Server Error');
        });
        readStream.pipe(res);
    });
});

/**
 * Inicialização e tratamento de sinais de encerramento.
 */
server.listen(PORT, HOST, () => {
    console.log(`[Project Chronos] Servidor operacional em http://${HOST}:${PORT}`);
});

function handleShutdown(signal) {
    console.log(`\n[Project Chronos] Sinal ${signal} recebido. Encerrando servidor HTTP...`);
    server.close(() => {
        console.log('[Project Chronos] Conexões finalizadas com sucesso.');
        process.exit(0);
    });

    // Forçar encerramento em caso de travamento
    setTimeout(() => {
        console.error('[Project Chronos] Encerramento forçado por timeout.');
        process.exit(1);
    }, 5000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

