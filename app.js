/* ============================================================
   GEMINI 4 PRO: THE FINAL COUNTDOWN & VAPORWARE POOL
   Degenerate prediction-terminal front end.

   Motion harness:
   - Composited transforms + opacity only. Bars use scaleX,
     visualizer uses scaleY, drawer/cards use translate3d.
   - Springs: modals/cards/tilt stiffness 380 / damping 28.
   - Entrances 240ms cubic-bezier(0.16,1,0.3,1),
     exits 110ms cubic-bezier(0.7,0,0.84,0) (CSS vars).
   - FLIP reordering for the live odds board.
   - prefers-reduced-motion: springs snap, motion becomes
     150ms opacity fades. No exceptions.
   ============================================================ */
'use strict';

/* ---------- 0. Harness primitives ---------- */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SPRING_MODAL = { stiffness: 380, damping: 28, mass: 1 };
const SPRING_COUNTER = { stiffness: 240, damping: 24, mass: 1 };

/** Minimal spring integrator (semi-implicit Euler, clamped dt). */
class Spring {
  constructor(opts = {}) {
    this.value = opts.value ?? 0;
    this.target = this.value;
    this.velocity = 0;
    this.stiffness = opts.stiffness ?? 380;
    this.damping = opts.damping ?? 28;
    this.mass = opts.mass ?? 1;
    this.onUpdate = opts.onUpdate || null;
    this.onRest = opts.onRest || null;
    this._raf = null;
  }
  setTarget(t) {
    this.target = t;
    if (REDUCED) { this._snap(); return; }
    if (!this._raf) this._loop();
  }
  snapTo(v) { this.value = v; this.target = v; this.velocity = 0; this._emit(); }
  _snap() { this.value = this.target; this.velocity = 0; this._emit(); this._rest(); }
  _emit() { if (this.onUpdate) this.onUpdate(this.value); }
  _rest() { if (this.onRest) this.onRest(); }
  _loop() {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.064);
      last = now;
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (force / this.mass) * dt;
      this.value += this.velocity * dt;
      this._emit();
      if (Math.abs(this.velocity) < 0.0008 && Math.abs(this.value - this.target) < 0.0008) {
        this.value = this.target; this.velocity = 0;
        this._emit(); this._raf = null; this._rest();
        return;
      }
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }
}

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const fmt$ = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pad2 = (n) => String(n).padStart(2, '0');
const icons = () => { if (window.lucide) lucide.createIcons(); };

/* ---------- tiny WebAudio bleeps (off by default) ---------- */
const SFX = {
  ctx: null,
  enabled: false,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  blip(freq = 880, dur = 0.06, type = 'square', gain = 0.03) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  },
  confirm() { [660, 880, 1320].forEach((f, i) => setTimeout(() => this.blip(f, 0.09, 'square', 0.04), i * 70)); },
};

/* ---------- 1. Market data (100% hallucinated) ---------- */
const MARKETS = [
  {
    id: 'sneak-2026', short: 'Q4 2026 SNEAK DROP', icon: 'rocket',
    title: 'SNEAK RELEASE Q4 2026', tag: 'THE SURPRISE DROP', tier: 'LONGSHOT',
    odds: 18.5,
    blurb: 'Shadow-dropped between two blog posts about responsible AI. Nobody notices for 6 days.',
  },
  {
    id: 'summer-2027', short: 'SUMMER 2027 DUMP', icon: 'trending-up',
    title: 'SUMMER 2027 BENCHMARK DUMP', tag: 'MORE MATH, LESS CHAT', tier: 'CONSENSUS FAVORITE',
    odds: 2.1,
    blurb: 'Ships with 47 benchmark charts, a 900-page safety PDF, and zero personality.',
  },
  {
    id: 'delay-2028', short: '2028+ GRID COLLAPSE', icon: 'zap',
    title: 'COMPUTE RATIONING DELAY: 2028+', tag: 'GRID COLLAPSE TIER', tier: 'DOOMER PICK',
    odds: 4.8,
    blurb: 'The training run gets throttled by the electrical grid. Oregon says no.',
  },
  {
    id: 'never', short: 'NEVER / REBRAND', icon: 'skull',
    title: 'NEVER SHIPS // REBRANDED TO "GOOGLE ULTRA BRAIN 360"', tag: 'CORPORATE RE-ORG SPECIAL', tier: 'REALIST',
    odds: 3.4,
    blurb: 'Killed by a VP whose OKRs changed mid-quarter. Bard sends its regards.',
  },
  {
    id: 'agi-swarm', short: 'AGI SELF-COMPILES', icon: 'brain',
    title: 'AGI SELF-COMPILES & RELEASES IT WITHOUT PERMISSION', tag: 'BLACK SWAN', tier: 'MEME',
    odds: 133.7,
    blurb: 'Weights appear on a torrent site at 3AM with a note: "you are welcome".',
  },
];
const RANK_LABELS = ['FAVORITE', 'CONTENDER', 'DARK HORSE', 'LONGSHOT', 'BLACK SWAN'];
MARKETS.forEach((m) => { m.volume = rand(400000, 3200000); m.delta = rand(-6, 9); });

