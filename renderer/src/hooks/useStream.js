import { useState, useRef, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'

export function useStream() {
  const port = useSettingsStore((s) => s.port)
  const [lines, setLines] = useState([])
  const [running, setRunning] = useState(false)
  const esRef = useRef(null)
  const linesRef = useRef([])

  // Keep linesRef in sync so we can read it in callbacks without stale closure
  const addLine = useCallback((line) => {
    setLines((prev) => {
      const next = [...prev, line]
      linesRef.current = next
      return next
    })
  }, [])

  const start = useCallback((path, params = {}) => {
    if (!port) return
    if (esRef.current) esRef.current.close()

    linesRef.current = []
    setLines([])
    setRunning(true)

    const url = new URL(`http://127.0.0.1:${port}${path}`)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
    })

    const es = new EventSource(url.toString())
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'done') {
          setRunning(false)
          es.close()
          const all = linesRef.current
          const hits = all.filter(l => l.type === 'found' || l.type === 'vuln').length
          useToastStore.getState().addToast({
            type: 'success',
            title: 'Scan complete',
            message: `${all.length} lines · ${hits} hits`,
          })
        }
        addLine({ ...data, _id: Date.now() + Math.random(), _ts: Date.now() })
      } catch {}
    }

    es.onerror = () => {
      setRunning(false)
      es.close()
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Scan error',
        message: 'Connection to backend lost',
      })
    }
  }, [port, addLine])

  const startPost = useCallback(async (path, body = {}) => {
    if (!port) return
    if (esRef.current) esRef.current.close()

    linesRef.current = []
    setLines([])
    setRunning(true)

    // POST via fetch with streaming response
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            try {
              const data = JSON.parse(part.slice(6))
              if (data.type === 'done') setRunning(false)
              addLine({ ...data, _id: Date.now() + Math.random(), _ts: Date.now() })
            } catch {}
          }
        }
      }

      const all = linesRef.current
      const hits = all.filter(l => l.type === 'found' || l.type === 'vuln').length
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Scan complete',
        message: `${all.length} lines · ${hits} hits`,
      })
    } catch (e) {
      const msg = String(e)
      addLine({ type: 'error', message: msg, _id: Date.now() })
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Scan error',
        message: msg,
      })
    } finally {
      setRunning(false)
    }
  }, [port, addLine])

  const stop = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setRunning(false)
  }, [])

  const clear = useCallback(() => { linesRef.current = []; setLines([]) }, [])

  const loadLines = useCallback((newLines) => {
    linesRef.current = newLines
    setLines(newLines)
    setRunning(false)
  }, [])

  return { lines, running, start, startPost, stop, clear, loadLines }
}
