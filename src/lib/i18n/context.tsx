"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { translations, type Locale } from "./translations"

type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale)
  }

  function t(key: string): string {
    const entry = translations[key]
    if (!entry) return key
    return entry[locale] || entry.zh || key
  }

  // Prevent hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{ locale: "zh", setLocale, t: (key) => translations[key]?.zh || key }}
      >
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
