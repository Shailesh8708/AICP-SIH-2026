// server/src/views/backendGatewayView.js
import mongoose from 'mongoose'

export function renderBackendGateway(req, { port, env, uptime }) {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting/Offline'
  const dbName = mongoose.connection.name || 'aicp'
  const dbHost = mongoose.connection.host || '127.0.0.1'

  const uptimeMinutes = Math.floor(uptime / 60)
  const uptimeSeconds = Math.floor(uptime % 60)
  const uptimeStr = `${uptimeMinutes}m ${uptimeSeconds}s`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AICP Backend Gateway & API Explorer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(18, 22, 34, 0.75);
      --card-border: rgba(244, 114, 182, 0.2);
      --pink: #f472b6;
      --pink-glow: rgba(244, 114, 182, 0.4);
      --amber: #f59e0b;
      --green: #10b981;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 20% 15%, rgba(244, 114, 182, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.08) 0%, transparent 50%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 1050px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-badge {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f472b6, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 24px var(--pink-glow);
    }
    .brand-text h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 0%, #fbcfe8 50%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-text p {
      font-size: 13px;
      color: var(--text-muted);
    }
    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
      color: #34d399;
      font-size: 13px;
      font-weight: 600;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 22px;
      backdrop-filter: blur(12px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--pink), transparent);
    }
    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }
    .stat-sub {
      font-size: 12px;
      color: #38bdf8;
      margin-top: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 28px;
      backdrop-filter: blur(12px);
      margin-bottom: 28px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .panel-title {
      font-size: 17px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .action-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #f472b6 0%, #f59e0b 50%, #ea580c 100%);
      color: #fff;
      box-shadow: 0 4px 20px rgba(244, 114, 182, 0.3);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(244, 114, 182, 0.45);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(244, 114, 182, 0.25);
      color: #fbcfe8;
    }
    .btn-secondary:hover {
      background: rgba(244, 114, 182, 0.12);
      border-color: #f472b6;
    }
    .endpoints-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .endpoints-table th {
      text-align: left;
      padding: 10px 14px;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    .endpoints-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .endpoints-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .badge-method {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-get { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-post { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-del { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .route-link {
      color: #fbcfe8;
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      transition: color 0.15s;
    }
    .route-link:hover {
      color: #f472b6;
      text-decoration: underline;
    }
    .test-pill {
      display: inline-block;
      cursor: pointer;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 6px;
      background: rgba(244, 114, 182, 0.1);
      border: 1px solid rgba(244, 114, 182, 0.3);
      color: #f472b6;
      font-family: 'JetBrains Mono', monospace;
      transition: all 0.2s;
    }
    .test-pill:hover {
      background: #f472b6;
      color: #000;
    }
    .terminal-box {
      background: #000000;
      border: 1px solid rgba(244, 114, 182, 0.25);
      border-radius: 14px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #a7f3d0;
      max-height: 220px;
      overflow-y: auto;
      white-space: pre-wrap;
      margin-top: 14px;
      display: none;
    }
    .footer-note {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">⚡</div>
        <div class="brand-text">
          <h1>AICP Backend Gateway</h1>
          <p>Academia-Industry Collaboration Portal &bull; REST API Server</p>
        </div>
      </div>
      <div class="live-pill">
        <span class="pulse-dot"></span>
        OPERATIONAL &bull; PORT ${port}
      </div>
    </div>

    <div class="grid">
      <div class="stat-card">
        <div class="stat-label">API Gateway Status</div>
        <div class="stat-value" style="color: #34d399;">Active & Online</div>
        <div class="stat-sub">HTTP 200 &bull; Express v4.18</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">MongoDB Database</div>
        <div class="stat-value" style="color: #60a5fa;">${dbStatus}</div>
        <div class="stat-sub">${dbHost} &bull; ${dbName}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Server Uptime</div>
        <div class="stat-value" style="color: #fbcfe8;">${uptimeStr}</div>
        <div class="stat-sub">Env: ${env}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Daily Quiz & Streaks</div>
        <div class="stat-value" style="color: #fbbf24;">Enabled 🔥</div>
        <div class="stat-sub">5-Day Badge Engine Ready</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <span>🚀 Quick Actions & Navigation</span>
        </div>
      </div>
      <div class="action-row">
        <a href="http://localhost:5173" target="_blank" class="btn btn-primary">
          <span>🌐 Open React Frontend (localhost:5173)</span>
        </a>
        <button class="btn btn-secondary" onclick="runPing('/health')">
          <span>🩺 Ping /health</span>
        </button>
        <button class="btn btn-secondary" onclick="runPing('/api/health')">
          <span>🔬 Ping /api/health</span>
        </button>
        <button class="btn btn-secondary" onclick="runPing('/api/skills')">
          <span>⚡ Query Skills API</span>
        </button>
        <button class="btn btn-secondary" onclick="runPing('/api/opportunities/radar/stats')">
          <span>📡 Opportunity Radar Stats</span>
        </button>
      </div>

      <div id="terminal" class="terminal-box"></div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <span>📑 Core API Directory</span>
        </div>
        <span style="font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono';">JSON endpoints</span>
      </div>

      <table class="endpoints-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Category</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/health" class="route-link" target="_blank">/health</a></td>
            <td>System Health</td>
            <td><span class="test-pill" onclick="runPing('/health')">Test Ping</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/api/health" class="route-link" target="_blank">/api/health</a></td>
            <td>API & DB Status</td>
            <td><span class="test-pill" onclick="runPing('/api/health')">Test Ping</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/api/skills" class="route-link" target="_blank">/api/skills</a></td>
            <td>Skills & Ontology</td>
            <td><span class="test-pill" onclick="runPing('/api/skills')">Test Ping</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/api/opportunities" class="route-link" target="_blank">/api/opportunities</a></td>
            <td>Opportunities Engine</td>
            <td><span class="test-pill" onclick="runPing('/api/opportunities')">Test Ping</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/api/opportunities/radar/stats" class="route-link" target="_blank">/api/opportunities/radar/stats</a></td>
            <td>AI Radar Intelligence</td>
            <td><span class="test-pill" onclick="runPing('/api/opportunities/radar/stats')">Test Ping</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td><a href="/api/daily-quiz/badges" class="route-link" target="_blank">/api/daily-quiz/badges</a></td>
            <td>Daily Quiz Badges (5-day tiers)</td>
            <td><span class="test-pill" onclick="runPing('/api/daily-quiz/badges')">Auth Req</span></td>
          </tr>
          <tr>
            <td><span class="badge-method badge-post">POST</span></td>
            <td><span class="route-link">/api/auth/login</span></td>
            <td>Authentication</td>
            <td><span style="font-size: 11px; color: var(--text-muted);">POST Body</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-note">
      AICP Server &bull; Node.js ${process.version} &bull; Express REST Architecture &bull; Ready for Client Connections
    </div>
  </div>

  <script>
    async function runPing(url) {
      const box = document.getElementById('terminal');
      box.style.display = 'block';
      box.innerText = '📡 Pinging ' + url + '...\\n';
      try {
        const start = performance.now();
        const res = await fetch(url);
        const data = await res.json();
        const duration = Math.round(performance.now() - start);
        box.innerText = '✅ HTTP ' + res.status + ' OK (' + duration + 'ms)\\n' + JSON.stringify(data, null, 2);
      } catch (err) {
        box.innerText = '❌ Error fetching ' + url + ': ' + err.message;
      }
    }
  </script>
</body>
</html>`
}

