# 🎰 GEMINI 4 PRO: THE FINAL COUNTDOWN & VAPORWARE POOL

A gloriously chaotic, intentionally unhinged **parody prediction-market terminal** for
speculating on the release date of **Google Gemini 4 Pro** — or whether it dissolves
into vaporware forever. All probabilities are hallucinated. All money is fake.
The hopium is real.

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