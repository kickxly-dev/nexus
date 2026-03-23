import { useEffect, useRef } from 'react'

const TYPE_BADGE = {
  found:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'FOUND',   glow: 'rgba(167,139,250,0.3)' },
  vuln:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: 'VULN',    glow: 'rgba(248,113,113,0.3)' },
  error:    { color: '#f87171', bg: 'rgba(248,113,113,0.08)', label: 'ERR',     glow: null },
  warn:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  label: 'WARN',    glow: null },
  info:     { color: '#6b7280', bg: 'transparent',            label: null,      glow: null },
  progress: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  label: null,      glow: null },
  done:     { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  label: 'DONE',    glow: 'rgba(52,211,153,0.3)' },
  data:     { color: '#c4b5fd', bg: 'transparent',            label: null,      glow: null },
  result:   { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  label: 'RESULT',  glow: 'rgba(129,140,248,0.2)' },
}

function OutputLine({ line, index }) {
  const cfg = TYPE_BADGE[line.type] || { color: '#71717a', bg: 'transparent', label: null, glow: null }
  return (
    <div className="line-in flex items-start gap-2 py-[3px] px-1.5 rounded hover:bg-white/[0.02] group transition-colors">
      <span className="font-mono text-[10px] text-white/10 w-6 text-right shrink-0 pt-[2px] select-none">{index + 1}</span>
      {cfg.label && (
        <span
          className="font-mono text-[9px] font-bold px-1.5 py-[1px] rounded shrink-0 mt-[1px] tracking-wider"
          style={{
            color: cfg.color,
            background: cfg.bg,
            textShadow: cfg.glow ? `0 0 8px ${cfg.glow}` : 'none',
          }}
        >{cfg.label}</span>
      )}
      <span
        className="font-mono text-[12px] leading-[18px] whitespace-pre-wrap break-all"
        style={{ color: cfg.color }}
      >
        {line.message || JSON.stringify(line)}
      </span>
    </div>
  )
}

export function StreamOutput({ lines, running, className = '' }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [lines])

  const found = lines.filter(l => l.type === 'found' || l.type === 'vuln').length

  return (
    <div className={`flex flex-col h-full rounded-xl border overflow-hidden bg-[#08080f] scanline-container transition-all duration-300
      ${running ? 'border-purple-500/20' : 'border-white/[0.05]'} ${className}`}
      style={running ? { boxShadow: '0 0 20px rgba(124,58,237,0.06), inset 0 0 30px rgba(0,0,0,0.3)' } : {}}>

      {/* Terminal header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.05]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.05]" />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500
            ${running ? 'bg-purple-400 dot-glow text-purple-400' : 'bg-white/[0.05]'}`} />
        </div>

        {running && (
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-purple-400 animate-ping opacity-75" />
            <span className="text-purple-400/60 text-[9px] font-mono tracking-wider">SCANNING</span>
          </div>
        )}

        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {found > 0 && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
              style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.12)', textShadow: '0 0 8px rgba(167,139,250,0.4)' }}>
              {found} found
            </span>
          )}
          <span className="text-[10px] font-mono text-white/15">
            {running ? 'streaming...' : lines.length ? `${lines.length} lines` : 'idle'}
          </span>
        </div>
      </div>

      {/* Output body */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {lines.length === 0 && !running && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center fade-in">
              <div className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center mx-auto mb-3"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent)' }}>
                <span className="text-white/15 text-xs">⌁</span>
              </div>
              <p className="text-white/10 text-xs font-mono">waiting for input</p>
              <p className="text-white/5 text-[10px] font-mono mt-1">configure and hit run</p>
            </div>
          </div>
        )}
        {lines.map((line, i) => <OutputLine key={line._id} line={line} index={i} />)}
        {running && (
          <div className="flex items-center gap-2 px-1.5 py-1">
            <span className="font-mono text-[10px] text-white/10 w-6 text-right">{lines.length + 1}</span>
            <span className="w-1.5 h-4 rounded-sm animate-pulse"
              style={{ background: 'linear-gradient(to bottom, #7c3aed, #2563eb)' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
