const inputCls = `w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white/90
  text-[12px] placeholder-white/15 transition-all duration-200 disabled:opacity-30
  hover:border-white/[0.12] focus:bg-white/[0.05]`

export function InputField({ label, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-white/30 text-[11px] font-medium tracking-wide">{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} className={inputCls} />
    </div>
  )
}

export function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-white/30 text-[11px] font-medium tracking-wide">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={inputCls + ' cursor-pointer appearance-none'}>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-[#18181b]">
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
      className={`w-full px-4 py-2.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-200
        ${running
          ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20'
        } disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none`}
    >
      {running ? 'Stop' : 'Run Scan'}
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
          className="px-2 py-1 rounded-md text-[10px] font-mono text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all">
          .{fmt}
        </button>
      ))}
    </div>
  )
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center
        ${checked ? 'bg-violet-600 border-violet-500' : 'border-white/15 bg-transparent group-hover:border-white/25'}`}>
        {checked && <span className="text-white text-[9px]">✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <span className="text-white/40 text-[12px] group-hover:text-white/60 transition-colors">{label}</span>
    </label>
  )
}
