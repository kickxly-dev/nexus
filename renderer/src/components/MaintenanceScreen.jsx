import { useSettingsStore } from '../store/settingsStore'
import { Icon } from './Icons'

export function MaintenanceScreen() {
  const message     = useSettingsStore(s => s.maintenanceMessage)
  const threatLevel = useSettingsStore(s => s.threatLevel)

  const levelColor = {
    critical: { text: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    elevated: { text: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
    normal:   { text: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  }[threatLevel] || { text: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' }

  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#0c0c12' }}>
      <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">

        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          <Icon name="password" size={22} />
        </div>

        <div>
          <h2 className="text-[17px] font-semibold text-[#e2e2ea] mb-1.5">System Locked</h2>
          <p className="text-[13px] text-[#44445a] leading-relaxed">{message}</p>
        </div>

        <div className="w-full rounded-lg p-3.5 text-left flex flex-col gap-3"
          style={{ background: '#111119', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#44445a]">Threat level</span>
            <span className="mono text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ color: levelColor.text, background: levelColor.bg, border: `1px solid ${levelColor.border}` }}>
              {threatLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-[#2e2e42] leading-relaxed">
            All scanning tools are disabled.
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px] mono text-[#44445a]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Ctrl+Shift+A
            </kbd> to access admin controls.
          </p>
        </div>

      </div>
    </div>
  )
}
