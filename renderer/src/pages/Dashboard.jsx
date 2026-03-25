import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { useLogStore } from '../store/logStore'
import { useAuthStore } from '../store/authStore'
import { Icon } from '../components/Icons'

const MODULES = [
  { to: '/recon',    label: 'Reconnaissance',  icon: 'recon',    count: 14, tag: 'recon',
    hex: '#4a9eff',
    tools: ['DNS','WHOIS','Port Scan','Subdomains','Fingerprint','Reverse DNS','GeoIP','Traceroute','ASN Lookup','Sub Takeover','Cert Logs','Banner Grab','WAF Detector','CMS Detector'] },
  { to: '/web',      label: 'Web Exploitation', icon: 'web',      count: 18, tag: 'web',
    hex: '#a78bfa',
    tools: ['Headers','Dir Brute','SQLi','XSS','CORS','HTTP Methods','JWT Analyzer','Open Redirect','LFI Scanner','SSRF','Cookie Audit','CSP Analyzer','SSTI','Param Discovery','HTTP Smuggling','Clickjacking','XXE Scanner','SQLMap'] },
  { to: '/network',  label: 'Network Analysis', icon: 'network',  count: 8,  tag: 'network',
    hex: '#00d4ff',
    tools: ['Services','ARP Scan','Net Map','Capture','Ping Sweep','SMB Enum','SSH Audit','Nmap Raw'] },
  { to: '/password', label: 'Password & Auth',  icon: 'password', count: 8,  tag: 'password',
    hex: '#00d084',
    tools: ['Identify','Crack','Wordlist','Credentials','Encoder','Strength','Hash Lookup','JWT Cracker'] },
  { to: '/osint',    label: 'OSINT',            icon: 'osint',    count: 8,  tag: 'osint',
    hex: '#ff69b4',
    tools: ['Email Recon','Username','SSL Inspect','Breach Check','IP Reputation','Reverse IP','GitHub Dork','Shodan'] },
  { to: '/advanced', label: 'Advanced Tools',   icon: 'terminal', count: 6,  tag: 'advanced',
    hex: '#ff7a00',
    tools: ['Nuclei Scanner','Nmap Raw','SQLMap','Clickjacking','XXE Scanner','Script Runner'] },
]

