import { DEFAULT_API_BASE, STORAGE_KEYS } from "./constants.js"
import { settingsStore, tokenStore } from "./storage.js"

function getApiBase() {
  const fromSettings = settingsStore.getApiBase()
  if (fromSettings) return String(fromSettings).replace(/\/$/, "")

  const origin = globalThis?.location?.origin || ""
  try {
    const u = new URL(origin)
    const d = new URL(DEFAULT_API_BASE)
    if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") && u.port && u.port !== d.port) {
      return String(DEFAULT_API_BASE).replace(/\/$/, "")
    }
  } catch {}

  return String(origin || DEFAULT_API_BASE).replace(/\/$/, "")
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

async function upload(path, formData, { method = "POST", headers } = {}) {
  const url = `${getApiBase()}${path}`
  const res = await fetch(url, {
    method,
    headers: withAuthHeaders({
      Accept: "application/json",
      ...(headers || {})
    }),
    body: formData
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
  async register(username, password, { inviteCode = "" } = {}) {
    return request("/api/auth/register", { method: "POST", body: { username, password, invite_code: inviteCode || null } })
  },
  async login(username, password, { inviteCode = "" } = {}) {
    const data = await request("/api/auth/login", { method: "POST", body: { username, password, invite_code: inviteCode || null } })
    tokenStore.set(data.access_token)
    return data
  },
  async me() {
    return request("/api/me")
  },
  async getMyInvite() {
    return request("/api/invites/me")
  },
  async getProfile() {
    return request("/api/profile")
  },
  async putProfile(profile) {
    return request("/api/profile", { method: "PUT", body: profile })
  },
  async uploadAvatar(file) {
    const fd = new FormData()
    fd.append("file", file)
    return upload("/api/uploads/avatar", fd)
  },
  async uploadPostMedia(file) {
    const fd = new FormData()
    fd.append("file", file)
    return upload("/api/uploads/post-media", fd)
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
  },
  async listPosts({ limit = 30 } = {}) {
    const qs = new URLSearchParams({ limit: String(limit) })
    return request(`/api/posts?${qs.toString()}`)
  },
  async createPost({ author = "your", content = "", location = "", media = [] } = {}) {
    return request("/api/posts", { method: "POST", body: { author, content, location, media } })
  },
  async deletePost(id) {
    return request(`/api/posts/${id}`, { method: "DELETE" })
  }
}

export function clearAuth() {
  tokenStore.clear()
  localStorage.removeItem(STORAGE_KEYS.profileCache)
}
