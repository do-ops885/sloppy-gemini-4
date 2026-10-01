# 🎰 GEMINI 4 PRO: THE FINAL COUNTDOWN & VAPORWARE POOL

A gloriously chaotic, intentionally unhinged **parody prediction-market terminal** for
speculating on the release date of **Google Gemini 4 Pro** — or whether it dissolves
into vaporware forever. All probabilities are hallucinated. All money is fake.
The hopium is real.

## 🌐 Live on GitHub Pages

The site is 100% static at the repo root — Pages can serve it as-is, no build step,
no workflow.

**One-time enable (needs repo admin, ~10 seconds):**

1. Open **[Settings → Pages](https://github.com/do-ops885/sloppy-gemini-4/settings/pages)**
2. **Build and deployment → Source:** `Deploy from a branch`
3. **Branch:** `main` · folder `/(root)` → **Save**
4. Wait ~1 minute → live at **https://do-ops885.github.io/sloppy-gemini-4/**

Every push to `main` redeploys automatically. (Pages can't be enabled from the API
with the current CI token — it lacks the `pages:write` grant — hence the one manual
click.)

## Run it

No build step. It's a static single-page app:

```bash
# option 1: just open it
open index.html            # macOS
xdg-open index.html        # Linux

# option 2: serve it (recommended, so fonts/CDN behave)
python3 -m http.server 8080
# or: npx serve .
```

Then visit `http://localhost:8080`.

## Stack

- Standalone HTML5 + [Tailwind CSS (CDN)](https://tailwindcss.com)
- [Lucide](https://lucide.dev) icons (CDN)
- Google Fonts: **Archivo Black** (poster), **Syne** (display), **Space Mono** (stats)
- Vanilla JS physics/motion engine — zero dependencies, zero layout thrash

## Design system & agent skill

- **Impeccable** ([impeccable.style](https://impeccable.style)) is vendored at
  `.claude/skills/impeccable` (engine binary gitignored; reinstall with
  `npx impeccable install`). Project context lives in `PRODUCT.md`; the visual
  world is documented in `DESIGN.md`.
- **Design tokens**: `tokens.json` (DTCG format) is the system of record →
  `tokens.css` (CSS custom properties: primitives → semantics) → mirrored into the
  Tailwind CDN config as `var(--*)` references. New values enter as tokens, never
  one-off literals.
- **REAL WIRE**: the top marquee and sidebar carry *real, labeled* Gemini 4 news
  (source + date, synced 2026-10-01 via Google News RSS) — clearly separated from
  the hallucinated hype.

## 💸 Real-money affiliate integration (compliance-first)

The fake-money game never changes — but the sidebar can carry a **REAL MARKETS (18+)**
rail linking to licensed prediction platforms via `partners.json`:

- **Geo fail-closed**: partner links render only when the visitor's country passes the
  partner's `allowedCountries`/`blockedCountries` rule. Unknown country = rail hidden.
- **Disclosure interstitial before every exit**: affiliate commission disclosure, age
  requirement, and helplines (1-800-GAMBLER · BeGambleAware · GamStop). Links carry
  `rel="nofollow sponsored noopener"`.
- **Setup**: join each platform's referral program, read its terms, replace
  `YOUR_*_REF` in `partners.json`, keep blocklists current. Test with `?geo=US`.
- **Landscape**: Kalshi (CFTC-regulated, US) and Polymarket (crypto, NOT available to
  US persons) are the natural fits for AI-release markets; Manifold is the no-license
  lightweight option. **Offshore crypto casinos (Stake, Rollbit, …) are deliberately
  excluded** — promoting unlicensed operators into restricted markets is illegal.
- **Your obligations**: FTC/ASA affiliate disclosure (built in), age gating (built in),
  platform terms review + local gambling-advertising law (on you — get legal advice
  before spending on traffic).

## 🤖 Automation: the wire syncs itself

The workflow ships staged at **`ci/update-wire.yml`** — the bot token lacks the
`workflows` permission, so a human installs it once:

```bash
mkdir -p .github/workflows && cp ci/update-wire.yml .github/workflows/
git add .github && git commit -m "ci: enable wire sync" && git push
# or via web UI: Actions -> New workflow -> paste ci/update-wire.yml
```

Once enabled it runs every 6 hours (and on demand via
**Actions → Update REAL WIRE → Run workflow**). It fetches the latest
`"Gemini 4 Pro"` headlines from Google News RSS via `scripts/update-wire.mjs`
(zero-dep Node), rewrites `wire.json`, and commits it back to `main` — which
also retriggers the Pages deploy. The app fetches `wire.json` at runtime when
served over HTTP(S) and falls back to the embedded snapshot on `file://`.
Everything except the one-copy install is already live.

## Features

- **Dual-direction infinite marquees** — hype quotes one way, live odds ticker the other
- **The Arena** — 5 speculative outcome cards with spring-animated odds counters,
  hover-tilt (`perspective(1000px)`, max ±6°), glowing implied-hype bars, and a
  mutating odds engine that **FLIP-reorders** the board by implied hype every 5s
- **The Degenerate Slip** — slide-over betting drawer on a physics spring
  (stiffness 380 / damping 28), hopium leverage slider 1–100x driving a soundwave
  visualizer, real-time hallucinated payout math, confetti bursts, `+1,000 HOPIUM` toasts
- **The Paranoia Feed** — mock WebSocket firehose of degenerate bettors every 2–4s
- **T-minus countdown** to the earliest theoretical release window (Q4 2026)
- Optional WebAudio bleeps (toggle in header, off by default)

## Motion harness (September UI/UX Animation Agent Skill Standard)

| Rule | Implementation |
| --- | --- |
| Composited motion only | Every animation is `transform` (`translate3d`/`scale`/`rotate`) or `opacity`. Bars use `scaleX`, visualizer uses `scaleY`, never width/height/top/margin. |
| Springs | Custom integrator: modals/cards/tilt `stiffness:380, damping:28, mass:1`; odds/payout counters spring-driven. |
| Asymmetric timing | Entrances `240ms cubic-bezier(0.16,1,0.3,1)`; exits `110ms cubic-bezier(0.7,0,0.84,0)`. |
| FLIP reordering | Market cards measure → reorder → invert → play when odds shift the ranking. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: marquees/tilt/confetti/springs disabled; opacity fades only, 150ms flat. |
| GPU hygiene | `will-change: transform` toggled only while a transition/spring is active. |

## Disclaimer

Parody. Not affiliated with Google. Gemini is a trademark of Google LLC.
All probabilities are hallucinated by a Markov chain with untreated brain damage.
If you lose fake money, please contact a fake lawyer.