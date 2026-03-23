import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',         label: 'Dashboard',   icon: '⌘', exact: true },
  { to: '/recon',    label: 'Recon',        icon: '◉', color: 'blue',   tools: 7 },
  { to: '/web',      label: 'Web',          icon: '◈', color: 'purple', tools: 5 },
  { to: '/network',  label: 'Network',      icon: '⬡', color: 'indigo', tools: 4 },
  { to: '/password', label: 'Password',     icon: '◆', color: 'cyan',   tools: 6 },
]

const COLOR_MAP = {
  blue:   { text: 'text-blue-400',   glow: 'rgba(59,130,246,0.5)',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  purple: { text: 'text-purple-400', glow: 'rgba(168,85,247,0.5)',   bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  indigo: { text: 'text-indigo-400', glow: 'rgba(99,102,241,0.5)',   bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  cyan:   { text: 'text-cyan-400',   glow: 'rgba(34,211,238,0.5)',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-52 bg-[#07070e] border-r border-white/[0.05] shrink-0">
      {/* Top purple accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="p-3 flex-1">
        <p className="text-[9px] uppercase tracking-[0.25em] text-white/12 font-semibold px-3 mb-2.5">Modules</p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon, exact, color, tools }) => {
            const cfg = COLOR_MAP[color]
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] transition-all duration-200 group overflow-hidden
                   ${isActive
                     ? 'bg-white/[0.06] text-white font-medium nav-active-glow'
                     : 'text-white/28 hover:text-white/60 hover:bg-white/[0.03]'
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left bar */}
                    {isActive && color && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                        style={{ background: `linear-gradient(to bottom, transparent, ${cfg?.glow || 'rgba(124,58,237,0.8)'}, transparent)` }}
                      />
                    )}

                    {/* Hover shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.01), transparent)' }} />

                    <span
                      className={`text-sm transition-all duration-200 ${isActive && color ? cfg?.text : 'opacity-25'}`}
                      style={isActive && color ? { filter: `drop-shadow(0 0 4px ${cfg?.glow})` } : {}}
                    >{icon}</span>

                    <span className="flex-1">{label}</span>

                    {tools && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full transition-all
                        ${isActive && color ? `${cfg?.text} ${cfg?.bg} ${cfg?.border} border` : 'text-white/10 bg-white/[0.03]'}`}>
                        {tools}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/[0.04]">
        {/* Purple-blue gradient line */}
        <div className="h-px mb-3 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(59,130,246,0.3), transparent)' }} />
        <div className="px-3 flex items-center justify-between">
          <span className="text-[10px] text-white/10 font-mono">v1.1.0</span>
          <span className="text-[10px] font-mono"
            style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            22 tools
          </span>
        </div>
      </div>
    </aside>
  )
}
