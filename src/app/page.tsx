"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { createClient } from "@/lib/supabase/client"
import { countWords, MAX_WORDS } from "@/lib/word-count"

/* ─── Inline SVG Icons ─── */


const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
  </svg>
)

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
)

/* ─── Types ─── */
type Mode = "default" | "personal"


const REWRITE_COUNT_KEY = "dashboard_rewrite_count"
const MODAL_SHOWN_KEY = "dashboard_modal_session_shown"

const DETECTORS = [
  { name: "SciSpace", url: "https://typeset.io/ai-detector" },
  { name: "Quillbot", url: "https://try.quillbot.com/Study-plze2k971zgu" },
  { name: "ZeroGPT", url: "https://www.zerogpt.com" },
  { name: "GPTZero", url: "https://gptzero.app/zh/detector" },
]

/* ─── Page ─── */

export default function LandingPage() {
  const { t } = useLanguage()

  // Rewrite section state
  const [essay, setEssay] = useState("")
  const [result, setResult] = useState("")
  const [mode, setMode] = useState<Mode>("default")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [resultKey, setResultKey] = useState(0)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [noticeCollapsed, setNoticeCollapsed] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalSubmitted, setModalSubmitted] = useState(false)
  const [detector, setDetector] = useState("")
  const [detectionPct, setDetectionPct] = useState("")
  const [detectionNotes, setDetectionNotes] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)

  const wordCount = countWords(essay)
  const isOverLimit = wordCount > MAX_WORDS
  const isNearLimit = !isOverLimit && wordCount > MAX_WORDS * 0.8

  // Check auth status + guest trial on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true)
    })
  }, [])

  function toggleNotice() {
    setNoticeCollapsed(prev => !prev)
  }

  const canSubmit = (() => {
    if (loading || isOverLimit || wordCount === 0) return false
    if (mode === "personal") return false // locked for guests & logged-in on landing
    return true
  })()

  const handleRewrite = useCallback(async () => {
    setError("")
    setResult("")

    // Guests must log in first
    if (!isLoggedIn) {
      setShowGuestModal(true)
      return
    }

    setLoading(true)
    try {
      const endpoint = "/api/rewrite"
      const body: Record<string, string> = { essay, promptId: "1" }

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
      }
    } catch {
      setError(t("errorNetwork"))
    } finally {
      setLoading(false)
    }
  }, [essay, isLoggedIn, t])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result)
    } catch {
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

  function maybeShowModal() {
    const sessionShown = sessionStorage.getItem(MODAL_SHOWN_KEY)
    if (sessionShown === "true") return
    const count = parseInt(localStorage.getItem(REWRITE_COUNT_KEY) || "0", 10) + 1
    localStorage.setItem(REWRITE_COUNT_KEY, String(count))
    if (count % 3 === 1) {
      setShowModal(true)
      setModalSubmitted(false)
      setDetector("")
      setDetectionPct("")
      setDetectionNotes("")
      sessionStorage.setItem(MODAL_SHOWN_KEY, "true")
    }
  }

  async function handleSubmitDetection() {
    if (!detector || !detectionPct) return
    setSubmitLoading(true)
    try {
      const supabase = createClient()
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
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Navbar ── */}
      <SiteNavbar
        variant="landing"
        rightSlot={<>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 hidden sm:block">
            {t("login")}
          </Link>
          <Link href="/login" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-150 font-medium">
            {t("freeTrial")}
          </Link>
        </>}
      />

      {/* ── Hero (compact, NO button) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/60 via-indigo-50/25 to-transparent pointer-events-none" />
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-[-20px] right-[-80px] w-[420px] h-[300px] bg-rose-100/35 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-4 animate-fade-in" style={{ animationDelay: "0ms" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            <span className="text-xs font-medium text-indigo-500 tracking-widest uppercase">
              Write Real AI
            </span>
          </div>

          <h1 className="text-[2rem] leading-[1.2] md:text-4xl md:leading-[1.15] lg:text-[3rem] lg:leading-[1.12] font-bold text-gray-900 mb-4 tracking-tight text-balance animate-fade-in-up" style={{ animationDelay: "60ms" }}>
            {t("heroTitle1")}
            <br />
            <span className="text-indigo-600">{t("heroTitle2")}</span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-2 max-w-[36rem] mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            {t("heroSubtitle")}
          </p>

        </div>
      </section>

      {/* ── Rewrite Section (style cards + notice + textarea + button) ── */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Mode selector */}
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 預設風格 card */}
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

              {/* 個人風格模仿 card */}
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
                  上傳你自己以前寫的文章，或從<a href="https://www.ivypanda.com/essays/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline" onClick={(e) => e.stopPropagation()}>範文網站</a>找一篇風格合適的文章，AI 會學那個寫法來改寫。
                </p>
              </button>
            </div>

            {/* Personal mode locked message */}
            {mode === "personal" && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {t("guestPersonalLocked")}
                <Link href="/signup" className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline">
                  {t("guestSignupButton")}
                </Link>
              </div>
            )}
          </div>

          {/* ── Notice Box (collapsible, same as dashboard) ── */}
          <div className="mb-4 bg-blue-50/50 border border-blue-100 rounded-lg overflow-hidden">
            <button
              onClick={toggleNotice}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-blue-600">📌 怎樣用最有效？</span>
              <span className="text-blue-400 text-xs ml-3 shrink-0">{noticeCollapsed ? "▼" : "▲"}</span>
            </button>
            {!noticeCollapsed && (
              <div className="px-4 pb-3 text-sm text-blue-700 leading-relaxed space-y-1.5">
                <p>適合有引用格式的大學報告，準備提交前做修改。直接叫 AI 生成的空泛文章效果較差。</p>
                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium inline-block">⚠️ 目前支援英文文章，中文功能測試中</span>
                <p>還沒有初稿？先看這裡：👉 <a href="https://studywithai.substack.com/p/gpa-40-ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">用 AI 完成論文的工作流程</a></p>
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
                {wordCount} / {MAX_WORDS} {t("words")}
              </span>
            </div>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={t("essayPlaceholder")}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900 bg-white"
            />
            {isOverLimit && (
              <p className="mt-1 text-sm text-red-500">
                {t("overLimitPrefix")} {MAX_WORDS} {t("overLimitError")}
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

          <p className="text-center text-xs text-gray-400 mt-2">{t("heroNote")}</p>

          {/* Error */}
          {error && (
            <div key={error} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-scale-in">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div key={resultKey} className="mt-6 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{t("resultTitle")}</h3>
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

              {/* Signup prompt banner (guests only) */}
              {!isLoggedIn && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <p className="text-sm font-medium text-indigo-800 mb-1">
                    {t("guestSignupBanner1")}
                  </p>
                  <p className="text-sm text-indigo-700 mb-3">
                    {t("guestSignupBanner2")}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href="/signup"
                      className="text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      {t("guestSignupButton")}
                    </Link>
                    <Link
                      href="/login"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {t("guestLoginLink")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Guest Trial Used Modal ── */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {t("guestModalTitle")}
            </h3>
            <div className="text-sm text-gray-600 space-y-1.5 mb-5">
              <p>{t("guestModalBody1")}</p>
              <p>{t("guestModalBody2")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                {t("guestSignupButton")}
              </Link>
              <Link
                href="/login"
                className="w-full text-center py-2.5 text-gray-600 hover:text-gray-900 transition text-sm"
              >
                {t("guestLoginLink")}
              </Link>
            </div>
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Detector Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-scale-in">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">📊 檢測器測試</h2>
            {!modalSubmitted ? (
              <>
                <p className="text-sm text-gray-600 mb-3">建議用以下檢測器測試改寫效果：</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {DETECTORS.map((d) => (
                    <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition font-medium">
                      {d.name} ↗
                    </a>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-3">測試完成後，歡迎告訴我結果，幫助改善工具 🙏</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">你用了哪個檢測器？</label>
                    <select value={detector} onChange={(e) => setDetector(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
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
                    <input type="number" min={0} max={100} value={detectionPct} onChange={(e) => setDetectionPct(e.target.value)}
                      placeholder="例如：15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">備註（可選）</label>
                    <input type="text" value={detectionNotes} onChange={(e) => setDetectionNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button onClick={handleSubmitDetection} disabled={!detector || !detectionPct || submitLoading}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {submitLoading ? "提交中…" : "提交結果"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <span className="text-5xl mb-3 block animate-scale-in">🎉</span>
                <p className="text-gray-800 font-semibold">謝謝你的反饋！</p>
                <p className="text-sm text-gray-500 mt-1">這對改善工具很有幫助</p>
                <button onClick={() => setShowModal(false)}
                  className="mt-5 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-150 text-sm">
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
