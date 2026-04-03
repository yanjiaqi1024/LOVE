import { localeStore } from "./storage.js"

const SUPPORTED = ["zh", "en"]

const MESSAGES = {
  zh: {
    "app.title": "情侣空间",
    "app.brand": "我们的空间",
    "app.brandAuthor": "— 我们的空间",

    "nav.home": "首页",
    "nav.album": "回忆",
    "nav.me": "我的",
    "nav.post": "发布回忆",
    "nav.invite": "邀请另一半",

    "top.compose": "发帖子",

    "hint.title": "需要用本地服务打开",
    "hint.desc": "你现在是通过 file:// 直接打开的，浏览器会阻止模块脚本，导致按钮“没反应”。请用下面任一方式打开：",
    "hint.opt1": "方式 1：启动后端后访问 http://localhost:8000/",
    "hint.opt2": "方式 2：在 frontend/ 下运行 python3 -m http.server 5174 后访问 http://localhost:5174/",
    "hint.ok": "我知道了",

    "login.welcomeTitle": "欢迎回到我们的小窝",
    "login.welcomeDesc": "进入专属空间，继续书写我们的故事。",
    "login.username": "账号/手机号",
    "login.usernamePh": "输入账号或手机号",
    "login.password": "密码",
    "login.forgot": "忘记密码？",
    "login.signIn": "登录空间",
    "login.or": "或 留下回忆",
    "login.signUp": "立即注册",
    "login.footerQuote": "“爱在此间，回忆永恒。”",

    "register.title": "我们的小窝",
    "register.subtitle": "The Digital Keepsake",
    "register.nickname": "昵称",
    "register.nicknamePh": "你的爱称",
    "register.gender": "性别",
    "register.account": "账号/手机号",
    "register.accountPh": "输入手机号",
    "register.setPassword": "设置密码",
    "register.setPasswordPh": "请输入密码",
    "register.confirmPassword": "确认密码",
    "register.confirmPasswordPh": "再次输入密码",
    "register.submit": "立即注册",
    "register.backToLogin": "已有账号？去登录",

    "invite.title": "欢迎来到情侣空间！",
    "invite.subTitle": "仅你们俩可见的空间哦~",
    "invite.album": "情侣相册",
    "invite.tree": "爱情树",
    "invite.anniversary": "纪念日",
    "invite.action": "立即邀请我的另一半",
    "invite.shareLink": "分享链接",
    "invite.guide": "开通说明",
    "invite.privacy": "您的隐私对我们至关重要。所有对话和照片均经过端到端加密保护。",
    "guide.title": "开通说明",
    "guide.section.how": "如何开通",
    "guide.section.data": "数据与隐私",
    "guide.section.breakup": "解除关系",
    "guide.step.1": "注册/登录：使用账号/手机号和密码登录情侣空间。",
    "guide.step.2": "生成邀请：进入“邀请另一半”页面，点击“立即邀请我的另一半”，系统会生成邀请链接。",
    "guide.step.3": "对方加入：把链接发给 TA，TA 打开链接后会带 invite 参数，登录/注册后自动绑定到同一个情侣关系。",
    "guide.step.4": "开通完成：当情侣成员达到 2 人时，会自动进入首页并显示共享内容。",
    "guide.data.1": "共享范围：双方的资料、打卡、纪念日、回忆/帖子、相册元数据等都按情侣关系共享。",
    "guide.data.2": "仅两人可见：该空间的数据只对同一情侣关系内的成员展示。",
    "guide.data.3": "媒体存储：头像/图片/视频会上传并通过 /media 访问。",
    "guide.breakup.1": "你可以在“我的”页面点击中间爱心进行解除绑定，系统会二次确认“是否结束这段关系？”。",
    "guide.breakup.2": "解除后会回到邀请页，情侣相关的页面和内容将不再展示，直到重新邀请绑定。",

    "home.sinceMet": "自相遇那天起",
    "home.days": "天",
    "home.dailyCheckin": "每日打卡",
    "home.checkinToday": "今日打卡",
    "home.checkedIn": "今日已打卡",
    "home.lastCheckin": "上次打卡：{date}",
    "home.nextMilestone": "下一个里程碑",
    "home.countdown": "倒计时",
    "home.daysLeft": "剩余天数",
    "home.refresh": "刷新",

    "album.topic": "今日话题",
    "album.empty": "还没有回忆，先发第一条吧",

    "post.thoughts": "此时此刻的想法...",
    "post.textPh": "分享你们的小确幸...",
    "post.moment": "记录瞬间",
    "post.mediaHint": "支持 9 张照片 或 1 段视频",
    "post.locationChoose": "选择当前位置",
    "post.locationLocating": "定位中...",
    "post.visibilityOnlyUs": "仅彼此可见",
    "post.tag.anniversary": "纪念日",
    "post.tag.daily": "日常",
    "post.publish": "发布帖子",
    "post.addPhoto": "添加图片",
    "post.addVideo": "添加视频",

    "me.story": "我们的爱情故事",
    "me.firstMet": "初次见面",
    "me.loveDay": "恋爱纪念日",
    "me.milestones": "即将到来的里程碑",
    "me.milestoneImportant": "重要时刻",
    "me.traces": "爱意足迹",
    "me.checkinRecord": "记录今日心情",
    "me.checkinDone": "今日已打卡",
    "me.editProfile": "编辑资料",
    "me.corner": "属于我们的专属角落",
    "me.yourNickname": "我的昵称",
    "me.partnerNickname": "TA的昵称",
    "me.spaceName": "小窝名称",
    "me.yourNicknamePh": "你的名字",
    "me.partnerNicknamePh": "TA的名字",
    "me.spaceNamePh": "为你们的小窝取个名",
    "me.yourGender": "我的性别",
    "me.partnerGender": "TA的性别",
    "me.metDate": "相识日",
    "me.togetherDate": "在一起日期",
    "me.slogan": "恋爱宣言",
    "me.sloganPh": "写一句你们的宣言",
    "me.visual": "视觉资料",
    "me.spaceLogo": "小窝 LOGO",
    "me.choose": "选择",
    "me.unselected": "未选择图片",
    "me.yourAvatar": "我的头像",
    "me.partnerAvatar": "TA的头像",
    "me.save": "保存资料",
    "me.manageAnn": "管理纪念日",
    "me.importantAnn": "重要纪念日",
    "me.add": "新增",
    "me.annEmpty": "还没有纪念日，新增一个吧",
    "me.logout": "退出登录",
    "me.edit": "编辑",
    "me.delete": "删除",

    "gender.unset": "未设置",
    "gender.male": "男",
    "gender.female": "女",

    "modal.cancel": "取消",
    "modal.ok": "确定",
    "modal.save": "保存",
    "modal.confirmTitle": "确认",

    "toast.logout": "已退出登录",
    "toast.loadFail": "加载失败",
    "toast.needUserPass": "请输入账号和密码",
    "toast.loginOk": "登录成功",
    "toast.loginFail": "登录失败",
    "toast.needUserPassRegister": "请输入账号和密码后注册",
    "toast.passwordMismatch": "两次密码不一致",
    "toast.registerOk": "欢迎来到情侣空间",
    "toast.registerFail": "注册失败",
    "toast.checkinOk": "打卡成功",
    "toast.checkinFail": "打卡失败",
    "toast.saved": "已保存",
    "toast.saveFail": "保存失败",
    "toast.added": "已新增",
    "toast.addFail": "新增失败",
    "toast.updated": "已更新",
    "toast.updateFail": "更新失败",
    "toast.deleted": "已删除",
    "toast.deleteFail": "删除失败",
    "toast.todayRecorded": "今日已记录",
    "toast.recordFail": "记录失败",

    "confirm.logout.title": "退出登录",
    "confirm.logout.body": "确定要退出当前账号吗？",
    "confirm.logout.ok": "退出",

    "confirm.breakup.title": "解除绑定",
    "confirm.breakup.body": "是否结束这段关系？",
    "confirm.breakup.ok": "结束",
    "toast.breakupOk": "已解除情侣绑定",

    "ann.modal.create": "新增纪念日",
    "ann.modal.edit": "编辑纪念日",
    "ann.name": "纪念日名称",
    "ann.namePh": "例如：恋爱一周年",
    "ann.day": "日期",
    "ann.needName": "请填写纪念日名称",
    "ann.needDay": "请选择日期",
    "ann.deleteTitle": "删除纪念日",
    "ann.deleteBody": "确定删除「{name}」吗？",

    "post.switchToPhoto.title": "切换为图片？",
    "post.switchToPhoto.body": "当前已选择视频，切换会清空视频。",
    "post.switchToVideo.title": "切换为视频？",
    "post.switchToVideo.body": "当前已选择图片，切换会清空图片。",
    "post.switchOk": "切换",
    "post.maxPhotos": "最多选择 9 张照片",
    "post.needContent": "写点什么，或添加图片/视频",
    "post.published": "已发布",
    "post.publishFail": "发布失败",
    "post.gotLocation": "已获取位置",
    "post.gotCoords": "已获取坐标",
    "post.locDenied": "定位权限被拒绝，可手动输入位置",
    "post.locFail": "定位失败，可手动输入位置",
    "post.locFailMsg": "定位失败",
    "post.locPrompt": "输入位置（可选）",

    "album.justNow": "刚刚",
    "album.minutesAgo": "{min}分钟前",
    "album.hoursAgo": "{hr}小时前",
    "album.yesterday": "昨天",
    "album.prompt.1": "还记得第一次在那家咖啡店见面的下午吗？",
    "album.prompt.2": "今天最想把哪一刻存进回忆里？",
    "album.prompt.3": "如果把今天写成一句话，会是什么？",
    "album.prompt.4": "最近一次让你心动的瞬间是什么？",
    "album.you": "你",
    "album.partner": "TA",
    "album.deletePost": "删除帖子",
    "album.deletePostBody": "确定删除这条回忆吗？",
    "album.deleted": "已删除",
    "album.deleteFail": "删除失败",

    "invite.shareTitle": "情侣空间邀请",
    "invite.shareText": "快来加入我们的情侣空间吧～",
    "invite.shared": "已调起分享",
    "invite.copied": "链接已复制，可以发给 TA 了",
    "invite.copyFallback": "生成成功，请手动复制链接",
    "invite.fail": "生成邀请链接失败",

    "me.sinceYear": "自 {year} 年相恋",
    "me.metNote": "第一次遇见的那天",
    "me.loveNote": "我们约定永远的那天",
    "me.noData": "—",
    "me.daysUnit": "天",
    "me.remainingPrefix": "还剩",
    "me.remaining": "还剩 {days} 天",
    "me.milestoneDesc": "{next} · 距离{name}",
    "me.milestoneDescNoName": "{next} · {name}",
    "me.fileSelected": "已选择图片"
  },
  en: {
    "app.title": "Couple Space",
    "app.brand": "Our Sanctuary",
    "app.brandAuthor": "— Our Sanctuary",

    "nav.home": "Home",
    "nav.album": "Memories",
    "nav.me": "Me",
    "nav.post": "New Memory",
    "nav.invite": "Invite",

    "top.compose": "Post",

    "hint.title": "Open via a local server",
    "hint.desc": "You're opening this page via file://, so buttons may not work. Use one of the following:",
    "hint.opt1": "Option 1: Start the backend then open http://localhost:8000/",
    "hint.opt2": "Option 2: Run python3 -m http.server 5174 in frontend/ then open http://localhost:5174/",
    "hint.ok": "Got it",

    "login.welcomeTitle": "Welcome back",
    "login.welcomeDesc": "Enter your private space and keep writing our story.",
    "login.username": "Account / Phone",
    "login.usernamePh": "Enter account or phone",
    "login.password": "Password",
    "login.forgot": "Forgot?",
    "login.signIn": "Sign in",
    "login.or": "or",
    "login.signUp": "Create account",
    "login.footerQuote": "\"Love lives here, memories last forever.\"",

    "register.title": "Our Nest",
    "register.subtitle": "The Digital Keepsake",
    "register.nickname": "Nickname",
    "register.nicknamePh": "Your nickname",
    "register.gender": "Gender",
    "register.account": "Account / Phone",
    "register.accountPh": "Phone number",
    "register.setPassword": "Password",
    "register.setPasswordPh": "Enter password",
    "register.confirmPassword": "Confirm",
    "register.confirmPasswordPh": "Re-enter password",
    "register.submit": "Sign up",
    "register.backToLogin": "Have an account? Sign in",

    "invite.title": "Welcome to Couple Space!",
    "invite.subTitle": "Visible to only the two of you.",
    "invite.album": "Album",
    "invite.tree": "Love Tree",
    "invite.anniversary": "Anniversaries",
    "invite.action": "Invite my partner",
    "invite.shareLink": "Share link",
    "invite.guide": "Getting Started",
    "invite.privacy": "Your privacy matters. Chats and photos are protected with end‑to‑end encryption.",
    "guide.title": "Getting Started",
    "guide.section.how": "How it works",
    "guide.section.data": "Data & privacy",
    "guide.section.breakup": "End relationship",
    "guide.step.1": "Sign in: Use your account/phone and password to sign in.",
    "guide.step.2": "Create an invite: Go to the Invite page and tap “Invite my partner” to generate an invite link.",
    "guide.step.3": "Partner joins: Send the link to your partner. Opening it carries an invite parameter, and signing in/signing up will bind you to the same couple.",
    "guide.step.4": "Activated: When the couple has 2 members, the app automatically shows the Home view with shared content.",
    "guide.data.1": "Shared scope: profile, check‑ins, anniversaries, posts/memories, and album metadata are shared within the same couple.",
    "guide.data.2": "Only for you two: content is only shown to members of the same couple.",
    "guide.data.3": "Media: avatars/photos/videos are uploaded and served under /media.",
    "guide.breakup.1": "On the Me page, tap the heart between avatars to unbind. You’ll see a confirmation dialog.",
    "guide.breakup.2": "After unbinding, you’ll return to the Invite page and couple content won’t be shown until you bind again.",

    "home.sinceMet": "Since the day we met",
    "home.days": "Days",
    "home.dailyCheckin": "Daily Check‑in",
    "home.checkinToday": "Check‑in for Today",
    "home.checkedIn": "Checked In",
    "home.lastCheckin": "Last check‑in: {date}",
    "home.nextMilestone": "Next Milestone",
    "home.countdown": "Countdown",
    "home.daysLeft": "Days Left",
    "home.refresh": "Refresh",

    "album.topic": "Today's Topic",
    "album.empty": "No memories yet. Post the first one.",

    "post.thoughts": "Your thoughts...",
    "post.textPh": "Share your little moment...",
    "post.moment": "Capture the moment",
    "post.mediaHint": "Up to 9 photos or 1 video",
    "post.locationChoose": "Choose location",
    "post.locationLocating": "Locating...",
    "post.visibilityOnlyUs": "Only us",
    "post.tag.anniversary": "Anniversary",
    "post.tag.daily": "Daily",
    "post.publish": "Publish",
    "post.addPhoto": "Add photo",
    "post.addVideo": "Add video",

    "me.story": "Our Love Story",
    "me.firstMet": "First Met",
    "me.loveDay": "Anniversary",
    "me.milestones": "Upcoming Milestones",
    "me.milestoneImportant": "Important",
    "me.traces": "Love Traces",
    "me.checkinRecord": "Record today",
    "me.checkinDone": "Checked in",
    "me.editProfile": "Edit Profile",
    "me.corner": "A corner just for us",
    "me.yourNickname": "My name",
    "me.partnerNickname": "Partner",
    "me.spaceName": "Nest name",
    "me.yourNicknamePh": "Your name",
    "me.partnerNicknamePh": "Partner name",
    "me.spaceNamePh": "Name your nest",
    "me.yourGender": "My gender",
    "me.partnerGender": "Partner gender",
    "me.metDate": "Met on",
    "me.togetherDate": "Together since",
    "me.slogan": "Love manifesto",
    "me.sloganPh": "Write your manifesto",
    "me.visual": "Visuals",
    "me.spaceLogo": "Nest logo",
    "me.choose": "Choose",
    "me.unselected": "No file chosen",
    "me.yourAvatar": "My avatar",
    "me.partnerAvatar": "Partner avatar",
    "me.save": "Save",
    "me.manageAnn": "Manage Anniversaries",
    "me.importantAnn": "Important",
    "me.add": "Add",
    "me.annEmpty": "No anniversaries yet.",
    "me.logout": "Sign out",
    "me.edit": "Edit",
    "me.delete": "Delete",

    "gender.unset": "Not set",
    "gender.male": "Male",
    "gender.female": "Female",

    "modal.cancel": "Cancel",
    "modal.ok": "OK",
    "modal.save": "Save",
    "modal.confirmTitle": "Confirm",

    "toast.logout": "Signed out",
    "toast.loadFail": "Load failed",
    "toast.needUserPass": "Enter account and password",
    "toast.loginOk": "Signed in",
    "toast.loginFail": "Sign in failed",
    "toast.needUserPassRegister": "Enter account and password to sign up",
    "toast.passwordMismatch": "Passwords do not match",
    "toast.registerOk": "Welcome to Couple Space",
    "toast.registerFail": "Sign up failed",
    "toast.checkinOk": "Checked in",
    "toast.checkinFail": "Check‑in failed",
    "toast.saved": "Saved",
    "toast.saveFail": "Save failed",
    "toast.added": "Added",
    "toast.addFail": "Add failed",
    "toast.updated": "Updated",
    "toast.updateFail": "Update failed",
    "toast.deleted": "Deleted",
    "toast.deleteFail": "Delete failed",
    "toast.todayRecorded": "Recorded",
    "toast.recordFail": "Record failed",

    "confirm.logout.title": "Sign out",
    "confirm.logout.body": "Sign out of this account?",
    "confirm.logout.ok": "Sign out",

    "confirm.breakup.title": "Break up",
    "confirm.breakup.body": "End this relationship?",
    "confirm.breakup.ok": "End",
    "toast.breakupOk": "Relationship ended",

    "ann.modal.create": "New Anniversary",
    "ann.modal.edit": "Edit Anniversary",
    "ann.name": "Name",
    "ann.namePh": "e.g. First anniversary",
    "ann.day": "Date",
    "ann.needName": "Enter a name",
    "ann.needDay": "Choose a date",
    "ann.deleteTitle": "Delete Anniversary",
    "ann.deleteBody": "Delete \"{name}\"?",

    "post.switchToPhoto.title": "Switch to photos?",
    "post.switchToPhoto.body": "A video is selected. Switching will clear it.",
    "post.switchToVideo.title": "Switch to video?",
    "post.switchToVideo.body": "Photos are selected. Switching will clear them.",
    "post.switchOk": "Switch",
    "post.maxPhotos": "Up to 9 photos",
    "post.needContent": "Write something, or add photos/video",
    "post.published": "Published",
    "post.publishFail": "Publish failed",
    "post.gotLocation": "Location set",
    "post.gotCoords": "Coordinates set",
    "post.locDenied": "Location denied. You can type it manually.",
    "post.locFail": "Location failed. You can type it manually.",
    "post.locFailMsg": "Location failed",
    "post.locPrompt": "Enter location (optional)",

    "album.justNow": "Just now",
    "album.minutesAgo": "{min}m ago",
    "album.hoursAgo": "{hr}h ago",
    "album.yesterday": "Yesterday",
    "album.prompt.1": "Do you remember that afternoon in the first café we met?",
    "album.prompt.2": "Which moment today do you want to keep as a memory?",
    "album.prompt.3": "If today were one sentence, what would it be?",
    "album.prompt.4": "What was your most heart‑fluttering moment lately?",
    "album.you": "You",
    "album.partner": "Partner",
    "album.deletePost": "Delete post",
    "album.deletePostBody": "Delete this memory?",
    "album.deleted": "Deleted",
    "album.deleteFail": "Delete failed",

    "invite.shareTitle": "Couple Space Invite",
    "invite.shareText": "Join our couple space ✨",
    "invite.shared": "Share opened",
    "invite.copied": "Link copied. Send it to your partner.",
    "invite.copyFallback": "Created. Please copy the link manually.",
    "invite.fail": "Failed to create invite link",

    "me.sinceYear": "In love since {year}",
    "me.metNote": "The day we first met",
    "me.loveNote": "The day we promised forever",
    "me.noData": "—",
    "me.daysUnit": "days",
    "me.remainingPrefix": "Left",
    "me.remaining": "{days} days left",
    "me.milestoneDesc": "{next} · until {name}",
    "me.milestoneDescNoName": "{next} · {name}",
    "me.fileSelected": "File selected"
  }
}

