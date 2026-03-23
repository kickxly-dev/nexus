import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useApi } from '../../hooks/useApi'

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/recon': 'Reconnaissance',
  '/web': 'Web Exploitation',
  '/network': 'Network Analysis',
  '/password': 'Password Cracking',
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

  return (
    <header className="h-11 flex items-center px-5 border-b border-white/[0.06] drag-region shrink-0 bg-[#08080b]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm shadow-violet-500/20">
          <span className="text-white text-[10px] font-bold">N</span>
        </div>
        <span className="text-white/80 font-semibold text-[13px] tracking-tight">Nexus</span>
      </div>

      {/* Breadcrumb */}
      <span className="text-white/8 mx-3 text-xs">|</span>
      <span className="text-white/30 text-[12px] font-medium">{page}</span>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3 no-drag">
        {/* Status pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all
          ${pythonStatus === 'online'
            ? 'border-emerald-500/15 bg-emerald-500/5 text-emerald-400'
            : pythonStatus === 'offline'
            ? 'border-red-500/15 bg-red-500/5 text-red-400'
            : 'border-amber-500/15 bg-amber-500/5 text-amber-400'
          }`}>
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            pythonStatus === 'online' ? 'bg-emerald-400 dot-glow text-emerald-400' :
            pythonStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
          }`} />
          {pythonStatus}
        </div>

        {/* Window controls */}
        {window.nexus && (
          <div className="flex gap-1.5 ml-1">
            <button onClick={() => window.nexus.minimize()} className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-yellow-500/80 transition-all" />
            <button onClick={() => window.nexus.maximize()} className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-green-500/80 transition-all" />
            <button onClick={() => window.nexus.close()}    className="w-3 h-3 rounded-full bg-white/[0.06] hover:bg-red-500/80 transition-all" />
          </div>
        )}
      </div>
    </header>
  )
}
