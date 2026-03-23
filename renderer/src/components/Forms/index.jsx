const inputCls = `w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-white/90
  text-[12px] placeholder-white/12 transition-all duration-200 disabled:opacity-30
  hover:border-purple-500/20 focus:bg-white/[0.04]`

export function InputField({ label, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-white/25 text-[11px] font-medium tracking-wide">{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} className={inputCls} />
    </div>
  )
}

export function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-white/25 text-[11px] font-medium tracking-wide">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={inputCls + ' cursor-pointer appearance-none'}>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-[#0f0f1a]">
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RunButton({ onClick, running, onStop, disabled }) {
  return (
    <button
      onClick={running ? onStop : onClick}
      disabled={disabled && !running}
      className="w-full px-4 py-2.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-200 relative overflow-hidden group disabled:opacity-20 disabled:cursor-not-allowed"
      style={running
        ? { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
        : { background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.25), 0 2px 8px rgba(37,99,235,0.15)' }
      }
    >
      {!running && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent)' }} />
      )}
      <span className="relative">{running ? '⏹ Stop' : '▶ Run Scan'}</span>
    </button>
  )
}

export function ExportButton({ lines, filename = 'nexus-export' }) {
  if (!lines?.length) return null
  async function exportData(format) {
    let data, ext
    if (format === 'json') {
      data = JSON.stringify(lines.filter(l => l.type !== 'progress'), null, 2); ext = 'json'
    } else if (format === 'csv') {
      const keys = [...new Set(lines.flatMap(Object.keys))].filter(k => k !== '_id')
      data = [keys.join(','), ...lines.map(l => keys.map(k => JSON.stringify(l[k] ?? '')).join(','))].join('\n'); ext = 'csv'
    } else {
      data = lines.map(l => l.message || JSON.stringify(l)).join('\n'); ext = 'txt'
    }
    if (window.nexus) { await window.nexus.saveFile(data, `${filename}.${ext}`) }
    else { const b = new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${filename}.${ext}`; a.click() }
  }
  return (
    <div className="flex gap-1">
      {['json', 'csv', 'txt'].map(fmt => (
        <button key={fmt} onClick={() => exportData(fmt)}
          className="px-2 py-1 rounded-md text-[10px] font-mono transition-all duration-150 hover:scale-105"
          style={{ color: 'rgba(167,139,250,0.4)' }}
          onMouseEnter={e => { e.target.style.color = 'rgba(167,139,250,0.8)'; e.target.style.background = 'rgba(124,58,237,0.08)' }}
          onMouseLeave={e => { e.target.style.color = 'rgba(167,139,250,0.4)'; e.target.style.background = '' }}>
          .{fmt}
        </button>
      ))}
    </div>
  )
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center
        ${checked
          ? 'border-purple-500/60'
          : 'border-white/12 bg-transparent group-hover:border-purple-500/30'}`}
        style={checked ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(37,99,235,0.6))' } : {}}>
        {checked && <span className="text-white text-[9px]">✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <span className="text-white/35 text-[12px] group-hover:text-white/60 transition-colors">{label}</span>
    </label>
  )
}

export function ToggleSwitch({ label, checked, onChange, description }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-white/70 text-[12px] font-medium">{label}</p>
        {description && <p className="text-white/25 text-[10px] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all duration-250 shrink-0`}
        style={checked
          ? { background: 'linear-gradient(90deg, #7c3aed, #2563eb)', boxShadow: '0 0 10px rgba(124,58,237,0.4)' }
          : { background: 'rgba(255,255,255,0.08)' }
        }
      >
        <div
          className="toggle-thumb absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </button>
    </div>
  )
}
