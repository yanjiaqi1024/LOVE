function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v
    else if (k === "text") node.textContent = v
    else node.setAttribute(k, v)
  }
  for (const c of children) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  return node
}

let headerBrand = { name: "", logoUrl: "" }

import { onLocaleChange, t } from "./i18n.js"

export function toast(message, { tone = "info", ms = 2200 } = {}) {
  const root = document.getElementById("toastRoot")
  const wrap = el("div", { class: "mx-auto max-w-md px-4 mt-2 pointer-events-none" })
  const bg =
    tone === "error"
      ? "bg-red-500/90"
      : tone === "success"
        ? "bg-emerald-500/90"
        : "bg-slate-900/80"
  const card = el("div", {
    class: `pop px-4 py-3 rounded-xl text-white text-sm shadow-[0px_12px_32px_rgba(0,0,0,0.18)] backdrop-blur-md ${bg}`
  })
  card.textContent = message
  wrap.appendChild(card)
  root.appendChild(wrap)
  window.setTimeout(() => {
    wrap.remove()
  }, ms)
}

export function setHeaderGender(gender) {
  const g = String(gender || "").trim()
  const node = document.getElementById("headerGenderIcon")
  if (!node) return
  if (!g) {
    node.classList.add("hidden")
    node.textContent = ""
    return
  }
  node.classList.remove("hidden")
  node.textContent = g === "女" ? "female" : g === "男" ? "male" : "wc"
}

export function setHeaderBrand({ name = "", logoUrl = "" } = {}) {
  headerBrand = { name: String(name || ""), logoUrl: String(logoUrl || "") }
  const titleNode = document.getElementById("headerTitle")
  if (titleNode) titleNode.textContent = headerBrand.name.trim() || t("app.brand")
  const img = document.getElementById("headerAvatarImg")
  if (img) {
    const u = headerBrand.logoUrl.trim()
    if (u) img.setAttribute("src", u)
  }
}

export function setHeaderTitle(title) {
  const node = document.getElementById("headerTitle")
  const brand = headerBrand?.name?.trim()
  node.textContent = brand || title || t("app.brand")
}

export function setActiveTab(tab) {
  for (const id of ["home", "album", "me"]) {
    const a = document.getElementById(`tab-${id}`)
    a.classList.toggle("is-active", id === tab)
  }
}

export function confirmModal({ title = t("modal.confirmTitle"), body = "", okText = t("modal.ok"), cancelText = t("modal.cancel") } = {}) {
  const root = document.getElementById("modalRoot")
  const titleEl = document.getElementById("modalTitle")
  const bodyEl = document.getElementById("modalBody")
  const okEl = document.getElementById("modalOk")
  const cancelEl = document.getElementById("modalCancel")

  titleEl.textContent = title
  bodyEl.textContent = body
  okEl.textContent = okText
  cancelEl.textContent = cancelText

  root.classList.remove("hidden")

  return new Promise((resolve) => {
    const cleanup = (v) => {
      root.classList.add("hidden")
      okEl.removeEventListener("click", onOk)
      cancelEl.removeEventListener("click", onCancel)
      root.removeEventListener("click", onBackdrop)
      resolve(v)
    }
    const onOk = (e) => {
      e.preventDefault()
      cleanup(true)
    }
    const onCancel = (e) => {
      e.preventDefault()
      cleanup(false)
    }
    const onBackdrop = (e) => {
      if (e.target === root || e.target === root.firstElementChild) cleanup(false)
    }

    okEl.addEventListener("click", onOk)
    cancelEl.addEventListener("click", onCancel)
    root.addEventListener("click", onBackdrop)
  })
}

export function viewer() {
  const root = document.getElementById("viewerRoot")
  const img = document.getElementById("viewerImg")
  const close = document.getElementById("viewerClose")

  let state = { urls: [], index: 0 }
  let startX = null

  function set(i) {
    state.index = Math.max(0, Math.min(i, state.urls.length - 1))
    img.src = state.urls[state.index] || ""
  }

  function show(urls, index = 0) {
    state = { urls, index }
    root.classList.remove("hidden")
    set(index)
  }

  function hide() {
    root.classList.add("hidden")
    img.src = ""
  }

  function onTouchStart(e) {
    if (e.touches?.length !== 1) return
    startX = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    if (startX == null) return
    const endX = e.changedTouches?.[0]?.clientX
    const dx = (endX ?? startX) - startX
    startX = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) set(state.index + 1)
    else set(state.index - 1)
  }

  close.addEventListener("click", (e) => {
    e.preventDefault()
    hide()
  })
  root.addEventListener("click", (e) => {
    if (e.target === root) hide()
  })
  root.addEventListener("touchstart", onTouchStart, { passive: true })
  root.addEventListener("touchend", onTouchEnd, { passive: true })

  return { show, hide }
}

