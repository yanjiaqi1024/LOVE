import { api } from "../api.js"
import { cacheStore } from "../storage.js"
import { confirmModal, enhanceGenderSelect, setHeaderBrand, setHeaderGender, toast } from "../ui.js"
import { getIntlLocale, t } from "../i18n.js"
import { onLogout } from "../app.js"

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
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

function setImgs(els, url) {
  if (!els) return
  if (Array.isArray(els)) {
    for (const el of els) setImg(el, url)
    return
  }
  setImg(els, url)
}

export function initMeView(ctx) {
  const meAvatarYourImg = document.getElementById("meAvatarYourImg")
  const meAvatarPartnerImg = document.getElementById("meAvatarPartnerImg")
  const editYourAvatarPreviewImg = document.getElementById("editYourAvatarPreviewImg")
  const editYourAvatarPreviewImg2 = document.getElementById("editYourAvatarPreviewImg2")
  const editPartnerAvatarPreviewImg = document.getElementById("editPartnerAvatarPreviewImg")
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

  const inputYourNickname = document.getElementById("inputYourNickname")
  const inputPartnerNickname = document.getElementById("inputPartnerNickname")
  const inputYourGender = document.getElementById("inputYourGender")
  const inputPartnerGender = document.getElementById("inputPartnerGender")
  const inputMetDate = document.getElementById("inputMetDate")
  const inputTogetherDate = document.getElementById("inputTogetherDate")
  const inputSlogan = document.getElementById("inputSlogan")
  const inputYourAvatar = document.getElementById("inputYourAvatar")
  const inputPartnerAvatar = document.getElementById("inputPartnerAvatar")
  const inputYourAvatarFile = document.getElementById("inputYourAvatarFile")
  const inputPartnerAvatarFile = document.getElementById("inputPartnerAvatarFile")
  const yourAvatarFileName = document.getElementById("yourAvatarFileName")
  const partnerAvatarFileName = document.getElementById("partnerAvatarFileName")
  const inputSpaceName = document.getElementById("inputSpaceName")
  const inputSpaceLogo = document.getElementById("inputSpaceLogo")
  const inputSpaceLogoFile = document.getElementById("inputSpaceLogoFile")
  const spaceLogoFileName = document.getElementById("spaceLogoFileName")
  const saveProfileBtn = document.getElementById("saveProfileBtn")

  const addAnniversaryBtn = document.getElementById("addAnniversaryBtn")
  const anniversaryList = document.getElementById("anniversaryList")
  const anniversaryEmpty = document.getElementById("anniversaryEmpty")

  const anniversaryModalRoot = document.getElementById("anniversaryModalRoot")
  const anniversaryModalTitle = document.getElementById("anniversaryModalTitle")
  const anniversaryNameInput = document.getElementById("anniversaryNameInput")
  const anniversaryDayInput = document.getElementById("anniversaryDayInput")
  const anniversaryModalCancel = document.getElementById("anniversaryModalCancel")
  const anniversaryModalOk = document.getElementById("anniversaryModalOk")

  const meLogoutBtn = document.getElementById("meLogoutBtn")
  const breakupBtn = document.getElementById("breakupBtn")
  if (inputYourGender) enhanceGenderSelect(inputYourGender)
  if (inputPartnerGender) enhanceGenderSelect(inputPartnerGender)
  if (inputYourGender) {
    inputYourGender.addEventListener("change", () => {
      setHeaderGender(inputYourGender.value || "")
    })
  }

  let currentProfile = null
  let calendarCursor = (() => {
    const t = new Date()
    t.setDate(1)
    t.setHours(0, 0, 0, 0)
    return t
  })()
  let currentSummary = null
  let yourAvatarObjectUrl = ""
  let partnerAvatarObjectUrl = ""
  let spaceLogoObjectUrl = ""

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
    const a = p?.yourNickname?.trim() || t("album.you")
    const b = p?.partnerNickname?.trim() || t("album.partner")
    if (meCoupleNames) meCoupleNames.textContent = `${a} & ${b}`
    if (meSinceText) {
      const y = yearText(p?.loveDate || "")
      meSinceText.textContent = y ? t("me.sinceYear", { year: y }) : t("me.noData")
    }
    if (meMetDateText) meMetDateText.textContent = formatStoryDate(p?.metDate || "")
    if (meLoveDateText) meLoveDateText.textContent = formatStoryDate(p?.loveDate || "")
    if (meMetNote) meMetNote.textContent = p?.metDate ? t("me.metNote") : t("me.noData")
    if (meLoveNote) meLoveNote.textContent = p?.loveDate ? t("me.loveNote") : t("me.noData")
    if (meSloganText) meSloganText.textContent = p?.slogan?.trim() || t("me.noData")

    inputYourNickname.value = p?.yourNickname || ""
    inputPartnerNickname.value = p?.partnerNickname || ""
    inputYourGender.value = p?.yourGender || ""
    inputPartnerGender.value = p?.partnerGender || ""
    try {
      inputYourGender.dispatchEvent(new Event("change", { bubbles: true }))
    } catch {}
    try {
      inputPartnerGender.dispatchEvent(new Event("change", { bubbles: true }))
    } catch {}
    inputMetDate.value = p?.metDate || ""
    inputTogetherDate.value = p?.loveDate || ""
    inputSlogan.value = p?.slogan || ""
    inputSpaceName.value = p?.spaceName || ""
    inputSpaceLogo.value = p?.spaceLogo || ""
    inputYourAvatar.value = p?.yourAvatar || ""
    inputPartnerAvatar.value = p?.partnerAvatar || ""
    if (inputYourAvatarFile) inputYourAvatarFile.value = ""
    if (inputPartnerAvatarFile) inputPartnerAvatarFile.value = ""
    if (inputSpaceLogoFile) inputSpaceLogoFile.value = ""
    if (yourAvatarFileName) yourAvatarFileName.textContent = t("me.unselected")
    if (partnerAvatarFileName) partnerAvatarFileName.textContent = t("me.unselected")
    if (spaceLogoFileName) spaceLogoFileName.textContent = t("me.unselected")

    try {
      if (yourAvatarObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(yourAvatarObjectUrl)
    } catch {}
    try {
      if (partnerAvatarObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(partnerAvatarObjectUrl)
    } catch {}
    try {
      if (spaceLogoObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(spaceLogoObjectUrl)
    } catch {}
    yourAvatarObjectUrl = ""
    partnerAvatarObjectUrl = ""
    spaceLogoObjectUrl = ""

    setImgs([meAvatarYourImg, editYourAvatarPreviewImg, editYourAvatarPreviewImg2], p?.yourAvatar || "")
    setImgs([meAvatarPartnerImg, editPartnerAvatarPreviewImg], p?.partnerAvatar || "")

    const logo = String(p?.spaceLogo || "").trim() || p?.yourAvatar || p?.partnerAvatar || ""
    setHeaderBrand({ name: p?.spaceName || "", logoUrl: logo })
    setHeaderGender(p?.yourGender || "")
  }

  function handleAvatarFileChange(which, inputEl, imgEls, nameEl, getFallbackUrl) {
    if (!inputEl) return
    inputEl.addEventListener("change", () => {
      const f = inputEl.files?.[0]
      const prev = which === "your" ? yourAvatarObjectUrl : partnerAvatarObjectUrl
      try {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      } catch {}
      if (which === "your") yourAvatarObjectUrl = ""
      else partnerAvatarObjectUrl = ""
      if (!f) {
        if (nameEl) nameEl.textContent = t("me.unselected")
        setImgs(imgEls, getFallbackUrl?.() || "")
        return
      }
      const u = URL.createObjectURL(f)
      if (which === "your") yourAvatarObjectUrl = u
      else partnerAvatarObjectUrl = u
      if (nameEl) nameEl.textContent = f.name || t("me.fileSelected")
      setImgs(imgEls, u)
    })
  }

  handleAvatarFileChange(
    "your",
    inputYourAvatarFile,
    [meAvatarYourImg, editYourAvatarPreviewImg, editYourAvatarPreviewImg2],
    yourAvatarFileName,
    () => inputYourAvatar?.value || ""
  )
  handleAvatarFileChange(
    "partner",
    inputPartnerAvatarFile,
    [meAvatarPartnerImg, editPartnerAvatarPreviewImg],
    partnerAvatarFileName,
    () => inputPartnerAvatar?.value || ""
  )

  if (inputSpaceLogoFile) {
    inputSpaceLogoFile.addEventListener("change", () => {
      const f = inputSpaceLogoFile.files?.[0]
      try {
        if (spaceLogoObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(spaceLogoObjectUrl)
      } catch {}
      spaceLogoObjectUrl = ""
      if (!f) {
        if (spaceLogoFileName) spaceLogoFileName.textContent = t("me.unselected")
        const url = String(inputSpaceLogo?.value || "").trim()
        if (url) setHeaderBrand({ name: inputSpaceName?.value || "", logoUrl: url })
        return
      }
      const u = URL.createObjectURL(f)
      spaceLogoObjectUrl = u
      if (spaceLogoFileName) spaceLogoFileName.textContent = f.name || t("me.fileSelected")
      setHeaderBrand({ name: inputSpaceName?.value || "", logoUrl: u })
    })
  }

  saveProfileBtn.addEventListener("click", async (e) => {
    e.preventDefault()
    try {
      saveProfileBtn.disabled = true
      let spaceLogoUrl = inputSpaceLogo.value.trim()
      let yourAvatarUrl = inputYourAvatar.value.trim()
      let partnerAvatarUrl = inputPartnerAvatar.value.trim()

      const logoFile = inputSpaceLogoFile?.files?.[0]
      const yourFile = inputYourAvatarFile?.files?.[0]
      const partnerFile = inputPartnerAvatarFile?.files?.[0]

      if (logoFile) {
        const r = await api.uploadAvatar(logoFile)
        spaceLogoUrl = r?.url || spaceLogoUrl
      }
      if (yourFile) {
        const r = await api.uploadAvatar(yourFile)
        yourAvatarUrl = r?.url || yourAvatarUrl
      }
      if (partnerFile) {
        const r = await api.uploadAvatar(partnerFile)
        partnerAvatarUrl = r?.url || partnerAvatarUrl
      }

      const payload = {
        spaceName: inputSpaceName.value.trim(),
        spaceLogo: spaceLogoUrl,
        yourGender: inputYourGender.value || "",
        partnerGender: inputPartnerGender.value || "",
        yourNickname: inputYourNickname.value.trim(),
        partnerNickname: inputPartnerNickname.value.trim(),
        yourAvatar: yourAvatarUrl,
        partnerAvatar: partnerAvatarUrl,
        metDate: inputMetDate.value || null,
        loveDate: inputTogetherDate.value || null,
        slogan: inputSlogan.value.trim()
      }
      const p = await api.putProfile(payload)
      cacheStore.setProfile(p)
      applyProfile(p)
      toast(t("toast.saved"), { tone: "success" })
      if (location.hash === "#home") ctx.home?.refresh?.()
    } catch (err) {
      toast(err.message || t("toast.saveFail"), { tone: "error" })
    } finally {
      saveProfileBtn.disabled = false
    }
  })

  function applyMilestones(items) {
    const today = startOfToday()
    const list = Array.isArray(items) ? items : []
    const future = list
      .map((x) => {
        const next = nextAnnualOccurrence(x.day, today)
        if (!next) return null
        return {
          ...x,
          _next: next,
          _nextStr: isoDate(next),
          _daysLeft: Math.ceil((next.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        }
      })
      .filter(Boolean)
      .filter((x) => x._daysLeft >= 0)
      .sort((a, b) => a._daysLeft - b._daysLeft)

    const first = future[0]
    const second = future[1]

    if (milestonePrimaryDays) milestonePrimaryDays.textContent = first ? String(first._daysLeft) : t("me.noData")
    if (milestonePrimaryDesc) {
      milestonePrimaryDesc.textContent = first ? t("me.milestoneDesc", { next: first._nextStr, name: first.name }) : t("me.noData")
    }

    if (milestoneSecondaryName) milestoneSecondaryName.textContent = first ? t("me.milestoneDescNoName", { next: first._nextStr, name: first.name }) : t("me.noData")
    if (milestoneSecondaryDays) milestoneSecondaryDays.textContent = first ? String(first._daysLeft) : t("me.noData")
  }

  function anniversaryModal({ title = t("ann.modal.create"), initialName = "", initialDay = "" } = {}) {
    if (
      !anniversaryModalRoot ||
      !anniversaryModalTitle ||
      !anniversaryNameInput ||
      !anniversaryDayInput ||
      !anniversaryModalCancel ||
      !anniversaryModalOk
    ) {
      return Promise.resolve(null)
    }

    anniversaryModalTitle.textContent = title
    anniversaryNameInput.value = initialName
    anniversaryDayInput.value = initialDay
    anniversaryModalRoot.classList.remove("hidden")
    setTimeout(() => anniversaryNameInput.focus(), 0)

    return new Promise((resolve) => {
      const cleanup = (v) => {
        anniversaryModalRoot.classList.add("hidden")
        anniversaryModalOk.removeEventListener("click", onOk)
        anniversaryModalCancel.removeEventListener("click", onCancel)
        anniversaryModalRoot.removeEventListener("click", onBackdrop)
        anniversaryNameInput.removeEventListener("keydown", onNameKeydown)
        anniversaryDayInput.removeEventListener("keydown", onDayKeydown)
        window.removeEventListener("keydown", onEscape)
        resolve(v)
      }

      const submit = () => {
        const name = anniversaryNameInput.value.trim()
        const day = anniversaryDayInput.value
        if (!name) {
          toast(t("ann.needName"), { tone: "error" })
          anniversaryNameInput.focus()
          return
        }
        if (!day) {
          toast(t("ann.needDay"), { tone: "error" })
          anniversaryDayInput.focus()
          return
        }
        cleanup({ name, day })
      }

      const onOk = (e) => {
        e.preventDefault()
        submit()
      }
      const onCancel = (e) => {
        e.preventDefault()
        cleanup(null)
      }
      const onBackdrop = (e) => {
        const backdrop = anniversaryModalRoot.firstElementChild
        if (e.target === anniversaryModalRoot || e.target === backdrop) cleanup(null)
      }
      const onNameKeydown = (e) => {
        if (e.key !== "Enter") return
        e.preventDefault()
        submit()
      }
      const onDayKeydown = (e) => {
        if (e.key !== "Enter") return
        e.preventDefault()
        submit()
      }
      const onEscape = (e) => {
        if (e.key !== "Escape") return
        e.preventDefault()
        cleanup(null)
      }

      anniversaryModalOk.addEventListener("click", onOk)
      anniversaryModalCancel.addEventListener("click", onCancel)
      anniversaryModalRoot.addEventListener("click", onBackdrop)
      anniversaryNameInput.addEventListener("keydown", onNameKeydown)
      anniversaryDayInput.addEventListener("keydown", onDayKeydown)
      window.addEventListener("keydown", onEscape)
    })
  }

  function monthTitle(d) {
    return d.toLocaleDateString(getIntlLocale(), { year: "numeric", month: "long" })
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

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("div")
      cell.className = "relative h-8 flex flex-col items-center justify-center"

      const date = new Date(y, m, day)
      const dateStr = isoDate(date)
      const span = document.createElement("span")
      span.className = "text-xs font-body text-on-surface-variant"
      span.textContent = String(day)

      const isToday = isThisMonth && day === today.getDate()
      if (isToday) {
        span.className =
          "text-xs font-body font-bold text-primary ring-1 ring-primary/30 rounded-full w-6 h-6 flex items-center justify-center mx-auto bg-primary-container/20 z-10"
      }

      const isFuture = date.getTime() > today.getTime()
      if (isFuture && !isToday) {
        span.className = span.className.replace("text-on-surface-variant", "text-on-surface-variant/30")
      }

      cell.appendChild(span)

      // 检查当前日期是否有打卡记录
      const history = currentSummary?.history || {}
      const record = history[dateStr]
      if (record) {
        const hasYour = Boolean(record.your)
        const hasPartner = Boolean(record.partner)
        
        if (hasYour || hasPartner) {
          const heart = document.createElement("span")
          heart.className = "absolute -bottom-1 material-symbols-outlined text-[10px] text-primary"
          
          if (hasYour && hasPartner) {
            // 两人都打卡：完整爱心
            heart.style.fontVariationSettings = "'FILL' 1"
            heart.textContent = "favorite"
          } else {
            // 单人打卡：半心 (使用 CSS 裁剪实现半心效果)
            heart.style.fontVariationSettings = "'FILL' 1"
            heart.textContent = "favorite"
            // 根据是谁打卡决定显示左半边还是右半边
            if (hasYour) {
              heart.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0 100%)"
            } else {
              heart.style.clipPath = "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"
            }
          }
          cell.appendChild(heart)
        }
      } else if (isToday && Boolean(currentSummary?.checkedInToday)) {
        // 兼容旧逻辑：如果今天是当月，且 checkedInToday 为 true，但 history 里还没数据
        const heart = document.createElement("span")
        heart.className = "absolute -bottom-1 material-symbols-outlined text-[10px] text-primary"
        heart.style.fontVariationSettings = "'FILL' 1"
        heart.textContent = "favorite"
        heart.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0 100%)" // 自己打卡算半心
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
      checkInBtn.innerHTML = `<span class="material-symbols-outlined text-sm">task_alt</span> ${t("me.checkinDone")}`
      checkInBtn.classList.remove("bg-primary-container", "text-on-primary-container")
      checkInBtn.classList.add("bg-surface-container-highest", "text-on-surface")
    } else {
      checkInBtn.innerHTML = `<span class="material-symbols-outlined text-sm">draw</span> ${t("me.checkinRecord")}`
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
      meta.textContent = formatDay(it.day)
      left.appendChild(name)
      left.appendChild(meta)

      const right = document.createElement("div")
      right.className = "flex items-center gap-2"

      const editBtn = document.createElement("button")
      editBtn.className =
        "text-xs px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/25 text-primary font-bold active:scale-95 transition-all duration-300 whitespace-nowrap"
      editBtn.textContent = t("me.edit")

      const delBtn = document.createElement("button")
      delBtn.className =
        "text-xs px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/25 active:scale-95 transition-all duration-300 text-error font-bold whitespace-nowrap"
      delBtn.textContent = t("me.delete")

      editBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        const v = await anniversaryModal({ title: t("ann.modal.edit"), initialName: it.name, initialDay: it.day })
        if (!v) return
        try {
          await api.updateAnniversary(it.id, { name: v.name, day: v.day })
          toast(t("toast.updated"), { tone: "success" })
          await refreshAnniversaries()
        } catch (err) {
          toast(err.message || t("toast.updateFail"), { tone: "error" })
        }
      })

      delBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        const ok = await confirmModal({ title: t("ann.deleteTitle"), body: t("ann.deleteBody", { name: it.name }) })
        if (!ok) return
        try {
          await api.deleteAnniversary(it.id)
          toast(t("toast.deleted"), { tone: "success" })
          await refreshAnniversaries()
        } catch (err) {
          toast(err.message || t("toast.deleteFail"), { tone: "error" })
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
    const v = await anniversaryModal()
    if (!v) return
    try {
      await api.createAnniversary(v.name, v.day)
      toast(t("toast.added"), { tone: "success" })
      await refreshAnniversaries()
    } catch (err) {
      toast(err.message || t("toast.addFail"), { tone: "error" })
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
        toast(t("toast.todayRecorded"), { tone: "success" })
      } catch (err) {
        toast(err.message || t("toast.recordFail"), { tone: "error" })
      }
      setCheckinButtonState()
      renderCalendar()
      if (location.hash === "#home") ctx.home?.refresh?.()
    })
  }

  if (meLogoutBtn) {
    meLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      const ok = await confirmModal({
        title: t("confirm.logout.title"),
        body: t("confirm.logout.body"),
        okText: t("confirm.logout.ok"),
        cancelText: t("modal.cancel")
      })
      if (ok) onLogout()
    })
  }

  async function onBreakup() {
    const ok = await confirmModal({
      title: t("confirm.breakup.title"),
      body: t("confirm.breakup.body"),
      okText: t("confirm.breakup.ok"),
      cancelText: t("modal.cancel")
    })
    if (!ok) return
    try {
      await api.breakupCouple()
      cacheStore.clearProfile()
      toast(t("toast.breakupOk"), { tone: "success" })
      ctx.navigate("#invite")
    } catch (err) {
      toast(err.message || t("toast.loadFail"), { tone: "error" })
    }
  }

  if (breakupBtn) {
    breakupBtn.addEventListener("click", (e) => {
      e.preventDefault()
      onBreakup()
    })
    breakupBtn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return
      e.preventDefault()
      onBreakup()
    })
  }

  ctx.me = {
    async refresh() {
      const p = await loadProfile()
      applyProfile(p)
      await refreshAnniversaries()
      await refreshCheckins()
    }
  }
}
