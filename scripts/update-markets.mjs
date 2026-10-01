#!/usr/bin/env node
/* Syncs the REAL ORACLE: live prices from public prediction-market APIs
   (Polymarket gamma public-search + Kalshi v2 open events) -> real-markets.json
   Zero dependencies — Node 18+. Displaying public prices is data, not a wager;
   every outbound link still exits via the disclosure interstitial. */
import { writeFileSync } from 'node:fs';

const OUT = 'real-markets.json';
const MAX_PER_PLATFORM = 5;
const UA = { headers: { 'user-agent': 'vaporware-pool-oracle-bot' } };
const items = [];

/* ---- Polymarket (literal Gemini markets live here) ---- */
try {
  const res = await fetch('https://gamma-api.polymarket.com/public-search?q=gemini&limit_per_type=8', UA);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  for (const ev of data.events || []) {
    for (const m of ev.markets || []) {
      if (m.closed || m.active === false) continue;
      if (!/gemini|google/i.test(`${m.question || ''} ${ev.title || ''}`)) continue;
      let prices = [];
      try { prices = JSON.parse(m.outcomePrices || '[]'); } catch { continue; }
      const yes = parseFloat(prices[0]);
      if (!Number.isFinite(yes)) continue;
      const base = (ev.title || m.question || '').replace(/\.{3}$/, '');
      items.push({
        platform: 'Polymarket',
        title: m.groupItemTitle ? `${base} — ${m.groupItemTitle}` : (m.question || base),
        yesPct: Math.round(yes * 1000) / 10,
        volume: Math.round(m.volumeNum || 0),
        url: `https://polymarket.com/event/${ev.slug}`,
      });
    }
  }
} catch (e) { console.warn('polymarket sync skipped:', e.message); }

/* ---- Kalshi (AI-adjacent open events, client-side filtered) ---- */
try {
  const found = [];
  let cursor = '';
  for (let page = 0; page < 2 && found.length < MAX_PER_PLATFORM; page++) {
    const url = 'https://api.elections.kalshi.com/trade-api/v2/events?limit=200&with_nested_markets=true&status=open'
      + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
    const res = await fetch(url, UA);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const ev of data.events || []) {
      const text = `${ev.title || ''} ${ev.sub_title || ''}`;
      if (!/gemini|deepmind|anthropic|openai|artificial intelligence/i.test(text)) continue;
      for (const m of ev.markets || []) {
        if (m.status !== 'active') continue;
        const raw = m.last_price ?? ((m.yes_bid != null && m.yes_ask != null) ? (m.yes_bid + m.yes_ask) / 2 : null);
        if (raw == null) continue;
        const pct = raw <= 1 ? raw * 100 : raw; // cents-vs-dollars safety
        found.push({
          platform: 'Kalshi',
          title: ev.title,
          yesPct: Math.round(pct * 10) / 10,
          volume: m.volume || 0,
          url: `https://kalshi.com/markets/${m.ticker}`,
        });
      }
    }
    cursor = data.cursor || '';
    if (!cursor) break;
  }
  items.push(...found.slice(0, MAX_PER_PLATFORM));
} catch (e) { console.warn('kalshi sync skipped:', e.message); }

const out = {
  synced: new Date().toISOString(),
  items: [
    ...items.filter((i) => i.platform === 'Polymarket').slice(0, MAX_PER_PLATFORM),
    ...items.filter((i) => i.platform === 'Kalshi').slice(0, MAX_PER_PLATFORM),
  ],
};
if (!out.items.length) throw new Error('no real-market items parsed — refusing to blank real-markets.json');
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`real-markets.json updated: ${out.items.length} items, synced ${out.synced}`);
