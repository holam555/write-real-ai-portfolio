export type Locale = "zh" | "en"

type Translations = Record<string, { zh: string; en: string }>

export const translations: Translations = {
  // ===== Common =====
  appName: {
    zh: "WriteReal AI",
    en: "WriteReal AI",
  },
  login: {
    zh: "登入",
    en: "Log In",
  },
  signup: {
    zh: "註冊",
    en: "Sign Up",
  },
  freeTrial: {
    zh: "立即開始",
    en: "Get Started",
  },
  email: {
    zh: "電子郵件",
    en: "Email",
  },
  emailPlaceholder: {
    zh: "you@example.com",
    en: "you@example.com",
  },
  sending: {
    zh: "發送中...",
    en: "Sending...",
  },
  sendMagicLink: {
    zh: "發送登入連結",
    en: "Send Login Link",
  },
  useOtherEmail: {
    zh: "使用其他信箱",
    en: "Use another email",
  },
  magicLinkSent: {
    zh: "登入連結已發送！",
    en: "Login link sent!",
  },
  errorGeneric: {
    zh: "發生錯誤，請稍後再試。",
    en: "An error occurred. Please try again later.",
  },
  errorNetwork: {
    zh: "網路錯誤，請檢查連線後再試。",
    en: "Network error. Please check your connection and try again.",
  },
  backToDashboard: {
    zh: "返回",
    en: "Back",
  },
  settings: {
    zh: "設定",
    en: "Settings",
  },
  loading: {
    zh: "載入中...",
    en: "Loading...",
  },
  words: {
    zh: "字",
    en: "words",
  },

  // ===== Landing Page =====
  heroTitle1: {
    zh: "用 AI 輔助寫完報告",
    en: "Write Essays with AI Help",
  },
  heroTitle2: {
    zh: "卻怕被檢測是 AI？",
    en: "Worried About AI Detection?",
  },
  heroSubtitle: {
    zh: "降低 AI 檢測率，安心交出你的報告",
    en: "Paste your draft, reduce AI detection, submit with confidence.",
  },
  heroButton: {
    zh: "立即開始",
    en: "Get Started",
  },
  heroNote: {
    zh: "Beta 測試中，現正開放免費名額",
    en: "Beta testing — free slots available now",
  },
  howItWorksTitle: {
    zh: "怎麼用",
    en: "How It Works",
  },
  step1Title: {
    zh: "貼上文章",
    en: "Paste Your Essay",
  },
  step1Desc: {
    zh: "把你用 AI 輔助完成的初稿貼進來",
    en: "Paste your AI-assisted draft here.",
  },
  step2Title: {
    zh: "選風格",
    en: "Choose a Style",
  },
  step2Desc: {
    zh: "用預設風格直接改，或者上傳一篇你喜歡的範文，讓 AI 按照風格改寫。",
    en: "Use the default style, or upload a sample essay for AI to match that style.",
  },
  step3Title: {
    zh: "複製並檢測",
    en: "Copy & Check",
  },
  step3Desc: {
    zh: "改完直接複製，再去 AI 檢測器確認效果。",
    en: "Copy the result and run it through an AI detector to confirm the effect.",
  },
  featuresTitle: {
    zh: "兩種改寫方式",
    en: "Two Rewrite Modes",
  },
  defaultStyleTitle: {
    zh: "預設風格",
    en: "Default Style",
  },
  defaultStyleDesc: {
    zh: "直接改寫，不需要任何設定。偏直白簡潔，追求真人自然感。",
    en: "Rewrite instantly with no setup needed. Clean and direct.",
  },
  defaultStyleDesc1: {
    zh: "直接改寫，不需要任何設定。",
    en: "Rewrite instantly with no setup needed.",
  },
  defaultStyleDesc2: {
    zh: "偏直白簡潔，追求真人自然感。",
    en: "Clean and direct.",
  },
  defaultStyleFeature1: {
    zh: "一鍵改寫",
    en: "One-click rewrite",
  },
  defaultStyleFeature2: {
    zh: "無需設定",
    en: "No setup needed",
  },
  defaultStyleFeature3: {
    zh: "適合所有文章",
    en: "Works for all essays",
  },
  personalStyleTitle: {
    zh: "個人風格模仿",
    en: "Personal Style Clone",
  },
  personalStyleDesc: {
    zh: "上傳你自己以前寫的文章，或從範文網站找一篇風格合適的文章，AI 會學那個寫法來改寫。",
    en: "Upload your own essay or a sample you like — AI will learn that style and rewrite accordingly.",
  },
  personalStyleFeature1: {
    zh: "模仿指定寫作風格",
    en: "Mimics a chosen writing style",
  },
  personalStyleFeature2: {
    zh: "風格更多樣化",
    en: "More varied results",
  },
  personalStyleFeature3: {
    zh: "結果更像你本人寫的",
    en: "Results sound like you wrote them",
  },
  ivyPandaNotePre: {
    zh: "可以貼自己的文章或者在",
    en: "Paste your own essay, or find samples at ",
  },
  ivyPandaLinkText: {
    zh: "這個網站",
    en: "this website",
  },
  ivyPandaNotePost: {
    zh: "找範文。效果好壞取決於範文質量，建議多試幾篇比較。",
    en: ". Quality varies: try a few samples to compare.",
  },
  noticeTitle: {
    zh: "📌 使用前請留意",
    en: "📌 Before You Start",
  },
  noticeDesc1: {
    zh: "適合學術寫作（中學至大學程度）、已經有引用的文章、以 AI 輔助完成的初稿。",
    en: "Best for academic writing (secondary to university level), essays with citations, and AI-assisted drafts.",
  },
  noticeDesc2: {
    zh: "免費試用名額有限，因為每次改寫均需 API 費用，如需更多次數，歡迎訂閱升級。",
    en: "Free trial slots are limited — each rewrite costs compute. Upgrade for more.",
  },

  // ===== Signup Page =====
  signupTitle: {
    zh: "建立帳號",
    en: "Create Account",
  },
  signupSubtitle: {
    zh: "註冊即可獲得 3 次免費改寫額度",
    en: "Sign up to get 3 free rewrites",
  },
  signupCheckEmail: {
    zh: "的信箱，點擊連結完成註冊。",
    en: "inbox and click the link to complete registration.",
  },
  signupEmailConfirmNote: {
    zh: "請前往你的信箱，點擊確認連結完成註冊。",
    en: "Please check your inbox and click the confirmation link to complete registration.",
  },
  signupGoTo: {
    zh: "請前往",
    en: "Please check your",
  },
  hasAccount: {
    zh: "已有帳號？",
    en: "Already have an account?",
  },
  errorDisposableEmail: {
    zh: "不支援臨時信箱，請使用正式的電子郵件地址。",
    en: "Disposable emails are not supported. Please use a valid email address.",
  },
  errorTrialFull: {
    zh: "免費試用名額已滿，請加入等候名單。",
    en: "Free trial slots are full. Please join the waitlist.",
  },
  errorRateLimit: {
    zh: "請求次數過多，請稍後再試。",
    en: "Too many requests. Please try again later.",
  },

  // ===== Login Page =====
  loginTitle: {
    zh: "登入",
    en: "Log In",
  },
  loginSubtitle: {
    zh: "使用電子郵件登入您的帳號",
    en: "Sign in to your account with email",
  },
  loginCheckEmail: {
    zh: "的信箱，點擊連結登入。",
    en: "inbox and click the link to log in.",
  },
  loginGoTo: {
    zh: "請前往",
    en: "Please check your",
  },
  noAccount: {
    zh: "還沒有帳號？",
    en: "Don't have an account?",
  },
  errorAccountNotFound: {
    zh: "找不到此帳號，請先註冊。",
    en: "Account not found. Please sign up first.",
  },
  errorEmailAlreadyRegistered: {
    zh: "此電子郵件已註冊，請直接登入。",
    en: "This email is already registered. Please log in instead.",
  },

  // ===== Dashboard =====
  dashboardTitle: {
    zh: "改寫文章",
    en: "Rewrite Essay",
  },
  usesRemaining: {
    zh: "次免費試用",
    en: "free uses left",
  },
  usesRemainingPrefix: {
    zh: "剩餘",
    en: "",
  },
  modeDefault: {
    zh: "預設風格",
    en: "Default Style",
  },
  modePersonal: {
    zh: "個人風格模仿",
    en: "Personal Style Clone",
  },
  presetLabel: {
    zh: "選擇改寫風格",
    en: "Choose rewrite style",
  },
  preset1Name: {
    zh: "預設風格",
    en: "Default Style",
  },
  preset1Desc: {
    zh: "精簡有力、自然流暢",
    en: "Concise, natural and fluent",
  },
  preset2Name: {
    zh: "自然口語",
    en: "Natural & Casual",
  },
  preset2Desc: {
    zh: "輕鬆、自然、像真人對話的風格",
    en: "Relaxed, human-sounding conversational tone",
  },
  preset3Name: {
    zh: "精簡有力",
    en: "Concise & Direct",
  },
  preset3Desc: {
    zh: "簡潔、直接、去除多餘詞彙",
    en: "Tight, sharp writing with no fluff",
  },
  noStyleWarning: {
    zh: "您尚未設定個人寫作風格。請先",
    en: "You haven't set up your personal writing style yet. Please",
  },
  noStyleLink: {
    zh: "前往風格設定",
    en: "go to style setup",
  },
  noStyleSuffix: {
    zh: "頁面進行分析。",
    en: "page first.",
  },
  essayLabel: {
    zh: "貼上你要改寫的文章",
    en: "Paste the essay you want to rewrite",
  },
  essayPlaceholder: {
    zh: "在此貼上你的文章...",
    en: "Paste your essay here...",
  },
  overLimitError: {
    zh: "字限制，請縮短後再試。",
    en: "word limit. Please shorten and try again.",
  },
  overLimitPrefix: {
    zh: "文章超過",
    en: "Essay exceeds the",
  },
  rewriting: {
    zh: "正在改寫中，請稍候...",
    en: "Rewriting, please wait...",
  },
  rewriteButton: {
    zh: "改寫文章",
    en: "Rewrite Essay",
  },
  usesExhausted: {
    zh: "免費試用次數已用完。",
    en: "Free trial uses are exhausted.",
  },
  resultTitle: {
    zh: "改寫結果",
    en: "Rewritten Essay",
  },
  copied: {
    zh: "已複製！",
    en: "Copied!",
  },
  copyButton: {
    zh: "複製文章",
    en: "Copy Essay",
  },

  // ===== Dashboard — Tier-aware =====
  upgradePlan: {
    zh: "升級方案",
    en: "Upgrade",
  },
  freeTrialExhaustedBanner: {
    zh: "免費試用已用盡，升級即可繼續使用 →",
    en: "Free trial exhausted. Upgrade to continue →",
  },
  paidWordsExhaustedBanner: {
    zh: "本月字數已用盡，下次續費後自動重置",
    en: "Monthly word limit reached. Resets on next billing cycle.",
  },
  paidWordsRemaining: {
    zh: "字",
    en: "words left",
  },
  paidWordsRemainingPrefix: {
    zh: "剩餘",
    en: "",
  },
  // DEPRECATED: dashboard now renders the denominator from the
  // user's actual monthly_quota. Kept as a plain unit suffix for any
  // legacy reference.
  paidWordsTotalSuffix: {
    zh: "字",
    en: "words",
  },

  // ===== Style Setup =====
  styleSetupTitle: {
    zh: "個人風格設定",
    en: "Personal Style Setup",
  },
  styleSetupDesc: {
    zh: "貼上你之前寫的文章，AI 會分析你的寫作風格。分析不會扣除使用次數。",
    en: "Paste an essay you wrote before. AI will analyze your writing style. Analysis doesn't count as a use.",
  },
  existingStyleTitle: {
    zh: "已有儲存的個人風格",
    en: "Personal style already saved",
  },
  existingStyleDesc: {
    zh: "你可以重新上傳範文來更新你的風格。",
    en: "You can re-upload a sample essay to update your style.",
  },
  styleAnalysisComplete: {
    zh: "風格分析完成！你現在可以使用「個人風格模仿」模式來改寫文章了。",
    en: "Style analysis complete! You can now use the \"Personal Style Clone\" mode to rewrite essays.",
  },
  goToRewrite: {
    zh: "前往改寫文章",
    en: "Go to Rewrite Essay",
  },
  sampleEssayLabel: {
    zh: "貼上你過去寫的範文",
    en: "Paste a sample essay you wrote",
  },
  sampleEssayPlaceholder: {
    zh: "在此貼上你之前寫的文章...",
    en: "Paste an essay you wrote before here...",
  },
  analyzingStyle: {
    zh: "正在分析你的寫作風格，請稍候...",
    en: "Analyzing your writing style, please wait...",
  },
  updateStyle: {
    zh: "更新風格",
    en: "Update Style",
  },
  analyzeStyle: {
    zh: "分析我的風格",
    en: "Analyze My Style",
  },

  // ===== Settings =====
  settingsTitle: {
    zh: "帳號設定",
    en: "Account Settings",
  },
  settingsEmail: {
    zh: "電子郵件",
    en: "Email",
  },
  personalStyle: {
    zh: "個人寫作風格",
    en: "Personal Writing Style",
  },
  clearing: {
    zh: "清除中...",
    en: "Clearing...",
  },
  clearStyle: {
    zh: "清除個人風格",
    en: "Clear Personal Style",
  },
  noStyleYet: {
    zh: "尚未設定個人風格。",
    en: "No personal style set yet.",
  },
  goToSetup: {
    zh: "前往設定",
    en: "Go to Setup",
  },
  loggingOut: {
    zh: "登出中...",
    en: "Logging out...",
  },
  logout: {
    zh: "登出",
    en: "Log Out",
  },

  // ===== Waitlist Page =====
  waitlistTitle: {
    zh: "免費試用名額已滿！",
    en: "Free Trial Slots Are Full!",
  },
  waitlistSubtitle: {
    zh: "目前免費試用名額已經額滿。請留下你的電郵，我們會在有新名額或正式版上線時第一時間通知你。",
    en: "Free trial slots are currently full. Leave your email and we'll notify you when new slots open or when we officially launch.",
  },
  waitlistButton: {
    zh: "通知我",
    en: "Notify Me",
  },
  waitlistSubmitting: {
    zh: "提交中...",
    en: "Submitting...",
  },
  waitlistSuccess: {
    zh: "已收到！我們會盡快通知你 🎉",
    en: "Got it! We'll notify you soon 🎉",
  },
  waitlistDuplicate: {
    zh: "你已經登記過了，我們會通知你！",
    en: "You're already on the list. We'll notify you!",
  },

  // ===== Billing Page =====
  billingTitle: {
    zh: "方案與帳單",
    en: "Plan & Billing",
  },
  billingFreeTrial: {
    zh: "你目前使用免費試用方案",
    en: "You are currently on the free trial plan",
  },
  billingFreeRemaining: {
    zh: "次免費改寫",
    en: "free rewrites remaining",
  },
  billingFreeRemainingPrefix: {
    zh: "剩餘",
    en: "",
  },
  billingUpgradeTitle: {
    zh: "升級方案",
    en: "Upgrade Plan",
  },
  billingPrice: {
    zh: "US$3.99 / 月",
    en: "US$3.99 / month",
  },
  billingFeature1: {
    zh: "每月 20,000 字",
    en: "20,000 words per month",
  },
  billingFeature2: {
    zh: "無限次改寫",
    en: "Unlimited rewrites",
  },
  billingFeature3: {
    zh: "隨時取消",
    en: "Cancel anytime",
  },
  billingUpgradeButton: {
    zh: "立即升級",
    en: "Upgrade Now",
  },
  billingEarlyBird: {
    zh: "Beta 優惠價，隨時可取消",
    en: "Beta pricing. Cancel anytime.",
  },
  billingPaidPlan: {
    zh: "你目前使用付費方案 US$3.99/月",
    en: "You are on the paid plan at US$3.99/month",
  },
  billingWordsRemaining: {
    zh: "字",
    en: "words remaining",
  },
  billingWordsRemainingPrefix: {
    zh: "剩餘",
    en: "",
  },
  billingNextRenewal: {
    zh: "下次續費日：",
    en: "Next renewal: ",
  },
  billingManage: {
    zh: "管理訂閱",
    en: "Manage Subscription",
  },
  billing: {
    zh: "帳單",
    en: "Billing",
  },
  authTabPassword: {
    zh: "密碼登入",
    en: "Password",
  },
  authTabMagicLink: {
    zh: "一次性連結",
    en: "Magic Link",
  },

  // ===== Password fields =====
  password: {
    zh: "密碼",
    en: "Password",
  },
  passwordPlaceholder: {
    zh: "請輸入密碼（至少 6 位）",
    en: "Enter password (min. 6 characters)",
  },
  confirmPassword: {
    zh: "確認密碼",
    en: "Confirm Password",
  },
  confirmPasswordPlaceholder: {
    zh: "再次輸入密碼",
    en: "Re-enter your password",
  },
  errorPasswordTooShort: {
    zh: "密碼至少需要 6 個字元。",
    en: "Password must be at least 6 characters.",
  },
  errorPasswordMismatch: {
    zh: "兩次輸入的密碼不一致。",
    en: "Passwords do not match.",
  },
  errorWrongCredentials: {
    zh: "電子郵件或密碼錯誤，請再試一次。",
    en: "Incorrect email or password. Please try again.",
  },
  forgotPassword: {
    zh: "忘記密碼？",
    en: "Forgot password?",
  },
  resetPasswordButton: {
    zh: "發送重設連結",
    en: "Send Reset Link",
  },
  resetPasswordSent: {
    zh: "重設連結已發送，請前往信箱查看。",
    en: "Reset link sent. Please check your inbox.",
  },
  resetPasswordTitle: {
    zh: "設定新密碼",
    en: "Set New Password",
  },
  resetPasswordNewLabel: {
    zh: "新密碼",
    en: "New Password",
  },
  resetPasswordSubmit: {
    zh: "更新密碼",
    en: "Update Password",
  },
  resetPasswordSuccess: {
    zh: "密碼已更新，正在跳轉到儀表板⋯",
    en: "Password updated. Redirecting to dashboard…",
  },
  resetPasswordInvalidLink: {
    zh: "連結已失效，請重新申請重設密碼。",
    en: "This link has expired. Please request a new password reset.",
  },

  // ===== Guest Trial (Landing Page) =====
  guestTryTitle: {
    zh: "立即試用",
    en: "Try It Now",
  },
  guestNoticeTitle: {
    zh: "📌 使用前請留意",
    en: "📌 Before You Start",
  },
  guestNotice1: {
    zh: "適合大學報告（APA / MLA / Chicago 格式）",
    en: "Best for university reports (APA / MLA / Chicago format)",
  },
  guestNotice2: {
    zh: "貼上你的初稿，AI 會幫你改寫成更自然的語氣",
    en: "Paste your draft, AI will rewrite it in a more natural tone",
  },
  guestPersonalLocked: {
    zh: "個人風格模仿需要登入後使用。免費註冊即可體驗 🎯",
    en: "Personal style clone requires login. Sign up free to try 🎯",
  },
  guestSignupBanner1: {
    zh: "想要更多次數？免費註冊即可獲得改寫機會 🎉",
    en: "Want more? Sign up free to get rewrites 🎉",
  },
  guestSignupBanner2: {
    zh: "還可以使用個人風格模仿功能，讓改寫效果更貼近你的風格。",
    en: "You can also use personal style cloning for better results.",
  },
  guestSignupButton: {
    zh: "免費註冊",
    en: "Sign Up Free",
  },
  guestLoginLink: {
    zh: "已有帳號？登入",
    en: "Already have an account? Log in",
  },
  guestModalTitle: {
    zh: "登入後即可改寫",
    en: "Login to Rewrite",
  },
  guestModalBody1: {
    zh: "免費註冊，即可獲得改寫機會。",
    en: "Sign up free to get rewrites.",
  },
  guestModalBody2: {
    zh: "還可以使用個人風格模仿功能 🎯",
    en: "Plus unlock personal style cloning 🎯",
  },
  guestModalBody3: {
    zh: "",
    en: "",
  },
}
