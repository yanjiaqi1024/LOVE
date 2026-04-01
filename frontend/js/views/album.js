import { api } from "../api.js"
import { cacheStore } from "../storage.js"
import { confirmModal, toast } from "../ui.js"

function setImg(el, url) {
  if (!el) return
  if (url) el.setAttribute("src", url)
  else el.removeAttribute("src")
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function relativeTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const min = Math.floor(diffMs / (60 * 1000))
  if (min < 1) return "刚刚"
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const today = startOfToday()
  const dayDiff = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / (24 * 60 * 60 * 1000))
  if (dayDiff === 1) return "昨天"
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function pickPrompt() {
  const prompts = [
    "还记得第一次在那家咖啡店见面的下午吗？",
    "今天最想把哪一刻存进回忆里？",
    "如果把今天写成一句话，会是什么？",
    "最近一次让你心动的瞬间是什么？"
  ]
  return prompts[Math.floor(Math.random() * prompts.length)]
}

export function initAlbumView(ctx) {
  const promptText = document.getElementById("memoryPromptText")
  const feed = document.getElementById("postFeed")
  const empty = document.getElementById("postFeedEmpty")
  const headerAvatarImg = document.getElementById("headerAvatarImg")

  const videoRoot = document.getElementById("viewerVideoRoot")
  const videoEl = document.getElementById("viewerVideo")
  const videoClose = document.getElementById("viewerVideoClose")

  function hideVideo() {
    if (!videoRoot || !videoEl) return
    videoRoot.classList.add("hidden")
    try {
      videoEl.pause?.()
    } catch {}
    videoEl.removeAttribute("src")
    videoEl.load?.()
  }

  function showVideo(url) {
    if (!videoRoot || !videoEl) return
    videoEl.src = url
    videoRoot.classList.remove("hidden")
    try {
      videoEl.play?.()
    } catch {}
  }

  if (videoClose) {
    videoClose.addEventListener("click", (e) => {
      e.preventDefault()
      hideVideo()
    })
  }
  if (videoRoot) {
    videoRoot.addEventListener("click", (e) => {
      if (e.target === videoRoot) hideVideo()
    })
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
    setImg(headerAvatarImg, p?.yourAvatar || p?.partnerAvatar || "")
  }

  function render(posts, profile) {
    if (!feed) return
    feed.innerHTML = ""
    empty?.classList.toggle("hidden", (posts?.length || 0) > 0)

    const yourName = profile?.yourNickname?.trim() || "你"
    const partnerName = profile?.partnerNickname?.trim() || "TA"
    const yourAvatar = profile?.yourAvatar || ""
    const partnerAvatar = profile?.partnerAvatar || ""

    for (const p of posts || []) {
      const article = document.createElement("article")
      article.className = "relative"

      const head = document.createElement("div")
      head.className = "flex items-center justify-between gap-3 mb-4"

      const headLeft = document.createElement("div")
      headLeft.className = "flex items-center gap-3"

      const avatarWrap = document.createElement("div")
      avatarWrap.className = "w-11 h-11 rounded-full overflow-hidden shadow-sm"
      const avatar = document.createElement("img")
      avatar.className = "w-full h-full object-cover"
      const isPartner = String(p?.author || "") === "partner"
      avatar.src = isPartner ? partnerAvatar : yourAvatar
      avatar.alt = "Avatar"
      avatarWrap.appendChild(avatar)

      const meta = document.createElement("div")
      const nameEl = document.createElement("h3")
      nameEl.className = "text-sm font-bold text-on-surface"
      nameEl.textContent = isPartner ? partnerName : yourName
      const timeEl = document.createElement("p")
      timeEl.className = "text-[10px] text-on-surface-variant flex items-center gap-1"
      timeEl.innerHTML = '<span class="material-symbols-outlined text-[12px]">schedule</span>'
      timeEl.appendChild(document.createTextNode(` ${relativeTime(p?.createdAt)}`))
      meta.appendChild(nameEl)
      meta.appendChild(timeEl)

      headLeft.appendChild(avatarWrap)
      headLeft.appendChild(meta)

      const delBtn = document.createElement("button")
      delBtn.className =
        "w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest border border-outline-variant/25 text-error active:scale-95 transition-all duration-300"
      delBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">delete</span>'
      delBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        const ok = await confirmModal({ title: "删除帖子", body: "确定删除这条回忆吗？" })
        if (!ok) return
        try {
          await api.deletePost(p.id)
          toast("已删除", { tone: "success" })
          await ctx.album.refresh()
        } catch (err) {
          toast(err.message || "删除失败", { tone: "error" })
        }
      })

      head.appendChild(headLeft)
      head.appendChild(delBtn)
      article.appendChild(head)

      const medias = Array.isArray(p?.media) ? p.media : []
      const images = medias.filter((m) => (m?.kind || "") !== "video" && !(m?.contentType || "").startsWith("video/"))
      const videos = medias.filter((m) => (m?.kind || "") === "video" || (m?.contentType || "").startsWith("video/"))

      if (videos.length) {
        const box = document.createElement("div")
        box.className = "bg-surface-container-low rounded-xl overflow-hidden mb-4"

        const frame = document.createElement("div")
        frame.className = "relative aspect-video"

        const v = document.createElement("video")
        v.className = "w-full h-full object-cover"
        v.src = videos[0]?.url || ""
        v.muted = true
        v.playsInline = true
        frame.appendChild(v)

        const overlay = document.createElement("div")
        overlay.className = "absolute inset-0 flex items-center justify-center"
        overlay.innerHTML =
          '<div class="w-16 h-16 bg-surface/30 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface shadow-xl active:scale-90 transition-transform"><span class="material-symbols-outlined text-4xl" style="font-variation-settings: \'FILL\' 1;">play_arrow</span></div>'
        frame.appendChild(overlay)

        frame.addEventListener("click", (e) => {
          e.preventDefault()
          const url = videos[0]?.url || ""
          if (url) showVideo(url)
        })

        box.appendChild(frame)
        article.appendChild(box)
      } else if (images.length === 1) {
        const box = document.createElement("div")
        box.className = "mb-4 rounded-xl overflow-hidden shadow-sm bg-surface-container-high"
        const img = document.createElement("img")
        img.className = "w-full h-72 object-cover"
        img.loading = "lazy"
        img.src = images[0]?.url || ""
        box.appendChild(img)
        img.addEventListener("click", (e) => {
          e.preventDefault()
          const urls = images.map((x) => x.url).filter(Boolean)
          ctx.viewer?.show?.(urls, 0)
        })
        article.appendChild(box)
      } else if (images.length > 1) {
        const grid = document.createElement("div")
        grid.className = "grid grid-cols-3 gap-2 mb-4 rounded-xl overflow-hidden"
        images.slice(0, 9).forEach((m, idx) => {
          const img = document.createElement("img")
          img.className = "aspect-square object-cover"
          img.loading = "lazy"
          img.src = m?.url || ""
          img.addEventListener("click", (e) => {
            e.preventDefault()
            const urls = images.map((x) => x.url).filter(Boolean)
            ctx.viewer?.show?.(urls, idx)
          })
          grid.appendChild(img)
        })
        article.appendChild(grid)
      }

      const body = document.createElement("div")
      body.className = "px-2"
      const text = document.createElement("p")
      text.className = "text-on-surface-variant leading-relaxed text-[15px] mb-3"
      text.textContent = p?.content || ""
      body.appendChild(text)

      if (p?.location) {
        const locRow = document.createElement("div")
        locRow.className = "flex items-center gap-3"
        locRow.innerHTML =
          '<div class="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs"><span class="material-symbols-outlined text-[14px]">location_on</span></div>'
        const label = document.createElement("span")
        label.textContent = p.location
        locRow.firstElementChild.appendChild(label)
        body.appendChild(locRow)
      }

      article.appendChild(body)
      feed.appendChild(article)
    }
  }

  ctx.album = {
    async refresh() {
      if (promptText) promptText.textContent = pickPrompt()
      const profile = await loadProfile()
      applyProfile(profile)
      const posts = await api.listPosts({ limit: 30 })
      render(posts, profile)
    }
  }
}