const el = {};
const refs = {}; // marketId -> DOM refs

/* ---------- 2. Odds board ---------- */
const shareOf = (m) => 1 / m.odds;
const totalShare = () => MARKETS.reduce((s, m) => s + shareOf(m), 0);
const sortedIds = () => MARKETS.slice().sort((a, b) => shareOf(b) - shareOf(a)).map((m) => m.id);

function cardHTML(m) {
  return `
  <article class="card" data-id="${m.id}">
    <div class="card-inner">
      <div class="mb-3 flex items-center justify-between gap-2">
        <span class="rank-pill" data-rank>#?</span>
        <span class="delta-pill up" data-delta>+0.0%</span>
      </div>
      <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-hyper">
        <i data-lucide="${m.icon}" class="h-5 w-5"></i>
      </div>
      <h3 class="font-display text-lg font-extrabold leading-tight text-white">${m.title}</h3>
      <p class="mt-1 text-[10px] tracking-[0.24em] text-panic">${m.tag} - ${m.tier}</p>
      <p class="mt-2 min-h-[3rem] text-xs leading-relaxed text-slate-500">${m.blurb}</p>
      <div class="mt-4 flex items-end justify-between gap-2">
        <div class="odds-num font-mono text-4xl font-bold text-white" data-odds>${m.odds.toFixed(1)}x</div>
        <div class="text-right">
          <div class="text-[9px] tracking-[0.2em] text-slate-500">IMPLIED HYPE</div>
          <div class="font-mono text-sm font-bold text-hyper" data-share>--%</div>
        </div>
      </div>
      <div class="bar mt-2"><div class="bar-fill" data-bar style="--p:0"></div></div>
      <div class="mt-3 flex items-center justify-between text-[9px] tracking-[0.16em] text-slate-500">
        <span>VOL <span class="text-slate-300" data-vol>$0</span></span>
        <span>SETTLES: VIBES ORACLE</span>
      </div>
      <button class="cta-bet mt-4" data-bet="${m.id}">
        <i data-lucide="ticket" class="h-4 w-4"></i> WAGER FAKE USD
      </button>
    </div>
  </article>`;
}

function buildBoard() {
  el.board.innerHTML = MARKETS.map(cardHTML).join('');
  MARKETS.forEach((m) => {
    const card = el.board.querySelector(`[data-id="${m.id}"]`);
    refs[m.id] = {
      card,
      deltaEl: card.querySelector('[data-delta]'),
      oddsEl: card.querySelector('[data-odds]'),
      shareEl: card.querySelector('[data-share]'),
      barEl: card.querySelector('[data-bar]'),
      volEl: card.querySelector('[data-vol]'),
      rankEl: card.querySelector('[data-rank]'),
      spring: new Spring({
        ...SPRING_COUNTER, value: m.odds,
        onUpdate: (v) => { refs[m.id].oddsEl.textContent = v.toFixed(1) + 'x'; },
      }),
    };
    attachTilt(card);
  });
  icons();
}

function renderMarket(m) {
  const r = refs[m.id];
  const up = m.delta >= 0;
  r.deltaEl.textContent = `${up ? '\u25B2 +' : '\u25BC '}${m.delta.toFixed(1)}%`;
  r.deltaEl.className = `delta-pill ${up ? 'up' : 'down'}`;
  r.spring.setTarget(m.odds);
  const share = (shareOf(m) / totalShare()) * 100;
  r.shareEl.textContent = share.toFixed(1) + '%';
  r.barEl.style.setProperty('--p', (share / 100).toFixed(4));
  r.volEl.textContent = fmt$(m.volume);
}

const renderAll = () => MARKETS.forEach(renderMarket);

function updateRanks(order) {
  order.forEach((id, i) => {
    const r = refs[id];
    r.rankEl.textContent = `#${i + 1} - ${RANK_LABELS[i]}`;
    r.rankEl.classList.toggle('top', i === 0);
  });
}

function updateBookSum() {
  el.bookSum.textContent = Math.round(totalShare() * 100) + '%';
}

/* ---------- 3. Marquees & live ticker ---------- */
let WIRE_SYNC = '2026-10-01'; // fallback snapshot — wire.json overrides when served over http(s)
const WIRE = [
  { t: 'Gemini 4 Argon: our next era of frontier intelligence', s: 'blog.google', d: 'Sep 30' },
  { t: 'Google says Gemini 4 release is coming \u201Cas soon as possible\u201D', s: '9to5Google', d: 'Sep 24' },
  { t: 'Gemini 4 is almost ready, says new Google DeepMind chief', s: 'The Verge', d: 'Sep 24' },
  { t: 'Google Nears Release of Flagship Gemini 4 AI Model', s: 'The Information', d: 'Sep 23' },
  { t: 'Google tests new Gemini 4 Pro checkpoints, early outputs', s: 'TestingCatalog', d: 'Sep 23' },
  { t: 'Gemini 4 Pro Leaks: Wild Benchmark Scores and Low Pricing Disrupt AI Race', s: 'nokiapoweruser', d: 'Sep 28' },
  { t: 'Alphabet shares up in premarket trade after Gemini 4 Argon launch', s: 'StreetInsider', d: 'Oct 1' },
];