export function enhanceGenderSelect(selectEl) {
  if (!selectEl) return
  if (selectEl.dataset.enhanced === "1") return
  selectEl.dataset.enhanced = "1"

  const originalParent = selectEl.parentElement
  const wrapper = document.createElement("div")
  wrapper.className = "relative"
  originalParent.insertBefore(wrapper, selectEl)
  wrapper.appendChild(selectEl)

  selectEl.classList.add("sr-only")

  const trigger = document.createElement("button")
  trigger.type = "button"
  trigger.className =
    "w-full h-12 px-4 bg-surface-container-highest rounded-md flex items-center justify-between shadow-[0px_4px_12px_rgba(120,85,94,0.04)] border border-outline-variant/10 active:scale-[0.99] transition-all"

  const triggerText = document.createElement("span")
  triggerText.className = "text-on-surface font-medium"

  const triggerIcon = document.createElement("span")
  triggerIcon.className = "material-symbols-outlined text-primary text-xl"
  triggerIcon.textContent = "favorite"

  trigger.appendChild(triggerText)
  trigger.appendChild(triggerIcon)

  const menu = document.createElement("div")
  menu.className =
    "absolute top-full left-0 w-full bg-surface-container-lowest rounded-b-lg shadow-[0px_12px_32px_rgba(120,85,94,0.08)] overflow-hidden z-10 border border-outline-variant/10 border-t-0 hidden"
  const menuInner = document.createElement("div")
  menuInner.className = "py-2"
  menu.appendChild(menuInner)

  wrapper.appendChild(trigger)
  wrapper.appendChild(menu)

  let isOpen = false

  function labelForValue(v) {
    const s = String(v || "")
    if (!s) return t("gender.unset")
    if (s === "男") return t("gender.male")
    if (s === "女") return t("gender.female")
    return s
  }

  function close() {
    if (!isOpen) return
    isOpen = false
    menu.classList.add("hidden")
    trigger.classList.remove("rounded-t-lg")
    trigger.classList.add("rounded-md")
  }

  function open() {
    if (isOpen) return
    isOpen = true
    menu.classList.remove("hidden")
    trigger.classList.remove("rounded-md")
    trigger.classList.add("rounded-t-lg")
  }

  function syncTrigger() {
    const v = String(selectEl.value || "")
    triggerText.textContent = labelForValue(v)
    if (v) {
      triggerText.classList.remove("text-on-surface-variant")
      triggerText.classList.add("text-primary")
      triggerIcon.style.fontVariationSettings = "'FILL' 1"
      triggerIcon.classList.remove("opacity-50")
    } else {
      triggerText.classList.add("text-on-surface-variant")
      triggerText.classList.remove("text-primary")
      triggerIcon.style.fontVariationSettings = "'FILL' 0"
      triggerIcon.classList.add("opacity-50")
    }
  }

  function rebuildMenu() {
    menuInner.innerHTML = ""
    const opts = Array.from(selectEl.options || []).map((o) => ({ value: o.value, label: o.textContent || "" }))
    const normalized = opts
      .filter((it) => it.value !== "")
      .concat(opts.find((it) => it.value === "") || { value: "", label: t("gender.unset") })

    for (const it of normalized) {
      const row = document.createElement("div")
      row.className =
        "px-4 py-3 flex items-center justify-between text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer group relative"
      row.setAttribute("role", "option")
      row.dataset.value = it.value

      const label = document.createElement("span")
      label.className = "text-sm font-medium group-hover:text-primary transition-colors"
      label.textContent = labelForValue(it.value || it.label)

      const done = document.createElement("span")
      done.className = "material-symbols-outlined text-sm hidden"
      done.textContent = "done"

      const bar = document.createElement("div")
      bar.className = "absolute left-0 w-1 h-6 bg-primary rounded-r-full hidden"

      row.appendChild(label)
      row.appendChild(done)
      row.appendChild(bar)

      row.addEventListener("click", (e) => {
        e.preventDefault()
        selectEl.value = it.value
        selectEl.dispatchEvent(new Event("change", { bubbles: true }))
        syncTrigger()
        rebuildMenu()
        close()
      })

      if (String(selectEl.value || "") === String(it.value || "")) {
        row.classList.add("bg-primary-container/40", "text-primary")
        label.classList.remove("group-hover:text-primary")
        label.classList.add("font-semibold", "text-primary")
        done.classList.remove("hidden")
        bar.classList.remove("hidden")
      }

      menuInner.appendChild(row)
    }
  }

  trigger.addEventListener("click", (e) => {
    e.preventDefault()
    if (isOpen) close()
    else open()
  })

  document.addEventListener(
    "click",
    (e) => {
      if (!isOpen) return
      if (wrapper.contains(e.target)) return
      close()
    },
    true
  )

  window.addEventListener("keydown", (e) => {
    if (!isOpen) return
    if (e.key !== "Escape") return
    e.preventDefault()
    close()
  })

  selectEl.addEventListener("change", () => {
    syncTrigger()
    rebuildMenu()
  })

  syncTrigger()
  rebuildMenu()

  onLocaleChange(() => {
    syncTrigger()
    rebuildMenu()
  })
}
