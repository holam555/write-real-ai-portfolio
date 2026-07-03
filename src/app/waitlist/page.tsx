"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n/context"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import Link from "next/link"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "duplicate">("idle")
  const [error, setError] = useState("")
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("errorGeneric"))
      } else if (data.status === "duplicate") {
        setStatus("duplicate")
      } else {
        setStatus("success")
      }
    } catch {
      setError(t("errorNetwork"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteNavbar />
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-end mb-4">
            
          </div>
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {t("waitlistTitle")}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t("waitlistSubtitle")}
            </p>
          </div>

          {status === "success" ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                {t("waitlistSuccess")}
              </p>
            </div>
          ) : status === "duplicate" ? (
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">
                {t("waitlistDuplicate")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
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
                {loading ? t("waitlistSubmitting") : t("waitlistButton")}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition">
              &larr; {t("appName")}
            </Link>
          </p>
        </div>
      </div>
    </div>
    <SiteFooter />
    </div>
  )
}