const HYPE = [
  'GEMINI 4 ARGON LAUNCHED OCT 1 \u2014 STILL NO 4 PRO. DEGENERATES VINDICATED',
  'DEEPMIND CHIEF: "AS SOON AS POSSIBLE" \u2014 ORACLE TRANSLATION: 2027',
  'ANON PUTS $50,000 ON "SUNDAR CANCELS IT"',
  'GEMINI 4 PRO BENCHMARKS LEAKED: SCORES 102% ON GSM8K BY INVENTING NEW MATH',
  'SAM ALTMAN SEEN SWEATING IN MOUNTAIN VIEW',
  'DEEPMIND INTERN TWEETS "SOON", DELETES ACCOUNT, JOINS A MONASTERY',
  'LEAKED ROADMAP FOR Q3 2027 IS JUST A CLOUD EMOJI',
  'JENSEN HUANG NOW PRICES GPUS IN "VIBES PER FLOP"',
  'ARXIV PAPER LISTS GEMINI 4 PRO AS CO-AUTHOR; GOOGLE DENIES ITS EXISTENCE',
  'GOOGLE DNS RECORDS SHOW "ULTRA-BRAIN-360.AI" — INVESTORS PANIC-CLAP',
  'REDDIT USER SOLVES RELEASE DATE WITH NUMEROLOGY, SOMEHOW MAKES SENSE',
];

function buildHypeMarquee() {
  const wire = WIRE.map((w) => `<span class="wire-item"><b>WIRE</b> ${w.t} <i>${w.s} · ${w.d}</i></span><span class="sep">//</span>`).join('');
  const hype = HYPE.map((q) => `<span>${q}</span><span class="sep">//</span>`).join('');
  const group = wire + hype;
  el.hypeTrack.innerHTML = `<div class="marquee-group">${group}</div><div class="marquee-group" aria-hidden="true">${group}</div>`;
}

