/* Reads the configurator's data from the page: elements with
   tcfg-element="group" | "option" | "view" | "render" (hand-built or as
   Collection List items) and/or a JSON block
   <script type="application/json" tcfg-element="json">.

   Every value can be given two ways, whichever is easier in Webflow:
   - an attribute on the element: tcfg-name="Billet" (CMS-bound custom
     attributes work), or data-tcfg-name;
   - a child element holding the text: <div tcfg-field="name">Billet</div>
     (a Text Block bound to a CMS field).
   Images: an <img> inside the element (an Image bound to a CMS field), or
   tcfg-src. Webflow's empty bindings (.w-dyn-bind-empty) and elements
   hidden by conditional visibility (.w-condition-invisible) count as
   empty. */

import type { RawData, RawGroup, RawOption, RawRender, RawView } from '../core/normalize.ts';
import type { Image } from '../core/types.ts';

export const ELEMENT = 'tcfg-element';

export function attr(el: Element, key: string): string | null {
  return el.getAttribute(`tcfg-${key}`) ?? el.getAttribute(`data-tcfg-${key}`);
}

function isEmpty(el: Element): boolean {
  return el.classList.contains('w-dyn-bind-empty') || !!el.closest('.w-condition-invisible');
}

/** The closest tcfg-element ancestor of `child` must be `owner`, so fields
 *  of a nested element never leak into its parent. */
function ownedBy(child: Element, owner: Element): boolean {
  const holder = child.parentElement?.closest(`[${ELEMENT}],[data-${ELEMENT}]`);
  return holder === owner;
}

export function field(el: Element, key: string): string | undefined {
  const a = attr(el, key);
  if (a !== null) return a;
  for (const child of el.querySelectorAll(`[tcfg-field="${key}"],[data-tcfg-field="${key}"]`)) {
    if (!ownedBy(child, el) || isEmpty(child)) continue;
    const text = (child.textContent ?? '').trim();
    if (text) return text;
  }
  return undefined;
}

export function imageOf(el: Element, key = 'src'): Image | null {
  const direct = attr(el, key);
  if (direct) return { src: direct, srcset: null };
  const imgs = el instanceof HTMLImageElement ? [el] : [...el.querySelectorAll('img')];
  for (const img of imgs) {
    if (img !== el && !ownedBy(img, el)) continue;
    if (isEmpty(img)) continue;
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;
    return { src: new URL(src, document.baseURI).href, srcset: img.getAttribute('srcset') };
  }
  return null;
}

/** A paint chip colour: tcfg-swatch / a tcfg-field="swatch" text, else the
 *  background colour of the tcfg-field="swatch" element (a CMS Color field
 *  bound to its background). */
function swatchOf(el: Element): string | undefined {
  const text = field(el, 'swatch');
  if (text) return text;
  for (const child of el.querySelectorAll('[tcfg-field="swatch"],[data-tcfg-field="swatch"]')) {
    if (!ownedBy(child, el) || isEmpty(child)) continue;
    const bg = (child as HTMLElement).style.backgroundColor || getComputedStyle(child).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg)) return bg;
  }
  return undefined;
}

function kindOfElement(el: Element): string | null {
  return el.getAttribute(ELEMENT) ?? el.getAttribute(`data-${ELEMENT}`);
}

/** The data elements that belong to `root`: inside it, or — when it holds
 *  none — anywhere on the page outside another configurator. */
export function dataElements(root: Element, doc: Document = root.ownerDocument): Element[] {
  const selector = ['group', 'option', 'view', 'render', 'json']
    .map((k) => `[${ELEMENT}="${k}"],[data-${ELEMENT}="${k}"]`)
    .join(',');
  const inside = [...root.querySelectorAll(selector)];
  if (inside.length) return inside;
  return [...doc.querySelectorAll(selector)].filter((el) => {
    const owner = el.closest(`[${ELEMENT}="configurator"],[data-${ELEMENT}="configurator"]`);
    return !owner || owner === root;
  });
}

export function readDom(root: Element): RawData {
  const data: Required<RawData> = { groups: [], options: [], views: [], renders: [] };
  for (const el of dataElements(root)) {
    // Hidden by conditional visibility (on the item or any wrapper): not part of the data.
    if (el.closest('.w-condition-invisible')) continue;
    switch (kindOfElement(el)) {
      case 'json':
        mergeJson(data, el.textContent ?? '');
        break;
      case 'group':
        data.groups.push({
          code: field(el, 'code'),
          kind: field(el, 'kind'),
          title: field(el, 'title') ?? field(el, 'name'),
          onRenders: field(el, 'renders'),
          sort: field(el, 'sort'),
        } satisfies RawGroup);
        break;
      case 'option':
        data.options.push({
          group: field(el, 'group'),
          code: field(el, 'code'),
          name: field(el, 'name'),
          note: field(el, 'note'),
          price: field(el, 'price') ?? null,
          default: field(el, 'default'),
          swatch: swatchOf(el) ?? null,
          image: imageOf(el, 'image'),
          sort: field(el, 'sort'),
        } satisfies RawOption);
        break;
      case 'view':
        data.views.push({ code: field(el, 'code'), name: field(el, 'name'), sort: field(el, 'sort') } satisfies RawView);
        break;
      case 'render': {
        const img = imageOf(el);
        if (!img) break;
        data.renders.push({
          src: img.src,
          srcset: img.srcset,
          paint: field(el, 'paint') || null,
          view: field(el, 'view') || null,
          // An empty bound field means "read it from the file name", not "base".
          set: field(el, 'set') || null,
        } satisfies RawRender);
        break;
      }
    }
  }
  return data;
}

function mergeJson(into: Required<RawData>, text: string) {
  try {
    const json = JSON.parse(text) as RawData;
    into.groups.push(...(json.groups ?? []));
    into.options.push(...(json.options ?? []));
    into.views.push(...(json.views ?? []));
    into.renders.push(...(json.renders ?? []));
  } catch (err) {
    console.warn('[tcfg] The tcfg-element="json" block is not valid JSON.', err);
  }
}
