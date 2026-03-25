import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateReport } from '../../utils/reportGenerator'
import { extractEntities, suggestTool } from '../../utils/entityExtractor'

/* ─── Line type → style ──────────────────────────────── */
const T = {
  found:    { color: '#00d084', dim: 'rgba(0,208,132,0.08)',   badge: 'FOUND' },
  vuln:     { color: '#ff4757', dim: 'rgba(255,71,87,0.07)',    badge: 'VULN'  },
  error:    { color: '#ff4757', dim: 'rgba(255,71,87,0.06)',    badge: 'ERR'   },
  warn:     { color: '#ffd700', dim: 'rgba(255,215,0,0.06)',    badge: 'WARN'  },
  done:     { color: '#4a9eff', dim: 'rgba(74,158,255,0.06)',   badge: 'DONE'  },
  result:   { color: '#a78bfa', dim: null,                      badge: null    },
  data:     { color: '#7070a8', dim: null,                      badge: null    },
  info:     { color: '#404070', dim: null,                      badge: null    },
  progress: { color: '#282858', dim: null,                      badge: null    },
}

function fmtTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

/* ─── Single output line ─────────────────────────────── */
function Line({ line, index, showTs }) {
  const s = T[line.type] || T.info
  const msg = line.message ?? JSON.stringify(line)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      padding: '0 14px', minWidth: 0,
      background: s.dim || 'transparent',
      borderLeft: s.dim ? `2px solid ${s.color}40` : '2px solid transparent',
    }}
      onMouseEnter={e => { if (!s.dim) e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
      onMouseLeave={e => { if (!s.dim) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Line number */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 0,
        color: '#1c1c4c', width: 28, textAlign: 'right', paddingRight: 12,
        paddingTop: 3, userSelect: 'none', flexShrink: 0,
      }}>
        {index + 1}
      </span>

      {/* Timestamp */}
      {showTs && line._ts && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 0,
          color: '#252555', flexShrink: 0, paddingTop: 3,
          marginRight: 10, userSelect: 'none', width: 52,
        }}>
          {fmtTs(line._ts)}
        </span>
      )}

      {/* Badge */}
      {s.badge ? (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.04em',
          fontWeight: 700, flexShrink: 0, paddingTop: 3,
          marginRight: 10, width: 32, textAlign: 'right',
          color: s.color, opacity: 0.9,
        }}>
          {s.badge}
        </span>
      ) : (
        <span style={{ width: !showTs ? 32 : 0, flexShrink: 0 }} />
      )}

      {/* Message */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 0,
        lineHeight: 1.7, wordBreak: 'break-all', whiteSpace: 'pre-wrap',
        flex: 1, minWidth: 0, color: s.color,
        padding: '2px 0',
      }}>
        {msg}
      </span>
    </div>
  )
}

/* ─── Notes panel ────────────────────────────────────── */
function NotesPanel({ onClose }) {
  const [text, setText] = useState(() => sessionStorage.getItem('nexus-notes') || '')
  function save(v) { setText(v); sessionStorage.setItem('nexus-notes', v) }
  return (
    <div style={{
      width: 240, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border)',
      background: '#050510',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--text-5)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>Notes</span>
        <button onClick={onClose} style={{
          color: 'var(--text-4)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
          transition: 'color 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
          ×
        </button>
      </div>
      <textarea
        value={text} onChange={e => save(e.target.value)}
        placeholder="// notes..."
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          resize: 'none', padding: '10px 12px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 0,
          color: 'var(--text-2)', lineHeight: 1.7,
        }}
      />
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <p style={{
          fontSize: 9, color: 'var(--text-5)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
        }}>auto-saved · session only</p>
      </div>
    </div>
  )
}

