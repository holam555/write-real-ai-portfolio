import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      <SiteNavbar rightSlot={<Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← 返回首頁</Link>} />

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">私隱政策</h1>
        <p className="text-sm text-gray-400 mb-10">最後更新：2026年3月</p>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-8 text-sm sm:text-base">

          <p>
            WriteReal AI（「本服務」）由 Study with AI 營運。本私隱政策說明我們如何收集、使用及保護你的個人資料。
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">我們收集的資料</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>電子郵件地址（用於帳戶登入及通知）</li>
              <li>改寫文章內容（僅用於處理請求，不作儲存或訓練用途）</li>
              <li>使用記錄（改寫次數、字數，用於計算額度）</li>
              <li>付款資料（由 Stripe 處理，我們不儲存信用卡資料）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">我們如何使用你的資料</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>提供改寫服務</li>
              <li>管理你的帳戶及訂閱</li>
              <li>發送服務相關通知</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">資料保護</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>所有資料以加密方式傳輸</li>
              <li>帳戶資料儲存於 Supabase，受其安全政策保護</li>
              <li>付款由 Stripe 處理，符合 PCI DSS 標準</li>
              <li>我們不會將你的資料出售或分享給第三方</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">第三方服務</h2>
            <p className="text-gray-600 mb-3">本服務使用以下第三方服務：</p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>Supabase（資料庫及身份驗證）</li>
              <li>Stripe（付款處理）</li>
              <li>Google Gemini API（AI 改寫功能）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Cookie</h2>
            <p className="text-gray-600">
              本服務使用必要的 Cookie 維持登入狀態，不使用追蹤或廣告 Cookie。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">你的權利</h2>
            <p className="text-gray-600">
              你可以隨時要求查閱、修改或刪除你的個人資料，請聯絡我們：
              <a href="mailto:studywithme@proton.me" className="text-indigo-600 hover:text-indigo-700 ml-1">
                studywithme@proton.me
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">聯絡我們</h2>
            <p className="text-gray-600">
              如有任何關於私隱政策的疑問，請電郵至：
              <a href="mailto:studywithme@proton.me" className="text-indigo-600 hover:text-indigo-700 ml-1">
                studywithme@proton.me
              </a>
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />

    </div>
  )
}
