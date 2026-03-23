import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { useLogStore } from '../store/logStore'

const MODULES = [
  { to: '/recon',    label: 'Reconnaissance',  icon: '◉', count: 7,  desc: 'DNS · WHOIS · Ports · Subdomains · Fingerprint · RevDNS · GeoIP', gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)', glow: 'rgba(37,99,235,0.2)',   border: 'rgba(37,99,235,0.3)',   tag: 'recon' },
  { to: '/web',      label: 'Web Exploitation', icon: '◈', count: 5,  desc: 'Headers · DirBrute · SQLi · XSS · CORS',                         gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', glow: 'rgba(124,58,237,0.2)',  border: 'rgba(124,58,237,0.3)',  tag: 'web' },
  { to: '/network',  label: 'Network Analysis', icon: '⬡', count: 4,  desc: 'Services · ARP · Mapper · Packet Capture',                       gradient: 'linear-gradient(135deg, #4f46e5, #4338ca)', glow: 'rgba(79,70,229,0.2)',   border: 'rgba(79,70,229,0.3)',   tag: 'network' },
  { to: '/password', label: 'Password & Auth',  icon: '◆', count: 6,  desc: 'Identify · Crack · Wordlist · Credentials · Encoder · Strength', gradient: 'linear-gradient(135deg, #0891b2, #2563eb)', glow: 'rgba(8,145,178,0.2)',   border: 'rgba(8,145,178,0.3)',   tag: 'password' },
  { to: '/osint',    label: 'OSINT',            icon: '◎', count: 4,  desc: 'Email Recon · Username Scan · SSL Inspect · Breach Check',       gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)', glow: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.3)',  tag: 'osint' },
]

const MODULE_COLORS = {
  recon:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  web:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  network:  { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  password: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)'  },
  osint:    { color: '#a5b4fc', bg: 'rgba(165,180,252,0.12)' },
}

const TIPS = [
  'Press Ctrl+Shift+A to open the hidden admin panel',
  'OSINT Breach Check uses k-anonymity — your passwords never leave the machine',
  'Export any scan results as JSON, CSV, or TXT',
  'Username scanner checks 12 platforms simultaneously',
  'SSL Inspector detects weak ciphers and expiring certificates',
  'Settings page lets you persist default wordlist paths and timeouts',
  'Only scan targets you have explicit authorization for',
]

