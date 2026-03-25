import { useState, useEffect } from 'react'

const LINES = [
  'nexus-core     loaded',
  'nexus-recon    ready',
  'nexus-web      ready',
  'nexus-network  ready',
  'nexus-password ready',
  'nexus-osint    ready',
]

export function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [fade, setFade]         = useState(false)

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); return 100 }
        return Math.min(p + 1.5 + Math.random() * 2, 100)
      })
    }, 30)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setFade(true), 200)
      setTimeout(() => onComplete(), 650)
    }
  }, [progress, onComplete])

  const pct       = Math.floor(progress)
  const lineCount = Math.floor((pct / 100) * LINES.length)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 36, background: '#040408',
      opacity: fade ? 0 : 1, pointerEvents: fade ? 'none' : 'auto',
      transition: 'opacity 0.45s ease',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(139,92,246,0.3), 0 0 40px rgba(124,58,237,0.6), 0 12px 40px rgba(0,0,0,0.6)',
        }}>
          <span style={{ color: 'white', fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>N</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#ecebff', letterSpacing: '-0.03em' }}>Nexus</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: '#1c1c4c', marginTop: 4, letterSpacing: 0,
          }}>Security Toolkit v{__APP_VERSION__}</p>
        </div>
      </div>

      {/* Boot log */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {LINES.map((line, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: i < lineCount ? 1 : 0.12,
            transition: 'opacity 0.3s',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 0,
              color: i < lineCount ? '#00d084' : '#1c1c4c',
              transition: 'color 0.3s',
            }}>
              {i < lineCount ? '✓' : '·'}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 0,
              color: i < lineCount ? '#5050888' : '#1c1c4c',
              transition: 'color 0.3s',
            }}>{line}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          height: 2, borderRadius: 99, overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #5b21b6, #8b5cf6, #a78bfa)',
            boxShadow: '0 0 12px rgba(139,92,246,0.6)',
            transition: 'width 0.06s linear',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            color: '#1c1c4c', letterSpacing: '0.04em',
          }}>initializing modules</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            color: '#303065', letterSpacing: 0, fontWeight: 600,
          }}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}
