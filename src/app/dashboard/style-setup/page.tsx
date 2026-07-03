"use client"

import { useState, useEffect } from "react"
import { countWords, MAX_WORDS } from "@/lib/word-count"
import { useLanguage } from "@/lib/i18n/context"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { UpgradeModal } from "@/components/upgrade-modal"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type StyleData = {
  has_style: boolean
  style_summary: string | null
  user_notes: string | null
  style_language: "english" | "chinese" | null
  tier: string
  used_count: number
  max_count: number
  remaining_count: number
}

const DETECTORS = [
  { name: "SciSpace", url: "https://scispace.com/?via=study" },
  { name: "Quillbot", url: "https://try.quillbot.com/Study-plze2k971zgu" },
  { name: "ZeroGPT", url: "https://zerogpt.com" },
  { name: "GPTZero", url: "https://gptzero.app/zh/detector" },
]

export default function StyleSetupPage() {
  // ── Language state ──
  const [language, setLanguage] = useState<"english" | "chinese">("english")
  const [savedStyleLanguage, setSavedStyleLanguage] = useState<"english" | "chinese" | null>(null)

  // ── Style analysis state ──
  const [analysisEssay, setAnalysisEssay] = useState("")
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [success, setSuccess] = useState(false)
  const [styleSummary, setStyleSummary] = useState<string | null>(null)
  const [styleData, setStyleData] = useState<StyleData | null>(null)
  const [userNotes, setUserNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [limitReached, setLimitReached] = useState<"free" | "paid" | null>(null)

  // ── Rewrite state ──
  const [rewriteEssay, setRewriteEssay] = useState("")
  const [rewriteResult, setRewriteResult] = useState("")
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewriteError, setRewriteError] = useState("")
  const [copied, setCopied] = useState(false)

  // ── Detection modal state ──
  const [showModal, setShowModal] = useState(false)
  const [modalSubmitted, setModalSubmitted] = useState(false)
  const [detector, setDetector] = useState("")
  const [detectionPct, setDetectionPct] = useState("")
  const [detectionNotes, setDetectionNotes] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)

  const { t } = useLanguage()

  const analysisWordCount = countWords(analysisEssay, language)
  const analysisOverLimit = analysisWordCount > MAX_WORDS
  const rewriteWordCount = countWords(rewriteEssay, language)
  const rewriteOverLimit = rewriteWordCount > MAX_WORDS

  // Fetch existing style data on mount
  useEffect(() => {
    async function fetchStyleData() {
      try {
        const res = await fetch("/api/style-data")
        if (res.ok) {
          const data: StyleData = await res.json()
          setStyleData(data)
          if (data.style_summary) setStyleSummary(data.style_summary)
          if (data.user_notes) setUserNotes(data.user_notes)
          if (data.remaining_count <= 0) {
            setLimitReached(data.tier === "paid" ? "paid" : "free")
          }
          if (data.style_language) {
            setSavedStyleLanguage(data.style_language)
            setLanguage(data.style_language)
          }
        }
      } catch (e) {
        console.error("Failed to fetch style data:", e)
      }
    }
    fetchStyleData()
  }, [])

  async function handleAnalyze() {
    setAnalysisError("")
    setSuccess(false)
    setAnalysisLoading(true)
    setLimitReached(null)
    console.log("[Style Setup] Starting style analysis...")

    try {
      const res = await fetch("/api/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay: analysisEssay, language }),
      })

      const data = await res.json()
      console.log("[Style Setup] Analyze response:", res.status, data.error ?? "ok")

      if (!res.ok) {
        if (data.error === "STYLE_LIMIT_REACHED") {
          setLimitReached(data.tier === "paid" ? "paid" : "free")
        } else {
          setAnalysisError(data.error || t("errorGeneric"))
        }
      } else {
        setSuccess(true)
        setStyleSummary(data.style_summary)
        setAnalysisEssay("")
        setSavedStyleLanguage(language)
        setStyleData((prev) =>
          prev
            ? {
                ...prev,
                has_style: true,
                style_summary: data.style_summary,
                style_language: language,
                used_count: data.used_count,
                remaining_count: data.remaining_count,
              }
            : null
        )
      }
    } catch (e) {
      console.error("[Style Setup] Analyze error:", e)
      setAnalysisError(t("errorNetwork"))
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function handleRewrite() {
    setRewriteError("")
    setRewriteResult("")
    setRewriteLoading(true)
    console.log("[Style Setup Rewrite] Calling /api/rewrite-clone...")

    try {
      const res = await fetch("/api/rewrite-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay: rewriteEssay, language }),
      })

      const data = await res.json()
      console.log("[Style Setup Rewrite] Response:", res.status, data.error ?? "ok")
      console.log("[Output] Result state:", data.result ?? "(empty)")

      if (!res.ok) {
        setRewriteError(data.error || t("errorGeneric"))
      } else if (data.result) {
        setRewriteResult(data.result)
      } else {
        setRewriteError("改寫結果為空，請稍後再試。")
      }
    } catch (e) {
      console.error("[Style Setup Rewrite] Error:", e)
      setRewriteError(t("errorNetwork"))
    } finally {
      setRewriteLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rewriteResult)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = rewriteResult
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    // Show detector feedback modal once per session
    if (!sessionStorage.getItem("style_setup_modal_shown")) {
      setShowModal(true)
      setModalSubmitted(false)
      setDetector("")
      setDetectionPct("")
      setDetectionNotes("")
      sessionStorage.setItem("style_setup_modal_shown", "true")
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
      console.error("[style-setup] detection submit error:", e)
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true)
    setNotesSaved(false)
    try {
      const res = await fetch("/api/style-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: userNotes }),
      })
      if (res.ok) {
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
      }
    } catch {
      // silent
    } finally {
      setNotesSaving(false)
    }
  }

  const isPaid = styleData?.tier === "paid"
  const hasStyle = !!styleSummary

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteNavbar
        rightSlot={
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition">
            {t("backToDashboard")}
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("styleSetupTitle")}
        </h1>
        <div className="text-gray-500 mb-8 space-y-1.5 text-base">
          <p>
            貼上你自己以前寫的文章，或從{" "}
            <a
              href="https://ivypanda.com/essays"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              這個網站
            </a>{" "}
            找合適範文。
          </p>
          <p>AI 會分析你的寫作風格。分析不會扣除使用次數。</p>
          <p>改寫效果取決於範文質量，建議多試不同風格的效果。</p>
        </div>

        {/* Usage counter */}
        {styleData && (
          <div className="mb-6 text-sm text-gray-500">
            {isPaid
              ? `已使用 ${styleData.used_count} / ${styleData.max_count} 次風格分析（本月）`
              : `已使用 ${styleData.used_count} / ${styleData.max_count} 次風格分析`}
          </div>
        )}

        {/* ── SECTION 1: Style Analysis ── */}
        <div className="mb-8">

          {/* Limit reached */}
          {limitReached === "free" && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium mb-2">免費用戶最多可分析 2 次個人風格。</p>
              <p className="text-sm text-orange-700 mb-3">升級後可享每月 20 次分析次數。</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                升級方案
              </button>
            </div>
          )}

          {limitReached === "paid" && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">本月風格分析次數已用盡，下次續費後自動重置。</p>
            </div>
          )}

          {/* Success message */}
          {success && styleSummary && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-3">✅ 你的寫作風格已分析完成</p>
              <div className="bg-white rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{styleSummary}</p>
              </div>
            </div>
          )}

          {/* Existing style summary (not just-analyzed) */}
          {!success && styleSummary && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-3">{t("existingStyleTitle")}</p>
              <div className="bg-white rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{styleSummary}</p>
              </div>
              <p className="text-sm text-green-700">{t("existingStyleDesc")}</p>
            </div>
          )}

          {/* User notes — PAID only */}
          {hasStyle && isPaid && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">自訂備註（選填）</h2>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="例如：希望文章更簡潔、多用第一人稱..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {notesSaving ? "儲存中..." : notesSaved ? "✓ 已儲存" : "儲存備註"}
                </button>
                <p className="text-xs text-gray-400">備註會加入改寫提示，進一步調整風格</p>
              </div>
            </div>
          )}

          {/* Locked notes — FREE */}
          {hasStyle && !isPaid && (
            <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">✏️ 自訂風格偏好（付費功能）</p>
              <p className="text-sm text-gray-400 mb-3">升級後可加入備註，進一步調整改寫風格。</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                升級解鎖
              </button>
            </div>
          )}

          {/* Language selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">分析語言</label>
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
                中文
              </button>
            </div>
            {/* Language mismatch warning */}
            {hasStyle && savedStyleLanguage && savedStyleLanguage !== language && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                你目前儲存的風格是以{savedStyleLanguage === "english" ? "英文" : "中文"}分析的，切換語言後重新分析將會覆蓋舊風格。
              </p>
            )}
          </div>

          {/* Analysis textarea — only when limit not reached */}
          {!limitReached && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {hasStyle ? "重新分析風格" : t("sampleEssayLabel")}
                  </label>
                  <span className={`text-sm ${analysisOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {analysisWordCount} / {MAX_WORDS} {t("words")}
                  </span>
                </div>
                <textarea
                  value={analysisEssay}
                  onChange={(e) => setAnalysisEssay(e.target.value)}
                  placeholder={t("sampleEssayPlaceholder")}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900"
                />
                {analysisOverLimit && (
                  <p className="mt-1 text-sm text-red-500">
                    {t("overLimitPrefix")} {MAX_WORDS} {t("overLimitError")}
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analysisLoading || analysisOverLimit || analysisWordCount === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {analysisLoading
                  ? t("analyzingStyle")
                  : hasStyle
                  ? t("updateStyle")
                  : t("analyzeStyle")}
              </button>
              {analysisError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {analysisError}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── SECTION 2: Test Rewrite (only shown when style exists) ── */}
        {hasStyle && (
          <>
            <div className="border-t border-gray-200 pt-8 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">立即測試改寫</h2>
              <p className="text-sm text-gray-500 mb-4">
                貼上你要改寫的文章，測試個人風格模仿效果。
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">貼上要改寫的文章</label>
                <span className={`text-sm ${rewriteOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {rewriteWordCount} / {MAX_WORDS} {t("words")}
                </span>
              </div>
              <textarea
                value={rewriteEssay}
                onChange={(e) => setRewriteEssay(e.target.value)}
                placeholder="貼上你的文章…"
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900"
              />
              {rewriteOverLimit && (
                <p className="mt-1 text-sm text-red-500">
                  {t("overLimitPrefix")} {MAX_WORDS} {t("overLimitError")}
                </p>
              )}
            </div>

            <button
              onClick={handleRewrite}
              disabled={rewriteLoading || rewriteOverLimit || rewriteWordCount === 0}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {rewriteLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  {t("rewriting")}
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 bg-white/80 rounded-full block"
                        style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </span>
                </span>
              ) : "改寫文章"}
            </button>

            {rewriteError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {rewriteError}
              </div>
            )}

            {/* Rewrite result */}
            {rewriteResult && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{t("resultTitle")}</h3>
                  <button
                    onClick={handleCopy}
                    className={`text-sm px-4 py-2 rounded-lg active:scale-95 transition-all duration-200 ${
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {copied ? `✓ ${t("copied")}` : t("copyButton")}
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {rewriteResult}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />

      {/* Upgrade modal */}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Detection modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >✕</button>
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
                      {["ZeroGPT", "SciSpace", "Quillbot", "GPTZero", "其他"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">檢測結果是多少 %？</label>
                    <input type="number" min={0} max={100} value={detectionPct}
                      onChange={(e) => setDetectionPct(e.target.value)} placeholder="例如：15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">備註（可選）</label>
                    <input type="text" value={detectionNotes}
                      onChange={(e) => setDetectionNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button onClick={handleSubmitDetection} disabled={!detector || !detectionPct || submitLoading}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {submitLoading ? "提交中…" : "提交結果"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <span className="text-5xl mb-3 block">🎉</span>
                <p className="text-gray-800 font-semibold">謝謝你的反饋！</p>
                <p className="text-sm text-gray-500 mt-1">這對改善工具很有幫助</p>
                <button onClick={() => setShowModal(false)}
                  className="mt-5 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                  關閉
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
