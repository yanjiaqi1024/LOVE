import { api } from "../api.js"
import { t } from "../i18n.js"
import { cacheStore } from "../storage.js"
import { confirmModal, toast } from "../ui.js"

function setImg(el, url) {
  if (!el) return
  if (url) el.setAttribute("src", url)
  else el.removeAttribute("src")
}

function revokeObjectUrls(urls) {
  for (const u of urls || []) {
    try {
      if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u)
    } catch {}
  }
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const name = data?.name || data?.display_name || ""
  return typeof name === "string" ? name.trim() : ""
}

export function initPostView(ctx) {
  const backBtn = document.getElementById("postBackBtn")
  const avatarImg = document.getElementById("postAvatarImg")
  const contentInput = document.getElementById("postContentInput")
  const mediaGrid = document.getElementById("postMediaGrid")
  const photoInput = document.getElementById("postPhotoInput")
  const videoInput = document.getElementById("postVideoInput")
  const locationBtn = document.getElementById("postLocationBtn")
  const locationText = document.getElementById("postLocationText")
  const publishBtn = document.getElementById("postPublishBtn")

  let mode = ""
  let images = []
  let video = null
  let previewUrls = []
  let location = ""
  let busy = false
  let locating = false

  function setBusy(v) {
    busy = Boolean(v)
    if (publishBtn) publishBtn.disabled = busy
    if (publishBtn) publishBtn.classList.toggle("opacity-60", busy)
  }

  function setLocating(v) {
    locating = Boolean(v)
    if (locationBtn) locationBtn.disabled = locating || busy
    if (locationBtn) locationBtn.classList.toggle("opacity-60", locating || busy)
    if (locationText && locating) locationText.textContent = t("post.locationLocating")
    if (locationText && !locating) locationText.textContent = location || t("post.locationChoose")
  }

  function clearAllMedia() {
    revokeObjectUrls(previewUrls)
    previewUrls = []
    images = []
    video = null
    mode = ""
    if (photoInput) photoInput.value = ""
    if (videoInput) videoInput.value = ""
  }

  function renderMedia() {
    if (!mediaGrid) return
    mediaGrid.innerHTML = ""

    const addPhotoBtn = document.createElement("button")
    addPhotoBtn.className =
      "aspect-square rounded-xl bg-primary-container/30 flex flex-col items-center justify-center border-2 border-dashed border-primary-container hover:bg-primary-container/50 transition-all group"
    addPhotoBtn.innerHTML =
      `<span class="material-symbols-outlined text-primary text-3xl mb-1 group-hover:scale-110 transition-transform">add_a_photo</span><span class="text-[10px] font-bold text-on-primary-container">${t("post.addPhoto")}</span>`
    addPhotoBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      if (busy) return
      if (mode === "video" && video) {
        const ok = await confirmModal({
          title: t("post.switchToPhoto.title"),
          body: t("post.switchToPhoto.body"),
          okText: t("post.switchOk"),
          cancelText: t("modal.cancel")
        })
        if (!ok) return
        clearAllMedia()
      }
      photoInput?.click?.()
    })

    const addVideoBtn = document.createElement("button")
    addVideoBtn.className =
      "aspect-square rounded-xl bg-secondary-container/30 flex flex-col items-center justify-center border-2 border-dashed border-secondary-container hover:bg-secondary-container/50 transition-all group"
    addVideoBtn.innerHTML =
      `<span class="material-symbols-outlined text-secondary text-3xl mb-1 group-hover:scale-110 transition-transform">videocam</span><span class="text-[10px] font-bold text-on-secondary-container">${t("post.addVideo")}</span>`
    addVideoBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      if (busy) return
      if (mode === "images" && images.length) {
        const ok = await confirmModal({
          title: t("post.switchToVideo.title"),
          body: t("post.switchToVideo.body"),
          okText: t("post.switchOk"),
          cancelText: t("modal.cancel")
        })
        if (!ok) return
        clearAllMedia()
      }
      videoInput?.click?.()
    })

    mediaGrid.appendChild(addPhotoBtn)
    mediaGrid.appendChild(addVideoBtn)

    const addRemoveButton = (onRemove) => {
      const btn = document.createElement("button")
      btn.className = "absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center active:scale-95"
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">close</span>'
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        if (busy) return
        onRemove?.()
      })
      return btn
    }

    if (mode === "video" && video) {
      const wrap = document.createElement("div")
      wrap.className = "relative aspect-square rounded-xl overflow-hidden bg-surface-container-highest/40"

      const v = document.createElement("video")
      v.className = "w-full h-full object-cover"
      v.src = previewUrls[0] || ""
      v.muted = true
      v.playsInline = true
      wrap.appendChild(v)
      wrap.appendChild(
        addRemoveButton(() => {
          clearAllMedia()
          renderMedia()
        })
      )
      mediaGrid.appendChild(wrap)
      return
    }

    if (mode === "images" && images.length) {
      images.forEach((f, idx) => {
        const wrap = document.createElement("div")
        wrap.className = "relative aspect-square rounded-xl overflow-hidden bg-surface-container-highest/40"
        const img = document.createElement("img")
        img.className = "w-full h-full object-cover"
        img.loading = "lazy"
        img.src = previewUrls[idx] || ""
        wrap.appendChild(img)
        wrap.appendChild(
          addRemoveButton(() => {
            const u = previewUrls[idx]
            revokeObjectUrls([u])
            images = images.filter((_, i) => i !== idx)
            previewUrls = previewUrls.filter((_, i) => i !== idx)
            if (!images.length) mode = ""
            renderMedia()
          })
        )
        mediaGrid.appendChild(wrap)
      })
      return
    }

    const deco = document.createElement("div")
    deco.className = "aspect-square rounded-xl bg-surface-container-highest/40 flex items-center justify-center overflow-hidden"
    deco.innerHTML =
      '<div class="w-full h-full bg-gradient-to-br from-primary-container/20 to-secondary-container/20"></div>'
    mediaGrid.appendChild(deco)
  }

  async function loadProfile() {
    try {
      const p = await api.getProfile()
      cacheStore.setProfile(p)
      return p
    } catch (e) {
      const cached = cacheStore.getProfile()
      if (cached) return cached
      throw e
    }
  }

  function applyProfile(p) {
    setImg(avatarImg, p?.yourAvatar || p?.partnerAvatar || "")
  }

  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault()
      ctx.navigate("#album")
    })
  }

  if (locationBtn) {
    locationBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      if (busy || locating) return

      const canGeo = Boolean(navigator?.geolocation?.getCurrentPosition)
      if (!canGeo) {
        const next = window.prompt(t("post.locPrompt"), location || "")
        if (next == null) return
        location = String(next).trim()
        if (locationText) locationText.textContent = location || t("post.locationChoose")
        return
      }

      setLocating(true)
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 30000
          })
        })
        const lat = pos?.coords?.latitude
        const lng = pos?.coords?.longitude
        if (typeof lat !== "number" || typeof lng !== "number") throw new Error(t("post.locFailMsg"))

        let label = ""
        try {
          label = await reverseGeocode(lat, lng)
        } catch {}

        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        location = label || fallback
        toast(label ? t("post.gotLocation") : t("post.gotCoords"), { tone: "success" })
      } catch (err) {
        const code = err?.code
        if (code === 1) toast(t("post.locDenied"), { tone: "error" })
        else toast(t("post.locFail"), { tone: "error" })

        const next = window.prompt(t("post.locPrompt"), location || "")
        if (next != null) location = String(next).trim()
      } finally {
        setLocating(false)
      }
    })
  }

  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const files = e.target.files
      if (!files || !files.length) return
      const list = Array.from(files).filter((f) => (f.type || "").startsWith("image/"))
      if (!list.length) return
      if (list.length > 9) {
        toast(t("post.maxPhotos"), { tone: "error" })
        photoInput.value = ""
        return
      }
      clearAllMedia()
      mode = "images"
      images = list.slice(0, 9)
      previewUrls = images.map((f) => URL.createObjectURL(f))
      renderMedia()
    })
  }

  if (videoInput) {
    videoInput.addEventListener("change", async (e) => {
      const f = e.target.files?.[0]
      if (!f) return
      if (!(f.type || "").startsWith("video/")) return
      clearAllMedia()
      mode = "video"
      video = f
      previewUrls = [URL.createObjectURL(f)]
      renderMedia()
    })
  }

  if (publishBtn) {
    publishBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      if (busy) return
      const content = (contentInput?.value || "").trim()
      const hasMedia = (mode === "images" && images.length) || (mode === "video" && video)
      if (!content && !hasMedia) {
        toast(t("post.needContent"), { tone: "error" })
        contentInput?.focus?.()
        return
      }

      setBusy(true)
      try {
        const media = []
        if (mode === "video" && video) {
          const r = await api.uploadPostMedia(video)
          media.push({ url: r?.url || "", kind: r?.kind || "video", contentType: r?.contentType || video.type || "" })
        }
        if (mode === "images" && images.length) {
          for (const f of images) {
            const r = await api.uploadPostMedia(f)
            media.push({ url: r?.url || "", kind: r?.kind || "image", contentType: r?.contentType || f.type || "" })
          }
        }

        await api.createPost({ author: "your", content, location, media })
        toast(t("post.published"), { tone: "success" })

        if (contentInput) contentInput.value = ""
        location = ""
        if (locationText) locationText.textContent = t("post.locationChoose")
        clearAllMedia()
        renderMedia()
        ctx.navigate("#album")
      } catch (err) {
        toast(err.message || t("post.publishFail"), { tone: "error" })
      } finally {
        setBusy(false)
      }
    })
  }

  ctx.post = {
    async refresh() {
      const p = await loadProfile()
      applyProfile(p)
      if (contentInput) contentInput.focus?.()
      renderMedia()
    }
  }
}
