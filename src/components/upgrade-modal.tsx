"use client"

import { useState } from "react"

interface UpgradeModalProps {
  onClose: () => void
}

const StripeIcon = () => (
  <span className="font-bold tracking-tight" style={{ color: "#635BFF", fontFamily: "sans-serif", fontSize: "15px" }}>
    stripe
  </span>
)

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "發生錯誤，請稍後再試。")
      }
    } catch {
      alert("發生錯誤，請稍後再試。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">升級至付費方案</h2>

        {/* Reason */}
        <p className="text-sm text-gray-500 mb-1 leading-relaxed">
          每次改寫均需 API 費用，免費名額因此有限。
        </p>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          升級後你可以獲得：
        </p>

        {/* Features */}
        <ul className="space-y-2.5 mb-5">
          {[
            "每月 20,000 字額度",
            "每次最多 2,500 字",
            "無限次改寫",
            "每月 20 次個人風格分析",
            "自訂風格備註功能",
            "Beta 優惠價永久鎖定",
            "隨時取消",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
              <span className="text-green-500 font-bold text-base">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-xl px-4 py-3.5 mb-5 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900">$3.99</span>
            <span className="text-sm text-gray-500">/ 月</span>
            <span className="ml-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Beta 優惠價</span>
          </div>
          <p className="text-xs text-gray-400">正式版上線後將調整為 $5.99 / 月</p>
          <p className="text-xs text-blue-600 font-medium">現在升級可永久鎖定優惠價</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          {loading ? "跳轉中…" : "立即升級 →"}
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          先不用，謝謝
        </button>

        {/* Stripe badge */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <span>Powered by</span>
          <StripeIcon />
          <span>· 不儲存信用卡資料</span>
        </div>
      </div>
    </div>
  )
}
