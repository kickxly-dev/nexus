import { useState, useEffect } from 'react'

export function UpdateBanner() {
  const [update, setUpdate] = useState(null)

  useEffect(() => {
    if (!window.nexus?.onUpdateStatus) return
    const cleanup = window.nexus.onUpdateStatus((data) => {
      if (data.status === 'checking' || data.status === 'up-to-date') return
      setUpdate(data)
    })
    return cleanup
  }, [])

  if (!update) return null

  const { status, version, percent } = update

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(8,8,16,0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 420, borderRadius: 16,
        background: '#111119', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #5b21b6)' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>N</span>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#e2e2ea' }}>Nexus</p>
              <p style={{ fontSize: 11, color: '#44445a', marginTop: 2, fontFamily: 'monospace' }}>
                {status === 'available'   && `v${__APP_VERSION__} → v${version}`}
                {status === 'downloading' && `Downloading v${version}...`}
                {status === 'downloaded'  && `v${version} ready to install`}
                {status === 'error'       && 'Update failed'}
              </p>
            </div>
          </div>

          {/* State: available */}
          {status === 'available' && (
            <>
              <p style={{ fontSize: 13, color: '#8888a0', marginBottom: 24, lineHeight: 1.6 }}>
                A new version of Nexus is available. Download and install it now — the app will restart automatically.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { window.nexus.updateDownload(); setUpdate({ ...update, status: 'downloading', percent: 0 }) }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', border: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Update Now
                </button>
                <button onClick={() => setUpdate(null)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#6a6a80', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Later
                </button>
              </div>
            </>
          )}

          {/* State: downloading */}
          {status === 'downloading' && (
            <>
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#505068' }}>Downloading update...</span>
                <span style={{ fontSize: 12, color: '#7c3aed', fontFamily: 'monospace' }}>{percent ?? 0}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent ?? 0}%`, background: 'linear-gradient(90deg, #7c3aed, #5b21b6)', transition: 'width 0.4s ease', borderRadius: 6 }} />
              </div>
              <p style={{ fontSize: 11, color: '#303040', marginTop: 12 }}>Please wait, do not close the app.</p>
            </>
          )}

          {/* State: downloaded */}
          {status === 'downloaded' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#10b981' }}>Download complete — ready to install</p>
              </div>
              <button onClick={() => { setUpdate(null); window.nexus.updateInstall() }}
                style={{ width: '100%', padding: '11px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Restart & Install
              </button>
              <p style={{ fontSize: 11, color: '#303040', textAlign: 'center', marginTop: 10 }}>App will restart and reopen automatically.</p>
            </>
          )}

          {/* State: error */}
          {status === 'error' && (
            <>
              <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>Update failed:</p>
              <p style={{ fontSize: 11, color: '#ef4444', opacity: 0.7, marginBottom: 16, fontFamily: 'monospace', wordBreak: 'break-all' }}>{update.message || 'Unknown error'}</p>
              <button onClick={() => setUpdate(null)}
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#6a6a80', border: '1px solid rgba(255,255,255,0.08)' }}>
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
