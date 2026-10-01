#!/usr/bin/env node
/* Syncs the REAL WIRE: fetches the latest "Gemini 4 Pro" headlines from
   Google News RSS and rewrites wire.json (loaded by app.js at runtime).
   Zero dependencies — run with Node 18+. */
import { writeFileSync } from 'node:fs';

const QUERY = '"Gemini 4 Pro"';
const RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;
const MAX_ITEMS = 8;

const unescape = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const stripCdata = (s) => s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');

const res = await fetch(RSS, { headers: { 'user-agent': 'vaporware-pool-wire-bot' } });
if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
const xml = await res.text();

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
  const block = m[1];
  const get = (tag) => {
    const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return mm ? unescape(stripCdata(mm[1].trim())) : '';
  };
  const rawTitle = get('title');
  const source = get('source');
  const pub = get('pubDate');
  // Google News titles look like "Headline - Source"
  const title = source && rawTitle.endsWith(` - ${source}`)
    ? rawTitle.slice(0, -(source.length + 3))
    : rawTitle.replace(/ - [^-]+$/, '');
  const date = pub ? new Date(pub) : null;
  const d = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : '';
  return { t: title, s: source || 'wire', d };
}).filter((w) => w.t && /gemini/i.test(w.t));

if (!items.length) throw new Error('No items parsed — refusing to blank the wire');

const out = {
  synced: new Date().toISOString(),
  query: QUERY,
  source_feed: RSS,
  items: items.slice(0, MAX_ITEMS),
};
writeFileSync('wire.json', JSON.stringify(out, null, 2) + '\n');
console.log(`wire.json updated: ${out.items.length} items, synced ${out.synced}`);
