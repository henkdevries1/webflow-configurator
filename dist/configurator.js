/*! Tornante Configurator for Webflow v0.1.0 */
"use strict";(()=>{var ve=Object.defineProperty;var xe=(n,t,e)=>t in n?ve(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var g=(n,t,e)=>xe(n,typeof t!="symbol"?t+"":t,e);var Pt=`/* Tornante Configurator \u2014 default look. Everything is driven by the
   --tcfg-* custom properties below: set them on the configurator element
   (Webflow: Style panel \u2192 Custom properties, or a class) to make it your
   own. Fonts are inherited from the site. Layout follows the width of the
   configurator itself (container queries), not the window, so it works in
   any section. Specificity is kept at one class so a site class wins. */

.tcfg {
  --tcfg-bg: #f6f5f2;
  --tcfg-surface: #ffffff;
  --tcfg-surface-2: #f0eee9;
  --tcfg-text: #16181a;
  --tcfg-muted: rgba(22, 24, 26, 0.62);
  --tcfg-line: rgba(22, 24, 26, 0.12);
  --tcfg-accent: #16181a;
  --tcfg-on-accent: #ffffff;
  --tcfg-stage-bg: #e9e7e1;
  --tcfg-glass: rgba(255, 255, 255, 0.78);
  --tcfg-radius-sm: 8px;
  --tcfg-radius-md: 12px;
  --tcfg-radius-lg: 18px;
  --tcfg-ratio: 16 / 9;
  --tcfg-side-w: clamp(320px, 32%, 440px);
  --tcfg-gap: clamp(16px, 2vw, 28px);
  --tcfg-fade: 0.6s;

  container-type: inline-size;
  container-name: tcfg;
  position: relative;
  color: var(--tcfg-text);
  background: var(--tcfg-bg);
  font: inherit;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}

.tcfg[data-tcfg-theme="dark"] {
  --tcfg-bg: #111312;
  --tcfg-surface: #1a1d1b;
  --tcfg-surface-2: #232724;
  --tcfg-text: #f2eedc;
  --tcfg-muted: rgba(242, 238, 220, 0.64);
  --tcfg-line: rgba(242, 238, 220, 0.12);
  --tcfg-accent: #f2eedc;
  --tcfg-on-accent: #111312;
  --tcfg-stage-bg: #1a1d1b;
  --tcfg-glass: rgba(14, 16, 12, 0.66);
}

.tcfg *,
.tcfg *::before,
.tcfg *::after { box-sizing: border-box; }
.tcfg [hidden] { display: none !important; }
.tcfg button { font: inherit; color: inherit; }

/* Data lists and the forms before they move into the dialog */
[tcfg-element="data"], [data-tcfg-element="data"] { display: none !important; }

.tcfg[aria-busy="true"] {
  min-height: 320px;
  border-radius: var(--tcfg-radius-lg);
  background: linear-gradient(90deg, var(--tcfg-stage-bg), var(--tcfg-surface-2), var(--tcfg-stage-bg));
  background-size: 200% 100%;
  animation: tcfg-pulse 1.4s ease-in-out infinite;
}
@keyframes tcfg-pulse { to { background-position: -200% 0; } }

/* ---------------------------------------------------------------- layout */

.tcfg-layout {
  display: grid;
  gap: var(--tcfg-gap);
  grid-template-columns: minmax(0, 1fr);
}

@container tcfg (min-width: 900px) {
  .tcfg-layout {
    grid-template-columns: minmax(0, 1fr) var(--tcfg-side-w);
    align-items: start;
  }
  .tcfg-viewer { position: sticky; top: var(--tcfg-sticky-top, 16px); }
}

/* ---------------------------------------------------------------- viewer */

.tcfg-viewer { min-width: 0; }
.tcfg-viewer.is-fullscreen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: var(--tcfg-bg);
}

.tcfg-stage {
  position: relative;
  aspect-ratio: var(--tcfg-ratio);
  overflow: hidden;
  border-radius: var(--tcfg-radius-lg);
  background: var(--tcfg-stage-bg);
  outline: none;
  touch-action: pan-y;
  user-select: none;
}
.tcfg-stage:focus-visible { box-shadow: 0 0 0 2px var(--tcfg-bg), 0 0 0 4px var(--tcfg-accent); }
.is-fullscreen .tcfg-stage { width: min(100%, calc((100vh - 140px) * 16 / 9)); margin: 0 auto; }

.tcfg-frames { position: absolute; inset: 0; }
.tcfg-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  z-index: 0;
  transition: opacity var(--tcfg-fade) ease;
  pointer-events: none;
  max-width: none;
}
/* The new render fades in on top; the old one stays until it is covered. */
.tcfg-frame.is-active { opacity: 1; z-index: 2; }
.tcfg-frame.is-leaving { opacity: 0; z-index: 1; transition-delay: var(--tcfg-fade); }

.tcfg-hint,
.tcfg-position {
  position: absolute;
  z-index: 3;
  margin: 0;
  padding: 6px 10px;
  border-radius: var(--tcfg-radius-sm);
  background: var(--tcfg-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 12px;
  color: var(--tcfg-text);
}
.tcfg-hint { top: 12px; left: 12px; right: 64px; width: max-content; max-width: calc(100% - 76px); }
.tcfg-position { bottom: 12px; left: 12px; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; white-space: pre; }
.tcfg-position:empty { display: none; }

.tcfg-arrow,
.tcfg-fs {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tcfg-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tcfg-arrow { top: 50%; transform: translateY(-50%); }
.tcfg-arrow-prev { left: 12px; }
.tcfg-arrow-next { right: 12px; }
.tcfg-fs { top: 12px; right: 12px; }
.tcfg-stage:hover .tcfg-arrow,
.tcfg-stage:hover .tcfg-fs,
.tcfg-stage:focus-within .tcfg-arrow,
.tcfg-stage:focus-within .tcfg-fs { opacity: 1; }
.tcfg-arrow:focus-visible,
.tcfg-fs:focus-visible { opacity: 1; outline: 2px solid var(--tcfg-accent); outline-offset: 2px; }
.tcfg-stage.has-one-view .tcfg-arrow,
.tcfg-stage.is-empty .tcfg-arrow,
.tcfg-stage.is-empty .tcfg-fs { display: none; }
@media (hover: none) {
  .tcfg-arrow, .tcfg-fs { opacity: 1; }
  .tcfg-arrow { display: none; }
}

.tcfg-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  color: var(--tcfg-muted);
}

.tcfg-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  padding: 2px;
}
.tcfg-thumbs::-webkit-scrollbar { display: none; }
.tcfg-thumb-button {
  flex: 0 0 calc((100% - 7 * 8px) / 8);
  min-width: 64px;
  aspect-ratio: var(--tcfg-ratio);
  padding: 0;
  border: 0;
  border-radius: var(--tcfg-radius-sm);
  overflow: hidden;
  background: var(--tcfg-stage-bg);
  cursor: pointer;
  scroll-snap-align: start;
  opacity: 0.62;
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
}
.tcfg-thumb-button img { display: block; width: 100%; height: 100%; object-fit: cover; max-width: none; }
.tcfg-thumb-button:hover { opacity: 0.9; }
.tcfg-thumb-button.is-active { opacity: 1; box-shadow: inset 0 0 0 2px var(--tcfg-accent); }
.tcfg-thumb-button:focus-visible { outline: 2px solid var(--tcfg-accent); outline-offset: 2px; }

.tcfg-note { margin: 8px 0 0; font-size: 12px; color: var(--tcfg-muted); }

/* ---------------------------------------------------------------- options */

.tcfg-panel { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.tcfg-groups { display: flex; flex-direction: column; gap: 12px; }

.tcfg-group {
  padding: 16px;
  border-radius: var(--tcfg-radius-lg);
  background: var(--tcfg-surface);
  border: 1px solid var(--tcfg-line);
}
.tcfg-group-head {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 12px;
  margin-bottom: 12px;
}
.tcfg-group-title { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.3; letter-spacing: 0; }
.tcfg-group-index { font-size: 12px; color: var(--tcfg-muted); font-variant-numeric: tabular-nums; }
.tcfg-group-hint { grid-column: 1 / -1; margin: 2px 0 0; font-size: 12px; color: var(--tcfg-muted); }

/* Paint chips */
.tcfg-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.tcfg-chip {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--tcfg-line);
  border-radius: var(--tcfg-radius-sm);
  background: var(--tcfg-swatch, #777);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.tcfg-chip img { display: block; width: 100%; height: 100%; object-fit: cover; max-width: none; }
.tcfg-chip:hover { transform: translateY(-1px); }
.tcfg-chip.is-active { box-shadow: 0 0 0 2px var(--tcfg-surface), 0 0 0 4px var(--tcfg-accent); }
.tcfg-chip:focus-visible { outline: 2px solid var(--tcfg-accent); outline-offset: 4px; }
.tcfg-paint-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-top: 12px; font-size: 14px; }
.tcfg-paint-name { font-weight: 600; }
.tcfg-paint-note { color: var(--tcfg-muted); font-size: 13px; }
.tcfg-paint-price { margin-left: auto; }

/* Choice and toggle rows */
.tcfg-rows { display: flex; flex-direction: column; gap: 6px; }
.tcfg-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid var(--tcfg-line);
  border-radius: var(--tcfg-radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.tcfg-row:hover { background: var(--tcfg-surface-2); }
.tcfg-row.is-active { border-color: var(--tcfg-accent); background: var(--tcfg-surface-2); }
.tcfg-row:focus-visible { outline: 2px solid var(--tcfg-accent); outline-offset: 2px; }
.tcfg-thumb {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  overflow: hidden;
  background: var(--tcfg-surface-2);
  color: var(--tcfg-muted);
}
.tcfg-thumb img { width: 100%; height: 100%; object-fit: cover; max-width: none; }
.tcfg-row-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.tcfg-row-name { font-size: 14px; font-weight: 500; }
.tcfg-row-sub { font-size: 12px; color: var(--tcfg-muted); }
.tcfg-price { font-size: 13px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.tcfg-vat { color: var(--tcfg-muted); font-size: 11px; }

.tcfg-radio {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--tcfg-muted);
  transition: border 0.15s ease;
}
.tcfg-row.is-active .tcfg-radio { border: 5px solid var(--tcfg-accent); }

.tcfg-switch {
  position: relative;
  flex: 0 0 36px;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--tcfg-line);
  transition: background 0.2s ease;
}
.tcfg-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--tcfg-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}
.tcfg-row.is-active .tcfg-switch { background: var(--tcfg-accent); }
.tcfg-row.is-active .tcfg-switch::after { transform: translateX(16px); }

/* ---------------------------------------------------------------- summary */

.tcfg-summary {
  position: sticky;
  bottom: 0;
  z-index: 4;
  padding: 16px;
  border-radius: var(--tcfg-radius-lg);
  background: var(--tcfg-surface);
  border: 1px solid var(--tcfg-line);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.04);
}
.tcfg-summary-head { display: flex; align-items: center; justify-content: space-between; }
.tcfg-summary-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--tcfg-muted); }
.tcfg-summary-toggle { display: none; padding: 4px; border: 0; background: none; cursor: pointer; transition: transform 0.2s ease; }
.tcfg-summary-text { margin: 6px 0 0; font-size: 14px; }
.tcfg-summary-price { margin: 8px 0 0; font-size: 13px; color: var(--tcfg-muted); }
.tcfg-summary-amount { color: var(--tcfg-text); font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
.tcfg-summary-actions { display: flex; gap: 8px; margin-top: 14px; }
.tcfg-summary-actions:empty { display: none; }

.tcfg-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid var(--tcfg-accent);
  border-radius: var(--tcfg-radius-sm);
  background: var(--tcfg-accent);
  color: var(--tcfg-on-accent) !important;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.tcfg-button:hover { opacity: 0.88; }
.tcfg-button:focus-visible { outline: 2px solid var(--tcfg-accent); outline-offset: 2px; }
.tcfg-button-quiet { background: transparent; color: var(--tcfg-text) !important; border-color: var(--tcfg-line); }
.tcfg-cta { flex: 1; }

/* Narrow: the summary becomes a slim bar at the bottom of the configurator */
@container tcfg (max-width: 899px) {
  /* The car stays in sight while the options scroll under it.
     tcfg-sticky="false" on the configurator switches this off. */
  .tcfg:not([tcfg-sticky="false"]) .tcfg-viewer {
    position: sticky;
    top: var(--tcfg-sticky-top, 0px);
    z-index: 5;
    padding-bottom: 8px;
    background: var(--tcfg-bg);
  }
  .tcfg-thumbs { margin-top: 8px; }
  .tcfg-summary { padding: 12px 14px; }
  .tcfg-summary-toggle { display: block; }
  .tcfg-summary-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tcfg-summary.is-open .tcfg-summary-text { white-space: normal; }
  .tcfg-summary.is-open .tcfg-summary-toggle { transform: rotate(180deg); }
  .tcfg-summary-actions { margin-top: 10px; }
  .tcfg-thumb-button { flex-basis: 64px; }
}

/* ---------------------------------------------------------------- dialog */

.tcfg-dialog {
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 0;
  border-radius: var(--tcfg-radius-lg);
  background: var(--tcfg-surface);
  color: var(--tcfg-text);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
}
.tcfg-dialog::backdrop { background: rgba(10, 12, 11, 0.55); backdrop-filter: blur(2px); }
.tcfg-dialog-panel { position: relative; padding: 28px 24px 24px; }
.tcfg-dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
.tcfg-dialog-close:hover { background: var(--tcfg-surface-2); }
.tcfg-dialog-title { margin: 0 40px 6px 0; font-size: 20px; line-height: 1.25; font-weight: 600; }
.tcfg-dialog-text { margin: 0 0 16px; color: var(--tcfg-muted); font-size: 14px; }
.tcfg-dialog-summary { margin: 0 0 16px; padding: 12px 14px; border-radius: var(--tcfg-radius-md); background: var(--tcfg-surface-2); font-size: 13px; }
.tcfg-dialog-summary p { margin: 0; }
.tcfg-dialog-price { margin-top: 4px !important; color: var(--tcfg-muted); }
.tcfg-dialog .tcfg-form { display: block !important; margin: 0; }

@media (prefers-reduced-motion: reduce) {
  .tcfg { --tcfg-fade: 0.01s; }
  .tcfg *, .tcfg *::before, .tcfg *::after { transition-duration: 0.01s !important; animation: none !important; }
}
`;var Se=/\.(jpe?g|jfif|png|webp|avif|tiff?|heic|gif|svg)$/i,Le=new Set(["basis","base","standaard","default"]),Me=["without","zonder","geen","no"],Ee=["with","plus","met"];function k(n){return n.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")}function lt(n){let t=n.split(/[\\/]+/).filter(Boolean),e=t.pop()??"";return{folders:t,stem:e.replace(/\.[^.]+$/,"")}}function D(n){return n.split(/[\s._\-+()[\]]+/).filter(Boolean)}function B(n,t){let e=n.toLowerCase(),i=t.find(s=>s.code.toLowerCase()===e);if(i)return i.code;if(!/^\d+$/.test(e))return null;let r=Number(e),o=t.find(s=>/^\d+$/.test(s.code)&&Number(s.code)===r);return o?o.code:null}function G(n,t){let e=k(n);if(!e)return null;let i=t.find(r=>k(r.code)===e)??t.find(r=>k(r.name)===e);return i?i.code:null}function Ot(n,t){for(let e of n){let i=G(e,t);if(i)return i}for(let e=2;e<=3;e++)for(let i=0;i+e<=n.length;i++){let r=G(n.slice(i,i+e).join(""),t);if(r)return r}return null}function ct(n,t){let e=t.filter(i=>k(i.code)===n);return e.length?e:t.filter(i=>k(i.name)===n)}function J(n,t){let e=[],i=[],r=!1;for(let o of n.split("+").map(s=>s.trim()).filter(Boolean)){let s=k(o);if(Le.has(s)){r=!0;continue}let a=ct(s,t);if(a.length===1){e.push({option:a[0],on:!0});continue}let l=null;if(!a.length)for(let f of Me){if(s.length<=f.length||!s.startsWith(f))continue;let h=ct(s.slice(f.length),t);if(h.length===1){l=h[0];break}}let u=null;if(!a.length&&!l)for(let f of Ee){if(s.length<=f.length||!s.startsWith(f))continue;let h=ct(s.slice(f.length),t);if(h.length===1){u=h[0];break}}l?e.push({option:l,on:!1}):u?e.push({option:u,on:!0}):i.push(o)}return{named:e,unknown:i,base:r}}function Re(n){return n.on?n.option.name:`zonder ${n.option.name}`}function ut(n,t){if(t.length)return{entries:null,asDefault:[],problem:`Onbekende optie${t.length===1?"":"s"}: ${t.join(", ")}`};let e=new Map;for(let a of n){let l=e.get(a.option.id);if(l&&l.on!==a.on)return{entries:null,asDefault:[],problem:`${a.option.name} staat er zowel m\xE9t als zonder in`};e.set(a.option.id,a)}let i=[...e.values()],r=i.find(a=>a.option.choice&&!a.on);if(r)return{entries:null,asDefault:[],problem:`"zonder ${r.option.name}" kan niet: noem de ${r.option.groupTitle.toLowerCase()} die w\xE9l op de render staat`};let o=new Map;for(let a of i)a.option.choice&&o.set(a.option.group,[...o.get(a.option.group)??[],a.option]);for(let a of o.values())if(a.length>1)return{entries:null,asDefault:[],problem:`E\xE9n optie uit ${a[0].groupTitle} per render: ${a.map(l=>l.name).join(" of ")}?`};let s=a=>a.option.choice?a.option.isDefault:a.on===a.option.isDefault;return{entries:i.filter(a=>!s(a)).map(a=>a.on?a.option.id:`!${a.option.id}`),asDefault:i.filter(s).map(Re),problem:null}}function At(n,t,e,i,r=[]){if(!Se.test(n))return{path:n,paint:null,view:null,entries:null,asDefault:[],paintFrom:null,optionsFrom:null,optionProblem:null,status:"not-image"};let{folders:o,stem:s}=lt(n),a=s,l=null,u=s.lastIndexOf("_");if(u>0&&u<s.length-1){let p=s.slice(0,u),w=s.slice(u+1);!B(w,e)&&D(p).some(v=>B(v,e))&&(a=p,l=w)}let f=D(a),h=null;for(let p=f.length-1;p>=0&&!h;p--)h=B(f[p],e);let y=Ot(f.filter(p=>!/^\d+$/.test(p)),t),L=y?"name":null,M=-1;for(let p=o.length-1;p>=0&&!y;p--)y=G(o[p],t)??Ot(D(o[p]),t),y&&(L="folder",M=p);!y&&i&&t.some(p=>p.code===i)&&(y=i,L="selected");let $=[],P=[],q=null;for(let[p,w]of o.entries()){if(p===M)continue;let v=J(w,r);!(M>=0&&p>M)&&(v.unknown.length||!v.named.length&&!v.base)||($.push(...v.named),P.push(...v.unknown),(v.named.length||v.unknown.length||v.base)&&(q??(q="folder")))}if(l!==null){let p=J(l,r);$.push(...p.named),P.push(...p.unknown),q="name"}let c=ut($,P),m=y?h?c.entries===null?"no-options":"ok":"no-view":"no-paint";return{path:n,paint:y,view:h,entries:c.entries,asDefault:c.asDefault,paintFrom:L,optionsFrom:q,optionProblem:c.problem,status:m}}var Ft={en:{cta:"Enquire",ctaUnlocked:"Send my build",yourBuild:"Your build",showMore:"Show the whole build",showLess:"Show less",indication:"Price indication",included:"Included",standard:"Standard",vat:"excl. VAT",share:"Share",copied:"Link copied",views:"Views",prev:"Previous view",next:"Next view",fullscreen:"View full screen",exitFullscreen:"Exit full screen",close:"Close",loading:"Loading the configurator\u2026",empty:"Renders of this colour are on their way.",partial:"{name}: {n} of {total} views rendered so far.",shown:"Shown {list} \u2014 not rendered yet",with:"with",without:"without",and:"and",optional:"Optional",optionalAny:"Optional \xB7 add any",pickColour:"{n} colours \xB7 pick one",pickOne:"{n} options \xB7 pick one",gateTitle:"See your build",gateText:"Leave your email address to configure the car.",enquiryTitle:"Send your build",enquiryText:"We will get back to you about this build."},nl:{cta:"Informatie aanvragen",ctaUnlocked:"Verstuur mijn configuratie",yourBuild:"Jouw configuratie",showMore:"Toon de hele configuratie",showLess:"Minder tonen",indication:"Prijsindicatie",included:"Inbegrepen",standard:"Standaard",vat:"excl. btw",share:"Delen",copied:"Link gekopieerd",views:"Standpunten",prev:"Vorig standpunt",next:"Volgend standpunt",fullscreen:"Volledig scherm",exitFullscreen:"Volledig scherm sluiten",close:"Sluiten",loading:"De configurator wordt geladen\u2026",empty:"De renders van deze kleur komen eraan.",partial:"{name}: {n} van {total} standpunten gerenderd.",shown:"Getoond {list} \u2014 nog niet gerenderd",with:"met",without:"zonder",and:"en",optional:"Optioneel",optionalAny:"Optioneel \xB7 kies wat je wilt",pickColour:"{n} kleuren \xB7 kies er \xE9\xE9n",pickOne:"{n} opties \xB7 kies er \xE9\xE9n",gateTitle:"Bekijk jouw configuratie",gateText:"Laat je e-mailadres achter om de auto samen te stellen.",enquiryTitle:"Verstuur je configuratie",enquiryText:"We nemen contact met je op over deze configuratie."}};function Ct(n,t={}){let e={...n.toLowerCase().startsWith("nl")?Ft.nl:Ft.en};for(let i of Object.keys(e)){let r=t[i];typeof r=="string"&&r.trim()&&(e[i]=r)}return e}function Y(n,t){return n.replace(/\{(\w+)\}/g,(e,i)=>i in t?String(t[i]):e)}function dt(n,t){return n.length<2?n.join(""):`${n.slice(0,-1).join(", ")} ${t} ${n[n.length-1]}`}var It=n=>n%100===0;function U(n,t){try{return new Intl.NumberFormat(t.locale,{style:"currency",currency:t.currency,minimumFractionDigits:It(n)?0:2,maximumFractionDigits:2}).format(n/100)}catch{return`${t.currency} ${(n/100).toFixed(It(n)?0:2)}`}}var Te=1e9;function qt(n){if(typeof n=="number")return Number.isFinite(n)&&n>=0?Nt(Math.round(n*100)):null;if(typeof n!="string")return null;let t=n.replace(/\u2212/g,"-"),e=t.match(/\d[\d.,\s\u00a0]*\d|\d/g);if(!e||e.length!==1)return null;let i=t.indexOf(e[0]);if(/-\s*(?:[^\d\s]{1,3}\s*)?$/.test(t.slice(0,i)))return null;let r=e[0].replace(/[\s\u00a0]/g,""),o;if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(r)||/^\d+(,\d{1,2})?$/.test(r))o=r.replace(/\./g,"").replace(",",".");else if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(r)||/^\d+(\.\d{1,2})?$/.test(r))o=r.replace(/,/g,"");else return null;let s=Math.round(Number(o)*100);return Number.isFinite(s)&&s>=0?Nt(s):null}function Nt(n){return n>Te?null:n}function Bt(n){let t=new Map;for(let e of n){let i=e.startsWith("!"),r=(i?e.slice(1):e).toLowerCase();t.set(r,i?`!${r}`:r)}return[...t.keys()].sort().map(e=>t.get(e)).join(",")}var $e=new Set(["paint","paints","colour","colours","color","colors","kleur","kleuren","lak","lakken"]);function pt(n){return n.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function Z(n){return typeof n=="boolean"?n:typeof n=="number"?n!==0:typeof n!="string"?!1:["true","yes","ja","on","aan","1","default","standaard","standard"].includes(n.trim().toLowerCase())}function Pe(n,t){let e=typeof n=="string"?k(n):"";return e==="paint"||e==="colour"||e==="color"||e==="kleur"||e==="lak"?"paint":e==="toggle"||e==="switch"||e==="onoff"||e==="aanuit"||e==="checkbox"||e==="extra"||e==="extras"?"toggle":e==="choice"||e==="radio"||e==="single"||e==="keuze"?"choice":$e.has(k(t))?"paint":"choice"}function Ht(n,t){let e=typeof n=="number"?n:typeof n=="string"&&n.trim()?Number(n):NaN;return Number.isFinite(e)?e:t}function x(n){return typeof n=="string"?n.trim():typeof n=="number"?String(n):""}function Oe(n){return n?typeof n=="string"?n.trim()?{src:n.trim(),srcset:null}:null:n.src?{src:n.src,srcset:n.srcset??null}:null:null}function ft(n,t){return n.map((e,i)=>({item:e,key:Ht(t(e),i)})).sort((e,i)=>e.key-i.key).map(e=>e.item)}function zt(n){let t=n.split(/[?#]/)[0].split("/").pop()??"";try{t=decodeURIComponent(t)}catch{}return t.replace(/^(?:[0-9a-f]{24}_)+/i,"").replace(/-p-\d+(?=\.[a-z0-9]+$)/i,"")}function gt(n){let t=[],e=[],i=new Map,r=c=>{let m=k(c);return e.find(p=>k(p.code)===m)??e.find(p=>k(p.title)===m)},o=(c,m)=>{let p=x(c.title)||x(c.code),w=pt(x(c.code)||p)||`group-${m+1}`,v=r(w);if(v)return v;let E={code:w,kind:Pe(c.kind,w),title:p||w,onRenders:c.onRenders===void 0||c.onRenders===""?!0:Z(c.onRenders),options:[]};return e.push(E),i.set(E,Ht(c.sort,1e3+m)),E},s=[];(n.groups??[]).forEach((c,m)=>{let p=o(c,m);for(let w of c.options??[])s.push({group:p,option:w,index:s.length})});for(let c of n.options??[]){let m=x(c.group);if(!m){t.push(`Option "${x(c.name)||x(c.code)}" has no group (tcfg-group); it is skipped.`);continue}let p=r(m)??o({code:m,title:m},e.length);s.push({group:p,option:c,index:s.length})}for(let{group:c,option:m}of ft(s,p=>p.option.sort)){let p=x(m.name)||x(m.code);if(!p){t.push(`An option of "${c.title}" has no name; it is skipped.`);continue}let w=pt(x(m.code)||p);if(c.options.some(E=>E.code===w)){t.push(`"${c.title}" has two options with the code "${w}"; the second is skipped.`);continue}let v={code:w,name:p,note:x(m.note),swatch:x(m.swatch)||null,image:Oe(m.image),isDefault:Z(m.default),priceCents:qt(m.price??null)};c.options.push(v)}for(let c of e){if(c.kind==="toggle")continue;let m=!1;for(let p of c.options)p.isDefault&&m&&(p.isDefault=!1),p.isDefault&&(m=!0)}let a=e.filter(c=>c.kind==="paint");for(let c of a.slice(1))t.push(`Only one paint group is supported; "${c.title}" is treated as a choice.`),c.kind="choice";let l=ft(e,c=>i.get(c)).filter(c=>c.options.length?!0:(t.push(`Group "${c.title}" has no options; it is not shown.`),!1)),u=l.find(c=>c.kind==="paint")??null,f=(n.renders??[]).map(c=>typeof c=="string"?{src:c}:c).filter(c=>c&&c.src),h=u?Ae(u.options):[{code:"_",name:"_"}],y=[];for(let c of l){if(c.kind==="paint"||!c.onRenders)continue;let m=c.kind==="choice"?(c.options.find(p=>p.isDefault)??c.options[0]).code:null;for(let p of c.options)y.push({id:`${c.code}:${p.code}`,code:p.code,name:p.name,group:c.code,groupTitle:c.title,choice:c.kind==="choice",isDefault:c.kind==="choice"?p.code===m:p.isDefault})}let L=ft(n.views??[],c=>c.sort).map((c,m)=>{let p=x(c.code)||String(m+1).padStart(2,"0");return{code:p,name:x(c.name)||p}}).filter((c,m,p)=>p.findIndex(w=>w.code===c.code)===m);L.length||(L=Ie(f));let M=L.map(c=>({code:c.code,name:c.name})),$={},P={};for(let c of f){let m=zt(c.src),p=x(c.paint),w=x(c.view),v=u?p?G(p,h):null:"_";if(u&&p&&!v){t.push(`Render ${m}: unknown paint "${p}".`);continue}let E=At(m,h,M,v,y),R=v??E.paint,F=w?B(w,M)??B(pt(w),M):E.view,I,at=null;if(c.set!==void 0&&c.set!==null){let O=J(x(c.set).replace(/[,;&]/g,"+"),y),V=ut(O.named,O.unknown);I=V.entries,at=V.problem}else I=E.entries,at=E.optionProblem;if(!R){t.push(`Render ${m}: no paint found (name it in the file or set tcfg-paint).`);continue}if(!F){t.push(`Render ${m}: no view found (a number in the file name, or tcfg-view).`);continue}if(!I){t.push(`Render ${m}: ${at??"unknown combination"}.`);continue}let $t={src:c.src,srcset:c.srcset??null};if(I.length){let O=Bt(I),V=P[R]??(P[R]=new Map),X=V.get(O);if(X||V.set(O,X={entries:Fe(I,y),views:{}}),X.views[F]){t.push(`Render ${m}: ${R} view ${F} (${I.join(" + ")}) is given twice; the first is used.`);continue}X.views[F]=$t}else{let O=$[R]??($[R]={});if(O[F]){t.push(`Render ${m}: ${R} view ${F} (base) is given twice; the first is used.`);continue}O[F]=$t}}let q={};for(let[c,m]of Object.entries(P))q[c]=[...m.values()].sort((p,w)=>p.entries.length-w.entries.length);for(let c of t)console.warn(`[tcfg] ${c}`);return{model:{views:L,groups:l,renders:$,renderSets:q},warnings:t}}function Ae(n){let t=n.map(i=>({code:i.code,name:i.name})),e=i=>k(i.name.split(/[\s-]+/)[0]??"");for(let i of n){let r=e(i);r&&n.filter(o=>e(o)===r).length===1&&t.push({code:i.code,name:r})}return t}function Fe(n,t){let e=i=>t.findIndex(r=>r.id===i.replace(/^!/,""));return[...n].sort((i,r)=>e(i)-e(r))}function Ie(n){let t=new Map;for(let e of n){let i=x(e.view);if(!i){let{stem:o}=lt(zt(e.src)),s=o.includes("_")&&!/^\d+$/.test(o.slice(o.lastIndexOf("_")+1))?o.slice(0,o.lastIndexOf("_")):o,a=D(s).filter(l=>/^\d+$/.test(l));i=a.length?a[a.length-1]:""}if(!i)continue;let r=/^\d+$/.test(i)?String(Number(i)):i.toLowerCase();t.has(r)||t.set(r,/^\d+$/.test(i)?String(Number(i)).padStart(2,"0"):i)}return[...t.values()].sort((e,i)=>/^\d+$/.test(e)&&/^\d+$/.test(i)?Number(e)-Number(i):e.localeCompare(i)).map(e=>({code:e,name:e}))}var S="tcfg-element";function N(n,t){return n.getAttribute(`tcfg-${t}`)??n.getAttribute(`data-tcfg-${t}`)}function mt(n){return n.classList.contains("w-dyn-bind-empty")||!!n.closest(".w-condition-invisible")}function ht(n,t){return n.parentElement?.closest(`[${S}],[data-${S}]`)===t}function b(n,t){let e=N(n,t);if(e!==null)return e;for(let i of n.querySelectorAll(`[tcfg-field="${t}"],[data-tcfg-field="${t}"]`)){if(!ht(i,n)||mt(i))continue;let r=(i.textContent??"").trim();if(r)return r}}function Vt(n,t="src"){let e=N(n,t);if(e)return{src:e,srcset:null};let i=n instanceof HTMLImageElement?[n]:[...n.querySelectorAll("img")];for(let r of i){if(r!==n&&!ht(r,n)||mt(r))continue;let o=r.getAttribute("src");if(!(!o||o.startsWith("data:")))return{src:new URL(o,document.baseURI).href,srcset:r.getAttribute("srcset")}}return null}function Ne(n){let t=b(n,"swatch");if(t)return t;for(let e of n.querySelectorAll('[tcfg-field="swatch"],[data-tcfg-field="swatch"]')){if(!ht(e,n)||mt(e))continue;let i=e.style.backgroundColor||getComputedStyle(e).backgroundColor;if(i&&i!=="transparent"&&!/rgba\(0, 0, 0, 0\)/.test(i))return i}}function Ce(n){return n.getAttribute(S)??n.getAttribute(`data-${S}`)}function yt(n,t=n.ownerDocument){let e=["group","option","view","render","json"].map(r=>`[${S}="${r}"],[data-${S}="${r}"]`).join(","),i=[...n.querySelectorAll(e)];return i.length?i:[...t.querySelectorAll(e)].filter(r=>{let o=r.closest(`[${S}="configurator"],[data-${S}="configurator"]`);return!o||o===n})}function Dt(n){let t={groups:[],options:[],views:[],renders:[]};for(let e of yt(n))if(!e.closest(".w-condition-invisible"))switch(Ce(e)){case"json":qe(t,e.textContent??"");break;case"group":t.groups.push({code:b(e,"code"),kind:b(e,"kind"),title:b(e,"title")??b(e,"name"),onRenders:b(e,"renders"),sort:b(e,"sort")});break;case"option":t.options.push({group:b(e,"group"),code:b(e,"code"),name:b(e,"name"),note:b(e,"note"),price:b(e,"price")??null,default:b(e,"default"),swatch:Ne(e)??null,image:Vt(e,"image"),sort:b(e,"sort")});break;case"view":t.views.push({code:b(e,"code"),name:b(e,"name"),sort:b(e,"sort")});break;case"render":{let i=Vt(e);if(!i)break;t.renders.push({src:i.src,srcset:i.srcset,paint:b(e,"paint")||null,view:b(e,"view")||null,set:b(e,"set")||null});break}}return t}function qe(n,t){try{let e=JSON.parse(t);n.groups.push(...e.groups??[]),n.options.push(...e.options??[]),n.views.push(...e.views??[]),n.renders.push(...e.renders??[])}catch(e){console.warn('[tcfg] The tcfg-element="json" block is not valid JSON.',e)}}var Gt=new WeakMap;function wt(n){let t=new URL(n,document.baseURI);for(let e of t.searchParams.keys())if(/_page$/.test(e))return e;return null}function Be(n,t){for(let e of n.querySelectorAll("a.w-pagination-next"))if(wt(e.getAttribute("href")??"")===t)return e;return null}async function He(n,t){let e=wt(t.getAttribute("href")??""),i=n.querySelector(".w-dyn-items");if(!e||!i)return;let r=t.getAttribute("href"),o=new Set;for(let s=0;r&&s<50;s++){let a=new URL(r,document.baseURI).href;if(o.has(a))break;o.add(a);let l=await fetch(a,{credentials:"same-origin"});if(!l.ok)break;let u=new DOMParser().parseFromString(await l.text(),"text/html"),f=Be(u,e),h=f?.closest(".w-dyn-list")?.querySelector(".w-dyn-items")??ze(u,e);if(!h)break;for(let y of[...h.children])i.appendChild(document.importNode(y,!0));r=f?.getAttribute("href")??null}for(let s of n.querySelectorAll(".w-pagination-wrapper"))s.hidden=!0}function ze(n,t){for(let e of n.querySelectorAll("a.w-pagination-previous"))if(wt(e.getAttribute("href")??"")===t)return e.closest(".w-dyn-list")?.querySelector(".w-dyn-items")??null;return null}async function Ut(n){let t=new Set;for(let e of n){let i=e.closest(".w-dyn-list");i&&t.add(i)}await Promise.all([...t].map(e=>{let i=Gt.get(e);if(!i){let r=e.querySelector("a.w-pagination-next");i=r?He(e,r).catch(o=>console.warn("[tcfg] Could not load the next page of a Collection List.",o)):Promise.resolve(),Gt.set(e,i)}return i}))}function bt(n,t){return`${n}:${t}`}function jt(n){let t=n.indexOf(":");return t>0&&t<n.length-1?{group:n.slice(0,t),option:n.slice(t+1)}:null}function Ve(n,t=!0){return t?n:`!${n}`}function vt(n){return n.startsWith("!")?{ref:n.slice(1),on:!1}:{ref:n,on:!0}}function De(n){return n.kind!=="paint"&&n.onRenders!==!1}function _t(n,t){let e=[],i=new Map;for(let r of n)if(!(!De(r)||!r.options.length))if(r.kind==="choice"){let o=(r.options.find(u=>u.isDefault)??r.options[0]).code,s=t.choices[r.code],a=s&&r.options.some(u=>u.code===s)?s:o,l={key:r.code,group:r.code,choice:!0,def:o,chosen:a};e.push(l);for(let u of r.options)i.set(bt(r.code,u.code),{unit:l,value:u.code,rank:i.size})}else{let o=new Set(t.toggles[r.code]??[]);for(let s of r.options){let a=bt(r.code,s.code),l={key:a,group:r.code,choice:!1,def:s.isDefault,chosen:o.has(s.code)};e.push(l),i.set(a,{unit:l,value:!0,rank:i.size})}}return{units:e,refs:i}}function Ge(n,t){return n.choice?bt(n.group,t):Ve(n.key,t)}function Ue(n,t,e){let i=new Map,r=[];for(let s of t.entries){let{ref:a,on:l}=vt(s),u=n.refs.get(a);if(!u||u.unit.choice&&!l)return null;let f=u.unit.choice?u.value:l;if(i.has(u.unit.key)||f!==u.unit.chosen)return null;i.set(u.unit.key,f),r.push(u.rank)}let o=0;for(let s of n.units)(i.has(s.key)?i.get(s.key):s.def)===s.chosen&&o++;return{set:t,index:e,score:o,ranks:r.sort((s,a)=>s-a),explicit:i}}function je(n,t){if(n.score!==t.score)return n.score-t.score;if(n.ranks.length!==t.ranks.length)return t.ranks.length-n.ranks.length;for(let e=0;e<n.ranks.length;e++)if(n.ranks[e]!==t.ranks[e])return t.ranks[e]-n.ranks[e];return t.index-n.index}function Kt(n,t,e,i,r=_t(n,e)){let o=null;for(let l=0;l<t.length;l++){let u=t[l];if(!Object.prototype.hasOwnProperty.call(u.views,i)||u.views[i]==null)continue;let f=Ue(r,u,l);f&&(!o||je(f,o)>0)&&(o=f)}if(!o)return null;let s=o,a=[];for(let l of r.units){let u=s.explicit.has(l.key)?s.explicit.get(l.key):l.def;u!==l.chosen&&a.push(Ge(l,u))}return{image:s.set.views[i],set:s.set,exact:a.length===0,differs:a}}function _e(n,t,e,i){let r=_t(n,e),o=[];for(let s of i){let a=Kt(n,t,e,s,r);a&&o.push({view:s,match:a})}return o}function Wt(n,t){return t?[{entries:[],views:n.renders[t]??{}},...n.renderSets?.[t]??[]]:[]}function Xt(n,t,e){return Kt(n.groups,Wt(n,t.paint),t,e)}function Jt(n,t){return _e(n.groups,Wt(n,t.paint),t,n.views.map(e=>e.code))}function Q(n){return n.groups.find(t=>t.kind==="paint")??null}function Ke(n,t){if(!t.paint)return[];let e=new Map(n.views.map(i=>[i.code,i]));return Jt(n,t).map(({view:i,match:r})=>({view:e.get(i),render:r}))}function H(n,t,e){return e&&t.paint?Xt(n,t,e):null}function C(n,t){return Ke(n,t).map(e=>e.view)}function Yt(n,t,e,i=null){let r=C(n,t);if(!r.length)return null;if(e&&r.some(u=>u.code===e))return e;let o=n.views.map(u=>u.code),s=e?o.indexOf(e):-1;if(s<0)return i&&r.some(u=>u.code===i)?i:r[0].code;let a=r[0].code,l=1/0;for(let u of r){let f=o.indexOf(u.code),h=Math.abs(f-s);(h<l||h===l&&f>s)&&(a=u.code,l=h)}return a}function tt(n,t,e,i){let r=C(n,t);if(!r.length)return null;let o=r.findIndex(a=>a.code===e);if(o<0)return r[0].code;let s=r.length;return r[((o+i)%s+s)%s].code}function Zt(n,t,e){let i=C(n,t).length,r=n.views.length;if(!t.paint||!i||i>=r)return null;let o=Q(n)?.options.find(s=>s.code===t.paint)?.name;return o?Y(e.partial,{name:o,n:i,total:r}):null}function Qt(n,t,e){if(!t||t.exact)return null;let i=[],r=[],o=[];for(let l of t.differs){let{ref:u,on:f}=vt(l),h=jt(u),y=h&&n.groups.find(M=>M.code===h.group),L=y?.options.find(M=>M.code===h.option);!y||!L||(y.kind==="choice"?i.push(te(L,y)):y.kind==="toggle"&&(f?r:o).push(We(L.name)))}let s=[...i,...r],a=[];return s.length&&a.push(`${e.with} ${dt(s,e.and)}`),o.length&&a.push(`${e.without} ${dt(o,e.and)}`),a.length?Y(e.shown,{list:a.join(` ${e.and} `)}):null}function te(n,t){let e=t.title.trim().toLowerCase();return!e||n.name.toLowerCase().includes(e)?n.name:`${n.name} ${e}`}function We(n){return n.replace(/\b([A-Z])([a-z]*)\b/g,(t,e,i)=>e.toLowerCase()+i)}function ee(n,t,e=6){let i=H(n,t,t.view);if(!i)return[];let r=new Set([i.image.src]),o=[];for(let s of n.groups)if(!(s.kind==="paint"||!s.onRenders))for(let a of s.options){let l;if(s.kind==="toggle")l=xt(n,t,s.code,a.code);else{if(t.choices[s.code]===a.code)continue;l={...t,choices:{...t.choices,[s.code]:a.code}}}let u=H(n,l,t.view);if(u&&!r.has(u.image.src)&&(r.add(u.image.src),o.push(u),o.length>=e))return o}return o}function ne(n,t=null){let e={},i={},r=Q(n)?null:"_";for(let o of n.groups)if(o.kind==="toggle")i[o.code]=o.options.filter(s=>s.isDefault).map(s=>s.code);else if(o.options.length){let s=(o.options.find(a=>a.isDefault)??o.options[0]).code;o.kind==="paint"?r=s:e[o.code]=s}return{paint:r,view:Yt(n,{paint:r,choices:e,toggles:i},null,t),choices:e,toggles:i}}function j(n,t,e=null){let i=Yt(n,t,t.view,e);return i===t.view?t:{...t,view:i}}function ie(n,t,e){return j(n,{...t,paint:e})}function re(n,t,e,i){return j(n,{...t,choices:{...t.choices,[e]:i}})}function xt(n,t,e,i){let r=new Set(t.toggles[e]??[]);r.has(i)?r.delete(i):r.add(i);let o=n.groups.find(s=>s.code===e)?.options.map(s=>s.code)??[...r];return j(n,{...t,toggles:{...t.toggles,[e]:o.filter(s=>r.has(s))}})}function kt(n,t){let e=[];for(let i of n.groups)if(i.kind==="paint"){let r=i.options.find(o=>o.code===t.paint);r&&e.push({group:i,option:r})}else if(i.kind==="choice"){let r=i.options.find(o=>o.code===t.choices[i.code]);r&&e.push({group:i,option:r})}else{let r=t.toggles[i.code]??[];for(let o of i.options)r.includes(o.code)&&e.push({group:i,option:o})}return e}function _(n,t){return kt(n,t).map(({group:e,option:i})=>e.kind==="choice"?te(i,e):i.name).join(" \xB7 ")}function oe(n,t){let e=kt(n,t);return n.groups.map(i=>{let r=e.filter(o=>o.group===i).map(o=>o.option.name);return{group:i,value:r.length?r.join(", "):"\u2014"}})}var se=n=>typeof n.priceCents=="number"&&Number.isInteger(n.priceCents)&&n.priceCents>=0;function et(n,t){let e=kt(n,t).map(i=>i.option).filter(se);return e.length?e.reduce((i,r)=>i+r.priceCents,0):null}function nt(n,t,e){return se(n)?n.priceCents===0?e.included:`+ ${U(n.priceCents,t)}`:null}function ae(n,t,e){let i=n.note.trim();return i||(n.isDefault&&nt(n,t,e)===null?e.standard:"")}function ce(n,t){let e=n.options.length;return n.kind==="toggle"?e===1?t.optional:t.optionalAny:Y(n.kind==="paint"?t.pickColour:t.pickOne,{n:e})}function le(n){return{paint:n.paint==="_"?null:n.paint,choices:{...n.choices},toggles:Object.fromEntries(Object.entries(n.toggles).map(([t,e])=>[t,[...e]]))}}function it(n){return n<10?`0${n}`:String(n)}var z="cfg-",ue="none";function rt(n,t,e,i=z){for(let r of n.groups){let o=i+r.code;if(r.kind==="paint")St(e,o,t.paint==="_"?null:t.paint);else if(r.kind==="choice")St(e,o,t.choices[r.code]??null);else{let s=t.toggles[r.code]??[];e.set(o,s.length?s.join("."):ue)}}return St(e,`${i}view`,t.view),e}function St(n,t,e){e?n.set(t,e):n.delete(t)}function de(n,t,e=z){return n.groups.some(i=>t.has(e+i.code))||t.has(`${e}view`)}function Lt(n,t,e,i=z){let r={...t,choices:{...t.choices},toggles:{...t.toggles}};for(let s of n.groups){let a=e.get(i+s.code);if(a===null)continue;let l=new Set(s.options.map(u=>u.code));if(s.kind==="paint")l.has(a)&&(r.paint=a);else if(s.kind==="choice")l.has(a)&&(r.choices[s.code]=a);else{let u=new Set(a===ue?[]:a.split("."));r.toggles[s.code]=s.options.map(f=>f.code).filter(f=>u.has(f))}}let o=e.get(`${i}view`);return o&&n.views.some(s=>s.code===o)&&(r.view=o),r=j(n,r),r}var K=class{constructor(t){g(this,"wrapper");g(this,"form");g(this,"done");g(this,"succeeded",!1);g(this,"submitted",!1);g(this,"listeners",[]);g(this,"observer",null);this.form=t instanceof HTMLFormElement?t:t.querySelector("form");let e=this.form?.closest(".w-form")??null;this.form&&!e&&console.warn("[tcfg] This form is not inside a Webflow Form Block (.w-form); Webflow will not handle it.",t),this.wrapper=e&&e.contains(t)?e:t,this.done=(e??this.wrapper).querySelector(".w-form-done"),this.done&&(this.observer=new MutationObserver(()=>this.check()),this.observer.observe(this.wrapper,{attributes:!0,subtree:!0,attributeFilter:["style","class"]})),this.form?.addEventListener("submit",()=>{this.submitted=!0,(!this.done||!window.Webflow)&&setTimeout(()=>this.success(),0)})}check(){this.submitted&&this.done&&getComputedStyle(this.done).display!=="none"&&this.success()}success(){if(!this.succeeded){this.succeeded=!0;for(let t of this.listeners)t()}}onSuccess(t){this.listeners.push(t)}get email(){return this.form?.querySelector('input[type="email"]')?.value.trim()??""}set email(t){let e=this.form?.querySelector('input[type="email"]');e&&!e.value&&(e.value=t)}focusFirst(){this.form?.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea, select')?.focus()}input(t,e){if(!this.form)return null;let i=this.form.querySelector(`[tcfg-field="${t}"],[data-tcfg-field="${t}"]`);if(i)return i;let r=this.form.querySelector(`input[data-tcfg-auto="${t}"]`);if(!r){r=document.createElement("input"),r.type="hidden",r.name=e,r.setAttribute("data-name",e),r.setAttribute("data-tcfg-auto",t);let o=this.form.querySelectorAll("input[data-tcfg-auto]");o.length?o[o.length-1].after(r):this.form.prepend(r)}return r}fill(t,e){let i=(r,o,s)=>{let a=this.input(r,o);a&&(a.value=s)};i("summary",e.summary,t.summary),i("price",e.price,t.price);for(let r of t.groups)i(r.code,r.title,r.value);i("share-url",e.shareUrl,t.shareUrl),i("config",e.config,t.config)}destroy(){this.observer?.disconnect(),this.listeners=[]}};function Mt(n,t){let e=`[${S}="${t}"],[data-${S}="${t}"]`,i=n.querySelector(e);if(i)return i;let r=N(n,"id");for(let o of document.querySelectorAll(e)){let s=N(o,"for");if(s?s===r:document.querySelectorAll(`[${S}="configurator"],[data-${S}="configurator"]`).length===1)return o}return null}function d(n,t={},...e){let i=document.createElement(n);for(let[r,o]of Object.entries(t))o==null||o===!1||(r==="class"?i.className=String(o):r==="text"?i.textContent=String(o):i.setAttribute(r,o===!0?"":String(o)));for(let r of e)r&&i.append(r);return i}var Xe={prev:'<path d="M15 6l-6 6 6 6"/>',next:'<path d="M9 6l6 6-6 6"/>',expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',shrink:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',share:'<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',chevron:'<path d="M6 15l6-6 6 6"/>',wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/>'};function T(n){let t=document.createElement("span");return t.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Xe[n]??""}</svg>`,t.firstElementChild}function Et(){return typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}function pe(n,t=5e3){return n.complete?Promise.resolve():new Promise(e=>{let i=()=>{clearTimeout(r),n.removeEventListener("load",i),n.removeEventListener("error",i),e()},r=setTimeout(i,t);n.addEventListener("load",i),n.addEventListener("error",i)})}function me(n,t={}){let e=u=>N(n,u),i=(u,f)=>{let h=e(u);return h===null||h===""?f:Z(h)},r=t.lang??e("lang")??(document.documentElement.lang||"en"),o=r.toLowerCase().startsWith("nl"),s={};for(let u of n.getAttributeNames()){let f=/^(?:data-)?tcfg-label-(.+)$/.exec(u);f&&(s[f[1].replace(/-([a-z])/g,(h,y)=>y.toUpperCase())]=n.getAttribute(u)??"")}let a=(t.gate??e("gate")??"").toLowerCase(),l=(t.theme??e("theme")??"light").toLowerCase()==="dark"?"dark":"light";return{id:ge(t.id??e("id")??fe(n)),lang:r,money:{currency:t.currency??e("currency")??"EUR",locale:t.locale??e("locale")??(o?"nl-NL":"en-GB")},showVat:t.showVat??i("vat",!0),showPrices:t.showPrices??i("prices",!0),gate:a==="off"||a==="false"||a==="none"?"off":"first-change",url:t.url??i("url",!0),urlPrefix:t.urlPrefix??e("url-prefix")??(Je()>1?`${z}${ge(t.id??e("id")??fe(n))}-`:z),startView:t.startView??e("start-view"),theme:l,thumbs:t.thumbs??i("thumbs",!0),fullscreen:t.fullscreen??i("fullscreen",!0),share:t.share??i("share",!0),labels:Ct(r,{...s,...t.labels??{}}),fieldNames:{summary:o?"Configuratie":"Configuration",config:o?"Configuratiecode":"Configuration code",price:o?"Prijsindicatie":"Price indication",shareUrl:o?"Link naar configuratie":"Share link",...t.fieldNames??{}}}}function Je(){return document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]').length}function fe(n){let e=[...document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]')].indexOf(n);return e>0?`configurator-${e+1}`:"configurator"}function ge(n){return n.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"configurator"}var Ye=24,Rt="tcfg-unlocked:";function Tt(){try{return window.localStorage}catch{return null}}var ot=class{constructor(t,e,i){g(this,"root");g(this,"model");g(this,"settings");g(this,"state");g(this,"L");g(this,"viewer");g(this,"stage");g(this,"frames");g(this,"hint");g(this,"position");g(this,"emptyNote");g(this,"note");g(this,"thumbs",null);g(this,"fsButton",null);g(this,"frameBySrc",new Map);g(this,"active",null);g(this,"stageSeq",0);g(this,"thumbKey","");g(this,"seenViews",new Set);g(this,"groupEls",new Map);g(this,"summaryText");g(this,"summaryPrice");g(this,"summaryPriceValue");g(this,"summaryEl");g(this,"cta",null);g(this,"shareButton",null);g(this,"dialog",null);g(this,"gateForm",null);g(this,"enquiryForm",null);g(this,"gatePane",null);g(this,"enquiryPane",null);g(this,"enquirySummary",null);g(this,"pending",null);g(this,"returnFocus",null);g(this,"unlocked");g(this,"started",!1);g(this,"cleanup",[]);this.root=t,this.model=e,this.settings=i,this.L=i.labels;let r=ne(e,i.startView);if(i.url){let a=new URLSearchParams(location.search);de(e,a,i.urlPrefix)&&(r=Lt(e,r,a,i.urlPrefix))}this.state=r;let o=Mt(t,"gate-form"),s=Mt(t,"enquiry-form");this.gateForm=o?new K(o):null,this.enquiryForm=s?new K(s):null,this.unlocked=i.gate==="off"||!this.gateForm||Tt()?.getItem(Rt+i.id)==="1",this.build(),this.update(!0),this.emit("ready",{})}getState(){return JSON.parse(JSON.stringify(this.state))}setState(t){let e={paint:t.paint??this.state.paint,view:t.view??this.state.view,choices:{...this.state.choices,...t.choices??{}},toggles:{...this.state.toggles,...t.toggles??{}}},i=rt(this.model,e,new URLSearchParams,"");this.state=Lt(this.model,this.state,i,""),this.update()}get summary(){return _(this.model,this.state)}get price(){return et(this.model,this.state)}shareUrl(){let t=new URL(location.href);return t.hash="",rt(this.model,this.state,t.searchParams,this.settings.urlPrefix),t.href}lock(){Tt()?.removeItem(Rt+this.settings.id),this.unlocked=this.settings.gate==="off"||!this.gateForm,this.updateCta()}destroy(){for(let t of this.cleanup)t();this.cleanup=[],this.gateForm?.destroy(),this.enquiryForm?.destroy(),this.dialog?.open&&this.dialog.close()}emit(t,e){let i={id:this.settings.id,...e};this.root.dispatchEvent(new CustomEvent(`tcfg:${t}`,{detail:i,bubbles:!0}));let r=window.dataLayer;Array.isArray(r)&&t!=="ready"&&t!=="change"&&r.push({event:`tcfg_${t}`,tcfg:i})}build(){let t=this.settings;this.root.classList.add("tcfg"),this.root.setAttribute("data-tcfg-theme",t.theme),this.root.removeAttribute("aria-busy"),this.root.querySelector(":scope > .tcfg-loading")?.remove();let e=this.buildViewer(),i=this.buildOptions(),r=this.buildSummary(),o=a=>this.root.querySelector(`[tcfg-slot="${a}"],[data-tcfg-slot="${a}"]`),s={viewer:o("viewer"),options:o("options"),summary:o("summary")};if(s.viewer||s.options||s.summary){let a=s.summary??s.options??s.viewer;(s.viewer??a).append(e),(s.options??a).append(i),(s.summary??a).append(r)}else{let a=d("div",{class:"tcfg-panel"},i,r);this.root.append(d("div",{class:"tcfg-layout"},e,a))}this.buildDialog(),this.bindKeys()}buildViewer(){let t=this.L;this.frames=d("div",{class:"tcfg-frames"}),this.hint=d("p",{class:"tcfg-hint","aria-live":"polite"}),this.position=d("p",{class:"tcfg-position","aria-live":"polite"}),this.emptyNote=d("p",{class:"tcfg-empty",text:t.empty,hidden:!0});let e=d("button",{type:"button",class:"tcfg-arrow tcfg-arrow-prev","aria-label":t.prev},T("prev")),i=d("button",{type:"button",class:"tcfg-arrow tcfg-arrow-next","aria-label":t.next},T("next"));if(e.addEventListener("click",()=>this.step(-1)),i.addEventListener("click",()=>this.step(1)),this.stage=d("div",{class:"tcfg-stage"},this.frames,this.hint,this.position,e,i,this.emptyNote),this.settings.fullscreen&&document.fullscreenEnabled){this.fsButton=d("button",{type:"button",class:"tcfg-fs","aria-label":t.fullscreen},T("expand")),this.fsButton.addEventListener("click",()=>this.toggleFullscreen()),this.stage.append(this.fsButton);let r=()=>{let o=document.fullscreenElement===this.viewer;this.viewer.classList.toggle("is-fullscreen",o),this.fsButton.setAttribute("aria-label",o?t.exitFullscreen:t.fullscreen),this.fsButton.replaceChildren(T(o?"shrink":"expand")),this.sizeFrames()};document.addEventListener("fullscreenchange",r),this.cleanup.push(()=>document.removeEventListener("fullscreenchange",r))}if(this.bindSwipe(),this.note=d("p",{class:"tcfg-note",hidden:!0}),this.viewer=d("div",{class:"tcfg-viewer"},this.stage),this.settings.thumbs&&(this.thumbs=d("div",{class:"tcfg-thumbs",role:"group","aria-label":t.views}),this.viewer.append(this.thumbs)),this.viewer.append(this.note),"ResizeObserver"in window){let r=new ResizeObserver(()=>this.sizeFrames());r.observe(this.stage),this.cleanup.push(()=>r.disconnect())}return this.viewer}buildOptions(){let t=d("div",{class:"tcfg-groups"});return this.model.groups.forEach((e,i)=>{let r=`tcfg-${this.settings.id}-${e.code}-title`,o=`tcfg-${this.settings.id}-${e.code}-hint`,s=d("div",{class:"tcfg-group-head"},d("h3",{class:"tcfg-group-title",id:r,text:e.title}),d("span",{class:"tcfg-group-index","aria-hidden":"true",text:it(i+1)}),d("p",{class:"tcfg-group-hint",id:o,text:ce(e,this.L)})),a=e.kind==="paint"?this.paintBody(e,r):this.rowsBody(e,r),l=d("section",{class:`tcfg-group tcfg-group-${e.kind}`,"data-group":e.code,"aria-labelledby":r,"aria-describedby":o},s,a);this.groupEls.set(e.code,l),t.append(l)}),t}priceTag(t){if(!this.settings.showPrices)return null;let e=nt(t,this.settings.money,this.L);if(!e)return null;let i=this.settings.showVat&&t.priceCents!==0?d("span",{class:"tcfg-vat",text:` ${this.L.vat}`}):null;return d("span",{class:"tcfg-price"},e,i)}paintBody(t,e){let i=d("div",{class:"tcfg-chips",role:"radiogroup","aria-labelledby":e});for(let o of t.options){let s=this.settings.showPrices?nt(o,this.settings.money,this.L):null,a=d("button",{type:"button",class:"tcfg-chip",role:"radio","data-option":o.code,"aria-label":s?`${o.name}, ${s}`:o.name,title:o.name});o.image?a.append(d("img",{src:o.image.src,alt:"",loading:"lazy"})):a.style.setProperty("--tcfg-swatch",o.swatch||"#777"),a.addEventListener("click",()=>{this.state.paint!==o.code&&this.choose(()=>this.apply(ie(this.model,this.state,o.code)))}),i.append(a)}this.bindRadioKeys(i);let r=d("div",{class:"tcfg-paint-meta"},d("span",{class:"tcfg-paint-name"}),d("span",{class:"tcfg-paint-note"}),d("span",{class:"tcfg-paint-price"}));return d("div",{class:"tcfg-group-body"},i,r)}rowsBody(t,e){let i=t.kind==="choice",r=d("div",{class:"tcfg-rows",role:i?"radiogroup":"group","aria-labelledby":e});for(let o of t.options){let s=ae(o,this.settings.money,this.L),a=d("button",{type:"button",class:"tcfg-row",role:i?"radio":"switch","data-option":o.code});i&&(o.image||t.options.some(l=>l.image))&&a.append(d("span",{class:"tcfg-thumb","aria-hidden":"true"},o.image?d("img",{src:o.image.src,alt:"",loading:"lazy"}):T("wheel"))),a.append(d("span",{class:"tcfg-row-text"},d("span",{class:"tcfg-row-name",text:o.name}),s?d("span",{class:"tcfg-row-sub",text:s}):null),this.priceTag(o)??"",d("span",{class:i?"tcfg-radio":"tcfg-switch","aria-hidden":"true"})),a.addEventListener("click",()=>{if(i){if(this.state.choices[t.code]===o.code)return;this.choose(()=>this.apply(re(this.model,this.state,t.code,o.code)))}else this.choose(()=>this.apply(xt(this.model,this.state,t.code,o.code)))}),r.append(a)}return i&&this.bindRadioKeys(r),d("div",{class:"tcfg-group-body"},r)}buildSummary(){let t=this.L;this.summaryText=d("p",{class:"tcfg-summary-text"}),this.summaryPriceValue=d("strong",{class:"tcfg-summary-amount"}),this.summaryPrice=d("p",{class:"tcfg-summary-price",hidden:!0},d("span",{text:t.indication})," ",this.summaryPriceValue,this.settings.showVat?d("span",{class:"tcfg-vat",text:` ${t.vat}`}):null);let e=d("button",{type:"button",class:"tcfg-summary-toggle","aria-expanded":"false","aria-label":t.showMore},T("chevron"));e.addEventListener("click",()=>{let r=this.summaryEl.classList.toggle("is-open");e.setAttribute("aria-expanded",String(r)),e.setAttribute("aria-label",r?t.showLess:t.showMore)});let i=d("div",{class:"tcfg-summary-actions"});return this.settings.share&&(this.shareButton=d("button",{type:"button",class:"tcfg-button tcfg-button-quiet tcfg-share"},T("share"),d("span",{text:t.share})),this.shareButton.addEventListener("click",()=>this.share()),i.append(this.shareButton)),this.enquiryForm&&(this.cta=d("button",{type:"button",class:"tcfg-button tcfg-cta"}),this.cta.addEventListener("click",()=>this.onCta()),i.append(this.cta)),this.summaryEl=d("div",{class:"tcfg-summary"},d("div",{class:"tcfg-summary-head"},d("span",{class:"tcfg-summary-label",text:t.yourBuild}),e),this.summaryText,this.summaryPrice,i),this.updateCta(),this.summaryEl}buildDialog(){if(!this.gateForm&&!this.enquiryForm)return;let t=this.L,e=d("button",{type:"button",class:"tcfg-dialog-close","aria-label":t.close},T("close"));e.addEventListener("click",()=>this.dialog?.close());let i=d("div",{class:"tcfg-dialog-panel"},e),r=(s,a,l,u,f)=>{let h=`tcfg-${this.settings.id}-${s}-title`,y=d("div",{class:`tcfg-pane tcfg-pane-${s}`,hidden:!0,"data-title":h},d("h2",{class:"tcfg-dialog-title",id:h,text:a}),l?d("p",{class:"tcfg-dialog-text",text:l}):null,f??null);return y.append(u.wrapper),u.wrapper.removeAttribute("hidden"),u.wrapper.classList.add("tcfg-form"),i.append(y),y};this.gateForm&&(this.gatePane=r("gate",t.gateTitle,t.gateText,this.gateForm),this.gateForm.onSuccess(()=>this.onUnlock())),this.enquiryForm&&(this.enquirySummary=d("div",{class:"tcfg-dialog-summary"}),this.enquiryPane=r("enquiry",t.enquiryTitle,t.enquiryText,this.enquiryForm,this.enquirySummary),this.enquiryForm.form?.addEventListener("submit",()=>this.fillForms(),!0),this.enquiryForm.onSuccess(()=>this.emit("submit",this.payload()))),this.dialog=d("dialog",{class:"tcfg-dialog"},i);let o=!1;this.dialog.addEventListener("pointerdown",s=>{o=s.target===this.dialog}),this.dialog.addEventListener("click",s=>{s.target===this.dialog&&o&&this.dialog.close(),o=!1}),this.dialog.addEventListener("close",()=>{this.pending=null,this.returnFocus?.focus(),this.returnFocus=null}),this.root.append(this.dialog)}openPane(t){if(!this.dialog)return;let e=t==="gate"?this.gatePane:this.enquiryPane;if(e){for(let i of[this.gatePane,this.enquiryPane])i&&(i.hidden=i!==e);this.dialog.setAttribute("aria-labelledby",e.getAttribute("data-title")),this.fillForms(),t==="enquiry"&&this.gateForm&&this.enquiryForm&&(this.enquiryForm.email=this.gateForm.email),this.dialog.open||(this.returnFocus=document.activeElement,this.dialog.showModal()),(t==="gate"?this.gateForm:this.enquiryForm)?.focusFirst()}}choose(t){if(this.started||(this.started=!0,this.emit("start",{})),this.unlocked)return t();this.pending=t,this.emit("gate",{}),this.openPane("gate")}onUnlock(){this.unlocked=!0,Tt()?.setItem(Rt+this.settings.id,"1"),this.emit("unlock",{email:this.gateForm?.email??""}),this.updateCta();let t=this.pending;this.pending=null,setTimeout(()=>{t&&t(),this.dialog?.open&&!this.gatePane?.hidden&&this.dialog.close()},900)}onCta(){this.emit("enquiry",this.payload()),this.unlocked?this.openPane("enquiry"):(this.pending=()=>this.openPane("enquiry"),this.openPane("gate"))}updateCta(){this.cta&&(this.cta.textContent=this.unlocked&&this.gateForm?this.L.ctaUnlocked:this.L.cta)}payload(){let t=et(this.model,this.state);return{state:this.getState(),config:le(this.state),summary:_(this.model,this.state),price:t,priceLabel:t===null?"":U(t,this.settings.money),shareUrl:this.shareUrl()}}fillForms(){let t=this.payload(),e={summary:t.summary,config:JSON.stringify(t.config),price:t.price?`${t.priceLabel}${this.settings.showVat?` ${this.L.vat}`:""}`:"",shareUrl:t.shareUrl,groups:oe(this.model,this.state).map(({group:i,value:r})=>({code:i.code,title:i.title,value:r}))};for(let i of[this.gateForm,this.enquiryForm])i?.fill(e,this.settings.fieldNames);this.enquirySummary&&this.enquirySummary.replaceChildren(d("p",{class:"tcfg-dialog-build",text:t.summary}),t.priceLabel&&this.settings.showPrices&&t.price?d("p",{class:"tcfg-dialog-price",text:`${this.L.indication} ${e.price}`}):"")}apply(t){t!==this.state&&(this.state=t,this.update())}update(t=!1){let{model:e,state:i}=this;for(let s of e.groups){let a=this.groupEls.get(s.code);if(a){for(let l of a.querySelectorAll("[data-option]")){let u=l.getAttribute("data-option"),f=s.kind==="paint"?i.paint===u:s.kind==="choice"?i.choices[s.code]===u:(i.toggles[s.code]??[]).includes(u);l.setAttribute("aria-checked",String(f)),l.classList.toggle("is-active",f),s.kind!=="toggle"&&(l.tabIndex=f?0:-1)}if(s.kind==="paint"){let l=s.options.find(y=>y.code===i.paint);a.querySelector(".tcfg-paint-name").textContent=l?.name??"";let u=a.querySelector(".tcfg-paint-note");u.textContent=l?.note??"",u.hidden=!l?.note;let f=a.querySelector(".tcfg-paint-price"),h=l&&s.options.some(y=>y.priceCents!==null)?this.priceTag(l):null;f.replaceChildren(h??""),f.hidden=!h}}}this.summaryText.textContent=_(e,i);let r=this.settings.showPrices?et(e,i):null;this.summaryPrice.hidden=!r,r&&(this.summaryPriceValue.textContent=U(r,this.settings.money)),this.renderStage(),this.renderThumbs();let o=Zt(e,i,this.L);if(this.note.textContent=o??"",this.note.hidden=!o,this.settings.url&&!t){let s=new URL(location.href);rt(e,i,s.searchParams,this.settings.urlPrefix),history.replaceState(history.state,"",s.href)}this.dialog?.open&&this.fillForms(),t||this.emit("change",this.payload())}sizes(){let t=Math.round(this.stage?.clientWidth||this.root.clientWidth||1200);return`${Math.max(t,320)}px`}sizeFrames(){let t=this.sizes();for(let e of this.frameBySrc.values())e.srcset&&(e.sizes=t)}frame(t,e){let i=this.frameBySrc.get(t.src);return i?this.frameBySrc.delete(t.src):(i=d("img",{class:"tcfg-frame",alt:"",decoding:"async",draggable:"false"}),t.srcset&&(i.srcset=t.srcset,i.sizes=this.sizes()),i.src=t.src,i.setAttribute("aria-hidden","true"),this.frames.append(i)),this.frameBySrc.set(t.src,i),e&&(i.alt=e),this.trimFrames(),i}trimFrames(){for(let[t,e]of this.frameBySrc){if(this.frameBySrc.size<=Ye)break;e===this.active||e.classList.contains("is-leaving")||(e.remove(),this.frameBySrc.delete(t))}}altFor(t){let e=Q(this.model)?.options.find(o=>o.code===this.state.paint)?.name,i=this.model.views.find(o=>o.code===t),r=i&&i.name!==i.code?i.name:t?`${this.L.views} ${t}`:"";return[e,r].filter(Boolean).join(" \u2014 ")}async renderStage(){let t=++this.stageSeq,{model:e,state:i}=this,r=H(e,i,i.view);this.emptyNote.hidden=!!r,this.stage.classList.toggle("is-empty",!r);let o=C(e,i).length;if(this.stage.classList.toggle("has-one-view",o<2),this.position.textContent=r?this.positionLabel():"",this.setHint(Qt(e,r,this.L)),!r){this.active?.classList.remove("is-active"),this.active?.setAttribute("aria-hidden","true"),this.active=null;return}let s=this.frame(r.image,this.altFor(i.view));if(s!==this.active){if(await pe(s),t!==this.stageSeq)return;let a=this.active;a||(s.style.transition="none",requestAnimationFrame(()=>requestAnimationFrame(()=>{s.style.transition=""}))),s.removeAttribute("aria-hidden"),s.classList.add("is-active"),s.classList.remove("is-leaving"),a&&(a.classList.remove("is-active"),a.classList.add("is-leaving"),a.setAttribute("aria-hidden","true"),setTimeout(()=>a.classList.remove("is-leaving"),Et()?0:650)),this.active=s}i.view&&!this.seenViews.has(i.view)&&(this.seenViews.add(i.view),this.emit("view",{view:i.view})),this.preload(r)}positionLabel(){let{model:t,state:e}=this,i=C(t,e),r=i.findIndex(a=>a.code===e.view),o=i[r],s=o&&o.name!==o.code?`  ${o.name}`:"";return`${it(r+1)} / ${it(i.length)}${s}`}setHint(t){let e=t??"";this.hint.textContent!==e&&(this.hint.textContent=e),this.hint.hidden=!e}preload(t){let{model:e,state:i}=this,r=[tt(e,i,i.view,-1),tt(e,i,i.view,1)];for(let o of r){let s=o?H(e,i,o):null;s&&s.image.src!==t.image.src&&this.frame(s.image,"")}for(let o of ee(e,i))this.frame(o.image,"")}step(t){let e=tt(this.model,this.state,this.state.view,t);e&&e!==this.state.view&&this.apply({...this.state,view:e})}showView(t){t!==this.state.view&&this.apply({...this.state,view:t})}renderThumbs(){if(!this.thumbs)return;let{model:t,state:e}=this,i=C(t,e),r=i.map(o=>o.code).join(",");this.thumbs.hidden=i.length<2,r!==this.thumbKey&&(this.thumbKey=r,this.thumbs.replaceChildren(...i.map(o=>{let s=d("button",{type:"button",class:"tcfg-thumb-button","data-view":o.code,"aria-label":o.name!==o.code?o.name:`${this.L.views} ${o.code}`},d("img",{alt:"",loading:"lazy",decoding:"async",draggable:"false"}));return s.addEventListener("click",()=>this.showView(o.code)),s.addEventListener("keydown",a=>{a.key!=="ArrowLeft"&&a.key!=="ArrowRight"||(a.preventDefault(),a.stopPropagation(),this.step(a.key==="ArrowRight"?1:-1),this.thumbs.querySelector(`[data-view="${this.state.view}"]`)?.focus())}),s})));for(let o of this.thumbs.querySelectorAll("[data-view]")){let s=o.getAttribute("data-view"),a=H(t,e,s),l=o.querySelector("img");a&&l.getAttribute("src")!==a.image.src&&(a.image.srcset?(l.srcset=a.image.srcset,l.sizes="160px"):l.removeAttribute("srcset"),l.src=a.image.src);let u=s===e.view;if(o.setAttribute("aria-pressed",String(u)),o.classList.toggle("is-active",u),o.tabIndex=u?0:-1,u&&this.thumbs.scrollWidth>this.thumbs.clientWidth){let f=o.offsetLeft-(this.thumbs.clientWidth-o.offsetWidth)/2;this.thumbs.scrollTo({left:f,behavior:Et()?"auto":"smooth"})}}}bindKeys(){let t=e=>{e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||this.dialog?.open||e.target?.closest('input, textarea, select, [contenteditable], [role="radiogroup"]')||(e.preventDefault(),this.step(e.key==="ArrowRight"?1:-1))};this.root.addEventListener("keydown",t),this.cleanup.push(()=>this.root.removeEventListener("keydown",t)),this.stage.tabIndex=0,this.stage.setAttribute("role","region"),this.stage.setAttribute("aria-label",this.L.views)}bindRadioKeys(t){t.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;let r=[...t.querySelectorAll('[role="radio"]')],o=r.indexOf(document.activeElement);if(o<0)return;e.preventDefault(),e.stopPropagation();let s=r.length,a=e.key==="Home"?0:e.key==="End"?s-1:e.key==="ArrowLeft"||e.key==="ArrowUp"?(o-1+s)%s:(o+1)%s;r[a].focus(),r[a].click()})}bindSwipe(){let t=0,e=0,i=null;this.stage.addEventListener("pointerdown",r=>{r.pointerType!=="mouse"&&(i=r.pointerId,t=r.clientX,e=r.clientY)}),this.stage.addEventListener("pointerup",r=>{if(r.pointerId!==i)return;i=null;let o=r.clientX-t,s=r.clientY-e;Math.abs(o)>=40&&Math.abs(o)>1.5*Math.abs(s)&&this.step(o<0?1:-1)}),this.stage.addEventListener("pointercancel",()=>{i=null})}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():this.viewer.requestFullscreen?.().catch(()=>{})}async share(){let t=this.shareUrl();if(this.emit("share",{shareUrl:t}),typeof matchMedia=="function"&&matchMedia("(pointer: coarse)").matches&&navigator.share)try{await navigator.share({url:t,title:document.title,text:_(this.model,this.state)});return}catch{}try{await navigator.clipboard.writeText(t);let i=this.shareButton.querySelector("span");i.textContent=this.L.copied,setTimeout(()=>{i.textContent=this.L.share},2e3)}catch{window.prompt(this.L.share,t)}}};var Ze="0.1.0",Qe='[tcfg-element="configurator"],[data-tcfg-element="configurator"]',st=[],tn=document.currentScript,W=new WeakMap;function ye(){if(document.getElementById("tcfg-styles")||(tn??document.querySelector('script[src*="webflow-configurator"],script[src*="configurator.js"]'))?.getAttribute("tcfg-css")==="false")return;let t=document.createElement("style");t.id="tcfg-styles",t.textContent=Pt,document.head.prepend(t)}async function we(n,t={}){let e=W.get(n);if(e)return e;let i=(async()=>{ye(),n.classList.add("tcfg"),n.setAttribute("aria-busy","true");let r;t.data?r=t.data:(await Ut(yt(n)),r=Dt(n));let{model:o}=gt(r);if(!o.groups.length)return console.warn('[tcfg] No option groups found for this configurator. See the setup guide: tcfg-element="group" / "option".',n),n.removeAttribute("aria-busy"),null;let s=new ot(n,o,me(n,t));return st.push(s),s})();return W.set(n,i),i.then(r=>{r||W.delete(n)},()=>{W.delete(n),n.removeAttribute("aria-busy")}),i}function en(n){n.destroy();let t=st.indexOf(n);t>=0&&st.splice(t,1),W.delete(n.root)}function he(){ye();for(let n of document.querySelectorAll(Qe))n.getAttribute("tcfg-auto")!=="false"&&(n.closest(".w-condition-invisible")||we(n).catch(t=>console.error("[tcfg] The configurator could not start.",t)))}var be={version:Ze,init:we,destroy:en,instances:st,normalize:gt};window.TornanteConfigurator=be;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",he,{once:!0}):he();var Dn=be;})();
//# sourceMappingURL=configurator.js.map
