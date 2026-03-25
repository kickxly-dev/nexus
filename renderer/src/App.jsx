import { useEffect, useState, useCallback } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Layout/Sidebar'
import { Topbar } from './components/Layout/Topbar'
import { LoadingScreen } from './components/LoadingScreen'
import { MaintenanceScreen } from './components/MaintenanceScreen'
import { Dashboard } from './pages/Dashboard'
import { Recon } from './pages/Recon'
import { WebExploit } from './pages/WebExploit'
import { Network } from './pages/Network'
import { PasswordAuth } from './pages/PasswordAuth'
import { OSINT } from './pages/OSINT'
import { Settings } from './pages/Settings'
import { AdminPanel } from './pages/AdminPanel'
import { Advanced } from './pages/Advanced'
import { useSettingsStore } from './store/settingsStore'
import { useLogStore } from './store/logStore'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { UpdateBanner } from './components/UpdateBanner'
import { Toasts } from './components/Toasts'
import { CommandPalette } from './components/CommandPalette'
import { DepChecker } from './components/DepChecker'

function RouteLogger() {
  const location = useLocation()
  const addLog = useLogStore((s) => s.addLog)
  useEffect(() => {
    addLog('navigate', { detail: `Navigated to ${location.pathname}` })
  }, [location.pathname])
  return null
}

export default function App() {
  const { setPort, setPlatform, maintenanceMode } = useSettingsStore()
  const [loading, setLoading]         = useState(true)
  const [showAdmin, setShowAdmin]     = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const addLog = useLogStore((s) => s.addLog)
  const currentUser = useAuthStore((s) => s.currentUser)

  useEffect(() => {
    async function init() {
      addLog('app_start', { detail: 'Application initialized' })
      if (window.nexus) {
        window.nexus.onPythonReady(({ port }) => {
          setPort(port)
          addLog('backend_ready', { detail: `Python engine ready on port ${port}` })
        })
        window.nexus.onPythonCrash(() => {
          useSettingsStore.getState().setPythonStatus('offline')
          addLog('backend_crash', { detail: 'Python engine crashed' })
        })
        let port = await window.nexus.getPort()
        if (port) setPort(port)
        const platform = await window.nexus.getPlatform()
        setPlatform(platform)
      } else {
        setPort(7331)
        addLog('dev_mode', { detail: 'Running in browser dev mode, port 7331' })
      }
    }
    init()
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowAdmin((v) => !v)
        addLog('admin_toggle', { detail: 'Admin panel toggled' })
      }
      if (e.ctrlKey && !e.shiftKey && e.key === 'k') {
        e.preventDefault()
        setShowPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleLoadingComplete = useCallback(() => setLoading(false), [])

  if (!currentUser) return <LoginPage onAuth={() => {}} />

  return (
    <>
      {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <HashRouter>
        <RouteLogger />
        <div className={`flex flex-col h-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          <Topbar />
          <DepChecker />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden" style={{ background: '#08080f' }}>
              {maintenanceMode ? <MaintenanceScreen /> : (
                <Routes>
                  <Route path="/"         element={<Dashboard />} />
                  <Route path="/recon"    element={<Recon />} />
                  <Route path="/web"      element={<WebExploit />} />
                  <Route path="/network"  element={<Network />} />
                  <Route path="/password" element={<PasswordAuth />} />
                  <Route path="/osint"    element={<OSINT />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/advanced" element={<Advanced />} />
                </Routes>
              )}
            </main>
          </div>
        </div>
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
        {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
        <UpdateBanner />
        <Toasts />
      </HashRouter>
    </>
  )
}
