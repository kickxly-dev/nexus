import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '../Icons'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { WorkspaceManager } from '../WorkspaceManager'

const NAV = [
  { to: '/',          label: 'Dashboard',   icon: 'dashboard',  exact: true },
  { to: '/recon',     label: 'Recon',       icon: 'recon',      count: 12  },
  { to: '/web',       label: 'Web Exploit', icon: 'web',        count: 12  },
  { to: '/network',   label: 'Network',     icon: 'network',    count: 5   },
  { to: '/password',  label: 'Password',    icon: 'password',   count: 7   },
  { to: '/osint',     label: 'OSINT',       icon: 'osint',      count: 5   },
  { to: '/advanced',  label: 'Advanced',    icon: 'terminal',   count: 6   },
]

function NavItem({ to, label, icon, exact, count }) {
  return (
    <NavLink to={to} end={exact}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        borderRadius: 'var(--r-md)',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        letterSpacing: '-0.012em',
        color: isActive ? 'var(--text-1)' : 'var(--text-3)',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        boxShadow: isActive ? 'inset 3px 0 0 var(--accent-hi)' : 'none',
        transition: 'all 0.12s',
        marginBottom: 1,
      })}
      onMouseEnter={e => {
        const a = e.currentTarget
        if (!a.style.background.includes('124')) {
          a.style.background = 'var(--bg-hover)'
          a.style.color = 'var(--text-2)'
        }
      }}
      onMouseLeave={e => {
        const a = e.currentTarget
        if (!a.style.background.includes('124')) {
          a.style.background = 'transparent'
          a.style.color = 'var(--text-3)'
        }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={14} style={{
            color: isActive ? 'var(--accent-light)' : 'var(--text-4)',
            flexShrink: 0, transition: 'color 0.12s',
          }} />
          <span style={{ flex: 1, userSelect: 'none' }}>{label}</span>
          {count != null && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: 0,
              padding: '1px 6px', borderRadius: 99,
              color: isActive ? 'var(--accent-light)' : 'var(--text-5)',
              background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
              transition: 'all 0.12s',
            }}>
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { currentUser, logout } = useAuthStore()
  const getActive = useWorkspaceStore(s => s.getActive)
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false)

  const activeWorkspace = getActive()

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
    }}>

      {/* Brand */}
      <div style={{
        padding: '18px 16px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.5)',
          }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>N</span>
          </div>
          <div>
            <p style={{
              color: 'var(--text-1)', fontSize: 15, fontWeight: 700,
              lineHeight: 1.1, letterSpacing: '-0.03em',
            }}>Nexus</p>
            <p style={{
              color: 'var(--text-5)', fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.4, letterSpacing: 0, marginTop: 2,
            }}>
              v{__APP_VERSION__} · security toolkit
            </p>
          </div>
        </div>

        {/* Workspace indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 10px',
          margin: '4px -2px 0',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
        }}>
          {/* Colored dot */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: activeWorkspace.color,
            flexShrink: 0,
          }} />

          {/* Workspace name */}
          <span style={{
            flex: 1, fontSize: 10, color: 'var(--text-3)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em', userSelect: 'none',
          }}>
            {activeWorkspace.name}
          </span>

          {/* Open workspace manager button */}
          <button
            onClick={() => setShowWorkspaceManager(true)}
            title="Manage workspaces"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-5)', padding: '2px 3px',
              display: 'flex', alignItems: 'center',
              borderRadius: 4, flexShrink: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-5)'}
          >
            {/* Folder / grid icon */}
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 8px' }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-5)',
          padding: '0 12px 7px',
        }}>Modules</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV.map(item => <NavItem key={item.to} {...item} />)}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
          <NavItem to="/settings" label="Settings" icon="settings" />
        </div>
      </div>

      {/* User */}
      {currentUser && (
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 11, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
            }}>
              {currentUser.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text-1)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                lineHeight: 1.3,
              }}>{currentUser.username}</p>
              <p style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'capitalize', lineHeight: 1.3 }}>
                {currentUser.role}
              </p>
            </div>
            <button onClick={logout} title="Sign out"
              style={{
                color: 'var(--text-5)', background: 'none', border: 'none',
                padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0,
                borderRadius: 'var(--r-sm)', cursor: 'pointer',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-5)'}
            >
              <Icon name="logout" size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Workspace Manager modal */}
      {showWorkspaceManager && (
        <WorkspaceManager onClose={() => setShowWorkspaceManager(false)} />
      )}
    </aside>
  )
}
