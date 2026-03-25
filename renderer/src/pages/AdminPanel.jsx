import { useState, useEffect } from 'react'
import { useLogStore } from '../store/logStore'
import { useActivityStore } from '../store/activityStore'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { ToggleSwitch } from '../components/Forms/index'
import { Icon } from '../components/Icons'

const SECTIONS = [
  { id: 'overview', icon: 'dashboard', label: 'Overview'  },
  { id: 'users',    icon: 'username',  label: 'Users'     },
  { id: 'audit',    icon: 'wordlist',  label: 'Audit Log' },
  { id: 'security', icon: 'crack',     label: 'Security'  },
  { id: 'system',   icon: 'ports',     label: 'System'    },
]

const MOD_COLORS = { recon: '#3b82f6', web: '#8b5cf6', network: '#6366f1', password: '#10b981', osint: '#ec4899' }

const card = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '16px 18px' }
const label = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-5)', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }

function StatCard({ icon, iconColor, label: lbl, value, sub }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${iconColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
          <Icon name={icon} size={15} />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{lbl}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
          {sub && <p style={{ fontSize: 10, color: 'var(--text-5)', marginTop: 4 }}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function inp(extra = {}) {
  return { background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-1)', fontSize: 13, padding: '7px 10px', width: '100%', outline: 'none', ...extra }
}

const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

export function AdminPanel({ onClose }) {
  const [section, setSection]         = useState('overview')
  const [logFilter, setLogFilter]     = useState('')
  const [logLevel, setLogLevel]       = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail]       = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole]         = useState('user')
  const [mainMsg, setMainMsg]         = useState('')
  const [uptime, setUptime]           = useState(0)

  const logs       = useLogStore(s => s.logs)
  const clearLogs  = useLogStore(s => s.clearLogs)
  const exportLogs = useLogStore(s => s.exportLogs)
  const activities = useActivityStore(s => s.activities)
  const { pythonStatus, port, maintenanceMode, maintenanceMessage, setMaintenanceMode,
          threatLevel, setThreatLevel, lockoutEnabled, setLockoutEnabled,
          failedScanCount, resetFailedScans } = useSettingsStore()
  const { users, currentUser, addUser, deleteUser, updateUser } = useAuthStore()

  useEffect(() => {
    const t = setInterval(() => setUptime(u => u + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const filteredLogs = logs.filter(l => {
    const matchText  = !logFilter || JSON.stringify(l).toLowerCase().includes(logFilter.toLowerCase())
    const matchLevel = logLevel === 'all' || l.action?.includes(logLevel)
    return matchText && matchLevel
  })

  const scansByHour = Array.from({ length: 7 }, (_, i) => {
    const cutoff = Date.now() - (6 - i) * 3600000
    return activities.filter(a => a.timestamp >= cutoff && a.timestamp < cutoff + 3600000).length
  })

  async function handleAddUser(e) {
    e.preventDefault()
    if (!newUsername || !newPassword) return
    await addUser(newUsername, newEmail, newPassword, newRole)
    setNewUsername(''); setNewEmail(''); setNewPassword(''); setShowAddUser(false)
  }

  const activeSection = SECTIONS.find(s => s.id === section)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div style={{ position: 'relative', display: 'flex', width: 1060, height: 720, borderRadius: 'var(--r-2xl)', overflow: 'hidden', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Sidebar ── */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}>

          {/* Header */}
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 900 }}>N</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>Admin Panel</p>
                <p style={{ fontSize: 10, color: 'var(--text-5)', fontFamily: "'JetBrains Mono', monospace" }}>Ctrl+Shift+A to close</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
            {SECTIONS.map(s => {
              const isActive = section === s.id
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 8px', borderRadius: 7,
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s',
                    background: isActive ? 'var(--accent-soft)' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 var(--accent-hi)' : 'none',
                    border: 'none', marginBottom: 1, color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  }}>
                  <Icon name={s.icon} size={14} style={{ color: isActive ? '#a78bfa' : '#303048', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                  {s.id === 'audit' && logs.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                      {logs.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* User */}
          <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {currentUser?.username[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{currentUser?.username}</p>
                <p style={{ fontSize: 10, color: 'var(--text-5)', lineHeight: 1.3, textTransform: 'capitalize' }}>{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Content header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>{activeSection?.label}</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {section === 'overview'  && 'System overview and session activity'}
                {section === 'users'     && `${users.length} account${users.length !== 1 ? 's' : ''} registered`}
                {section === 'audit'     && `${logs.length} events recorded`}
                {section === 'security'  && 'Access controls and threat management'}
                {section === 'system'    && 'Runtime environment'}
              </p>
            </div>
            <button onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text-3)' }}>
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* ── OVERVIEW ── */}
            {section === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <StatCard icon="terminal"  iconColor="#7c3aed" label="Total Scans"  value={activities.length}                                               sub="this session" />
                  <StatCard icon="wordlist"  iconColor="#3b82f6" label="Audit Events" value={logs.length}                                                     sub="max 500" />
                  <StatCard icon="username"  iconColor="#10b981" label="Users"        value={users.length}                                                    sub={`${users.filter(u=>u.role==='admin').length} admin`} />
                  <StatCard icon="dashboard" iconColor="#f59e0b" label="Uptime"       value={fmt(uptime)}                                                     sub="since launch" />
                </div>

                {/* Activity chart */}
                <div style={card}>
                  <p style={label}>Scan Activity — Last 7 Hours</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                    {scansByHour.map((v, i) => {
                      const max = Math.max(...scansByHour, 1)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-5)' }}>{v > 0 ? v : ''}</span>
                          <div style={{ width: '100%', borderRadius: 4, background: v > 0 ? 'var(--accent-hi)' : 'rgba(255,255,255,0.04)', height: `${Math.max((v/max)*60, v>0?6:2)}px`, transition: 'height 0.5s', opacity: v > 0 ? 0.7 : 1 }} />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-5)' }}>{`-${6-i}h`}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Module breakdown + recent */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={card}>
                    <p style={label}>Scans by Module</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(MOD_COLORS).map(([tag, color]) => {
                        const count = activities.filter(a => a.module === tag).length
                        const pct   = activities.length ? (count / activities.length) * 100 : 0
                        return (
                          <div key={tag}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{tag}</span>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-4)' }}>{count}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 4, background: color, width: `${pct}%`, transition: 'width 0.6s' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={card}>
                    <p style={label}>Recent Activity</p>
                    {activities.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-5)', textAlign: 'center', padding: '20px 0' }}>No activity yet</p>
                    ) : activities.slice(0,6).map(a => {
                      const color = MOD_COLORS[a.module] || '#888'
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.tool}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-5)', flexShrink: 0 }}>{new Date(a.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {section === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{users.length} registered {users.length === 1 ? 'user' : 'users'}</p>
                  <button onClick={() => setShowAddUser(v => !v)}
                    style={{ padding: '7px 14px', borderRadius: 7, background: '#7c3aed', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    + Add User
                  </button>
                </div>

                {showAddUser && (
                  <form onSubmit={handleAddUser} style={{ ...card, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 12 }}>New Account</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {[{l:'Username',v:newUsername,s:setNewUsername,p:'username',req:true},{l:'Email',v:newEmail,s:setNewEmail,p:'email'},{l:'Password',v:newPassword,s:setNewPassword,p:'password',req:true}].map(f => (
                        <div key={f.l}>
                          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>{f.l}</label>
                          <input value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.p} required={f.req} style={inp()} />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Role</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)} style={inp()}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ padding: '7px 16px', borderRadius: 7, background: '#7c3aed', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Create</button>
                      <button type="button" onClick={() => setShowAddUser(false)} style={{ padding: '7px 16px', borderRadius: 7, background: 'transparent', color: '#666680', fontSize: 12, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                )}

                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: 16, padding: '8px 16px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                    {['','User','Email','Role',''].map((h,i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-5)' }}>{h}</span>
                    ))}
                  </div>
                  {users.map((u, i) => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: 16, alignItems: 'center', padding: '10px 16px', borderBottom: i < users.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{u.username}
                          {u.id === currentUser?.id && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontFamily: 'monospace' }}>you</span>}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-5)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '—'}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, color: u.role === 'admin' ? '#a78bfa' : '#44445a', background: u.role === 'admin' ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)' }}>
                        {u.role}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} style={inp({ width: 'auto', fontSize: 11, padding: '4px 8px' })}>
                          <option value="user">user</option><option value="admin">admin</option>
                        </select>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => { if (confirm(`Delete ${u.username}?`)) deleteUser(u.id) }}
                            style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#44445a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#44445a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
                            <Icon name="clear" size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AUDIT LOG ── */}
            {section === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={logFilter} onChange={e => setLogFilter(e.target.value)} placeholder="Search logs..." style={inp({ flex: 1 })} />
                  <select value={logLevel} onChange={e => setLogLevel(e.target.value)} style={inp({ width: 130 })}>
                    <option value="all">All events</option><option value="scan">Scans</option><option value="error">Errors</option><option value="admin">Admin</option>
                  </select>
                  <button onClick={exportLogs} style={{ padding: '7px 14px', borderRadius: 7, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, cursor: 'pointer' }}>Export</button>
                  <button onClick={clearLogs}  style={{ padding: '7px 14px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-4)' }}>{filteredLogs.length} entries</p>
                <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {filteredLogs.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-5)' }}>No logs recorded yet</p>
                    </div>
                  ) : filteredLogs.map((log, i) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 16px', borderBottom: i < filteredLogs.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-5)', flexShrink: 0, paddingTop: 2, width: 60 }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, flexShrink: 0, padding: '2px 8px', borderRadius: 4,
                        color: log.action?.includes('error')||log.action?.includes('crash') ? '#f87171' : log.action?.includes('scan')||log.action?.includes('run') ? '#a78bfa' : log.action?.includes('admin') ? '#fb923c' : '#44445a',
                        background: log.action?.includes('error')||log.action?.includes('crash') ? 'rgba(239,68,68,0.08)' : log.action?.includes('scan')||log.action?.includes('run') ? 'rgba(124,58,237,0.08)' : log.action?.includes('admin') ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.04)',
                      }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1, lineHeight: 1.5 }}>
                        {log.module && `[${log.module}] `}{log.tool && `${log.tool} `}{log.target && `→ ${log.target} `}{log.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {section === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Maintenance */}
                <div style={{ ...card, border: `1px solid ${maintenanceMode ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                  <p style={label}>Maintenance Mode</p>
                  <ToggleSwitch label="Lock down all tools" description="Shows the maintenance screen and disables all scanning" checked={maintenanceMode} onChange={v => setMaintenanceMode(v, mainMsg || undefined)} />
                  {maintenanceMode && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <p style={{ fontSize: 12, color: '#f87171' }}>System is currently locked — all tools disabled</p>
                    </div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Custom lockout message</label>
                    <input value={mainMsg} onChange={e => setMainMsg(e.target.value)} placeholder={maintenanceMessage} style={inp()} />
                  </div>
                </div>

                {/* Threat level */}
                <div style={card}>
                  <p style={label}>Threat Level</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { v: 'normal',   label: 'Normal',   desc: 'Routine operations',  color: '#10b981' },
                      { v: 'elevated', label: 'Elevated', desc: 'Heightened awareness', color: '#f59e0b' },
                      { v: 'critical', label: 'Critical', desc: 'Active threat',        color: '#ef4444' },
                    ].map(t => (
                      <button key={t.v} onClick={() => setThreatLevel(t.v)}
                        style={{ padding: '14px', borderRadius: 9, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                          background: threatLevel === t.v ? `${t.color}10` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${threatLevel === t.v ? `${t.color}30` : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, marginBottom: 10 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: threatLevel === t.v ? t.color : 'var(--text-2)', marginBottom: 3 }}>{t.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lockout */}
                <div style={card}>
                  <p style={label}>Scan Lockout</p>
                  <ToggleSwitch label="Enable automatic lockout after failed scans" checked={lockoutEnabled} onChange={setLockoutEnabled} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Failed scans this session: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-2)' }}>{failedScanCount}</span></p>
                    {failedScanCount > 0 && (
                      <button onClick={resetFailedScans} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(124,58,237,0.08)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11, cursor: 'pointer' }}>Reset</button>
                    )}
                  </div>
                </div>

                {/* Danger */}
                <div style={{ ...card, background: 'rgba(255,71,87,0.04)', border: '1px solid rgba(255,71,87,0.15)' }}>
                  <p style={{ ...label, color: 'rgba(255,71,87,0.4)' }}>Danger Zone</p>
                  <button onClick={() => { if (confirm('Clear all activity logs and audit log?')) { useActivityStore.getState().clearActivities(); useLogStore.getState().clearLogs() } }}
                    style={{ padding: '7px 14px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, cursor: 'pointer' }}>
                    Clear All Data
                  </button>
                </div>
              </div>
            )}

            {/* ── SYSTEM ── */}
            {section === 'system' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Engine',    value: pythonStatus, color: pythonStatus === 'online' ? 'var(--green)' : 'var(--red)' },
                    { label: 'Port',      value: port || 'N/A', color: 'var(--text-2)' },
                    { label: 'Platform',  value: navigator.platform, color: 'var(--text-2)' },
                    { label: 'Memory',    value: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A', color: 'var(--text-2)' },
                    { label: 'Uptime',    value: fmt(uptime), color: 'var(--text-2)' },
                    { label: 'Tools',     value: '26', color: 'var(--accent-light)' },
                  ].map(item => (
                    <div key={item.label} style={card}>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{item.label}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div style={card}>
                  <p style={label}>Stack</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Electron v28','React v19','FastAPI','Python 3','Tailwind v4','Zustand','SSE Streaming'].map(t => (
                      <span key={t} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: '3px 10px', borderRadius: 5, background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid rgba(139,92,246,0.2)' }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <p style={label}>User Agent</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-5)', lineHeight: 1.6, wordBreak: 'break-all' }}>{navigator.userAgent}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