let current = "zh"
const listeners = new Set()

function normalizeLocale(v) {
  const raw = String(v || "").trim().toLowerCase()
  if (!raw) return ""
  if (raw.startsWith("zh")) return "zh"
  if (raw.startsWith("en")) return "en"
  return ""
}

export function getLocale() {
  return current
}

export function getIntlLocale() {
  return current === "en" ? "en-US" : "zh-CN"
}

export function t(key, vars = {}) {
  const k = String(key || "")
  const dict = MESSAGES[current] || MESSAGES.zh
  let out = dict[k]
  if (out == null) out = (MESSAGES.zh || {})[k]
  if (out == null) return k
  out = String(out)
  for (const [vk, vv] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${vk}}`, String(vv))
  }
  return out
}

export function onLocaleChange(fn) {
  if (typeof fn !== "function") return () => {}
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setLocale(next) {
  const n = normalizeLocale(next)
  if (!SUPPORTED.includes(n)) return
  if (n === current) return
  current = n
  localeStore.set(current)
  const html = document.documentElement
  if (html) html.setAttribute("lang", current === "en" ? "en" : "zh-CN")
  for (const fn of listeners) {
    try {
      fn(current)
    } catch {}
  }
  applyStaticI18n()
}

export function initI18n() {
  const stored = normalizeLocale(localeStore.get())
  const navLang = normalizeLocale(navigator.language || "")
  current = SUPPORTED.includes(stored) ? stored : SUPPORTED.includes(navLang) ? navLang : "zh"
  localeStore.set(current)
  const html = document.documentElement
  if (html) html.setAttribute("lang", current === "en" ? "en" : "zh-CN")
  bindLanguageToggles()
  applyStaticI18n()
}

export function toggleLocale() {
  setLocale(current === "en" ? "zh" : "en")
}

export function bindLanguageToggles(root = document) {
  const nodes = root?.querySelectorAll?.("[data-lang-toggle]") || []
  for (const el of nodes) {
    if (el.dataset.boundLangToggle === "1") continue
    el.dataset.boundLangToggle = "1"
    el.addEventListener("click", (e) => {
      e.preventDefault()
      toggleLocale()
    })
  }
}

function setText(selector, key) {
  const el = document.querySelector(selector)
  if (!el) return
  el.textContent = t(key)
}

function setPlaceholder(selector, key) {
  const el = document.querySelector(selector)
  if (!el) return
  el.setAttribute("placeholder", t(key))
}

function setAttr(selector, attr, key) {
  const el = document.querySelector(selector)
  if (!el) return
  el.setAttribute(attr, t(key))
}

function renderGuideBody() {
  const root = document.getElementById("guideModalBody")
  if (!root) return
  root.innerHTML = ""

  const makeTitle = (key) => {
    const p = document.createElement("p")
    p.className = "font-headline text-primary font-bold"
    p.textContent = t(key)
    return p
  }

  const makeList = (keys) => {
    const ul = document.createElement("ul")
    ul.className = "list-disc pl-5 space-y-2"
    for (const k of keys) {
      const li = document.createElement("li")
      li.textContent = t(k)
      ul.appendChild(li)
    }
    return ul
  }

  root.appendChild(makeTitle("guide.section.how"))
  root.appendChild(makeList(["guide.step.1", "guide.step.2", "guide.step.3", "guide.step.4"]))
  root.appendChild(makeTitle("guide.section.data"))
  root.appendChild(makeList(["guide.data.1", "guide.data.2", "guide.data.3"]))
  root.appendChild(makeTitle("guide.section.breakup"))
  root.appendChild(makeList(["guide.breakup.1", "guide.breakup.2"]))
}

export function applyStaticI18n() {
  document.title = t("app.title")

  const tabHomeLabel = document.querySelector("#tab-home span:last-child")
  if (tabHomeLabel) tabHomeLabel.textContent = t("nav.home")
  const tabAlbumLabel = document.querySelector("#tab-album span:last-child")
  if (tabAlbumLabel) tabAlbumLabel.textContent = t("nav.album")
  const tabMeLabel = document.querySelector("#tab-me span:last-child")
  if (tabMeLabel) tabMeLabel.textContent = t("nav.me")

  const composeLabel = document.querySelector("#composeBtn span:last-child")
  if (composeLabel) composeLabel.textContent = t("top.compose")

  setText("#fileHintTitle", "hint.title")
  setText("#fileHintDesc", "hint.desc")
  setText("#fileHintOpt1", "hint.opt1")
  setText("#fileHintOpt2", "hint.opt2")
  setText("#fileHintOk", "hint.ok")

  setText("#modalCancel", "modal.cancel")
  setText("#modalOk", "modal.ok")
  setText("#anniversaryModalCancel", "modal.cancel")
  setText("#anniversaryModalOk", "modal.save")

  setText("#anniversaryModalTitle", "ann.modal.create")
  setText("#anniversaryNameLabel", "ann.name")
  setPlaceholder("#anniversaryNameInput", "ann.namePh")
  setText("#anniversaryDayLabel", "ann.day")
  setText("#authLoginPanel header h1", "login.welcomeTitle")
  setText("#authLoginPanel header p", "login.welcomeDesc")
  setText("#authLoginPanel label[for='authUsername']", "login.username")
  setPlaceholder("#authUsername", "login.usernamePh")
  setText("#authLoginPanel label[for='authPassword']", "login.password")
  setText("#authLoginPanel a[href='javascript:void(0)']", "login.forgot")
  setAttr("#togglePasswordBtn", "aria-label", current === "en" ? "Toggle password visibility" : "显示/隐藏密码")
  setText("#loginBtn", "login.signIn")
  setText("#authLoginPanel .relative.my-8 span", "login.or")
  setText("#registerBtn", "login.signUp")
  setText("#authLoginPanel footer p", "login.footerQuote")

  setText("#authRegisterPanel header h2", "register.title")
  setText("#authRegisterPanel header p", "register.subtitle")
  setText("#authRegisterPanel label[for='regNickname']", "register.nickname")
  setPlaceholder("#regNickname", "register.nicknamePh")
  setText("#authRegisterPanel label[for='regUsername']", "register.account")
  setPlaceholder("#regUsername", "register.accountPh")
  setText("#authRegisterPanel label[for='regGender']", "register.gender")
  setText("#authRegisterPanel label[for='regPassword']", "register.setPassword")
  setPlaceholder("#regPassword", "register.setPasswordPh")
  setText("#authRegisterPanel label[for='regPassword2']", "register.confirmPassword")
  setPlaceholder("#regPassword2", "register.confirmPasswordPh")
  setText("#registerSubmitBtn", "register.submit")
  setText("#backToLoginBtn", "register.backToLogin")

  const inviteTitle = document.querySelector("#view-invite main .text-center h2")
  if (inviteTitle) {
    inviteTitle.innerHTML = current === "en" ? t("invite.title") : `Hello! <br />${t("invite.title")}`
  }
  setText("#view-invite main .text-center p", "invite.subTitle")
  setText("#inviteFeatureAlbum", "invite.album")
  setText("#inviteFeatureTree", "invite.tree")
  setText("#inviteFeatureAnniversary", "invite.anniversary")
  const inviteBtnLabel = document.querySelector("#inviteShareBtn span.font-bold")
  if (inviteBtnLabel) inviteBtnLabel.textContent = t("invite.action")
  setText("#inviteShareTitle", "invite.shareLink")
  setText("#inviteGuideTitle", "invite.guide")
  setText("#inviteGuideBody", "invite.privacy")

  setText("#guideModalTitle", "guide.title")
  renderGuideBody()

  setText("#homeSinceLabel", "home.sinceMet")
  setText("#homeDaysUnit", "home.days")
  setText("#homeCheckinTitle", "home.dailyCheckin")
  setText("#homeStreakUnit", "home.days")
  setText("#homeTotalUnit", "home.days")
  setText("#nextQuoteBtnText", "home.refresh")
  setText("#homeMilestoneTitle", "home.nextMilestone")
  setText("#homeMilestoneCountdown", "home.countdown")
  setText("#homeMilestoneDaysLeftUnit", "home.daysLeft")

  setText("#albumTopicTitle", "album.topic")
  setText("#postFeedEmpty", "album.empty")

  setText("#postHeaderTitle", "nav.post")
  setText("#postThoughtsLabel", "post.thoughts")
  setPlaceholder("#postContentInput", "post.textPh")
  setText("#postMomentTitle", "post.moment")
  setText("#postMediaHint", "post.mediaHint")
  setText("#postLocationText", "post.locationChoose")
  setText("#postVisibilityOnlyUs", "post.visibilityOnlyUs")
  setText("#postTagAnniversary", "post.tag.anniversary")
  setText("#postTagDaily", "post.tag.daily")
  setText("#postPublishBtnText", "post.publish")

  setText("#meStoryTitle", "me.story")
  setText("#meFirstMetLabel", "me.firstMet")
  setText("#meLoveDayLabel", "me.loveDay")
  setText("#meMilestonesTitle", "me.milestones")
  setText("#meMilestoneImportantLabel", "me.milestoneImportant")
  setText("#meTracesTitle", "me.traces")
  setText("#milestonePrimaryDaysUnit", "me.daysUnit")
  setText("#milestoneSecondaryPrefix", "me.remainingPrefix")
  setText("#milestoneSecondaryDaysUnit", "me.daysUnit")
  setText("#meEditProfileSummary", "me.editProfile")
  setText("#meCornerText", "me.corner")
  setText("#view-me label[for='inputYourNickname']", "me.yourNickname")
  setPlaceholder("#inputYourNickname", "me.yourNicknamePh")
  setText("#view-me label[for='inputPartnerNickname']", "me.partnerNickname")
  setPlaceholder("#inputPartnerNickname", "me.partnerNicknamePh")
  setText("#view-me label[for='inputSpaceName']", "me.spaceName")
  setPlaceholder("#inputSpaceName", "me.spaceNamePh")
  setText("#view-me label[for='inputYourGender']", "me.yourGender")
  setText("#view-me label[for='inputPartnerGender']", "me.partnerGender")
  setText("#view-me label[for='inputMetDate']", "me.metDate")
  setText("#view-me label[for='inputTogetherDate']", "me.togetherDate")
  setText("#view-me label[for='inputSlogan']", "me.slogan")
  setPlaceholder("#inputSlogan", "me.sloganPh")
  setText("#meVisualTitle", "me.visual")
  setText("#saveProfileBtnText", "me.save")
  setText("#meManageAnnSummary", "me.manageAnn")
  setText("#meImportantAnnLabel", "me.importantAnn")
  setText("#addAnniversaryBtnText", "me.add")
  setText("#anniversaryEmpty", "me.annEmpty")
  setText("#meLogoutBtnText", "me.logout")
}
