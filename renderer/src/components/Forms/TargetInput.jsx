import { useState, useRef, useEffect, useCallback } from 'react'
import { useTargetHistoryStore } from '../../store/targetHistoryStore'

const labelStyle = {
  display: 'block',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  marginBottom: 5,
  fontFamily: "'JetBrains Mono', monospace",
}

const inputBase = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text-1)',
  fontSize: 12,
  fontFamily: 'inherit',
  letterSpacing: '-0.012em',
  padding: '7px 36px 7px 10px',
  outline: 'none',
  transition: 'border-color 0.12s, box-shadow 0.12s',
  boxSizing: 'border-box',
}

/* ─── Clock icon (SVG inline) ────────────────────────── */
function ClockIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4" />
      <path d="M8 4.5V8l2.5 1.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── TargetInput ─────────────────────────────────────── */
export function TargetInput({ label, value, onChange, toolId, placeholder = 'Enter target...', disabled }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const addTarget = useTargetHistoryStore(s => s.addTarget)
  const clearHistory = useTargetHistoryStore(s => s.clearHistory)
  const historyRaw = useTargetHistoryStore(s => s.history)
  const history = historyRaw[toolId] || []

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleInputFocus() {
    if (history.length > 0) setOpen(true)
  }

  function handleInputChange(e) {
    onChange(e.target.value)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter') {
      if (value?.trim()) addTarget(toolId, value)
      setOpen(false)
    }
  }

  function handleBlur() {
    // Slight delay so click on dropdown item fires first
    setTimeout(() => {
      if (value?.trim()) addTarget(toolId, value)
    }, 150)
  }

  function selectItem(item) {
    onChange(item)
    setOpen(false)
  }

  function handleClear(e) {
    e.stopPropagation()
    clearHistory(toolId)
    setOpen(false)
  }

  const [focused, setFocused] = useState(false)

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); handleInputFocus() }}
          onBlur={() => { setFocused(false); handleBlur() }}
          onKeyDown={handleKeyDown}
          style={{
            ...inputBase,
            opacity: disabled ? 0.35 : 1,
            borderColor: focused ? 'var(--border-accent)' : 'var(--border)',
            boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
          }}
        />

        {/* History toggle button */}
        {history.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            title="Recent targets"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: open ? 'var(--accent-light)' : 'var(--text-4)',
              display: 'flex', alignItems: 'center',
              padding: '2px',
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => { if (!open) e.currentTarget.style.color = 'var(--text-2)' }}
            onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'var(--text-4)' }}>
            <ClockIcon size={13} color="currentColor" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && history.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 100,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {/* Items */}
          {history.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); selectItem(item) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                textAlign: 'left',
                transition: 'background 0.08s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <span style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                <ClockIcon size={11} color="currentColor" />
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, color: 'var(--text-2)', letterSpacing: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, minWidth: 0,
              }}>
                {item}
              </span>
            </button>
          ))}

          {/* Clear history */}
          <button
            type="button"
            onMouseDown={handleClear}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '6px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.08s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
            <span style={{
              fontSize: 10, color: 'var(--text-4)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
              transition: 'color 0.08s',
            }}>
              clear history
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
