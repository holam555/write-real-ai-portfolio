/**
 * Shared post-processing functions for Gemini API responses.
 *
 * Gemini sometimes wraps its output with unwanted intro/outro lines even when
 * told not to. These functions strip those lines without touching the actual
 * essay content.
 */

// ---------------------------------------------------------------------------
// Rewrite output cleanup
// Used by: /api/rewrite, /api/rewrite-clone, /api/guest-rewrite
// ---------------------------------------------------------------------------

const REWRITE_UNWANTED_START = [
  "here is",
  "here's",
  "i have rewritten",
  "i've rewritten",
  "i have revised",
  "i've revised",
  "rewritten essay",
  "revised essay",
  "following the rules",
  "following your",
  "as requested",
  "as per",
  "below is",
  "the rewritten",
  "the revised",
  "i will",
  "i've followed",
  "i have followed",
  "certainly",
  "of course",
  "sure,",
]

const REWRITE_UNWANTED_END = [
  "let me know",
  "i hope",
  "please let me know",
  "feel free",
  "if you need",
  "any changes",
  "any further",
  "hope this",
  "meets your",
  "satisfies your",
  "let me know if",
  "i'm happy to",
  "happy to help",
  "do let me know",
]

export function cleanRewriteOutput(text: string): string {
  const lines = text.split("\n")

  // Find first non-empty line that isn't an unwanted intro phrase
  let startIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase().trim()
    if (lineLower === "") continue
    const isUnwanted = REWRITE_UNWANTED_START.some((phrase) =>
      lineLower.startsWith(phrase)
    )
    if (!isUnwanted) {
      startIndex = i
      break
    }
  }

  // Find last non-empty line that isn't an unwanted outro phrase
  let endIndex = lines.length - 1
  for (let i = lines.length - 1; i >= 0; i--) {
    const lineLower = lines[i].toLowerCase().trim()
    if (lineLower === "") continue
    const isUnwanted = REWRITE_UNWANTED_END.some((phrase) =>
      lineLower.includes(phrase)
    )
    if (!isUnwanted) {
      endIndex = i
      break
    }
  }

  return lines.slice(startIndex, endIndex + 1).join("\n").trim()
}

// ---------------------------------------------------------------------------
// Style analysis output cleanup
// Used by: /api/analyze-style
// ---------------------------------------------------------------------------

const STYLE_UNWANTED_PHRASES = [
  "internalized",
  "i am ready",
  "i'm ready",
  "how would you like to proceed",
  "demonstrate my mastery",
  "successfully",
  "future interactions",
  "i will adopt",
  "sample passage",
  "to demonstrate",
  "let me know",
  "here is",
  "here are",
  "here's",
  "based on the",
  "based on your",
  "i have analyzed",
  "after analyzing",
  "i've analyzed",
  "from the sample",
  "from the text",
  "from your",
  "looking at",
  "upon analysis",
  "having analyzed",
  "the following rules",
  "i will now",
  "i am now",
  "please find",
  "as requested",
  "certainly",
  "of course",
]

export function cleanStyleAnalysisOutput(text: string): string {
  // Split by common separator patterns like "***"
  const parts = text.split("***")
  if (parts.length > 1) {
    text = parts[0]
  }

  const lines = text.split("\n")
  const cleaned = lines.filter(
    (line) =>
      !STYLE_UNWANTED_PHRASES.some((phrase) =>
        line.toLowerCase().includes(phrase.toLowerCase())
      )
  )

  return cleaned.join("\n").trim()
}
