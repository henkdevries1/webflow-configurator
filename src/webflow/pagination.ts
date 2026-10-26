/* A Webflow Collection List shows at most 100 items per page. With
   pagination switched on, this loads the following pages in the background
   (like Finsweet's List Load) and appends their items to the list on this
   page, so a Renders collection of any size works.

   Webflow pagination links look like "?a1b2c3d4_page=2"; the part before
   "_page" identifies the list, so the same list is found on the fetched
   page even when there are several. */

const MAX_PAGES = 50;
/** One load per list, also when two configurators share the same lists. */
const loading = new WeakMap<Element, Promise<void>>();

function pageKey(href: string): string | null {
  const url = new URL(href, document.baseURI);
  for (const key of url.searchParams.keys()) if (/_page$/.test(key)) return key;
  return null;
}

function nextLink(scope: ParentNode, key: string): HTMLAnchorElement | null {
  for (const a of scope.querySelectorAll<HTMLAnchorElement>('a.w-pagination-next')) {
    if (pageKey(a.getAttribute('href') ?? '') === key) return a;
  }
  return null;
}

async function loadList(list: Element, first: HTMLAnchorElement): Promise<void> {
  const key = pageKey(first.getAttribute('href') ?? '');
  const items = list.querySelector('.w-dyn-items');
  if (!key || !items) return;
  let href: string | null = first.getAttribute('href');
  const seen = new Set<string>();
  for (let page = 0; href && page < MAX_PAGES; page++) {
    const url = new URL(href, document.baseURI).href;
    if (seen.has(url)) break;
    seen.add(url);
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) break;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const link = nextLink(doc, key);
    const remote = link?.closest('.w-dyn-list')?.querySelector('.w-dyn-items')
      ?? findListByKey(doc, key);
    if (!remote) break;
    for (const item of [...remote.children]) items.appendChild(document.importNode(item, true));
    href = link?.getAttribute('href') ?? null;
  }
  for (const nav of list.querySelectorAll('.w-pagination-wrapper')) (nav as HTMLElement).hidden = true;
}

/** The last page has no "next" link: find the list through its "previous" link. */
function findListByKey(doc: Document, key: string): Element | null {
  for (const a of doc.querySelectorAll<HTMLAnchorElement>('a.w-pagination-previous')) {
    if (pageKey(a.getAttribute('href') ?? '') === key) return a.closest('.w-dyn-list')?.querySelector('.w-dyn-items') ?? null;
  }
  return null;
}

/** Loads every following page of the paginated Collection Lists that hold
 *  configurator data. Failures are logged; the configurator then runs with
 *  what it has. */
export async function loadAllPages(elements: Element[]): Promise<void> {
  const lists = new Set<Element>();
  for (const el of elements) {
    const list = el.closest('.w-dyn-list');
    if (list) lists.add(list);
  }
  await Promise.all([...lists].map((list) => {
    let p = loading.get(list);
    if (!p) {
      const next = list.querySelector<HTMLAnchorElement>('a.w-pagination-next');
      p = next
        ? loadList(list, next).catch((err) => console.warn('[tcfg] Could not load the next page of a Collection List.', err))
        : Promise.resolve();
      loading.set(list, p);
    }
    return p;
  }));
}
