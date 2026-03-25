import { useEffect, useState } from 'react'
import { useToastStore } from '../store/toastStore'

const TYPE_CONFIG = {
  success: { border: 'var(--green)',  dot: 'var(--green)',  label: 'OK'   },
  error:   { border: 'var(--red)',    dot: 'var(--red)',    label: 'ERR'  },
  warn:    { border: 'var(--orange)', dot: 'var(--orange)', label: 'WARN' },
  info:    { border: 'var(--accent-hi)', dot: 'var(--accent-hi)', label: 'INFO' },
}

/* ─── Progress bar ───────────────────────────────────── */
function ProgressBar({ duration, color, paused }) {
  const [pct, setPct] = useState(100)

  useEffect(() => {
    if (paused || duration <= 0) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 1 - elapsed / duration) * 100
      setPct(remaining)
      if (remaining > 0) raf = requestAnimationFrame(tick)
    }
    let raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, paused])

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
      background: 'rgba(255,255,255,0.05)', borderRadius: '0 0 var(--r-xl) var(--r-xl)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', background: color,
        width: `${pct}%`, transition: 'width 0.1s linear',
        opacity: 0.6,
      }} />
    </div>
  )
}

/* ─── Single toast ───────────────────────────────────── */
function Toast({ toast }) {
  const removeToast = useToastStore(s => s.removeToast)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => removeToast(toast.id), 280)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--r-xl)',
        padding: '12px 36px 14px 14px',
        minWidth: 280, maxWidth: 360,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 20px ${cfg.border}20`,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(32px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        cursor: 'default',
      }}>

      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 20, height: 20, borderRadius: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-4)', fontSize: 14, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.1s, background 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'none' }}>
        ×
      </button>

      {/* Content row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Colored dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: cfg.dot,
          flexShrink: 0, marginTop: 5,
          boxShadow: `0 0 8px ${cfg.dot}`,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <p style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
              letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: toast.message ? 3 : 0,
            }}>
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p style={{
              fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
              wordBreak: 'break-word',
            }}>
              {toast.message}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar duration={toast.duration} color={cfg.dot} paused={hovered} />
    </div>
  )
}

/* ─── Toast container ────────────────────────────────── */
export function Toasts() {
  const toasts = useToastStore(s => s.toasts)

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      zIndex: 9998,
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={t} />
        </div>
      ))}
    </div>
  )
}
