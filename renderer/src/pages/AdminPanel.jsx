import { useState } from 'react'
import { useLogStore } from '../store/logStore'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { ToggleSwitch } from '../components/Forms/index'

const TABS = ['Audit Log', 'Sessions', 'Controls', 'System']

export function AdminPanel({ onClose }) {
  const [tab, setTab]       = useState('Audit Log')
  const [filter, setFilter] = useState('')
  const [mainMsg, setMainMsg] = useState('')

  const logs      = useLogStore((s) => s.logs)
  const clearLogs = useLogStore((s) => s.clearLogs)
  const exportLogs = useLogStore((s) => s.exportLogs)
  const activities = useActivityStore((s) => s.activities)

  const {
    pythonStatus, port, platform,
    maintenanceMode, maintenanceMessage, setMaintenanceMode,
    threatLevel, setThreatLevel,
    lockoutEnabled, setLockoutEnabled,
    maxFailedScans, failedScanCount, resetFailedScans,
  } = useSettingsStore()

  const filtered = filter
    ? logs.filter(l => l.action?.toLowerCase().includes(filter.toLowerCase()) || JSON.stringify(l).toLowerCase().includes(filter.toLowerCase()))
    : logs

  const TAB_ICONS = {
    'Audit Log': '⊟',
    'Sessions':  '⊡',
    'Controls':  '⊛',
    'System':    '⊞',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-[960px] max-h-[720px] rounded-2xl overflow-hidden shadow-2xl flex flex-col scale-in"
        style={{ background: '#0a0a14', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 0 60px rgba(124,58,237,0.15), 0 25px 50px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Purple-blue top accent */}
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #2563eb, transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <span className="text-white text-sm font-black">A</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-[14px]">Admin Panel</h2>
              <p className="text-white/20 text-[10px] font-mono">CTRL+SHIFT+A to toggle · Authorized access only</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {maintenanceMode && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/25 bg-red-500/8">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span className="text-red-400 text-[10px] font-bold font-mono tracking-wider">MAINTENANCE ON</span>
              </div>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all text-lg">
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-3 border-b border-white/[0.05]">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium transition-all relative
                ${tab === t ? 'text-white' : 'text-white/25 hover:text-white/50'}`}>
              <span className="opacity-60">{TAB_ICONS[t]}</span>
              {t}
              {tab === t && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 fade-in">

          {/* ── AUDIT LOG ── */}
          {tab === 'Audit Log' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input value={filter} onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter logs by action or content..."
                  className="flex-1 rounded-lg px-3 py-2 text-white/80 text-[12px] placeholder-white/12 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
                <button onClick={exportLogs}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
                  style={{ background: 'rgba(124,58,237,0.1)', color: 'rgba(167,139,250,0.7)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  Export JSON
                </button>
                <button onClick={clearLogs}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.6)', border: '1px solid rgba(239,68,68,0.12)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Clear
                </button>
              </div>
              <div className="text-white/12 text-[10px] font-mono">{filtered.length} entries</div>
              <div className="flex flex-col gap-0.5">
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-white/10 text-sm font-mono">No logs recorded yet</p>
                  </div>
                ) : filtered.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <span className="text-white/10 text-[10px] font-mono shrink-0 pt-0.5 w-20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-[1px] rounded shrink-0
                      ${log.action?.includes('error') || log.action?.includes('fail') || log.action?.includes('crash')
                        ? 'text-red-400 bg-red-400/10'
                        : log.action?.includes('scan') || log.action?.includes('run')
                        ? 'text-purple-400 bg-purple-400/10'
                        : 'text-white/25 bg-white/[0.04]'}`}>
                      {log.action}
                    </span>
                    <span className="text-white/35 text-[11px] truncate flex-1">
                      {log.module && `[${log.module}] `}{log.tool && `${log.tool} `}
                      {log.target && `→ ${log.target}`}{log.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SESSIONS ── */}
          {tab === 'Sessions' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Scans',   value: activities.length },
                  { label: 'Audit Events',  value: logs.length },
                  { label: 'Modules Used',  value: new Set(activities.map(a => a.module)).size },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-white/15 text-[10px] font-medium uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/[0.05] overflow-hidden">
                <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
                  <p className="text-white/30 text-[11px] font-bold uppercase tracking-wider">Recent Activity</p>
                </div>
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-white/10 text-sm font-mono">No sessions recorded</div>
                ) : activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <span className="text-white/10 text-[10px] font-mono w-20 shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full shrink-0
                      ${a.module === 'recon'    ? 'text-blue-400 bg-blue-400/10' :
                        a.module === 'web'      ? 'text-purple-400 bg-purple-400/10' :
                        a.module === 'network'  ? 'text-indigo-400 bg-indigo-400/10' :
                        'text-cyan-400 bg-cyan-400/10'}`}>
                      {a.module}
                    </span>
                    <span className="text-white/40 text-[11px] truncate">{a.tool}: {a.target}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTROLS ── */}
          {tab === 'Controls' && (
            <div className="flex flex-col gap-4">
              <p className="text-white/15 text-[11px]">Configure runtime behavior and security posture.</p>

              {/* Maintenance mode */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="mb-4">
                  <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-1">Maintenance Mode</p>
                  <p className="text-white/20 text-[11px]">Locks down all tools and shows a maintenance screen to users.</p>
                </div>
                <ToggleSwitch
                  label="Enable Maintenance Mode"
                  description={maintenanceMode ? 'System is currently locked' : 'System is operational'}
                  checked={maintenanceMode}
                  onChange={(v) => setMaintenanceMode(v, mainMsg || undefined)}
                />
                {maintenanceMode && (
                  <div className="mt-3 p-2.5 rounded-lg border border-red-500/15 bg-red-500/5">
                    <p className="text-red-400/60 text-[10px] font-mono">⚠ ALL TOOLS DISABLED — Users see maintenance screen</p>
                  </div>
                )}
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-white/20 text-[11px]">Custom message</label>
                  <input
                    value={mainMsg}
                    onChange={e => setMainMsg(e.target.value)}
                    placeholder={maintenanceMessage}
                    className="w-full rounded-lg px-3 py-2 text-white/70 text-[12px] placeholder-white/10 focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  />
                </div>
              </div>

              {/* Threat level */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-3">Threat Level</p>
                <div className="flex gap-2">
                  {['normal', 'elevated', 'critical'].map(level => (
                    <button key={level} onClick={() => setThreatLevel(level)}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all`}
                      style={threatLevel === level ? {
                        background: level === 'normal'   ? 'rgba(124,58,237,0.2)'  :
                                    level === 'elevated' ? 'rgba(245,158,11,0.2)'  : 'rgba(239,68,68,0.2)',
                        color: level === 'normal'   ? '#a855f7' :
                               level === 'elevated' ? '#f59e0b' : '#ef4444',
                        border: `1px solid ${level === 'normal' ? 'rgba(124,58,237,0.3)' : level === 'elevated' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        boxShadow: `0 0 12px ${level === 'normal' ? 'rgba(124,58,237,0.15)' : level === 'elevated' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.15)'}`,
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lockout */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-3">Security Controls</p>
                <div className="flex flex-col gap-3">
                  <ToggleSwitch
                    label="Scan Lockout"
                    description={`Auto-lockout after ${maxFailedScans} failed scans (${failedScanCount} so far)`}
                    checked={lockoutEnabled}
                    onChange={setLockoutEnabled}
                  />
                  {failedScanCount > 0 && (
                    <button onClick={resetFailedScans}
                      className="self-start px-3 py-1.5 rounded-lg text-[11px] transition-all hover:scale-105"
                      style={{ background: 'rgba(124,58,237,0.1)', color: 'rgba(167,139,250,0.7)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      Reset Failed Count ({failedScanCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Danger zone */}
              <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
                <p className="text-red-400/50 text-[11px] font-bold uppercase tracking-wider mb-3">Danger Zone</p>
                <div className="flex gap-2">
                  <button onClick={() => { useActivityStore.getState().clearActivities(); useLogStore.getState().clearLogs() }}
                    className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.6)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {tab === 'System' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Engine Status',
                    content: (
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${pythonStatus === 'online' ? 'bg-purple-400 dot-glow text-purple-400' : pythonStatus === 'offline' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`} />
                        <span className={`text-sm font-bold font-mono ${pythonStatus === 'online' ? 'text-purple-300' : pythonStatus === 'offline' ? 'text-red-400' : 'text-blue-400'}`}>
                          {pythonStatus?.toUpperCase()}
                        </span>
                      </div>
                    )
                  },
                  { label: 'Backend Port', content: <p className="text-sm font-mono text-white/50 mt-1">{port || 'N/A'}</p> },
                  { label: 'Platform',     content: <p className="text-sm font-mono text-white/50 mt-1">{navigator.platform}</p> },
                  { label: 'Memory',       content: <p className="text-sm font-mono text-white/50 mt-1">{navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A'}</p> },
                  { label: 'Total Tools',  content: <p className="text-2xl font-black mt-1" style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>22</p> },
                  { label: 'Version',      content: <p className="text-sm font-mono text-white/50 mt-1">v1.1.0</p> },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-white/15 text-[10px] font-medium uppercase tracking-wider">{item.label}</p>
                    {item.content}
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-white/15 text-[10px] font-medium uppercase tracking-wider mb-2">User Agent</p>
                <p className="text-[11px] font-mono text-white/25 break-all leading-relaxed">{navigator.userAgent}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
