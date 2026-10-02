#!/usr/bin/env node
/* Swing detector for the REAL ORACLE: compares the two latest history points
   per market and writes swings.json, which powers the on-site swing badges.
   No webhooks, no external notifications — the website is the destination.
   Never fails the sync job: exit 0 always. */
import { readFileSync, writeFileSync } from 'node:fs';

const THRESHOLD = Number(process.env.SWING_THRESHOLD_PP || 10);

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

console.log('done — swings served on-site only');
process.exit(0);
