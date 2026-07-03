import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"

export const metadata = {
  title: "服務條款 — WriteReal AI",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      <SiteNavbar rightSlot={<Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">返回</Link>} />

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">WriteReal AI 服務條款</h1>
        <p className="text-sm text-gray-400 mb-10">最後更新：2026年3月</p>

        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          歡迎使用 WriteReal AI（「本服務」）。本服務由 Study with AI 提供。使用本服務即表示你同意以下條款。
        </p>

        <div className="space-y-10">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. 服務說明</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              WriteReal AI 是一個 AI 寫作潤色工具，協助用戶改寫 AI 輔助完成的文章初稿，使其讀起來更自然流暢，降低 AI 檢測器的誤判率。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. 使用規範</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">使用本服務時，你同意：</p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "本服務僅供個人學術及合法用途",
                "不得將本服務用於任何違法、欺詐或惡意用途",
                "不得嘗試破解、攻擊或干擾本服務的運作",
                "不得以自動化方式（爬蟲、機器人等）大量使用本服務",
                "你對自己提交的文章內容負完全責任",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. 學術誠信</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              WriteReal AI 的設計初衷是幫助用戶潤色 AI 輔助完成的初稿，使文章更具個人風格，減少被誤判的機會。
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">我們明確反對以下行為：</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              {[
                "將完全由 AI 生成、未經個人思考或研究的內容冒充為自己的作品",
                "以任何方式欺騙老師、教授或評審",
                "違反所屬學校或機構的學術誠信政策",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">本服務的正確使用方式：</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              {[
                "你已經完成了自己的研究和思考",
                "你有自己的論點、引用和內容",
                "你使用 AI 輔助改善文章的表達方式，而非代替你思考",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed">
              用戶有責任了解並遵守所屬學校或機構的學術誠信政策。WriteReal AI 不鼓勵、不支持任何形式的學術不誠信行為，亦不對用戶因濫用本服務而產生的任何學術後果負責。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. 帳號</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "你需要提供真實的電郵地址以建立帳號",
                "你有責任保管好自己的帳號",
                "如發現帳號被未授權使用，請立即聯絡我們",
                "我們保留在違反條款的情況下終止帳號的權利",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. 付費與退款</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "付費方案按月計費，通過 Stripe 處理",
                "可隨時取消訂閱，取消後於當前計費週期結束後生效",
                "除非服務出現嚴重技術問題，否則一般不提供退款",
                "如有退款需求，請聯絡 studywithme@proton.me",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. 服務限制</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "免費試用名額有限，額滿後需訂閱升級",
                "我們保留調整免費試用次數及付費方案價格的權利",
                "我們會提前通知用戶任何重大變更",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. 內容與私隱</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "你提交的文章內容不會被儲存或用於訓練 AI 模型",
                "詳情請參閱我們的私隱政策",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. 免責聲明</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "本服務按「現狀」提供，不保證改寫效果能通過所有 AI 檢測器",
                "AI 檢測器標準持續變化，我們無法保證結果",
                "我們不對因使用本服務而產生的任何直接或間接損失負責",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. 服務變更</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              我們保留隨時修改或終止服務的權利。重大變更將提前以電郵通知用戶。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. 聯絡我們</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              如有任何關於服務條款的疑問，請聯絡：{" "}
              <a href="mailto:studywithme@proton.me" className="text-blue-600 hover:underline">
                studywithme@proton.me
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            繼續使用本服務即表示你已閱讀並同意本服務條款。
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