/* ─── Scan history modal ─────────────────────────────── */
function HistoryModal({ entries, onLoad, onDelete, onClear, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: 560, maxHeight: '68vh', borderRadius: 'var(--r-2xl)',
        background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Scan History</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              {entries.length} saved scan{entries.length !== 1 ? 's' : ''} · persisted locally
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {entries.length > 0 && (
              <button onClick={onClear} style={{
                fontSize: 11, color: 'var(--red)', background: 'rgba(255,71,87,0.08)',
                border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--r-md)',
                padding: '5px 12px', cursor: 'pointer', transition: 'background 0.1s',
              }}>Clear all</button>
            )}
            <button onClick={onClose} style={{
              fontSize: 11, color: 'var(--text-2)', background: 'var(--bg-raised)',
              border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)',
              padding: '5px 12px', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--text-4)', letterSpacing: 0 }}>
                no saved scans yet
              </p>
            </div>
          ) : entries.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px',
              borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
              onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              onClick={() => { onLoad(e); onClose() }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--accent-light)', background: 'var(--accent-soft)',
                    padding: '2px 7px', borderRadius: 'var(--r-sm)',
                  }}>{e.module}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{e.tool}</span>
                  {e.hitCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', letterSpacing: 0 }}>
                      {e.hitCount} hits
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0,
                  color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{e.target || '—'}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text-4)', letterSpacing: 0 }}>
                  {new Date(e.timestamp).toLocaleDateString()}
                </p>
                <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text-5)', letterSpacing: 0 }}>
                  {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={ev => { ev.stopPropagation(); onDelete(e.id) }}
                style={{
                  color: 'var(--text-4)', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '2px 4px', lineHeight: 1,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={ev => ev.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={ev => ev.currentTarget.style.color = 'var(--text-4)'}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Toolbar button ─────────────────────────────────── */
function TBtn({ onClick, active, activeColor, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
      padding: '3px 8px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
      color: active ? activeColor : 'var(--text-4)',
      background: active ? `${activeColor}18` : 'transparent',
      transition: 'color 0.1s, background 0.1s',
      fontWeight: active ? 600 : 400,
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' } }}>
      {children}
    </button>
  )
}

// ─── Entity type config ────────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { key: 'ips',     label: 'IPs',     color: '#4a9eff' },
  { key: 'domains', label: 'Domains', color: '#a78bfa' },
  { key: 'emails',  label: 'Emails',  color: '#ff69b4' },
  { key: 'urls',    label: 'URLs',    color: '#00d084' },
  { key: 'hashes',  label: 'Hashes',  color: '#ffd700' },
  { key: 'cves',    label: 'CVEs',    color: '#ff4757' },
  { key: 'ports',   label: 'Ports',   color: '#00d4ff' },
]

const ENTITY_TYPE_MAP = { ips: 'ip', domains: 'domain', emails: 'email', urls: 'url', hashes: 'hash', cves: 'cve', ports: 'port' }

/* ─── Entity chip ─────────────────────────────────────── */
function EntityChip({ value, color, entityType, navigate }) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const suggestions = useMemo(() => suggestTool(entityType), [entityType])

  function copyValue(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(value)
  }

  function handleSuggest(e, suggestion) {
    e.stopPropagation()
    navigate(suggestion.path)
    window.dispatchEvent(new CustomEvent('nexus:selectTool', { detail: { toolId: suggestion.toolId } }))
    setMenuOpen(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'var(--bg-raised)', border: `1px solid ${hovered ? color + '60' : 'var(--border)'}`,
          borderRadius: 99, padding: '3px 8px 3px 7px', cursor: 'default',
          transition: 'border-color 0.15s, background 0.1s',
          background: hovered ? `${color}12` : 'var(--bg-raised)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
          color, userSelect: 'all',
          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </span>

        {hovered && (
          <>
            {/* Copy button */}
            <button
              onClick={copyValue}
              title="Copy"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 2px', color: 'var(--text-4)', display: 'flex', alignItems: 'center',
                transition: 'color 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>

            {/* Tool suggestion button */}
            {suggestions.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
                title="Run in tool"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0 2px', color: 'var(--text-4)', display: 'flex', alignItems: 'center',
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = color}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
              >
                → Tool
              </button>
            )}
          </>
        )}
      </div>

      {/* Suggestion dropdown */}
      {menuOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-md)', minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          {suggestions.map(s => (
            <button
              key={s.toolId}
              onClick={e => handleSuggest(e, s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '7px 12px',
                fontSize: 11, color: 'var(--text-2)',
                fontFamily: 'inherit', transition: 'background 0.08s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Entities panel ──────────────────────────────────── */
function EntitiesPanel({ lines }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const entities = useMemo(() => extractEntities(lines), [lines])

  const totalCount = ENTITY_TYPES.reduce((sum, t) => sum + (entities[t.key]?.length || 0), 0)
  if (totalCount === 0) return null

  const summary = ENTITY_TYPES
    .filter(t => entities[t.key]?.length > 0)
    .map(t => `${entities[t.key].length} ${t.label.toLowerCase()}`)
    .join(' · ')

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'rgba(139,92,246,0.03)',
      flexShrink: 0,
    }}>
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <span style={{ fontSize: 12, color: '#a78bfa', lineHeight: 1, flexShrink: 0 }}>⬡</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
          color: 'var(--text-3)', fontWeight: 600,
        }}>
          {totalCount} {totalCount === 1 ? 'entity' : 'entities'} found
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 0,
          color: 'var(--text-5)',
        }}>
          {summary}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 9, color: 'var(--text-5)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
          transition: 'transform 0.15s',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>›</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '4px 14px 12px' }}>
          {ENTITY_TYPES.filter(t => entities[t.key]?.length > 0).map(t => (
            <div key={t.key} style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--text-5)', fontWeight: 700, marginBottom: 5,
              }}>
                {t.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {entities[t.key].map(val => (
                  <EntityChip
                    key={val}
                    value={val}
                    color={t.color}
                    entityType={ENTITY_TYPE_MAP[t.key]}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── StreamOutput ───────────────────────────────────── */
export function StreamOutput({ lines, running, onLoadHistory }) {
  const ref = useRef(null)
  const [filter, setFilter]           = useState('')
  const [copied, setCopied]           = useState(false)
  const [showFilter, setShowFilter]   = useState(false)
  const [showTs, setShowTs]           = useState(false)
  const [showNotes, setShowNotes]     = useState(false)
  const [saved, setSaved]             = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyStore, setHistoryStore] = useState(null)

  useEffect(() => {
    import('../../store/historyStore').then(m => setHistoryStore(() => m.useHistoryStore))
  }, [])

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'instant' }) }, [lines])

  const hits = lines.filter(l => l.type === 'found' || l.type === 'vuln').length
  const q = filter.trim().toLowerCase()

  const visible = useMemo(() => {
    if (!q) return lines
    return lines.filter(l => (l.message ?? JSON.stringify(l)).toLowerCase().includes(q))
  }, [lines, q])

  function downloadReport() {
    // Pull tool/module/target hints from the DOM via a global — pages set window._nexusReportMeta
    const meta = window._nexusReportMeta || {}
    const html = generateReport(
      meta.tool || 'scan',
      meta.module || 'nexus',
      meta.target || '',
      lines,
    )
    const ts = Date.now()
    const filename = `nexus-report-${(meta.tool || 'scan').toLowerCase().replace(/\s+/g,'-')}-${ts}.html`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyAll() {
    const text = lines.map(l => {
      const badge = T[l.type]?.badge
      const ts = showTs && l._ts ? `[${fmtTs(l._ts)}] ` : ''
      return ts + (badge ? `[${badge}] ${l.message ?? ''}` : (l.message ?? JSON.stringify(l)))
    }).join('\n')
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  function saveToHistory(module, tool, target) {
    if (!historyStore || !lines.length) return
    historyStore.getState().saveEntry(module || 'scan', tool || 'unknown', target || '', lines)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    window._nexusSaveToHistory = saveToHistory
    return () => { delete window._nexusSaveToHistory }
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1,
      overflow: 'hidden', borderRadius: 'var(--r-xl)',
      background: '#030307',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>

      {/* ── Terminal title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 38, padding: '0 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.025)',
      }}>
        {/* Traffic dots */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginRight: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: running ? '#ff4757' : '#1c1c3c' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: running ? '#ffd700' : '#1c1c3c' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: running ? '#00d084' : '#1c1c3c',
            boxShadow: running ? '0 0 8px rgba(0,208,132,0.6)' : 'none',
          }} className={running ? 'pulse-dot' : ''} />
        </div>

        {/* Path label */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0,
          color: '#252555', flex: 1, userSelect: 'none',
        }}>
          {running
            ? <span style={{ color: '#3a3a7a' }}>nexus ~ scanning<span style={{ opacity: 0.6 }} className="blink">_</span></span>
            : lines.length
              ? `nexus ~ ${lines.length} lines · ${hits > 0 ? `${hits} hits` : 'scan complete'}`
              : 'nexus ~ output'}
        </span>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {running && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5, marginRight: 8,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'var(--accent-light)', letterSpacing: 0, fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-light)', flexShrink: 0 }} className="pulse-dot" />
              live
            </span>
          )}
          {hits > 0 && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: 'var(--green)', marginRight: 8, letterSpacing: 0, fontWeight: 600,
            }}>{hits} hits</span>
          )}
          {lines.length > 0 && (
            <>
              <TBtn onClick={() => setShowFilter(s => !s)} active={showFilter} activeColor="#a78bfa" title="Filter">filter</TBtn>
              <TBtn onClick={() => setShowTs(s => !s)} active={showTs} activeColor="#4a9eff" title="Timestamps">ts</TBtn>
              <TBtn onClick={copyAll} active={copied} activeColor="#00d084" title="Copy all">
                {copied ? '✓ copied' : 'copy'}
              </TBtn>
            </>
          )}
          <TBtn onClick={() => setShowHistory(true)} active={false} activeColor="" title="Scan history">history</TBtn>
          <TBtn onClick={() => setShowNotes(s => !s)} active={showNotes} activeColor="#ff7a00" title="Notes">notes</TBtn>
          {!running && lines.length > 0 && (
            <TBtn onClick={() => window._nexusSaveToHistory?.()} active={saved} activeColor="#00d084" title="Save">
              {saved ? '✓ saved' : 'save'}
            </TBtn>
          )}
          {!running && lines.length > 0 && (
            <TBtn onClick={downloadReport} active={false} activeColor="#4a9eff" title="Download HTML report">
              report
            </TBtn>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilter && (
        <div style={{
          padding: '6px 14px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.015)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#303065', flexShrink: 0 }}>/</span>
          <input
            autoFocus value={filter}
            onChange={e => setFilter(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setFilter(''); setShowFilter(false) } }}
            placeholder="filter output... (Esc to close)"
            style={{
              flex: 1,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 0,
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-2)',
            }}
          />
          {filter && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#303065' }}>
              {visible.length} match{visible.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Output + notes ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6, paddingBottom: 10 }}>
          {lines.length === 0 && !running ? (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#1c1c4c', letterSpacing: 0 }}>
                $ _
              </p>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#14143a', letterSpacing: '0.04em' }}>
                ⌃↵ run scan · ⎋ stop · ⌃L clear
              </p>
            </div>
          ) : (
            visible.map((l, i) => <Line key={l._id ?? i} line={l} index={i} showTs={showTs} />)
          )}
          {q && visible.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#1c1c4c', letterSpacing: 0 }}>
                no matches for "{q}"
              </p>
            </div>
          )}
          {running && !q && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '2px 14px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: '#1c1c4c', width: 28, textAlign: 'right',
                paddingRight: 12, userSelect: 'none', letterSpacing: 0,
              }}>
                {lines.length + 1}
              </span>
              <span style={{
                display: 'inline-block', width: 7, height: 14,
                borderRadius: 1, background: 'var(--accent-light)',
                opacity: 0.5,
              }} className="blink" />
            </div>
          )}
          <div ref={ref} />
        </div>

        {showNotes && <NotesPanel onClose={() => setShowNotes(false)} />}
      </div>

      {/* ── Entities panel ── */}
      {!running && lines.length > 0 && <EntitiesPanel lines={lines} />}

      {/* ── History modal ── */}
      {showHistory && historyStore && (() => {
        const store = historyStore.getState()
        return (
          <HistoryModal
            entries={store.entries}
            onLoad={entry => onLoadHistory?.(entry.lines)}
            onDelete={id => { store.deleteEntry(id); setShowHistory(false); setTimeout(() => setShowHistory(true), 0) }}
            onClear={() => { store.clearAll(); setShowHistory(false) }}
            onClose={() => setShowHistory(false)}
          />
        )
      })()}
    </div>
  )
}
