"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/i18n/context"
import { SiteNavbar } from "@/components/site-navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"

type AuthMode = "password" | "magic"

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  function switchMode(m: AuthMode) {
    setMode(m)
    setError("")
    setSent(false)
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(t("errorWrongCredentials"))
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError(t("errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("請先輸入電子郵件地址。")
      return
    }
    setLoading(true)
    setError("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setError(t("errorGeneric"))
      } else {
        setResetSent(true)
      }
    } catch {
      setError(t("errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(t("errorGeneric"))
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(t("errorAccountNotFound"))
      } else {
        setSent(true)
      }
    } catch {
      setError(t("errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteNavbar />
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {t("loginTitle")}
          </h1>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">使用 Google 登入</span>
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">或</span></div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`flex-1 py-2 text-sm font-medium transition ${
                mode === "password"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t("authTabPassword")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("magic")}
              className={`flex-1 py-2 text-sm font-medium transition ${
                mode === "magic"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t("authTabMagicLink")}
            </button>
          </div>

          {/* Password mode */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t("password")}
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
              </div>
              {resetSent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {t("resetPasswordSent")}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? t("sending") : t("loginTitle")}
              </button>
            </form>
          )}

          {/* Magic link mode */}
          {mode === "magic" && (
            sent ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-1">{t("magicLinkSent")}</p>
                  <p className="text-green-700 text-sm">
                    {t("loginGoTo")} <span className="font-medium">{email}</span>{" "}
                    {t("loginCheckEmail")}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">沒收到？請檢查垃圾郵件資料夾 📬</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail("") }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  {t("useOtherEmail")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("email")}
                  </label>
                  <input
                    id="email-magic"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? t("sending") : t("sendMagicLink")}
                </button>
              </form>
            )
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              {t("signup")}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
