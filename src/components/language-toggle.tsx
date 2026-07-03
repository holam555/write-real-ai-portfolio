"use client"

import { useLanguage } from "@/lib/i18n/context"

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage()

  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition font-medium"
      aria-label="Toggle language"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  )
}
