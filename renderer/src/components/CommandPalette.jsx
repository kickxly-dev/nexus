import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'

// ─── Module color map ─────────────────────────────────────────────────────────
const MODULE_COLORS = {
  recon:    '#4a9eff',
  web:      '#a78bfa',
  network:  '#00d4ff',
  password: '#00d084',
  osint:    '#ff69b4',
  advanced: '#ff7a00',
  nav:      '#8b5cf6',
}

// ─── Full tool registry ───────────────────────────────────────────────────────
const ALL_TOOLS = [
  // Navigation
  { type: 'nav', label: 'Dashboard',  path: '/',        module: 'nav',      icon: 'dashboard', desc: 'Overview & recent activity' },
  { type: 'nav', label: 'Settings',   path: '/settings',module: 'nav',      icon: 'settings',  desc: 'Configure Nexus preferences' },

  // Recon
  { type: 'tool', label: 'DNS Lookup',    desc: 'Query all DNS record types',            module: 'recon',    path: '/recon',    toolId: 'DNS'        },
  { type: 'tool', label: 'WHOIS',         desc: 'Domain registration info',              module: 'recon',    path: '/recon',    toolId: 'WHOIS'      },
  { type: 'tool', label: 'Port Scan',     desc: 'TCP/UDP port scanning',                 module: 'recon',    path: '/recon',    toolId: 'Ports'      },
  { type: 'tool', label: 'Subdomains',    desc: 'Enumerate subdomains',                  module: 'recon',    path: '/recon',    toolId: 'Subdomains' },
  { type: 'tool', label: 'Fingerprint',   desc: 'Detect web technologies',               module: 'recon',    path: '/recon',    toolId: 'Fingerprint'},
  { type: 'tool', label: 'Reverse DNS',   desc: 'PTR record lookup (IP → host)',         module: 'recon',    path: '/recon',    toolId: 'ReverseDNS' },
  { type: 'tool', label: 'GeoIP',         desc: 'IP geolocation & ISP',                  module: 'recon',    path: '/recon',    toolId: 'GeoIP'      },
  { type: 'tool', label: 'Traceroute',    desc: 'Trace network path to host',            module: 'recon',    path: '/recon',    toolId: 'Traceroute' },
  { type: 'tool', label: 'ASN Lookup',    desc: 'Autonomous system & prefix info',       module: 'recon',    path: '/recon',    toolId: 'ASN'        },
  { type: 'tool', label: 'Sub Takeover',  desc: 'Check for subdomain takeover vulns',    module: 'recon',    path: '/recon',    toolId: 'Takeover'   },
  { type: 'tool', label: 'Cert Logs',     desc: 'Search certificate transparency logs',  module: 'recon',    path: '/recon',    toolId: 'CertSearch' },
  { type: 'tool', label: 'Banner Grab',   desc: 'Grab service banners from open ports',  module: 'recon',    path: '/recon',    toolId: 'BannerGrab' },
  { type: 'tool', label: 'WAF Detector',  desc: 'Detect web application firewalls',      module: 'recon',    path: '/recon',    toolId: 'WAF'        },
  { type: 'tool', label: 'CMS Detector',  desc: 'Identify CMS and web framework',        module: 'recon',    path: '/recon',    toolId: 'CMS'        },

  // Web Exploit
  { type: 'tool', label: 'Headers',        desc: 'Analyze security headers',                   module: 'web', path: '/web', toolId: 'Headers'      },
  { type: 'tool', label: 'Dir Brute',      desc: 'Directory brute-force',                       module: 'web', path: '/web', toolId: 'DirBrute'     },
  { type: 'tool', label: 'SQLi',           desc: 'SQL injection detection',                     module: 'web', path: '/web', toolId: 'SQLi'         },
  { type: 'tool', label: 'XSS Scan',       desc: 'Cross-site scripting detection',              module: 'web', path: '/web', toolId: 'XSS'          },
  { type: 'tool', label: 'CORS',           desc: 'CORS misconfiguration check',                 module: 'web', path: '/web', toolId: 'CORS'         },
  { type: 'tool', label: 'HTTP Methods',   desc: 'Probe allowed HTTP methods',                  module: 'web', path: '/web', toolId: 'Methods'      },
  { type: 'tool', label: 'JWT Analyzer',   desc: 'Decode & audit JWT tokens',                   module: 'web', path: '/web', toolId: 'JWT'          },
  { type: 'tool', label: 'Open Redirect',  desc: 'Test open redirect vulnerabilities',          module: 'web', path: '/web', toolId: 'OpenRedirect' },
  { type: 'tool', label: 'LFI Scanner',    desc: 'Local file inclusion / path traversal',       module: 'web', path: '/web', toolId: 'LFI'          },
  { type: 'tool', label: 'SSRF Scanner',   desc: 'Server-side request forgery detection',       module: 'web', path: '/web', toolId: 'SSRF'         },
  { type: 'tool', label: 'Cookie Audit',   desc: 'Cookie flags & security analysis',            module: 'web', path: '/web', toolId: 'Cookies'      },
  { type: 'tool', label: 'CSP Analyzer',   desc: 'Content Security Policy audit',               module: 'web', path: '/web', toolId: 'CSP'          },
  { type: 'tool', label: 'SSTI Scanner',   desc: 'Server-side template injection',              module: 'web', path: '/web', toolId: 'SSTI'         },
  { type: 'tool', label: 'Param Discovery',desc: 'Find hidden HTTP parameters',                 module: 'web', path: '/web', toolId: 'Params'       },
  { type: 'tool', label: 'HTTP Smuggling', desc: 'Detect request smuggling vulnerabilities',    module: 'web', path: '/web', toolId: 'Smuggling'    },

  // Network
  { type: 'tool', label: 'Services',    desc: 'Banner & service grabbing',         module: 'network', path: '/network', toolId: 'Services'  },
  { type: 'tool', label: 'ARP Scan',    desc: 'ARP host discovery',                module: 'network', path: '/network', toolId: 'ARP'       },
  { type: 'tool', label: 'Net Map',     desc: 'Network topology mapper',           module: 'network', path: '/network', toolId: 'Map'       },
  { type: 'tool', label: 'Capture',     desc: 'Live packet capture',               module: 'network', path: '/network', toolId: 'Capture'   },
  { type: 'tool', label: 'Ping Sweep',  desc: 'TCP ping sweep over CIDR',          module: 'network', path: '/network', toolId: 'PingSweep' },
  { type: 'tool', label: 'SMB Enum',    desc: 'Enumerate SMB shares and config',   module: 'network', path: '/network', toolId: 'SMB'       },
  { type: 'tool', label: 'SSH Audit',   desc: 'Audit SSH server configuration',    module: 'network', path: '/network', toolId: 'SSH'       },

  // Password
  { type: 'tool', label: 'Identify',     desc: 'Identify hash algorithm',         module: 'password', path: '/password', toolId: 'Identify'    },
  { type: 'tool', label: 'Crack',        desc: 'Dictionary attack',               module: 'password', path: '/password', toolId: 'Crack'       },
  { type: 'tool', label: 'Wordlist',     desc: 'Generate custom wordlists',       module: 'password', path: '/password', toolId: 'Wordlist'    },
  { type: 'tool', label: 'Credentials',  desc: 'Credential stuffing test',        module: 'password', path: '/password', toolId: 'Credentials' },
  { type: 'tool', label: 'Encoder',      desc: 'Encode / hash text',              module: 'password', path: '/password', toolId: 'Encoder'     },
  { type: 'tool', label: 'Strength',     desc: 'Analyze password strength',       module: 'password', path: '/password', toolId: 'Strength'    },
  { type: 'tool', label: 'Hash Lookup',  desc: 'Online hash reverse lookup',      module: 'password', path: '/password', toolId: 'HashLookup'  },
  { type: 'tool', label: 'JWT Cracker',  desc: 'Brute-force JWT signing secret',  module: 'password', path: '/password', toolId: 'JWTCrack'    },

  // OSINT
  { type: 'tool', label: 'Email Recon',   desc: 'MX, SPF, DMARC, disposable check',      module: 'osint', path: '/osint', toolId: 'Email'     },
  { type: 'tool', label: 'Username',      desc: 'Scan 12+ platforms',                    module: 'osint', path: '/osint', toolId: 'Username'  },
  { type: 'tool', label: 'SSL Inspect',   desc: 'Cert chain, expiry, ciphers',           module: 'osint', path: '/osint', toolId: 'SSL'       },
  { type: 'tool', label: 'Breach Check',  desc: 'HIBP k-anonymity lookup',               module: 'osint', path: '/osint', toolId: 'Breach'    },
  { type: 'tool', label: 'IP Reputation', desc: 'Blacklist & geolocation check',         module: 'osint', path: '/osint', toolId: 'IPRep'     },
  { type: 'tool', label: 'Reverse IP',    desc: 'Find all domains on an IP',             module: 'osint', path: '/osint', toolId: 'ReverseIP' },
  { type: 'tool', label: 'GitHub Dork',   desc: 'Search GitHub for exposed secrets',     module: 'osint', path: '/osint', toolId: 'GitHub'    },
  { type: 'tool', label: 'Shodan Lookup', desc: 'Query Shodan for host intelligence',    module: 'osint', path: '/osint', toolId: 'Shodan'    },

  // Advanced
  { type: 'tool', label: 'Advanced Tools', desc: 'Advanced exploitation & analysis',    module: 'advanced', path: '/advanced', toolId: 'Advanced' },
]

