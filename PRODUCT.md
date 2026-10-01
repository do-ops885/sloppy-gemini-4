# PRODUCT.md — durable product truth

> Captured per Impeccable `init`. No structured-question tool exists in this
> harness, so the interview was substituted with the original brief + repository
> evidence; inferred facts are labeled **[inferred]**.

## Platform
`web` — static single-page app, file://-safe, no build step.

## Stack
Standalone HTML5 + Tailwind CSS (CDN) + Lucide icons + vanilla JS physics engine.
Deployed via GitHub Pages (branch deploy: `main` / root). Stack chosen by the user
in the original brief — decision confirmed, not delegated.

## Users & job
**[inferred]** AI-Twitter degenerates, ML engineers on break, and doomscrollers who
find release-date speculation funny. Job: laugh, place a fake bet with absurd
leverage, screenshot, share.

## What it makes possible
A parody prediction market on the release date of Google Gemini 4 Pro.
Differentiator: the probabilities are *openly* hallucinated and the aesthetic is
deliberate "sloppy maximalism" — 2000s crypto casino x AI-startup glow x Bloomberg
terminal on fire — executed with strict motion discipline. The joke lands *because*
the craft underneath is high.

## Durable constraints (preserve in all future work)
1. **Parody disclaimers stay visible** — not affiliated with Google; Gemini is a Google trademark.
2. **No real money, ever** — copy must keep that obvious at every wager surface.
3. **Motion harness is non-negotiable** — composited transforms/opacity only; springs (380/28 modals); 240ms/110ms asymmetric easings; FLIP reorders; full `prefers-reduced-motion` parity (150ms opacity fades).
4. **Design tokens are the system of record** — `tokens.json` (DTCG) → `tokens.css` → Tailwind config. New values enter as tokens, not one-off literals.
5. **Real news wire stays sourced + dated** — wire items must carry publication + date; never blend unlabeled real headlines into the hallucinated hype.

## Workflow defaults
No image generation available → code-first path (not stored, per skill rules).
