import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton } from '../components/Forms/index'

const TOOLS = [
  { id: 'DNS', icon: '⌁', desc: 'Query DNS records' },
  { id: 'WHOIS', icon: '⊡', desc: 'Domain registration info' },
  { id: 'Ports', icon: '⊞', desc: 'TCP/UDP port scanning' },
  { id: 'Subdomains', icon: '◎', desc: 'Enumerate subdomains' },
  { id: 'Fingerprint', icon: '⊛', desc: 'Detect technologies' },
]

export function Recon() {
  const [tool, setTool] = useState('DNS')
  const [domain, setDomain] = useState('')
  const [url, setUrl] = useState('')
  const [ports, setPorts] = useState('1-1000')
  const [scanType, setScanType] = useState('tcp')
  const [wordlist, setWordlist] = useState('')
  const { lines, running, start, stop, clear } = useStream()
  const addActivity = useActivityStore((s) => s.addActivity)
  const addLog = useLogStore((s) => s.addLog)

  function run() {
    const target = tool === 'Fingerprint' ? url : domain
    addActivity({ module: 'recon', tool, target, findings: 0 })
    addLog('scan_start', { module: 'recon', tool, target })
    const map = {
      DNS:         ['/api/recon/dns', { domain }],
      WHOIS:       ['/api/recon/whois', { domain }],
      Ports:       ['/api/recon/portscan', { target: domain, ports, scan_type: scanType }],
      Subdomains:  ['/api/recon/subdomains', { domain, wordlist: wordlist || undefined }],
      Fingerprint: ['/api/recon/fingerprint', { url }],
    }
    start(...map[tool])
  }

  return (
    <div className="flex h-full">
      {/* Left config panel */}
      <div className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col overflow-y-auto bg-[#09090b]/50">
        {/* Tool selector */}
        <div className="p-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 font-semibold px-2 mb-2">Tools</p>
          <div className="flex flex-col gap-0.5">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => { setTool(t.id); clear() }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150
                  ${tool === t.id
                    ? 'bg-white/[0.07] text-white shadow-sm shadow-black/20'
                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'}`}>
                <span className="text-sm opacity-60">{t.icon}</span>
                <div>
                  <p className="text-[12px] font-medium">{t.id}</p>
                  <p className="text-[10px] text-white/20">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="p-3 flex flex-col gap-3 flex-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 font-semibold px-2">Config</p>
          {tool !== 'Fingerprint'
            ? <InputField label="Domain" value={domain} onChange={setDomain} placeholder="example.com" />
            : <InputField label="URL" value={url} onChange={setUrl} placeholder="https://example.com" />
          }
          {tool === 'Ports' && (
            <>
              <InputField label="Ports" value={ports} onChange={setPorts} placeholder="1-1000" />
              <SelectField label="Type" value={scanType} onChange={setScanType}
                options={[{ value: 'tcp', label: 'TCP' }, { value: 'syn', label: 'SYN (admin)' }, { value: 'udp', label: 'UDP (admin)' }]} />
            </>
          )}
          {tool === 'Subdomains' && (
            <InputField label="Wordlist" value={wordlist} onChange={setWordlist} placeholder="/path/to/list.txt" />
          )}
          <div className="mt-auto pt-3">
            <RunButton onClick={run} running={running} onStop={stop} disabled={!domain && !url} />
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
        <StreamOutput lines={lines} running={running} className="flex-1" />
        <div className="flex items-center justify-between">
          <ExportButton lines={lines} filename={`recon-${tool.toLowerCase()}`} />
          {lines.length > 0 && (
            <button onClick={clear} className="text-white/15 text-[11px] hover:text-white/40 transition-colors">clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
