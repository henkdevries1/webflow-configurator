/*! Tornante Configurator for Webflow v0.2.0 */
"use strict";(()=>{var ke=Object.defineProperty;var Se=(n,t,e)=>t in n?ke(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var f=(n,t,e)=>Se(n,typeof t!="symbol"?t+"":t,e);var Ot=`/* Tornante Configurator \u2014 default look. Everything is driven by the
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
.tcfg-summary-amount { color: var(--tcfg-text); font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }

/* Price: "Click for the price" while locked, then the price lines */
.tcfg-pricebox { margin-top: 10px; }
.tcfg-reveal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--tcfg-line);
  border-radius: var(--tcfg-radius-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.tcfg-reveal svg { width: 14px; height: 14px; }
.tcfg-reveal:hover { background: var(--tcfg-surface-2); }
.tcfg-reveal:focus-visible { outline: 2px solid var(--tcfg-accent); outline-offset: 2px; }
.tcfg-sum { outline: none; }
.tcfg-sum-list { margin: 0; display: grid; gap: 4px; }
.tcfg-sum-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 13px; }
.tcfg-sum-row dt { color: var(--tcfg-muted); }
.tcfg-sum-row dd { margin: 0; text-align: right; }
.tcfg-sum-note { margin: 6px 0 0; font-size: 12px; color: var(--tcfg-muted); }
.tcfg-price-word { color: var(--tcfg-muted); }
.tcfg.is-price-revealed .tcfg-sum,
.tcfg.is-price-revealed .tcfg-price { animation: tcfg-fade-in 0.6s ease both; }
@keyframes tcfg-fade-in { from { opacity: 0; } }
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
`;var Me=/\.(jpe?g|jfif|png|webp|avif|tiff?|heic|gif|svg)$/i,Re=new Set(["basis","base","standaard","default"]),Ee=["without","zonder","geen","no"],Te=["with","plus","met"];function k(n){return n.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")}function ft(n){let t=n.split(/[\\/]+/).filter(Boolean),e=t.pop()??"";return{folders:t,stem:e.replace(/\.[^.]+$/,"")}}function V(n){return n.split(/[\s._\-+()[\]]+/).filter(Boolean)}function H(n,t){let e=n.toLowerCase(),i=t.find(s=>s.code.toLowerCase()===e);if(i)return i.code;if(!/^\d+$/.test(e))return null;let r=Number(e),o=t.find(s=>/^\d+$/.test(s.code)&&Number(s.code)===r);return o?o.code:null}function j(n,t){let e=k(n);if(!e)return null;let i=t.find(r=>k(r.code)===e)??t.find(r=>k(r.name)===e);return i?i.code:null}function Ft(n,t){for(let e of n){let i=j(e,t);if(i)return i}for(let e=2;e<=3;e++)for(let i=0;i+e<=n.length;i++){let r=j(n.slice(i,i+e).join(""),t);if(r)return r}return null}function pt(n,t){let e=t.filter(i=>k(i.code)===n);return e.length?e:t.filter(i=>k(i.name)===n)}function Q(n,t){let e=[],i=[],r=!1;for(let o of n.split("+").map(s=>s.trim()).filter(Boolean)){let s=k(o);if(Re.has(s)){r=!0;continue}let a=pt(s,t);if(a.length===1){e.push({option:a[0],on:!0});continue}let u=null;if(!a.length)for(let g of Ee){if(s.length<=g.length||!s.startsWith(g))continue;let m=pt(s.slice(g.length),t);if(m.length===1){u=m[0];break}}let c=null;if(!a.length&&!u)for(let g of Te){if(s.length<=g.length||!s.startsWith(g))continue;let m=pt(s.slice(g.length),t);if(m.length===1){c=m[0];break}}u?e.push({option:u,on:!1}):c?e.push({option:c,on:!0}):i.push(o)}return{named:e,unknown:i,base:r}}function Pe(n){return n.on?n.option.name:`zonder ${n.option.name}`}function gt(n,t){if(t.length)return{entries:null,asDefault:[],problem:`Onbekende optie${t.length===1?"":"s"}: ${t.join(", ")}`};let e=new Map;for(let a of n){let u=e.get(a.option.id);if(u&&u.on!==a.on)return{entries:null,asDefault:[],problem:`${a.option.name} staat er zowel m\xE9t als zonder in`};e.set(a.option.id,a)}let i=[...e.values()],r=i.find(a=>a.option.choice&&!a.on);if(r)return{entries:null,asDefault:[],problem:`"zonder ${r.option.name}" kan niet: noem de ${r.option.groupTitle.toLowerCase()} die w\xE9l op de render staat`};let o=new Map;for(let a of i)a.option.choice&&o.set(a.option.group,[...o.get(a.option.group)??[],a.option]);for(let a of o.values())if(a.length>1)return{entries:null,asDefault:[],problem:`E\xE9n optie uit ${a[0].groupTitle} per render: ${a.map(u=>u.name).join(" of ")}?`};let s=a=>a.option.choice?a.option.isDefault:a.on===a.option.isDefault;return{entries:i.filter(a=>!s(a)).map(a=>a.on?a.option.id:`!${a.option.id}`),asDefault:i.filter(s).map(Pe),problem:null}}function qt(n,t,e,i,r=[]){if(!Me.test(n))return{path:n,paint:null,view:null,entries:null,asDefault:[],paintFrom:null,optionsFrom:null,optionProblem:null,status:"not-image"};let{folders:o,stem:s}=ft(n),a=s,u=null,c=s.lastIndexOf("_");if(c>0&&c<s.length-1){let p=s.slice(0,c),y=s.slice(c+1);!H(y,e)&&V(p).some(v=>H(v,e))&&(a=p,u=y)}let g=V(a),m=null;for(let p=g.length-1;p>=0&&!m;p--)m=H(g[p],e);let b=Ft(g.filter(p=>!/^\d+$/.test(p)),t),L=b?"name":null,M=-1;for(let p=o.length-1;p>=0&&!b;p--)b=j(o[p],t)??Ft(V(o[p]),t),b&&(L="folder",M=p);!b&&i&&t.some(p=>p.code===i)&&(b=i,L="selected");let P=[],$=[],B=null;for(let[p,y]of o.entries()){if(p===M)continue;let v=Q(y,r);!(M>=0&&p>M)&&(v.unknown.length||!v.named.length&&!v.base)||(P.push(...v.named),$.push(...v.unknown),(v.named.length||v.unknown.length||v.base)&&(B??(B="folder")))}if(u!==null){let p=Q(u,r);P.push(...p.named),$.push(...p.unknown),B="name"}let l=gt(P,$),h=b?m?l.entries===null?"no-options":"ok":"no-view":"no-paint";return{path:n,paint:b,view:m,entries:l.entries,asDefault:l.asDefault,paintFrom:L,optionsFrom:B,optionProblem:l.problem,status:h}}var Nt={en:{cta:"Enquire",ctaUnlocked:"Send my build",yourBuild:"Your build",showMore:"Show the whole build",showLess:"Show less",indication:"Price indication",included:"Included",standard:"Standard",vat:"excl. VAT",share:"Share",copied:"Link copied",views:"Views",prev:"Previous view",next:"Next view",fullscreen:"View full screen",exitFullscreen:"Exit full screen",close:"Close",loading:"Loading the configurator\u2026",empty:"Renders of this colour are on their way.",partial:"{name}: {n} of {total} views rendered so far.",shown:"Shown {list} \u2014 not rendered yet",with:"with",without:"without",and:"and",optional:"Optional",optionalAny:"Optional \xB7 add any",pickColour:"{n} colours \xB7 pick one",pickOne:"{n} options \xB7 pick one",gateTitle:"See your build",gateText:"Leave your email address to configure the car.",enquiryTitle:"Send your build",enquiryText:"We will get back to you about this build.",onRequest:"On request",theCar:"The car",from:"From {amount}",total:"Total",options:"Options",indicationSuffix:"\u2014 indication",onRequestOne:"1 option on request not included.",onRequestMany:"{n} options on request not included.",clickForPrice:"Click for the price",priceGateTitle:"Enter your email to see the price.",priceGateText:"Leave your email once and you will see the price of the car and of every option, as an indication.",gateSubmit:"Start configuring",priceSubmit:"Show the price"},nl:{cta:"Informatie aanvragen",ctaUnlocked:"Verstuur mijn configuratie",yourBuild:"Jouw configuratie",showMore:"Toon de hele configuratie",showLess:"Minder tonen",indication:"Prijsindicatie",included:"Inbegrepen",standard:"Standaard",vat:"excl. btw",share:"Delen",copied:"Link gekopieerd",views:"Standpunten",prev:"Vorig standpunt",next:"Volgend standpunt",fullscreen:"Volledig scherm",exitFullscreen:"Volledig scherm sluiten",close:"Sluiten",loading:"De configurator wordt geladen\u2026",empty:"De renders van deze kleur komen eraan.",partial:"{name}: {n} van {total} standpunten gerenderd.",shown:"Getoond {list} \u2014 nog niet gerenderd",with:"met",without:"zonder",and:"en",optional:"Optioneel",optionalAny:"Optioneel \xB7 kies wat je wilt",pickColour:"{n} kleuren \xB7 kies er \xE9\xE9n",pickOne:"{n} opties \xB7 kies er \xE9\xE9n",gateTitle:"Bekijk jouw configuratie",gateText:"Laat je e-mailadres achter om de auto samen te stellen.",enquiryTitle:"Verstuur je configuratie",enquiryText:"We nemen contact met je op over deze configuratie.",onRequest:"Op aanvraag",theCar:"De auto",from:"Vanaf {amount}",total:"Totaal",options:"Opties",indicationSuffix:"\u2014 indicatie",onRequestOne:"1 optie op aanvraag niet meegeteld.",onRequestMany:"{n} opties op aanvraag niet meegeteld.",clickForPrice:"Klik voor de prijs",priceGateTitle:"Vul je e-mailadres in om de prijs te zien.",priceGateText:"Laat \xE9\xE9n keer je e-mailadres achter en je ziet de prijs van de auto en van elke optie, als indicatie.",gateSubmit:"Start met configureren",priceSubmit:"Toon de prijs"}};function Ht(n,t={}){let e={...n.toLowerCase().startsWith("nl")?Nt.nl:Nt.en};for(let i of Object.keys(e)){let r=t[i];typeof r=="string"&&r.trim()&&(e[i]=r)}return e}function q(n,t){return n.replace(/\{(\w+)\}/g,(e,i)=>i in t?String(t[i]):e)}function ht(n,t){return n.length<2?n.join(""):`${n.slice(0,-1).join(", ")} ${t} ${n[n.length-1]}`}var It=n=>n%100===0;function U(n,t){try{return new Intl.NumberFormat(t.locale,{style:"currency",currency:t.currency,minimumFractionDigits:It(n)?0:2,maximumFractionDigits:2}).format(n/100)}catch{return`${t.currency} ${(n/100).toFixed(It(n)?0:2)}`}}var $e=1e9;function tt(n){if(typeof n=="number")return Number.isFinite(n)&&n>=0?Bt(Math.round(n*100)):null;if(typeof n!="string")return null;let t=n.replace(/\u2212/g,"-"),e=t.match(/\d[\d.,\s\u00a0]*\d|\d/g);if(!e||e.length!==1)return null;let i=t.indexOf(e[0]);if(/-\s*(?:[^\d\s]{1,3}\s*)?$/.test(t.slice(0,i)))return null;let r=e[0].replace(/[\s\u00a0]/g,""),o;if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(r)||/^\d+(,\d{1,2})?$/.test(r))o=r.replace(/\./g,"").replace(",",".");else if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(r)||/^\d+(\.\d{1,2})?$/.test(r))o=r.replace(/,/g,"");else return null;let s=Math.round(Number(o)*100);return Number.isFinite(s)&&s>=0?Bt(s):null}function Bt(n){return n>$e?null:n}function Gt(n){let t=new Map;for(let e of n){let i=e.startsWith("!"),r=(i?e.slice(1):e).toLowerCase();t.set(r,i?`!${r}`:r)}return[...t.keys()].sort().map(e=>t.get(e)).join(",")}var Ce=new Set(["paint","paints","colour","colours","color","colors","kleur","kleuren","lak","lakken"]);function mt(n){return n.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function et(n){return typeof n=="boolean"?n:typeof n=="number"?n!==0:typeof n!="string"?!1:["true","yes","ja","on","aan","1","default","standaard","standard"].includes(n.trim().toLowerCase())}function Ae(n,t){let e=typeof n=="string"?k(n):"";return e==="paint"||e==="colour"||e==="color"||e==="kleur"||e==="lak"?"paint":e==="toggle"||e==="switch"||e==="onoff"||e==="aanuit"||e==="checkbox"||e==="extra"||e==="extras"?"toggle":e==="choice"||e==="radio"||e==="single"||e==="keuze"?"choice":Ce.has(k(t))?"paint":"choice"}function zt(n,t){let e=typeof n=="number"?n:typeof n=="string"&&n.trim()?Number(n):NaN;return Number.isFinite(e)?e:t}function x(n){return typeof n=="string"?n.trim():typeof n=="number"?String(n):""}function Oe(n){return n?typeof n=="string"?n.trim()?{src:n.trim(),srcset:null}:null:n.src?{src:n.src,srcset:n.srcset??null}:null:null}function bt(n,t){return n.map((e,i)=>({item:e,key:zt(t(e),i)})).sort((e,i)=>e.key-i.key).map(e=>e.item)}function Dt(n){let t=n.split(/[?#]/)[0].split("/").pop()??"";try{t=decodeURIComponent(t)}catch{}return t.replace(/^(?:[0-9a-f]{24}_)+/i,"").replace(/-p-\d+(?=\.[a-z0-9]+$)/i,"")}function yt(n){let t=[],e=[],i=new Map,r=l=>{let h=k(l);return e.find(p=>k(p.code)===h)??e.find(p=>k(p.title)===h)},o=(l,h)=>{let p=x(l.title)||x(l.code),y=mt(x(l.code)||p)||`group-${h+1}`,v=r(y);if(v)return v;let R={code:y,kind:Ae(l.kind,y),title:p||y,onRenders:l.onRenders===void 0||l.onRenders===""?!0:et(l.onRenders),options:[]};return e.push(R),i.set(R,zt(l.sort,1e3+h)),R},s=[];(n.groups??[]).forEach((l,h)=>{let p=o(l,h);for(let y of l.options??[])s.push({group:p,option:y,index:s.length})});for(let l of n.options??[]){let h=x(l.group);if(!h){t.push(`Option "${x(l.name)||x(l.code)}" has no group (tcfg-group); it is skipped.`);continue}let p=r(h)??o({code:h,title:h},e.length);s.push({group:p,option:l,index:s.length})}for(let{group:l,option:h}of bt(s,p=>p.option.sort)){let p=x(h.name)||x(h.code);if(!p){t.push(`An option of "${l.title}" has no name; it is skipped.`);continue}let y=mt(x(h.code)||p);if(l.options.some(R=>R.code===y)){t.push(`"${l.title}" has two options with the code "${y}"; the second is skipped.`);continue}let v={code:y,name:p,note:x(h.note),swatch:x(h.swatch)||null,image:Oe(h.image),isDefault:et(h.default),priceCents:tt(h.price??null)};l.options.push(v)}for(let l of e){if(l.kind==="toggle")continue;let h=!1;for(let p of l.options)p.isDefault&&h&&(p.isDefault=!1),p.isDefault&&(h=!0);!h&&l.options.length&&(l.options[0].isDefault=!0)}let a=e.filter(l=>l.kind==="paint");for(let l of a.slice(1))t.push(`Only one paint group is supported; "${l.title}" is treated as a choice.`),l.kind="choice";let u=bt(e,l=>i.get(l)).filter(l=>l.options.length?!0:(t.push(`Group "${l.title}" has no options; it is not shown.`),!1)),c=u.find(l=>l.kind==="paint")??null,g=(n.renders??[]).map(l=>typeof l=="string"?{src:l}:l).filter(l=>l&&l.src),m=c?Fe(c.options):[{code:"_",name:"_"}],b=[];for(let l of u){if(l.kind==="paint"||!l.onRenders)continue;let h=l.kind==="choice"?(l.options.find(p=>p.isDefault)??l.options[0]).code:null;for(let p of l.options)b.push({id:`${l.code}:${p.code}`,code:p.code,name:p.name,group:l.code,groupTitle:l.title,choice:l.kind==="choice",isDefault:l.kind==="choice"?p.code===h:p.isDefault})}let L=bt(n.views??[],l=>l.sort).map((l,h)=>{let p=x(l.code)||String(h+1).padStart(2,"0");return{code:p,name:x(l.name)||p}}).filter((l,h,p)=>p.findIndex(y=>y.code===l.code)===h);L.length||(L=Ne(g));let M=L.map(l=>({code:l.code,name:l.name})),P={},$={};for(let l of g){let h=Dt(l.src),p=x(l.paint),y=x(l.view),v=c?p?j(p,m):null:"_";if(c&&p&&!v){t.push(`Render ${h}: unknown paint "${p}".`);continue}let R=qt(h,m,M,v,b),T=v??R.paint,O=y?H(y,M)??H(mt(y),M):R.view,F,dt=null;if(l.set!==void 0&&l.set!==null){let C=Q(x(l.set).replace(/[,;&]/g,"+"),b),D=gt(C.named,C.unknown);F=D.entries,dt=D.problem}else F=R.entries,dt=R.optionProblem;if(!T){t.push(`Render ${h}: no paint found (name it in the file or set tcfg-paint).`);continue}if(!O){t.push(`Render ${h}: no view found (a number in the file name, or tcfg-view).`);continue}if(!F){t.push(`Render ${h}: ${dt??"unknown combination"}.`);continue}let At={src:l.src,srcset:l.srcset??null};if(F.length){let C=Gt(F),D=$[T]??($[T]=new Map),Z=D.get(C);if(Z||D.set(C,Z={entries:qe(F,b),views:{}}),Z.views[O]){t.push(`Render ${h}: ${T} view ${O} (${F.join(" + ")}) is given twice; the first is used.`);continue}Z.views[O]=At}else{let C=P[T]??(P[T]={});if(C[O]){t.push(`Render ${h}: ${T} view ${O} (base) is given twice; the first is used.`);continue}C[O]=At}}let B={};for(let[l,h]of Object.entries($))B[l]=[...h.values()].sort((p,y)=>p.entries.length-y.entries.length);for(let l of t)console.warn(`[tcfg] ${l}`);return{model:{views:L,groups:u,renders:P,renderSets:B},warnings:t}}function Fe(n){let t=n.map(i=>({code:i.code,name:i.name})),e=i=>k(i.name.split(/[\s-]+/)[0]??"");for(let i of n){let r=e(i);r&&n.filter(o=>e(o)===r).length===1&&t.push({code:i.code,name:r})}return t}function qe(n,t){let e=i=>t.findIndex(r=>r.id===i.replace(/^!/,""));return[...n].sort((i,r)=>e(i)-e(r))}function Ne(n){let t=new Map;for(let e of n){let i=x(e.view);if(!i){let{stem:o}=ft(Dt(e.src)),s=o.includes("_")&&!/^\d+$/.test(o.slice(o.lastIndexOf("_")+1))?o.slice(0,o.lastIndexOf("_")):o,a=V(s).filter(u=>/^\d+$/.test(u));i=a.length?a[a.length-1]:""}if(!i)continue;let r=/^\d+$/.test(i)?String(Number(i)):i.toLowerCase();t.has(r)||t.set(r,/^\d+$/.test(i)?String(Number(i)).padStart(2,"0"):i)}return[...t.values()].sort((e,i)=>/^\d+$/.test(e)&&/^\d+$/.test(i)?Number(e)-Number(i):e.localeCompare(i)).map(e=>({code:e,name:e}))}var S="tcfg-element";function N(n,t){return n.getAttribute(`tcfg-${t}`)??n.getAttribute(`data-tcfg-${t}`)}function wt(n){return n.classList.contains("w-dyn-bind-empty")||!!n.closest(".w-condition-invisible")}function vt(n,t){return n.parentElement?.closest(`[${S}],[data-${S}]`)===t}function w(n,t){let e=N(n,t);if(e!==null)return e;for(let i of n.querySelectorAll(`[tcfg-field="${t}"],[data-tcfg-field="${t}"]`)){if(!vt(i,n)||wt(i))continue;let r=(i.textContent??"").trim();if(r)return r}}function Vt(n,t="src"){let e=N(n,t);if(e)return{src:e,srcset:null};let i=n instanceof HTMLImageElement?[n]:[...n.querySelectorAll("img")];for(let r of i){if(r!==n&&!vt(r,n)||wt(r))continue;let o=r.getAttribute("src");if(!(!o||o.startsWith("data:")))return{src:new URL(o,document.baseURI).href,srcset:r.getAttribute("srcset")}}return null}function Ie(n){let t=w(n,"swatch");if(t)return t;for(let e of n.querySelectorAll('[tcfg-field="swatch"],[data-tcfg-field="swatch"]')){if(!vt(e,n)||wt(e))continue;let i=e.style.backgroundColor||getComputedStyle(e).backgroundColor;if(i&&i!=="transparent"&&!/rgba\(0, 0, 0, 0\)/.test(i))return i}}function Be(n){return n.getAttribute(S)??n.getAttribute(`data-${S}`)}function _(n,t=n.ownerDocument){let e=["group","option","view","render","json"].map(r=>`[${S}="${r}"],[data-${S}="${r}"]`).join(","),i=[...n.querySelectorAll(e)];return i.length?i:[...t.querySelectorAll(e)].filter(r=>{let o=r.closest(`[${S}="configurator"],[data-${S}="configurator"]`);return!o||o===n})}function jt(n){let t={groups:[],options:[],views:[],renders:[]};for(let e of _(n))if(!e.closest(".w-condition-invisible"))switch(Be(e)){case"json":He(t,e.textContent??"");break;case"group":t.groups.push({code:w(e,"code"),kind:w(e,"kind"),title:w(e,"title")??w(e,"name"),onRenders:w(e,"renders"),sort:w(e,"sort")});break;case"option":t.options.push({group:w(e,"group"),code:w(e,"code"),name:w(e,"name"),note:w(e,"note"),price:w(e,"price")??null,default:w(e,"default"),swatch:Ie(e)??null,image:Vt(e,"image"),sort:w(e,"sort")});break;case"view":t.views.push({code:w(e,"code"),name:w(e,"name"),sort:w(e,"sort")});break;case"render":{let i=Vt(e);if(!i)break;t.renders.push({src:i.src,srcset:i.srcset,paint:w(e,"paint")||null,view:w(e,"view")||null,set:w(e,"set")||null});break}}return t}function He(n,t){try{let e=JSON.parse(t);n.groups.push(...e.groups??[]),n.options.push(...e.options??[]),n.views.push(...e.views??[]),n.renders.push(...e.renders??[])}catch(e){console.warn('[tcfg] The tcfg-element="json" block is not valid JSON.',e)}}var Ut=new WeakMap;function xt(n){let t=new URL(n,document.baseURI);for(let e of t.searchParams.keys())if(/_page$/.test(e))return e;return null}function Ge(n,t){for(let e of n.querySelectorAll("a.w-pagination-next"))if(xt(e.getAttribute("href")??"")===t)return e;return null}async function ze(n,t){let e=xt(t.getAttribute("href")??""),i=n.querySelector(".w-dyn-items");if(!e||!i)return;let r=t.getAttribute("href"),o=new Set;for(let s=0;r&&s<50;s++){let a=new URL(r,document.baseURI).href;if(o.has(a))break;o.add(a);let u=await fetch(a,{credentials:"same-origin"});if(!u.ok)break;let c=new DOMParser().parseFromString(await u.text(),"text/html"),g=Ge(c,e),m=g?.closest(".w-dyn-list")?.querySelector(".w-dyn-items")??De(c,e);if(!m)break;for(let b of[...m.children])i.appendChild(document.importNode(b,!0));r=g?.getAttribute("href")??null}for(let s of n.querySelectorAll(".w-pagination-wrapper"))s.hidden=!0}function De(n,t){for(let e of n.querySelectorAll("a.w-pagination-previous"))if(xt(e.getAttribute("href")??"")===t)return e.closest(".w-dyn-list")?.querySelector(".w-dyn-items")??null;return null}async function _t(n){let t=new Set;for(let e of n){let i=e.closest(".w-dyn-list");i&&t.add(i)}await Promise.all([...t].map(e=>{let i=Ut.get(e);if(!i){let r=e.querySelector("a.w-pagination-next");i=r?ze(e,r).catch(o=>console.warn("[tcfg] Could not load the next page of a Collection List.",o)):Promise.resolve(),Ut.set(e,i)}return i}))}function kt(n,t){return`${n}:${t}`}function Kt(n){let t=n.indexOf(":");return t>0&&t<n.length-1?{group:n.slice(0,t),option:n.slice(t+1)}:null}function Ve(n,t=!0){return t?n:`!${n}`}function St(n){return n.startsWith("!")?{ref:n.slice(1),on:!1}:{ref:n,on:!0}}function je(n){return n.kind!=="paint"&&n.onRenders!==!1}function Wt(n,t){let e=[],i=new Map;for(let r of n)if(!(!je(r)||!r.options.length))if(r.kind==="choice"){let o=(r.options.find(c=>c.isDefault)??r.options[0]).code,s=t.choices[r.code],a=s&&r.options.some(c=>c.code===s)?s:o,u={key:r.code,group:r.code,choice:!0,def:o,chosen:a};e.push(u);for(let c of r.options)i.set(kt(r.code,c.code),{unit:u,value:c.code,rank:i.size})}else{let o=new Set(t.toggles[r.code]??[]);for(let s of r.options){let a=kt(r.code,s.code),u={key:a,group:r.code,choice:!1,def:s.isDefault,chosen:o.has(s.code)};e.push(u),i.set(a,{unit:u,value:!0,rank:i.size})}}return{units:e,refs:i}}function Ue(n,t){return n.choice?kt(n.group,t):Ve(n.key,t)}function _e(n,t,e){let i=new Map,r=[];for(let s of t.entries){let{ref:a,on:u}=St(s),c=n.refs.get(a);if(!c||c.unit.choice&&!u)return null;let g=c.unit.choice?c.value:u;if(i.has(c.unit.key)||g!==c.unit.chosen)return null;i.set(c.unit.key,g),r.push(c.rank)}let o=0;for(let s of n.units)(i.has(s.key)?i.get(s.key):s.def)===s.chosen&&o++;return{set:t,index:e,score:o,ranks:r.sort((s,a)=>s-a),explicit:i}}function Ke(n,t){if(n.score!==t.score)return n.score-t.score;if(n.ranks.length!==t.ranks.length)return t.ranks.length-n.ranks.length;for(let e=0;e<n.ranks.length;e++)if(n.ranks[e]!==t.ranks[e])return t.ranks[e]-n.ranks[e];return t.index-n.index}function Xt(n,t,e,i,r=Wt(n,e)){let o=null;for(let u=0;u<t.length;u++){let c=t[u];if(!Object.prototype.hasOwnProperty.call(c.views,i)||c.views[i]==null)continue;let g=_e(r,c,u);g&&(!o||Ke(g,o)>0)&&(o=g)}if(!o)return null;let s=o,a=[];for(let u of r.units){let c=s.explicit.has(u.key)?s.explicit.get(u.key):u.def;c!==u.chosen&&a.push(Ue(u,c))}return{image:s.set.views[i],set:s.set,exact:a.length===0,differs:a}}function We(n,t,e,i){let r=Wt(n,e),o=[];for(let s of i){let a=Xt(n,t,e,s,r);a&&o.push({view:s,match:a})}return o}function Jt(n,t){return t?[{entries:[],views:n.renders[t]??{}},...n.renderSets?.[t]??[]]:[]}function Yt(n,t,e){return Xt(n.groups,Jt(n,t.paint),t,e)}function Zt(n,t){return We(n.groups,Jt(n,t.paint),t,n.views.map(e=>e.code))}function nt(n){return n.groups.find(t=>t.kind==="paint")??null}function Xe(n,t){if(!t.paint)return[];let e=new Map(n.views.map(i=>[i.code,i]));return Zt(n,t).map(({view:i,match:r})=>({view:e.get(i),render:r}))}function G(n,t,e){return e&&t.paint?Yt(n,t,e):null}function I(n,t){return Xe(n,t).map(e=>e.view)}function Qt(n,t,e,i=null){let r=I(n,t);if(!r.length)return null;if(e&&r.some(c=>c.code===e))return e;let o=n.views.map(c=>c.code),s=e?o.indexOf(e):-1;if(s<0)return i&&r.some(c=>c.code===i)?i:r[0].code;let a=r[0].code,u=1/0;for(let c of r){let g=o.indexOf(c.code),m=Math.abs(g-s);(m<u||m===u&&g>s)&&(a=c.code,u=m)}return a}function it(n,t,e,i){let r=I(n,t);if(!r.length)return null;let o=r.findIndex(a=>a.code===e);if(o<0)return r[0].code;let s=r.length;return r[((o+i)%s+s)%s].code}function te(n,t,e){let i=I(n,t).length,r=n.views.length;if(!t.paint||!i||i>=r)return null;let o=nt(n)?.options.find(s=>s.code===t.paint)?.name;return o?q(e.partial,{name:o,n:i,total:r}):null}function ee(n,t,e){if(!t||t.exact)return null;let i=[],r=[],o=[];for(let u of t.differs){let{ref:c,on:g}=St(u),m=Kt(c),b=m&&n.groups.find(M=>M.code===m.group),L=b?.options.find(M=>M.code===m.option);!b||!L||(b.kind==="choice"?i.push(ne(L,b)):b.kind==="toggle"&&(g?r:o).push(Je(L.name)))}let s=[...i,...r],a=[];return s.length&&a.push(`${e.with} ${ht(s,e.and)}`),o.length&&a.push(`${e.without} ${ht(o,e.and)}`),a.length?q(e.shown,{list:a.join(` ${e.and} `)}):null}function ne(n,t){let e=t.title.trim().toLowerCase();return!e||n.name.toLowerCase().includes(e)?n.name:`${n.name} ${e}`}function Je(n){return n.replace(/\b([A-Z])([a-z]*)\b/g,(t,e,i)=>e.toLowerCase()+i)}function ie(n,t,e=6){let i=G(n,t,t.view);if(!i)return[];let r=new Set([i.image.src]),o=[];for(let s of n.groups)if(!(s.kind==="paint"||!s.onRenders))for(let a of s.options){let u;if(s.kind==="toggle")u=Lt(n,t,s.code,a.code);else{if(t.choices[s.code]===a.code)continue;u={...t,choices:{...t.choices,[s.code]:a.code}}}let c=G(n,u,t.view);if(c&&!r.has(c.image.src)&&(r.add(c.image.src),o.push(c),o.length>=e))return o}return o}function re(n,t=null){let e={},i={},r=nt(n)?null:"_";for(let o of n.groups)if(o.kind==="toggle")i[o.code]=o.options.filter(s=>s.isDefault).map(s=>s.code);else if(o.options.length){let s=(o.options.find(a=>a.isDefault)??o.options[0]).code;o.kind==="paint"?r=s:e[o.code]=s}return{paint:r,view:Qt(n,{paint:r,choices:e,toggles:i},null,t),choices:e,toggles:i}}function K(n,t,e=null){let i=Qt(n,t,t.view,e);return i===t.view?t:{...t,view:i}}function oe(n,t,e){return K(n,{...t,paint:e})}function se(n,t,e,i){return K(n,{...t,choices:{...t.choices,[e]:i}})}function Lt(n,t,e,i){let r=new Set(t.toggles[e]??[]);r.has(i)?r.delete(i):r.add(i);let o=n.groups.find(s=>s.code===e)?.options.map(s=>s.code)??[...r];return K(n,{...t,toggles:{...t.toggles,[e]:o.filter(s=>r.has(s))}})}function rt(n,t){let e=[];for(let i of n.groups)if(i.kind==="paint"){let r=i.options.find(o=>o.code===t.paint);r&&e.push({group:i,option:r})}else if(i.kind==="choice"){let r=i.options.find(o=>o.code===t.choices[i.code]);r&&e.push({group:i,option:r})}else{let r=t.toggles[i.code]??[];for(let o of i.options)r.includes(o.code)&&e.push({group:i,option:o})}return e}function W(n,t){return rt(n,t).map(({group:e,option:i})=>e.kind==="choice"?ne(i,e):i.name).join(" \xB7 ")}function ae(n,t){let e=rt(n,t);return n.groups.map(i=>{let r=e.filter(o=>o.group===i).map(o=>o.option.name);return{group:i,value:r.length?r.join(", "):"\u2014"}})}var ot=n=>typeof n.priceCents=="number"&&Number.isInteger(n.priceCents)&&n.priceCents>=0;function Ye(n,t){let e=rt(n,t).map(i=>i.option).filter(ot);return e.length?e.reduce((i,r)=>i+r.priceCents,0):null}function Ze(n,t,e){return ot(n)?n.priceCents===0?e.included:`+ ${U(n.priceCents,t)}`:null}function X(n,t,e,i){let r=Ze(n,e,i);return r||(t.options.some(ot)?n.isDefault?i.standard:i.onRequest:null)}function Mt(n){return!!n&&/\d/.test(n)}function ce(n,t,e,i){let r=n.note.trim();return r||(n.isDefault&&X(n,t,e,i)===null?i.standard:"")}function Rt(n,t,e,i,r){let o=Ye(n,t),s=0;for(let{group:u,option:c}of rt(n,t))X(c,u,i,r)===r.onRequest&&s++;let a=e===null&&o===null?null:(e??0)+(o??0);return{baseCents:e,optionsCents:o,totalCents:a,onRequest:s}}function le(n,t){return t!==null||n.groups.some(e=>e.options.some(ot))}function ue(n,t){let e=n.options.length;return n.kind==="toggle"?e===1?t.optional:t.optionalAny:q(n.kind==="paint"?t.pickColour:t.pickOne,{n:e})}function de(n){return{paint:n.paint==="_"?null:n.paint,choices:{...n.choices},toggles:Object.fromEntries(Object.entries(n.toggles).map(([t,e])=>[t,[...e]]))}}function st(n){return n<10?`0${n}`:String(n)}var z="cfg-",pe="none";function at(n,t,e,i=z){for(let r of n.groups){let o=i+r.code;if(r.kind==="paint")Et(e,o,t.paint==="_"?null:t.paint);else if(r.kind==="choice")Et(e,o,t.choices[r.code]??null);else{let s=t.toggles[r.code]??[];e.set(o,s.length?s.join("."):pe)}}return Et(e,`${i}view`,t.view),e}function Et(n,t,e){e?n.set(t,e):n.delete(t)}function fe(n,t,e=z){return n.groups.some(i=>t.has(e+i.code))||t.has(`${e}view`)}function Tt(n,t,e,i=z){let r={...t,choices:{...t.choices},toggles:{...t.toggles}};for(let s of n.groups){let a=e.get(i+s.code);if(a===null)continue;let u=new Set(s.options.map(c=>c.code));if(s.kind==="paint")u.has(a)&&(r.paint=a);else if(s.kind==="choice")u.has(a)&&(r.choices[s.code]=a);else{let c=new Set(a===pe?[]:a.split("."));r.toggles[s.code]=s.options.map(g=>g.code).filter(g=>c.has(g))}}let o=e.get(`${i}view`);return o&&n.views.some(s=>s.code===o)&&(r.view=o),r=K(n,r),r}var J=class{constructor(t){f(this,"wrapper");f(this,"form");f(this,"done");f(this,"succeeded",!1);f(this,"submitted",!1);f(this,"listeners",[]);f(this,"observer",null);this.form=t instanceof HTMLFormElement?t:t.querySelector("form");let e=this.form?.closest(".w-form")??null;this.form&&!e&&console.warn("[tcfg] This form is not inside a Webflow Form Block (.w-form); Webflow will not handle it.",t),this.wrapper=e&&e.contains(t)?e:t,this.done=(e??this.wrapper).querySelector(".w-form-done"),this.done&&(this.observer=new MutationObserver(()=>this.check()),this.observer.observe(this.wrapper,{attributes:!0,subtree:!0,attributeFilter:["style","class"]})),this.form?.addEventListener("submit",()=>{this.submitted=!0,(!this.done||!window.Webflow)&&setTimeout(()=>this.success(),0)})}check(){this.submitted&&this.done&&getComputedStyle(this.done).display!=="none"&&this.success()}success(){if(!this.succeeded){this.succeeded=!0;for(let t of this.listeners)t()}}onSuccess(t){this.listeners.push(t)}get email(){return this.form?.querySelector('input[type="email"]')?.value.trim()??""}set email(t){let e=this.form?.querySelector('input[type="email"]');e&&!e.value&&(e.value=t)}focusFirst(){this.form?.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea, select')?.focus()}input(t,e){if(!this.form)return null;let i=this.form.querySelector(`[tcfg-field="${t}"],[data-tcfg-field="${t}"]`);if(i)return i;let r=this.form.querySelector(`input[data-tcfg-auto="${t}"]`);if(!r){r=document.createElement("input"),r.type="hidden",r.name=e,r.setAttribute("data-name",e),r.setAttribute("data-tcfg-auto",t);let o=this.form.querySelectorAll("input[data-tcfg-auto]");o.length?o[o.length-1].after(r):this.form.prepend(r)}return r}fill(t,e){let i=(r,o,s)=>{let a=this.input(r,o);a&&(a.value=s)};i("summary",e.summary,t.summary),i("price",e.price,t.price);for(let r of t.groups)i(r.code,r.title,r.value);i("share-url",e.shareUrl,t.shareUrl),i("config",e.config,t.config)}destroy(){this.observer?.disconnect(),this.listeners=[]}};function Pt(n,t){let e=`[${S}="${t}"],[data-${S}="${t}"]`,i=n.querySelector(e);if(i)return i;let r=N(n,"id");for(let o of document.querySelectorAll(e)){let s=N(o,"for");if(s?s===r:document.querySelectorAll(`[${S}="configurator"],[data-${S}="configurator"]`).length===1)return o}return null}function d(n,t={},...e){let i=document.createElement(n);for(let[r,o]of Object.entries(t))o==null||o===!1||(r==="class"?i.className=String(o):r==="text"?i.textContent=String(o):i.setAttribute(r,o===!0?"":String(o)));for(let r of e)r&&i.append(r);return i}var Qe={prev:'<path d="M15 6l-6 6 6 6"/>',next:'<path d="M9 6l6 6-6 6"/>',expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',shrink:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',share:'<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',chevron:'<path d="M6 15l6-6 6 6"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/>'};function E(n){let t=document.createElement("span");return t.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Qe[n]??""}</svg>`,t.firstElementChild}function ct(){return typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}function ge(n,t=5e3){return n.complete?Promise.resolve():new Promise(e=>{let i=()=>{clearTimeout(r),n.removeEventListener("load",i),n.removeEventListener("error",i),e()},r=setTimeout(i,t);n.addEventListener("load",i),n.addEventListener("error",i)})}function be(n,t={}){let e=c=>N(n,c),i=(c,g)=>{let m=e(c);return m===null||m===""?g:et(m)},r=t.lang??e("lang")??(document.documentElement.lang||"en"),o=r.toLowerCase().startsWith("nl"),s={};for(let c of n.getAttributeNames()){let g=/^(?:data-)?tcfg-label-(.+)$/.exec(c);g&&(s[g[1].replace(/-([a-z])/g,(m,b)=>b.toUpperCase())]=n.getAttribute(c)??"")}let a=(t.gate??e("gate")??"").toLowerCase(),u=(t.theme??e("theme")??"light").toLowerCase()==="dark"?"dark":"light";return{id:me(t.id??e("id")??he(n)),lang:r,money:{currency:t.currency??e("currency")??"EUR",locale:t.locale??e("locale")??(o?"nl-NL":"en-GB")},showVat:t.showVat??i("vat",!0),showPrices:t.showPrices??i("prices",!0),priceGate:t.priceGate??i("price-gate",!1),basePriceCents:t.basePriceCents??tt(t.basePrice??e("base-price")??""),gate:a==="off"||a==="false"||a==="none"?"off":"first-change",url:t.url??i("url",!0),urlPrefix:t.urlPrefix??e("url-prefix")??(tn()>1?`${z}${me(t.id??e("id")??he(n))}-`:z),startView:t.startView??e("start-view"),theme:u,thumbs:t.thumbs??i("thumbs",!0),fullscreen:t.fullscreen??i("fullscreen",!0),share:t.share??i("share",!0),labels:Ht(r,{...s,...t.labels??{}}),fieldNames:{summary:o?"Configuratie":"Configuration",config:o?"Configuratiecode":"Configuration code",price:o?"Prijsindicatie":"Price indication",shareUrl:o?"Link naar configuratie":"Share link",...t.fieldNames??{}}}}function tn(){return document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]').length}function he(n){let e=[...document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]')].indexOf(n);return e>0?`configurator-${e+1}`:"configurator"}function me(n){return n.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"configurator"}var en=24,$t="tcfg-unlocked:";function Ct(){try{return window.localStorage}catch{return null}}var lt=class{constructor(t,e,i){f(this,"root");f(this,"model");f(this,"settings");f(this,"state");f(this,"L");f(this,"viewer");f(this,"stage");f(this,"frames");f(this,"hint");f(this,"position");f(this,"emptyNote");f(this,"note");f(this,"thumbs",null);f(this,"fsButton",null);f(this,"frameBySrc",new Map);f(this,"active",null);f(this,"stageSeq",0);f(this,"thumbKey","");f(this,"seenViews",new Set);f(this,"groupEls",new Map);f(this,"summaryText");f(this,"priceBox");f(this,"revealButton");f(this,"priceLines");f(this,"summaryEl");f(this,"cta",null);f(this,"shareButton",null);f(this,"dialog",null);f(this,"gateForm",null);f(this,"enquiryForm",null);f(this,"gatePane",null);f(this,"gateTitle",null);f(this,"gateText",null);f(this,"enquiryPane",null);f(this,"enquirySummary",null);f(this,"pending",null);f(this,"returnFocus",null);f(this,"passed");f(this,"started",!1);f(this,"cleanup",[]);f(this,"gateReason","option");this.root=t,this.model=e,this.settings=i,this.L=i.labels;let r=re(e,i.startView);if(i.url){let a=new URLSearchParams(location.search);fe(e,a,i.urlPrefix)&&(r=Tt(e,r,a,i.urlPrefix))}this.state=r;let o=Pt(t,"gate-form"),s=Pt(t,"enquiry-form");this.gateForm=o?new J(o):null,this.enquiryForm=s?new J(s):null,this.passed=!this.gateForm||Ct()?.getItem($t+i.id)==="1",i.priceGate&&!this.gateForm&&console.warn('[tcfg] tcfg-price-gate needs a gate form (tcfg-element="gate-form"); prices are shown.'),this.gateActive&&!this.passed&&i.priceGate&&this.scrubPrices(),this.build(),this.update(!0),this.emit("ready",{})}getState(){return JSON.parse(JSON.stringify(this.state))}setState(t){let e={paint:t.paint??this.state.paint,view:t.view??this.state.view,choices:{...this.state.choices,...t.choices??{}},toggles:{...this.state.toggles,...t.toggles??{}}},i=at(this.model,e,new URLSearchParams,"");this.state=Tt(this.model,this.state,i,""),this.update()}get summary(){return W(this.model,this.state)}get price(){return Rt(this.model,this.state,this.settings.basePriceCents,this.settings.money,this.L).totalCents}get gateActive(){return!!this.gateForm&&(this.settings.gate==="first-change"||this.settings.priceGate)}get optionsLocked(){return!!this.gateForm&&this.settings.gate==="first-change"&&!this.passed}get pricesShown(){return this.settings.showPrices&&(!this.settings.priceGate||!this.gateForm||this.passed)}scrubPrices(){for(let t of _(this.root)){t.removeAttribute("tcfg-price"),t.removeAttribute("data-tcfg-price");for(let e of t.querySelectorAll('[tcfg-field="price"],[data-tcfg-field="price"]'))e.textContent=""}this.root.removeAttribute("tcfg-base-price"),this.root.removeAttribute("data-tcfg-base-price")}shareUrl(){let t=new URL(location.href);return t.hash="",at(this.model,this.state,t.searchParams,this.settings.urlPrefix),t.href}lock(){Ct()?.removeItem($t+this.settings.id),this.passed=!this.gateForm,this.updateCta(),this.update()}destroy(){for(let t of this.cleanup)t();this.cleanup=[],this.gateForm?.destroy(),this.enquiryForm?.destroy(),this.dialog?.open&&this.dialog.close()}emit(t,e){let i={id:this.settings.id,...e};this.root.dispatchEvent(new CustomEvent(`tcfg:${t}`,{detail:i,bubbles:!0}));let r=window.dataLayer;Array.isArray(r)&&t!=="ready"&&t!=="change"&&r.push({event:`tcfg_${t}`,tcfg:i})}build(){let t=this.settings;this.root.classList.add("tcfg"),this.root.setAttribute("data-tcfg-theme",t.theme),this.root.removeAttribute("aria-busy"),this.root.querySelector(":scope > .tcfg-loading")?.remove();let e=this.buildViewer(),i=this.buildOptions(),r=this.buildSummary(),o=a=>this.root.querySelector(`[tcfg-slot="${a}"],[data-tcfg-slot="${a}"]`),s={viewer:o("viewer"),options:o("options"),summary:o("summary")};if(s.viewer||s.options||s.summary){let a=s.summary??s.options??s.viewer;(s.viewer??a).append(e),(s.options??a).append(i),(s.summary??a).append(r)}else{let a=d("div",{class:"tcfg-panel"},i,r);this.root.append(d("div",{class:"tcfg-layout"},e,a))}this.buildDialog(),this.bindKeys()}buildViewer(){let t=this.L;this.frames=d("div",{class:"tcfg-frames"}),this.hint=d("p",{class:"tcfg-hint","aria-live":"polite"}),this.position=d("p",{class:"tcfg-position","aria-live":"polite"}),this.emptyNote=d("p",{class:"tcfg-empty",text:t.empty,hidden:!0});let e=d("button",{type:"button",class:"tcfg-arrow tcfg-arrow-prev","aria-label":t.prev},E("prev")),i=d("button",{type:"button",class:"tcfg-arrow tcfg-arrow-next","aria-label":t.next},E("next"));if(e.addEventListener("click",()=>this.step(-1)),i.addEventListener("click",()=>this.step(1)),this.stage=d("div",{class:"tcfg-stage"},this.frames,this.hint,this.position,e,i,this.emptyNote),this.settings.fullscreen&&document.fullscreenEnabled){this.fsButton=d("button",{type:"button",class:"tcfg-fs","aria-label":t.fullscreen},E("expand")),this.fsButton.addEventListener("click",()=>this.toggleFullscreen()),this.stage.append(this.fsButton);let r=()=>{let o=document.fullscreenElement===this.viewer;this.viewer.classList.toggle("is-fullscreen",o),this.fsButton.setAttribute("aria-label",o?t.exitFullscreen:t.fullscreen),this.fsButton.replaceChildren(E(o?"shrink":"expand")),this.sizeFrames()};document.addEventListener("fullscreenchange",r),this.cleanup.push(()=>document.removeEventListener("fullscreenchange",r))}if(this.bindSwipe(),this.note=d("p",{class:"tcfg-note",hidden:!0}),this.viewer=d("div",{class:"tcfg-viewer"},this.stage),this.settings.thumbs&&(this.thumbs=d("div",{class:"tcfg-thumbs",role:"group","aria-label":t.views}),this.viewer.append(this.thumbs)),this.viewer.append(this.note),"ResizeObserver"in window){let r=new ResizeObserver(()=>this.sizeFrames());r.observe(this.stage),this.cleanup.push(()=>r.disconnect())}return this.viewer}buildOptions(){let t=d("div",{class:"tcfg-groups"});return this.model.groups.forEach((e,i)=>{let r=`tcfg-${this.settings.id}-${e.code}-title`,o=`tcfg-${this.settings.id}-${e.code}-hint`,s=d("div",{class:"tcfg-group-head"},d("h3",{class:"tcfg-group-title",id:r,text:e.title}),d("span",{class:"tcfg-group-index","aria-hidden":"true",text:st(i+1)}),d("p",{class:"tcfg-group-hint",id:o,text:ue(e,this.L)})),a=e.kind==="paint"?this.paintBody(e,r):this.rowsBody(e,r),u=d("section",{class:`tcfg-group tcfg-group-${e.kind}`,"data-group":e.code,"aria-labelledby":r,"aria-describedby":o},s,a);this.groupEls.set(e.code,u),t.append(u)}),t}priceTag(t,e){if(!this.pricesShown)return null;let i=X(t,e,this.settings.money,this.L);if(!i)return null;let r=this.settings.showVat&&Mt(i)?d("span",{class:"tcfg-vat",text:` ${this.L.vat}`}):null;return d("span",{class:`tcfg-price${Mt(i)?"":" tcfg-price-word"}`},i,r)}renderPrices(){for(let t of this.model.groups){let e=this.groupEls.get(t.code);if(e)for(let i of t.options){let r=e.querySelector(`[data-price-for="${CSS.escape(i.code)}"]`);if(r&&r.replaceChildren(this.priceTag(i,t)??""),t.kind==="paint"){let o=e.querySelector(`.tcfg-chip[data-option="${CSS.escape(i.code)}"]`),s=this.pricesShown?X(i,t,this.settings.money,this.L):null;o?.setAttribute("aria-label",s?`${i.name}, ${s}`:i.name)}}}}paintBody(t,e){let i=d("div",{class:"tcfg-chips",role:"radiogroup","aria-labelledby":e});for(let o of t.options){let s=d("button",{type:"button",class:"tcfg-chip",role:"radio","data-option":o.code,"aria-label":o.name,title:o.name});o.image?s.append(d("img",{src:o.image.src,alt:"",loading:"lazy"})):s.style.setProperty("--tcfg-swatch",o.swatch||"#777"),s.addEventListener("click",()=>{this.state.paint!==o.code&&this.choose(()=>this.apply(oe(this.model,this.state,o.code)))}),i.append(s)}this.bindRadioKeys(i);let r=d("div",{class:"tcfg-paint-meta"},d("span",{class:"tcfg-paint-name"}),d("span",{class:"tcfg-paint-note"}),d("span",{class:"tcfg-paint-price"}));return d("div",{class:"tcfg-group-body"},i,r)}rowsBody(t,e){let i=t.kind==="choice",r=d("div",{class:"tcfg-rows",role:i?"radiogroup":"group","aria-labelledby":e});for(let o of t.options){let s=ce(o,t,this.settings.money,this.L),a=d("button",{type:"button",class:"tcfg-row",role:i?"radio":"switch","data-option":o.code});i&&(o.image||t.options.some(u=>u.image))&&a.append(d("span",{class:"tcfg-thumb","aria-hidden":"true"},o.image?d("img",{src:o.image.src,alt:"",loading:"lazy"}):E("wheel"))),a.append(d("span",{class:"tcfg-row-text"},d("span",{class:"tcfg-row-name",text:o.name}),s?d("span",{class:"tcfg-row-sub",text:s}):null),d("span",{class:"tcfg-price-slot","data-price-for":o.code}),d("span",{class:i?"tcfg-radio":"tcfg-switch","aria-hidden":"true"})),a.addEventListener("click",()=>{if(i){if(this.state.choices[t.code]===o.code)return;this.choose(()=>this.apply(se(this.model,this.state,t.code,o.code)))}else this.choose(()=>this.apply(Lt(this.model,this.state,t.code,o.code)))}),r.append(a)}return i&&this.bindRadioKeys(r),d("div",{class:"tcfg-group-body"},r)}buildSummary(){let t=this.L;this.summaryText=d("p",{class:"tcfg-summary-text"}),this.revealButton=d("button",{type:"button",class:"tcfg-reveal","aria-haspopup":"dialog"},E("lock"),d("span",{text:t.clickForPrice})),this.revealButton.addEventListener("click",()=>this.onReveal()),this.priceLines=d("div",{class:"tcfg-sum",tabindex:"-1","aria-live":"polite"}),this.priceBox=d("div",{class:"tcfg-pricebox",hidden:!0},this.revealButton,this.priceLines);let e=d("button",{type:"button",class:"tcfg-summary-toggle","aria-expanded":"false","aria-label":t.showMore},E("chevron"));e.addEventListener("click",()=>{let r=this.summaryEl.classList.toggle("is-open");e.setAttribute("aria-expanded",String(r)),e.setAttribute("aria-label",r?t.showLess:t.showMore)});let i=d("div",{class:"tcfg-summary-actions"});return this.settings.share&&(this.shareButton=d("button",{type:"button",class:"tcfg-button tcfg-button-quiet tcfg-share"},E("share"),d("span",{text:t.share})),this.shareButton.addEventListener("click",()=>this.share()),i.append(this.shareButton)),this.enquiryForm&&(this.cta=d("button",{type:"button",class:"tcfg-button tcfg-cta"}),this.cta.addEventListener("click",()=>this.onCta()),i.append(this.cta)),this.summaryEl=d("div",{class:"tcfg-summary"},d("div",{class:"tcfg-summary-head"},d("span",{class:"tcfg-summary-label",text:t.yourBuild}),e),this.summaryText,this.priceBox,i),this.updateCta(),this.summaryEl}buildDialog(){if(!this.gateForm&&!this.enquiryForm)return;let t=this.L,e=d("button",{type:"button",class:"tcfg-dialog-close","aria-label":t.close},E("close"));e.addEventListener("click",()=>this.dialog?.close());let i=d("div",{class:"tcfg-dialog-panel"},e),r=(s,a,u,c,g)=>{let m=`tcfg-${this.settings.id}-${s}-title`,b=d("div",{class:`tcfg-pane tcfg-pane-${s}`,hidden:!0,"data-title":m},d("h2",{class:"tcfg-dialog-title",id:m,text:a}),u?d("p",{class:"tcfg-dialog-text",text:u}):null,g??null);return b.append(c.wrapper),c.wrapper.removeAttribute("hidden"),c.wrapper.classList.add("tcfg-form"),i.append(b),b};this.gateForm&&(this.gatePane=r("gate",t.gateTitle,t.gateText,this.gateForm),this.gateTitle=this.gatePane.querySelector(".tcfg-dialog-title"),this.gateText=this.gatePane.querySelector(".tcfg-dialog-text"),this.gateForm.onSuccess(()=>this.onUnlock())),this.enquiryForm&&(this.enquirySummary=d("div",{class:"tcfg-dialog-summary"}),this.enquiryPane=r("enquiry",t.enquiryTitle,t.enquiryText,this.enquiryForm,this.enquirySummary),this.enquiryForm.form?.addEventListener("submit",()=>this.fillForms(),!0),this.enquiryForm.onSuccess(()=>this.emit("submit",this.payload()))),this.dialog=d("dialog",{class:"tcfg-dialog"},i);let o=!1;this.dialog.addEventListener("pointerdown",s=>{o=s.target===this.dialog}),this.dialog.addEventListener("click",s=>{s.target===this.dialog&&o&&this.dialog.close(),o=!1}),this.dialog.addEventListener("close",()=>{this.pending=null,this.returnFocus?.focus(),this.returnFocus=null}),this.root.append(this.dialog)}openPane(t,e="option"){if(!this.dialog)return;let i=t==="gate"?this.gatePane:this.enquiryPane;if(i){if(t==="gate"){this.gateReason=e;let r=e==="price";this.gateTitle&&(this.gateTitle.textContent=r?this.L.priceGateTitle:this.L.gateTitle),this.gateText&&(this.gateText.textContent=r?this.L.priceGateText:this.L.gateText);let o=this.gateForm?.form?.querySelector('input[type="submit"], button[type="submit"]');if(o){let s=r?this.L.priceSubmit:this.L.gateSubmit;o instanceof HTMLInputElement?o.value=s:o.textContent=s}}for(let r of[this.gatePane,this.enquiryPane])r&&(r.hidden=r!==i);this.dialog.setAttribute("aria-labelledby",i.getAttribute("data-title")),this.fillForms(),t==="enquiry"&&this.gateForm&&this.enquiryForm&&(this.enquiryForm.email=this.gateForm.email),this.dialog.open||(this.returnFocus=document.activeElement,this.dialog.showModal()),(t==="gate"?this.gateForm:this.enquiryForm)?.focusFirst()}}choose(t){if(this.started||(this.started=!0,this.emit("start",{})),!this.optionsLocked)return t();this.pending=t,this.emit("gate",{reason:"option"}),this.openPane("gate","option")}onReveal(){this.pricesShown||(this.pending=()=>this.priceLines.focus(),this.emit("gate",{reason:"price"}),this.openPane("gate","price"))}onUnlock(){let t=!this.pricesShown;this.passed=!0,Ct()?.setItem($t+this.settings.id,"1"),this.emit("unlock",{email:this.gateForm?.email??""}),this.updateCta(),t&&this.pricesShown&&(ct()||this.root.classList.add("is-price-revealed"),this.update(),this.emit("price",{via:this.gateReason}));let e=this.pending;this.pending=null,setTimeout(()=>{e&&e(),this.dialog?.open&&!this.gatePane?.hidden&&this.dialog.close()},900)}onCta(){this.emit("enquiry",this.payload()),!this.gateActive||this.passed?this.openPane("enquiry"):(this.pending=()=>this.openPane("enquiry"),this.openPane("gate","enquiry"))}updateCta(){this.cta&&(this.cta.textContent=this.gateActive&&this.passed?this.L.ctaUnlocked:this.L.cta)}payload(){let t=this.price;return{state:this.getState(),config:de(this.state),summary:W(this.model,this.state),price:t,priceLabel:t===null?"":U(t,this.settings.money),shareUrl:this.shareUrl()}}fillForms(){let t=this.payload(),e={summary:t.summary,config:JSON.stringify(t.config),price:t.price?`${t.priceLabel}${this.settings.showVat?` ${this.L.vat}`:""}`:"",shareUrl:t.shareUrl,groups:ae(this.model,this.state).map(({group:i,value:r})=>({code:i.code,title:i.title,value:r}))};for(let i of[this.gateForm,this.enquiryForm])i?.fill(e,this.settings.fieldNames);this.enquirySummary&&this.enquirySummary.replaceChildren(d("p",{class:"tcfg-dialog-build",text:t.summary}),t.priceLabel&&this.pricesShown&&t.price?d("p",{class:"tcfg-dialog-price",text:`${this.L.indication} ${e.price}`}):"")}apply(t){t!==this.state&&(this.state=t,this.update())}update(t=!1){let{model:e,state:i}=this;for(let o of e.groups){let s=this.groupEls.get(o.code);if(s){for(let a of s.querySelectorAll("[data-option]")){let u=a.getAttribute("data-option"),c=o.kind==="paint"?i.paint===u:o.kind==="choice"?i.choices[o.code]===u:(i.toggles[o.code]??[]).includes(u);a.setAttribute("aria-checked",String(c)),a.classList.toggle("is-active",c),o.kind!=="toggle"&&(a.tabIndex=c?0:-1)}if(o.kind==="paint"){let a=o.options.find(m=>m.code===i.paint);s.querySelector(".tcfg-paint-name").textContent=a?.name??"";let u=s.querySelector(".tcfg-paint-note");u.textContent=a?.note??"",u.hidden=!a?.note;let c=s.querySelector(".tcfg-paint-price"),g=a?this.priceTag(a,o):null;c.replaceChildren(g??""),c.hidden=!g}}}this.summaryText.textContent=W(e,i),this.renderPrices(),this.renderPriceBox(),this.renderStage(),this.renderThumbs();let r=te(e,i,this.L);if(this.note.textContent=r??"",this.note.hidden=!r,this.settings.url&&!t){let o=new URL(location.href);at(e,i,o.searchParams,this.settings.urlPrefix),history.replaceState(history.state,"",o.href)}this.dialog?.open&&this.fillForms(),t||this.emit("change",this.payload())}renderPriceBox(){let t=this.L,e=this.settings.basePriceCents,i=this.settings.showPrices&&le(this.model,e);if(this.priceBox.hidden=!i,!i)return;let r=this.pricesShown;if(this.revealButton.hidden=r,this.priceLines.hidden=!r,!r)return;let o=Rt(this.model,this.state,e,this.settings.money,t),s=g=>U(g,this.settings.money),a=(g,m,...b)=>d("div",{class:`tcfg-sum-row ${g}`},d("dt",{text:m}),d("dd",{},...b)),u=[];o.baseCents!==null&&u.push(a("tcfg-sum-base",t.theCar,q(t.from,{amount:s(o.baseCents)}))),o.totalCents!==null&&(o.totalCents>0||o.baseCents!==null)&&u.push(a("tcfg-sum-total",o.baseCents===null?t.options:t.total,d("strong",{class:"tcfg-summary-amount",text:s(o.totalCents)}),d("span",{class:"tcfg-vat",text:`${this.settings.showVat?` ${t.vat}`:""} ${t.indicationSuffix}`})));let c=o.onRequest?o.onRequest===1?t.onRequestOne:q(t.onRequestMany,{n:o.onRequest}):"";this.priceLines.replaceChildren(d("dl",{class:"tcfg-sum-list"},...u),c?d("p",{class:"tcfg-sum-note",text:c}):"")}sizes(){let t=Math.round(this.stage?.clientWidth||this.root.clientWidth||1200);return`${Math.max(t,320)}px`}sizeFrames(){let t=this.sizes();for(let e of this.frameBySrc.values())e.srcset&&(e.sizes=t)}frame(t,e){let i=this.frameBySrc.get(t.src);return i?this.frameBySrc.delete(t.src):(i=d("img",{class:"tcfg-frame",alt:"",decoding:"async",draggable:"false"}),t.srcset&&(i.srcset=t.srcset,i.sizes=this.sizes()),i.src=t.src,i.setAttribute("aria-hidden","true"),this.frames.append(i)),this.frameBySrc.set(t.src,i),e&&(i.alt=e),this.trimFrames(),i}trimFrames(){for(let[t,e]of this.frameBySrc){if(this.frameBySrc.size<=en)break;e===this.active||e.classList.contains("is-leaving")||(e.remove(),this.frameBySrc.delete(t))}}altFor(t){let e=nt(this.model)?.options.find(o=>o.code===this.state.paint)?.name,i=this.model.views.find(o=>o.code===t),r=i&&i.name!==i.code?i.name:t?`${this.L.views} ${t}`:"";return[e,r].filter(Boolean).join(" \u2014 ")}async renderStage(){let t=++this.stageSeq,{model:e,state:i}=this,r=G(e,i,i.view);this.emptyNote.hidden=!!r,this.stage.classList.toggle("is-empty",!r);let o=I(e,i).length;if(this.stage.classList.toggle("has-one-view",o<2),this.position.textContent=r?this.positionLabel():"",this.setHint(ee(e,r,this.L)),!r){this.active?.classList.remove("is-active"),this.active?.setAttribute("aria-hidden","true"),this.active=null;return}let s=this.frame(r.image,this.altFor(i.view));if(s!==this.active){if(await ge(s),t!==this.stageSeq)return;let a=this.active;a||(s.style.transition="none",requestAnimationFrame(()=>requestAnimationFrame(()=>{s.style.transition=""}))),s.removeAttribute("aria-hidden"),s.classList.add("is-active"),s.classList.remove("is-leaving"),a&&(a.classList.remove("is-active"),a.classList.add("is-leaving"),a.setAttribute("aria-hidden","true"),setTimeout(()=>a.classList.remove("is-leaving"),ct()?0:650)),this.active=s}i.view&&!this.seenViews.has(i.view)&&(this.seenViews.add(i.view),this.emit("view",{view:i.view})),this.preload(r)}positionLabel(){let{model:t,state:e}=this,i=I(t,e),r=i.findIndex(a=>a.code===e.view),o=i[r],s=o&&o.name!==o.code?`  ${o.name}`:"";return`${st(r+1)} / ${st(i.length)}${s}`}setHint(t){let e=t??"";this.hint.textContent!==e&&(this.hint.textContent=e),this.hint.hidden=!e}preload(t){let{model:e,state:i}=this,r=[it(e,i,i.view,-1),it(e,i,i.view,1)];for(let o of r){let s=o?G(e,i,o):null;s&&s.image.src!==t.image.src&&this.frame(s.image,"")}for(let o of ie(e,i))this.frame(o.image,"")}step(t){let e=it(this.model,this.state,this.state.view,t);e&&e!==this.state.view&&this.apply({...this.state,view:e})}showView(t){t!==this.state.view&&this.apply({...this.state,view:t})}renderThumbs(){if(!this.thumbs)return;let{model:t,state:e}=this,i=I(t,e),r=i.map(o=>o.code).join(",");this.thumbs.hidden=i.length<2,r!==this.thumbKey&&(this.thumbKey=r,this.thumbs.replaceChildren(...i.map(o=>{let s=d("button",{type:"button",class:"tcfg-thumb-button","data-view":o.code,"aria-label":o.name!==o.code?o.name:`${this.L.views} ${o.code}`},d("img",{alt:"",loading:"lazy",decoding:"async",draggable:"false"}));return s.addEventListener("click",()=>this.showView(o.code)),s.addEventListener("keydown",a=>{a.key!=="ArrowLeft"&&a.key!=="ArrowRight"||(a.preventDefault(),a.stopPropagation(),this.step(a.key==="ArrowRight"?1:-1),this.thumbs.querySelector(`[data-view="${this.state.view}"]`)?.focus())}),s})));for(let o of this.thumbs.querySelectorAll("[data-view]")){let s=o.getAttribute("data-view"),a=G(t,e,s),u=o.querySelector("img");a&&u.getAttribute("src")!==a.image.src&&(a.image.srcset?(u.srcset=a.image.srcset,u.sizes="160px"):u.removeAttribute("srcset"),u.src=a.image.src);let c=s===e.view;if(o.setAttribute("aria-pressed",String(c)),o.classList.toggle("is-active",c),o.tabIndex=c?0:-1,c&&this.thumbs.scrollWidth>this.thumbs.clientWidth){let g=o.offsetLeft-(this.thumbs.clientWidth-o.offsetWidth)/2;this.thumbs.scrollTo({left:g,behavior:ct()?"auto":"smooth"})}}}bindKeys(){let t=e=>{e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||this.dialog?.open||e.target?.closest('input, textarea, select, [contenteditable], [role="radiogroup"]')||(e.preventDefault(),this.step(e.key==="ArrowRight"?1:-1))};this.root.addEventListener("keydown",t),this.cleanup.push(()=>this.root.removeEventListener("keydown",t)),this.stage.tabIndex=0,this.stage.setAttribute("role","region"),this.stage.setAttribute("aria-label",this.L.views)}bindRadioKeys(t){t.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;let r=[...t.querySelectorAll('[role="radio"]')],o=r.indexOf(document.activeElement);if(o<0)return;e.preventDefault(),e.stopPropagation();let s=r.length,a=e.key==="Home"?0:e.key==="End"?s-1:e.key==="ArrowLeft"||e.key==="ArrowUp"?(o-1+s)%s:(o+1)%s;r[a].focus(),r[a].click()})}bindSwipe(){let t=0,e=0,i=null;this.stage.addEventListener("pointerdown",r=>{r.pointerType!=="mouse"&&(i=r.pointerId,t=r.clientX,e=r.clientY)}),this.stage.addEventListener("pointerup",r=>{if(r.pointerId!==i)return;i=null;let o=r.clientX-t,s=r.clientY-e;Math.abs(o)>=40&&Math.abs(o)>1.5*Math.abs(s)&&this.step(o<0?1:-1)}),this.stage.addEventListener("pointercancel",()=>{i=null})}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():this.viewer.requestFullscreen?.().catch(()=>{})}async share(){let t=this.shareUrl();if(this.emit("share",{shareUrl:t}),typeof matchMedia=="function"&&matchMedia("(pointer: coarse)").matches&&navigator.share)try{await navigator.share({url:t,title:document.title,text:W(this.model,this.state)});return}catch{}try{await navigator.clipboard.writeText(t);let i=this.shareButton.querySelector("span");i.textContent=this.L.copied,setTimeout(()=>{i.textContent=this.L.share},2e3)}catch{window.prompt(this.L.share,t)}}};var nn="0.2.0",rn='[tcfg-element="configurator"],[data-tcfg-element="configurator"]',ut=[],on=document.currentScript,Y=new WeakMap;function we(){if(document.getElementById("tcfg-styles")||(on??document.querySelector('script[src*="webflow-configurator"],script[src*="configurator.js"]'))?.getAttribute("tcfg-css")==="false")return;let t=document.createElement("style");t.id="tcfg-styles",t.textContent=Ot,document.head.prepend(t)}async function ve(n,t={}){let e=Y.get(n);if(e)return e;let i=(async()=>{we(),n.classList.add("tcfg"),n.setAttribute("aria-busy","true");let r;t.data?r=t.data:(await _t(_(n)),r=jt(n));let{model:o}=yt(r);if(!o.groups.length)return console.warn('[tcfg] No option groups found for this configurator. See the setup guide: tcfg-element="group" / "option".',n),n.removeAttribute("aria-busy"),null;let s=new lt(n,o,be(n,t));return ut.push(s),s})();return Y.set(n,i),i.then(r=>{r||Y.delete(n)},()=>{Y.delete(n),n.removeAttribute("aria-busy")}),i}function sn(n){n.destroy();let t=ut.indexOf(n);t>=0&&ut.splice(t,1),Y.delete(n.root)}function ye(){we();for(let n of document.querySelectorAll(rn))n.getAttribute("tcfg-auto")!=="false"&&(n.closest(".w-condition-invisible")||ve(n).catch(t=>console.error("[tcfg] The configurator could not start.",t)))}var xe={version:nn,init:ve,destroy:sn,instances:ut,normalize:yt};window.TornanteConfigurator=xe;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ye,{once:!0}):ye();var _n=xe;})();
//# sourceMappingURL=configurator.js.map
