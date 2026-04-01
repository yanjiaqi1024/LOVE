import { clearAuth } from "./api.js"
import { tokenStore } from "./storage.js"
import { confirmModal, setActiveTab, setHeaderTitle, setLogoutVisible, toast, viewer as createViewer } from "./ui.js"
import { initAlbumView } from "./views/album.js"
import { initHomeView } from "./views/home.js"
import { initInviteView } from "./views/invite.js"
import { initLoginView } from "./views/login.js"
import { initMeView } from "./views/me.js"
import { initPostView } from "./views/post.js"

const views = {
  login: { id: "view-login", title: "Our Sanctuary", tab: null },
  invite: { id: "view-invite", title: "邀请另一半", tab: null },
  home: { id: "view-home", title: "Our Sanctuary", tab: "home" },
  album: { id: "view-album", title: "回忆", tab: "album" },
  post: { id: "view-post", title: "发布回忆", tab: null },
  me: { id: "view-me", title: "我的", tab: "me" }
}

function normalizeHash(hash) {
  const h = (hash || "").replace(/^#/, "")
  const base = h.split("?", 1)[0]
  if (base === "home" || base === "album" || base === "post" || base === "me" || base === "login" || base === "invite") return base
  return "home"
}

function setView(name) {
  for (const [k, v] of Object.entries(views)) {
    const el = document.getElementById(v.id)
    el.classList.toggle("hidden", k !== name)
  }

  const header = document.getElementById("topAppBar")
  header.classList.toggle("hidden", name === "login" || name === "post" || name === "invite")

  const composeBtn = document.getElementById("composeBtn")
  if (composeBtn) composeBtn.classList.toggle("hidden", name !== "album")

  const nav = document.querySelector("nav")
  nav.classList.toggle("hidden", name === "login" || name === "post" || name === "invite")

  setHeaderTitle(views[name].title)
  setActiveTab(views[name].tab)
  setLogoutVisible(name !== "login" && name !== "post")
}

export function navigate(hash) {
  if (!hash.startsWith("#")) hash = `#${hash}`
  if (location.hash === hash) onRoute()
  else location.hash = hash
}

const ctx = {
  navigate,
  viewer: createViewer()
}

initLoginView(ctx)
initInviteView(ctx)
initHomeView(ctx)
initAlbumView(ctx)
initPostView(ctx)
initMeView(ctx)

function isAuthed() {
  return Boolean(tokenStore.get())
}

function onLogout() {
  clearAuth()
  toast("已退出登录", { tone: "success" })
  navigate("#login")
}

document.getElementById("settingsBtn").addEventListener("click", async (e) => {
  e.preventDefault()
  const ok = await confirmModal({
    title: "设置",
    body: "要退出登录吗？",
    okText: "退出",
    cancelText: "取消"
  })
  if (ok) onLogout()
})

const composeBtn = document.getElementById("composeBtn")
if (composeBtn) {
  composeBtn.addEventListener("click", (e) => {
    e.preventDefault()
    navigate("#post")
  })
}

async function onRoute() {
  const target = normalizeHash(location.hash)
  if (!isAuthed() && target !== "login") {
    setView("login")
    if (location.hash !== "#login") history.replaceState(null, "", "#login")
    return
  }

  const name = target === "login" ? "login" : target
  setView(name)

  try {
    if (name === "home") await ctx.home?.refresh?.()
    if (name === "album") await ctx.album?.refresh?.()
    if (name === "post") await ctx.post?.refresh?.()
    if (name === "me") await ctx.me?.refresh?.()
  } catch (e) {
    toast(e.message || "加载失败", { tone: "error" })
  }
}

window.addEventListener("hashchange", onRoute)

if (!location.hash) {
  location.hash = isAuthed() ? "#home" : "#login"
}

onRoute()
