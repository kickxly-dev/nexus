import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

const DISMISSED_KEY = 'nexus-deps-dismissed'

export function DepChecker() {
  const port = useSettingsStore(s => s.port)
  const [missing, setMissing] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (!port) return
    fetch(`http://127.0.0.1:${port}/api/system/deps`)
      .then(r => r.json())
      .then(data => {
        const notInstalled = Object.values(data).filter(d => !d.installed && !dismissed.includes(d.name))
        setMissing(notInstalled)
      })
      .catch(() => {}) // silent fail — backend may not be ready yet
  }, [port])

  function dismiss(name) {
    const next = [...dismissed, name]
    setDismissed(next)
    setMissing(m => m.filter(t => t.name !== name))
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(next)) } catch {}
  }

  if (missing.length === 0) return null

  return (
    <div style={{
      background: 'rgba(255,122,0,0.06)',
      borderBottom: '1px solid rgba(255,122,0,0.18)',
      padding: '7px 18px',
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'rgba(255,122,0,0.8)',
        fontFamily: "'JetBrains Mono', monospace",
        flexShrink: 0,
      }}>
        Missing tools:
      </span>
      {missing.map(tool => (
        <div key={tool.name} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,122,0,0.08)',
          border: '1px solid rgba(255,122,0,0.2)',
          borderRadius: 6, padding: '2px 8px 2px 9px',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,200,100,0.9)', fontWeight: 500 }}>
            {tool.name}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            — needed for {tool.required_for.join(', ')}
          </span>
          <a
            href={tool.install}
            target="_blank" rel="noreferrer"
            style={{
              fontSize: 10, color: 'rgba(255,122,0,0.7)',
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: 'none', marginLeft: 2,
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,180,80,1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,122,0,0.7)'}
          >
            install ↗
          </a>
          <button
            onClick={() => dismiss(tool.name)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.25)', fontSize: 13, lineHeight: 1,
              padding: '0 0 0 2px', transition: 'color 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
