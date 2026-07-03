"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/context"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"

type UserData = {
  tier: string
  uses_remaining: number
  words_remaining: number
  monthly_quota: number
  billing_cycle_start: string | null
}

export default function BillingPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/user-data")
        if (res.status === 401) {
          router.push("/login")
          return
        }
        if (!res.ok) {
          setFetchError(true)
          return
        }
        const data = await res.json()
        setUserData({
          tier: data.tier,
          uses_remaining: data.uses_remaining,
          words_remaining: data.words_remaining,
          monthly_quota: data.monthly_quota ?? 20000,
          billing_cycle_start: data.billing_cycle_start,
        })
      } catch {
        setFetchError(true)
      }
    }
    fetchData()
  }, [router])

  async function handleManageSubscription() {
    setLoading(true)
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        alert(data.error)
      } else {
        alert(t("errorGeneric"))
      }
    } catch {
      alert(t("errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  // Compute next renewal date (billing_cycle_start + 1 month)
  function getNextRenewal(): string {
    if (!userData?.billing_cycle_start) return "未知"
    const d = new Date(userData.billing_cycle_start)
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split("T")[0]
  }

  const isPaid = userData?.tier === "paid"
  const quota = userData?.monthly_quota || 20000
  const wordsPercent = isPaid
    ? Math.round(((userData?.words_remaining || 0) / quota) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavbar rightSlot={<Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition">返回</Link>} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {t("billingTitle")}
        </h1>

        {fetchError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {t("errorGeneric")}
          </div>
        ) : !userData ? (
          <div className="flex items-center gap-3 text-gray-400 py-8">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span>{t("loading")}</span>
          </div>
        ) : isPaid ? (
          /* ===== PAID USER VIEW ===== */
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 font-medium mb-4">
                {t("billingPaidPlan")}
              </p>

              {/* Words progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {t("billingWordsRemainingPrefix")}{" "}
                    {userData.words_remaining.toLocaleString()}{" "}
                    {t("billingWordsRemaining")}
                  </span>
                  <span>/ {quota.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${wordsPercent}%` }}
                  />
                </div>
              </div>

              {/* Next renewal */}
              <p className="text-sm text-gray-500">
                {t("billingNextRenewal")}
                <span className="font-medium text-gray-700">
                  {getNextRenewal()}
                </span>
              </p>
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {t("billingManage")}
            </button>
          </div>
        ) : (
          /* ===== FREE TRIAL USER VIEW ===== */
          <div className="space-y-6">
            {/* Current plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">免費試用</span>
              </div>
              <p className="text-gray-700 font-medium mb-1">
                {t("billingFreeTrial")}
              </p>
            </div>

            {/* Upgrade card */}
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("billingUpgradeTitle")}
              </h2>
              <p className="text-sm text-gray-500 mb-4">每次改寫均需 API 費用，免費名額因此有限。</p>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-bold text-gray-900">$3.99</span>
                <span className="text-sm text-gray-500">/ 月</span>
                <span className="ml-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Beta 優惠價</span>
              </div>
              <p className="text-xs text-gray-400 mb-5">正式版上線後將調整為 $5.99 / 月，現在升級可永久鎖定優惠價</p>

              <ul className="space-y-2.5 mb-5">
                {[
                  "每月 20,000 字額度",
                  "每次最多 2,500 字",
                  "無限次改寫",
                  "每月 20 次個人風格分析（免費版僅限 2 次）",
                  "自訂風格備註功能",
                  "隨時取消",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="text-green-500 font-bold text-base">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch("/api/create-checkout-session", { method: "POST" })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                {loading ? "跳轉中…" : "立即升級 →"}
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">
                {t("billingEarlyBird")}
              </p>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
