import { api } from "../api.js"
import { QUOTES, QUOTES_EN } from "../constants.js"
import { getIntlLocale, getLocale, t } from "../i18n.js"
import { cacheStore } from "../storage.js"
import { setHeaderBrand, setHeaderGender, toast } from "../ui.js"

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000
  return Math.floor((a.getTime() - b.getTime()) / ms)
}

function calcLoveDays(loveDateStr) {
  if (!loveDateStr) return 0
  const d = new Date(`${loveDateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 0
  const diff = daysBetween(startOfToday(), d)
  return Math.max(0, diff + 1)
}

function greetingText() {
  const h = new Date().getHours()
  if (h < 6) return "夜深了，也想你"
  if (h < 11) return "早安，今天也要甜甜的"
  if (h < 14) return "中午好，想你一下"
  if (h < 18) return "下午好，继续心动"
  if (h < 22) return "晚上好，慢慢浪漫"
  return "晚安，把温柔留给你"
}

function pickQuote(prev) {
  const list = getLocale() === "en" ? QUOTES_EN : QUOTES
  if (!list.length) return ""
  if (list.length === 1) return list[0]
  let q = prev
  while (q === prev) q = list[Math.floor(Math.random() * list.length)]
  return q
}

export function initHomeView(ctx) {
  const loveDays = document.getElementById("loveDays")
  const loveDateBadge = document.getElementById("loveDateBadge")
  const homeNameYour = document.getElementById("homeNameYour")
  const homeNamePartner = document.getElementById("homeNamePartner")
  const headerAvatarImg = document.getElementById("headerAvatarImg")
  const homeAvatarYourImg = document.getElementById("homeAvatarYourImg")
  const homeAvatarPartnerImg = document.getElementById("homeAvatarPartnerImg")
  const streakDays = document.getElementById("streakDays")
  const totalCheckins = document.getElementById("totalCheckins")
  const checkinBtn = document.getElementById("checkinBtn")
  const checkinBtnText = document.getElementById("checkinBtnText")
  const checkinMeta = document.getElementById("checkinMeta")
  const quoteText = document.getElementById("quoteText")
  const quoteAuthor = document.getElementById("quoteAuthor")
  const nextQuoteBtn = document.getElementById("nextQuoteBtn")
  const nextMilestoneName = document.getElementById("nextMilestoneName")
  const nextMilestoneDaysLeft = document.getElementById("nextMilestoneDaysLeft")

  let currentQuote = pickQuote("")
  quoteText.textContent = currentQuote
  if (quoteAuthor) quoteAuthor.textContent = t("app.brandAuthor")

  nextQuoteBtn.addEventListener("click", (e) => {
    e.preventDefault()
    currentQuote = pickQuote(currentQuote)
    quoteText.textContent = currentQuote
  })

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
    const a = p?.yourNickname?.trim() || t("album.you")
    const b = p?.partnerNickname?.trim() || t("album.partner")
    loveDays.textContent = String(calcLoveDays(p?.loveDate || ""))
    if (loveDateBadge) loveDateBadge.textContent = formatDateBadge(p?.loveDate)
    if (homeNameYour) homeNameYour.textContent = a
    if (homeNamePartner) homeNamePartner.textContent = b
    const yourAvatar = p?.yourAvatar || ""
    const partnerAvatar = p?.partnerAvatar || ""
    applyAvatar(homeAvatarYourImg, yourAvatar)
    applyAvatar(homeAvatarPartnerImg, partnerAvatar)
    const logo = String(p?.spaceLogo || "").trim() || yourAvatar || partnerAvatar
    setHeaderBrand({ name: p?.spaceName || "", logoUrl: logo })
    setHeaderGender(p?.yourGender || "")
    applyAvatar(headerAvatarImg, logo)
  }

  function applyAvatar(el, url) {
    if (!el) return
    if (url) el.setAttribute("src", url)
    else el.removeAttribute("src")
  }

  function formatDateBadge(loveDateStr) {
    if (!loveDateStr) return t("me.noData")
    const d = new Date(`${loveDateStr}T00:00:00`)
    if (Number.isNaN(d.getTime())) return t("me.noData")
    return d.toLocaleDateString(getIntlLocale(), { year: "numeric", month: "long", day: "numeric" })
  }

  function applyCheckinPair(pair) {
    const your = pair?.your || null
    const partner = pair?.partner || null

    streakDays.textContent = String(your?.streakDays ?? 0)
    totalCheckins.textContent = partner ? String(partner?.streakDays ?? 0) : "—"

    const checked = Boolean(your?.checkedInToday)
    checkinBtn.disabled = checked
    checkinBtn.classList.toggle("opacity-60", checked)
    if (checkinBtnText) checkinBtnText.textContent = checked ? t("home.checkedIn") : t("home.checkinToday")
    if (checkinMeta) {
      const last = your?.lastCheckinDate
      checkinMeta.textContent = last ? t("home.lastCheckin", { date: last }) : ""
    }
  }

  function safeDate(y, m, d) {
  const dt = new Date(y, m, d)
  dt.setHours(0, 0, 0, 0)
  while (dt.getMonth() !== m) dt.setDate(dt.getDate() - 1)
  return dt
}

function nextAnnualOccurrence(dayStr, today = startOfToday()) {
  if (!dayStr) return null
  const base = new Date(`${dayStr}T00:00:00`)
  if (Number.isNaN(base.getTime())) return null
  const m = base.getMonth()
  const d = base.getDate()
  let next = safeDate(today.getFullYear(), m, d)
  if (next.getTime() < today.getTime()) next = safeDate(today.getFullYear() + 1, m, d)
  return next
}

function applyNextMilestone(list) {
  if (!nextMilestoneName || !nextMilestoneDaysLeft) return
  const today = startOfToday()
  const items = Array.isArray(list) ? list : []
  const future = items
    .map((x) => {
      const next = nextAnnualOccurrence(x.day, today)
      if (!next) return null
      return {
        ...x,
        daysLeft: Math.ceil((next.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      }
    })
    .filter(Boolean)
    .filter((x) => x.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)

    if (!future.length) {
      nextMilestoneName.textContent = t("me.noData")
      nextMilestoneDaysLeft.textContent = t("me.noData")
      return
    }

    const first = future[0]
    nextMilestoneName.textContent = first.name || t("home.nextMilestone")
    nextMilestoneDaysLeft.textContent = String(first.daysLeft)
  }

  checkinBtn.addEventListener("click", async (e) => {
    e.preventDefault()
    if (checkinBtn.disabled) return
    checkinBtn.classList.add("pop")
    window.setTimeout(() => checkinBtn.classList.remove("pop"), 320)
    try {
      await api.checkinToday()
      const pair = await api.getCheckinPair()
      applyCheckinPair(pair)
      toast(t("toast.checkinOk"), { tone: "success" })
    } catch (err) {
      toast(err.message || t("toast.checkinFail"), { tone: "error" })
    }
  })

  ctx.home = {
    async refresh() {
      const p = await loadProfile()
      applyProfile(p)
      try {
        const pair = await api.getCheckinPair()
        applyCheckinPair(pair)
      } catch (e) {
        applyCheckinPair(null)
      }
      try {
        const list = await api.listAnniversaries()
        applyNextMilestone(list)
      } catch {
        applyNextMilestone([])
      }
    }
  }
}
