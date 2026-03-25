import { useEffect, useState } from 'react'
import { Icon } from './Icons'
import { StreamOutput } from './Terminal/StreamOutput'
import { useHistoryStore } from '../store/historyStore'

export function ToolPage({ tools, activeTool, onToolChange, configFields, runButton, footer, output, onRun, onStop, onClear, lines: linesForPin, running: runningForPin, toolId, currentTarget }) {
  const active = tools.find(t => t.id === activeTool)
  const [pinnedLines, setPinnedLines] = useState(null)
  const [showDiff, setShowDiff]   = useState(false)
  const getLastForTool = useHistoryStore(s => s.getLastForTool)
  const prevEntry = (toolId && currentTarget) ? getLastForTool(toolId, currentTarget) : null
  const prevLines = prevEntry?.lines ?? null

  const canPin = Array.isArray(linesForPin) && linesForPin.length > 0 && !runningForPin

  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); onRun?.() }
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape') { e.preventDefault(); onStop?.() }
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); onClear?.() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onRun, onStop, onClear])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-app)' }}>

      {/* ─── Left panel ─────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}>

        {/* Tool list */}
        <div style={{
          overflowY: 'auto', padding: '14px 8px 8px',
          borderBottom: '1px solid var(--border)',
          maxHeight: '52%', flexShrink: 0,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--text-5)',
            padding: '0 10px 8px',
          }}>Tools</p>

          {tools.map(t => {
            const isActive = activeTool === t.id
            return (
              <button key={t.id} onClick={() => onToolChange(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 12px',
                  borderRadius: 'var(--r-md)',
                  textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  boxShadow: isActive ? 'inset 3px 0 0 var(--accent-hi)' : 'none',
                  border: 'none',
                  marginBottom: 1,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon name={t.icon} size={13} style={{
                  color: isActive ? 'var(--accent-light)' : 'var(--text-4)',
                  flexShrink: 0, transition: 'color 0.12s',
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: 12, fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                    lineHeight: 1.3, margin: 0, letterSpacing: '-0.012em',
                  }}>
                    {t.label || t.id}
                  </p>
                  {t.desc && (
                    <p style={{
                      fontSize: 10, color: isActive ? 'var(--text-3)' : 'var(--text-4)',
                      lineHeight: 1.4, margin: '1px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.desc}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Config */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 12px 8px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--text-5)',
            padding: '0 0 2px',
          }}>Config</p>
          {configFields}
        </div>

        {/* Run */}
        <div style={{
          padding: '10px 12px 14px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0, background: 'var(--bg-surface)',
        }}>
          {runButton}
          <p style={{
            fontSize: 9, color: 'var(--text-5)', textAlign: 'center',
            marginTop: 9,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.03em',
          }}>
            ⌃↵ run · ⎋ stop · ⌃L clear
          </p>
        </div>
      </div>

      {/* ─── Output panel ────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: '16px',
        gap: 12,
      }}>
        {/* Active tool header */}
        {active && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(124,58,237,0.2)',
              }}>
                <Icon name={active.icon} size={16} style={{ color: 'var(--accent-light)' }} />
              </div>
              <div>
                <p style={{
                  fontSize: 16, fontWeight: 600, color: 'var(--text-1)',
                  lineHeight: 1.2, letterSpacing: '-0.025em',
                }}>
                  {active.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 2 }}>
                  {active.desc}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {canPin && (
                <button
                  onClick={() => setPinnedLines([...linesForPin])}
                  title="Pin current result for comparison"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
                    padding: '3px 8px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', background: 'transparent',
                    transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
                >
                  📌 pin
                </button>
              )}
              {pinnedLines && (
                <button
                  onClick={() => setPinnedLines(null)}
                  title="Clear pinned result"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
                    padding: '3px 8px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', background: 'transparent',
                    transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,71,87,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
                >
                  ✕ unpin
                </button>
              )}
              {prevLines && !runningForPin && linesForPin?.length > 0 && (
                <button
                  onClick={() => setShowDiff(v => !v)}
                  title={showDiff ? 'Close diff view' : 'Compare to previous scan'}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
                    padding: '3px 8px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                    color: showDiff ? 'var(--blue)' : 'var(--text-4)',
                    background: showDiff ? 'rgba(74,158,255,0.08)' : 'transparent',
                    transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { if (!showDiff) { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                  onMouseLeave={e => { if (!showDiff) { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' } }}
                >
                  ⟳ diff
                </button>
              )}
              {showDiff && (
                <button
                  onClick={() => setShowDiff(false)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
                    padding: '3px 8px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', background: 'transparent',
                    transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,71,87,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
                >
                  ✕ close diff
                </button>
              )}
            </div>
          </div>
        )}

        {/* Output area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {output}
          </div>
          {showDiff && prevLines ? (
            <>
              <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <DiffPanel currentLines={linesForPin || []} prevLines={prevLines} onClose={() => setShowDiff(false)} />
              </div>
            </>
          ) : pinnedLines ? (
            <>
              <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <PinnedPanel lines={pinnedLines} onClear={() => setPinnedLines(null)} />
              </div>
            </>
          ) : null}
        </div>

        {footer && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, height: 24,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Diff panel ─────────────────────────────────────────── */
function DiffPanel({ currentLines, prevLines, onClose }) {
  const currentMessages = new Set(currentLines.map(l => l.message))
  const prevMessages    = new Set(prevLines.map(l => l.message))

  const added   = currentLines.filter(l => !prevMessages.has(l.message))
  const removed = prevLines.filter(l => !currentMessages.has(l.message))

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
      borderRadius: 'var(--r-xl)',
      background: '#030307',
      border: '1px solid rgba(74,158,255,0.15)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 38, padding: '0 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(74,158,255,0.04)',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(74,158,255,0.6)', letterSpacing: 0 }}>
          ⟳ Diff · +{added.length} new · -{removed.length} removed
        </span>
        <button onClick={onClose} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', transition: 'color 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>×</button>
      </div>

      {/* Diff content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {added.length > 0 && (
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0,208,132,0.5)', marginBottom: 6 }}>+ New findings ({added.length})</p>
            {added.map((l, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7,
                color: 'rgba(0,208,132,0.9)', padding: '1px 8px',
                borderLeft: '2px solid rgba(0,208,132,0.5)',
                background: 'rgba(0,208,132,0.05)', marginBottom: 1, borderRadius: '0 3px 3px 0',
              }}>+ {l.message}</div>
            ))}
          </div>
        )}
        {removed.length > 0 && (
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,71,87,0.5)', marginBottom: 6 }}>- Removed since last scan ({removed.length})</p>
            {removed.map((l, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7,
                color: 'rgba(255,71,87,0.6)', padding: '1px 8px',
                borderLeft: '2px solid rgba(255,71,87,0.3)',
                background: 'rgba(255,71,87,0.04)', marginBottom: 1, borderRadius: '0 3px 3px 0',
                textDecoration: 'line-through',
              }}>- {l.message}</div>
            ))}
          </div>
        )}
        {added.length === 0 && removed.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-5)' }}>No changes detected since last scan.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Pinned result panel ────────────────────────────── */
function PinnedPanel({ lines, onClear }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
      borderRadius: 'var(--r-xl)',
      background: '#030307',
      border: '1px solid rgba(255,122,0,0.15)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 38, padding: '0 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,122,0,0.04)',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
          color: 'rgba(255,122,0,0.5)',
        }}>
          📌 Pinned Result · {lines.length} lines
        </span>
        <button
          onClick={onClear}
          style={{
            color: 'var(--text-4)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
            transition: 'color 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <StreamOutput lines={lines} running={false} />
      </div>
    </div>
  )
}
