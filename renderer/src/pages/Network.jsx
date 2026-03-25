import { useState, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, RunButton, ExportButton, CheckboxField } from '../components/Forms/index'
import { ToolPage } from '../components/ToolPage'

const TOOLS = [
  { id: 'Services',  icon: 'services', label: 'Services',   desc: 'Banner & service grabbing'  },
  { id: 'ARP',       icon: 'arp',      label: 'ARP Scan',   desc: 'ARP host discovery'          },
  { id: 'Map',       icon: 'mapper',   label: 'Net Map',    desc: 'Network topology mapper'     },
  { id: 'Capture',   icon: 'packet',   label: 'Capture',    desc: 'Live packet capture'          },
  { id: 'PingSweep', icon: 'ping',     label: 'Ping Sweep', desc: 'TCP ping sweep over CIDR'    },
  { id: 'SMB',       icon: 'services', label: 'SMB Enum',   desc: 'Enumerate SMB shares and config' },
  { id: 'SSH',       icon: 'crack',    label: 'SSH Audit',  desc: 'Audit SSH server configuration'  },
  { id: 'NmapRaw',   icon: 'ports',    label: 'Nmap Raw',   desc: 'Full Nmap with custom flags'     },
]

export function Network() {
  const [tool, setTool]         = useState('Services')
  const [host, setHost]         = useState('')
  const [network, setNetwork]   = useState('192.168.1.0/24')
  const [ports, setPorts]       = useState('')
  const [deep, setDeep]         = useState(false)
  const [iface, setIface]       = useState('')
  const [count, setCount]       = useState('50')
  const [filter, setFilter]     = useState('')
  const [smbTarget, setSmbTarget] = useState('')
  const [sshTarget, setSshTarget] = useState('')
  const [sshPort, setSshPort]     = useState('22')
  const [nmapTarget, setNmapTarget] = useState('')
  const [nmapFlags, setNmapFlags]   = useState('-sV --script=default')
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
    const target = ['ARP', 'Map', 'PingSweep'].includes(tool) ? network
      : tool === 'SMB'     ? smbTarget
      : tool === 'SSH'     ? sshTarget
      : tool === 'NmapRaw' ? nmapTarget
      : host
    addActivity({ module: 'network', tool, target })
    addLog('scan_start', { module: 'network', tool, target })
    if (tool === 'Services')       start('/api/network/services',  { host, ports: ports || undefined })
    else if (tool === 'ARP')       start('/api/network/arp',       { network })
    else if (tool === 'Map')       start('/api/network/map',       { target: network, deep })
    else if (tool === 'PingSweep') start('/api/network/pingsweep', { network })
    else if (tool === 'SMB')       start('/api/network/smb',       { target: smbTarget })
    else if (tool === 'SSH')       start('/api/network/ssh',       { target: sshTarget, port: parseInt(sshPort) })
    else if (tool === 'NmapRaw')   start('/api/network/nmap',      { target: nmapTarget, flags: nmapFlags })
    else                           start('/api/network/capture',   { iface: iface || undefined, count, filter: filter || undefined })
  }

  const needsAdmin = tool === 'ARP' || tool === 'Capture'
  const disabled =
    (tool === 'Services'  && !host) ||
    (['ARP','Map','PingSweep'].includes(tool) && !network) ||
    (tool === 'SMB'     && !smbTarget) ||
    (tool === 'SSH'     && !sshTarget) ||
    (tool === 'NmapRaw' && !nmapTarget)

  return (
    <ToolPage
      tools={TOOLS} activeTool={tool}
      onToolChange={t => { setTool(t); clear() }}
      lines={lines} running={running}
      configFields={<>
        {tool === 'Services' && <>
          <InputField label="Host"       value={host}  onChange={setHost}  placeholder="192.168.1.1" />
          <InputField label="Port range" value={ports} onChange={setPorts} placeholder="22,80,443" />
        </>}
        {['ARP', 'Map', 'PingSweep'].includes(tool) && (
          <InputField label="Network CIDR" value={network} onChange={setNetwork} placeholder="192.168.1.0/24" />
        )}
        {tool === 'Map' && <CheckboxField label="Deep scan (-sV -O)" checked={deep} onChange={setDeep} />}
        {tool === 'Capture' && <>
          <InputField label="Interface"    value={iface}  onChange={setIface}  placeholder="eth0" />
          <InputField label="Packet count" value={count}  onChange={setCount}  type="number" />
          <InputField label="BPF Filter"   value={filter} onChange={setFilter} placeholder="tcp port 80" />
        </>}
        {tool === 'PingSweep' && (
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            TCP connect on ports 22, 80, 443. No root required.
          </p>
        )}
        {tool === 'SMB' && <>
          <InputField label="Target (IP / host)" value={smbTarget} onChange={setSmbTarget} placeholder="192.168.1.10" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Enumerates shares, users, OS version, and signing config.
          </p>
        </>}
        {tool === 'SSH' && <>
          <InputField label="Target (IP / host)" value={sshTarget} onChange={setSshTarget} placeholder="192.168.1.10" />
          <InputField label="Port"               value={sshPort}   onChange={setSshPort}   placeholder="22" type="number" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Audits key exchange algorithms, ciphers, MACs, and auth methods.
          </p>
        </>}
        {tool === 'NmapRaw' && <>
          <InputField label="Target" value={nmapTarget} onChange={setNmapTarget} placeholder="192.168.1.1" />
          <InputField label="Flags"  value={nmapFlags}  onChange={setNmapFlags}  placeholder="-sV --script=default" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2, lineHeight: 1.6 }}>
            Runs Nmap with your custom flags directly against the target.
          </p>
        </>}
        {needsAdmin && (
          <p style={{ fontSize: 11, color: '#7a5f2a', paddingLeft: 2 }}>⚠ Requires administrator privileges</p>
        )}
      </>}
      onRun={run} onStop={stop} onClear={clear}
      runButton={<RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />}
      output={<StreamOutput lines={lines} running={running} onLoadHistory={loadLines} />}
      footer={<>
        <ExportButton lines={lines} filename={`network-${tool.toLowerCase()}`} />
        {lines.length > 0 && (
          <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>Clear</button>
        )}
      </>}
    />
  )
}
