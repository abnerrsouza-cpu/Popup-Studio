// ══════ DASHBOARD ══════
(async () => {
  const res = await fetch('/api/stats/summary');
  const data = await res.json();

  // KPIs
  document.getElementById('kpiVisitors').textContent = formatNumber(data.totalVisitors);
  document.getElementById('kpiLeads').textContent = formatNumber(data.totalLeads);
  document.getElementById('kpiConversion').textContent = data.conversionRate + '%';
  document.getElementById('kpiCoupons').textContent = formatNumber(data.totalCouponsUsed);

  document.getElementById('kpiLeadsTrend').textContent = (data.growth >= 0 ? '+' : '') + data.growth + '%';
  document.getElementById('kpiLeadsTrend').className = 'kpi-trend ' + (data.growth >= 0 ? 'up' : 'down');

  // ── Chart (pure canvas — no library needed) ──
  drawChart(data.dailyData);

  // ── Game Ranking ──
  const gameNames = {
    'slot-machine': { name: 'Slot Machine', icon: '🎰' },
    'roleta':       { name: 'Roleta da Sorte', icon: '🎡' },
    'raspadinha':   { name: 'Raspadinha', icon: '🎫' },
    'aviator':      { name: 'Aviator', icon: '🚀' },
    'quiz':         { name: 'Quiz de Produtos', icon: '❓' },
    'roda-premio':  { name: 'Roda de Prêmios', icon: '🏆' },
  };

  const colors = ['#8b5cf6', '#10b981', '#fbbf24', '#ec4899', '#3b82f6', '#f97316'];
  const ranking = Object.entries(data.gameStats)
    .sort((a, b) => parseFloat(b[1].conversionRate) - parseFloat(a[1].conversionRate));

  const maxConv = Math.max(...ranking.map(([, s]) => parseFloat(s.conversionRate)));

  const rankContainer = document.getElementById('gameRanking');
  ranking.forEach(([key, stats], i) => {
    const info = gameNames[key] || { name: key, icon: '🎮' };
    const pct = (parseFloat(stats.conversionRate) / maxConv * 100).toFixed(0);
    rankContainer.innerHTML += `
      <div class="game-rank-item">
        <div class="game-rank-icon">${info.icon}</div>
        <div class="game-rank-info">
          <div class="game-rank-name">${info.name}</div>
          <div class="game-rank-bar">
            <div class="game-rank-fill" style="width:${pct}%;background:${colors[i % colors.length]};"></div>
          </div>
        </div>
        <div class="game-rank-val">${stats.conversionRate}%</div>
      </div>
    `;
  });

  // ── Table ──
  const tbody = document.getElementById('gameTable');
  ranking.forEach(([key, stats], i) => {
    const info = gameNames[key] || { name: key, icon: '🎮' };
    const isActive = i < 3;
    tbody.innerHTML += `
      <tr>
        <td><span style="margin-right:8px;">${info.icon}</span> ${info.name}</td>
        <td>${formatNumber(stats.impressions)}</td>
        <td>${formatNumber(stats.plays)}</td>
        <td><strong>${formatNumber(stats.leads)}</strong></td>
        <td><strong style="color:${parseFloat(stats.conversionRate) > 25 ? 'var(--green)' : 'var(--text)'};">${stats.conversionRate}%</strong></td>
        <td><span class="status-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
      </tr>
    `;
  });
})();

// ── Canvas Chart ──
function drawChart(dailyData) {
  const canvas = document.getElementById('chartLeads');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  canvas.style.height = '220px';
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 220;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const visitors = dailyData.map(d => d.visitors);
  const leads = dailyData.map(d => d.leads);
  const maxVal = Math.max(...visitors) * 1.1;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (cH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = '#5a5e72';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 8, y + 4);
  }

  // X labels
  ctx.fillStyle = '#5a5e72';
  ctx.font = '10px Inter';
  ctx.textAlign = 'center';
  const step = Math.ceil(dailyData.length / 8);
  dailyData.forEach((d, i) => {
    if (i % step === 0) {
      const x = pad.left + (cW / (dailyData.length - 1)) * i;
      const label = d.date.slice(5).replace('-', '/');
      ctx.fillText(label, x, H - 8);
    }
  });

  function drawLine(data, color, fill) {
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (cW / (data.length - 1)) * i;
      const y = pad.top + cH - (v / maxVal) * cH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fill
    if (fill) {
      const last = data.length - 1;
      ctx.lineTo(pad.left + cW, pad.top + cH);
      ctx.lineTo(pad.left, pad.top + cH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
      grad.addColorStop(0, fill);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  drawLine(visitors, '#8b5cf6', 'rgba(139,92,246,.08)');
  drawLine(leads, '#10b981', 'rgba(16,185,129,.08)');

  // Dots
  [
    { data: visitors, color: '#8b5cf6' },
    { data: leads, color: '#10b981' }
  ].forEach(({ data, color }) => {
    data.forEach((v, i) => {
      if (i % 3 === 0 || i === data.length - 1) {
        const x = pad.left + (cW / (data.length - 1)) * i;
        const y = pad.top + cH - (v / maxVal) * cH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  });
}
