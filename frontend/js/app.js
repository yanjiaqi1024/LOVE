import { clearAuth } from "./api.js"
import { tokenStore } from "./storage.js"
import { confirmModal, setActiveTab, setHeaderTitle, toast, viewer as createViewer } from "./ui.js"
import { initI18n, onLocaleChange, t } from "./i18n.js"
import { initAlbumView } from "./views/album.js"
import { initHomeView } from "./views/home.js"
import { initInviteView } from "./views/invite.js"
import { initLoginView } from "./views/login.js"
import { initMeView } from "./views/me.js"
import { initPostView } from "./views/post.js"

const views = {
  login: { id: "view-login", titleKey: "app.brand", tab: null },
  invite: { id: "view-invite", titleKey: "nav.invite", tab: null },
  home: { id: "view-home", titleKey: "app.brand", tab: "home" },
  album: { id: "view-album", titleKey: "nav.album", tab: "album" },
  post: { id: "view-post", titleKey: "nav.post", tab: null },
  me: { id: "view-me", titleKey: "nav.me", tab: "me" }
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

  setHeaderTitle(t(views[name].titleKey))
  setActiveTab(views[name].tab)
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

initI18n()

initLoginView(ctx)
initInviteView(ctx)
initHomeView(ctx)
initAlbumView(ctx)
initPostView(ctx)
initMeView(ctx)

function isAuthed() {
  return Boolean(tokenStore.get())
}

export function onLogout() {
  clearAuth()
  toast(t("toast.logout"), { tone: "success" })
  navigate("#login")
}

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
    toast(e.message || t("toast.loadFail"), { tone: "error" })
  }
}

window.addEventListener("hashchange", onRoute)

if (!location.hash) {
  location.hash = isAuthed() ? "#home" : "#login"
}

onRoute()

onLocaleChange(() => {
  onRoute()
})
