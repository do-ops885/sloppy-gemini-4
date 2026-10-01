# AGENTS.md

> Operating manual for coding agents working in this repo. Product truth lives in
> `PRODUCT.md`; the visual world in `DESIGN.md`; values in `tokens.json`. This file
> is the map — read it before touching anything. The vendored Impeccable skill
> (`.agents/skills/impeccable`) governs design work.

## What this is

**GEMINI 4 PRO: THE FINAL COUNTDOWN & VAPORWARE POOL** — a static, no-build parody
prediction-market terminal. HTML5 + Tailwind CDN + Lucide + vanilla JS. Deployed
via GitHub Pages (branch deploy, `main` / root). The joke is sloppy maximalism;
the engineering underneath is disciplined. Keep it that way.

## Commands

| Task | Command |
| --- | --- |
| Serve locally | `python3 -m http.server 8080` (or open `index.html`) |
| Install + test | `npm install && npm test` — 74 jsdom checks, both motion modes; must stay green |
| Sync news wire | `npm run wire` → `wire.json` |
| Sync real odds | `node scripts/update-markets.mjs` → `real-markets.json` |

## Repo map

- `index.html` / `styles.css` / `app.js` — the app. `tokens.css` loads **before** `styles.css`.
- `tokens.json` — DTCG design tokens, **system of record** → `tokens.css` → Tailwind config (`var()` refs).
- `PRODUCT.md` — durable product truth + constraints. `DESIGN.md` — component inventory + motion language.
- `wire.json` / `real-markets.json` — machine-synced data (cron); edit the scripts, not the data.
- `partners.json` — affiliate partner registry (jurisdiction rules, ref params).
- `ci/update-wire.yml` — the workflow, **staged at `ci/`** (see Permission walls).
- `tests/smoke.test.mjs` — the harness. Add one check per new behavior, in both modes.
- `.agents/` — vendored Impeccable skill (multi-harness layout; engine binary + `settings.local.json` gitignored).

## Hard rules (violations = broken build, broken trust, or broken law)

1. **Motion**: animate `transform`/`opacity` only — never width/height/top/margin. Entrances `240ms cubic-bezier(0.16,1,0.3,1)`, exits `110ms cubic-bezier(0.7,0,0.84,0)`. Springs: `SPRING_MODAL` 380/28, `SPRING_COUNTER` 240/24. Every motion feature needs a `prefers-reduced-motion` parity path (150ms opacity fades). `will-change` toggled, never permanent.
2. **Tokens**: new values enter `tokens.json` → `tokens.css` first. No one-off color/spacing/duration literals in `styles.css` or inline styles.
3. **Parody integrity**: disclaimers stay visible; no real money anywhere in the game; jokes punch at vaporware, never at users.
4. **Real-money exits**: geo fail-closed, disclosure interstitial before every outbound, `rel="nofollow sponsored"`, no platforms unlicensed in the visitor's market (offshore crypto casinos are banned by policy).
5. **Reality labeling**: wire items keep source+date; real-oracle prices are labeled public data. Never blend unlabeled reality into the hallucination.
6. **Fail-closed data**: `wire.json`/`real-markets.json` loaders and both sync scripts must refuse to blank/render on fetch or parse failure.

## Conventions

- Semantic classes from `DESIGN.md`'s inventory; Tailwind for layout/spacing, custom classes for effects.
- `app.js` is sectioned (`/* ---------- N. ... ---------- */`) — extend sections, keep single `init()`.
- Text contrast floor: `slate-500` minimum on the void background.
- Data files are synced artifacts: humans edit `scripts/`, machines edit `*.json`.

## Git workflow

- PRs target `main`; **merge commits, not squash** (squash rewrote history once and caused conflicts).
- All work rides `cline/c56w6w8f` unless told otherwise; push early, push often.
- `npm test` green is a merge prerequisite.

## Permission walls (bot token limits — do not burn time retrying)

- Pushing `.github/workflows/**` → **rejected** (app lacks `workflows` permission). Stage workflow changes at `ci/`; a human copies them in.
- Enabling Pages via API → **403** (lacks `pages:write`). Human toggles Settings → Pages → Deploy from branch → `main` / root.

## Done means

Behavior works, tests added and green in both motion modes, tokens/docs updated,
README touched if the surface changed, and the parody voice is intact.
