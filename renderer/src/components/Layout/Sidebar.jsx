import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⌘', exact: true },
  { to: '/recon', label: 'Recon', icon: '◉', color: 'emerald' },
  { to: '/web', label: 'Web', icon: '◈', color: 'violet' },
  { to: '/network', label: 'Network', icon: '⬡', color: 'amber' },
  { to: '/password', label: 'Password', icon: '◆', color: 'rose' },
]

const COLOR_MAP = {
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-48 bg-[#08080b] border-r border-white/[0.06] shrink-0">
      <div className="p-3 flex-1">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/15 font-semibold px-3 mb-2">Modules</p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon, exact, color }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 group
                 ${isActive
                   ? 'bg-white/[0.07] text-white font-medium shadow-sm shadow-black/20'
                   : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-sm transition-colors ${isActive && color ? COLOR_MAP[color] : 'opacity-40'}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="px-3 flex items-center justify-between">
          <span className="text-[10px] text-white/10 font-mono">v1.0.0</span>
          <span className="text-[10px] text-white/10 font-mono">17 tools</span>
        </div>
      </div>
    </aside>
  )
}
