import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useApi } from '../../hooks/useApi'

const PAGE_NAMES = {
  '/':         'Dashboard',
  '/recon':    'Reconnaissance',
  '/web':      'Web Exploitation',
  '/network':  'Network Analysis',
  '/password': 'Password & Auth',
}

const PAGE_COLORS = {
  '/recon':    { from: '#3b82f6', to: '#6366f1' },
  '/web':      { from: '#a855f7', to: '#7c3aed' },
  '/network':  { from: '#6366f1', to: '#4f46e5' },
  '/password': { from: '#06b6d4', to: '#3b82f6' },
}

export function Topbar() {
  const location = useLocation()
  const { pythonStatus, setPythonStatus } = useSettingsStore()
  const { health } = useApi()

  useEffect(() => {
    async function check() {
      const ok = await health()
      setPythonStatus(ok ? 'online' : 'offline')
    }
    check()
    const t = setInterval(check, 3000)
    return () => clearInterval(t)
  }, [health])

  const page = PAGE_NAMES[location.pathname] || 'Nexus'
  const pageColor = PAGE_COLORS[location.pathname]

  return (
    <header className="h-11 flex items-center px-4 border-b border-white/[0.05] drag-region shrink-0 bg-[#07070e]">
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.25), rgba(59,130,246,0.2), transparent)' }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="relative w-6 h-6 rounded-lg flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <span className="text-white text-[11px] font-bold relative z-10">N</span>
          <div className="absolute inset-0 rounded-lg opacity-60 blur-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }} />
        </div>
        <span className="text-white font-bold text-[14px] tracking-tight shimmer-text">Nexus</span>
      </div>

      {/* Divider */}
      <span className="text-white/8 mx-3 text-xs select-none">|</span>

      {/* Breadcrumb */}
      <span
        className="text-[12px] font-medium"
        style={pageColor
          ? { background: `linear-gradient(90deg, ${pageColor.from}, ${pageColor.to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
          : { color: 'rgba(255,255,255,0.3)' }}
      >{page}</span>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3 no-drag">
        {/* Status pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-300
          ${pythonStatus === 'online'
            ? 'border-purple-500/20 bg-purple-500/5 text-purple-300'
            : pythonStatus === 'offline'
            ? 'border-red-500/20 bg-red-500/5 text-red-400'
            : 'border-blue-500/15 bg-blue-500/5 text-blue-400'
          }`}>
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${
            pythonStatus === 'online'  ? 'bg-purple-400 dot-glow text-purple-400' :
            pythonStatus === 'offline' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'
          }`} />
          <span className="font-mono">{pythonStatus}</span>
        </div>

        {/* Window controls */}
        {window.nexus && (
          <div className="flex gap-1.5 ml-1">
            <button onClick={() => window.nexus.minimize()}
              className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-yellow-400/80 transition-all duration-150 hover:scale-110" />
            <button onClick={() => window.nexus.maximize()}
              className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-green-400/80 transition-all duration-150 hover:scale-110" />
            <button onClick={() => window.nexus.close()}
              className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-red-400/80 transition-all duration-150 hover:scale-110" />
          </div>
        )}
      </div>
    </header>
  )
}