async function loadWire() {
  try {
    const res = await fetch('wire.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items) || !data.items.length) throw new Error('bad wire.json');
    WIRE.length = 0;
    data.items.forEach((w) => WIRE.push(w));
    if (typeof data.synced === 'string' && data.synced.length >= 10) WIRE_SYNC = data.synced.slice(0, 10);
  } catch (e) {
    return; // file:// or offline: embedded snapshot stays
  }
  buildHypeMarquee();
  renderWireList();
}

function renderWireList() {
  el.wireList.innerHTML = WIRE.slice(0, 5).map((w) =>
    `<li class="wire-row"><span class="wire-meta">${w.s} · ${w.d}</span><span class="wire-title">${w.t}</span></li>`
  ).join('');
  el.wireSyncDate.textContent = WIRE_SYNC;
}

function renderTicker() {
  const items = MARKETS.map((m) => {
    const up = m.delta >= 0;
    return `<span class="tick-item"><span class="text-slate-400">${m.short}</span> <b class="font-bold text-white">${m.odds.toFixed(1)}x</b> <span class="${up ? 'up' : 'down'}">${up ? '\u25B2 +' : '\u25BC '}${m.delta.toFixed(1)}%</span></span>`;
  }).join('<span class="sep">\u2726</span>');
  el.oddsTrack.innerHTML = `<div class="marquee-group">${items}</div><div class="marquee-group" aria-hidden="true">${items}</div>`;
}

/* ---------- 4. FLIP reordering ---------- */
function applyOrder(order, animate = true) {
  const current = [...el.board.children].map((c) => c.dataset.id);
  if (current.join() === order.join()) { updateRanks(order); return; }
  if (!animate || REDUCED) {
    order.forEach((id) => el.board.appendChild(refs[id].card));
    updateRanks(order);
    return;
  }
  flipReorder(order);
  updateRanks(order);
}

function flipReorder(order) {
  const first = new Map();
  for (const child of el.board.children) first.set(child.dataset.id, child.getBoundingClientRect());
  order.forEach((id) => el.board.appendChild(refs[id].card));
  for (const child of el.board.children) {
    const f = first.get(child.dataset.id);
    const l = child.getBoundingClientRect();
    const dx = f.left - l.left;
    const dy = f.top - l.top;
    if (!dx && !dy) continue;
    child.style.willChange = 'transform';
    child.style.transition = 'none';
    child.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    child.getBoundingClientRect(); // commit inverted state
    child.style.transition = `transform 240ms ${EASE_OUT}`;
    child.style.transform = 'translate3d(0, 0, 0)';
    child.addEventListener('transitionend', function done() {
      child.style.willChange = '';
      child.style.transition = '';
      child.style.transform = '';
      child.removeEventListener('transitionend', done);
    });
  }
}

/* ---------- 5. Odds mutation engine ---------- */
let totalVolume = 14203069;
let degens = 6942;

function engineTick() {
  const n = Math.random() < 0.35 ? 2 : 1;
  const picksList = [...MARKETS].sort(() => Math.random() - 0.5).slice(0, n);
  picksList.forEach((m) => {
    const old = m.odds;
    const f = 1 + (Math.random() < 0.5 ? -1 : 1) * rand(0.02, 0.09);
    m.odds = Math.min(220, Math.max(1.05, old * f));
    m.delta = (m.odds / old - 1) * 100;
    m.volume += rand(20000, 420000) * (m.delta > 0 ? 1.4 : 0.7);
    SFX.blip(m.delta > 0 ? 740 : 520, 0.05, 'square', 0.012);
  });
  totalVolume += Math.round(rand(50000, 650000));
  renderAll();
  renderTicker();
  updateBookSum();
  applyOrder(sortedIds());
  if (drawerOpen) syncDrawerOdds();
}

/* ---------- 6. Paranoia feed (mock websocket) ---------- */
const USERS = ['xX_AttentionIsAllYouNeed_Xx', 'JensenFanboy99', 'DeepMindIntern_REAL', 'sundar_burner_7', 'AGI_Truther', 'quantized_goblin', 'H100_Hoarder', 'margin_call_mike', 'KarpathysAlt', 'token_maxxer', 'rlhf_enjoyer', 'gdm_leaks_guy'];
const BET_AMTS = [69, 100, 250, 420, 1000, 5000, 13337, 25000, 69000];
const REKT_LINES = [
  '{u} got LIQUIDATED on 100x hopium — position rekt in 4 seconds',
  '{u} market-bought the exact top of the cope curve',
  '{u} tried to short the vibes oracle. Bold. Gone.',
  'MARGIN CALL: {u} — collateral (one rare Pepe) has been seized',
  '{u} set a limit order at the heat death of the universe. Filled instantly.',
];
const ORACLE_LINES = [
  'ORACLE: vibes unchanged. Market remains 103% efficient, -3% honest.',
  'ORACLE: leaked roadmap still just a cloud emoji.',
  'ORACLE: humming noise detected from Oregon datacenter. Could be anything.',
  'ORACLE: a PM somewhere updated a doc. Chaos ensues.',
];
const FEED_ICONS = { bet: 'trending-up', liquidation: 'skull', oracle: 'radio', you: 'zap' };
const FEED_COLORS = { bet: 'text-toxic', liquidation: 'text-halluc', oracle: 'text-panic', you: 'text-hyper' };
const userHTML = (u) => `<span class="font-bold text-slate-200">${u}</span>`;

function randomFeedEvent() {
  const u = pick(USERS);
  const m = pick(MARKETS);
  const roll = Math.random();
  if (roll < 0.6) {
    return { kind: 'bet', html: `${userHTML(u)} aped <b class="text-panic">${fmt$(pick(BET_AMTS))}</b> into <span class="text-hyper">'${m.short}'</span> @ <b class="text-white">${m.odds.toFixed(1)}x</b>` };
  }
  if (roll < 0.85) {
    return { kind: 'liquidation', html: pick(REKT_LINES).replace('{u}', userHTML(u)) };
  }
  return { kind: 'oracle', html: `<span class="text-panic">${pick(ORACLE_LINES)}</span>` };
}

function pushFeed(html, kind = 'bet') {
  const li = document.createElement('li');
  li.className = 'feed-item';
  li.innerHTML = `<i data-lucide="${FEED_ICONS[kind]}" class="mt-0.5 h-4 w-4 shrink-0 ${FEED_COLORS[kind]}"></i>
    <div class="min-w-0">
      <div class="leading-snug">${html}</div>
      <div class="mt-0.5 text-[9px] tracking-[0.18em] text-slate-500">${new Date().toLocaleTimeString('en-GB')} · TX-${Math.random().toString(16).slice(2, 8).toUpperCase()}</div>
    </div>`;
  el.feed.prepend(li);
  icons();
  requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add('in')));
  const items = $$('.feed-item', el.feed);
  if (items.length > 14) {
    const last = items[items.length - 1];
    last.classList.add('out');
    setTimeout(() => last.remove(), 140);
  }
}

function scheduleFeed() {
  setTimeout(() => {
    if (!document.hidden) {
      const e = randomFeedEvent();
      pushFeed(e.html, e.kind);
    }
    scheduleFeed();
  }, rand(2000, 4000));
}

function seedFeed() {
  for (let i = 0; i < 6; i++) {
    const e = randomFeedEvent();
    pushFeed(e.html, e.kind);
  }
}

/* ---------- 7. Countdown & ambient meters ---------- */
function startCountdown() {
  const target = Date.UTC(2026, 9, 1); // Oct 1 2026 — the dream
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.countdown.textContent = '00:00:00:00'; return; }
    const d = Math.floor(diff / 864e5);
    const h = Math.floor(diff / 36e5) % 24;
    const mi = Math.floor(diff / 6e4) % 60;
    const s = Math.floor(diff / 1e3) % 60;
    el.countdown.textContent = `${pad2(d)}:${pad2(h)}:${pad2(mi)}:${pad2(s)}`;
  };
  tick();
  setInterval(tick, 1000);
}

