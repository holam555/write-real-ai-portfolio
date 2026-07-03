// Uses the `disposable-email-domains` package (~121k domains) instead of
// a hand-maintained list so newly-created throwaway services are blocked automatically.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomains: string[] = require("disposable-email-domains")

const DISPOSABLE_SET = new Set(disposableDomains)

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return domain ? DISPOSABLE_SET.has(domain) : false
}
