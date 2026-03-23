import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, RunButton, ExportButton, CheckboxField } from '../components/Forms/index'

const TOOLS = [
  { id: 'Services', icon: '⊜', desc: 'Banner grabbing' },
  { id: 'ARP',      icon: '⊛', desc: 'ARP discovery scan' },
  { id: 'Map',      icon: '⊚', desc: 'Network mapper' },
  { id: 'Capture',  icon: '⊙', desc: 'Packet capture' },
]

const toolCls = (active) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group w-full
   ${active ? 'text-white font-medium' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}`

export function Network() {
  const [tool, setTool]     = useState('Services')
  const [host, setHost]     = useState('')
  const [network, setNetwork] = useState('192.168.1.0/24')
  const [ports, setPorts]   = useState('')
  const [deep, setDeep]     = useState(false)
  const [iface, setIface]   = useState('')
  const [count, setCount]   = useState('50')
  const [filter, setFilter] = useState('')
  const { lines, running, start, stop, clear } = useStream()
  const addActivity = useActivityStore((s) => s.addActivity)
  const addLog      = useLogStore((s) => s.addLog)

  function run() {
    const target = (tool === 'ARP' || tool === 'Map') ? network : host
    addActivity({ module: 'network', tool, target })
    addLog('scan_start', { module: 'network', tool, target })
    if (tool === 'Services')     start('/api/network/services', { host, ports: ports || undefined })
    else if (tool === 'ARP')     start('/api/network/arp', { network })
    else if (tool === 'Map')     start('/api/network/map', { target: network, deep })
    else start('/api/network/capture', { iface: iface || undefined, count, filter: filter || undefined })
  }

  return (
    <div className="flex h-full" style={{ background: '#08080f' }}>
      <div className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-white/[0.05]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2 mb-2">Tools</p>
          <div className="flex flex-col gap-0.5">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => { setTool(t.id); clear() }}
                className={toolCls(tool === t.id)}
                style={tool === t.id ? {
                  background: 'rgba(79,70,229,0.08)',
                  boxShadow: 'inset 2px 0 0 rgba(79,70,229,0.6)',
                  border: '1px solid rgba(79,70,229,0.12)',
                  borderLeft: 'none',
                } : {}}>
                <span className="text-sm" style={tool === t.id ? { color: '#818cf8', filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.5))' } : { opacity: 0.25 }}>{t.icon}</span>
                <div>
                  <p className="text-[12px]">{t.id}</p>
                  <p className="text-[10px] text-white/18">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 flex flex-col gap-3 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2">Config</p>

          {tool === 'Services' && (
            <>
              <InputField label="Host"  value={host}  onChange={setHost}  placeholder="192.168.1.1" />
              <InputField label="Ports" value={ports} onChange={setPorts} placeholder="22,80,443" />
            </>
          )}
          {(tool === 'ARP' || tool === 'Map') && (
            <InputField label="Network" value={network} onChange={setNetwork} placeholder="192.168.1.0/24" />
          )}
          {tool === 'Map' && <CheckboxField label="Deep scan (-sV -O)" checked={deep} onChange={setDeep} />}
          {tool === 'Capture' && (
            <>
              <InputField label="Interface" value={iface}  onChange={setIface}  placeholder="eth0" />
              <InputField label="Count"     value={count}  onChange={setCount}  type="number" />
              <InputField label="BPF Filter" value={filter} onChange={setFilter} placeholder="tcp port 80" />
            </>
          )}
          {(tool === 'ARP' || tool === 'Capture') && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <span className="text-amber-400/70 text-[10px]">⚠ Requires admin privileges</span>
            </div>
          )}

          <div className="mt-auto pt-3">
            <RunButton onClick={run} running={running} onStop={stop}
              disabled={!host && tool === 'Services'} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
        <StreamOutput lines={lines} running={running} className="flex-1" />
        <div className="flex items-center justify-between">
          <ExportButton lines={lines} filename={`network-${tool.toLowerCase()}`} />
          {lines.length > 0 && (
            <button onClick={clear} className="text-white/12 text-[11px] hover:text-white/35 transition-colors">clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
