import { useState, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton } from '../components/Forms/index'
import { ToolPage } from '../components/ToolPage'

const TOOLS = [
  { id: 'DNS',        icon: 'dns',         label: 'DNS Lookup',     desc: 'Query all DNS record types'        },
  { id: 'WHOIS',      icon: 'whois',       label: 'WHOIS',          desc: 'Domain registration info'          },
  { id: 'Ports',      icon: 'ports',       label: 'Port Scan',      desc: 'TCP/UDP port scanning'             },
  { id: 'Subdomains', icon: 'subdomain',   label: 'Subdomains',     desc: 'Enumerate subdomains'              },
  { id: 'Fingerprint',icon: 'fingerprint', label: 'Fingerprint',    desc: 'Detect web technologies'           },
  { id: 'ReverseDNS', icon: 'reverse',     label: 'Reverse DNS',    desc: 'PTR record lookup (IP → host)'     },
  { id: 'GeoIP',      icon: 'geo',         label: 'GeoIP',          desc: 'IP geolocation & ISP'              },
  { id: 'Traceroute', icon: 'trace',       label: 'Traceroute',     desc: 'Trace network path to host'        },
  { id: 'ASN',        icon: 'asn',         label: 'ASN Lookup',     desc: 'Autonomous system & prefix info'   },
  { id: 'Takeover',   icon: 'takeover',    label: 'Sub Takeover',   desc: 'Check for subdomain takeover vulns'},
  { id: 'CertSearch', icon: 'cert',        label: 'Cert Logs',      desc: 'Search certificate transparency logs'},
  { id: 'BannerGrab', icon: 'banner',      label: 'Banner Grab',    desc: 'Grab service banners from open ports'},
  { id: 'WAF',        icon: 'takeover',    label: 'WAF Detector',   desc: 'Detect web application firewalls'  },
  { id: 'CMS',        icon: 'fingerprint', label: 'CMS Detector',   desc: 'Identify CMS and web framework'    },
]

export function Recon() {
  const [tool, setTool]           = useState('DNS')
  const [domain, setDomain]       = useState('')
  const [url, setUrl]             = useState('')
  const [ip, setIp]               = useState('')
  const [asnTarget, setAsnTarget] = useState('')
  const [ports, setPorts]         = useState('1-1000')
  const [scanType, setScanType]   = useState('tcp')
  const [wordlist, setWordlist]   = useState('')
  const [maxHops, setMaxHops]     = useState('30')
  const { lines, running, start, stop, clear, loadLines } = useStream()
  const addActivity = useActivityStore(s => s.addActivity)
  const addLog = useLogStore(s => s.addLog)

  useEffect(() => {
    function handler(e) {
      if (TOOLS.some(t => t.id === e.detail?.id)) setTool(e.detail.id)
    }
    window.addEventListener('nexus:selectTool', handler)
    return () => window.removeEventListener('nexus:selectTool', handler)
  }, [])

  const [bannerPorts, setBannerPorts] = useState('22,80,443,8080,8443')
  const needsDomain   = !['Fingerprint', 'ReverseDNS', 'GeoIP', 'ASN', 'WAF', 'CMS'].includes(tool)
  const needsUrl      = tool === 'Fingerprint' || tool === 'WAF' || tool === 'CMS'
  const needsIp       = tool === 'ReverseDNS' || tool === 'GeoIP'
  const needsAsnInput = tool === 'ASN'
  const disabled = (needsDomain && !domain) || (needsUrl && !url) || (needsIp && !ip) || (needsAsnInput && !asnTarget)

  function run() {
    const target = needsUrl ? url : needsIp ? ip : needsAsnInput ? asnTarget : domain
    addActivity({ module: 'recon', tool, target })
    addLog('scan_start', { module: 'recon', tool, target })
    const map = {
      DNS:        ['/api/recon/dns',               { domain }],
      WHOIS:      ['/api/recon/whois',              { domain }],
      Ports:      ['/api/recon/portscan',           { target: domain, ports, scan_type: scanType }],
      Subdomains: ['/api/recon/subdomains',         { domain, wordlist: wordlist || undefined }],
      Fingerprint:['/api/recon/fingerprint',        { url }],
      ReverseDNS: ['/api/recon/reversedns',         { ip }],
      GeoIP:      ['/api/recon/geoip',              { ip }],
      Traceroute: ['/api/recon/traceroute',         { target: domain, max_hops: parseInt(maxHops) }],
      ASN:        ['/api/recon/asn',                { target: asnTarget }],
      Takeover:   ['/api/recon/takeover',           { domain }],
      CertSearch: ['/api/recon/certtransparency',   { domain }],
      BannerGrab: ['/api/recon/bannergrab',         { target: domain, ports: bannerPorts }],
      WAF:        ['/api/recon/waf',                { url }],
      CMS:        ['/api/recon/cms',                { url }],
    }
    start(...map[tool])
  }

  return (
    <ToolPage
      tools={TOOLS} activeTool={tool}
      onToolChange={t => { setTool(t); clear() }}
      lines={lines} running={running}
      configFields={<>
        {needsDomain    && <InputField label={tool === 'Traceroute' ? 'Host / IP' : tool === 'Takeover' ? 'Root Domain' : 'Domain'} value={domain} onChange={setDomain} placeholder="example.com" />}
        {needsUrl       && <InputField label="URL"               value={url}       onChange={setUrl}       placeholder="https://example.com" />}
        {needsIp        && <InputField label="IP"                value={ip}        onChange={setIp}        placeholder="1.2.3.4" />}
        {needsAsnInput  && <InputField label="IP / ASN / Domain" value={asnTarget} onChange={setAsnTarget} placeholder="8.8.8.8 or AS15169" />}
        {tool === 'Ports' && <>
          <InputField  label="Port range" value={ports}    onChange={setPorts}    placeholder="1-1000" />
          <SelectField label="Scan type"  value={scanType} onChange={setScanType}
            options={[{ value: 'tcp', label: 'TCP' }, { value: 'syn', label: 'SYN (root)' }, { value: 'udp', label: 'UDP (root)' }]} />
        </>}
        {tool === 'Subdomains' && <InputField label="Wordlist path" value={wordlist} onChange={setWordlist} placeholder="/path/to/wordlist.txt" />}
        {tool === 'Traceroute' && <InputField label="Max hops" value={maxHops} onChange={setMaxHops} type="number" placeholder="30" />}
        {tool === 'Takeover'   && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Checks 30 common subdomains against 25+ known takeover fingerprints.</p>}
        {tool === 'ASN'        && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Supports IP address, AS number (AS15169), or domain name.</p>}
        {tool === 'CertSearch' && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Queries crt.sh — finds all certs ever issued for the domain.</p>}
        {tool === 'BannerGrab' && <InputField label="Ports" value={bannerPorts} onChange={setBannerPorts} placeholder="22,80,443,8080" />}
        {tool === 'WAF'        && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Detects WAF presence and identifies vendor via response fingerprinting.</p>}
        {tool === 'CMS'        && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Identifies WordPress, Drupal, Joomla, and 20+ other platforms.</p>}
      </>}
      onRun={run} onStop={stop} onClear={clear}
      runButton={<RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />}
      output={<StreamOutput lines={lines} running={running} onLoadHistory={loadLines} />}
      footer={<>
        <ExportButton lines={lines} filename={`recon-${tool.toLowerCase()}`} />
        {lines.length > 0 && (
          <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>Clear</button>
        )}
      </>}
    />
  )
}