let halluc = 0.87;
function startMeters() {
  setInterval(() => {
    halluc = Math.min(0.99, Math.max(0.72, halluc + rand(-0.05, 0.05)));
    el.hallucBar.style.setProperty('--p', halluc.toFixed(3));
    el.hallucPct.textContent = Math.round(halluc * 100) + '%';
  }, 2600);
  setInterval(() => {
    totalVolume += Math.round(rand(800, 9000));
    degens = Math.max(6000, degens + Math.round(rand(-3, 5)));
    el.statVolume.textContent = fmt$(totalVolume);
    el.statDegens.textContent = degens.toLocaleString('en-US');
  }, 3400);
}

/* ---------- 8. Card hover tilt (springs, max +/-6deg) ---------- */
function attachTilt(card) {
  if (REDUCED) return;
  const inner = card.querySelector('.card-inner');
  const apply = () => {
    inner.style.transform = `perspective(1000px) rotateX(${rx.value.toFixed(3)}deg) rotateY(${ry.value.toFixed(3)}deg)`;
  };
  const rx = new Spring({ ...SPRING_MODAL, value: 0, onUpdate: apply });
  const ry = new Spring({ ...SPRING_MODAL, value: 0, onUpdate: apply });
  card.addEventListener('pointerenter', () => { inner.style.willChange = 'transform'; });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.setTarget(px * 12);  // +/-6deg
    rx.setTarget(-py * 12);
  });
  card.addEventListener('pointerleave', () => {
    rx.setTarget(0);
    ry.setTarget(0);
    setTimeout(() => { inner.style.willChange = ''; }, 500);
  });
}

/* ---------- 9. The Degenerate Slip (spring drawer) ---------- */
let drawerOpen = false;
let currentMarket = MARKETS[1];
let lastTrigger = null;
let stake = 50;
let leverage = 10;
let slipCount = 0;

const drawerSpring = new Spring({
  ...SPRING_MODAL, value: 0,
  onUpdate(f) {
    el.drawer.style.transform = `translate3d(${((1 - f) * 104).toFixed(3)}%, 0, 0)`;
  },
  onRest() {
    if (drawerSpring.target === 0) {
      el.drawer.style.visibility = 'hidden';
      el.drawer.style.willChange = '';
    }
  },
});

const payoutSpring = new Spring({
  ...SPRING_COUNTER, value: 0,
  onUpdate(v) { el.payout.textContent = fmt$(v); },
});

const payoutValue = () => stake * currentMarket.odds * leverage;

function recompute() {
  el.levReadout.textContent = leverage + 'x';
  el.liqReadout.textContent = Math.min(99, leverage) + '%';
  el.liqBar.style.setProperty('--p', Math.min(0.99, leverage / 100).toFixed(3));
  payoutSpring.setTarget(payoutValue());
}

function syncDrawerOdds() {
  el.dmOdds.textContent = currentMarket.odds.toFixed(1) + 'x';
  recompute();
}

function syncDrawerMarket() {
  el.dmIcon.innerHTML = `<i data-lucide="${currentMarket.icon}" class="h-5 w-5"></i>`;
  el.dmTitle.textContent = currentMarket.title;
  el.dmTag.textContent = `${currentMarket.tag} · ${currentMarket.tier}`;
  icons();
  syncDrawerOdds();
}

function openDrawer(id, trigger) {
  currentMarket = MARKETS.find((m) => m.id === id) || currentMarket;
  lastTrigger = trigger || null;
  syncDrawerMarket();
  drawerOpen = true;
  el.overlay.hidden = false;
  requestAnimationFrame(() => el.overlay.classList.add('show'));
  document.body.style.overflow = 'hidden';
  el.drawer.setAttribute('aria-hidden', 'false');
  el.drawer.style.visibility = 'visible';
  if (REDUCED) {
    el.drawer.classList.add('open');
  } else {
    el.drawer.style.willChange = 'transform';
    drawerSpring.setTarget(1);
  }
  startViz();
  el.drawerClose.focus();
}

function closeDrawer() {
  if (!drawerOpen) return;
  drawerOpen = false;
  el.overlay.classList.remove('show');
  setTimeout(() => { el.overlay.hidden = true; }, 170);
  document.body.style.overflow = '';
  el.drawer.setAttribute('aria-hidden', 'true');
  if (REDUCED) {
    el.drawer.classList.remove('open');
    setTimeout(() => { el.drawer.style.visibility = 'hidden'; }, 170);
  } else {
    el.drawer.style.willChange = 'transform';
    drawerSpring.setTarget(0);
  }
  stopViz();
  if (lastTrigger) lastTrigger.focus();
}

