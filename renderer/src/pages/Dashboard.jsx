import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { useLogStore } from '../store/logStore'

const MODULES = [
  {
    to: '/recon',    label: 'Reconnaissance',  icon: '◉', count: 7,
    desc: 'DNS · WHOIS · Ports · Subdomains · Fingerprint · RevDNS · GeoIP',
    gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)',
    glow: 'rgba(37,99,235,0.2)', border: 'rgba(37,99,235,0.25)',
    tag: 'blue',
  },
  {
    to: '/web',      label: 'Web Exploitation', icon: '◈', count: 5,
    desc: 'Headers · DirBrute · SQLi · XSS · CORS',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    glow: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.25)',
    tag: 'purple',
  },
  {
    to: '/network',  label: 'Network Analysis', icon: '⬡', count: 4,
    desc: 'Services · ARP · Mapper · Packet Capture',
    gradient: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    glow: 'rgba(79,70,229,0.2)', border: 'rgba(79,70,229,0.25)',
    tag: 'indigo',
  },
  {
    to: '/password', label: 'Password & Auth',  icon: '◆', count: 6,
    desc: 'Identify · Crack · Wordlist · Credentials · Encoder · Strength',
    gradient: 'linear-gradient(135deg, #0891b2, #2563eb)',
    glow: 'rgba(8,145,178,0.2)', border: 'rgba(8,145,178,0.25)',
    tag: 'cyan',
  },
]

const TIPS = [
  'Press Ctrl+Shift+A to open the admin panel',
  'All scan activity is logged for audit review',
  'Export results as JSON, CSV, or TXT after any scan',
  'Use the built-in wordlists or specify your own path',
  'Only scan targets you have explicit authorization for',
  'CORS checker catches reflected origin misconfigurations',
  'Password Strength tool estimates GPU crack time',
]

export function Dashboard() {
  const navigate      = useNavigate()
  const activities    = useActivityStore((s) => s.activities)
  const pythonStatus  = useSettingsStore((s) => s.pythonStatus)
  const addLog        = useLogStore((s) => s.addLog)
  const [tip]         = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
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
    addLog('module_open', { module: mod.label, detail: `Opened ${mod.label}` })
    navigate(mod.to)
  }

  const recentModules = [...new Set(activities.map(a => a.module))].slice(0, 4)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#08080f' }}>
      {/* Subtle grid bg */}
      <div className="absolute inset-0 grid-bg-fine opacity-60 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(124,58,237,0.06), transparent 70%)' }} />

      <div className="relative flex flex-col h-full">
        {/* Hero */}
        <div className="px-8 pt-7 pb-5">
          <div className="flex items-start justify-between">
            <div className="slide-up">
              <h1 className="text-2xl font-black text-white tracking-tight shimmer-text mb-1">Dashboard</h1>
              <p className="text-white/20 text-[13px]">
                All-in-one security toolkit —
                <span className="text-purple-400/60 font-mono ml-1">{activities.length}</span> scans this session
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/15 bg-purple-500/5">
              <div className={`w-1.5 h-1.5 rounded-full ${pythonStatus === 'online' ? 'bg-purple-400 dot-glow text-purple-400' : pythonStatus === 'offline' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`} />
              <span className={`text-[10px] font-mono font-semibold ${pythonStatus === 'online' ? 'text-purple-300' : pythonStatus === 'offline' ? 'text-red-400' : 'text-blue-400'}`}>
                ENGINE {pythonStatus?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-8 grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Engine',      value: pythonStatus, mono: false, color: pythonStatus === 'online' ? 'text-purple-300' : pythonStatus === 'offline' ? 'text-red-400' : 'text-blue-400' },
            { label: 'Uptime',      value: fmtUptime(uptime), mono: true,  color: 'text-white/50' },
            { label: 'Total Scans', value: activities.length,  mono: false, color: 'text-white' },
            { label: 'Tools',       value: '22',               mono: false, color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="glow-card p-3.5 rounded-xl bg-white/[0.02] scale-in" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-white/15 text-[10px] font-medium uppercase tracking-wider mb-1.5">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.mono ? 'font-mono' : ''} ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Module grid */}
        <div className="px-8 mb-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold mb-3">Modules</p>
          <div className="grid grid-cols-2 gap-3">
            {MODULES.map((mod, i) => (
              <button key={mod.to} onClick={() => handleModuleClick(mod)}
                className="relative overflow-hidden flex items-start gap-4 p-5 rounded-xl text-left group cursor-pointer scale-in"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(255,255,255,0.06)`,
                  transition: 'all 0.25s ease',
                  animationDelay: `${i * 80}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = `1px solid ${mod.border}`
                  e.currentTarget.style.boxShadow = `0 0 20px ${mod.glow}, 0 4px 20px rgba(0,0,0,0.3)`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.transform = ''
                }}>

                {/* Gradient bg on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: `radial-gradient(ellipse at top left, ${mod.glow}, transparent 60%)` }} />

                {/* Module icon */}
                <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  style={{ background: mod.gradient }}>
                  <span className="text-white text-xl">{mod.icon}</span>
                </div>

                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-[14px]">{mod.label}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/15">{mod.count}</span>
                  </div>
                  <p className="text-white/20 text-[11px] leading-relaxed">{mod.desc}</p>
                </div>

                <div className="relative text-white/10 group-hover:text-white/40 transition-colors self-center text-lg">›</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="px-8 pb-4 flex-1 flex gap-3 min-h-0">
          {/* Activity feed */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold">Recent Activity</p>
              {activities.length > 0 && (
                <button onClick={() => useActivityStore.getState().clearActivities()}
                  className="text-white/10 text-[10px] hover:text-white/35 transition-colors">clear</button>
              )}
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.05] overflow-y-auto bg-white/[0.01]">
              {activities.length === 0 ? (
                <div className="h-full flex items-center justify-center min-h-[100px]">
                  <p className="text-white/8 text-[11px] font-mono">no scans yet</p>
                </div>
              ) : activities.slice(0, 15).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/10 text-[10px] font-mono shrink-0 w-16">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-[1px] rounded font-mono shrink-0
                    ${a.module === 'recon'    ? 'text-blue-400 bg-blue-400/10' :
                      a.module === 'web'      ? 'text-purple-400 bg-purple-400/10' :
                      a.module === 'network'  ? 'text-indigo-400 bg-indigo-400/10' :
                      'text-cyan-400 bg-cyan-400/10'}`}>
                    {a.module}
                  </span>
                  <span className="text-white/35 text-[11px] truncate">{a.tool}</span>
                  <span className="text-white/12 text-[11px] truncate ml-auto font-mono">{a.target}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="w-56 flex flex-col gap-3 shrink-0">
            {/* Tip */}
            <div className="p-3.5 rounded-xl border"
              style={{ background: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.12)' }}>
              <p className="text-purple-400/50 text-[10px] font-bold uppercase tracking-widest mb-1.5 font-mono">Tip</p>
              <p className="text-white/25 text-[11px] leading-relaxed">{tip}</p>
            </div>

            {/* Used modules */}
            {recentModules.length > 0 && (
              <div className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                <p className="text-white/15 text-[10px] font-semibold uppercase tracking-wider mb-2">Used Modules</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentModules.map(m => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/25">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Version */}
            <div className="mt-auto p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-white/10 text-[10px] font-mono">Nexus v1.1.0</span>
                <span className="text-[10px] font-mono font-bold"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  22 tools
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
