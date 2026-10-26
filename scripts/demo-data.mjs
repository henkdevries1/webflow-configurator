// Demo data: a fictional car with three paints, two wheel options and two
// cockpit toggles, and generated SVG "renders" with deliberate gaps so the
// demo shows the fallback hints. File names follow the module's naming
// rules, with a Webflow-like asset id in front.

export const paints = [
  { name: 'Rosso Cordoba', code: 'rosso', hex: '#8c1c13', default: true },
  { name: 'Verde Pino', code: 'verde', hex: '#1f3b2d', price: '2.500' },
  { name: 'Oro Chiaro', code: 'oro', hex: '#b8954a', price: '3.900', note: 'Three-layer pearl' },
];
export const wheels = [
  { name: 'Stradale', default: true, note: '17" five-spoke' },
  { name: 'Billet', price: '4.850', note: '17" machined from solid' },
];
export const cockpit = [
  { name: 'Roll cage', code: 'roll-cage', price: '6.250' },
  { name: 'Helmet shell', code: 'helmet-shell', default: true, price: '0' },
];
export const trims = [
  { name: 'Leather', default: true },
  { name: 'Alcantara', price: '1.200' },
];
export const views = ['01', '02', '03', '04', '05', '06'];
const viewNames = ['Front three-quarter', 'Side', 'Rear three-quarter', 'Rear', 'Front', 'Top'];
export const viewList = views.map((code, i) => ({ code, name: viewNames[i] }));

/** Which views exist per paint × combination (suffix "" = base). */
const coverage = {
  rosso: { '': views, 'roll-cage': ['01', '02', '03', '04'], 'zonder-helmet-shell': ['01', '02', '03'], 'roll-cage+zonder-helmet-shell': ['02'], billet: views, 'billet+roll-cage': ['02', '03'] },
  verde: { '': views, 'roll-cage': views, 'zonder-helmet-shell': views, billet: ['01', '02', '05'] },
  oro: { '': ['01', '02', '03', '04'], billet: ['02'] },
};

let n = 0;
const assetId = () => (0x65f1a2b3c4d5e6f7a8b9c0n + BigInt(n++)).toString(16).padStart(24, '0');

/** Every render as { file, paint, suffix, view }. One has a camera-roll
 *  name and gets its paint/view/set from CMS fields instead. */
export function renderList() {
  const out = [];
  for (const [paint, sets] of Object.entries(coverage)) {
    for (const [suffix, list] of Object.entries(sets)) {
      for (const view of list) {
        const name = `${paint}_${view}${suffix ? `_${suffix}` : ''}.svg`;
        out.push({ file: `${assetId()}_${name}`, paint, suffix, view });
      }
    }
  }
  // An editor uploaded this one straight from KeyShot: explicit fields.
  out.push({ file: `${assetId()}_KeyShot-export.0412.svg`, paint: 'verde', suffix: 'billet+roll-cage', view: '02', explicit: true });
  return out;
}

const shade = (hex, f) => {
  const c = hex.slice(1).match(/../g).map((x) => parseInt(x, 16));
  return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('')}`;
};

/** A simple stylised car; the view changes the camera (mirror/scale/tilt). */
export function renderSvg({ paint, suffix, view }) {
  const hex = paints.find((p) => p.code === paint).hex;
  const opts = new Set(suffix.split('+').filter(Boolean));
  const cage = opts.has('roll-cage');
  const shell = !opts.has('zonder-helmet-shell');
  const billet = opts.has('billet');
  const i = views.indexOf(view);
  const flip = i % 2 === 1 ? 'scale(-1,1) translate(-1600,0)' : '';
  const zoom = [1, 1.08, 0.96, 1.12, 1.04, 0.92][i];
  const wheel = (cx) => billet
    ? `<g><circle cx="${cx}" cy="640" r="96" fill="#1b1b1b"/><circle cx="${cx}" cy="640" r="70" fill="#c9c9c9"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${cx + 42 * Math.cos(a * Math.PI / 180)}" cy="${640 + 42 * Math.sin(a * Math.PI / 180)}" r="9" fill="#8a8a8a"/>`).join('')}<circle cx="${cx}" cy="640" r="14" fill="#555"/></g>`
    : `<g><circle cx="${cx}" cy="640" r="96" fill="#1b1b1b"/><circle cx="${cx}" cy="640" r="70" fill="#9b9b9b"/>${[0, 72, 144, 216, 288].map((a) => `<path d="M${cx} 640 L${cx + 66 * Math.cos(a * Math.PI / 180)} ${640 + 66 * Math.sin(a * Math.PI / 180)}" stroke="#e2e2e2" stroke-width="16" stroke-linecap="round"/>`).join('')}<circle cx="${cx}" cy="640" r="16" fill="#e2e2e2"/></g>`;
  const labels = [paints.find((p) => p.code === paint).name, billet ? 'Billet' : 'Stradale', cage ? 'Roll cage' : null, shell ? 'Helmet shell' : 'No helmet shell'].filter(Boolean).join(' · ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceae4"/><stop offset="1" stop-color="#d9d6ce"/></linearGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hex, 1.35)}"/><stop offset=".55" stop-color="${hex}"/><stop offset="1" stop-color="${shade(hex, 0.6)}"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#bg)"/>
<ellipse cx="800" cy="745" rx="620" ry="38" fill="rgba(0,0,0,.18)"/>
<g transform="translate(800 450) scale(${zoom}) translate(-800 -450)"><g transform="${flip}">
<path d="M230 620 C230 520 300 500 420 480 L560 380 C620 330 700 320 820 320 L980 322 C1080 326 1140 360 1210 440 L1330 470 C1400 485 1420 540 1410 620 Z" fill="url(#body)"/>
<path d="M590 392 C640 350 700 342 800 342 L960 344 C1040 348 1090 380 1150 440 L600 450 Z" fill="#20262b" opacity=".85"/>
${cage ? '<path d="M640 446 L720 352 L980 352 L1080 446 M760 352 L760 446 M940 352 L940 446 M720 352 L1080 446" stroke="#d8d8d8" stroke-width="10" fill="none" stroke-linecap="round"/>' : ''}
${shell ? `<path d="M1000 330 C1040 270 1110 270 1150 330 Z" fill="${shade(hex, 0.85)}"/><path d="M860 326 C900 266 970 266 1010 326 Z" fill="${shade(hex, 0.85)}"/>` : ''}
<path d="M240 600 L1405 600" stroke="${shade(hex, 0.55)}" stroke-width="6"/>
${wheel(470)}${wheel(1170)}
</g></g>
<text x="40" y="860" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="rgba(0,0,0,.45)">DEMO RENDER · ${view} ${viewNames[i]} · ${labels}</text>
</svg>`;
}