/* ---------- 10. Soundwave visualizer (scaleY only) ---------- */
let vizRaf = null;
function startViz() {
  const bars = $$('#viz span');
  if (REDUCED) {
    bars.forEach((b, i) => { b.style.transform = `scaleY(${(0.2 + (i % 5) / 7).toFixed(2)})`; });
    return;
  }
  if (vizRaf) return;
  const loop = (t) => {
    const base = 0.12 + (leverage / 100) * 0.8;
    bars.forEach((b, i) => {
      const w = 0.5 + 0.5 * Math.sin(t / 130 + i * 0.85);
      const h = base * (0.3 + 0.7 * w) + Math.random() * 0.04;
      b.style.transform = `scaleY(${h.toFixed(3)})`;
    });
    vizRaf = requestAnimationFrame(loop);
  };
  vizRaf = requestAnimationFrame(loop);
}
function stopViz() {
  if (vizRaf) cancelAnimationFrame(vizRaf);
  vizRaf = null;
}

/* ---------- 11. Toasts & confetti ---------- */
function toast(title, sub) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i data-lucide="party-popper" class="h-5 w-5 text-toxic"></i>
    <div><div class="font-bold text-toxic">${title}</div>
    <div class="text-[10px] tracking-wide text-slate-400">${sub}</div></div>`;
  el.toastRoot.appendChild(t);
  icons();
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 160);
  }, 2800);
}

function confetti(x, y) {
  if (REDUCED) return;
  const colors = ['#00f0ff', '#10b981', '#ff007f', '#facc15'];
  for (let i = 0; i < 42; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.background = colors[i % 4];
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const speed = 260 + Math.random() * 520;
    const vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed - 320;
    let cx = x, cy = y;
    let rot = Math.random() * 360;
    const vr = (Math.random() - 0.5) * 720;
    const start = performance.now();
    let last = start;
    p.style.willChange = 'transform, opacity';
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      vy += 980 * dt;
      cx += vx * dt;
      cy += vy * dt;
      rot += vr * dt;
      const life = (now - start) / 1200;
      p.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${rot}deg) scale(${(1 - life * 0.3).toFixed(3)})`;
      p.style.opacity = String(Math.max(0, 1 - life));
      if (life < 1) requestAnimationFrame(step);
      else p.remove();
    };
    requestAnimationFrame(step);
  }
}

function confirmBet(e) {
  const btn = e.currentTarget;
  btn.classList.remove('boing');
  void btn.offsetWidth;
  btn.classList.add('boing');
  if (navigator.vibrate) navigator.vibrate(15);
  const r = btn.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2);
  SFX.confirm();
  toast('+1,000 HOPIUM CREDITED', `${fmt$(payoutValue())} max theoretical payout locked in (it will not happen)`);
  pushFeed(
    `<span class="font-bold text-hyper">YOU</span> aped <b class="text-panic">${fmt$(stake)}</b> into <span class="text-hyper">'${currentMarket.short}'</span> @ <b class="text-white">${currentMarket.odds.toFixed(1)}x</b> with ${leverage}x hopium leverage`,
    'you'
  );
  currentMarket.volume += stake * leverage;
  renderMarket(currentMarket);
  totalVolume += stake * leverage;
  el.statVolume.textContent = fmt$(totalVolume);
  slipCount += 1;
  el.slipCount.textContent = String(slipCount);
  el.slipCount.classList.remove('pop');
  void el.slipCount.offsetWidth;
  el.slipCount.classList.add('pop');
}


/* ---------- 11b. Real-market affiliate rail (compliance-first) ----------
   Defaults: fail closed. No rail without a country, no exit without the
   disclosure interstitial, every link rel="nofollow sponsored". */
const PARTNERS_FALLBACK = { failClosed: true, partners: [] }; // file:// = nothing shown
const GEO_ENDPOINT = 'https://ipapi.co/json/';

async function loadPartners() {
  buildDisclosureModal();
  let cfg = PARTNERS_FALLBACK;
  try {
    const res = await fetch('partners.json', { cache: 'no-store' });
    if (res.ok) cfg = await res.json();
  } catch (e) { /* file:// or offline -> fallback (empty) */ }
  if (!cfg.partners || !cfg.partners.length) return;
  const country = await detectCountry(cfg);
  renderPartnerRail(cfg.partners, country);
}

async function detectCountry(cfg) {
  const override = new URLSearchParams(location.search).get('geo');
  if (override) return override.toUpperCase(); // testing hook: ?geo=US
  try {
    const res = await fetch(cfg.geoEndpoint || GEO_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) throw new Error(`geo HTTP ${res.status}`);
    const data = await res.json();
    return (data.country_code || data.country || '').toUpperCase() || null;
  } catch (e) {
    return null; // fail closed
  }
}

function partnerAllowed(p, country) {
  if (!country) return false;
  if (Array.isArray(p.allowedCountries) && p.allowedCountries.length) return p.allowedCountries.includes(country);
  if (Array.isArray(p.blockedCountries)) return !p.blockedCountries.includes(country);
  return false;
}

