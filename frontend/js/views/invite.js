import { api } from "../api.js"
import { t } from "../i18n.js"
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
  const guideBtn = document.getElementById("inviteGuideTitle")
  const guideClose = document.getElementById("guideModalClose")

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
          await navigator.share({ title: t("invite.shareTitle"), text: t("invite.shareText"), url })
          toast(t("invite.shared"), { tone: "success" })
          return
        } catch {}
      }

      const ok = await copyText(url)
      toast(ok ? t("invite.copied") : t("invite.copyFallback"), { tone: ok ? "success" : "error" })
    } catch (err) {
      toast(err?.message || t("invite.fail"), { tone: "error" })
    }
  })

  function openGuide() {
    const root = document.getElementById("guideModalRoot")
    if (!root) return
    root.classList.remove("hidden")
  }

  function closeGuide() {
    const root = document.getElementById("guideModalRoot")
    if (!root) return
    root.classList.add("hidden")
  }

  if (guideBtn) {
    guideBtn.dataset.boundGuide = "1"
    guideBtn.addEventListener("click", (e) => {
      e.preventDefault()
      openGuide()
    })
  }

  if (guideClose) {
    guideClose.addEventListener("click", (e) => {
      e.preventDefault()
      closeGuide()
    })
  }

  const guideRoot = document.getElementById("guideModalRoot")
  if (guideRoot) {
    guideRoot.addEventListener("click", (e) => {
      const backdrop = guideRoot.firstElementChild
      if (e.target === guideRoot || e.target === backdrop) closeGuide()
    })
  }

  if (!globalThis.__guideEscBound) {
    globalThis.__guideEscBound = true
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return
      const root = document.getElementById("guideModalRoot")
      if (!root || root.classList.contains("hidden")) return
      e.preventDefault()
      root.classList.add("hidden")
    })
  }

  refresh().catch(() => {})
}
