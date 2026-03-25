import { useState, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton, CheckboxField } from '../components/Forms/index'
import { ToolPage } from '../components/ToolPage'

const TOOLS = [
  { id: 'Identify',    icon: 'identify', label: 'Identify',    desc: 'Identify hash algorithm'     },
  { id: 'Crack',       icon: 'crack',    label: 'Crack',       desc: 'Dictionary attack'             },
  { id: 'Wordlist',    icon: 'wordlist', label: 'Wordlist',    desc: 'Generate custom wordlists'    },
  { id: 'Credentials', icon: 'creds',    label: 'Credentials', desc: 'Credential stuffing test'    },
  { id: 'Encoder',     icon: 'encode',   label: 'Encoder',     desc: 'Encode / hash text'           },
  { id: 'Strength',    icon: 'strength',  label: 'Strength',     desc: 'Analyze password strength'    },
  { id: 'HashLookup',  icon: 'lookup',    label: 'Hash Lookup',  desc: 'Online hash reverse lookup'   },
  { id: 'JWTCrack',    icon: 'jwt',       label: 'JWT Cracker',  desc: 'Brute-force JWT signing secret'},
]

const tareaStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e2ea',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '12px',
  width: '100%',
  resize: 'none',
  outline: 'none',
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11px] font-medium text-[#555568]">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows} style={tareaStyle}
        className="placeholder-[#2a2a38]" />
    </div>
  )
}

