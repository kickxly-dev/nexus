import { useRef, useState, useEffect } from 'react'
import { useConfigStore } from '../store/configStore'
import { InputField, ToggleSwitch } from '../components/Forms/index'

/* ─── Section card ───────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '18px 20px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <p style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: 'var(--text-5)',
        marginBottom: 16, fontFamily: "'JetBrains Mono', monospace",
      }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Styled button ──────────────────────────────────── */
function Btn({ onClick, variant = 'default', children }) {
  const styles = {
    primary: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
      color: 'white', border: '1px solid rgba(139,92,246,0.4)',
      boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    },
    danger: {
      background: 'rgba(255,71,87,0.07)',
      color: 'var(--red)', border: '1px solid rgba(255,71,87,0.2)',
    },
    default: {
      background: 'var(--bg-raised)',
      color: 'var(--text-2)', border: '1px solid var(--border-strong)',
    },
  }
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '8px 14px', borderRadius: 'var(--r-md)',
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
      transition: 'opacity 0.12s, transform 0.1s, box-shadow 0.15s',
      ...styles[variant],
    }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.85'
        e.currentTarget.style.transform = 'translateY(-1px)'
        if (variant === 'primary') e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.6)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'none'
        if (variant === 'primary') e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'
      }}>
      {children}
    </button>
  )
}

/* ─── About section ──────────────────────────────────── */
function AboutSection() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!window.nexus?.onUpdateStatus) return
    return window.nexus.onUpdateStatus((data) => {
      if (data.status === 'checking')     setStatus('Checking for updates...')
      else if (data.status === 'up-to-date')  setStatus('You are up to date.')
      else if (data.status === 'available')   setStatus(`Update available: v${data.version}`)
      else if (data.status === 'downloading') setStatus(`Downloading... ${data.percent ?? 0}%`)
      else if (data.status === 'downloaded')  setStatus(`v${data.version} ready — restart to install`)
      else if (data.status === 'error')       setStatus(`Error: ${data.message}`)
    })
  }, [])

  const statusColor = status?.startsWith('Error') ? 'var(--red)'
    : status?.includes('ready')     ? 'var(--green)'
    : status?.includes('available') ? 'var(--accent-light)'
    : 'var(--text-3)'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)', padding: '20px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, flexShrink: 0,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(139,92,246,0.3), 0 8px 28px rgba(124,58,237,0.5)',
        }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>N</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.025em' }}>Nexus Security Toolkit</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: 'var(--text-4)', marginTop: 4, letterSpacing: 0,
          }}>v{__APP_VERSION__} · 52 tools · authorized use only</p>
          {status && (
            <p style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: statusColor, marginTop: 5, letterSpacing: 0,
            }}>{status}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <Btn onClick={() => {
          if (window.nexus?.updateCheck) { setStatus('Checking...'); window.nexus.updateCheck() }
          else setStatus('Auto-updater only works in the packaged app.')
        }} variant="primary">
          Check for Updates
        </Btn>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          color: 'var(--text-5)', letterSpacing: 0,
        }}>Electron · React · FastAPI</p>
      </div>
    </div>
  )
}

/* ─── Settings page ──────────────────────────────────── */
export function Settings() {
  const cfg     = useConfigStore()
  const fileRef = useRef()

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (!cfg.importConfig(ev.target.result)) alert('Invalid config file') }
    reader.readAsText(file)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)' }}>
      <div style={{ maxWidth: 860, padding: '28px 28px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.035em', lineHeight: 1.2 }}>
            Settings
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>
            Configuration persisted to localStorage
          </p>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <Section title="Wordlist Paths">
            <InputField label="Subdomains"    value={cfg.wordlistSubdomains}  onChange={v => cfg.set('wordlistSubdomains',  v)} placeholder="backend/data/wordlists/subdomains.txt" />
            <InputField label="Directories"   value={cfg.wordlistDirectories} onChange={v => cfg.set('wordlistDirectories', v)} placeholder="backend/data/wordlists/directories.txt" />
            <InputField label="Passwords"     value={cfg.wordlistPasswords}   onChange={v => cfg.set('wordlistPasswords',   v)} placeholder="backend/data/wordlists/rockyou.txt" />
            <InputField label="SQLi payloads" value={cfg.wordlistPayloads}    onChange={v => cfg.set('wordlistPayloads',    v)} placeholder="backend/data/payloads/sqli.txt" />
          </Section>

          <Section title="Scan Defaults">
            <InputField label="HTTP timeout (s)"       value={String(cfg.httpTimeout)}    onChange={v => cfg.set('httpTimeout',    Number(v))} type="number" />
            <InputField label="Credential delay (s)"   value={String(cfg.scanDelay)}      onChange={v => cfg.set('scanDelay',      Number(v))} type="number" />
            <InputField label="Default threads"        value={String(cfg.defaultThreads)} onChange={v => cfg.set('defaultThreads', Number(v))} type="number" />
            <InputField label="Default port range"     value={cfg.defaultPorts}           onChange={v => cfg.set('defaultPorts',   v)}         placeholder="1-1000" />
          </Section>

          <Section title="App Behaviour">
            <InputField label="Max activity history"    value={String(cfg.maxActivities)} onChange={v => cfg.set('maxActivities', Number(v))} type="number" />
            <InputField label="Max audit log entries"   value={String(cfg.maxLogs)}       onChange={v => cfg.set('maxLogs',       Number(v))} type="number" />
            <ToggleSwitch label="Auto-clear output on new scan" checked={cfg.autoClearOnNewScan} onChange={v => cfg.set('autoClearOnNewScan', v)} />
            <ToggleSwitch label="Show line numbers"             checked={cfg.showLineNumbers}    onChange={v => cfg.set('showLineNumbers',    v)} />
            <ToggleSwitch label="Auto-scroll to latest output"  checked={cfg.autoScroll}         onChange={v => cfg.set('autoScroll',         v)} />
          </Section>

          <Section title="Config Management">
            <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Export settings as JSON to back up or share across machines.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Btn onClick={cfg.exportConfig} variant="primary">Export Config JSON</Btn>
              <Btn onClick={() => fileRef.current?.click()}>Import Config JSON</Btn>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              <Btn onClick={() => { if (confirm('Reset all settings to defaults?')) cfg.reset() }} variant="danger">
                Reset to Defaults
              </Btn>
            </div>

            {/* Active config preview */}
            <div style={{
              background: '#030307',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '10px 12px',
            }}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: 'var(--text-5)', marginBottom: 6, letterSpacing: 0,
              }}>// active config</p>
              {[
                ['httpTimeout', cfg.httpTimeout],
                ['scanDelay', cfg.scanDelay],
                ['defaultThreads', cfg.defaultThreads],
                ['defaultPorts', cfg.defaultPorts],
              ].map(([k, v]) => (
                <p key={k} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: 1.9, letterSpacing: 0 }}>
                  <span style={{ color: 'var(--text-4)' }}>{k}</span>
                  <span style={{ color: 'var(--text-5)' }}>: </span>
                  <span style={{ color: 'var(--text-3)' }}>{JSON.stringify(v)}</span>
                </p>
              ))}
            </div>
          </Section>
        </div>

        <AboutSection />
      </div>
    </div>
  )
}
