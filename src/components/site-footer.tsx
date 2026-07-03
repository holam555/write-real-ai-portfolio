import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">

          {/* Brand */}
          <div className="text-center md:text-left">
            <p className="font-bold text-gray-900 text-sm mb-1">WriteReal AI</p>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-nowrap">
              讓 AI 幫忙寫的文章，真正像你寫的
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-center sm:text-left items-center sm:items-start">
            <a
              href="mailto:studywithme@proton.me"
              className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              聯絡我們
            </a>
            <a
              href="https://studywithai.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              部落格：Study with AI
            </a>
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              私隱政策
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              服務條款
            </Link>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2026 WriteReal AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
