import { api } from "../api.js"
import { toast } from "../ui.js"

function getInviteCodeFromHash() {
  const raw = String(location.hash || "").replace(/^#/, "")
  const qs = raw.includes("?") ? raw.split("?", 2)[1] : ""
  const params = new URLSearchParams(qs)
  return params.get("invite") || params.get("code") || ""
}

export function initLoginView(ctx) {
  const username = document.getElementById("authUsername")
  const password = document.getElementById("authPassword")
  const togglePasswordBtn = document.getElementById("togglePasswordBtn")
  const togglePasswordIcon = document.getElementById("togglePasswordIcon")
  const loginBtn = document.getElementById("loginBtn")
  const registerBtn = document.getElementById("registerBtn")

  async function goNext() {
    const me = await api.me()
    if ((me?.coupleMemberCount || 0) >= 2) ctx.navigate("#home")
    else ctx.navigate("#invite")
  }

  async function onLogin() {
    const u = username.value.trim()
    const p = password.value
    if (!u || !p) return toast("请输入账号和密码", { tone: "error" })
    try {
      const inviteCode = getInviteCodeFromHash()
      await api.login(u, p, { inviteCode })
      toast("登录成功", { tone: "success" })
      await goNext()
    } catch (e) {
      toast(e.message || "登录失败", { tone: "error" })
    }
  }

  async function onRegister() {
    const u = username.value.trim()
    const p = password.value
    if (!u || !p) return toast("请输入用户名和密码后加入我们的世界", { tone: "error" })
    try {
      const inviteCode = getInviteCodeFromHash()
      await api.register(u, p, { inviteCode })
      await api.login(u, p, { inviteCode })
      toast("欢迎来到情侣空间", { tone: "success" })
      await goNext()
    } catch (e) {
      toast(e.message || "注册失败", { tone: "error" })
    }
  }

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault()
    onLogin()
  })
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault()
    onRegister()
  })

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
}
