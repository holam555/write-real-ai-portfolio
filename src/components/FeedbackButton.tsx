"use client"

import { useState, useEffect, useRef } from "react"

export default function FeedbackButton() {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as Window & { Tally?: { loadEmbeds: () => void } }
      w.Tally?.loadEmbeds()
    }
  }, [expanded])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [expanded])

  const btnBase =
    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-lg transition-all duration-200 whitespace-nowrap"

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
    >
      {/* Expanded buttons */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-200 ${
          expanded ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          className={`${btnBase} bg-[#7C3AED] hover:bg-[#6D28D9]`}
          data-tally-open="Y5rDaz"
          data-tally-width="370"
          data-tally-align-left="1"
          data-tally-emoji-text="👋"
          data-tally-emoji-animation="wave"
          onClick={() => setExpanded(false)}
        >
          💬 意見
        </button>
        <button
          className={`${btnBase} bg-[#7C3AED] hover:bg-[#6D28D9]`}
          data-tally-open="A7JY5e"
          data-tally-width="370"
          data-tally-align-left="1"
          data-tally-emoji-text="⚠️"
          data-tally-emoji-animation="wave"
          onClick={() => setExpanded(false)}
        >
          ⚠️ 回報問題
        </button>
        <button
          className={`${btnBase} bg-gray-500 hover:bg-gray-600`}
          onClick={() => setExpanded(false)}
        >
          ✕ 意見 / 回報問題
        </button>
      </div>

      {/* Main toggle button */}
      {!expanded && (
        <button
          className={`${btnBase} bg-[#7C3AED] hover:bg-[#6D28D9]`}
          onClick={() => setExpanded(true)}
        >
          💬 意見 / 回報問題
        </button>
      )}
    </div>
  )
}
