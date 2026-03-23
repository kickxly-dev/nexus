import { useState, useRef, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function useStream() {
  const port = useSettingsStore((s) => s.port)
  const [lines, setLines] = useState([])
  const [running, setRunning] = useState(false)
  const esRef = useRef(null)

  const start = useCallback((path, params = {}) => {
    if (!port) return
    if (esRef.current) esRef.current.close()

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
        }
        setLines((prev) => [...prev, { ...data, _id: Date.now() + Math.random() }])
      } catch {}
    }

    es.onerror = () => {
      setRunning(false)
      es.close()
    }
  }, [port])

  const startPost = useCallback(async (path, body = {}) => {
    if (!port) return
    if (esRef.current) esRef.current.close()

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
              setLines((prev) => [...prev, { ...data, _id: Date.now() + Math.random() }])
            } catch {}
          }
        }
      }
    } catch (e) {
      setLines((prev) => [...prev, { type: 'error', message: String(e), _id: Date.now() }])
    } finally {
      setRunning(false)
    }
  }, [port])

  const stop = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setRunning(false)
  }, [])

  const clear = useCallback(() => setLines([]), [])

  return { lines, running, start, startPost, stop, clear }
}
