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

export function setHeaderTitle(title) {
  const node = document.getElementById("headerTitle")
  node.textContent = title || "Our Sanctuary"
}

export function setLogoutVisible(v) {
  const btn = document.getElementById("settingsBtn")
  btn.classList.toggle("hidden", !v)
}

export function setActiveTab(tab) {
  for (const id of ["home", "album", "me"]) {
    const a = document.getElementById(`tab-${id}`)
    a.classList.toggle("is-active", id === tab)
  }
}

export function confirmModal({ title = "确认", body = "确定要继续吗？", okText = "确定", cancelText = "取消" } = {}) {
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
