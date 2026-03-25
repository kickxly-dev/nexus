import { Icon } from '../Icons'

/* ─── Shared base styles ────────────────────────────── */
const inputBase = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text-1)',
  fontSize: 12,
  fontFamily: 'inherit',
  letterSpacing: '-0.012em',
  padding: '7px 10px',
  transition: 'border-color 0.12s, box-shadow 0.12s',
}

const labelStyle = {
  display: 'block',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  marginBottom: 5,
}

/* ─── InputField ─────────────────────────────────────── */
export function InputField({ label, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputBase, opacity: disabled ? 0.35 : 1 }}
      />
    </div>
  )
}

/* ─── SelectField ────────────────────────────────────── */
export function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{
          ...inputBase, cursor: 'pointer', appearance: 'none',
          opacity: disabled ? 0.35 : 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23303065' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30,
        }}>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
        ))}
      </select>
    </div>
  )
}

/* ─── RunButton ──────────────────────────────────────── */
export function RunButton({ onClick, running, onStop, disabled }) {
  if (running) return (
    <button onClick={onStop} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '10px 0', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600,
      background: 'rgba(255,71,87,0.08)', color: 'var(--red)',
      border: '1px solid rgba(255,71,87,0.25)', cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.15)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,71,87,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.08)'; e.currentTarget.style.boxShadow = 'none' }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)', flexShrink: 0 }} />
      Stop Scan
    </button>
  )
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '10px 0', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600,
      background: disabled
        ? 'rgba(124,58,237,0.12)'
        : 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
      color: disabled ? 'rgba(167,139,250,0.25)' : 'white',
      border: disabled ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(139,92,246,0.4)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 24px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.4)',
      transition: 'all 0.15s',
      letterSpacing: '0.01em',
    }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(124,58,237,0.65), 0 2px 8px rgba(0,0,0,0.5)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.4)'
          e.currentTarget.style.transform = 'none'
        }
      }}>
      <Icon name="play" size={11} />
      Run Scan
    </button>
  )
}

/* ─── ExportButton ───────────────────────────────────── */
export function ExportButton({ lines, filename = 'nexus-export' }) {
  if (!lines?.length) return <span />
  async function go(fmt) {
    let data, ext
    if (fmt === 'json') { data = JSON.stringify(lines.filter(l => l.type !== 'progress'), null, 2); ext = 'json' }
    else if (fmt === 'csv') {
      const keys = [...new Set(lines.flatMap(Object.keys))].filter(k => k !== '_id' && k !== '_ts')
      data = [keys.join(','), ...lines.map(l => keys.map(k => JSON.stringify(l[k] ?? '')).join(','))].join('\n'); ext = 'csv'
    } else { data = lines.map(l => l.message || JSON.stringify(l)).join('\n'); ext = 'txt' }
    if (window.nexus) await window.nexus.saveFile(data, `${filename}.${ext}`)
    else { const b = new Blob([data]); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `${filename}.${ext}` }); a.click() }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <span style={{
        fontSize: 9, color: 'var(--text-5)', marginRight: 5,
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
      }}>Export</span>
      {['json','csv','txt'].map(f => (
        <button key={f} onClick={() => go(f)} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          padding: '2px 8px', borderRadius: 'var(--r-sm)',
          color: 'var(--text-4)', background: 'transparent',
          border: 'none', cursor: 'pointer',
          transition: 'color 0.1s, background 0.1s',
          letterSpacing: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}>
          {f}
        </button>
      ))}
    </div>
  )
}

/* ─── CheckboxField ──────────────────────────────────── */
export function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
      <div style={{
        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--accent-hi)' : 'transparent',
        border: `1px solid ${checked ? 'rgba(139,92,246,0.8)' : 'var(--border-strong)'}`,
        boxShadow: checked ? '0 0 8px rgba(124,58,237,0.4)' : 'none',
        transition: 'all 0.12s',
      }}>
        {checked && <span style={{ color: 'white', fontSize: 9, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ fontSize: 12, color: 'var(--text-2)', userSelect: 'none' }}>{label}</span>
    </label>
  )
}

/* ─── ToggleSwitch ───────────────────────────────────── */
export function ToggleSwitch({ label, checked, onChange, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 450, lineHeight: 1.3 }}>{label}</p>
        {description && (
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{description}</p>
        )}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        position: 'relative', width: 34, height: 19, borderRadius: 99, flexShrink: 0,
        background: checked ? 'var(--accent-hi)' : 'var(--bg-raised)',
        border: `1px solid ${checked ? 'rgba(139,92,246,0.7)' : 'var(--border-strong)'}`,
        cursor: 'pointer', transition: 'all 0.18s',
        boxShadow: checked ? '0 0 14px rgba(124,58,237,0.45)' : 'none',
      }}>
        <span style={{
          position: 'absolute', top: 2, width: 13, height: 13,
          borderRadius: '50%', background: checked ? 'white' : 'var(--text-5)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          transition: 'left 0.18s, background 0.18s', left: checked ? 16 : 2,
        }} />
      </button>
    </div>
  )
}