// ─── Group order ──────────────────────────────────────────────────────────────
const GROUP_ORDER = ['nav', 'recon', 'web', 'network', 'password', 'osint', 'advanced']
const GROUP_LABELS = {
  nav:      'Navigation',
  recon:    'Recon',
  web:      'Web Exploit',
  network:  'Network',
  password: 'Password & Auth',
  osint:    'OSINT',
  advanced: 'Advanced',
}

function groupResults(items) {
  const grouped = {}
  for (const item of items) {
    if (!grouped[item.module]) grouped[item.module] = []
    grouped[item.module].push(item)
  }
  return GROUP_ORDER
    .filter(k => grouped[k] && grouped[k].length > 0)
    .map(k => ({ key: k, label: GROUP_LABELS[k], items: grouped[k] }))
}

// ─── Module icon SVGs (inline, minimal) ──────────────────────────────────────
function ModuleIcon({ module, size = 14 }) {
  const color = MODULE_COLORS[module] || '#8b5cf6'
  const glyphs = {
    recon:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55.45-1 1-1s1 .45 1 1v1.93c-3.95-.49-7-3.85-7.07-7.93H7c.55 0 1 .45 1 1s-.45 1-1 1H4.07C4.56 17.08 7.92 20 12 20z',
    web:      'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z',
    network:  'M17 8C8 10 5.9 16.17 3.82 21H5.71c.51-1.2 1.06-2.38 1.7-3.47C9.29 19.38 11.59 20 14 20c4.42 0 8-3.58 8-8 0-.46-.04-.92-.1-1.36C21.16 10.65 19.19 9.26 17 8z',
    password: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    osint:    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    advanced: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96a7.4 7.4 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 00-.59.22L2.74 8.87a.488.488 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.488.488 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.488.488 0 00-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    nav:      'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d={glyphs[module] || glyphs.nav} />
    </svg>
  )
}

