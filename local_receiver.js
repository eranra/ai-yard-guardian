#!/usr/bin/env node
/**
 * local_receiver.js - Lightweight Local Analysis Server & Logger for AI Yard Guardian
 *
 * 100% Zero External Dependencies (Node.js standard library only: http, fs, path, os)
 *
 * Capabilities:
 *  - Receives real-time text alerts, status reports, and detection logs via POST /api/log
 *  - Receives high-resolution snapshot photos via POST /api/upload (JSON base64 or multipart)
 *  - Stores photos with date/time stamps and detection metadata in ./received_events/
 *  - Appends every event to ./received_events/events.jsonl (machine readable)
 *    and ./received_events/events.log (human readable)
 *  - Discovers and displays local LAN IP addresses so users know exactly what URL to enter
 *  - Provides CORS headers for smooth cross-origin POST from phone browsers
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT || process.argv[2] || '8780', 10);
const DATA_DIR = path.join(__dirname, 'received_events');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const JSONL_LOG = path.join(DATA_DIR, 'events.jsonl');
const TEXT_LOG = path.join(DATA_DIR, 'events.log');

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function appendEvent(eventData) {
  try {
    fs.appendFileSync(JSONL_LOG, JSON.stringify(eventData) + '\n');
    const humanLine = `[${eventData.dateStr || new Date().toLocaleString()}] [${(eventData.type || 'INFO').toUpperCase()}] ` +
      (eventData.text || eventData.caption || 'Event') +
      (eventData.filename ? ` (Image: ${eventData.filename})` : '') + '\n';
    fs.appendFileSync(TEXT_LOG, humanLine);
  } catch (err) {
    console.error('⚠️ Error writing to log:', err.message);
  }
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // Health / Connection Test
  if (req.method === 'GET' && (url === '/' || url === '/api/status' || url === '/api/health')) {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'AI Yard Guardian Local Ingest Hub',
      version: '1.0.0',
      timestamp: Date.now(),
      savedPhotosCount: files.length,
      storageDir: DATA_DIR
    }));
    return;
  }

  // Text / Alert Log Ingestion
  if (req.method === 'POST' && (url === '/api/log' || url === '/log')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const now = new Date();
        const eventData = {
          timestamp: payload.timestamp || Date.now(),
          dateStr: payload.dateStr || now.toLocaleString(),
          isoTime: payload.isoTime || now.toISOString(),
          type: payload.type || 'log',
          text: payload.text || payload.message || '',
          metadata: payload.metadata || null
        };

        appendEvent(eventData);

        const cleanPreview = (eventData.text || '').replace(/<[^>]*>/g, '').trim();
        console.log(`📝 [${eventData.dateStr}] [${eventData.type.toUpperCase()}] ${cleanPreview}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, timestamp: eventData.timestamp }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Photo & Snapshot Upload Ingestion
  if (req.method === 'POST' && (url === '/api/upload' || url === '/api/snapshot' || url === '/upload')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const now = new Date();
        const timestamp = payload.timestamp || Date.now();
        const dateStr = payload.dateStr || now.toLocaleString();
        const label = (payload.metadata?.label || payload.label || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
        const score = payload.metadata?.score || payload.score ? `${Math.round(payload.metadata?.score || payload.score)}pct` : '';

        // Safe filename format: YYYY-MM-DD_HH-mm-ss_label_score.jpg
        const timeTag = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${timeTag}_${label}${score ? '_' + score : ''}.jpg`;
        const filePath = path.join(DATA_DIR, filename);

        if (payload.photoBase64) {
          const rawBase64 = payload.photoBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));
        }

        const eventData = {
          timestamp,
          dateStr,
          isoTime: now.toISOString(),
          type: payload.type || 'snapshot',
          caption: payload.caption || '',
          filename,
          filePath,
          metadata: payload.metadata || null
        };

        appendEvent(eventData);

        const cleanCaption = (payload.caption || '').replace(/<[^>]*>/g, '').trim();
        console.log(`📸 [${dateStr}] SAVED: ${filename} | ${cleanCaption}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filename, filePath, timestamp }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found. Use POST /api/log or POST /api/upload' }));
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log('\n======================================================');
  console.log('🛡️  AI Yard Guardian - Local Analysis Server & Logger');
  console.log('======================================================');
  console.log(`📡 Listening on port: ${PORT}`);
  console.log(`📁 Ingest storage directory:\n   ${DATA_DIR}`);
  console.log('\n🌐 Available Local IP Addresses (Enter one into Yard Guardian):');
  ips.forEach(ip => {
    console.log(`   👉 http://${ip.address}:${PORT}`);
  });
  console.log('\nEndpoints ready:');
  console.log('   • GET  /api/status   - Health check & stats');
  console.log('   • POST /api/log      - Ingest text alerts & Telegram readouts');
  console.log('   • POST /api/upload   - Ingest snapshots & zoomed evidence crops');
  console.log('======================================================\n');
});
