const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = 3000;

// ── MIME Types ──
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// ── In-memory data ──
const store = { leads: [], templates: [], stats: { totalVisitors: 4827, totalLeads: 1243, totalCouponsUsed: 387, conversionRate: 25.7, dailyData: [], gameStats: {} } };

(function seed() {
  const games = ['slot-machine', 'roleta', 'raspadinha', 'aviator', 'quiz', 'roda-premio'];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const v = Math.floor(Math.random() * 200) + 80;
    const l = Math.floor(v * (Math.random() * 0.2 + 0.15));
    store.stats.dailyData.push({ date: d.toISOString().slice(0, 10), visitors: v, leads: l, couponsUsed: Math.floor(l * (Math.random() * 0.4 + 0.2)) });
  }
  games.forEach(g => {
    store.stats.gameStats[g] = { impressions: Math.floor(Math.random() * 2000) + 500, plays: Math.floor(Math.random() * 1000) + 200, leads: Math.floor(Math.random() * 500) + 80, conversionRate: (Math.random() * 20 + 15).toFixed(1) };
  });
})();

// ── Simple template engine ──
function renderPage(pageName) {
  const layout = fs.readFileSync(path.join(__dirname, 'views', 'layout.html'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, 'views', 'pages', pageName + '.html'), 'utf8');
  return layout
    .replace('{{PAGE_CONTENT}}', page)
    .replace(/\{\{PAGE_NAME\}\}/g, pageName)
    .replace('{{TITLE}}', pageName === 'dashboard' ? 'Dashboard' : pageName === 'oficina' ? 'Oficina de Templates' : 'Biblioteca de Jogos')
    .replace(`id="nav-${pageName}"`, `id="nav-${pageName}" class="nav-item active"`)
    .replace(new RegExp(`<!--IF:${pageName}-->([\\s\\S]*?)<!--ENDIF-->`,'g'), '$1')
    .replace(/<!--IF:\w+-->([\s\S]*?)<!--ENDIF-->/g, '');
}

// ── Server ──
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API Routes
  if (url.pathname === '/api/stats/summary' && req.method === 'GET') {
    const last7 = store.stats.dailyData.slice(-7);
    const prev7 = store.stats.dailyData.slice(-14, -7);
    const sum = arr => arr.reduce((s, d) => s + d.leads, 0);
    const cur = sum(last7), prev = sum(prev7);
    const growth = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(1) : 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ...store.stats, weeklyLeads: cur, growth: parseFloat(growth) }));
  }

  if (url.pathname === '/api/leads' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const data = JSON.parse(body);
      const lead = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
      store.leads.push(lead);
      store.stats.totalLeads++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, lead }));
    });
    return;
  }

  if (url.pathname === '/api/templates' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const tpl = { id: crypto.randomUUID(), ...JSON.parse(body), createdAt: new Date().toISOString() };
      store.templates.push(tpl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, template: tpl }));
    });
    return;
  }

  // Page routes
  if (url.pathname === '/' || url.pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(renderPage('dashboard'));
  }
  if (url.pathname === '/oficina') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(renderPage('oficina'));
  }
  if (url.pathname === '/biblioteca') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(renderPage('biblioteca'));
  }

  // Static files
  const filePath = path.join(__dirname, 'public', url.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  🎰 PopUp Studio rodando em http://localhost:${PORT}\n`);
});
