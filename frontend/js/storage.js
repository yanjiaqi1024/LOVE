import { STORAGE_KEYS } from "./constants.js"

const DB_NAME = "couple_space"
const DB_VERSION = 1
const STORE_PHOTOS = "photos"

function genUUID() {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  if (c?.getRandomValues) {
    const b = new Uint8Array(16)
    c.getRandomValues(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const store = db.createObjectStore(STORE_PHOTOS, { keyPath: "id" })
        store.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const tokenStore = {
  get() {
    return localStorage.getItem(STORAGE_KEYS.token) || ""
  },
  set(token) {
    localStorage.setItem(STORAGE_KEYS.token, token)
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.token)
  }
}

export const settingsStore = {
  getApiBase() {
    return localStorage.getItem(STORAGE_KEYS.apiBase) || ""
  },
  setApiBase(v) {
    localStorage.setItem(STORAGE_KEYS.apiBase, v)
  }
}

export const localeStore = {
  get() {
    return localStorage.getItem(STORAGE_KEYS.locale) || ""
  },
  set(locale) {
    localStorage.setItem(STORAGE_KEYS.locale, locale)
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.locale)
  }
}

export const cacheStore = {
  getProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.profileCache)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  setProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.profileCache, JSON.stringify(profile || {}))
  }
}

export const photoStore = {
  async addMany(files) {
    const db = await openDb()
    const tx = db.transaction(STORE_PHOTOS, "readwrite")
    const store = tx.objectStore(STORE_PHOTOS)
    const now = Date.now()
    const items = Array.from(files).map((f, i) => ({
      id: genUUID(),
      name: f.name || "",
      type: f.type || "image/*",
      blob: f,
      createdAt: now + i
    }))
    for (const item of items) store.put(item)
    await txDone(tx)
    db.close()
    return items.map((i) => ({ id: i.id, createdAt: i.createdAt, name: i.name, type: i.type }))
  },

  async list() {
    const db = await openDb()
    const tx = db.transaction(STORE_PHOTOS, "readonly")
    const store = tx.objectStore(STORE_PHOTOS)
    const idx = store.index("createdAt")
    const req = idx.getAll()
    const items = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return items
  },

  async get(id) {
    const db = await openDb()
    const tx = db.transaction(STORE_PHOTOS, "readonly")
    const store = tx.objectStore(STORE_PHOTOS)
    const req = store.get(id)
    const item = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    return item
  },

  async remove(id) {
    const db = await openDb()
    const tx = db.transaction(STORE_PHOTOS, "readwrite")
    tx.objectStore(STORE_PHOTOS).delete(id)
    await txDone(tx)
    db.close()
  }
}
