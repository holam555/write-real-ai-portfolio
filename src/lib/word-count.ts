export function countWords(text: string, language: 'english' | 'chinese' = 'english'): number {
  if (language === 'chinese') {
    // Count CJK characters + any English words mixed in
    const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
    const englishWords = text
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '')
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length
    return chineseChars + englishWords
  } else {
    // English: count by spaces
    return text.trim().split(/\s+/).filter((w: string) => w.length > 0).length
  }
}

export const MAX_WORDS = 1000
export const MAX_WORDS_PAID = 2500

/** Returns 'chinese' if >15% of the text's non-whitespace characters are CJK, else 'english' */
export function detectLanguage(text: string): 'english' | 'chinese' {
  const nonSpace = text.replace(/\s/g, '')
  if (!nonSpace.length) return 'english'
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  return cjk / nonSpace.length > 0.15 ? 'chinese' : 'english'
}
