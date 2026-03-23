import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { useLogStore } from '../store/logStore'
import { useApi } from '../hooks/useApi'

const MODULES = [
  { to: '/recon',    label: 'Reconnaissance',   desc: 'DNS, WHOIS, Ports, Subdomains, Fingerprint',  icon: '◉', count: 5, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
  { to: '/web',      label: 'Web Exploitation',  desc: 'Headers, DirBrute, SQLi, XSS scanning',      icon: '◈', count: 4, color: 'violet',  gradient: 'from-violet-500 to-purple-600' },
  { to: '/network',  label: 'Network Analysis',   desc: 'Services, ARP, Mapper, Packet capture',     icon: '⬡', count: 4, color: 'amber',   gradient: 'from-amber-500 to-orange-600' },
  { to: '/password', label: 'Password Cracking', desc: 'Hash ID, Cracker, Wordlist, Credentials',    icon: '◆', count: 4, color: 'rose',    gradient: 'from-rose-500 to-pink-600' },
]

const TIPS = [
  'Press Ctrl+Shift+A to open the admin panel',
  'All scan activity is logged for audit review',
  'Export results as JSON, CSV, or TXT',
  'Use the built-in wordlists or bring your own',
  'Only scan targets you have authorization for',
]

export function Dashboard() {
  const navigate = useNavigate()
  const activities = useActivityStore((s) => s.activities)
  const pythonStatus = useSettingsStore((s) => s.pythonStatus)
  const addLog = useLogStore((s) => s.addLog)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtUptime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  function handleModuleClick(mod) {
    addLog('module_open', { module: mod.label, detail: `Opened ${mod.label}` })
    navigate(mod.to)
  }

  const recentModules = [...new Set(activities.map(a => a.module))].slice(0, 4)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero */}
      <div className="px-8 pt-7 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            </div>
            <p className="text-white/25 text-[13px]">All-in-one security toolkit — {activities.length} scans this session</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-8 grid grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] group hover:border-white/[0.1] transition-all">
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Engine</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${pythonStatus === 'online' ? 'bg-emerald-400 dot-glow text-emerald-400' : pythonStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className={`text-sm font-semibold ${pythonStatus === 'online' ? 'text-emerald-400' : pythonStatus === 'offline' ? 'text-red-400' : 'text-amber-400'}`}>
              {pythonStatus}
            </span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Uptime</p>
          <p className="text-sm font-mono text-white/60">{fmtUptime(uptime)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Total Scans</p>
          <p className="text-sm font-semibold text-white">{activities.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Tools</p>
          <p className="text-sm font-semibold text-white">17</p>
        </div>
      </div>

      {/* Module grid */}
      <div className="px-8 mb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 font-semibold mb-3">Modules</p>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((mod) => (
            <button key={mod.to} onClick={() => handleModuleClick(mod)}
              className="relative overflow-hidden flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]
                hover:border-white/[0.12] transition-all duration-300 text-left group">
              {/* Gradient bg on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />

              <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                <span className="text-white text-lg">{mod.icon}</span>
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-semibold text-[14px]">{mod.label}</h3>
                  <span className="text-[10px] font-mono text-white/15 bg-white/[0.04] px-2 py-0.5 rounded-full">{mod.count}</span>
                </div>
                <p className="text-white/25 text-[11px] leading-relaxed">{mod.desc}</p>
              </div>
              <div className="relative text-white/10 group-hover:text-white/30 transition-colors self-center">
                ›
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom section: Activity + Tip */}
      <div className="px-8 pb-4 flex-1 flex gap-3 min-h-0">
        {/* Activity feed */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 font-semibold">Recent Activity</p>
            {activities.length > 0 && (
              <button onClick={() => useActivityStore.getState().clearActivities()}
                className="text-white/15 text-[10px] hover:text-white/40 transition-colors">clear</button>
            )}
          </div>
          <div className="flex-1 rounded-xl border border-white/[0.06] overflow-y-auto bg-white/[0.01]">
            {activities.length === 0 ? (
              <div className="h-full flex items-center justify-center min-h-[100px]">
                <div className="text-center">
                  <p className="text-white/8 text-[11px] font-mono">no scans yet</p>
                </div>
              </div>
            ) : activities.slice(0, 15).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <span className="text-white/10 text-[10px] font-mono shrink-0 w-16">
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-[1px] rounded shrink-0
                  ${a.module === 'recon' ? 'text-emerald-400 bg-emerald-400/10' :
                    a.module === 'web' ? 'text-violet-400 bg-violet-400/10' :
                    a.module === 'network' ? 'text-amber-400 bg-amber-400/10' :
                    'text-rose-400 bg-rose-400/10'}`}>
                  {a.module}
                </span>
                <span className="text-white/40 text-[11px] truncate">{a.tool}</span>
                <span className="text-white/15 text-[11px] truncate ml-auto font-mono">{a.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="w-56 flex flex-col gap-3 shrink-0">
          {/* Tip */}
          <div className="p-3.5 rounded-xl bg-violet-500/[0.04] border border-violet-500/[0.08]">
            <p className="text-violet-400/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Tip</p>
            <p className="text-white/30 text-[11px] leading-relaxed">{tip}</p>
          </div>

          {/* Quick stats */}
          {recentModules.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-white/20 text-[10px] font-semibold uppercase tracking-wider mb-2">Used Modules</p>
              <div className="flex flex-wrap gap-1.5">
                {recentModules.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/30">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Version */}
          <div className="mt-auto p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="text-white/10 text-[10px] font-mono">Nexus v1.0.0</span>
              <span className="text-white/10 text-[10px] font-mono">17 tools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
