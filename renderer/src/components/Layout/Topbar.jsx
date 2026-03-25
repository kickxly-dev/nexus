import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useApi } from '../../hooks/useApi'

const PAGE_LABELS = {
  '/':          'Dashboard',
  '/recon':     'Reconnaissance',
  '/web':       'Web Exploitation',
  '/network':   'Network Analysis',
  '/password':  'Password & Auth',
  '/osint':     'OSINT',
  '/settings':  'Settings',
}

export function Topbar() {
  const { pathname } = useLocation()
  const { pythonStatus, setPythonStatus } = useSettingsStore()
  const { health } = useApi()

  useEffect(() => {
    const check = async () => setPythonStatus(await health() ? 'online' : 'offline')
    check()
    const t = setInterval(check, 5000)
    return () => clearInterval(t)
  }, [])

  const online = pythonStatus === 'online'

  return (
    <header className="drag-region select-none shrink-0" style={{
      height: 40,
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
    }}>

      {/* Window controls (Electron only) */}
      {window.nexus && (
        <div className="no-drag flex gap-1.5 mr-3">
          {[['close','#ff4757'],['minimize','#ffd700'],['maximize','#00d084']].map(([fn, c]) => (
            <button key={fn} onClick={() => window.nexus[fn]?.()} style={{
              width: 11, height: 11, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)',
              padding: 0, cursor: 'pointer', transition: 'background 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = c; e.currentTarget.style.boxShadow = `0 0 6px ${c}80` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          ))}
        </div>
      )}

      {/* Page title */}
      <div className="no-drag">
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: 'var(--text-4)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {PAGE_LABELS[pathname] ?? 'Nexus'}
        </span>
      </div>

      {/* Right section */}
      <div className="no-drag ml-auto flex items-center gap-3">
        {/* Backend status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px 3px 8px', borderRadius: 99,
          background: online ? 'rgba(0,208,132,0.07)' : 'rgba(255,71,87,0.07)',
          border: `1px solid ${online ? 'rgba(0,208,132,0.2)' : 'rgba(255,71,87,0.2)'}`,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: online ? 'var(--green)' : pythonStatus === 'offline' ? 'var(--red)' : 'var(--yellow)',
            boxShadow: online ? '0 0 6px rgba(0,208,132,0.6)' : 'none',
          }} className={pythonStatus === 'connecting' ? 'pulse-dot' : ''} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: '0.04em',
            color: online ? 'rgba(0,208,132,0.9)' : 'rgba(255,71,87,0.9)',
            fontWeight: 500,
          }}>
            {pythonStatus}
          </span>
        </div>
      </div>
    </header>
  )
}
