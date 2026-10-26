/* The canonical key of a render set: its entries sorted by option ref, each
   '!'-prefixed when off, joined by ','; '' for the base set. Two sets with
   the same key depict the same build. (Venduetto: setKey() in
   src/lib/configurator/render-sets.ts.) */

export function setKey(entries: readonly string[]): string {
  const byRef = new Map<string, string>();
  for (const e of entries) {
    const off = e.startsWith('!');
    const ref = (off ? e.slice(1) : e).toLowerCase();
    byRef.set(ref, off ? `!${ref}` : ref);
  }
  return [...byRef.keys()].sort().map((ref) => byRef.get(ref)!).join(',');
}
