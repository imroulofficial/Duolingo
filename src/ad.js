// Duolingo Premium Lifetime — 9:16 motion ad.
// Everything on screen is a pure function of time: window.seek(t) poses every
// element for second t. No timers, no CSS transitions, no unseeded randomness,
// so the headless renderer can capture any frame in any order.
(() => {
'use strict';
const CU = window.CUES, C = CU.cue, END = CU.duration;
const W = 360, H = 640;
const G = '#58CC02', GD = '#58A700', GDD = '#46A302', GL = '#89E219';
const EEL = '#4B4B4B', RED = '#FF4B4B', FOX = '#FF9600', BEE = '#FFC800', MACAW = '#1CB0F6', SWAN = '#E5E5E5', HARE = '#AFAFAF';
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ math
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, t0, d) => clamp((t - t0) / d);
const eOut = (p) => 1 - Math.pow(1 - p, 3);
const eIn = (p) => p * p * p;
const eIO = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const eBack = (p) => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
// damped-harmonic step response: 0 -> 1 with physical overshoot (f = Hz, z = damping ratio)
function spring(dt, f = 2.2, z = 0.42) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + (z * w / wd) * Math.sin(wd * dt));
}
const sp = (t, t0, from, to, f, z) => lerp(from, to, spring(t - t0, f, z));
// decaying deterministic shake
function shake(t, t0, dur, amp, seed = 1) {
  const p = (t - t0) / dur;
  if (p < 0 || p > 1) return { x: 0, y: 0, r: 0 };
  const k = amp * Math.pow(1 - p, 2), u = (t - t0) * 60;
  return { x: k * Math.sin(u * 2.9 + seed), y: k * .7 * Math.sin(u * 3.7 + seed * 2), r: k * .12 * Math.sin(u * 2.3 + seed * 3) };
}
function addShake(...s) { return s.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y, r: a.r + b.r }), { x: 0, y: 0, r: 0 }); }
function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// pose an element: (x,y) is where its anchor point (ax,ay in %) lands
function P(el, o = {}) {
  const { x = 0, y = 0, s = 1, sx = 1, sy = 1, r = 0, ax = -50, ay = -50 } = o;
  const op = o.o === undefined ? 1 : clamp(o.o);
  el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) translate(${ax}%,${ay}%) rotate(${r.toFixed(2)}deg) scale(${(s * sx).toFixed(4)},${(s * sy).toFixed(4)})`;
  el.style.opacity = op;
  el.style.visibility = op <= 0.001 || s * sx * sy === 0 ? 'hidden' : 'visible';
}
// pop-in helper: springy scale from `from`, quick fade in
const popS = (t, t0, from = .3, f = 2.6, z = .42) => (t < t0 ? 0 : sp(t, t0, from, 1, f, z));
const popO = (t, t0, d = .08) => prog(t, t0, d);
// Duolingo 3D button press: face moves down 4px while the 4px edge collapses
function press(el, p, base) {
  el.style.borderBottomWidth = (4 * (1 - p)).toFixed(2) + 'px';
  return base + 4 * p;
}

// ------------------------------------------------------------------ icons
function infPath(color, sw = 2.6) {
  let d = '';
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2, den = 1 + Math.sin(a) ** 2;
    d += (i ? 'L' : 'M') + (12 + 10.2 * Math.cos(a) / den).toFixed(2) + ' ' + (6 + 10.2 * Math.sin(a) * Math.cos(a) / den).toFixed(2);
  }
  return `<svg viewBox="0 0 24 12" width="100%" height="100%"><path d="${d}Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/></svg>`;
}
const HEART_D = 'M12 21.6s-8.6-5-10.8-10.4C-.4 7.3 2 3.2 6.1 3.2c2.6 0 4.2 1.5 5.1 3 .4.6 1.2.6 1.6 0 .9-1.5 2.5-3 5.1-3 4.1 0 6.5 4.1 4.9 8C20.6 16.6 12 21.6 12 21.6z';
const heartSvg = (fill, hl = true) => `<svg viewBox="0 0 24 22.6" width="100%" height="100%"><path d="${HEART_D}" fill="${fill}"/>${hl ? '<ellipse cx="6.4" cy="7.6" rx="1.7" ry="1.15" transform="rotate(-35 6.4 7.6)" fill="#fff" opacity=".7"/>' : ''}</svg>`;
const BOLT = (fill = FOX, edge = '#E08600') => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M14.2 1.5 4 13.6h6.8L9.4 22.5 20 10.2h-7z" fill="${fill}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="M13 4.8 7.6 11.3" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/></svg>`;
const ICONS = {
  heart: heartSvg(RED),
  heartgrey: heartSvg('#D7D7D7', false),
  bolt: BOLT(),
  flame: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2c1 3.5 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3 2 3-.5-3 0-6 1-9z" fill="#FF9600"/><path d="M12 12c.6 1.8 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 2-3 .2 1 .6 1.3 1 1.3-.4-1.5-.3-2.7 0-3.8z" fill="#FFC800"/></svg>',
  gem: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 3h12l4 6-10 13L2 9z" fill="#1CB0F6"/><path d="M6 3l3 6h6l3-6M2 9h20M9 9l3 13 3-13" fill="none" stroke="#84D8FF" stroke-width="1.2"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 5l14 14M19 5L5 19" stroke="#AFAFAF" stroke-width="3.2" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 5l14 14M19 5L5 19" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
  crown: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2.5 7.5 7.5 12 12 4l4.5 8 5-4.5-2 12H4.5z" fill="#FFC800" stroke="#E5A800" stroke-width="1" stroke-linejoin="round"/><rect x="4.5" y="17.5" width="15" height="2.6" rx="1.2" fill="#E5A800"/></svg>',
  ad: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="1.5" y="5" width="21" height="14" rx="4" fill="#1CB0F6"/><text x="12" y="15.7" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="8.6" fill="#fff">AD</text></svg>',
  noad: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="2.5" y="6" width="19" height="12" rx="3.5" fill="#1CB0F6"/><text x="12" y="15.2" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="7.6" fill="#fff">AD</text><circle cx="12" cy="12" r="10.4" fill="none" stroke="#FF4B4B" stroke-width="2.6"/><path d="M4.7 4.7 19.3 19.3" stroke="#FF4B4B" stroke-width="2.6" stroke-linecap="round"/></svg>',
  unlock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10.5" width="16" height="12" rx="3.5" fill="#58CC02"/><path d="M8 10.5V7a4 4 0 0 1 7.8-1.2" fill="none" stroke="#58A700" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="16.3" r="1.8" fill="#fff"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4.5" y="10.5" width="15" height="11.5" rx="3.5" fill="#AFAFAF"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#AFAFAF" stroke-width="2.6"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="11" fill="#58CC02"/><path d="M6.8 12.4l3.4 3.4 7-7.2" fill="none" stroke="#fff" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="13" r="9" fill="none" stroke="#fff" stroke-width="2.8"/><path d="M12 8.5V13l3 2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M9 2.5h6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" fill="none" stroke="#1CB0F6" stroke-width="2.8" stroke-linecap="round"/></svg>',
  inf: infPath(RED, 2.9), infO: infPath(FOX, 2.9), infE: infPath(EEL, 2.6), infW: infPath('#fff', 2.4),
};
const COIN = '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="11" fill="#FFC800" stroke="#E5A800" stroke-width="1.6"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#FFE066" stroke-width="1.2"/><text x="12" y="16.4" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="11" fill="#E5A800">৳</text></svg>';
function fillIcons(root = document) {
  root.querySelectorAll('i[data-ico]').forEach((i) => { i.innerHTML = ICONS[i.dataset.ico]; i.style.display = 'block'; i.style.flex = 'none'; });
}

// ------------------------------------------------------------------ owl
// An original, stylised green owl (not an official asset). All expressive
// parts are separate groups so they can be posed per frame.
function owlSVG(id, { thumb = false, outline = 0 } = {}) {
  const eye = (k, cx) => `
    <clipPath id="${id}c${k}"><circle cx="${cx}" cy="92" r="31"/></clipPath>
    <circle cx="${cx}" cy="92" r="31" fill="#fff"/>
    <g id="${id}p${k}"><circle cx="${cx}" cy="94" r="15" fill="${EEL}"/><circle cx="${cx + 5}" cy="88" r="5.2" fill="#fff"/></g>
    <path id="${id}j${k}" d="M${cx - 17} 99 Q${cx} 74 ${cx + 17} 99" fill="none" stroke="${EEL}" stroke-width="9" stroke-linecap="round" style="display:none"/>
    <g clip-path="url(#${id}c${k})"><g id="${id}l${k}"><rect x="${cx - 40}" y="-10" width="80" height="72" fill="${G}"/><path d="M${cx - 40} 62 H${cx + 40}" stroke="${GDD}" stroke-width="5"/></g></g>`;
  const wingR = thumb
    ? `<g id="${id}wr"><path d="M166 120 C184 122 198 112 204 96 L190 88 C186 100 176 106 162 106Z" fill="${GD}"/>
         <rect x="180" y="66" width="44" height="38" rx="13" fill="${GD}"/>
         <rect x="190" y="26" width="18" height="48" rx="9" fill="${GD}"/>
         <path d="M184 80 h34 M184 90 h34" stroke="${GDD}" stroke-width="3" stroke-linecap="round"/></g>`
    : `<g id="${id}wr"><path d="M172 104 C198 132 194 176 170 192 C164 162 160 132 162 104Z" fill="${GD}"/></g>`;
  // white "sticker" outline so the green owl reads on green backgrounds
  return `<svg viewBox="-22 -8 244 236" width="100%">
  <filter id="${id}ol" x="-20%" y="-20%" width="140%" height="140%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="${outline}" result="d"/>
    <feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="o"/>
    <feOffset in="d" dy="5" result="d2"/><feFlood flood-color="${GDD}" flood-opacity=".55"/><feComposite in2="d2" operator="in" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <g filter="${outline ? `url(#${id}ol)` : ''}"><g id="${id}root">
    <path d="M44 66 L30 12 L86 40Z" fill="${G}"/><path d="M156 66 L170 12 L114 40Z" fill="${G}"/>
    <g id="${id}wl"><path d="M28 104 C2 132 6 176 30 192 C36 162 40 132 38 104Z" fill="${GD}"/></g>
    ${wingR}
    <path d="M100 22 C150 22 176 46 178 92 L182 160 C182 202 150 216 100 216 C50 216 18 202 18 160 L22 92 C24 46 50 22 100 22Z" fill="${G}"/>
    <path d="M58 154 C58 128 142 128 142 154 L142 174 C142 206 58 206 58 174Z" fill="${GL}"/>
    <path d="M80 160 l10 8 l10 -8 M100 160 l10 8 l10 -8 M90 178 l10 8 l10 -8" fill="none" stroke="${G}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${eye(0, 70)}${eye(1, 130)}
    <g id="${id}ck" style="display:none"><ellipse cx="40" cy="126" rx="13" ry="7.5" fill="#FF8FA3" opacity=".6"/><ellipse cx="160" cy="126" rx="13" ry="7.5" fill="#FF8FA3" opacity=".6"/></g>
    <path d="M88 116 C94 106 106 106 112 116 C110 132 104 140 100 143 C96 140 90 132 88 116Z" fill="${FOX}"/>
    <path d="M92 117 C97 112 103 112 108 117" fill="none" stroke="#FFB84D" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="78" cy="217" rx="19" ry="9" fill="${FOX}"/><ellipse cx="122" cy="217" rx="19" ry="9" fill="${FOX}"/>
  </g></g></svg>`;
}
// pose: lid 0..1 (eyelid closed amount), tilt deg (+ = sad), look [dx,dy], joy [L,R] (^ eyes), squash, wing angles
function owlPose(id, o = {}) {
  const { lid = 0, tilt = 0, look = [0, 0], joy = [0, 0], squash = 0, wl = 0, wr = 0, cheeks = false } = o;
  const sx = 1 + squash * .12, sy = 1 - squash * .12;
  $(id + 'root').setAttribute('transform', `translate(100 216) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-100 -216)`);
  [0, 1].forEach((k) => {
    const cx = k ? 130 : 70, tl = k ? tilt : -tilt;
    const l = Math.max(lid, joy[k] ? 0 : 0);
    $(id + 'l' + k).setAttribute('transform', `rotate(${tl} ${cx} 92) translate(0 ${(-4 + l * 68).toFixed(2)})`);
    $(id + 'p' + k).setAttribute('transform', `translate(${look[0]} ${look[1]})`);
    $(id + 'p' + k).style.display = joy[k] ? 'none' : '';
    $(id + 'j' + k).style.display = joy[k] ? '' : 'none';
    if (joy[k]) $(id + 'l' + k).setAttribute('transform', `translate(0 -100)`);
  });
  $(id + 'ck').style.display = cheeks ? '' : 'none';
  $(id + 'wl').setAttribute('transform', `rotate(${wl} 34 106)`);
  $(id + 'wr').setAttribute('transform', `rotate(${wr} 166 106)`);
}
const blink = (t, times) => { for (const b of times) { const p = (t - b) / .16; if (p > 0 && p < 1) return Math.sin(p * Math.PI); } return 0; };

const HAND = '<svg viewBox="0 0 72 86" width="100%"><path d="M22 44V11a7.5 7.5 0 0 1 15 0v24a6.5 6.5 0 0 1 12.5 1.5v3a6 6 0 0 1 11.5 2v4a5.5 5.5 0 0 1 10 3v12c0 13-9 22-22 22h-9c-9 0-14-4-18.5-11L5 55a6.5 6.5 0 0 1 10-8z" fill="#fff" stroke="#4B4B4B" stroke-width="3.6" stroke-linejoin="round"/><path d="M37 35v12M49.5 39v9M61 45v7" stroke="#4B4B4B" stroke-width="3" stroke-linecap="round"/></svg>';
const HAND_TIP = [29.5 / 72, 3 / 86]; // fingertip in fractions of the hand box

// ------------------------------------------------------------------ build dynamic DOM
fillIcons();
$('s2owl').innerHTML = owlSVG('ow2');
$('s3owl').innerHTML = owlSVG('ow3', { outline: 6 });
$('s6owl').innerHTML = owlSVG('ow6', { thumb: true, outline: 6 });
$('s2hand').innerHTML = HAND; $('s6hand').innerHTML = HAND;
$('s2hearts').innerHTML = [0, 1, 2, 3, 4].map((i) => `<div style="position:relative;width:40px;height:38px"><div class="a" id="s2h${i}r" style="width:40px;height:38px">${heartSvg(RED)}</div><div class="a" id="s2h${i}g" style="width:40px;height:38px">${heartSvg('#D7D7D7', false)}</div></div>`).join('');

// feature heroes
$('h0').innerHTML = `<div class="a" id="h0heart" style="width:168px;height:158px">${heartSvg(RED)}</div>
  <div class="a" id="h0inf" style="width:92px;height:46px">${ICONS.infW}</div>` +
  [...Array(8)].map((_, i) => `<div class="a" id="h0m${i}" style="width:26px;height:24px">${heartSvg(RED, false)}</div>`).join('');
const RING_R = 82, RING_C = 2 * Math.PI * RING_R;
$('h1').innerHTML = `<svg class="a" id="h1ring" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="${RING_R}" fill="none" stroke="${SWAN}" stroke-width="18"/>
  <circle id="h1arc" cx="100" cy="100" r="${RING_R}" fill="none" stroke="${FOX}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}" transform="rotate(-90 100 100)"/></svg>
  <div class="a" id="h1bolt" style="width:96px;height:96px">${BOLT()}</div>
  <div class="a chip cc" id="h1chip" style="background:${FOX};color:#fff;border-bottom:3px solid #E08600;width:66px;height:30px;padding:0"><div style="width:40px;height:20px">${ICONS.infW}</div></div>`;
$('h2').innerHTML = `<div class="a" id="h2phone" style="width:132px;height:206px;border-radius:24px;background:#fff;border:5px solid ${EEL};overflow:hidden">
    <div style="position:absolute;left:14px;right:14px;top:20px" class="bar"><i style="width:60%"></i></div>
    <div style="position:absolute;left:14px;top:50px;width:72px;height:12px;border-radius:9999px;background:${SWAN}"></div>
    <div style="position:absolute;left:14px;top:72px;width:92px;height:12px;border-radius:9999px;background:${SWAN}"></div>
    <div style="position:absolute;left:14px;right:14px;top:100px;height:30px;border-radius:10px;border:2px solid ${SWAN};border-bottom-width:4px"></div>
    <div style="position:absolute;left:14px;right:14px;bottom:14px;height:28px;border-radius:10px;background:${G};border-bottom:4px solid ${GD}"></div>
    <div class="a cc" id="h2ad" style="width:122px;height:120px;background:${MACAW};color:#fff;font-family:Nunito;font-weight:900;font-size:40px;flex-direction:column;line-height:1">AD<span style="font-size:12px;letter-spacing:.08em;margin-top:6px">SKIP IN 5</span></div>
  </div>
  <div class="a" id="h2no" style="width:120px;height:120px">${ICONS.noad.replace('<rect x="2.5" y="6" width="19" height="12" rx="3.5" fill="#1CB0F6"/><text x="12" y="15.2" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="7.6" fill="#fff">AD</text>', '')}</div>
  <div class="a" id="h2ck" style="width:58px;height:58px">${ICONS.check}</div>`;
const NODES = [[110, 30], [158, 84], [110, 138], [62, 192]];
$('h3').innerHTML = NODES.map((_, i) => `<div class="a node" id="h3n${i}" style="background:#E5E5E5;border-color:#CECECE"><div class="a" id="h3l${i}" style="width:26px;height:26px">${ICONS.lock}</div><div class="a" id="h3s${i}" style="width:32px;height:32px">${ICONS.star}</div></div>`).join('') +
  [...Array(22)].map((_, i) => `<div class="a conf" id="h3c${i}"></div>`).join('');
const FEAT = [['heart', 'আনলিমিটেড হার্টস'], ['bolt', 'আনলিমিটেড এনার্জি'], ['noad', 'কোনো Ads নেই'], ['unlock', 'সব লেসন আনলকড']];
$('frows').innerHTML = FEAT.map(([ic, tx], i) => `<div class="frow a" id="fr${i}"><div class="ic">${ICONS[ic]}</div><div class="tx bn">${tx}</div><div class="ck" id="fk${i}">${ICONS.check}</div></div>`).join('');
$('s5coins').innerHTML = [...Array(16)].map((_, i) => `<div class="a" id="cn${i}" style="width:34px;height:34px">${COIN}</div>`).join('');
const CONF_COLS = [BEE, RED, MACAW, '#CE82FF', '#FFFFFF', FOX];
$('s6conf').innerHTML = [...Array(46)].map((_, i) => `<div class="a conf" id="cf${i}" style="background:${CONF_COLS[i % 6]}"></div>`).join('');
for (let i = 0; i < 22; i++) $('h3c' + i).style.background = CONF_COLS[i % 6];

// deterministic particle tables
const R1 = rng(11), R2 = rng(23), R3 = rng(37);
const COINS = [...Array(16)].map((_, i) => { const a = -Math.PI * (0.06 + 0.88 * (i / 15)) + (R1() - .5) * .25; const v = 260 + R1() * 200; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: (R1() - .5) * 900, d: (i % 4) * .03, s: .75 + R1() * .5 }; });
const CONF6 = [...Array(46)].map(() => ({ x: R2() * 380 - 10, d: R2() * 3.2, v: 120 + R2() * 110, sw: 10 + R2() * 26, f: 1 + R2() * 2, r: R2() * 720, w: R2() > .5 }));
const CONF3 = [...Array(22)].map(() => { const a = R3() * Math.PI * 2, v = 140 + R3() * 170; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, r: R3() * 900 }; });

const sections = ['s1', 's2', 's3', 's4', 's5', 's6'].map($);
const Z = { s1: 1, s2: 2, s3: 3, s4: 4, s5: 6, s6: 5 };
sections.forEach((s) => (s.style.zIndex = Z[s.id]));
const show = (s, on) => { $(s).style.display = on ? 'block' : 'none'; return on; };

// ================================================================== scenes
function scene1(t) {
  if (!show('s1', t < C.s2)) return;
  const sh = addShake(shake(t, C.zero, .45, 8, 1), shake(t, C.t1, .32, 6, 2), shake(t, C.crack, .35, 6, 3));
  P($('s1cam'), { x: 180 + sh.x, y: 320 + sh.y, r: sh.r, s: 1 + .035 * eOut(prog(t, 0, C.s2)) });

  P($('s1bar'), { x: 180, y: 116 });
  const drain = eIn(prog(t, C.t2 + .05, .5));
  $('s1prog').style.width = (lerp(64, 72, eOut(prog(t, 0, .12))) * (1 - drain)) + '%';
  const zeroed = t >= C.zero;
  $('s1hc').textContent = zeroed ? '0' : '1';
  P($('s1stat'), { x: 0, y: 0, ax: 0, ay: 0, s: zeroed ? sp(t, C.zero, 1.6, 1, 3, .35) : 1 + .08 * Math.sin(t * 30) });
  $('s1stat').style.position = 'relative';
  $('s1hc').style.color = t > C.crack ? HARE : RED;

  // giant heart flies out of the counter (already in flight on frame 0)
  const fly = spring(t + .1, 2.4, .5);
  const bs = addShake(shake(t, C.zero, .5, 7, 5));
  const beat = t > C.zero && t < C.crack ? 1 + .05 * Math.max(0, Math.sin((t - C.zero) * 14)) : 1;
  P($('s1heart'), { x: lerp(306, 180, fly) + bs.x, y: lerp(116, 258, fly) + bs.y, s: lerp(.12, 1, fly) * beat, r: bs.r * 4 });
  const cr = spring(t - C.crack, 2.2, .55);
  const grey = t > C.crack + .06;
  $('s1hF').style.display = t < C.crack ? '' : 'none'; // whole heart until it cracks (no seam)
  ['s1hL', 's1hR'].forEach((id, k) => {
    $(id).style.display = t < C.crack ? 'none' : '';
    const sgn = k ? 1 : -1;
    $(id).setAttribute('fill', grey ? '#CFCFCF' : RED);
    $(id).setAttribute('transform', `translate(${sgn * 2.2 * cr} ${1.6 * cr}) rotate(${sgn * 14 * cr} 12 22)`);
  });
  $('s1zero').textContent = zeroed ? '0' : '1';
  P($('s1zero'), { x: 95, y: 82, s: (zeroed ? sp(t, C.zero, .3, 1, 3, .4) : 1), o: 1 - prog(t, C.crack, .1) });

  P($('s1t1'), { x: 180, y: 398, s: t < C.t1 ? 0 : sp(t, C.t1, 2.6, 1, 3.2, .5), o: popO(t, C.t1, .05) });
  P($('s1t2'), { x: 180, y: sp(t, C.t2, 470, 450, 2.6, .5), s: popS(t, C.t2, .7), o: popO(t, C.t2) });
  P($('s1banner'), { x: 0, y: sp(t + .2, 0, 640, 520, 2.2, .7), ax: 0, ay: 0 });
  P($('s1flash'), { x: 0, y: 0, ax: 0, ay: 0, o: t < C.zero ? .3 * (1 - prog(t, 0, .1)) : .38 * (1 - eOut(prog(t, C.zero, .28))) + (t > C.crack ? .22 * (1 - eOut(prog(t, C.crack, .22))) : 0) });
}

function scene2(t) {
  if (!show('s2', t >= C.s2 && t < C.s3 + .02)) return;
  const u = t - C.s2;
  const sh = addShake(shake(t, C.ads, .3, 7, 1), shake(t, C.ads + .3, .3, 7, 2), shake(t, C.ads + .6, .3, 7, 3), shake(t, C.s2 + 1.2, .3, 4, 4));
  // smash-cut punch-in
  P($('s2cam'), { x: 180 + sh.x, y: 320 + sh.y, r: sh.r, s: sp(t, C.s2, 1.14, 1, 3.4, .6) });
  P($('s2bar'), { x: 180, y: 116 });
  const en = Math.round(25 * (1 - eIO(prog(u, .5, .75))));
  $('s2en').textContent = en; $('s2enlbl').textContent = `${en} / 25`;
  $('s2enlbl').style.color = en === 0 ? RED : '#777';
  $('s2ebar').style.width = (100 * (1 - eIO(prog(u, .5, .75)))) + '%';
  $('s2estat').style.color = en === 0 ? HARE : FOX;

  const out1 = prog(t, C.ads - .06, .1);
  P($('s2t1'), { x: 180, y: 196, s: popS(t, C.s2, .8, 3, .5) * (1 - .1 * out1), o: 1 - out1 });
  P($('s2t2'), { x: 180, y: 196, s: t < C.ads ? 0 : sp(t, C.ads, 1.8, 1, 3.2, .45), o: popO(t, C.ads, .05) });

  const cs = shake(t, C.s2 + 1.25, .35, 6, 7);
  P($('s2card'), { x: 180 + cs.x, y: sp(t, C.s2, 400, 352, 2.6, .55), o: popO(t, C.s2, .06) });
  for (let i = 0; i < 5; i++) {
    const tb = C.s2 + .08 + i * .075;
    const broke = t >= tb;
    P($('s2h' + i + 'r'), { x: 20, y: 19, s: broke ? 1 - eIn(prog(t, tb, .1)) : 1, o: broke ? 1 - prog(t, tb, .1) : 1 });
    P($('s2h' + i + 'g'), { x: 20, y: 19, s: broke ? sp(t, tb, 1.4, 1, 3, .4) : 0 });
  }
  // sad owl peeks in from the bottom edge, then looks up at the premium button
  const lookUp = prog(t, C.btn, .2);
  P($('s2owl'), { x: 180, y: sp(t, C.s2 + .35, 760, 606, 2, .55) + 6 * Math.sin(u * 3) });
  owlPose('ow2', { lid: lerp(.42, .25, lookUp), tilt: lerp(18, 8, lookUp), look: [0, lerp(4, -8, lookUp)], squash: .3 * Math.sin(Math.max(0, u - .35) * 9) * Math.exp(-Math.max(0, u - .35) * 5) });

  [[170, 352, -6], [194, 392, 5], [164, 426, -3]].forEach(([x, y, r], i) => {
    const ta = C.ads + i * .3;
    const s = t < ta ? 0 : sp(t, ta, 1.7, 1, 3.4, .5);
    P($('ad' + (i + 1)), { x, y, r: t < ta ? r : lerp(r * 4, r, spring(t - ta, 3, .5)), s, o: popO(t, ta, .05) });
  });
  $('ad1x').textContent = t > C.ads + 1 ? '4' : '5';

  // GET PREMIUM 3D button + finger tap
  const pp = t < C.press ? 0 : (t < C.press + .1 ? eOut(prog(t, C.press, .06)) : 1);
  const btn = $('s2btn');
  const by = press(btn, pp, 458);
  P(btn, { x: 180, y: by, ay: 0, s: (t < C.btn ? 0 : sp(t, C.btn, .4, 1, 2.8, .4)) * (1 + .03 * Math.sin(Math.max(0, t - C.btn) * 12) * (1 - pp)) });
  const hp = eOut(prog(t, C.btn + .1, C.press - C.btn - .1));
  const hx = lerp(340, 284, hp), hy = lerp(660, 494, hp) + (pp > 0 ? 3 : 0);
  P($('s2hand'), { x: hx, y: hy, ax: -HAND_TIP[0] * 100, ay: -HAND_TIP[1] * 100, s: pp > 0 ? .94 : 1, o: prog(t, C.btn + .1, .1), r: -12 });
}

function scene3(t) {
  if (!show('s3', t >= C.flood && t < C.s4 + .05)) return;
  const v = t - C.s3;
  // circle mask grows out of the pressed button
  const rad = lerp(0, 760, eIn(prog(t, C.flood, C.s3 - C.flood)) * .85 + .15 * prog(t, C.flood, C.s3 - C.flood));
  $('s3').style.clipPath = t < C.s3 ? `circle(${rad.toFixed(1)}px at 180px 489px)` : 'none';
  P($('s3rays'), { x: 180, y: 300, r: t * 14, s: sp(t, C.flood, .3, 1, 1.5, .7) });
  P($('s3t1'), { x: 180, y: 142, s: popS(t, C.flood + .12, .5), o: popO(t, C.flood + .12) });
  P($('s3logo'), { x: 180, y: 200, s: t < C.logo ? 0 : sp(t, C.logo, .25, 1, 2.6, .4), sx: 1 + .1 * Math.sin(Math.max(0, t - C.logo) * 16) * Math.exp(-(t - C.logo) * 6), o: popO(t, C.logo) });
  P($('s3badge'), { x: 180, y: 252, s: t < C.logo + .22 ? 0 : sp(t, C.logo + .22, .2, 1, 2.8, .38), r: lerp(-8, 0, spring(t - C.logo - .22, 2.8, .38)) });
  P($('s3shine'), { x: lerp(-40, 190, eIO(prog(t, C.logo + .7, .55))), y: 0, ax: 0, ay: 0 });

  // happy owl jumps in, winks
  const jt = Math.max(0, t - C.s3 - .25);
  const hop = Math.abs(Math.sin(jt * 6.5)) * 16 * Math.exp(-jt * 1.6);
  P($('s3owl'), { x: 286, y: sp(t, C.s3 + .2, 760, 560, 2.4, .5) - hop - 5 * Math.abs(Math.sin(jt * 4)) * (jt > 1.4 ? 1 : 0), r: 8 + 3 * Math.sin(jt * 4) });
  const wink = prog(t, C.s3 + 1.25, .08) * (1 - prog(t, C.s3 + 1.75, .08));
  owlPose('ow3', { joy: [1, wink > .5 ? 1 : 0], cheeks: true, wl: -30 - 25 * Math.sin(jt * 14) * Math.exp(-jt * .8), wr: 10, squash: .4 * Math.sin(jt * 13) * Math.exp(-jt * 4) });

  // status card: 0 -> ∞, empty -> ∞, ads ON -> OFF
  const morph = eIO(prog(t, C.s4 - .3, .3));
  const card = $('s3card');
  P(card, { x: 180, y: sp(t, C.s3 + .3, 760, 392, 2.2, .6) });
  $('s3inner').style.opacity = 1 - prog(t, C.s4 - .3, .1);
  const [r0, r1, r2] = C.rows;
  P($('v1a'), { x: 48, y: 22, s: t < r0 ? 1 : 1 - eIn(prog(t, r0, .12)) });
  P($('v1b'), { x: 48, y: 22, s: t < r0 + .05 ? 0 : sp(t, r0 + .05, .2, 1, 3, .38) });
  $('v2bar').style.width = (100 * clamp(spring(t - r1, 2.8, .5), 0, 1)) + '%';
  $('v2bar').parentElement.parentElement.style.opacity = 1 - prog(t, r1 + .3, .1);
  P($('v2b'), { x: 48, y: 22, s: t < r1 + .32 ? 0 : sp(t, r1 + .32, .2, 1, 3, .38) });
  const s3s = shake(t, r2 - .15, .18, 3, 4);
  P($('v3a'), { x: 0, y: 0, ax: 0, ay: 0, s: t < r2 ? 1 : 1 - eIn(prog(t, r2, .1)), r: s3s.x * 3 });
  P($('v3b'), { x: 0, y: 0, ax: 0, ay: 0, s: t < r2 + .05 ? 0 : sp(t, r2 + .05, .2, 1, 3, .38) });

  // card morphs into the white feature screen
  const g = $('s3grow');
  if (morph > 0) {
    const L = lerp(24, 0, morph), T = lerp(288, 0, morph), Wd = lerp(312, 360, morph), Hd = lerp(208, 640, morph);
    Object.assign(g.style, { left: L + 'px', top: T + 'px', width: Wd + 'px', height: Hd + 'px', borderRadius: lerp(16, 0, morph) + 'px', display: 'block' });
    card.style.visibility = 'hidden';
  } else g.style.display = 'none';
}

function scene4(t) {
  const panP = eIO(prog(t, C.s5, .42));
  if (!show('s4', t >= C.s4 && panP < 1)) return;
  $('s4').style.transform = `translateY(${(-640 * panP).toFixed(2)}px)`;
  const F = C.feat;
  const cur = Math.max(0, F.filter((f) => t >= f).length - 1);
  P($('s4cam'), { x: 180, y: 320, s: 1 + .03 * eOut(prog(t, F[cur], 1.0)) - .03 * eIn(prog(t, (F[cur + 1] || 1e9) - .06, .06)) });
  const k = F.filter((f) => t >= f + .2).length;
  P($('s4bar'), { x: 180, y: 112, o: popO(t, C.s4, .1) });
  let fill = 0;
  F.forEach((f, i) => { fill += .25 * spring(t - f - .2, 2.4, .42); });
  $('s4prog').style.width = (100 * Math.max(0, fill)) + '%';
  $('s4cnt').textContent = `${k}/4`;

  for (let i = 0; i < 4; i++) {
    const a = F[i], b = i < 3 ? F[i + 1] : 1e9;
    const out = prog(t, b - .02, .14);
    const vis = t >= a && out < 1;
    const s = vis ? sp(t, a, .35, 1, 2.6, .42) * (1 - .4 * eIn(out)) : 0;
    P($('h' + i), { x: 180, y: 252, s, o: 1 - out });
    const ft = $('ft' + i);
    P(ft, { x: 180, y: sp(t, a + .04, 398, 380, 2.6, .5), s: vis ? sp(t, a + .04, .6, 1, 2.8, .45) : 0, o: popO(t, a + .04) * (1 - out) });
    const rp = t >= a + .08 ? spring(t - a - .08, 2.4, .6) : 0;
    P($('fr' + i), { x: 180 + 40 * (1 - rp), y: 418 + i * 35, o: popO(t, a + .08, .1) });
    P($('fk' + i), { x: 0, y: 0, ax: 0, ay: 0, s: t < a + .3 ? 0 : sp(t, a + .3, .2, 1, 3, .38) });
    $('fk' + i).style.position = 'relative';
  }
  // hero 0: heart + ∞, mini hearts burst
  { const a = F[0], u = t - a;
    P($('h0heart'), { x: 110, y: 112, s: 1 + .06 * Math.max(0, Math.sin(u * 9)) });
    P($('h0inf'), { x: 110, y: 104, s: u < .18 ? 0 : sp(t, a + .18, .2, 1, 3, .38) });
    for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2 - Math.PI / 2, d = 70 + 52 * eOut(prog(u, .1, .55));
      P($('h0m' + i), { x: 110 + Math.cos(ang) * d, y: 112 + Math.sin(ang) * d * .9, s: u < .1 ? 0 : .7 + .3 * spring(u - .1), o: 1 - prog(u, .5, .25) }); } }
  // hero 1: energy ring refills, ∞ chip
  { const a = F[1], u = t - a;
    P($('h1ring'), { x: 110, y: 110 });
    $('h1arc').setAttribute('stroke-dashoffset', (RING_C * (1 - clamp(spring(u - .05, 1.8, .7)))).toFixed(1));
    P($('h1bolt'), { x: 110, y: 108, s: u < .45 ? .9 : sp(t, a + .45, 1.35, 1, 3, .35), r: u < .45 ? 0 : 10 * Math.sin((u - .45) * 20) * Math.exp(-(u - .45) * 5) });
    P($('h1chip'), { x: 110, y: 190, s: u < .5 ? 0 : sp(t, a + .5, .2, 1, 3, .4) }); }
  // hero 2: phone; AD gets stamped out and flicked away
  { const a = F[2], u = t - a;
    P($('h2phone'), { x: 110, y: 110 });
    const fl = eIn(prog(u, .42, .22));
    P($('h2ad'), { x: 61 + 180 * fl, y: 120 - 60 * fl, r: 35 * fl, ax: -50, ay: -50 });
    P($('h2no'), { x: 110 + 180 * fl, y: 120 - 60 * fl, s: u < .14 ? 0 : sp(t, a + .14, 2.2, 1, 3.4, .5), r: 35 * fl, o: popO(t, a + .14, .04) * (1 - fl) });
    P($('h2ck'), { x: 170, y: 22, s: u < .6 ? 0 : sp(t, a + .6, .2, 1, 3, .38) }); }
  // hero 3: lesson path nodes unlock one by one + confetti
  { const a = F[3], u = t - a;
    NODES.forEach(([x, y], i) => {
      const tu = .1 + i * .11, on = u >= tu;
      const n = $('h3n' + i);
      n.style.background = on ? G : '#E5E5E5'; n.style.borderColor = on ? GD : '#CECECE';
      P(n, { x, y, s: on ? sp(t, a + tu, 1.35, 1, 3.2, .4) : 1 });
      P($('h3l' + i), { x: 31, y: 25, s: on ? 0 : 1 });
      P($('h3s' + i), { x: 31, y: 25, s: on ? sp(t, a + tu, .2, 1, 3, .4) : 0 });
    });
    const cu = u - .5;
    CONF3.forEach((c, i) => { P($('h3c' + i), { x: 110 + c.vx * cu, y: 110 + c.vy * cu + 260 * cu * cu, r: c.r * cu, o: cu > 0 ? 1 - prog(cu, .6, .3) : 0 }); }); }
}

function scene5(t) {
  const m = eIO(prog(t, C.s6 - .36, .36));
  if (!show('s5', t >= C.s5 && t < C.s6)) return;
  const panP = eIO(prog(t, C.s5, .42));
  $('s5').style.transform = `translateY(${(640 * (1 - panP)).toFixed(2)}px)`;
  // morph: the white offer screen shrinks into the CTA card
  $('s5').style.clipPath = m > 0 ? `inset(${lerp(0, 312, m)}px ${lerp(0, 22, m)}px ${lerp(0, 92, m)}px ${lerp(0, 22, m)}px round ${lerp(0, 16, m)}px)` : 'none';
  const sh = addShake(shake(t, C.price, .38, 9, 1), shake(t, C.stamp, .3, 6, 2));
  P($('s5cam'), { x: 180 + sh.x, y: 320 + sh.y, r: sh.r, s: 1 + .02 * eOut(prog(t, C.price, 2.2)), o: 1 - prog(t, C.s6 - .36, .12) });
  P($('s5chip'), { x: 180, y: 128, s: popS(t, C.s5 + .2, .4) * (1 + .035 * Math.max(0, Math.sin((t - C.s5) * 7))) });
  P($('s5name'), { x: 180, y: 174, s: popS(t, C.s5 + .3, .6), o: popO(t, C.s5 + .3) });
  P($('s5old'), { x: 146, y: 228, s: popS(t, C.old, .6), o: popO(t, C.old) });
  $('s5strike').style.width = (eOut(prog(t, C.old + .18, .22)) * 118) + 'px';
  P($('s5strike'), { x: 0, y: -4, ax: 0, ay: -50 });
  P($('s5price'), { x: 170, y: 344, s: t < C.price ? 0 : sp(t, C.price, 2.4, 1, 3.2, .45) * (1 + .025 * Math.sin(Math.max(0, t - C.price - .6) * 5)), o: popO(t, C.price, .04) });
  P($('s5stamp'), { x: 292, y: 252, s: t < C.stamp ? 0 : sp(t, C.stamp, 3, 1, 3.6, .5), r: t < C.stamp ? -40 : lerp(-50, -14, spring(t - C.stamp, 3.6, .5)) + 4 * Math.sin(Math.max(0, t - C.stamp - .5) * 4), o: popO(t, C.stamp, .04) });
  P($('s5coins'), { x: 0, y: 0, ax: 0, ay: 0 });
  COINS.forEach((c, i) => { const u = t - C.price - c.d;
    P($('cn' + i), { x: 180 + c.vx * u, y: 344 + c.vy * u + 520 * u * u, r: c.r * u, s: u > 0 ? c.s : 0, o: u > 0 ? 1 - prog(u, .7, .2) : 0 }); });
  P($('s5pills'), { x: 180, y: 446 });
  P($('s5p1'), { x: 0, y: 0, ax: 0, ay: 0, s: popS(t, C.pills, .3) });
  P($('s5p2'), { x: 0, y: 0, ax: 0, ay: 0, s: popS(t, C.pills + .14, .3) });
  $('s5p1').style.position = $('s5p2').style.position = 'relative';
  P($('s5sub'), { x: 180, y: sp(t, C.pills + .32, 500, 488, 2.6, .5), o: popO(t, C.pills + .32, .1) });
}

function scene6(t) {
  if (!show('s6', t >= C.s6 - .36)) return;
  const z = t - C.s6;
  P($('s6rays'), { x: 180, y: 190, r: t * 10 });
  CONF6.forEach((c, i) => { const u = z - c.d * .5 + .2;
    const y = -20 + c.v * u; const yy = ((y % 700) + 700) % 700 - 30;
    P($('cf' + i), { x: c.x + c.sw * Math.sin(u * c.f * 2), y: yy, r: c.r + u * 260, sx: c.w ? 1 : Math.abs(Math.cos(u * 5)) + .1, o: u > 0 ? .95 : 0 }); });

  // owl springs up from behind the card, thumbs-up, wink
  const oz = Math.max(0, z - .08);
  const tapBob = C.taps.reduce((a, tp) => a + 6 * Math.max(0, Math.sin(clamp((t - tp) / .3) * Math.PI)), 0);
  P($('s6owl'), { x: 180, y: (t < C.s6 + .08 ? 360 : sp(t, C.s6 + .08, 360, 178, 2.4, .48)) - tapBob, r: 3 * Math.sin(oz * 3) });
  const wk = (t > C.s6 + .95 && t < C.s6 + 1.45) ? 1 : 0;
  owlPose('ow6', { joy: [0, wk], lid: blink(t, [C.s6 + 2.2]) , look: [3, -2], cheeks: true, squash: .5 * Math.sin(oz * 12) * Math.exp(-oz * 4), wl: -8 + 6 * Math.sin(oz * 4), wr: -6 * Math.sin(oz * 5) * Math.exp(-oz * 1.5) });
  P($('s6title'), { x: 180, y: 288, s: t < C.s6 + .2 ? 0 : sp(t, C.s6 + .2, 1.8, 1, 3, .45), o: popO(t, C.s6 + .2, .05) });

  P($('s6card'), { x: 22, y: 312, ax: 0, ay: 0 });
  P($('s6r1'), { x: 20, y: 24, ax: 0, ay: 0, o: popO(t, C.s6 + .02, .12), s: popS(t, C.s6 + .02, .9, 3, .6) });
  // the CTA button: pops, then breathes; physical press on each finger tap
  let pp = 0;
  C.taps.forEach((tp) => { if (t >= tp && t < tp + .32) pp = Math.max(pp, t < tp + .07 ? eOut(prog(t, tp, .07)) : 1 - eOut(prog(t, tp + .14, .18))); });
  const btn = $('s6btn');
  const breathe = t > C.btn6 + .5 ? 1 + .035 * Math.pow(Math.sin((t - C.btn6 - .5) * Math.PI / 1.1), 2) : 1;
  const by = press(btn, pp, 98);
  P(btn, { x: 158, y: by, ay: 0, s: (t < C.btn6 ? 0 : sp(t, C.btn6, .3, 1, 2.6, .38)) * breathe });
  const rp = t > C.btn6 + .5 ? ((t - C.btn6 - .5) % 1.1) / 1.1 : -1;
  const ring = $('s6ring');
  if (rp >= 0) { const g = 3 + 10 * eOut(rp); Object.assign(ring.style, { left: (20 - g) + 'px', top: (98 - g) + 'px', width: (276 + 2 * g) + 'px', height: (66 + 2 * g) + 'px', borderRadius: (12 + g) + 'px', opacity: (.55 * (1 - rp)).toFixed(3), display: 'block' }); }
  else ring.style.display = 'none';
  P($('s6url'), { x: 158, y: sp(t, C.btn6 + .25, 210, 200, 2.6, .5), o: popO(t, C.btn6 + .25, .12) });

  // finger glides in and taps the button
  if (C.taps.length) {
    // glides in, taps, then gets out of the way so the URL stays clear for the final hold
    const t0 = C.taps[0] - .55, tl = C.taps[C.taps.length - 1] + .3;
    const hp = eOut(prog(t, t0, .45)) - eIn(prog(t, tl, .4));
    const hx = lerp(390, 252, hp), hy = lerp(720, 438, hp) + 4 * pp;
    P($('s6hand'), { x: hx, y: hy, ax: -HAND_TIP[0] * 100, ay: -HAND_TIP[1] * 100, s: 1 - .07 * pp, r: -16, o: prog(t, t0, .1) });
  }
}

window.seek = (t) => {
  t = clamp(t, 0, END);
  scene1(t); scene2(t); scene3(t); scene4(t); scene5(t); scene6(t);
};
window.DURATION = END;
window.seek(0);
})();
