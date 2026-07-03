"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/i18n/context"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { UpgradeModal } from "@/components/upgrade-modal"
import Link from "next/link"


type StyleInfo = {
  has_style: boolean
  style_summary: string | null
  user_notes: string | null
  tier: string
  used_count: number
  max_count: number
  remaining_count: number
}

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState("")
  const [styleInfo, setStyleInfo] = useState<StyleInfo | null>(null)
  const [userNotes, setUserNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Change password state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const { t } = useLanguage()
  const supabase = createClient()
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || "")
    }
    fetchData()

    // Fetch style data
    async function fetchStyleData() {
      try {
        const res = await fetch("/api/style-data")
        if (res.ok) {
          const data: StyleInfo = await res.json()
          setStyleInfo(data)
          if (data.user_notes) {
            setUserNotes(data.user_notes)
          }
        }
      } catch {
        // silent
      }
    }
    fetchStyleData()
  }, [supabase])

  async function handleClearStyle() {
    setClearing(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("style_prompts").delete().eq("user_id", user.id)
    setStyleInfo((prev) =>
      prev ? { ...prev, has_style: false, style_summary: null, user_notes: null } : null
    )
    setUserNotes("")
    setClearing(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    // Use server-side sign-out so cookies are cleared in the response headers.
    // Client-side signOut() cannot reliably delete chunked auth cookies.
    await fetch("/api/auth/signout", { method: "POST" })
    window.location.href = "/"
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword.length < 8) {
      setPasswordError("密碼至少需要 8 個字元。")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("兩次輸入的密碼不一致。")
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess("密碼已成功更新。")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setPasswordError("發生錯誤，請稍後再試。")
    } finally {
      setPasswordLoading(false)
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

  const isPaid = styleInfo?.tier === "paid"
  const limitReached = styleInfo ? styleInfo.remaining_count <= 0 : false

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteNavbar
        rightSlot={
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            {t("backToDashboard")}
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {t("settingsTitle")}
        </h1>

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("settingsEmail")}
          </h2>
          <p className="text-gray-900">{userEmail || t("loading")}</p>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">更改密碼</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">新密碼</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 8 個字元"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">確認新密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600">{passwordSuccess}</p>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {passwordLoading ? "更新中..." : "更新密碼"}
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-400">
            只適用於以密碼登入的帳戶。若你使用一次性連結登入，此功能不適用。
          </p>
        </div>

        {/* Saved style — show summary, never custom_prompt */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            {t("personalStyle")}
          </h2>

          {/* Usage counter */}
          {styleInfo && (
            <p className="text-xs text-gray-400 mb-3">
              {isPaid
                ? `已使用 ${styleInfo.used_count} / ${styleInfo.max_count} 次風格分析（本月）`
                : `已使用 ${styleInfo.used_count} / ${styleInfo.max_count} 次風格分析`}
            </p>
          )}

          {styleInfo?.style_summary ? (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {styleInfo.style_summary}
                </p>
              </div>

              {/* User notes — PAID only */}
              {isPaid && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    自訂備註
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="例如：希望文章更簡潔、多用第一人稱..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-900"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="mt-2 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {notesSaving
                      ? "儲存中..."
                      : notesSaved
                      ? "✓ 已儲存"
                      : "儲存備註"}
                  </button>
                </div>
              )}

              {/* Locked notes — FREE users */}
              {!isPaid && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    ✏️ 自訂風格偏好（付費功能）
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    升級後可加入備註，進一步調整改寫風格。
                  </p>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    升級解鎖
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4">
                {!limitReached && (
                  <Link
                    href="/dashboard/style-setup"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    重新分析風格
                  </Link>
                )}
                <button
                  onClick={handleClearStyle}
                  disabled={clearing}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition"
                >
                  {clearing ? t("clearing") : t("clearStyle")}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              {t("noStyleYet")}{" "}
              <Link
                href="/dashboard/style-setup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("goToSetup")}
              </Link>
            </p>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition"
        >
          {loggingOut ? t("loggingOut") : t("logout")}
        </button>
      </main>

      <SiteFooter />

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  )
}