export function PasswordAuth() {
  const [tool, setTool]                 = useState('Identify')
  const [hash, setHash]                 = useState('')
  const [hashType, setHashType]         = useState('md5')
  const [wordlist, setWordlist]         = useState('')
  const [useMutations, setUseMutations] = useState(true)
  const [seeds, setSeeds]               = useState('')
  const [useLeet, setUseLeet]           = useState(true)
  const [useNumbers, setUseNumbers]     = useState(true)
  const [useYears, setUseYears]         = useState(false)
  const [credUrl, setCredUrl]           = useState('')
  const [usernames, setUsernames]       = useState('')
  const [passwords, setPasswords]       = useState('')
  const [authType, setAuthType]         = useState('basic')
  const [delay, setDelay]               = useState('0.5')
  const [encoderText, setEncoderText]   = useState('')
  const [strengthPass, setStrengthPass] = useState('')
  const [jwtToken, setJwtToken]         = useState('')
  const [jwtWordlist, setJwtWordlist]   = useState('')
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

  function run() {
    if (tool === 'Identify') {
      addActivity({ module: 'password', tool, target: hash.slice(0, 16) })
      start('/api/password/identify', { hash })
    } else if (tool === 'Crack') {
      addActivity({ module: 'password', tool, target: hash.slice(0, 16) })
      startPost('/api/password/crack', { hash, hash_type: hashType, wordlist: wordlist || undefined, use_mutations: useMutations })
    } else if (tool === 'Wordlist') {
      const seedList = seeds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      addActivity({ module: 'password', tool, target: seedList.slice(0, 3).join(', ') })
      startPost('/api/password/wordlist', { seeds: seedList, use_leet: useLeet, use_numbers: useNumbers, use_years: useYears })
    } else if (tool === 'Credentials') {
      const userList = usernames.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      const passList = passwords.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      addActivity({ module: 'password', tool, target: credUrl })
      startPost('/api/password/credentials', { url: credUrl, usernames: userList, passwords: passList, auth_type: authType, delay: parseFloat(delay) })
    } else if (tool === 'Encoder') {
      addActivity({ module: 'password', tool })
      start('/api/password/encode', { text: encoderText })
    } else if (tool === 'Strength') {
      addActivity({ module: 'password', tool })
      start('/api/password/strength', { password: strengthPass })
    } else if (tool === 'HashLookup') {
      addActivity({ module: 'password', tool, target: hash.slice(0, 16) })
      start('/api/password/hashlookup', { hash })
    } else if (tool === 'JWTCrack') {
      addActivity({ module: 'password', tool, target: jwtToken.slice(0, 20) + '...' })
      start('/api/password/jwtcrack', { token: jwtToken, wordlist: jwtWordlist || undefined })
    }
    addLog('scan_start', { module: 'password', tool })
  }

  const disabled =
    (tool === 'Identify'    && !hash) ||
    (tool === 'Crack'       && !hash) ||
    (tool === 'HashLookup'  && !hash) ||
    (tool === 'Encoder'     && !encoderText) ||
    (tool === 'Strength'    && !strengthPass) ||
    (tool === 'JWTCrack'    && !jwtToken)

  return (
    <ToolPage
      tools={TOOLS} activeTool={tool}
      onToolChange={t => { setTool(t); clear() }}
      configFields={<>
        {(tool === 'Identify' || tool === 'Crack' || tool === 'HashLookup') && (
          <InputField label="Hash" value={hash} onChange={setHash} placeholder="5f4dcc3b5aa765d61d8327deb..." />
        )}
        {tool === 'HashLookup' && <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Identifies hash type + queries online reverse lookup APIs.</p>}
        {tool === 'Crack' && <>
          <SelectField label="Hash type" value={hashType} onChange={setHashType}
            options={['md5','sha1','sha256','sha512'].map(v => ({ value: v, label: v.toUpperCase() }))} />
          <InputField label="Wordlist path" value={wordlist} onChange={setWordlist} placeholder="/path/to/list.txt" />
          <CheckboxField label="Apply mutations" checked={useMutations} onChange={setUseMutations} />
        </>}
        {tool === 'Wordlist' && <>
          <Textarea label="Seed words" value={seeds} onChange={setSeeds} placeholder="admin, company, john" />
          <CheckboxField label="Leet substitutions (a→4, e→3)" checked={useLeet}    onChange={setUseLeet} />
          <CheckboxField label="Number suffixes (123, 2024)"    checked={useNumbers} onChange={setUseNumbers} />
          <CheckboxField label="Year suffixes"                   checked={useYears}   onChange={setUseYears} />
        </>}
        {tool === 'Credentials' && <>
          <InputField label="Login URL" value={credUrl} onChange={setCredUrl} placeholder="https://example.com/login" />
          <SelectField label="Auth type" value={authType} onChange={setAuthType}
            options={[{ value:'basic', label:'HTTP Basic' }, { value:'form', label:'HTML Form' }, { value:'json', label:'JSON Body' }]} />
          <Textarea label="Usernames" value={usernames} onChange={setUsernames} placeholder="admin&#10;root" rows={2} />
          <Textarea label="Passwords" value={passwords} onChange={setPasswords} placeholder="password&#10;123456" rows={2} />
          <InputField label="Delay (s)" value={delay} onChange={setDelay} type="number" />
          <p className="text-[11px] text-[#7a5f2a] px-0.5">⚠ Authorized targets only</p>
        </>}
        {tool === 'Encoder' && <>
          <Textarea label="Text to encode / hash" value={encoderText} onChange={setEncoderText} placeholder="Enter text..." />
          <p className="text-[11px] text-[#505062] px-0.5">Base64 · URL · Hex · ROT13 · Binary · MD5 · SHA1 · SHA256 · SHA512</p>
        </>}
        {tool === 'Strength' && (
          <InputField label="Password" value={strengthPass} onChange={setStrengthPass} type="password" placeholder="Enter password to analyze" />
        )}
        {tool === 'JWTCrack' && <>
          <Textarea label="JWT Token" value={jwtToken} onChange={setJwtToken} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." rows={4} />
          <InputField label="Wordlist path (optional)" value={jwtWordlist} onChange={setJwtWordlist} placeholder="/path/to/list.txt" />
          <p style={{ fontSize: 11, color: '#505062', paddingLeft: 2 }}>Tries common secrets then falls back to the provided wordlist.</p>
        </>}
      </>}
      onRun={run} onStop={stop} onClear={clear}
      runButton={<RunButton onClick={run} running={running} onStop={stop} disabled={disabled} />}
      output={<StreamOutput lines={lines} running={running} onLoadHistory={loadLines} />}
      footer={<>
        <ExportButton lines={lines} filename={`password-${tool.toLowerCase()}`} />
        {lines.length > 0 && (
          <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>Clear</button>
        )}
      </>}
    />
  )
}
