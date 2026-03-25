import { useState, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, RunButton, ExportButton } from '../components/Forms/index'
import { ToolPage } from '../components/ToolPage'

const TOOLS = [
  { id: 'Email',     icon: 'email',    label: 'Email Recon',   desc: 'MX, SPF, DMARC, disposable check'  },
  { id: 'Username',  icon: 'username', label: 'Username',      desc: 'Scan 12+ platforms'                  },
  { id: 'SSL',       icon: 'ssl',      label: 'SSL Inspect',   desc: 'Cert chain, expiry, ciphers'         },
  { id: 'Breach',    icon: 'breach',   label: 'Breach Check',  desc: 'HIBP k-anonymity lookup'             },
  { id: 'IPRep',     icon: 'iprep',    label: 'IP Reputation', desc: 'Blacklist & geolocation check'       },
  { id: 'ReverseIP', icon: 'reverse',  label: 'Reverse IP',    desc: 'Find all domains on an IP'           },
  { id: 'GitHub',    icon: 'breach',   label: 'GitHub Dork',   desc: 'Search GitHub for exposed secrets'   },
  { id: 'Shodan',    icon: 'iprep',    label: 'Shodan Lookup', desc: 'Query Shodan for host intelligence'  },
]

export function OSINT() {
  const [tool, setTool]           = useState('Email')
  const [email, setEmail]         = useState('')
  const [username, setUsername]   = useState('')
  const [host, setHost]           = useState('')
  const [port, setPort]           = useState('443')
  const [password, setPassword]   = useState('')
  const [repIp, setRepIp]         = useState('')
  const [reverseIp, setReverseIp] = useState('')
  const [ghQuery, setGhQuery]     = useState('')
  const [ghToken, setGhToken]     = useState('')
  const [shodanTarget, setShodanTarget] = useState('')
  const [shodanKey, setShodanKey]       = useState('')
  const { lines, running, start, stop, clear, loadLines } = useStream()
  const addActivity = useActivityStore(s => s.addActivity)
  const addLog      = useLogStore(s => s.addLog)

  useEffect(() => {
    function handler(e) {
      if (TOOLS.some(t => t.id === e.detail?.id)) setTool(e.detail.id)
    }
    window.addEventListener('nexus:selectTool', handler)
    return () => window.removeEventListener('nexus:selectTool', handler)
  }, [])

  function run() {
    const targetMap = {
      Email: email, Username: username, SSL: host,
      Breach: '(password)', IPRep: repIp,
      ReverseIP: reverseIp, GitHub: ghQuery, Shodan: shodanTarget,
    }
    const target = targetMap[tool]
    addActivity({ module: 'osint', tool, target })
    addLog('scan_start', { module: 'osint', tool })
    if (tool === 'Email')         start('/api/osint/email',     { target: email })
    else if (tool === 'Username') start('/api/osint/username',  { target: username })
    else if (tool === 'SSL')      start('/api/osint/ssl',       { host, port: parseInt(port) })
    else if (tool === 'Breach')   start('/api/osint/breach',    { password })
    else if (tool === 'IPRep')    start('/api/osint/iprep',     { ip: repIp })
    else if (tool === 'ReverseIP')start('/api/osint/reverseip', { ip: reverseIp })
    else if (tool === 'GitHub')   start('/api/osint/github',    { query: ghQuery, token: ghToken || undefined })
    else                          start('/api/osint/shodan',    { target: shodanTarget, api_key: shodanKey || undefined })
  }

  const disabled =
    (tool === 'Email'      && !email)        ||
    (tool === 'Username'   && !username)     ||
    (tool === 'SSL'        && !host)         ||
    (tool === 'Breach'     && !password)     ||
    (tool === 'IPRep'      && !repIp)        ||
    (tool === 'ReverseIP'  && !reverseIp)    ||
    (tool === 'GitHub'     && !ghQuery)      ||
    (tool === 'Shodan'     && !shodanTarget)

  return (
    <ToolPage
      tools={TOOLS} activeTool={tool}
      onToolChange={t => { setTool(t); clear() }}
      lines={lines} running={running}
      configFields={<>
        {tool === 'Email' && <InputField label="Email address" value={email} onChange={setEmail} placeholder="target@example.com" />}
        {tool === 'Username' && <>
          <InputField label="Username" value={username} onChange={setUsername} placeholder="john_doe" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Checks GitHub · GitLab · Reddit · HN · Keybase · Dev.to · Replit · PyPI · npm · Pastebin · Steam · Twitch
          </p>
        </>}
        {tool === 'SSL' && <>
          <InputField label="Hostname" value={host} onChange={setHost} placeholder="example.com" />
          <InputField label="Port"     value={port} onChange={setPort} placeholder="443" type="number" />
        </>}
        {tool === 'Breach' && <>
          <InputField label="Password" value={password} onChange={setPassword} type="password" placeholder="Check a password..." />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            k-anonymity — only first 5 chars of SHA1 hash sent to HIBP.
          </p>
        </>}
        {tool === 'IPRep' && <>
          <InputField label="IP Address" value={repIp} onChange={setRepIp} placeholder="1.2.3.4" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Checks ipinfo.io + 8 DNSBL blacklists (Spamhaus, SpamCop, SORBS, CBL...)
          </p>
        </>}
        {tool === 'ReverseIP' && <>
          <InputField label="IP Address" value={reverseIp} onChange={setReverseIp} placeholder="1.2.3.4" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Finds all domains hosted on the given IP via reverse DNS and lookup APIs.
          </p>
        </>}
        {tool === 'GitHub' && <>
          <InputField label="Search query" value={ghQuery} onChange={setGhQuery} placeholder="api_key filename:.env" />
          <InputField label="GitHub token (optional)" value={ghToken} onChange={setGhToken} placeholder="ghp_..." />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Searches code, commits, and issues for exposed secrets or sensitive data.
          </p>
        </>}
        {tool === 'Shodan' && <>
          <InputField label="IP / Domain" value={shodanTarget} onChange={setShodanTarget} placeholder="1.2.3.4 or example.com" />
          <InputField label="API key (optional)" value={shodanKey} onChange={setShodanKey} placeholder="Your Shodan API key" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Queries Shodan for open ports, services, vulnerabilities, and banners.
          </p>
        </>}
      </>}
      onRun={run} onStop={stop} onClear={clear}
      runButton={<RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />}
      output={<StreamOutput lines={lines} running={running} onLoadHistory={loadLines} />}
      footer={<>
        <ExportButton lines={lines} filename={`osint-${tool.toLowerCase()}`} />
        {lines.length > 0 && (
          <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>Clear</button>
        )}
      </>}
    />
  )
}
