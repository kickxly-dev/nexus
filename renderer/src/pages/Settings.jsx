import { useRef } from 'react'
import { useConfigStore } from '../store/configStore'
import { InputField, ToggleSwitch } from '../components/Forms/index'

function Section({ title, children }) {
  return (
    <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.02]">
      <h3 className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-4">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

export function Settings() {
  const cfg = useConfigStore()
  const fileRef = useRef()

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = cfg.importConfig(ev.target.result)
      if (!ok) alert('Invalid config file')
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#08080f' }}>
      <div className="absolute inset-0 grid-bg-fine opacity-40 pointer-events-none" />

      <div className="relative px-8 pt-7 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight shimmer-text mb-1">Settings</h1>
        <p className="text-white/20 text-[13px]">Persistent configuration — saved to localStorage</p>
      </div>

      <div className="relative px-8 pb-8 grid grid-cols-2 gap-4">

        {/* Wordlists */}
        <Section title="Wordlist Paths">
          <InputField label="Subdomains wordlist" value={cfg.wordlistSubdomains}
            onChange={v => cfg.set('wordlistSubdomains', v)} placeholder="backend/data/wordlists/subdomains.txt" />
          <InputField label="Directories wordlist" value={cfg.wordlistDirectories}
            onChange={v => cfg.set('wordlistDirectories', v)} placeholder="backend/data/wordlists/directories.txt" />
          <InputField label="Passwords wordlist" value={cfg.wordlistPasswords}
            onChange={v => cfg.set('wordlistPasswords', v)} placeholder="backend/data/wordlists/rockyou_top10k.txt" />
          <InputField label="SQLi payloads" value={cfg.wordlistPayloads}
            onChange={v => cfg.set('wordlistPayloads', v)} placeholder="backend/data/payloads/sqli.txt" />
        </Section>

        {/* Scan settings */}
        <Section title="Scan Defaults">
          <InputField label="HTTP timeout (seconds)" value={String(cfg.httpTimeout)}
            onChange={v => cfg.set('httpTimeout', Number(v))} type="number" />
          <InputField label="Credential test delay (seconds)" value={String(cfg.scanDelay)}
            onChange={v => cfg.set('scanDelay', Number(v))} type="number" />
          <InputField label="Default threads" value={String(cfg.defaultThreads)}
            onChange={v => cfg.set('defaultThreads', Number(v))} type="number" />
          <InputField label="Default port range" value={cfg.defaultPorts}
            onChange={v => cfg.set('defaultPorts', v)} placeholder="1-1000" />
        </Section>

        {/* App settings */}
        <Section title="App Behaviour">
          <InputField label="Max activity history" value={String(cfg.maxActivities)}
            onChange={v => cfg.set('maxActivities', Number(v))} type="number" />
          <InputField label="Max audit log entries" value={String(cfg.maxLogs)}
            onChange={v => cfg.set('maxLogs', Number(v))} type="number" />
          <ToggleSwitch label="Auto-clear output on new scan"
            checked={cfg.autoClearOnNewScan} onChange={v => cfg.set('autoClearOnNewScan', v)} />
          <ToggleSwitch label="Show line numbers in output"
            checked={cfg.showLineNumbers} onChange={v => cfg.set('showLineNumbers', v)} />
          <ToggleSwitch label="Auto-scroll to latest output"
            checked={cfg.autoScroll} onChange={v => cfg.set('autoScroll', v)} />
        </Section>

        {/* Config management */}
        <Section title="Config Management">
          <p className="text-white/20 text-[11px] leading-relaxed">
            Export your settings as JSON to back them up or share across machines. Import to restore.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={cfg.exportConfig}
              className="w-full py-2.5 rounded-lg text-[12px] font-semibold transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', boxShadow: '0 4px 15px rgba(124,58,237,0.2)' }}>
              Export Config JSON
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
              Import Config JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={() => { if (confirm('Reset all settings to defaults?')) cfg.reset() }}
              className="w-full py-2.5 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', color: 'rgba(248,113,113,0.5)', border: '1px solid rgba(239,68,68,0.1)' }}>
              Reset to Defaults
            </button>
          </div>

          {/* Current config preview */}
          <div className="mt-2 p-3 rounded-lg font-mono text-[10px] text-white/20 overflow-x-auto"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-white/10 mb-1">// active config</p>
            {Object.entries({
              httpTimeout: cfg.httpTimeout,
              scanDelay: cfg.scanDelay,
              defaultThreads: cfg.defaultThreads,
              defaultPorts: cfg.defaultPorts,
              maxActivities: cfg.maxActivities,
            }).map(([k, v]) => (
              <p key={k}><span className="text-purple-400/40">{k}</span>: <span className="text-blue-400/40">{JSON.stringify(v)}</span></p>
            ))}
          </div>
        </Section>

        {/* About */}
        <div className="col-span-2 p-5 rounded-xl border border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                <span className="text-white font-black text-sm">N</span>
              </div>
              <div>
                <p className="text-white font-bold">Nexus Security Toolkit</p>
                <p className="text-white/25 text-[11px] font-mono">v1.1.0 · 26 tools · For authorized use only</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/15 text-[10px] font-mono">Electron + React + FastAPI</p>
              <p className="text-white/10 text-[10px] font-mono">Tailwind CSS v4 · Zustand · SSE Streaming</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
