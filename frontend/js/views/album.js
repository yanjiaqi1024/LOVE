import { api } from "../api.js"
import { photoStore } from "../storage.js"
import { confirmModal, toast } from "../ui.js"

export function initAlbumView(ctx) {
  const input = document.getElementById("photoInput")
  const uploadBtn = document.getElementById("albumUploadBtn")
  const grid = document.getElementById("albumGrid")
  const empty = document.getElementById("albumEmpty")

  let cache = []
  let urlMap = new Map()

  function revokeAll() {
    for (const url of urlMap.values()) URL.revokeObjectURL(url)
    urlMap.clear()
  }

  function ensureUrl(item) {
    if (urlMap.has(item.id)) return urlMap.get(item.id)
    const url = URL.createObjectURL(item.blob)
    urlMap.set(item.id, url)
    return url
  }

  function monthTag(ts) {
    if (!ts) return ""
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return ""
    const y = String(d.getFullYear()).slice(-2)
    const m = String(d.getMonth() + 1).padStart(2, "0")
    return `${m} '${y}`
  }

  function render(items) {
    grid.innerHTML = ""
    empty.classList.toggle("hidden", (items?.length || 0) > 0)
    for (const it of items || []) {
      const wrap = document.createElement("div")
      wrap.className = "gallery-item group"

      const card = document.createElement("div")
      card.className =
        "relative overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border-2 border-transparent hover:border-primary-container"

      const img = document.createElement("img")
      img.className = "w-full h-auto object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
      img.loading = "lazy"
      img.src = ensureUrl(it)

      const del = document.createElement("button")
      del.className =
        "absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-error-container/40 text-error backdrop-blur-md hover:opacity-95 active:scale-95 transition-all"
      del.setAttribute("aria-label", "删除")
      del.innerHTML = '<span class="material-symbols-outlined">delete</span>'

      const tagText = monthTag(it.createdAt)
      const overlay = document.createElement("div")
      overlay.className =
        "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-on-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      if (tagText) {
        const tag = document.createElement("span")
        tag.className = "text-white text-xs font-label uppercase tracking-widest"
        tag.textContent = tagText
        overlay.appendChild(tag)
      }

      img.addEventListener("click", (e) => {
        e.preventDefault()
        const urls = (cache || []).map((x) => ensureUrl(x))
        const index = (cache || []).findIndex((x) => x.id === it.id)
        ctx.viewer.show(urls, Math.max(0, index))
      })

      del.addEventListener("click", async (e) => {
        e.preventDefault()
        const ok = await confirmModal({ title: "删除照片", body: "确定删除这张照片吗？" })
        if (!ok) return
        try {
          await photoStore.remove(it.id)
          const url = urlMap.get(it.id)
          if (url) URL.revokeObjectURL(url)
          urlMap.delete(it.id)
          cache = cache.filter((x) => x.id !== it.id)
          render(cache)
          toast("已删除", { tone: "success" })
        } catch (err) {
          toast(err.message || "删除失败", { tone: "error" })
        }
      })

      card.appendChild(img)
      card.appendChild(overlay)
      card.appendChild(del)
      wrap.appendChild(card)
      grid.appendChild(wrap)
    }
  }

  if (uploadBtn) {
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault()
      input?.click?.()
    })
  }

  input.addEventListener("change", async (e) => {
    const files = e.target.files
    if (!files || !files.length) return
    try {
      const metas = await photoStore.addMany(files)
      for (const m of metas) {
        try {
          await api.createAlbumMeta(m.id, { title: m.name || "" })
        } catch {}
      }
      toast(`已上传 ${metas.length} 张`, { tone: "success" })
      input.value = ""
      await ctx.album.refresh()
    } catch (err) {
      toast(err.message || "上传失败", { tone: "error" })
    }
  })

  ctx.album = {
    async refresh() {
      revokeAll()
      const items = await photoStore.list()
      cache = items
      render(items)
    }
  }
}
