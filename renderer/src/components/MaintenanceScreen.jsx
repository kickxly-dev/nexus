import { useSettingsStore } from '../store/settingsStore'

export function MaintenanceScreen() {
  const message     = useSettingsStore((s) => s.maintenanceMessage)
  const threatLevel = useSettingsStore((s) => s.threatLevel)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#06060f' }}>
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Red radial glow */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(700px circle at 50% 50%, rgba(239,68,68,0.08), rgba(124,58,237,0.04), transparent 60%)' }} />

      {/* Scan line */}
      <div className="absolute inset-0 scanline-container pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 max-w-md text-center px-8 fade-in">
        {/* Lock icon */}
        <div className="relative float">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl relative z-10"
            style={{ background: 'linear-gradient(135deg, #dc2626, #7c3aed)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="absolute -inset-3 rounded-3xl opacity-25 blur-2xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, #dc2626, #7c3aed)' }} />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">System Locked</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="text-red-400/80 text-[11px] font-semibold uppercase tracking-widest font-mono">
              Maintenance Mode Active
            </span>
          </div>
          <p className="text-white/25 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Info card */}
        <div className="w-full p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider">Threat Level</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono tracking-wider
              ${threatLevel === 'critical' ? 'text-red-400 bg-red-500/15 border border-red-500/20' :
                threatLevel === 'elevated' ? 'text-amber-400 bg-amber-500/15 border border-amber-500/20' :
                'text-purple-400 bg-purple-500/15 border border-purple-500/20'}`}>
              {threatLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-white/15 text-[11px] text-left leading-relaxed">
            All tools and scanning capabilities have been disabled by an administrator.
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 text-[10px] font-mono">Ctrl+Shift+A</kbd> to access admin controls.
          </p>
        </div>

        <pre className="text-purple-500/[0.06] text-[9px] font-mono leading-tight select-none">
{`  ╔══════════════════════════════╗
  ║   NEXUS :: MAINTENANCE MODE   ║
  ║   ALL SYSTEMS LOCKED DOWN     ║
  ╚══════════════════════════════╝`}
        </pre>
      </div>
    </div>
  )
}
