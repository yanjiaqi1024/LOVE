import { api } from "../api.js"
import { toast } from "../ui.js"

function buildInviteUrl(inviteCode) {
  const base = new URL(`${location.origin}${location.pathname}${location.search}`)
  base.hash = `login?invite=${encodeURIComponent(inviteCode)}`
  return base.toString()
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "true")
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function initInviteView() {
  const btn = document.getElementById("inviteShareBtn")
  const linkEl = document.getElementById("inviteLinkText")

  if (!btn) return

  async function refresh() {
    const me = await api.me()
    if ((me?.coupleMemberCount || 0) >= 2) location.hash = "#home"
  }

  if (!globalThis.__inviteRefreshBound) {
    globalThis.__inviteRefreshBound = true
    window.addEventListener("hashchange", () => {
      const raw = String(location.hash || "").replace(/^#/, "")
      const base = raw.split("?", 1)[0]
      if (base === "invite") refresh().catch(() => {})
    })
  }

  btn.addEventListener("click", async (e) => {
    e.preventDefault()
    try {
      const { inviteCode } = await api.getMyInvite()
      const url = buildInviteUrl(inviteCode)
      if (linkEl) linkEl.textContent = url

      if (navigator.share) {
        try {
          await navigator.share({ title: "情侣空间邀请", text: "快来加入我们的情侣空间吧～", url })
          toast("已调起分享", { tone: "success" })
          return
        } catch {}
      }

      const ok = await copyText(url)
      toast(ok ? "链接已复制，可以发给 TA 了" : "生成成功，请手动复制链接", { tone: ok ? "success" : "error" })
    } catch (err) {
      toast(err?.message || "生成邀请链接失败", { tone: "error" })
    }
  })

  refresh().catch(() => {})
}