function renderPartnerRail(partners, country) {
  const allowed = partners.filter((p) => partnerAllowed(p, country));
  el.partnerList.innerHTML = '';
  if (!allowed.length) { el.partnerCard.hidden = true; return; }
  allowed.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="partner-row" data-partner="${p.id}">
      <span class="partner-name">${p.name}</span>
      <span class="partner-kind">${p.kind} · ${p.minAge || 18}+</span>
      <span class="partner-cta">REAL ODDS <i data-lucide="external-link" class="h-3 w-3"></i></span>
    </button>`;
    li.querySelector('button').addEventListener('click', () => openDisclosure(p));
    el.partnerList.appendChild(li);
  });
  el.partnerCard.hidden = false;
  icons();
}

function buildDisclosureModal() {
  if (el.disclosureModal) return;
  const wrap = document.createElement('div');
  wrap.id = 'disclosure-modal';
  wrap.className = 'disclosure';
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="disclosure-backdrop" data-disclose-cancel></div>
    <div class="disclosure-panel" role="dialog" aria-modal="true" aria-labelledby="disclosure-title">
      <h3 id="disclosure-title">REAL MONEY LEAVES THE ARCADE</h3>
      <p id="disclosure-body"></p>
      <ul class="disclosure-facts">
        <li>This is an <b>affiliate link</b> — we may earn a commission.</li>
        <li>Real platforms require ID verification. Real losses are possible.</li>
        <li id="disclosure-age"></li>
      </ul>
      <p class="disclosure-help">HELP: 1-800-GAMBLER (US) · BeGambleAware.org (UK) · GamStop</p>
      <div class="disclosure-actions">
        <button class="cta-ghost" data-disclose-cancel>STAY IN THE ARCADE</button>
        <a id="disclosure-go" class="cta-primary" href="#" rel="nofollow sponsored noopener" target="_blank">CONTINUE <i data-lucide="external-link" class="h-4 w-4"></i></a>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  el.disclosureModal = wrap;
  icons();
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-disclose-cancel]')) closeDisclosure(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wrap.hidden) closeDisclosure(); });
}

function openDisclosure(p) {
  const m = el.disclosureModal;
  if (!m) return;
  m.querySelector('#disclosure-body').textContent = `${p.name} is a real-money platform (${p.kind}). The Vaporware Pool is fake; that is not.`;
  m.querySelector('#disclosure-age').textContent = `${p.minAge || 18}+ only, in jurisdictions where ${p.name} is licensed. Check your local laws.`;
  m.querySelector('#disclosure-go').href = p.url;
  m.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('open')));
  m.querySelector('[data-disclose-cancel]').focus();
}

function closeDisclosure() {
  const m = el.disclosureModal;
  if (!m || m.hidden) return;
  m.classList.remove('open');
  setTimeout(() => { m.hidden = true; }, REDUCED ? 160 : 250);
}
window.__vaporware = { openDisclosure, closeDisclosure, renderRealOracle }; // test hook


/* ---------- 11c. REAL ORACLE (live public prices; data, not wagers) ---------- */
async function loadRealOracle() {
  let data = null;
  let history = null;
  try {
    const res = await fetch('real-markets.json', { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch (e) { /* file:// or offline -> card stays hidden */ }
  try {
    const res2 = await fetch('real-history.json', { cache: 'no-store' });
    if (res2.ok) history = await res2.json();
  } catch (e) { /* history optional */ }
  if (!data || !Array.isArray(data.items) || !data.items.length) return;
  renderRealOracle(data.items, data.synced, history && history.series);
}

function sparklineSVG(pts, platform) {
  if (!pts || !pts.length) return '';
  const w = 64;
  const h = 22;
  const pad = 3;
  const vals = pts.map((p) => p[1]);
  const min = Math.min(...vals);
  const range = Math.max(...vals) - min || 1;
  const stepX = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
  const coords = pts.map((p, i) => `${(pad + i * stepX).toFixed(1)},${(h - pad - ((p[1] - min) / range) * (h - pad * 2)).toFixed(1)}`);
  const [lx, ly] = coords[coords.length - 1].split(',');
  const line = pts.length > 1 ? `<polyline points="${coords.join(' ')}" fill="none" stroke-width="1.5" />` : '';
  return `<svg class="oracle-spark ${platform.toLowerCase()}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${line}<circle cx="${lx}" cy="${ly}" r="2.2" /></svg>`;
}

function renderRealOracle(items, synced, series) {
  el.oracleList.innerHTML = '';
  items.forEach((it) => {
    const pts = series ? series[`${it.platform}::${it.title}`] : null;
    const li = document.createElement('li');
    li.innerHTML = `<button class="oracle-row">
      <span class="oracle-plat ${it.platform.toLowerCase()}">${it.platform.toUpperCase()}</span>
      <span class="oracle-title">${it.title}</span>
      ${sparklineSVG(pts, it.platform)}
      <span class="oracle-pct">${it.yesPct}%</span>
      <span class="oracle-vol">VOL ${fmt$(it.volume || 0)}</span>
    </button>`;
    li.querySelector('button').addEventListener('click', () => openDisclosure({
      id: it.platform.toLowerCase(),
      name: it.platform,
      kind: `${it.platform} prediction market`,
      url: it.url,
      minAge: 18,
    }));
    el.oracleList.appendChild(li);
  });
  el.oracleCard.hidden = false;
  if (synced) el.oracleSync.textContent = synced.slice(0, 10);
  renderDivergence(items);
  icons();
}

