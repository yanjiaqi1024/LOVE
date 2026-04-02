import { api } from "../api.js"
import { t } from "../i18n.js"
import { enhanceGenderSelect, toast } from "../ui.js"

function getInviteCodeFromHash() {
  const raw = String(location.hash || "").replace(/^#/, "")
  const qs = raw.includes("?") ? raw.split("?", 2)[1] : ""
  const params = new URLSearchParams(qs)
  return params.get("invite") || params.get("code") || ""
}

export function initLoginView(ctx) {
  const loginPanel = document.getElementById("authLoginPanel")
  const registerPanel = document.getElementById("authRegisterPanel")
  const username = document.getElementById("authUsername")
  const password = document.getElementById("authPassword")
  const togglePasswordBtn = document.getElementById("togglePasswordBtn")
  const togglePasswordIcon = document.getElementById("togglePasswordIcon")
  const loginBtn = document.getElementById("loginBtn")
  const registerBtn = document.getElementById("registerBtn")
  const regNickname = document.getElementById("regNickname")
  const regUsername = document.getElementById("regUsername")
  const regGender = document.getElementById("regGender")
  const regPassword = document.getElementById("regPassword")
  const regPassword2 = document.getElementById("regPassword2")
  const registerSubmitBtn = document.getElementById("registerSubmitBtn")
  const backToLoginBtn = document.getElementById("backToLoginBtn")
  if (regGender) enhanceGenderSelect(regGender)

  function showLogin() {
    if (registerPanel) registerPanel.classList.add("hidden")
    if (loginPanel) loginPanel.classList.remove("hidden")
    if (username) username.focus()
  }

  function showRegister() {
    if (loginPanel) loginPanel.classList.add("hidden")
    if (registerPanel) registerPanel.classList.remove("hidden")
    if (regNickname) regNickname.focus()
    else if (regUsername) regUsername.focus()
  }

  async function goNext() {
    const me = await api.me()
    if ((me?.coupleMemberCount || 0) >= 2) ctx.navigate("#home")
    else ctx.navigate("#invite")
  }

  async function applyNickname(nickname) {
    const nick = String(nickname || "").trim()
    if (!nick) return
    try {
      const p = await api.getProfile()
      const next = { ...(p || {}) }
      if (!next.yourNickname) next.yourNickname = nick
      else if (!next.partnerNickname) next.partnerNickname = nick
      else return
      await api.putProfile(next)
    } catch {
      return
    }
  }

  async function applyGender(gender) {
    const g = String(gender || "").trim()
    if (!g) return
    try {
      const p = await api.getProfile()
      const next = { ...(p || {}) }
      if (!next.yourGender) next.yourGender = g
      else if (!next.partnerGender) next.partnerGender = g
      else return
      await api.putProfile(next)
    } catch {
      return
    }
  }

  async function onLogin() {
    const u = username.value.trim()
    const p = password.value
    if (!u || !p) return toast(t("toast.needUserPass"), { tone: "error" })
    try {
      const inviteCode = getInviteCodeFromHash()
      await api.login(u, p, { inviteCode })
      toast(t("toast.loginOk"), { tone: "success" })
      await goNext()
    } catch (e) {
      toast(e.message || t("toast.loginFail"), { tone: "error" })
    }
  }

  async function onRegister() {
    const nick = regNickname ? regNickname.value.trim() : ""
    const gender = regGender ? regGender.value : ""
    const u = regUsername ? regUsername.value.trim() : username.value.trim()
    const p = regPassword ? regPassword.value : password.value
    const p2 = regPassword2 ? regPassword2.value : p
    if (!u || !p) return toast(t("toast.needUserPassRegister"), { tone: "error" })
    if (String(p2 || "") !== String(p || "")) return toast(t("toast.passwordMismatch"), { tone: "error" })
    try {
      const inviteCode = getInviteCodeFromHash()
      await api.register(u, p, { inviteCode })
      await api.login(u, p, { inviteCode })
      await applyNickname(nick)
      await applyGender(gender)
      toast(t("toast.registerOk"), { tone: "success" })
      await goNext()
    } catch (e) {
      toast(e.message || t("toast.registerFail"), { tone: "error" })
    }
  }

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault()
    onLogin()
  })
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault()
    showRegister()
  })
  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", (e) => {
      e.preventDefault()
      onRegister()
    })
  }
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", (e) => {
      e.preventDefault()
      showLogin()
    })
  }

  if (togglePasswordBtn && password) {
    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault()
      const isHidden = password.getAttribute("type") !== "text"
      password.setAttribute("type", isHidden ? "text" : "password")
      if (togglePasswordIcon) togglePasswordIcon.textContent = isHidden ? "visibility_off" : "visibility"
    })
  }

  password.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLogin()
  })

  if (regPassword2) {
    regPassword2.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onRegister()
    })
  } else if (regPassword) {
    regPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onRegister()
    })
  }

  showLogin()
}
