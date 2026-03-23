import { useState, useEffect } from 'react'

const STEPS = [
  'Initializing core systems',
  'Spawning Python engine',
  'Connecting to backend',
  'Loading modules',
  'Ready',
]

export function LoadingScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 1.5 + Math.random() * 2
      })
    }, 40)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 20) setStep(0)
    else if (progress < 45) setStep(1)
    else if (progress < 70) setStep(2)
    else if (progress < 90) setStep(3)
    else setStep(4)
  }, [progress])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setFade(true), 300)
      setTimeout(() => onComplete(), 800)
    }
  }, [progress, onComplete])

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#07070a] flex items-center justify-center transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(600px circle at 50% 40%, rgba(139,92,246,0.08), transparent 60%)' }} />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <span className="text-white text-3xl font-bold tracking-tighter">N</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-20 blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Nexus</h1>
          <p className="text-white/20 text-sm mt-1 font-medium">Security Toolkit v1.0.0</p>
        </div>

        {/* Progress bar */}
        <div className="w-72 flex flex-col items-center gap-3">
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-white/30 text-[11px] font-mono">{STEPS[step]}</span>
          </div>
        </div>

        {/* ASCII decoration */}
        <pre className="text-white/[0.04] text-[9px] font-mono leading-tight mt-4 select-none">
{`  ╔══════════════════════════╗
  ║  NEXUS SECURITY ENGINE   ║
  ║  ████████████████  100%  ║
  ╚══════════════════════════╝`}
        </pre>
      </div>
    </div>
  )
}
