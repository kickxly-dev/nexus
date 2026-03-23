import { useState } from 'react'
import { useStream } from '../hooks/useStream'
import { useActivityStore } from '../store/activityStore'
import { useLogStore } from '../store/logStore'
import { StreamOutput } from '../components/Terminal/StreamOutput'
import { InputField, SelectField, RunButton, ExportButton, CheckboxField } from '../components/Forms/index'

const TOOLS = [
  { id: 'Identify',    icon: '⊘', desc: 'Identify hash type' },
  { id: 'Crack',       icon: '⊗', desc: 'Dictionary attack' },
  { id: 'Wordlist',    icon: '⊕', desc: 'Generate wordlists' },
  { id: 'Credentials', icon: '⊖', desc: 'Credential testing' },
  { id: 'Encoder',     icon: '⊜', desc: 'Encode/hash text' },
  { id: 'Strength',    icon: '⊚', desc: 'Analyze password strength' },
]

const tareaClass = `w-full rounded-lg px-3 py-2 text-white/80 text-[12px] placeholder-white/10
  transition-all duration-200 resize-none focus:outline-none`
const tareaStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }

const toolCls = (active) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group w-full
   ${active ? 'text-white font-medium' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}`

export function PasswordAuth() {
  const [tool, setTool]             = useState('Identify')
  const [hash, setHash]             = useState('')
  const [hashType, setHashType]     = useState('md5')
  const [wordlist, setWordlist]     = useState('')
  const [useMutations, setUseMutations] = useState(true)
  const [seeds, setSeeds]           = useState('')
  const [useLeet, setUseLeet]       = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useYears, setUseYears]     = useState(false)
  const [credUrl, setCredUrl]       = useState('')
  const [usernames, setUsernames]   = useState('')
  const [passwords, setPasswords]   = useState('')
  const [authType, setAuthType]     = useState('basic')
  const [delay, setDelay]           = useState('0.5')
  const [encoderText, setEncoderText] = useState('')
  const [strengthPass, setStrengthPass] = useState('')
  const { lines, running, start, startPost, stop, clear } = useStream()
  const addActivity = useActivityStore((s) => s.addActivity)
  const addLog      = useLogStore((s) => s.addLog)

  function run() {
    if (tool === 'Identify') {
      addActivity({ module: 'password', tool, target: hash.slice(0, 16) })
      addLog('scan_start', { module: 'password', tool, target: hash.slice(0, 16) })
      start('/api/password/identify', { hash })
    } else if (tool === 'Crack') {
      addActivity({ module: 'password', tool, target: hash.slice(0, 16) })
      addLog('scan_start', { module: 'password', tool })
      startPost('/api/password/crack', { hash, hash_type: hashType, wordlist: wordlist || undefined, use_mutations: useMutations })
    } else if (tool === 'Wordlist') {
      const seedList = seeds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      addActivity({ module: 'password', tool, target: seedList.join(', ') })
      addLog('scan_start', { module: 'password', tool })
      startPost('/api/password/wordlist', { seeds: seedList, use_leet: useLeet, use_numbers: useNumbers, use_years: useYears })
    } else if (tool === 'Credentials') {
      const userList = usernames.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      const passList = passwords.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      addActivity({ module: 'password', tool, target: credUrl })
      addLog('scan_start', { module: 'password', tool, target: credUrl })
      startPost('/api/password/credentials', {
        url: credUrl, usernames: userList, passwords: passList,
        auth_type: authType, delay: parseFloat(delay),
      })
    } else if (tool === 'Encoder') {
      addActivity({ module: 'password', tool, target: encoderText.slice(0, 20) })
      addLog('scan_start', { module: 'password', tool })
      start('/api/password/encode', { text: encoderText })
    } else if (tool === 'Strength') {
      addActivity({ module: 'password', tool, target: '(password)' })
      addLog('scan_start', { module: 'password', tool })
      start('/api/password/strength', { password: strengthPass })
    }
  }

  const isDisabled =
    (tool === 'Identify' && !hash) ||
    (tool === 'Crack' && !hash) ||
    (tool === 'Encoder' && !encoderText) ||
    (tool === 'Strength' && !strengthPass)

  return (
    <div className="flex h-full" style={{ background: '#08080f' }}>
      <div className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-white/[0.05]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2 mb-2">Tools</p>
          <div className="flex flex-col gap-0.5">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => { setTool(t.id); clear() }}
                className={toolCls(tool === t.id)}
                style={tool === t.id ? {
                  background: 'rgba(8,145,178,0.08)',
                  boxShadow: 'inset 2px 0 0 rgba(8,145,178,0.6)',
                  border: '1px solid rgba(8,145,178,0.12)',
                  borderLeft: 'none',
                } : {}}>
                <span className="text-sm" style={tool === t.id ? { color: '#22d3ee', filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5))' } : { opacity: 0.25 }}>{t.icon}</span>
                <div>
                  <p className="text-[12px]">{t.id}</p>
                  <p className="text-[10px] text-white/18">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 flex flex-col gap-3 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-semibold px-2">Config</p>

          {(tool === 'Identify' || tool === 'Crack') && (
            <InputField label="Hash" value={hash} onChange={setHash} placeholder="5f4dcc3b5aa765d6..." />
          )}
          {tool === 'Crack' && (
            <>
              <SelectField label="Type" value={hashType} onChange={setHashType}
                options={['md5', 'sha1', 'sha256', 'sha512'].map(v => ({ value: v, label: v.toUpperCase() }))} />
              <InputField label="Wordlist" value={wordlist} onChange={setWordlist} placeholder="/path/to/list.txt" />
              <CheckboxField label="Use mutations" checked={useMutations} onChange={setUseMutations} />
            </>
          )}
          {tool === 'Wordlist' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/25 text-[11px] font-medium">Seeds</label>
                <textarea value={seeds} onChange={e => setSeeds(e.target.value)}
                  placeholder="admin, company, john" rows={3} className={tareaClass} style={tareaStyle} />
              </div>
              <CheckboxField label="Leet substitutions" checked={useLeet}    onChange={setUseLeet} />
              <CheckboxField label="Number suffixes"    checked={useNumbers} onChange={setUseNumbers} />
              <CheckboxField label="Year suffixes"      checked={useYears}   onChange={setUseYears} />
            </>
          )}
          {tool === 'Credentials' && (
            <>
              <InputField label="URL" value={credUrl} onChange={setCredUrl} placeholder="https://example.com/login" />
              <SelectField label="Auth Type" value={authType} onChange={setAuthType}
                options={[{ value: 'basic', label: 'HTTP Basic' }, { value: 'form', label: 'HTML Form' }, { value: 'json', label: 'JSON' }]} />
              <div className="flex flex-col gap-1.5">
                <label className="text-white/25 text-[11px] font-medium">Usernames</label>
                <textarea value={usernames} onChange={e => setUsernames(e.target.value)}
                  placeholder="admin, root" rows={2} className={tareaClass} style={tareaStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/25 text-[11px] font-medium">Passwords</label>
                <textarea value={passwords} onChange={e => setPasswords(e.target.value)}
                  placeholder="password, 123456" rows={2} className={tareaClass} style={tareaStyle} />
              </div>
              <InputField label="Delay (s)" value={delay} onChange={setDelay} type="number" />
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <span className="text-amber-400/70 text-[10px]">⚠ Authorized targets only</span>
              </div>
            </>
          )}
          {tool === 'Encoder' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/25 text-[11px] font-medium">Text to encode/hash</label>
                <textarea value={encoderText} onChange={e => setEncoderText(e.target.value)}
                  placeholder="Enter text..." rows={3} className={tareaClass} style={tareaStyle} />
              </div>
              <div className="px-2 py-1.5 rounded-lg text-[10px] text-white/20"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                Outputs: Base64 · URL · Hex · ROT13 · Binary · MD5/SHA1/256/512
              </div>
            </>
          )}
          {tool === 'Strength' && (
            <InputField label="Password" value={strengthPass} onChange={setStrengthPass} placeholder="Enter password to analyze" type="password" />
          )}

          <div className="mt-auto pt-3">
            <RunButton onClick={run} running={running} onStop={stop} disabled={isDisabled} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
        <StreamOutput lines={lines} running={running} className="flex-1" />
        <div className="flex items-center justify-between">
          <ExportButton lines={lines} filename={`password-${tool.toLowerCase()}`} />
          {lines.length > 0 && (
            <button onClick={clear} className="text-white/12 text-[11px] hover:text-white/35 transition-colors">clear</button>
          )}
        </div>
      </div>
    </div>
  )
}
