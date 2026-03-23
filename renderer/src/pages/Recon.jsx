import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton } from '../components/Forms/index'

const TOOLS = [
  { id: 'DNS',        icon: '⌁', desc: 'Query all DNS record types' },
  { id: 'WHOIS',      icon: '⊡', desc: 'Domain registration info' },
  { id: 'Ports',      icon: '⊞', desc: 'TCP/UDP port scanning' },
  { id: 'Subdomains', icon: '◎', desc: 'Enumerate subdomains' },
  { id: 'Fingerprint',icon: '⊛', desc: 'Detect web technologies' },
  { id: 'ReverseDNS', icon: '⊘', desc: 'PTR record lookup (IP→host)' },
  { id: 'GeoIP',      icon: '⊙', desc: 'IP geolocation & ISP info' },
]

const toolCls = (active) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group w-full
   ${active
     ? 'text-white font-medium'
     : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}`

export function Recon() {
  const [tool, setTool]     = useState('DNS')
  const [domain, setDomain] = useState('')
  const [url, setUrl]       = useState('')
  const [ip, setIp]         = useState('')
  const [ports, setPorts]   = useState('1-1000')
  const [scanType, setScanType] = useState('tcp')
  const [wordlist, setWordlist] = useState('')
  const { lines, running, start, stop, clear } = useStream()
  const addActivity = useActivityStore((s) => s.addActivity)
  const addLog      = useLogStore((s) => s.addLog)

  function run() {
    const target = tool === 'Fingerprint' ? url : (tool === 'ReverseDNS' || tool === 'GeoIP') ? ip : domain
    addActivity({ module: 'recon', tool, target })
    addLog('scan_start', { module: 'recon', tool, target })
    const map = {
      DNS:         ['/api/recon/dns',         { domain }],
      WHOIS:       ['/api/recon/whois',        { domain }],
      Ports:       ['/api/recon/portscan',     { target: domain, ports, scan_type: scanType }],
      Subdomains:  ['/api/recon/subdomains',   { domain, wordlist: wordlist || undefined }],
      Fingerprint: ['/api/recon/fingerprint',  { url }],
      ReverseDNS:  ['/api/recon/reversedns',   { ip }],
      GeoIP:       ['/api/recon/geoip',        { ip }],
    }
    start(...map[tool])
  }

  const needsDomain = !['Fingerprint','ReverseDNS','GeoIP'].includes(tool)
  const needsUrl    = tool === 'Fingerprint'
  const needsIp     = tool === 'ReverseDNS' || tool === 'GeoIP'
  const disabled    = (needsDomain && !domain) || (needsUrl && !url) || (needsIp && !ip)

  return (
    <div className="flex h-full" style={{ background: '#08080f' }}>
      {/* Left config panel */}
      <div className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col overflow-y-auto">
        {/* Tool selector */}
        <div className="p-3 border-b border-white/[0.05]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2 mb-2">Tools</p>
          <div className="flex flex-col gap-0.5">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => { setTool(t.id); clear() }}
                className={toolCls(tool === t.id)}
                style={tool === t.id ? {
                  background: 'rgba(37,99,235,0.08)',
                  boxShadow: 'inset 2px 0 0 rgba(37,99,235,0.6)',
                  border: '1px solid rgba(37,99,235,0.12)',
                  borderLeft: 'none',
                } : {}}>
                <span className="text-sm" style={tool === t.id ? { color: '#60a5fa', filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.5))' } : { opacity: 0.25 }}>{t.icon}</span>
                <div>
                  <p className="text-[12px]">{t.id}</p>
                  <p className="text-[10px] text-white/18">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="p-3 flex flex-col gap-3 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2">Config</p>

          {needsDomain && <InputField label="Domain" value={domain} onChange={setDomain} placeholder="example.com" />}
          {needsUrl    && <InputField label="URL"    value={url}    onChange={setUrl}    placeholder="https://example.com" />}
          {needsIp     && <InputField label="IP"     value={ip}     onChange={setIp}     placeholder="1.2.3.4" />}

          {tool === 'Ports' && (
            <>
              <InputField label="Ports" value={ports} onChange={setPorts} placeholder="1-1000" />
              <SelectField label="Scan Type" value={scanType} onChange={setScanType}
                options={[{ value: 'tcp', label: 'TCP' }, { value: 'syn', label: 'SYN (admin)' }, { value: 'udp', label: 'UDP (admin)' }]} />
            </>
          )}
          {tool === 'Subdomains' && (
            <InputField label="Wordlist" value={wordlist} onChange={setWordlist} placeholder="/path/to/list.txt" />
          )}

          <div className="mt-auto pt-3">
            <RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
        <StreamOutput lines={lines} running={running} className="flex-1" />
        <div className="flex items-center justify-between">
          <ExportButton lines={lines} filename={`recon-${tool.toLowerCase()}`} />
          {lines.length > 0 && (
            <button onClick={clear} className="text-white/12 text-[11px] hover:text-white/35 transition-colors">clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
