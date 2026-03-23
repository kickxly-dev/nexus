import axios from 'axios'
import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function getBaseURL() {
  const port = useSettingsStore.getState().port
  return port ? `http://127.0.0.1:${port}` : null
}

export function useApi() {
  const port = useSettingsStore((s) => s.port)
  const baseURL = port ? `http://127.0.0.1:${port}` : null

  const get = useCallback(async (path, params = {}) => {
    const url = getBaseURL()
    if (!url) throw new Error('Backend not ready')
    const res = await axios.get(url + path, { params })
    return res.data
  }, [])

  const post = useCallback(async (path, body = {}) => {
    const url = getBaseURL()
    if (!url) throw new Error('Backend not ready')
    const res = await axios.post(url + path, body)
    return res.data
  }, [])

  const health = useCallback(async () => {
    const url = getBaseURL()
    if (!url) return false
    try {
      const res = await axios.get(url + '/health', { timeout: 2000 })
      return res.data?.status === 'ok'
    } catch {
      return false
    }
  }, [])

  return { get, post, health, baseURL }
}