// Simple SVG bar chart
function MiniBarChart({ data }) {
  if (!data.length) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-white/8 text-[11px] font-mono">no data yet</p>
    </div>
  )
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-full px-2 pb-1 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: d.color }}>{d.value}</span>
          <div className="w-full rounded-t transition-all duration-700 ease-out"
            style={{
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}%`,
              background: `linear-gradient(to top, ${d.color}40, ${d.color}80)`,
              boxShadow: d.value > 0 ? `0 0 8px ${d.color}40` : 'none',
              minHeight: d.value > 0 ? '4px' : '1px',
            }} />
          <span className="text-[8px] font-mono text-white/20 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Donut chart (SVG)
function DonutChart({ data, total }) {
  if (!total) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-white/8 text-[10px] font-mono">no scans yet</p>
    </div>
  )
  const r = 40, cx = 56, cy = 56, circumference = 2 * Math.PI * r
  let offset = 0
  const segments = data.filter(d => d.value > 0).map(d => {
    const len = (d.value / total) * circumference
    const seg = { ...d, offset, len }
    offset += len
    return seg
  })

  return (
    <div className="flex items-center gap-4 h-full px-2">
      <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="12"
            strokeDasharray={`${s.len} ${circumference - s.len}`}
            strokeDashoffset={-s.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.8s ease' }} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">scans</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {data.filter(d => d.value > 0).map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-white/30 truncate">{d.label}</span>
            </div>
            <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: d.color }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate     = useNavigate()
  const activities   = useActivityStore((s) => s.activities)
  const pythonStatus = useSettingsStore((s) => s.pythonStatus)
  const addLog       = useLogStore((s) => s.addLog)
  const [tip]        = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtUptime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
  }

  function handleModuleClick(mod) {
    addLog('module_open', { module: mod.label })
    navigate(mod.to)
  }

  // Chart data
  const moduleCounts = ['recon','web','network','password','osint'].map(m => ({
    label: m, value: activities.filter(a => a.module === m).length,
    color: MODULE_COLORS[m].color,
  }))

  const donutData = moduleCounts.filter(m => m.value > 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#08080f' }}>
      <div className="absolute inset-0 grid-bg-fine opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(124,58,237,0.07), transparent 70%)' }} />

      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 flex items-center justify-between">
          <div className="slide-up">
            <h1 className="text-2xl font-black text-white tracking-tight shimmer-text mb-0.5">Dashboard</h1>
            <p className="text-white/20 text-[13px]">
              Security toolkit — <span className="text-purple-400/60 font-mono">{activities.length}</span> scans · <span className="text-blue-400/60 font-mono">26</span> tools
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/15 bg-purple-500/5">
            <div className={`w-1.5 h-1.5 rounded-full ${pythonStatus === 'online' ? 'bg-purple-400 dot-glow text-purple-400' : pythonStatus === 'offline' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`} />
            <span className={`text-[10px] font-mono font-bold ${pythonStatus === 'online' ? 'text-purple-300' : pythonStatus === 'offline' ? 'text-red-400' : 'text-blue-400'}`}>
              ENGINE {pythonStatus?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-8 grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Engine',      value: pythonStatus, color: pythonStatus === 'online' ? 'text-purple-300' : pythonStatus === 'offline' ? 'text-red-400' : 'text-blue-400', mono: false },
            { label: 'Uptime',      value: fmtUptime(uptime), color: 'text-white/50', mono: true },
            { label: 'Total Scans', value: activities.length, color: 'text-white', mono: false },
            { label: 'Tools',       value: '26', color: 'text-white', mono: false },
          ].map((s, i) => (
            <div key={i} className="glow-card p-3.5 rounded-xl bg-white/[0.02] scale-in" style={{ animationDelay: `${i*50}ms` }}>
              <p className="text-white/15 text-[10px] font-medium uppercase tracking-wider mb-1.5">{s.label}</p>
              <p className={`text-sm font-bold ${s.mono ? 'font-mono' : ''} ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main content: Modules + Charts */}
        <div className="px-8 flex gap-4 flex-1 min-h-0 mb-4">
          {/* Module cards */}
          <div className="flex-1 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold">Modules</p>
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {MODULES.map((mod, i) => (
                <button key={mod.to} onClick={() => handleModuleClick(mod)}
                  className="relative overflow-hidden flex items-start gap-3.5 p-4 rounded-xl text-left group cursor-pointer scale-in"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease', animationDelay: `${i*60}ms` }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${mod.border}`; e.currentTarget.style.boxShadow = `0 0 20px ${mod.glow}, 0 4px 16px rgba(0,0,0,0.3)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                    style={{ background: `radial-gradient(ellipse at top left, ${mod.glow}, transparent 60%)` }} />

                  <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300"
                    style={{ background: mod.gradient }}>
                    <span className="text-white text-base">{mod.icon}</span>
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-white font-bold text-[13px]">{mod.label}</h3>
                      <div className="flex items-center gap-1">
                        {activities.filter(a => a.module === mod.tag).length > 0 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: MODULE_COLORS[mod.tag].color, background: MODULE_COLORS[mod.tag].bg }}>
                            {activities.filter(a => a.module === mod.tag).length}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded-full">{mod.count}</span>
                      </div>
                    </div>
                    <p className="text-white/18 text-[10px] leading-relaxed">{mod.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Charts + Activity */}
          <div className="w-64 flex flex-col gap-3 shrink-0">
            {/* Bar chart */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/15 font-semibold">Scans by Module</p>
              </div>
              <div className="h-28">
                <MiniBarChart data={moduleCounts} />
              </div>
            </div>

            {/* Donut chart */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/15 font-semibold">Distribution</p>
              </div>
              <div className="h-28">
                <DonutChart data={moduleCounts} total={activities.length} />
              </div>
            </div>

            {/* Tip */}
            <div className="p-3.5 rounded-xl border flex-1"
              style={{ background: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.12)' }}>
              <p className="text-purple-400/50 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Tip</p>
              <p className="text-white/25 text-[11px] leading-relaxed">{tip}</p>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="px-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold">Recent Activity</p>
            {activities.length > 0 && (
              <button onClick={() => useActivityStore.getState().clearActivities()}
                className="text-white/10 text-[10px] hover:text-white/35 transition-colors">clear</button>
            )}
          </div>
          <div className="rounded-xl border border-white/[0.05] overflow-hidden bg-white/[0.01]">
            {activities.length === 0 ? (
              <div className="py-4 flex items-center justify-center">
                <p className="text-white/8 text-[11px] font-mono">no scans yet — run a tool to see activity here</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto">
                {activities.slice(0, 12).map((a) => (
                  <div key={a.id} className="flex flex-col items-start px-3 py-2 border-r border-white/[0.04] last:border-0 min-w-[120px] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-[1px] rounded
                        ${a.module === 'recon'    ? 'text-blue-400 bg-blue-400/10' :
                          a.module === 'web'      ? 'text-purple-400 bg-purple-400/10' :
                          a.module === 'network'  ? 'text-indigo-400 bg-indigo-400/10' :
                          a.module === 'osint'    ? 'text-violet-400 bg-violet-400/10' :
                          'text-cyan-400 bg-cyan-400/10'}`}>
                        {a.module}
                      </span>
                    </div>
                    <p className="text-white/40 text-[11px] font-medium truncate w-full">{a.tool}</p>
                    <p className="text-white/15 text-[10px] font-mono truncate w-full">{a.target || '—'}</p>
                    <p className="text-white/8 text-[9px] mt-0.5">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
