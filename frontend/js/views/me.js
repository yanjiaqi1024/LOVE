import { api } from "../api.js"
import { cacheStore, photoStore } from "../storage.js"
import { confirmModal, toast } from "../ui.js"

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysDiff(a, b) {
  const ms = 24 * 60 * 60 * 1000
  return Math.floor((a.getTime() - b.getTime()) / ms)
}

function calcLoveDays(loveDateStr) {
  if (!loveDateStr) return 0
  const d = new Date(`${loveDateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 0
  const diff = daysDiff(startOfToday(), d)
  return Math.max(0, diff + 1)
}

function formatDay(dayStr) {
  if (!dayStr) return ""
  return dayStr
}

function countdownText(dayStr) {
  if (!dayStr) return ""
  const t = new Date(`${dayStr}T00:00:00`)
  if (Number.isNaN(t.getTime())) return ""
  const diff = daysDiff(t, startOfToday())
  if (diff > 0) return `已过 ${diff} 天`
  if (diff === 0) return "就是今天"
  return `还有 ${Math.abs(diff)} 天`
}

function formatStoryDate(dayStr) {
  if (!dayStr) return "--.--.--"
  const d = new Date(`${dayStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return "--.--.--"
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}.${dd}.${yy}`
}

function yearText(dayStr) {
  if (!dayStr) return ""
  const d = new Date(`${dayStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ""
  return String(d.getFullYear())
}

function setImg(el, url) {
  if (!el) return
  if (url) el.setAttribute("src", url)
  else el.removeAttribute("src")
}

export function initMeView(ctx) {
  const DEFAULT_PREVIEW_A =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDTE_Lm6eVCCxbZr28RQKSaZEOfLQHdADwLYX1idxPCF_B6cE9eQ_2NVY6EN5H_EjB368MsjhZrvH1Upvd_j3362DEeKAZsPnlUPFRNaETcNZH0woz8Zb9KDZcUCzM0JnA0ECFN3D6vBrhtKf_H-4e44RoKB5gjhzM5fOPpZ1XPicNTw06fYJK6KzdUD1Fq_8I7Iwbeap-sJWFvCZH9kl3RyYsv9G2JpjrhAod4Tg6OiYtrqkvEFwzRUto2ub2LSpRTxybEj7aG9zs"
  const DEFAULT_PREVIEW_B =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCe15eAD4kf_DM_WYbqGH-iEPsPm7aUwb9z4REljzuBY3Ob2jcJaQGzLOymjFLgYhCmj5DjQhrEVUVUNnF1J9HqEFABzbpJzzivt7Gyk8Vl9QQaApNE9b_nT4YL-Py7YWIMD80ufujOl8UaKieLu7ffpCIgETHhdM0gR8RoDSXyk1Dm5Ru3XyxBGTlYAu56laToz2p8Ih7CvpIbfCBJouoGB4W6VQ7zlIii1ggtGZP6oKwrD51Mhj4PZ3krBGoH8EuPsdrCcSKY11Y"

  const meAvatarYourImg = document.getElementById("meAvatarYourImg")
  const meAvatarPartnerImg = document.getElementById("meAvatarPartnerImg")
  const meCoupleNames = document.getElementById("meCoupleNames")
  const meSinceText = document.getElementById("meSinceText")
  const meMetDateText = document.getElementById("meMetDateText")
  const meLoveDateText = document.getElementById("meLoveDateText")
  const meMetNote = document.getElementById("meMetNote")
  const meLoveNote = document.getElementById("meLoveNote")
  const meSloganText = document.getElementById("meSloganText")

  const milestonePrimaryDays = document.getElementById("milestonePrimaryDays")
  const milestonePrimaryDesc = document.getElementById("milestonePrimaryDesc")
  const milestoneSecondaryName = document.getElementById("milestoneSecondaryName")
  const milestoneSecondaryDays = document.getElementById("milestoneSecondaryDays")
  const milestoneSecondaryAction = document.getElementById("milestoneSecondaryAction")

  const currentMonthYear = document.getElementById("currentMonthYear")
  const calendarGrid = document.getElementById("calendarGrid")
  const calPrevBtn = document.getElementById("calPrevBtn")
  const calNextBtn = document.getElementById("calNextBtn")
  const checkInBtn = document.getElementById("checkInBtn")

  const mePreviewA = document.getElementById("mePreviewA")
  const mePreviewB = document.getElementById("mePreviewB")
  const mePreviewAImg = document.getElementById("mePreviewAImg")
  const mePreviewBImg = document.getElementById("mePreviewBImg")

  const inputYourNickname = document.getElementById("inputYourNickname")
  const inputPartnerNickname = document.getElementById("inputPartnerNickname")
  const inputMetDate = document.getElementById("inputMetDate")
  const inputTogetherDate = document.getElementById("inputTogetherDate")
  const inputSlogan = document.getElementById("inputSlogan")
  const inputYourAvatar = document.getElementById("inputYourAvatar")
  const inputPartnerAvatar = document.getElementById("inputPartnerAvatar")
  const saveProfileBtn = document.getElementById("saveProfileBtn")

  const addAnniversaryBtn = document.getElementById("addAnniversaryBtn")
  const anniversaryList = document.getElementById("anniversaryList")
  const anniversaryEmpty = document.getElementById("anniversaryEmpty")

  let currentProfile = null
  let calendarCursor = (() => {
    const t = new Date()
    t.setDate(1)
    t.setHours(0, 0, 0, 0)
    return t
  })()
  let currentSummary = null
  let previewUrls = []
  let previewAllUrls = []

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
    currentProfile = p
    const a = p?.yourNickname?.trim() || "你"
    const b = p?.partnerNickname?.trim() || "TA"
    if (meCoupleNames) meCoupleNames.textContent = `${a} & ${b}`
    if (meSinceText) {
      const y = yearText(p?.loveDate || "")
      meSinceText.textContent = y ? `自 ${y} 年相恋` : "—"
    }
    if (meMetDateText) meMetDateText.textContent = formatStoryDate(p?.metDate || "")
    if (meLoveDateText) meLoveDateText.textContent = formatStoryDate(p?.loveDate || "")
    if (meMetNote) meMetNote.textContent = p?.metDate ? "第一次遇见的那天" : "—"
    if (meLoveNote) meLoveNote.textContent = p?.loveDate ? "我们约定永远的那天" : "—"
    if (meSloganText) meSloganText.textContent = p?.slogan?.trim() || "—"

    inputYourNickname.value = p?.yourNickname || ""
    inputPartnerNickname.value = p?.partnerNickname || ""
    inputMetDate.value = p?.metDate || ""
    inputTogetherDate.value = p?.loveDate || ""
    inputSlogan.value = p?.slogan || ""
    inputYourAvatar.value = p?.yourAvatar || ""
    inputPartnerAvatar.value = p?.partnerAvatar || ""

    setImg(meAvatarYourImg, p?.yourAvatar || "")
    setImg(meAvatarPartnerImg, p?.partnerAvatar || "")
  }

  saveProfileBtn.addEventListener("click", async (e) => {
    e.preventDefault()
    const payload = {
      yourNickname: inputYourNickname.value.trim(),
      partnerNickname: inputPartnerNickname.value.trim(),
      yourAvatar: inputYourAvatar.value.trim(),
      partnerAvatar: inputPartnerAvatar.value.trim(),
      metDate: inputMetDate.value || null,
      loveDate: inputTogetherDate.value || null,
      slogan: inputSlogan.value.trim()
    }
    try {
      const p = await api.putProfile(payload)
      cacheStore.setProfile(p)
      applyProfile(p)
      toast("已保存", { tone: "success" })
      if (location.hash === "#home") ctx.home?.refresh?.()
    } catch (err) {
      toast(err.message || "保存失败", { tone: "error" })
    }
  })

  function applyMilestones(items) {
    const today = startOfToday()
    const list = Array.isArray(items) ? items : []
    const future = list
      .map((x) => {
        const d = new Date(`${x.day}T00:00:00`)
        return { ...x, _d: d, _daysLeft: Math.ceil((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) }
      })
      .filter((x) => !Number.isNaN(x._d.getTime()))
      .filter((x) => x._daysLeft >= 0)
      .sort((a, b) => a._daysLeft - b._daysLeft)

    const first = future[0]
    const second = future[1]

    if (milestonePrimaryDays) milestonePrimaryDays.textContent = first ? String(first._daysLeft) : "—"
    if (milestonePrimaryDesc) {
      milestonePrimaryDesc.textContent = first ? `距离${first.name}` : "—"
    }

    if (milestoneSecondaryName) milestoneSecondaryName.textContent = second ? second.name : "—"
    if (milestoneSecondaryDays) milestoneSecondaryDays.textContent = second ? String(second._daysLeft) : "—"
  }

  function monthTitle(d) {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    return `${y}年${m}月`
  }

  function clearCalendar() {
    if (!calendarGrid) return
    calendarGrid.innerHTML = ""
  }

  function renderCalendar() {
    if (!calendarGrid || !currentMonthYear) return
    clearCalendar()

    const cursor = new Date(calendarCursor.getTime())
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    currentMonthYear.textContent = monthTitle(cursor)

    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const totalDays = last.getDate()
    const startIdx = (first.getDay() + 6) % 7

    for (let i = 0; i < startIdx; i++) {
      const blank = document.createElement("div")
      blank.className = "h-8 flex items-center justify-center"
      calendarGrid.appendChild(blank)
    }

    const today = startOfToday()
    const isThisMonth = y === today.getFullYear() && m === today.getMonth()
    const checkedToday = Boolean(currentSummary?.checkedInToday)

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("div")
      cell.className = "relative h-8 flex flex-col items-center justify-center"

      const date = new Date(y, m, day)
      const span = document.createElement("span")
      span.className = "text-xs font-body text-on-surface-variant"
      span.textContent = String(day)

      const isToday = isThisMonth && day === today.getDate()
      if (isToday) {
        span.className =
          "text-xs font-body font-bold text-primary ring-1 ring-primary/30 rounded-full w-6 h-6 flex items-center justify-center mx-auto bg-primary-container/20"
      }

      const isFuture = date.getTime() > today.getTime()
      if (isFuture && !isToday) {
        span.className = span.className.replace("text-on-surface-variant", "text-on-surface-variant/30")
      }

      cell.appendChild(span)

      if (isToday && checkedToday) {
        const heart = document.createElement("span")
        heart.className = "absolute -bottom-1 material-symbols-outlined text-[10px] text-primary"
        heart.style.fontVariationSettings = "'FILL' 1"
        heart.textContent = "favorite"
        cell.appendChild(heart)
      }

      calendarGrid.appendChild(cell)
    }
  }

  function setCheckinButtonState() {
    if (!checkInBtn) return
    const checked = Boolean(currentSummary?.checkedInToday)
    checkInBtn.disabled = checked
    if (checked) {
      checkInBtn.innerHTML = '<span class="material-symbols-outlined text-sm">task_alt</span> 今日已打卡'
      checkInBtn.classList.remove("bg-primary-container", "text-on-primary-container")
      checkInBtn.classList.add("bg-surface-container-highest", "text-on-surface")
    } else {
      checkInBtn.innerHTML = '<span class="material-symbols-outlined text-sm">draw</span> 记录今日心情'
      checkInBtn.classList.remove("bg-surface-container-highest", "text-on-surface")
      checkInBtn.classList.add("bg-primary-container", "text-on-primary-container")
    }
  }

  async function refreshCheckins() {
    try {
      currentSummary = await api.getCheckinSummary()
    } catch {
      currentSummary = null
    }
    setCheckinButtonState()
    renderCalendar()
  }

  function revokeUrls(urls) {
    for (const u of urls || []) {
      try {
        if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u)
      } catch {}
    }
  }

  async function refreshPreviews() {
    revokeUrls(previewUrls)
    revokeUrls(previewAllUrls)
    previewUrls = []
    previewAllUrls = []

    let items = []
    try {
      items = await photoStore.list()
    } catch {
      items = []
    }

    const urls = items.map((it) => URL.createObjectURL(it.blob))
    const a = urls[0] || DEFAULT_PREVIEW_A
    const b = urls[1] || DEFAULT_PREVIEW_B
    previewAllUrls = urls.length >= 2 ? urls : urls.length === 1 ? [urls[0], DEFAULT_PREVIEW_B] : [DEFAULT_PREVIEW_A, DEFAULT_PREVIEW_B]
    setImg(mePreviewAImg, a)
    setImg(mePreviewBImg, b)
    previewUrls = [a, b].filter(Boolean)

    if (mePreviewA) mePreviewA.disabled = !a
    if (mePreviewB) mePreviewB.disabled = !b

    if (mePreviewA) {
      mePreviewA.onclick = (e) => {
        e.preventDefault()
        if (!previewAllUrls.length) return
        ctx.viewer?.show?.(previewAllUrls, 0)
      }
    }
    if (mePreviewB) {
      mePreviewB.onclick = (e) => {
        e.preventDefault()
        if (!previewAllUrls.length) return
        ctx.viewer?.show?.(previewAllUrls, Math.min(1, previewAllUrls.length - 1))
      }
    }
  }


  function renderAnniversaries(items) {
    anniversaryList.innerHTML = ""
    anniversaryEmpty.classList.toggle("hidden", (items?.length || 0) > 0)

    for (const it of items || []) {
      const row = document.createElement("div")
      row.className = "rounded-xl bg-surface border border-outline-variant/25 p-4 flex items-center justify-between gap-3"

      const left = document.createElement("div")
      const name = document.createElement("div")
      name.className = "font-medium"
      name.textContent = it.name
      const meta = document.createElement("div")
      meta.className = "text-xs text-secondary/80 mt-1"
      meta.textContent = `${formatDay(it.day)} · ${countdownText(it.day)}`
      left.appendChild(name)
      left.appendChild(meta)

      const right = document.createElement("div")
      right.className = "flex items-center gap-2"

      const editBtn = document.createElement("button")
      editBtn.className =
        "text-xs px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/25 text-primary font-bold active:scale-95 transition-all duration-300 whitespace-nowrap"
      editBtn.textContent = "编辑"

      const delBtn = document.createElement("button")
      delBtn.className =
        "text-xs px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/25 active:scale-95 transition-all duration-300 text-error font-bold whitespace-nowrap"
      delBtn.textContent = "删除"

      editBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        const name = window.prompt("纪念日名称", it.name)
        if (name == null) return
        const day = window.prompt("日期（YYYY-MM-DD）", it.day)
        if (day == null) return
        try {
          await api.updateAnniversary(it.id, { name: name.trim(), day })
          toast("已更新", { tone: "success" })
          await refreshAnniversaries()
        } catch (err) {
          toast(err.message || "更新失败", { tone: "error" })
        }
      })

      delBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        const ok = await confirmModal({ title: "删除纪念日", body: `确定删除「${it.name}」吗？` })
        if (!ok) return
        try {
          await api.deleteAnniversary(it.id)
          toast("已删除", { tone: "success" })
          await refreshAnniversaries()
        } catch (err) {
          toast(err.message || "删除失败", { tone: "error" })
        }
      })

      right.appendChild(editBtn)
      right.appendChild(delBtn)

      row.appendChild(left)
      row.appendChild(right)
      anniversaryList.appendChild(row)
    }
  }

  async function refreshAnniversaries() {
    const items = await api.listAnniversaries()
    renderAnniversaries(items)
    applyMilestones(items)
  }

  addAnniversaryBtn.addEventListener("click", async (e) => {
    e.preventDefault()
    const name = window.prompt("纪念日名称", "")
    if (!name) return
    const day = window.prompt("日期（YYYY-MM-DD）", "")
    if (!day) return
    try {
      await api.createAnniversary(name.trim(), day)
      toast("已新增", { tone: "success" })
      await refreshAnniversaries()
    } catch (err) {
      toast(err.message || "新增失败", { tone: "error" })
    }
  })

  if (milestoneSecondaryAction) {
    milestoneSecondaryAction.addEventListener("click", (e) => {
      e.preventDefault()
      const details = milestoneSecondaryAction.closest("#view-me")?.querySelectorAll("details")
      const manage = details?.[1]
      if (manage) manage.open = true
      manage?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    })
  }

  if (calPrevBtn) {
    calPrevBtn.addEventListener("click", (e) => {
      e.preventDefault()
      const d = new Date(calendarCursor.getTime())
      d.setMonth(d.getMonth() - 1)
      calendarCursor = d
      renderCalendar()
    })
  }
  if (calNextBtn) {
    calNextBtn.addEventListener("click", (e) => {
      e.preventDefault()
      const d = new Date(calendarCursor.getTime())
      d.setMonth(d.getMonth() + 1)
      calendarCursor = d
      renderCalendar()
    })
  }

  if (checkInBtn) {
    checkInBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      if (checkInBtn.disabled) return
      try {
        currentSummary = await api.checkinToday()
        toast("今日已记录", { tone: "success" })
      } catch (err) {
        toast(err.message || "记录失败", { tone: "error" })
      }
      setCheckinButtonState()
      renderCalendar()
      if (location.hash === "#home") ctx.home?.refresh?.()
    })
  }

  ctx.me = {
    async refresh() {
      const p = await loadProfile()
      applyProfile(p)
      await refreshAnniversaries()
      await refreshCheckins()
      await refreshPreviews()
    }
  }
}
