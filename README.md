# Write Real AI

A full-stack SaaS product that helps non-native English speakers rewrite their writing in a more natural, fluent tone, with a "personal style clone" feature that learns a user's own writing voice from a sample and applies it to future rewrites. Bilingual (English / Traditional Chinese) end to end.

**This is a public portfolio snapshot of a live, self-hosted production app.** The proprietary prompt-engineering text has been redacted (`src/lib/prompts.ts`), and internal security/deployment runbooks are excluded — everything else, including the full application architecture, is real and unmodified.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Auth & DB | Supabase (Postgres, Auth, Row Level Security) |
| Payments | Stripe (Checkout, Billing Portal, webhooks) |
| AI | Google Gemini API (`@google/genai`) |
| Styling | Tailwind CSS |
| Hosting | Self-hosted (systemd + Cloudflare Tunnel), deployed via GitHub Actions CI/CD |

## What It Does

- **Natural-tone rewrite engine** — restructures stiff or overly formal writing using targeted linguistic rules (sentence variety, plain-word substitutions, transition patterns) so it reads the way a fluent, natural writer would phrase it, while preserving the original meaning and length.
- **Personal style clone** — analyzes a user-submitted writing sample, reverse-engineers a rule set describing their voice (sentence rhythm, vocabulary, transitions), and reuses it to rewrite future text in that style.
- **Guest + authenticated flows** — a rate-limited guest rewrite path for first-time visitors, and a full account flow with usage quotas for signed-up users.
- **Subscription billing** — Stripe Checkout for upgrades, a self-serve Billing Portal, and webhook-driven entitlement updates (subscription state is never trusted from the client).
- **Bilingual product** — English and Traditional Chinese supported throughout the UI and the AI prompts/output, via a custom i18n context.

## Notable Engineering Details

- **Defense in depth on the API layer**: every AI/billing route is rate-limited (`src/lib/rate-limit.ts`), validates auth via Supabase middleware (`src/lib/supabase/middleware.ts`), and fails closed (500, not silent bypass) if environment/config is missing.
- **Prompt-injection guarding**: user-submitted essay text is never trusted verbatim into the LLM call without boundary instructions and minimum-length checks.
- **Disposable email blocking** at signup to reduce trial abuse (`src/lib/disposable-emails.ts`).
- **Clean output post-processing**: Gemini responses are scrubbed of preambles/postambles (`src/lib/gemini-cleanup.ts`) so the API always returns exactly the rewritten text, nothing else.
- **Webhook-first billing state**: subscription/quota changes are driven by verified Stripe webhook events (`src/app/api/webhook/route.ts`), not client-reported state, to prevent tampering.

## Project Structure

```
src/
├── app/
│   ├── api/            # Route handlers: rewrite, style analysis, billing, auth, waitlist
│   ├── dashboard/       # Authenticated app (rewrite tool, style setup)
│   ├── billing/         # Subscription management UI
│   └── (marketing pages: landing, login, signup, terms, privacy)
├── components/          # Shared UI (navbar, footer, language toggle, upgrade modal)
└── lib/
    ├── supabase/        # Client/server/admin/middleware Supabase clients
    ├── i18n/            # English/Chinese translation context
    ├── prompts.ts        # LLM prompt templates (redacted in this public copy)
    ├── gemini.ts          # Gemini API client wrapper
    ├── rate-limit.ts      # In-memory rate limiter
    └── stripe.ts           # Stripe client wrapper
```

## About the Redactions

`src/lib/prompts.ts` contains the actual prompt-engineering logic that makes the rewrite quality work — that's the product's core IP, so the prompt bodies are replaced with placeholders here. The surrounding code (how prompts are selected, composed, and sent to Gemini) is untouched. Happy to walk through the real prompts and the reasoning behind them directly.

---

Built and maintained solo — architecture, backend, frontend, billing integration, and deployment pipeline all designed and implemented independently.
