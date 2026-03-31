import { DEFAULT_API_BASE, STORAGE_KEYS } from "./constants.js"
import { settingsStore, tokenStore } from "./storage.js"

function getApiBase() {
  const base = settingsStore.getApiBase() || globalThis?.location?.origin || DEFAULT_API_BASE
  return String(base).replace(/\/$/, "")
}

function withAuthHeaders(headers = {}) {
  const token = tokenStore.get()
  if (!token) return headers
  return { ...headers, Authorization: `Bearer ${token}` }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const url = `${getApiBase()}${path}`
  const res = await fetch(url, {
    method,
    headers: withAuthHeaders({
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {})
    }),
    body: body ? JSON.stringify(body) : undefined
  })

  if (res.status === 204) return null

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      tokenStore.clear()
      localStorage.removeItem(STORAGE_KEYS.profileCache)
    }
    const err = new Error(data?.detail || data?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  async register(username, password) {
    return request("/api/auth/register", { method: "POST", body: { username, password } })
  },
  async login(username, password) {
    const data = await request("/api/auth/login", { method: "POST", body: { username, password } })
    tokenStore.set(data.access_token)
    return data
  },
  async me() {
    return request("/api/me")
  },
  async getProfile() {
    return request("/api/profile")
  },
  async putProfile(profile) {
    return request("/api/profile", { method: "PUT", body: profile })
  },
  async getCheckinSummary() {
    return request("/api/checkins/summary")
  },
  async checkinToday() {
    return request("/api/checkins/today", { method: "POST" })
  },
  async listAnniversaries() {
    return request("/api/anniversaries")
  },
  async createAnniversary(name, day) {
    return request("/api/anniversaries", { method: "POST", body: { name, day } })
  },
  async updateAnniversary(id, patch) {
    return request(`/api/anniversaries/${id}`, { method: "PUT", body: patch })
  },
  async deleteAnniversary(id) {
    return request(`/api/anniversaries/${id}`, { method: "DELETE" })
  },
  async listAlbumMeta() {
    return request("/api/album-meta")
  },
  async createAlbumMeta(localId, { title = "", takenAt = null } = {}) {
    return request("/api/album-meta", { method: "POST", body: { localId, title, takenAt } })
  },
  async deleteAlbumMeta(id) {
    return request(`/api/album-meta/${id}`, { method: "DELETE" })
  }
}

export function clearAuth() {
  tokenStore.clear()
  localStorage.removeItem(STORAGE_KEYS.profileCache)
}