function fmtUptime(s) {
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`
}

function StatCard({ icon, color, label, value, sub }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 14,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon name={icon} size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 9, color: 'var(--text-4)', marginBottom: 5,
          textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
        }}>{label}</p>
        <p style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em',
        }}>{value}</p>
        {sub && <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

function ModuleCard({ mod, scans, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'stretch', textAlign: 'left', cursor: 'pointer',
        borderRadius: 'var(--r-xl)', overflow: 'hidden',
        background: hover
          ? `radial-gradient(ellipse at top left, ${mod.hex}16 0%, transparent 65%), var(--bg-surface)`
          : `radial-gradient(ellipse at top left, ${mod.hex}0a 0%, transparent 65%), var(--bg-surface)`,
        border: `1px solid ${hover ? mod.hex + '35' : 'var(--border)'}`,
        boxShadow: hover
          ? `0 0 28px ${mod.hex}18, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.18s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}>
      {/* Color accent strip */}
      <div style={{
        width: 3, background: mod.hex, flexShrink: 0,
        opacity: hover ? 1 : 0.3, transition: 'opacity 0.18s',
        boxShadow: hover ? `0 0 12px ${mod.hex}` : 'none',
      }} />
      <div style={{ flex: 1, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `${mod.hex}15`,
              border: `1px solid ${mod.hex}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: mod.hex,
            }}>
              <Icon name={mod.icon} size={15} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.018em' }}>
              {mod.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {scans > 0 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 0,
                padding: '2px 7px', borderRadius: 99,
                color: mod.hex, background: `${mod.hex}15`,
                border: `1px solid ${mod.hex}30`, fontWeight: 600,
              }}>{scans} runs</span>
            )}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: 'var(--text-5)', letterSpacing: 0, fontWeight: 600,
            }}>{mod.count}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 4px' }}>
          {mod.tools.map(t => (
            <span key={t} style={{
              fontSize: 10, color: 'var(--text-3)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', padding: '1px 6px',
              letterSpacing: '-0.01em',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </button>
  )
}

export function Dashboard() {
  const navigate   = useNavigate()
  const activities = useActivityStore(s => s.activities)
  const pyStatus   = useSettingsStore(s => s.pythonStatus)
  const addLog     = useLogStore(s => s.addLog)
  const user       = useAuthStore(s => s.currentUser)
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const t0 = Date.now()
    const t = setInterval(() => setUptime(Math.floor((Date.now() - t0) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const last   = activities[0]
  const online = pyStatus === 'online'

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)' }}>
      <div style={{ maxWidth: 900, padding: '28px 28px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '-0.035em' }}>
              {user ? `Welcome back, ${user.username}` : 'Dashboard'}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              Nexus Security Toolkit · 64 tools across 6 modules
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 99, flexShrink: 0,
            background: online ? 'rgba(0,208,132,0.07)' : 'rgba(255,71,87,0.07)',
            border: `1px solid ${online ? 'rgba(0,208,132,0.2)' : 'rgba(255,71,87,0.2)'}`,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: online ? 'var(--green)' : 'var(--red)',
              boxShadow: online ? '0 0 8px rgba(0,208,132,0.7)' : 'none',
            }} className={online ? 'pulse-dot' : ''} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.04em',
              color: online ? 'rgba(0,208,132,0.9)' : 'rgba(255,71,87,0.9)',
              fontWeight: 500,
            }}>{pyStatus}</span>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <StatCard icon="terminal"  color="#8b5cf6" label="Total Scans"  value={String(activities.length)} sub="this session" />
          <StatCard icon="dashboard" color="#4a9eff" label="Session Time" value={fmtUptime(uptime)}          sub="since launch"  />
          <StatCard icon="recon"     color="#00d084" label="Tools Ready"  value="64"                         sub="6 modules"     />
          <StatCard icon="settings"  color="#ffd700" label="Last Scan"
            value={last ? new Date(last.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—'}
            sub={last?.tool || 'none yet'} />
        </div>

        {/* ── Modules ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Modules</h2>
            <span style={{ fontSize: 10, color: 'var(--text-5)', fontFamily: "'JetBrains Mono', monospace" }}>click to open →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {MODULES.map(mod => (
              <ModuleCard key={mod.to} mod={mod}
                scans={activities.filter(a => a.module === mod.tag).length}
                onClick={() => { addLog('module_open', { module: mod.label }); navigate(mod.to) }} />
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Activity</h2>
            {activities.length > 0 && (
              <button onClick={() => useActivityStore.getState().clearActivities()}
                style={{
                  fontSize: 10, color: 'var(--text-4)', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
                clear all
              </button>
            )}
          </div>

          <div style={{
            borderRadius: 'var(--r-xl)', overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
          }}>
            {activities.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--text-4)', letterSpacing: 0 }}>
                  $ no scans yet
                </p>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--text-5)', marginTop: 8, letterSpacing: 0 }}>
                  open a module and run a tool to get started
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Module','Tool','Target','Time'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', fontSize: 9, fontWeight: 700,
                        color: 'var(--text-5)', textTransform: 'uppercase',
                        letterSpacing: '0.1em', padding: '10px 16px',
                        background: 'var(--bg-raised)',
                        borderBottom: '1px solid var(--border)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.slice(0,10).map((a, i, arr) => {
                    const mod = MODULES.find(m => m.tag === a.module)
                    return (
                      <tr key={a.id}
                        style={{ borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                            fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 'var(--r-sm)',
                            color: mod?.hex || 'var(--text-2)',
                            background: `${mod?.hex || '#888'}15`,
                            border: `1px solid ${mod?.hex || '#888'}25`,
                          }}>{a.module}</span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{a.tool}</td>
                        <td style={{
                          padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11, color: 'var(--text-3)', letterSpacing: 0,
                          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{a.target || '—'}</td>
                        <td style={{
                          padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11, color: 'var(--text-4)', letterSpacing: 0, whiteSpace: 'nowrap',
                        }}>
                          {new Date(a.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p style={{
          fontSize: 9, color: 'var(--text-5)', textAlign: 'center',
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.03em',
        }}>
          only scan targets you own or have explicit written permission to test
        </p>
      </div>
    </div>
  )
}