// ─── Single result row ────────────────────────────────────────────────────────
function ResultRow({ item, selected, onSelect }) {
  const color = MODULE_COLORS[item.module] || '#8b5cf6'
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer', position: 'relative',
        background: selected ? 'rgba(139,92,246,0.08)' : 'transparent',
        boxShadow: selected ? 'inset 3px 0 0 #8b5cf6' : 'none',
        transition: 'background 0.08s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <ModuleIcon module={item.module} size={15} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {item.label}
          </span>
          {item.module !== 'nav' && (
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
              textTransform: 'uppercase', fontWeight: 700,
              color, background: `${color}18`,
              padding: '2px 6px', borderRadius: 99,
            }}>
              {item.module}
            </span>
          )}
        </div>
        {item.desc && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginTop: 1, letterSpacing: '-0.01em' }}>
            {item.desc}
          </span>
        )}
      </div>
      <span style={{ color: 'var(--text-4)', fontSize: 13, flexShrink: 0 }}>›</span>
    </div>
  )
}

// ─── Recent activity row ──────────────────────────────────────────────────────
function RecentRow({ activity, selected, onSelect }) {
  const color = MODULE_COLORS[activity.module] || '#8b5cf6'
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer',
        background: selected ? 'rgba(139,92,246,0.08)' : 'transparent',
        boxShadow: selected ? 'inset 3px 0 0 #8b5cf6' : 'none',
        transition: 'background 0.08s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{activity.tool}</span>
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
            textTransform: 'uppercase', fontWeight: 700,
            color, background: `${color}18`,
            padding: '2px 6px', borderRadius: 99,
          }}>{activity.module}</span>
        </div>
        {activity.target && (
          <span style={{
            fontSize: 10, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace",
            display: 'block', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: 0,
          }}>
            {activity.target}
          </span>
        )}
      </div>
      <span style={{ color: 'var(--text-4)', fontSize: 13, flexShrink: 0 }}>›</span>
    </div>
  )
}

// ─── Group header ─────────────────────────────────────────────────────────────
function GroupHeader({ label }) {
  return (
    <div style={{
      padding: '10px 16px 5px',
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text-5)', userSelect: 'none',
      fontWeight: 700,
    }}>
      {label}
    </div>
  )
}

