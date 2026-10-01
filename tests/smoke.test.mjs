#!/usr/bin/env node
/* ============================================================
   VAPORWARE POOL — smoke harness (jsdom)
   Runs the full interaction suite TWICE: normal motion and
   prefers-reduced-motion. No browser required.
   Usage:  npm test        (after: npm install)
           node tests/smoke.test.mjs
   Exit 0 = all green in both modes.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildDOM(reduced) {
  const html = read('index.html')
    .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '')
    .replace(/<script src="https:\/\/unpkg[^"]*" defer><\/script>/, '')
    .replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/, '')
    .replace('<script src="app.js"></script>', '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
  dom.window.matchMedia = (q) => ({ matches: reduced, media: q, addEventListener() {}, removeEventListener() {} });
  dom.window.eval(read('app.js'));
  return dom;
}

async function suite(reduced) {
  const tag = reduced ? '[reduced]' : '[normal] ';
  let failures = 0;
  const check = (name, cond) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${tag} ${name}`);
    if (!cond) failures++;
  };
  const { window } = buildDOM(reduced);
  const doc = window.document;
  await sleep(150); // let DOMContentLoaded fire + init run

  // ---- static render ----
  check('5 market cards rendered', doc.querySelectorAll('.card').length === 5);
  check('hype marquee duplicated', doc.querySelectorAll('#hype-track .marquee-group').length === 2);
  check('odds ticker duplicated', doc.querySelectorAll('#odds-track .marquee-group').length === 2);
  check('feed seeded with 6 items', doc.querySelectorAll('.feed-item').length === 6);
  check('wire items in marquee (7 per group x2)', doc.querySelectorAll('#hype-track .wire-item').length === 14);
  check('wire items labeled WIRE', doc.querySelector('#hype-track .wire-item b').textContent === 'WIRE');
  check('wire sidebar list rendered', doc.querySelectorAll('#wire-list li').length === 5);
  check('wire sync date shown', doc.getElementById('wire-sync-date').textContent.length >= 8);
  check('tokens.css linked', !!doc.querySelector('link[href="tokens.css"]'));
  check('partner rail fail-closed by default', doc.getElementById('partner-card').hidden === true);
  check('disclosure modal built', !!doc.getElementById('disclosure-modal'));
  check('oracle card hidden by default (file:// fallback)', doc.getElementById('oracle-card').hidden === true);
  check('countdown ticking format', /^\d{2,}:\d{2}:\d{2}:\d{2}$/.test(doc.getElementById('countdown').textContent));
  check('book sum computed', /%$/.test(doc.getElementById('book-sum').textContent));
  check('favorite sorted first (summer-2027)', doc.querySelector('.card').dataset.id === 'summer-2027');
  check('rank pill set', doc.querySelector('.card .rank-pill').textContent.includes('FAVORITE'));

  // ---- drawer flow ----
  doc.querySelector('[data-bet="agi-swarm"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(300);
  check('drawer opened', doc.getElementById('bet-drawer').getAttribute('aria-hidden') === 'false');
  check('drawer market synced', doc.getElementById('dm-title').textContent.includes('AGI SELF-COMPILES'));
  check('drawer odds synced', doc.getElementById('dm-odds').textContent === '133.7x');

  const slider = doc.getElementById('lev-slider');
  slider.value = '100';
  slider.dispatchEvent(new window.Event('input', { bubbles: true }));
  await sleep(60);
  check('leverage readout 100x', doc.getElementById('lev-readout').textContent === '100x');
  check('liquidation risk 99%', doc.getElementById('liq-readout').textContent === '99%');

  doc.querySelector('[data-stake="1000"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(1800); // payout spring settle
  check('payout computed (13,370,000)', doc.getElementById('payout').textContent.includes('13,370,000'));

  doc.getElementById('confirm-bet').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(120);
  check('toast emitted', doc.querySelectorAll('.toast').length === 1);
  check('toast says HOPIUM', doc.querySelector('.toast').textContent.includes('+1,000 HOPIUM'));
  check('slip count incremented', doc.getElementById('slip-count').textContent === '1');
  if (reduced) check('confetti suppressed under reduced-motion', doc.querySelectorAll('.confetti').length === 0);
  else check('confetti burst spawned', doc.querySelectorAll('.confetti').length > 20);
  check('own bet in feed', [...doc.querySelectorAll('.feed-item')].some((li) => li.textContent.includes('YOU')));

  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(50);
  check('drawer closed via ESC', doc.getElementById('bet-drawer').getAttribute('aria-hidden') === 'true');

  // ---- disclosure interstitial ----
  window.__vaporware.openDisclosure({ id: 'test', name: 'TestMarket', kind: 'test platform', url: 'https://example.com', minAge: 21 });
  await sleep(60);
  check('disclosure opens with partner copy', !doc.getElementById('disclosure-modal').hidden && doc.getElementById('disclosure-body').textContent.includes('TestMarket'));
  check('disclosure shows age gate', doc.getElementById('disclosure-age').textContent.includes('21+'));
  check('disclosure link is sponsored nofollow', (doc.getElementById('disclosure-go').getAttribute('rel') || '').includes('sponsored'));
  // ---- real oracle render + exit-via-disclosure ----
  window.__vaporware.renderRealOracle([
    { platform: 'Polymarket', title: 'Gemini 4.0 released by...? — October 31', yesPct: 88, volume: 73794, url: 'https://polymarket.com/event/x' },
    { platform: 'Kalshi', title: 'Will OpenAI or Anthropic IPO first?', yesPct: 41, volume: 9000, url: 'https://kalshi.com/markets/x' },
  ], '2026-10-01T00:00:00Z', {
    'Polymarket::Gemini 4.0 released by...? — October 31': [['t1', 80], ['t2', 85], ['t3', 88]],
    'Kalshi::Will OpenAI or Anthropic IPO first?': [['t1', 41]],
  });
  await sleep(50);
  check('oracle rows rendered + card shown', !doc.getElementById('oracle-card').hidden && doc.querySelectorAll('.oracle-row').length === 2);
  check('oracle pct formatting', doc.querySelector('.oracle-pct').textContent.includes('88%'));
  check('sparklines rendered in oracle rows', doc.querySelectorAll('.oracle-spark').length === 2);
  check('sparkline polyline point count', (doc.querySelector('.oracle-spark polyline').getAttribute('points') || '').trim().split(' ').length === 3);
  check('delusion spread computed', doc.getElementById('oracle-diverge').textContent.includes('DELUSION SPREAD') && doc.getElementById('oracle-diverge').textContent.includes('pp of pure copium'));
  doc.querySelector('.oracle-row').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(50);
  check('oracle exit routes via disclosure', !doc.getElementById('disclosure-modal').hidden && doc.getElementById('disclosure-body').textContent.includes('Polymarket'));
  window.__vaporware.closeDisclosure();
  await sleep(300);
  check('disclosure closes', doc.getElementById('disclosure-modal').hidden === true);

  // ---- engine + feed over time ----
  const before = [...doc.querySelectorAll('[data-odds]')].map((n) => n.textContent).join(',');
  await sleep(5600);
  const after = [...doc.querySelectorAll('[data-odds]')].map((n) => n.textContent).join(',');
  check('odds engine mutated values', before !== after);
  check('feed kept flowing', doc.querySelectorAll('.feed-item').length > 6);

  return failures;
}

const failNormal = await suite(false);
const failReduced = await suite(true);
const total = failNormal + failReduced;
console.log(total === 0 ? '\nALL SMOKE TESTS PASSED (normal + reduced-motion)' : `\n${total} FAILURE(S)`);
process.exit(total === 0 ? 0 : 1);
