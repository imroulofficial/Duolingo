// Shared design kit: brand colours, icons, the original owl mascot and the
// pointer hand. Used by the video (ad.js) and the listing images (listing.js).
window.KIT = (() => {
'use strict';
const G = '#58CC02', GD = '#58A700', GDD = '#46A302', GL = '#89E219';
const EEL = '#4B4B4B', RED = '#FF4B4B', FOX = '#FF9600', BEE = '#FFC800', MACAW = '#1CB0F6', SWAN = '#E5E5E5', HARE = '#AFAFAF';
const $ = (id) => document.getElementById(id);

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

return { G, GD, GDD, GL, EEL, RED, FOX, BEE, MACAW, SWAN, HARE, infPath, HEART_D, heartSvg, BOLT, ICONS, COIN, fillIcons, owlSVG, owlPose, blink, HAND, HAND_TIP };
})();
