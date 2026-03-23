import { useState } from 'react'
import { useLogStore } from '../store/logStore'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'

const TABS = ['Audit Log', 'Sessions', 'System']

export function AdminPanel({ onClose }) {
  const [tab, setTab] = useState('Audit Log')
  const logs = useLogStore((s) => s.logs)
  const clearLogs = useLogStore((s) => s.clearLogs)
  const exportLogs = useLogStore((s) => s.exportLogs)
  const activities = useActivityStore((s) => s.activities)
  const pythonStatus = useSettingsStore((s) => s.pythonStatus)
  const port = useSettingsStore((s) => s.port)
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? logs.filter(l => l.action?.toLowerCase().includes(filter.toLowerCase()) || JSON.stringify(l).toLowerCase().includes(filter.toLowerCase()))
    : logs

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-[900px] max-h-[700px] bg-[#0c0c10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Admin Panel</h2>
              <p className="text-white/20 text-[10px] font-mono">CTRL+SHIFT+A to toggle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors text-lg">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-6 pt-3 border-b border-white/[0.06]">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[12px] font-medium rounded-t-lg transition-all
                ${tab === t ? 'bg-white/[0.05] text-white border-b-2 border-violet-500' : 'text-white/30 hover:text-white/50'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'Audit Log' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input value={filter} onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter logs..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white/90 text-[12px] placeholder-white/15 focus:outline-none focus:border-violet-500/50" />
                <button onClick={exportLogs}
                  className="px-3 py-2 rounded-lg bg-white/[0.05] text-white/40 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white/60 transition-all">
                  Export JSON
                </button>
                <button onClick={clearLogs}
                  className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400/60 text-[11px] font-medium hover:bg-red-500/20 hover:text-red-400 transition-all">
                  Clear
                </button>
              </div>
              <div className="text-white/15 text-[10px] font-mono">{filtered.length} entries</div>
              <div className="flex flex-col gap-0.5">
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-white/10 text-sm">No logs recorded yet</p>
                  </div>
                ) : filtered.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group">
                    <span className="text-white/10 text-[10px] font-mono shrink-0 pt-0.5 w-20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-[1px] rounded shrink-0
                      ${log.action?.includes('error') || log.action?.includes('fail')
                        ? 'text-red-400 bg-red-400/10'
                        : log.action?.includes('scan') || log.action?.includes('run')
                        ? 'text-violet-400 bg-violet-400/10'
                        : 'text-white/30 bg-white/[0.04]'}`}>
                      {log.action}
                    </span>
                    <span className="text-white/40 text-[11px] truncate flex-1">
                      {log.module && `[${log.module}] `}
                      {log.tool && `${log.tool} `}
                      {log.target && `→ ${log.target}`}
                      {log.detail && log.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Sessions' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Total Scans</p>
                  <p className="text-2xl font-bold text-white">{activities.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Audit Events</p>
                  <p className="text-2xl font-bold text-white">{logs.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-1">Modules Used</p>
                  <p className="text-2xl font-bold text-white">{new Set(activities.map(a => a.module)).size}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
                  <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">Recent Activity</p>
                </div>
                {activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-white/10 text-[10px] font-mono w-20 shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 shrink-0">
                      {a.module}
                    </span>
                    <span className="text-white/50 text-[11px] truncate">{a.tool}: {a.target}</span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="py-8 text-center text-white/10 text-sm">No sessions recorded</div>
                )}
              </div>
            </div>
          )}

          {tab === 'System' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-2">Engine Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pythonStatus === 'online' ? 'bg-emerald-400 dot-glow text-emerald-400' : pythonStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={`text-sm font-semibold ${pythonStatus === 'online' ? 'text-emerald-400' : pythonStatus === 'offline' ? 'text-red-400' : 'text-amber-400'}`}>
                      {pythonStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-2">Backend Port</p>
                  <p className="text-sm font-mono text-white/60">{port || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-2">Platform</p>
                  <p className="text-sm font-mono text-white/60">{navigator.platform}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-2">Memory</p>
                  <p className="text-sm font-mono text-white/60">
                    {navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-white/20 text-[10px] font-medium uppercase tracking-wider mb-2">User Agent</p>
                <p className="text-[11px] font-mono text-white/30 break-all">{navigator.userAgent}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
