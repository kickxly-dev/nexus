import { useState, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton } from '../components/Forms/index'
import { ToolPage } from '../components/ToolPage'

const TOOLS = [
  { id: 'Nuclei',    icon: 'takeover', label: 'Nuclei Scanner',   desc: 'Run Nuclei vulnerability templates'     },
  { id: 'NmapRaw',   icon: 'ports',    label: 'Nmap Raw',         desc: 'Full Nmap with custom flags'            },
  { id: 'SQLMap',    icon: 'sqli',     label: 'SQLMap',           desc: 'Automated SQL injection exploitation'   },
  { id: 'Clickjack', icon: 'cors',     label: 'Clickjacking',     desc: 'Test for clickjacking vulnerability'    },
  { id: 'XXE',       icon: 'xss',      label: 'XXE Scanner',      desc: 'XML external entity injection testing'  },
  { id: 'Script',    icon: 'terminal', label: 'Script Runner',    desc: 'Execute custom Python against a target' },
]

export function Advanced() {
  const [tool, setTool]           = useState('Nuclei')
  const [url, setUrl]             = useState('')
  const [target, setTarget]       = useState('')
  const [flags, setFlags]         = useState('-sV --script=default')
  const [templates, setTemplates] = useState('cves,misconfiguration,exposures')
  const [level, setLevel]         = useState('1')
  const [risk, setRisk]           = useState('1')
  const [script, setScript]       = useState('')
  const { lines, running, start, startPost, stop, clear, loadLines } = useStream()
  const addActivity = useActivityStore(s => s.addActivity)
  const addLog      = useLogStore(s => s.addLog)

  useEffect(() => {
    function handler(e) {
      if (TOOLS.some(t => t.id === e.detail?.id)) setTool(e.detail.id)
    }
    window.addEventListener('nexus:selectTool', handler)
    return () => window.removeEventListener('nexus:selectTool', handler)
  }, [])

  const urlTools = ['SQLMap', 'Clickjack', 'XXE']
  const needsUrl = urlTools.includes(tool)
  const disabled =
    (tool === 'Nuclei'    && !target) ||
    (tool === 'NmapRaw'   && !target) ||
    (tool === 'SQLMap'    && !url)    ||
    (tool === 'Clickjack' && !url)    ||
    (tool === 'XXE'       && !url)    ||
    (tool === 'Script'    && !script)

  function run() {
    const actTarget = needsUrl ? url : target
    addActivity({ module: 'advanced', tool, target: actTarget })
    addLog('scan_start', { module: 'advanced', tool, target: actTarget })

    if (tool === 'Nuclei')    start('/api/advanced/nuclei',    { target, templates })
    else if (tool === 'NmapRaw')   start('/api/network/nmap',       { target, flags })
    else if (tool === 'SQLMap')    start('/api/web/sqlmap',          { url, level, risk })
    else if (tool === 'Clickjack') start('/api/web/clickjacking',    { url })
    else if (tool === 'XXE')       start('/api/web/xxe',             { url })
    else startPost('/api/advanced/script', { script, target: target || undefined })
  }

  return (
    <ToolPage
      tools={TOOLS} activeTool={tool}
      onToolChange={t => { setTool(t); clear() }}
      configFields={<>
        {(tool === 'Nuclei' || tool === 'NmapRaw' || tool === 'Script') && (
          <InputField
            label={tool === 'Script' ? 'Target (optional)' : 'Target'}
            value={target}
            onChange={setTarget}
            placeholder={tool === 'NmapRaw' ? '192.168.1.1' : 'example.com'}
          />
        )}
        {needsUrl && (
          <InputField label="Target URL" value={url} onChange={setUrl} placeholder="https://example.com" />
        )}
        {tool === 'Nuclei' && (
          <InputField label="Templates" value={templates} onChange={setTemplates} placeholder="cves,misconfiguration,exposures" />
        )}
        {tool === 'NmapRaw' && (
          <InputField label="Flags" value={flags} onChange={setFlags} placeholder="-sV --script=default" />
        )}
        {tool === 'SQLMap' && <>
          <SelectField
            label="Level (1–5)"
            value={level}
            onChange={setLevel}
            options={['1','2','3','4','5']}
          />
          <SelectField
            label="Risk (1–3)"
            value={risk}
            onChange={setRisk}
            options={['1','2','3']}
          />
        </>}
        {tool === 'Clickjack' && (
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Checks X-Frame-Options and CSP frame-ancestors directives.</p>
        )}
        {tool === 'XXE' && (
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Tests XML endpoints for external entity injection vulnerabilities.</p>
        )}
        {tool === 'Script' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{
              display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 5,
            }}>Python Script</label>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              rows={8}
              placeholder="# your Python script here..."
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '10px',
                color: 'var(--text-1)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </>}
      onRun={run} onStop={stop} onClear={clear}
      runButton={<RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />}
      output={<StreamOutput lines={lines} running={running} onLoadHistory={loadLines} />}
      footer={<>
        <ExportButton lines={lines} filename={`advanced-${tool.toLowerCase()}`} />
        {lines.length > 0 && (
          <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>Clear</button>
        )}
      </>}
    />
  )
}
