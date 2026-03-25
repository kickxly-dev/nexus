/**
 * generateReport(tool, module, target, lines) → HTML string
 * Produces a self-contained, dark-themed HTML scan report.
 */

const LINE_COLORS = {
  found:    { fg: '#00d084', bg: 'rgba(0,208,132,0.07)',  badge: 'FOUND' },
  vuln:     { fg: '#ff4757', bg: 'rgba(255,71,87,0.07)',  badge: 'VULN'  },
  error:    { fg: '#ff4757', bg: 'rgba(255,71,87,0.05)',  badge: 'ERR'   },
  warn:     { fg: '#ff7a00', bg: 'rgba(255,122,0,0.06)',  badge: 'WARN'  },
  done:     { fg: '#4a9eff', bg: 'rgba(74,158,255,0.06)', badge: 'DONE'  },
  result:   { fg: '#a78bfa', bg: null,                    badge: null    },
  data:     { fg: '#7070a8', bg: null,                    badge: null    },
  info:     { fg: '#505088', bg: null,                    badge: null    },
  progress: { fg: '#383868', bg: null,                    badge: null    },
}

function countByType(lines) {
  const counts = {}
  for (const l of lines) {
    counts[l.type] = (counts[l.type] || 0) + 1
  }
  return counts
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

export function generateReport(tool, module, target, lines) {
  const now = new Date()
  const timestamp = now.toLocaleString()
  const isoTs = now.toISOString()
  const counts = countByType(lines)
  const hits = (counts.found || 0) + (counts.vuln || 0)

  // Summary rows
  const summaryTypes = ['found', 'vuln', 'error', 'warn', 'done', 'info', 'data', 'result', 'progress']
  const summaryRows = summaryTypes
    .filter(t => counts[t])
    .map(t => {
      const c = LINE_COLORS[t] || { fg: '#9090c0', badge: t.toUpperCase() }
      return `<tr>
        <td><span style="color:${c.fg};font-weight:700">${c.badge || t.toUpperCase()}</span></td>
        <td style="color:#9090c0">${counts[t]}</td>
      </tr>`
    }).join('')

  // Result lines
  const lineRows = lines.map((l, i) => {
    const c = LINE_COLORS[l.type] || LINE_COLORS.info
    const msg = esc(l.message ?? JSON.stringify(l))
    const ts = l._ts ? `<span class="ts">${fmtTs(l._ts)}</span>` : ''
    const badge = c.badge
      ? `<span class="badge" style="color:${c.fg}">${c.badge}</span>`
      : `<span class="badge-empty"></span>`
    const bg = c.bg ? `background:${c.bg};border-left:2px solid ${c.fg}40;` : 'border-left:2px solid transparent;'
    return `<div class="line" style="${bg}">
      <span class="ln">${i + 1}</span>
      ${ts}
      ${badge}
      <span class="msg" style="color:${c.fg}">${msg}</span>
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nexus Report — ${esc(tool)} — ${esc(target)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #040408;
      color: #ecebff;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      padding: 0;
    }

    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 32px 64px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      margin-bottom: 32px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #8b5cf6, #5b21b6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 900;
      color: white;
      box-shadow: 0 0 24px rgba(124,58,237,0.4);
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: #ecebff;
      letter-spacing: -0.03em;
    }

    .logo-sub {
      font-size: 11px;
      color: #505088;
      margin-top: 2px;
    }

    .header-meta {
      text-align: right;
    }

    .header-meta .ts-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #505088;
      letter-spacing: 0;
    }

    /* ── Badges ── */
    .badge-pill {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 100px;
      background: rgba(139,92,246,0.12);
      color: #a78bfa;
      border: 1px solid rgba(139,92,246,0.25);
    }

    /* ── Section ── */
    .section {
      margin-bottom: 28px;
    }

    .section-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #1c1c4c;
      margin-bottom: 12px;
    }

    .card {
      background: #07071a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 11px;
      padding: 18px 20px;
    }

    /* ── Meta grid ── */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .meta-item label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #303065;
      display: block;
      margin-bottom: 4px;
      font-family: 'JetBrains Mono', monospace;
    }

    .meta-item p {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #9090c0;
      letter-spacing: 0;
    }

    /* ── Stats table ── */
    table.stats {
      border-collapse: collapse;
      width: 100%;
    }

    table.stats td {
      padding: 5px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      vertical-align: middle;
    }

    table.stats td:first-child {
      width: 80px;
    }

    /* ── Terminal output ── */
    .terminal {
      background: #030307;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 11px;
      overflow: hidden;
    }

    .terminal-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.02);
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .terminal-bar .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #252555;
      margin-left: 6px;
    }

    .lines {
      padding: 6px 0 10px;
    }

    .line {
      display: flex;
      align-items: flex-start;
      padding: 0 14px;
      min-width: 0;
    }

    .ln {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #1c1c4c;
      width: 28px;
      text-align: right;
      padding-right: 12px;
      padding-top: 3px;
      user-select: none;
      flex-shrink: 0;
    }

    .ts {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #252555;
      flex-shrink: 0;
      padding-top: 3px;
      margin-right: 10px;
      width: 52px;
    }

    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.04em;
      font-weight: 700;
      flex-shrink: 0;
      padding-top: 3px;
      margin-right: 10px;
      width: 32px;
      text-align: right;
      opacity: 0.9;
    }

    .badge-empty {
      width: 42px;
      flex-shrink: 0;
    }

    .msg {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      letter-spacing: 0;
      line-height: 1.7;
      word-break: break-all;
      white-space: pre-wrap;
      flex: 1;
      min-width: 0;
      padding: 2px 0;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.05);
      text-align: center;
    }

    .footer p {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #1c1c4c;
      letter-spacing: 0;
    }

    /* ── Print ── */
    @media print {
      body { background: #040408 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-row">
      <div class="logo-icon">N</div>
      <div>
        <div class="logo-text">Nexus Security Toolkit</div>
        <div class="logo-sub">Scan Report</div>
      </div>
    </div>
    <div class="header-meta">
      <span class="badge-pill">${esc(module)}</span>
      <div class="ts-label" style="margin-top:8px">${esc(timestamp)}</div>
    </div>
  </div>

  <!-- Scan metadata -->
  <div class="section">
    <div class="section-label">Scan Details</div>
    <div class="card meta-grid">
      <div class="meta-item">
        <label>Tool</label>
        <p>${esc(tool)}</p>
      </div>
      <div class="meta-item">
        <label>Target</label>
        <p>${esc(target) || '—'}</p>
      </div>
      <div class="meta-item">
        <label>Module</label>
        <p>${esc(module)}</p>
      </div>
      <div class="meta-item">
        <label>Generated</label>
        <p>${esc(isoTs)}</p>
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-label">Summary</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:24px;margin-bottom:${summaryRows ? 16 : 0}px">
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#ecebff;line-height:1">${lines.length}</div>
          <div style="font-size:11px;color:#505088;margin-top:3px">total lines</div>
        </div>
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:${hits > 0 ? '#00d084' : '#1c1c4c'};line-height:1">${hits}</div>
          <div style="font-size:11px;color:#505088;margin-top:3px">hits (found + vuln)</div>
        </div>
      </div>
      ${summaryRows ? `<table class="stats">${summaryRows}</table>` : ''}
    </div>
  </div>

  <!-- Output -->
  <div class="section">
    <div class="section-label">Output (${lines.length} lines)</div>
    <div class="terminal">
      <div class="terminal-bar">
        <span class="dot" style="background:#1c1c3c"></span>
        <span class="dot" style="background:#1c1c3c"></span>
        <span class="dot" style="background:#1c1c3c"></span>
        <span class="path">nexus ~ ${esc(tool)} · ${lines.length} lines · ${hits} hits</span>
      </div>
      <div class="lines">
${lineRows}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Generated by Nexus Security Toolkit &nbsp;·&nbsp; ${esc(isoTs)}</p>
  </div>

</div>
</body>
</html>`
}
