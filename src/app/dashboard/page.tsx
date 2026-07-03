"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { countWords, detectLanguage, MAX_WORDS, MAX_WORDS_PAID } from "@/lib/word-count"
import { useLanguage } from "@/lib/i18n/context"
import { UpgradeModal } from "@/components/upgrade-modal"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import Link from "next/link"

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
  </svg>
)

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
)

type Mode = "default" | "personal"
type Language = "english" | "chinese"

const NOTICE_KEY = "dashboard_notice_collapsed"
const REWRITE_COUNT_KEY = "dashboard_rewrite_count"
const MODAL_SHOWN_KEY = "dashboard_modal_session_shown"

const DETECTORS = [
  { name: "SciSpace", url: "https://scispace.com/?via=study" },
  { name: "Quillbot", url: "https://try.quillbot.com/Study-plze2k971zgu" },
  { name: "ZeroGPT", url: "https://zerogpt.com" },
  { name: "GPTZero", url: "https://gptzero.app/zh/detector" },
]

export default function DashboardPage() {
  const [essay, setEssay] = useState("")
  const [result, setResult] = useState("")
  const [mode, setMode] = useState<Mode>("default")
  const [language, setLanguage] = useState<Language>("english")
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null)
  const [wordsRemaining, setWordsRemaining] = useState<number | null>(null)
  const [monthlyQuota, setMonthlyQuota] = useState<number>(20000)
  const [tier, setTier] = useState<string>("free_trial")
  const [hasPersonalStyle, setHasPersonalStyle] = useState<boolean>(false)
  const [styleLanguage, setStyleLanguage] = useState<"english" | "chinese" | null>(null)
  const [styleLimitReached, setStyleLimitReached] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resultKey, setResultKey] = useState(0)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")

  // Notice collapsed state (persisted to localStorage, default: expanded)
  const [noticeCollapsed, setNoticeCollapsed] = useState(false)

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalSubmitted, setModalSubmitted] = useState(false)
  const [detector, setDetector] = useState("")
  const [detectionPct, setDetectionPct] = useState("")
  const [detectionNotes, setDetectionNotes] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)

  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const verifiedRef = useRef(false)

  const supabase = createClient()
  const isPaid = tier === "paid"
  const wordLimit = isPaid ? MAX_WORDS_PAID : MAX_WORDS
  const wordCount = countWords(essay, language)
  const isOverLimit = wordCount > wordLimit
  const isNearLimit = !isOverLimit && wordCount > wordLimit * 0.8

  const canSubmit = (() => {
    if (loading || isOverLimit || wordCount === 0) return false
    if (mode === "personal" && !hasPersonalStyle) return false
    if (isPaid) {
      return (wordsRemaining ?? 0) >= wordCount
    }
    return (usesRemaining ?? 0) > 0
  })()

  // Load notice collapsed state from localStorage (default: expanded)
  useEffect(() => {
    const saved = localStorage.getItem(NOTICE_KEY)
    if (saved === "true") setNoticeCollapsed(true)
    else setNoticeCollapsed(false) // expanded by default
  }, [])

  function toggleNotice() {
    const next = !noticeCollapsed
    setNoticeCollapsed(next)
    localStorage.setItem(NOTICE_KEY, next ? "true" : "false")
  }

  const fetchUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUserEmail(user.email || "")

    // Fetch user data via API (uses adminSupabase to bypass RLS)
    const res = await fetch("/api/user-data")
    if (res.ok) {
      const userData = await res.json()
      setUsesRemaining(userData.uses_remaining)
      setTier(userData.tier)
      setWordsRemaining(userData.words_remaining)
      setMonthlyQuota(userData.monthly_quota ?? 20000)
    }

    // Fetch style data via API (never exposes custom_prompt)
    const styleRes = await fetch("/api/style-data")
    if (styleRes.ok) {
      const sd = await styleRes.json()
      setHasPersonalStyle(sd.has_style)
      setStyleLimitReached(sd.remaining_count <= 0)
      setStyleLanguage(sd.style_language ?? null)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Verify payment when redirected back from Stripe
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    const upgraded = searchParams.get("upgraded")
    if (!sessionId || !upgraded || verifiedRef.current) return
    verifiedRef.current = true

    fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchUserData()
          window.history.replaceState({}, "", "/dashboard")
        }
      })
      .catch(console.error)
  }, [searchParams, fetchUserData])

  // Decide whether to show modal after a rewrite
  function maybeShowModal() {
    // Only show once per browser session (tab)
    const sessionShown = sessionStorage.getItem(MODAL_SHOWN_KEY)
    if (sessionShown === "true") return

    // Show once every 3 rewrites
    const count = parseInt(localStorage.getItem(REWRITE_COUNT_KEY) || "0", 10) + 1
    localStorage.setItem(REWRITE_COUNT_KEY, String(count))
    if (count % 3 === 1) {
      // 1st, 4th, 7th... rewrite
      setShowModal(true)
      setModalSubmitted(false)
      setDetector("")
      setDetectionPct("")
      setDetectionNotes("")
      sessionStorage.setItem(MODAL_SHOWN_KEY, "true")
    }
  }

  async function handleRewrite() {
    setError("")
    setResult("")

    // Language mismatch detection — catch before hitting the API
    const detectedLang = detectLanguage(essay)
    if (language === "english" && detectedLang === "chinese") {
      setError("您貼上的似乎是中文文章，請將上方語言切換至「中文 (測試中)」後再試。")
      return
    }
    if (language === "chinese" && detectedLang === "english") {
      setError("您貼上的似乎是英文文章，請將上方語言切換至「英文」後再試。")
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === "personal" ? "/api/rewrite-clone" : "/api/rewrite"
      const body = mode === "personal" ? { essay, language } : { essay, promptId: "1", language }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("errorGeneric"))
      } else {
        setResult(data.result)
        setResultKey(k => k + 1)
        await fetchUserData()
      }
    } catch {
      setError(t("errorNetwork"))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result)
    } catch {
      // Fallback for browsers that block clipboard API
      const textarea = document.createElement("textarea")
      textarea.value = result
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    maybeShowModal()
  }

  async function handleSubmitDetection() {
    if (!detector || !detectionPct) return
    setSubmitLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("detection_results").insert({
        user_id: user?.id ?? null,
        detector_name: detector,
        detection_percentage: parseInt(detectionPct, 10),
        notes: detectionNotes || null,
      })
      setModalSubmitted(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavbar rightSlot={<>
        <span className="text-sm text-gray-500 hidden sm:inline">{userEmail}</span>
        {!isPaid && (
          <button onClick={() => setShowUpgradeModal(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
            {t("upgradePlan")}
          </button>
        )}
        <Link href="/billing" className="text-sm text-gray-600 hover:text-gray-900 transition">{t("billing")}</Link>
        <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900 transition">{t("settings")}</Link>
      </>} />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Notice Box ── */}
        <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-lg overflow-hidden">
          <button
            onClick={toggleNotice}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-blue-600">📌 怎樣用最有效？</span>
            <span className="text-blue-400 text-xs">{noticeCollapsed ? "▼" : "▲"}</span>
          </button>
          {!noticeCollapsed && (
            <div className="px-4 pb-3 text-sm text-blue-700 leading-relaxed space-y-1.5">
              <p>適合有引用格式的大學報告，準備提交前做修改。直接叫 AI 生成的空泛文章效果較差。</p>
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium inline-block">⚠️ 目前支援英文文章，中文功能測試中</span>
              <p>還沒有初稿？先看這裡：👉 <a href="https://studywithai.substack.com/p/gpa-40-ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">用 AI 完成論文的工作流程</a></p>
            </div>
          )}
        </div>

        {/* Title + Usage counter */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboardTitle")}</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
              {isPaid ? (
                <>
                  {t("paidWordsRemainingPrefix")}{" "}
                  <span className="font-bold text-blue-600">
                    {(wordsRemaining ?? 0).toLocaleString()}
                  </span>{" "}
                  / {monthlyQuota.toLocaleString()}{" "}
                  {t("words")}
                </>
              ) : <span className="text-gray-500 text-sm">免費試用</span>}
            </div>
            {!isPaid && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 font-medium"
              >
                升級
              </button>
            )}
          </div>
        </div>

        {/* Free trial exhausted banner */}
        {!isPaid && usesRemaining === 0 && (
          <button onClick={() => setShowUpgradeModal(true)} className="w-full text-left mb-6">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition">
              <p className="text-sm text-orange-800 font-medium">
                {t("freeTrialExhaustedBanner")}
              </p>
            </div>
          </button>
        )}

        {/* Paid user words exhausted banner */}
        {isPaid && (wordsRemaining ?? 0) === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              {t("paidWordsExhaustedBanner")}
            </p>
          </div>
        )}

        {/* Language selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">文章語言</label>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("english")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                language === "english"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              英文
            </button>
            <button
              onClick={() => setLanguage("chinese")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                language === "chinese"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              中文 <span className="text-[0.65rem] opacity-80">(測試中)</span>
            </button>
          </div>
        </div>

        {/* Mode selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {t("presetLabel")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode("default")}
              className={`rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] relative overflow-hidden px-4 py-3 flex flex-col ${
                mode === "default"
                  ? "border-emerald-400 ring-2 ring-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-50/60 shadow-md shadow-emerald-100"
                  : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-50/60 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-emerald-100"
              }`}
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-200/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-1.5 relative z-10">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <ListIcon />
                </div>
                <p className="text-sm font-semibold text-gray-900">預設風格</p>
              </div>
              <p className="text-xs text-gray-600 leading-snug relative z-10">直接改寫，不需要任何設定。</p>
              <p className="text-xs text-gray-600 leading-snug relative z-10">偏直白簡潔，追求真人自然感。</p>
            </button>

            <button
              onClick={() => setMode("personal")}
              className={`rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] relative overflow-hidden px-4 py-3 flex flex-col ${
                mode === "personal"
                  ? "border-indigo-400 ring-2 ring-indigo-400 bg-gradient-to-br from-indigo-50 via-violet-100/60 to-indigo-100/70 shadow-md shadow-indigo-100"
                  : "border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-100/60 to-indigo-100/70 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-indigo-100"
              }`}
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-violet-300/25 rounded-full blur-2xl pointer-events-none" />
              <span className="absolute top-2.5 right-2.5 text-[0.6rem] font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full z-10">
                測試中
              </span>
              <div className="flex items-center gap-2 mb-1.5 relative z-10">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <span className="animate-sparkle inline-flex"><SparkleIcon /></span>
                </div>
                <p className="text-sm font-semibold text-gray-900">個人風格模仿</p>
              </div>
              <p className="text-xs text-gray-600 leading-snug relative z-10">
                上傳你自己以前寫的文章，或從{" "}
                <a
                  href="https://ivypanda.com/essays"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-600 hover:text-indigo-700 underline"
                >
                  範文網站
                </a>{" "}
                找一篇風格合適的文章，AI 會學那個寫法來改寫。
              </p>
              {/* Style limit reached inline message */}
              {styleLimitReached && !isPaid && (
                <p className="text-xs text-orange-600 mt-2 relative z-10">
                  風格分析次數已用盡。
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true) }}
                    className="text-blue-600 hover:text-blue-700 font-medium underline ml-1"
                  >
                    升級
                  </button>
                  {" "}享每月 20 次。
                </p>
              )}
            </button>
          </div>

          {/* Warning: personal style not set up */}
          {mode === "personal" && !hasPersonalStyle && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              {t("noStyleWarning")}{" "}
              <Link href="/dashboard/style-setup" className="text-blue-600 hover:text-blue-700 font-medium underline">
                {t("noStyleLink")}
              </Link>{" "}
              {t("noStyleSuffix")}
            </div>
          )}

          {/* Personal style is set up: link to update */}
          {mode === "personal" && hasPersonalStyle && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {t("existingStyleTitle")}{" "}
              <Link href="/dashboard/style-setup" className="text-blue-600 hover:text-blue-700 font-medium underline">
                {t("updateStyle")}
              </Link>
            </div>
          )}

          {/* Language mismatch warning: Chinese mode but style was analyzed in English */}
          {mode === "personal" && hasPersonalStyle && language === "chinese"
            && (styleLanguage === null || styleLanguage === "english") && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              你的個人風格是以英文文章分析的，建議先更新風格樣本再使用中文模式。{" "}
              <Link href="/dashboard/style-setup" className="text-blue-600 hover:text-blue-700 font-medium underline">
                前往風格設定
              </Link>
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t("essayLabel")}
            </label>
            <span
              className={`text-sm transition-colors duration-300 ${
                isOverLimit ? "text-red-500 font-medium" : isNearLimit ? "text-amber-500 font-medium" : "text-gray-400"
              }`}
            >
              {wordCount} / {wordLimit} {t("words")}
            </span>
          </div>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder={t("essayPlaceholder")}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900"
          />
          {isOverLimit && (
            <p className="mt-1 text-sm text-red-500">
              {t("overLimitPrefix")} {wordLimit} {t("overLimitError")}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleRewrite}
          disabled={!canSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              {t("rewriting")}
              <span className="inline-flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1 h-1 bg-white/80 rounded-full block"
                    style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 200}ms` }} />
                ))}
              </span>
            </span>
          ) : t("rewriteButton")}
        </button>

        {/* Error */}
        {error && (
          <div key={error} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-scale-in">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div key={resultKey} className="mt-8 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">{t("resultTitle")}</h2>
              <button
                onClick={handleCopy}
                className={`text-sm px-4 py-2 rounded-lg active:scale-95 transition-all duration-200 ${
                  copied
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span key={copied ? "copied" : "copy"} className={copied ? "animate-check-pop inline-block" : "inline-block"}>
                  {copied ? `✓ ${t("copied")}` : t("copyButton")}
                </span>
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed">
              {result}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">⚠️ 改寫完成後請務必自行核對內容</p>
              <p className="mt-1 text-sm text-red-600">每位教授的檢測方式不同，沒有任何工具能保證百分百通過，最終請自行判斷或修改後再提交。</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* ── Detection Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">📊 檢測器測試</h2>

            {!modalSubmitted ? (
              <>
                {/* Detector links */}
                <p className="text-sm text-gray-600 mb-3">建議用以下檢測器測試改寫效果：</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {DETECTORS.map((d) => (
                    <a
                      key={d.name}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition font-medium"
                    >
                      {d.name} ↗
                    </a>
                  ))}
                </div>

                {/* Feedback form */}
                <p className="text-sm text-gray-600 mb-3">
                  測試完成後，歡迎告訴我結果，幫助改善工具 🙏
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">你用了哪個檢測器？</label>
                    <select
                      value={detector}
                      onChange={(e) => setDetector(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">請選擇…</option>
                      <option value="ZeroGPT">ZeroGPT</option>
                      <option value="SciSpace">SciSpace</option>
                      <option value="Quillbot">Quillbot</option>
                      <option value="GPTZero">GPTZero</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">檢測結果是多少 %？（0 至 100）</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={detectionPct}
                      onChange={(e) => setDetectionPct(e.target.value)}
                      placeholder="例如：15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">備註（可選）</label>
                    <input
                      type="text"
                      value={detectionNotes}
                      onChange={(e) => setDetectionNotes(e.target.value)}
                      placeholder=""
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmitDetection}
                    disabled={!detector || !detectionPct || submitLoading}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitLoading ? "提交中…" : "提交結果"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <span className="text-5xl mb-3 block animate-scale-in">🎉</span>
                <p className="text-gray-800 font-semibold">謝謝你的反饋！</p>
                <p className="text-sm text-gray-500 mt-1">這對改善工具很有幫助</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-5 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 text-sm"
                >
                  關閉
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}