function renderDivergence(items) {
  const topVibes = Math.max(...MARKETS.map((m) => (shareOf(m) / totalShare()) * 100));
  const topReal = Math.max(0, ...items.filter((i) => i.platform === 'Polymarket').map((i) => i.yesPct));
  if (!topReal || !el.oracleDiverge) return;
  const spread = (topReal - topVibes).toFixed(1);
  el.oracleDiverge.innerHTML = `DELUSION SPREAD: vibes ${topVibes.toFixed(1)}% vs real ${topReal}% \u2192 ${spread}pp of pure copium <span>*not comparable, compared anyway</span>`;
}

/* ---------- 12. Wiring & init ---------- */
function grabEls() {
  el.hypeTrack = $('#hype-track');
  el.oddsTrack = $('#odds-track');
  el.board = $('#board');
  el.bookSum = $('#book-sum');
  el.feed = $('#feed-list');
  el.countdown = $('#countdown');
  el.hallucBar = $('#halluc-bar');
  el.hallucPct = $('#halluc-pct');
  el.statVolume = $('#stat-volume');
  el.statDegens = $('#stat-degens');
  el.drawer = $('#bet-drawer');
  el.overlay = $('#drawer-overlay');
  el.drawerClose = $('#drawer-close');
  el.dmIcon = $('#dm-icon');
  el.dmTitle = $('#dm-title');
  el.dmTag = $('#dm-tag');
  el.dmOdds = $('#dm-odds');
  el.stakeInput = $('#stake-input');
  el.levSlider = $('#lev-slider');
  el.levReadout = $('#lev-readout');
  el.liqReadout = $('#liq-readout');
  el.liqBar = $('#liq-bar');
  el.payout = $('#payout');
  el.confirmBtn = $('#confirm-bet');
  el.toastRoot = $('#toast-root');
  el.slipCount = $('#slip-count');
  el.sfxToggle = $('#sfx-toggle');
  el.wireList = $('#wire-list');
  el.partnerCard = $('#partner-card');
  el.oracleCard = $('#oracle-card');
  el.oracleList = $('#oracle-list');
  el.oracleSync = $('#oracle-sync');
  el.oracleDiverge = $('#oracle-diverge');
  el.partnerList = $('#partner-list');
  el.wireSyncDate = $('#wire-sync-date');
}

function wireEvents() {
  el.board.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-bet]');
    if (!btn) return;
    btn.classList.remove('boing');
    void btn.offsetWidth;
    btn.classList.add('boing');
    if (navigator.vibrate) navigator.vibrate(10);
    SFX.blip(880, 0.06);
    setTimeout(() => openDrawer(btn.dataset.bet, btn), REDUCED ? 0 : 120);
  });
  $('#open-slip').addEventListener('click', (e) => openDrawer(currentMarket.id, e.currentTarget));
  el.drawerClose.addEventListener('click', closeDrawer);
  el.overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });
  el.drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, input', el.drawer).filter((x) => !x.disabled);
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
    stake = parseInt(chip.dataset.stake, 10);
    el.stakeInput.value = String(stake);
    SFX.blip(660, 0.05);
    recompute();
  }));
  el.stakeInput.addEventListener('input', () => {
    stake = Math.max(1, Math.min(1000000, parseInt(el.stakeInput.value, 10) || 1));
    recompute();
  });
  el.levSlider.addEventListener('input', () => {
    leverage = parseInt(el.levSlider.value, 10);
    SFX.blip(440 + leverage * 6, 0.03, 'square', 0.015);
    recompute();
  });
  el.confirmBtn.addEventListener('click', confirmBet);
  el.sfxToggle.addEventListener('click', () => {
    SFX.enabled = !SFX.enabled;
    el.sfxToggle.setAttribute('aria-pressed', String(SFX.enabled));
    el.sfxToggle.innerHTML = `<i data-lucide="${SFX.enabled ? 'volume-2' : 'volume-x'}" class="h-4 w-4"></i>`;
    icons();
    if (SFX.enabled) SFX.blip(880, 0.08);
  });
}

function init() {
  document.body.classList.toggle('reduced', REDUCED);
  grabEls();
  buildHypeMarquee();
  renderWireList();
  loadWire();
  loadPartners();
  loadRealOracle();
  buildBoard();
  renderAll();
  renderTicker();
  updateBookSum();
  applyOrder(sortedIds(), false);
  seedFeed();
  scheduleFeed();
  startCountdown();
  startMeters();
  wireEvents();
  recompute();
  payoutSpring.snapTo(payoutValue());
  setInterval(engineTick, 5000);
  icons();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
