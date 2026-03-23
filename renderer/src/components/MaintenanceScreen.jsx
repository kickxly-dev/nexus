import { useSettingsStore } from '../store/settingsStore'

export function MaintenanceScreen() {
  const message = useSettingsStore((s) => s.maintenanceMessage)
  const threatLevel = useSettingsStore((s) => s.threatLevel)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07070a]">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(600px circle at 50% 50%, rgba(239,68,68,0.06), transparent 60%)' }} />

      <div className="relative flex flex-col items-center gap-8 max-w-md text-center px-8">
        {/* Lock icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 opacity-20 blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">System Locked</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 text-[11px] font-semibold uppercase tracking-wider">Maintenance Mode Active</span>
          </div>
          <p className="text-white/30 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Info card */}
        <div className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider">Threat Level</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${threatLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                threatLevel === 'elevated' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'}`}>
              {threatLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-white/15 text-[11px]">All tools and scanning capabilities have been disabled by an administrator. Press Ctrl+Shift+A to access admin controls.</p>
        </div>

        {/* ASCII decoration */}
        <pre className="text-red-500/[0.08] text-[9px] font-mono leading-tight select-none">
{`  ╔════════════════════════════╗
  ║   MAINTENANCE MODE ACTIVE   ║
  ║   ALL SYSTEMS LOCKED DOWN   ║
  ╚════════════════════════════╝`}
        </pre>
      </div>
    </div>
  )
}
