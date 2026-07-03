"use client"

import { useState } from "react"
import { isDisposableEmail } from "@/lib/disposable-emails"
import { useLanguage } from "@/lib/i18n/context"
import { SiteNavbar } from "@/components/site-navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "password" | "magic"

export default function SignUpPage() {
  const [mode, setMode] = useState<AuthMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  function switchMode(m: AuthMode) {
    setMode(m)
    setError("")
    setSent(false)
  }

  async function handlePasswordSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (isDisposableEmail(email)) {
      setError(t("errorDisposableEmail"))
      return
    }
    if (password.length < 6) {
      setError(t("errorPasswordTooShort"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("errorPasswordMismatch"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "TRIAL_FULL") {
          router.push("/waitlist")
          return
        }
        if (data.error === "EMAIL_ALREADY_REGISTERED") {
          setError(t("errorEmailAlreadyRegistered"))
          return
        }
        setError(data.error || t("errorGeneric"))
      } else {
        setSent(true)
      }
    } catch {
      setError(t("errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
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

    if (isDisposableEmail(email)) {
      setError(t("errorDisposableEmail"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "TRIAL_FULL") {
          router.push("/waitlist")
          return
        }
        if (data.error === "EMAIL_ALREADY_REGISTERED") {
          setError(t("errorEmailAlreadyRegistered"))
          return
        }
        setError(data.error || t("errorGeneric"))
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
            {t("signupTitle")}
          </h1>

          {/* Google Signup */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">使用 Google 註冊</span>
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

          {/* Password signup mode */}
          {mode === "password" && (
            sent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-800 font-medium text-sm">{t("signupEmailConfirmNote")}</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSignup} className="space-y-4">
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
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("password")}
                  </label>
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
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("confirmPassword")}
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmPasswordPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? t("sending") : t("signupTitle")}
                </button>
              </form>
            )
          )}

          {/* Magic link mode */}
          {mode === "magic" && (
            sent ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-1">{t("magicLinkSent")}</p>
                  <p className="text-green-700 text-sm">
                    {t("signupGoTo")} <span className="font-medium">{email}</span>{" "}
                    {t("signupCheckEmail")}
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
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
