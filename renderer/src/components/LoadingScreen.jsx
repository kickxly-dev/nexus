import { useState, useEffect } from 'react'

const STEPS = [
  'Initializing core systems',
  'Spawning Python engine',
  'Connecting to backend',
  'Loading modules',
  'Ready',
]

const BOOT_LINES = [
  '[ OK ] nexus-core: Security engine loaded',
  '[ OK ] nexus-recon: Reconnaissance module active',
  '[ OK ] nexus-web: Web exploitation suite ready',
  '[ OK ] nexus-net: Network analysis initialized',
  '[ OK ] nexus-pwd: Password tools online',
  '[ OK ] All 22 tools operational',
]

export function LoadingScreen({ onComplete }) {
  const [step, setStep]         = useState(0)
  const [progress, setProgress] = useState(0)
  const [fade, setFade]         = useState(false)
  const [bootLines, setBootLines] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 1.2 + Math.random() * 2.5
      })
    }, 40)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 20)  setStep(0)
    else if (progress < 45) setStep(1)
    else if (progress < 65) setStep(2)
    else if (progress < 85) setStep(3)
    else setStep(4)

    // Add boot lines progressively
    const lineIndex = Math.floor((progress / 100) * BOOT_LINES.length)
    setBootLines(BOOT_LINES.slice(0, lineIndex))
  }, [progress])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setFade(true), 400)
      setTimeout(() => onComplete(), 900)
    }
  }, [progress, onComplete])

  const pct = Math.min(Math.round(progress), 100)

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-600 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#06060f' }}>

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Radial glow */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(700px circle at 50% 45%, rgba(124,58,237,0.12), rgba(37,99,235,0.06), transparent 70%)' }} />

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 text-purple-500/10 font-mono text-[10px] select-none">
        <div>NEXUS SECURITY TOOLKIT</div>
        <div>VERSION 1.1.0</div>
        <div>AUTHORIZED USE ONLY</div>
      </div>
      <div className="absolute top-8 right-8 text-blue-500/10 font-mono text-[10px] text-right select-none">
        <div>BUILD 2024.1</div>
        <div>22 MODULES LOADED</div>
        <div>SYSTEM READY</div>
      </div>

      <div className="relative flex items-center gap-16">
        {/* Left: Boot log */}
        <div className="w-64 flex flex-col gap-1">
          {bootLines.map((line, i) => (
            <div key={i} className="line-in font-mono text-[10px]"
              style={{ color: line.includes('OK') ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.2)' }}>
              {line}
            </div>
          ))}
          {bootLines.length < BOOT_LINES.length && (
            <div className="font-mono text-[10px] text-white/20 flex items-center gap-1">
              <span className="animate-pulse">_</span>
            </div>
          )}
        </div>

        {/* Center: Logo + progress */}
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="relative float">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl relative z-10"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <span className="text-white text-4xl font-black tracking-tighter">N</span>
            </div>
            {/* Glow rings */}
            <div className="absolute -inset-2 rounded-2xl opacity-30 blur-xl gradient-anim"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb, #7c3aed)' }} />
            <div className="absolute -inset-4 rounded-3xl opacity-10 blur-2xl"
              style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight shimmer-text">Nexus</h1>
            <p className="text-white/20 text-sm mt-1 font-medium font-mono">Security Toolkit v1.1.0</p>
          </div>

          {/* Progress */}
          <div className="w-72 flex flex-col items-center gap-3">
            <div className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-full rounded-full transition-all duration-100 ease-out relative overflow-hidden"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #6366f1, #2563eb)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.6)',
                }}>
                <div className="absolute inset-0 shimmer opacity-40"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-white/25 text-[11px] font-mono">{STEPS[step]}</span>
              </div>
              <span className="text-white/15 text-[11px] font-mono">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="w-64 flex flex-col gap-2">
          {[
            { label: 'Recon Tools',    value: '7',  color: '#60a5fa' },
            { label: 'Web Tools',      value: '5',  color: '#a855f7' },
            { label: 'Network Tools',  value: '4',  color: '#818cf8' },
            { label: 'Password Tools', value: '6',  color: '#22d3ee' },
          ].map((item, i) => (
            <div key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] transition-all duration-500 ${pct > i * 20 ? 'opacity-100' : 'opacity-20'}`}>
              <span className="font-mono text-[10px] text-white/25">{item.label}</span>
              <span className="font-mono text-[11px] font-bold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
