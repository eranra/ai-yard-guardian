const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.BENCHMARK_PORT || 8792;
const BASE_DIR = path.resolve(__dirname, '..');

let benchmarkResults = null;

const server = http.createServer((req, res) => {
  console.log('Incoming request:', req.method, req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/benchmark-results') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        benchmarkResults = JSON.parse(body);
        fs.writeFileSync(path.join(BASE_DIR, 'test/benchmark/latest_results.json'), JSON.stringify(benchmarkResults, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  const cleanUrl = req.url.split('?')[0].replace(/^\/+/, '');
  let filePath = path.join(BASE_DIR, cleanUrl === '' ? 'test/benchmark/benchmark_runner.html' : cleanUrl);
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    res.writeHead(404);
    return res.end('Not Found: ' + req.url);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.json': 'application/json'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`📡 Benchmark test server running on http://127.0.0.1:${PORT}`);

  // Find Chrome binary based on platform
  let chromePath = process.env.CHROME_BIN;
  if (!chromePath) {
    if (process.platform === 'win32') {
      chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      if (!fs.existsSync(chromePath)) {
        chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      }
    } else if (process.platform === 'darwin') {
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      chromePath = '/usr/bin/google-chrome';
      if (!fs.existsSync(chromePath)) chromePath = '/usr/bin/chromium-browser';
      if (!fs.existsSync(chromePath)) chromePath = 'google-chrome';
    }
  }

  const tempProfile = path.join(
    process.env.TEMP || process.env.TMPDIR || '/tmp',
    'chrome_benchmark_profile_' + Date.now()
  );

  const cmd = `"${chromePath}" --headless=new --user-data-dir="${tempProfile}" --disable-gpu --no-sandbox --disable-dev-shm-usage --virtual-time-budget=120000 http://127.0.0.1:${PORT}/test/benchmark/benchmark_runner.html`;

  console.log('🚀 Running Chrome Headless benchmark...');

  const interval = setInterval(() => {
    if (benchmarkResults) {
      clearInterval(interval);
      console.log('\n========================================================================');
      console.log('📊 AI YARD GUARDIAN BENCHMARK VERIFICATION REPORT:');
      console.log('========================================================================');
      
      let allPassed = true;
      benchmarkResults.results.forEach((r, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const status = r.pass ? '✅ PASS' : '❌ FAIL';
        const conf = Math.round(r.confidence * 100);
        console.log(`${num}. ${status} | ${r.id.padEnd(28)} | Exp: ${r.expectedTarget.padEnd(6)} [${r.expectedAction.padEnd(12)}] | Got: ${r.actualTarget.padEnd(6)} [${r.actualAction.padEnd(12)}] (${conf}%)`);
        if (!r.pass) allPassed = false;
      });

      console.log('========================================================================');
      console.log(`🏁 RESULT: ${benchmarkResults.passCount}/${benchmarkResults.total} PASSED (${benchmarkResults.passRate}%)`);
      console.log('========================================================================\n');

      setTimeout(() => {
        server.close();
        // Clean up temp profile if possible
        try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch(e){}
        process.exit(allPassed ? 0 : 1);
      }, 500);
    }
  }, 1000);

  // Fallback timeout: 120 seconds
  setTimeout(() => {
    if (!benchmarkResults) {
      console.error('❌ Timed out waiting for benchmark results (120s limit exceeded)');
      server.close();
      process.exit(1);
    }
  }, 120000);

  exec(cmd, (err) => {
    if (err && !benchmarkResults) {
      console.error('Chrome execution error:', err.message);
    }
  });
});
