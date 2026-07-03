"use client"

import Link from "next/link"

interface SiteNavbarProps {
  /** Right-side slot — pass buttons/links specific to each page */
  rightSlot?: React.ReactNode
  /** Use the landing-page style (frosted glass) vs the inner-page style (solid white) */
  variant?: "landing" | "inner"
  /** Max-width container class — defaults to max-w-6xl for landing, max-w-5xl for inner */
  maxWidth?: string
}

const Brand = () => (
  <Link href="/" className="flex items-center gap-2.5 group">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/study-with-ai-logo.png"
      alt="Study with AI"
      width={28}
      height={28}
      className="rounded-full object-cover flex-shrink-0"
    />
    <span className="text-base font-semibold text-gray-900 tracking-[-0.02em]">
      WriteReal AI
    </span>
    <span className="hidden sm:inline text-gray-300 text-sm select-none">·</span>
    <a
      href="https://studywithai.substack.com"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="hidden sm:inline text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150 whitespace-nowrap"
    >
      by Study with AI ↗
    </a>
  </Link>
)

export function SiteNavbar({ rightSlot, variant = "inner", maxWidth }: SiteNavbarProps) {
  const containerWidth = maxWidth ?? (variant === "landing" ? "max-w-6xl" : "max-w-5xl")
  const navClass =
    variant === "landing"
      ? "sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100"
      : "bg-white border-b border-gray-200"

  return (
    <nav className={navClass}>
      <div className={`${containerWidth} mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between`}>
        <Brand />
        {rightSlot && (
          <div className="flex items-center gap-3 sm:gap-4">
            {rightSlot}
          </div>
        )}
      </div>
    </nav>
  )
}
