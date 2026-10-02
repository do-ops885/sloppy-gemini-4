# DESIGN.md — the incumbent visual world, documented

> Recorded per Impeccable `document` from the shipped implementation.
> System of record for values: `tokens.json` → `tokens.css`.

## Visual world
**"Degenerate casino-terminal"** — a 2000s crypto casino crashed into an AI-startup
glow site and a financial ticker room. Dark void canvas (`#07080d`), radioactive
accent quarter: Hyper-Cyan, Toxic Green, Hallucination Magenta, Panic Gold.
Density is high on purpose; restraint shows up only in the physics.

The world's chaos is *earned by the brief* (sloppy maximalism is the product).
The craft floor still holds: real depth (offset shadows), readable contrast,
themed browser surfaces, one coherent motion language.

## Tokens (use, don't reinvent)
- **Color:** semantic first — `surface-base/raised/card`, `text-primary/heading/secondary/muted`,
  `accent-hyper/toxic/halluc/panic`, `border-subtle/strong`.
- **Type:** `font-poster` (Archivo Black) hero only; `font-display` (Syne) headings;
  `font-mono` (Space Mono) data/stats — measurement, not costume.
- **Motion:** `--motion-enter` 240ms ease-out, `--motion-exit` 110ms ease-in,
  reduced-motion `--duration-fade` 150ms; JS springs `SPRING_MODAL` 380/28, `SPRING_COUNTER` 240/24.
- **Elevation:** z-scale 0→90 (base→confetti); shadows carry offset+blur; glows are decoration.

## Component inventory
| Component | Class(es) | Notes |
| --- | --- | --- |
| Buttons | `.cta-primary` `.cta-ghost` `.cta-mini` `.cta-bet` `.confirm-btn` `.chip` `.icon-btn` | Gradient fill = action, ghost = secondary; active state scale(.92-.96) |
| Market card | `.card` > `.card-inner` | Tilt on inner, FLIP on outer; border-beam `::before` on hover |
| Pills | `.rank-pill` `.delta-pill` `.live-pill` `.badge-slop` `.badge-status` | Delta pill: toxic=up, halluc=down |
| Bars | `.bar` > `.bar-fill` | `scaleX(var(--p))` only; shimmer `::after` |
| Drawer | `.drawer` + `.drawer-overlay` | Spring translate3d; reduced = opacity fade |
| Feed | `.feed-list` `.feed-item` | Enter from translateY(-12px); cap 14; `.out` = 110ms fade |
| Toast | `.toast-root` `.toast` | Bottom-right stack; 240ms in / 110ms out |
| Marquee | `.marquee-track` > `.marquee-group` x2 | -50% loop; `.reverse` counter-direction; real news uses `.wire-item` |
| Visualizer | `.viz span` | `scaleY` driven by leverage + noise |

## Motion language
One authored system, not scattered effects: springs for anything a finger touches
(drawer, tilt, counters), asymmetric CSS easings for entrances/exits, FLIP for
board re-ranking, transform-only marquees. `will-change` is toggled, never permanent.

## Copy voice
Degenerate finance-speak in all-caps mono ("APED", "REKT", "HOPIUM LEVERAGE").
Controls name their action ("CONFIRM HALLUCINATED BET"). Jokes punch at vaporware,
never at users. Real wire items are plainly labeled WIRE with source + date.

## Browser surfaces (themed, not default)
Selection `bg-halluc`; thin palette scrollbars; `:focus-visible` ring in accent-hyper;
caret in accent-hyper; tabular numerals on all data readouts.

## Anti-slop pass (impeccable detect, 2026-10-02)

Ran the vendored detector and fixed everything real, then registered the earned
choices in `.impeccable/config.json`:

**Fixed:** muted-text contrast (`--text-muted` → `ink-450` #8b98ad, 4.9:1 on void;
slate-500→400 on meta text; `.server-box` to `text-secondary`), functional-text
floor raised to 11px across pills/labels/readouts (legal smallprint stays 10px),
tracking tightened to ≤0.16em on longer strings, hero kicker moved below the CTA
row (no eyebrow-on-h1), noise texture made visible (0.16 — a choice, not a token),
info-card h3 bumped to repair the 1.25:1 type step.

**Ignored with reasons (brief-earned):** `gradient-text` + `dark-glow` (neon world),
`marquee` (the product is a ticker), `codex-grid-background` (measurement surface),
`radial-halo` (ambient void), `em-dash-overuse` + `tiny-text` (wire voice; floors
still enforced), `wide-tracking` (tracked caps only on short uppercase labels),
`low-contrast=* [index.html]` (detector inheritance miss — body is slate-200).

Re-run: `.agents/skills/impeccable/scripts/impeccable detect index.html styles.css app.js`
→ 0 anti-patterns. New one-off values must earn their ignore in the config, in
writing, or they don't ship.

## Accessibility
Reduced-motion parity everywhere (opacity fades, static viz, no confetti); ESC closes
drawer + focus return; focus trap in drawer; aria-pressed on SFX toggle; aria-live
polite toasts.
