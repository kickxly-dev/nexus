import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, RunButton, ExportButton } from '../components/Forms/index'

const TOOLS = [
  { id: 'Email',    icon: '⊠', desc: 'MX records, SPF, DMARC, disposable check' },
  { id: 'Username', icon: '⊡', desc: 'Scan across 12+ platforms' },
  { id: 'SSL',      icon: '⊞', desc: 'Cert chain, expiry, cipher strength' },
  { id: 'Breach',   icon: '⊟', desc: 'k-anonymity password breach check' },
]

const toolCls = (active) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 w-full
   ${active ? 'text-white font-medium' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}`

export function OSINT() {
  const [tool, setTool]           = useState('Email')
  const [email, setEmail]         = useState('')
  const [username, setUsername]   = useState('')
  const [host, setHost]           = useState('')
  const [port, setPort]           = useState('443')
  const [password, setPassword]   = useState('')
  const { lines, running, start, stop, clear } = useStream()
  const addActivity = useActivityStore((s) => s.addActivity)
  const addLog      = useLogStore((s) => s.addLog)

  function run() {
    const targets = { Email: email, Username: username, SSL: host, Breach: '(password)' }
    addActivity({ module: 'osint', tool, target: targets[tool] })
    addLog('scan_start', { module: 'osint', tool })
    if (tool === 'Email')    start('/api/osint/email',    { target: email })
    else if (tool === 'Username') start('/api/osint/username', { target: username })
    else if (tool === 'SSL') start('/api/osint/ssl',      { host, port: parseInt(port) })
    else                     start('/api/osint/breach',   { password })
  }

  const disabled =
    (tool === 'Email'    && !email)    ||
    (tool === 'Username' && !username) ||
    (tool === 'SSL'      && !host)     ||
    (tool === 'Breach'   && !password)

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
                  background: 'rgba(99,102,241,0.08)',
                  boxShadow: 'inset 2px 0 0 rgba(99,102,241,0.7)',
                  border: '1px solid rgba(99,102,241,0.12)',
                  borderLeft: 'none',
                } : {}}>
                <span className="text-sm" style={tool === t.id ? { color: '#a5b4fc', filter: 'drop-shadow(0 0 4px rgba(165,180,252,0.5))' } : { opacity: 0.25 }}>{t.icon}</span>
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

          {tool === 'Email'    && <InputField label="Email Address" value={email}    onChange={setEmail}    placeholder="target@example.com" />}
          {tool === 'Username' && <InputField label="Username"      value={username} onChange={setUsername} placeholder="john_doe" />}
          {tool === 'SSL'      && (
            <>
              <InputField label="Hostname" value={host} onChange={setHost} placeholder="example.com" />
              <InputField label="Port"     value={port} onChange={setPort} placeholder="443" type="number" />
            </>
          )}
          {tool === 'Breach' && (
            <>
              <InputField label="Password" value={password} onChange={setPassword} placeholder="Enter password to check" type="password" />
              <div className="px-2 py-2 rounded-lg text-[10px] leading-relaxed"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', color: 'rgba(165,180,252,0.5)' }}>
                Uses k-anonymity — only first 5 chars of hash sent to HIBP. Password never leaves your machine.
              </div>
            </>
          )}

          {tool === 'Username' && (
            <div className="px-2 py-1.5 rounded-lg text-[10px]"
              style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', color: 'rgba(165,180,252,0.4)' }}>
              Checks: GitHub · GitLab · Reddit · HN · Keybase · Dev.to · Replit · PyPI · npm · Pastebin · Steam · Twitch
            </div>
          )}

          <div className="mt-auto pt-3">
            <RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
        <StreamOutput lines={lines} running={running} className="flex-1" />
        <div className="flex items-center justify-between">
          <ExportButton lines={lines} filename={`osint-${tool.toLowerCase()}`} />
          {lines.length > 0 && (
            <button onClick={clear} className="text-white/12 text-[11px] hover:text-white/35 transition-colors">clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
