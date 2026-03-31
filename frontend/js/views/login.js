import { api } from "../api.js"
import { toast } from "../ui.js"

export function initLoginView(ctx) {
  const username = document.getElementById("authUsername")
  const password = document.getElementById("authPassword")
  const togglePasswordBtn = document.getElementById("togglePasswordBtn")
  const togglePasswordIcon = document.getElementById("togglePasswordIcon")
  const loginBtn = document.getElementById("loginBtn")
  const registerBtn = document.getElementById("registerBtn")

  async function onLogin() {
    const u = username.value.trim()
    const p = password.value
    if (!u || !p) return toast("请输入账号和密码", { tone: "error" })
    try {
      await api.login(u, p)
      toast("登录成功", { tone: "success" })
      ctx.navigate("#home")
    } catch (e) {
      toast(e.message || "登录失败", { tone: "error" })
    }
  }

  async function onRegister() {
    const u = username.value.trim()
    const p = password.value
    if (!u || !p) return toast("请输入账号和密码", { tone: "error" })
    try {
      await api.register(u, p)
      toast("注册成功，请登录", { tone: "success" })
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