// ─── CommandPalette ───────────────────────────────────────────────────────────
export function CommandPalette({ onClose }) {
  const navigate = useNavigate()
  const activities = useActivityStore(s => s.activities)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const q = query.trim().toLowerCase()

  // Build flat list of items for keyboard nav
  const { groups, flatItems } = useMemo(() => {
    if (!q) {
      // No query — show recents + all groups
      const recentActs = activities.slice(0, 5)
      const toolGroups = groupResults(ALL_TOOLS)

      const flat = []
      if (recentActs.length > 0) {
        recentActs.forEach(a => flat.push({ _type: 'recent', data: a }))
      }
      toolGroups.forEach(g => g.items.forEach(item => flat.push({ _type: 'tool', data: item })))

      const groups = []
      if (recentActs.length > 0) {
        groups.push({ key: 'recent', label: 'Recent', items: recentActs.map(a => ({ _type: 'recent', data: a })) })
      }
      toolGroups.forEach(g => groups.push({ key: g.key, label: g.label, items: g.items.map(i => ({ _type: 'tool', data: i })) }))

      return { groups, flatItems: flat }
    }

    // With query — filter by label+desc+module, max 12 results
    const filtered = ALL_TOOLS.filter(item => {
      const haystack = `${item.label} ${item.desc || ''} ${item.module}`.toLowerCase()
      return haystack.includes(q)
    }).slice(0, 12)

    const grouped = groupResults(filtered)
    const flat = filtered.map(item => ({ _type: 'tool', data: item }))
    const groups = grouped.map(g => ({ key: g.key, label: g.label, items: g.items.map(i => ({ _type: 'tool', data: i })) }))

    return { groups, flatItems: flat }
  }, [q, activities])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0)
  }, [q])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIdx])

  const handleSelect = useCallback((item) => {
    if (!item) return
    const { _type, data } = item
    if (_type === 'recent') {
      // Find matching tool entry
      const tool = ALL_TOOLS.find(t => t.module === data.module && t.toolId === data.tool) ||
                   ALL_TOOLS.find(t => t.module === data.module)
      if (tool) {
        navigate(tool.path)
        window.dispatchEvent(new CustomEvent('nexus:selectTool', { detail: { toolId: data.tool } }))
      }
    } else {
      navigate(data.path)
      if (data.type === 'tool' && data.toolId) {
        window.dispatchEvent(new CustomEvent('nexus:selectTool', { detail: { toolId: data.toolId } }))
      }
    }
    onClose()
  }, [navigate, onClose])

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(flatItems[selectedIdx])
    }
  }

  // Track absolute index across groups for keyboard selection
  let absIdx = 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9997,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 600, maxHeight: '70vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-2xl)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          position: 'relative',
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="var(--text-4)" style={{ flexShrink: 0 }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools, pages, actions..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-1)', padding: '14px 0',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          />
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-4)', background: 'var(--bg-raised)',
            border: '1px solid var(--border)', borderRadius: 5,
            padding: '3px 7px', flexShrink: 0, letterSpacing: '0.04em',
            fontWeight: 600,
          }}>
            Ctrl K
          </span>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {flatItems.length === 0 ? (
            <div style={{
              padding: '48px 0', textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, color: 'var(--text-4)', letterSpacing: 0,
            }}>
              no results for "{query}"
            </div>
          ) : (
            groups.map(group => (
              <div key={group.key}>
                <GroupHeader label={group.label} />
                {group.items.map(item => {
                  const myIdx = absIdx++
                  const selected = myIdx === selectedIdx
                  if (item._type === 'recent') {
                    return (
                      <RecentRow
                        key={`recent-${item.data.id}`}
                        activity={item.data}
                        selected={selected}
                        data-selected={selected}
                        onSelect={() => handleSelect(item)}
                      />
                    )
                  }
                  return (
                    <ResultRow
                      key={`${item.data.module}-${item.data.toolId || item.data.label}`}
                      item={item.data}
                      selected={selected}
                      onSelect={() => handleSelect(item)}
                    />
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
        }}>
          {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-4)', background: 'var(--bg-raised)',
                border: '1px solid var(--border)', borderRadius: 4,
                padding: '2px 6px', fontWeight: 600, letterSpacing: '0.04em',
              }}>{key}</span>
              <span style={{ fontSize: 10, color: 'var(--text-5)', letterSpacing: '0.02em' }}>{label}</span>
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{
            fontSize: 9, color: 'var(--text-5)',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
          }}>
            {flatItems.length} result{flatItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
