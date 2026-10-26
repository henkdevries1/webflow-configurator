/* Tornante Configurator for Webflow — entry point.

   <script defer src="https://cdn.jsdelivr.net/npm/@tornante/webflow-configurator@1/dist/configurator.js"></script>

   Every element with tcfg-element="configurator" becomes a configurator
   once the page has loaded (and paginated Collection Lists are complete).
   window.TornanteConfigurator gives scripts the instances and init(). */

import css from './ui/styles.css';
import { normalize, type RawData } from './core/normalize.ts';
import { readDom, dataElements } from './webflow/read-dom.ts';
import { loadAllPages } from './webflow/pagination.ts';
import { Configurator, readSettings, type Options } from './ui/configurator.ts';

declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev';
const ROOT = '[tcfg-element="configurator"],[data-tcfg-element="configurator"]';

const instances: Configurator[] = [];
// Read now: document.currentScript is only set while this script first runs.
const ownScript = document.currentScript;
const byRoot = new WeakMap<Element, Promise<Configurator | null>>();

function injectCss() {
  if (document.getElementById('tcfg-styles')) return;
  const current = ownScript ?? document.querySelector('script[src*="webflow-configurator"],script[src*="configurator.js"]');
  if (current?.getAttribute('tcfg-css') === 'false') return;
  const style = document.createElement('style');
  style.id = 'tcfg-styles';
  style.textContent = css;
  document.head.prepend(style); // first, so the site's own CSS wins
}

/** Turns `root` into a configurator. Data comes from `options.data` (JSON),
 *  else from the tcfg-element data inside the root (or on the page). */
async function init(root: HTMLElement, options: Options & { data?: RawData } = {}): Promise<Configurator | null> {
  const existing = byRoot.get(root);
  if (existing) return existing;
  const run = (async () => {
    injectCss();
    root.classList.add('tcfg');
    root.setAttribute('aria-busy', 'true');
    let raw: RawData;
    if (options.data) raw = options.data;
    else {
      await loadAllPages(dataElements(root));
      raw = readDom(root);
    }
    const { model } = normalize(raw);
    if (!model.groups.length) {
      console.warn('[tcfg] No option groups found for this configurator. See the setup guide: tcfg-element="group" / "option".', root);
      root.removeAttribute('aria-busy');
      return null;
    }
    const c = new Configurator(root, model, readSettings(root, options));
    instances.push(c);
    return c;
  })();
  byRoot.set(root, run);
  // A configurator that did not start (no data yet, an error) may be tried again.
  run.then((c) => { if (!c) byRoot.delete(root); }, () => { byRoot.delete(root); root.removeAttribute('aria-busy'); });
  return run;
}

/** Removes a configurator (e.g. before a page transition); init() may run again. */
function destroy(c: Configurator) {
  c.destroy();
  const i = instances.indexOf(c);
  if (i >= 0) instances.splice(i, 1);
  byRoot.delete(c.root);
}

function initAll() {
  injectCss();
  for (const root of document.querySelectorAll<HTMLElement>(ROOT)) {
    if (root.getAttribute('tcfg-auto') === 'false') continue;
    // Hidden by Webflow conditional visibility (e.g. on a CMS template): not this page's configurator.
    if (root.closest('.w-condition-invisible')) continue;
    init(root).catch((err) => console.error('[tcfg] The configurator could not start.', err));
  }
}

const api = { version: VERSION, init, destroy, instances, normalize };
(window as any).TornanteConfigurator = api;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll, { once: true });
else initAll();

export default api;
