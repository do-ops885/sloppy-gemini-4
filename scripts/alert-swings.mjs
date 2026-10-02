#!/usr/bin/env node
/* Swing detector for the REAL ORACLE: compares the two latest history points
   per market, writes swings.json (consumed by the app for badges), and — only
   when ALERT_WEBHOOK_URL (Discord) is configured — posts an alert for moves
   >= SWING_THRESHOLD_PP (default 10). Never fails the sync job: exit 0 always. */
import { readFileSync, writeFileSync } from 'node:fs';

const THRESHOLD = Number(process.env.SWING_THRESHOLD_PP || 10);
const WEBHOOK = process.env.ALERT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';

let history;
try {
  history = JSON.parse(readFileSync('real-history.json', 'utf8'));
} catch {
  console.log('no real-history.json — nothing to do');
  process.exit(0);
}

const swings = {};
for (const [key, pts] of Object.entries(history.series || {})) {
  if (!Array.isArray(pts) || pts.length < 2) continue;
  const [prevTs, prev] = pts[pts.length - 2];
  const [nowTs, now] = pts[pts.length - 1];
  const swingPp = Math.round((now - prev) * 10) / 10;
  if (swingPp === 0) continue;
  const windowHours = Math.round(((new Date(nowTs)) - (new Date(prevTs))) / 36e5 * 10) / 10;
  swings[key] = { prev, now, swingPp, windowHours };
}

const out = { synced: new Date().toISOString(), thresholdPp: THRESHOLD, swings };
writeFileSync('swings.json', JSON.stringify(out, null, 2) + '\n');
console.log(`swings.json: ${Object.keys(swings).length} active swing(s), threshold ${THRESHOLD}pp`);

const big = Object.entries(swings).filter(([, s]) => Math.abs(s.swingPp) >= THRESHOLD);
if (!big.length) { console.log('no swings above threshold — staying silent'); process.exit(0); }
if (!WEBHOOK) { console.log(`ALERT: ${big.length} big swing(s) but ALERT_WEBHOOK_URL unset — skipping post`); process.exit(0); }

const lines = big.map(([key, s]) => {
  const dir = s.swingPp > 0 ? '\u25B2' : '\u25BC';
  return `${dir} **${key.replace('::', ' — ')}**: ${s.prev}% \u2192 ${s.now}% (${s.swingPp > 0 ? '+' : ''}${s.swingPp}pp / ${s.windowHours}h)`;
});
const body = {
  username: 'Vaporware Pool Oracle',
  embeds: [{
    title: '\uD83D\uDCE1 REAL ORACLE SWING ALERT',
    description: lines.join('\n'),
    color: big.some(([, s]) => s.swingPp > 0) ? 0x10b981 : 0xff007f,
    footer: { text: 'parody terminal · real money moving · not financial advice' },
    timestamp: out.synced,
  }],
};
try {
  const res = await fetch(WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  console.log(`alert posted: ${big.length} swing(s)`);
} catch (e) {
  console.warn('webhook post failed (non-fatal):', e.message);
}
process.exit(0);
