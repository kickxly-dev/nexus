import { useEffect, useRef } from 'react'

const TYPE_BADGE = {
  found:    { color: '#34d399', bg: 'rgba(52,211,153,0.08)', label: 'FOUND' },
  vuln:     { color: '#f87171', bg: 'rgba(248,113,113,0.08)', label: 'VULN' },
  error:    { color: '#f87171', bg: 'rgba(248,113,113,0.08)', label: 'ERR' },
  warn:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', label: 'WARN' },
  info:     { color: '#6b7280', bg: 'transparent', label: null },
  progress: { color: '#818cf8', bg: 'rgba(129,140,248,0.08)', label: null },
  done:     { color: '#34d399', bg: 'rgba(52,211,153,0.08)', label: 'DONE' },
  data:     { color: '#d4d4d8', bg: 'transparent', label: null },
  result:   { color: '#34d399', bg: 'rgba(52,211,153,0.08)', label: 'RESULT' },
}

function OutputLine({ line, index }) {
  const cfg = TYPE_BADGE[line.type] || { color: '#71717a', bg: 'transparent', label: null }
  return (
    <div className="line-in flex items-start gap-2 py-[3px] px-1 rounded hover:bg-white/[0.02] group transition-colors">
      <span className="font-mono text-[10px] text-white/10 w-6 text-right shrink-0 pt-[2px] select-none">{index + 1}</span>
      {cfg.label && (
        <span className="font-mono text-[9px] font-semibold px-1.5 py-[1px] rounded shrink-0 mt-[1px]"
          style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
      )}
      <span className="font-mono text-[12px] leading-[18px] whitespace-pre-wrap break-all" style={{ color: cfg.color }}>
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
    <div className={`flex flex-col h-full rounded-xl border border-white/[0.06] overflow-hidden bg-[#0a0a0c] ${className}`}>
      {/* Terminal header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
          <div className={`w-2.5 h-2.5 rounded-full ${running ? 'bg-emerald-400 dot-glow text-emerald-400' : 'bg-white/[0.06]'}`} />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {found > 0 && (
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {found} found
            </span>
          )}
          <span className="text-[10px] font-mono text-white/20">
            {running ? 'streaming...' : lines.length ? `${lines.length} lines` : 'idle'}
          </span>
        </div>
      </div>

      {/* Output body */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {lines.length === 0 && !running && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/10 text-xs font-mono">waiting for input</p>
              <p className="text-white/5 text-[10px] font-mono mt-1">configure and hit run</p>
            </div>
          </div>
        )}
        {lines.map((line, i) => <OutputLine key={line._id} line={line} index={i} />)}
        {running && (
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="font-mono text-[10px] text-white/10 w-6 text-right">{lines.length + 1}</span>
            <span className="w-1.5 h-4 bg-emerald-400/60 animate-pulse rounded-sm" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
