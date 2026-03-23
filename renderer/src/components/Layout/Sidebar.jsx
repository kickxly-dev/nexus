import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',         label: 'Dashboard', icon: '⌘', exact: true },
  { to: '/recon',    label: 'Recon',     icon: '◉', color: 'blue',   tools: 7 },
  { to: '/web',      label: 'Web',       icon: '◈', color: 'purple', tools: 5 },
  { to: '/network',  label: 'Network',   icon: '⬡', color: 'indigo', tools: 4 },
  { to: '/password', label: 'Password',  icon: '◆', color: 'cyan',   tools: 6 },
  { to: '/osint',    label: 'OSINT',     icon: '◎', color: 'violet', tools: 4 },
]

const BOTTOM_NAV = [
  { to: '/settings', label: 'Settings', icon: '⊙' },
]

const COLOR_MAP = {
  blue:   { text: 'text-blue-400',   glow: 'rgba(59,130,246,0.6)',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  purple: { text: 'text-purple-400', glow: 'rgba(168,85,247,0.6)',   bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  indigo: { text: 'text-indigo-400', glow: 'rgba(99,102,241,0.6)',   bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  cyan:   { text: 'text-cyan-400',   glow: 'rgba(34,211,238,0.6)',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  violet: { text: 'text-violet-400', glow: 'rgba(139,92,246,0.6)',   bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
}

function NavItem({ to, label, icon, exact, color, tools }) {
  const cfg = COLOR_MAP[color]
  return (
    <NavLink to={to} end={exact}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] transition-all duration-200 group overflow-hidden
         ${isActive ? 'text-white font-medium' : 'text-white/28 hover:text-white/65 hover:bg-white/[0.03]'}`
      }
      style={({ isActive }) => isActive ? {
        background: cfg ? `rgba(${cfg.glow.match(/[\d.]+/g).slice(0,3).join(',')}, 0.08)` : 'rgba(255,255,255,0.06)',
        boxShadow: cfg ? `inset 2px 0 0 ${cfg.glow}, 0 0 12px rgba(0,0,0,0.2)` : '',
        border: cfg ? `1px solid rgba(${cfg.glow.match(/[\d.]+/g).slice(0,3).join(',')}, 0.12)` : '',
        borderLeft: 'none',
      } : {}}
    >
      {({ isActive }) => (
        <>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.01), transparent)' }} />

          <span className="text-sm transition-all duration-200 relative z-10"
            style={isActive && cfg
              ? { color: cfg.text.replace('text-','').replace('-400',''), filter: `drop-shadow(0 0 5px ${cfg.glow})` }
              : { opacity: 0.22 }}>
            {icon}
          </span>

          <span className="flex-1 relative z-10">{label}</span>

          {tools && (
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full relative z-10 transition-all
              ${isActive && cfg ? `${cfg.text} ${cfg.bg} ${cfg.border} border font-bold` : 'text-white/10 bg-white/[0.03]'}`}>
              {tools}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-52 border-r border-white/[0.05] shrink-0" style={{ background: '#07070e' }}>
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(59,130,246,0.2), transparent)' }} />

      <div className="p-3 flex-1">
        <p className="text-[9px] uppercase tracking-[0.25em] text-white/12 font-semibold px-3 mb-2.5">Modules</p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(item => <NavItem key={item.to} {...item} />)}
        </nav>
      </div>

      <div className="p-3 border-t border-white/[0.04]">
        <nav className="flex flex-col gap-0.5 mb-3">
          {BOTTOM_NAV.map(item => <NavItem key={item.to} {...item} />)}
        </nav>
        <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), rgba(59,130,246,0.15), transparent)' }} />
        <div className="px-3 flex items-center justify-between">
          <span className="text-[10px] text-white/10 font-mono">v1.1.0</span>
          <span className="text-[10px] font-mono font-bold"
            style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            26 tools
          </span>
        </div>
      </div>
    </aside>
  )
}
