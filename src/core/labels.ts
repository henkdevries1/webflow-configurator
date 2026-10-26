/* Visitor copy, English and Dutch. Every label can be overridden per
   configurator with an attribute `tcfg-label-<key>` on the root element
   (e.g. tcfg-label-cta="Request a quote") or `labels` in the JSON/JS
   options. `{n}`, `{total}`, `{name}`, `{list}` are filled in. */

export const LABELS = {
  en: {
    cta: 'Enquire',
    ctaUnlocked: 'Send my build',
    yourBuild: 'Your build',
    showMore: 'Show the whole build',
    showLess: 'Show less',
    indication: 'Price indication',
    included: 'Included',
    standard: 'Standard',
    vat: 'excl. VAT',
    share: 'Share',
    copied: 'Link copied',
    views: 'Views',
    prev: 'Previous view',
    next: 'Next view',
    fullscreen: 'View full screen',
    exitFullscreen: 'Exit full screen',
    close: 'Close',
    loading: 'Loading the configurator…',
    empty: 'Renders of this colour are on their way.',
    partial: '{name}: {n} of {total} views rendered so far.',
    shown: 'Shown {list} — not rendered yet',
    with: 'with',
    without: 'without',
    and: 'and',
    optional: 'Optional',
    optionalAny: 'Optional · add any',
    pickColour: '{n} colours · pick one',
    pickOne: '{n} options · pick one',
    gateTitle: 'See your build',
    gateText: 'Leave your email address to configure the car.',
    enquiryTitle: 'Send your build',
    enquiryText: 'We will get back to you about this build.',
  },
  nl: {
    cta: 'Informatie aanvragen',
    ctaUnlocked: 'Verstuur mijn configuratie',
    yourBuild: 'Jouw configuratie',
    showMore: 'Toon de hele configuratie',
    showLess: 'Minder tonen',
    indication: 'Prijsindicatie',
    included: 'Inbegrepen',
    standard: 'Standaard',
    vat: 'excl. btw',
    share: 'Delen',
    copied: 'Link gekopieerd',
    views: 'Standpunten',
    prev: 'Vorig standpunt',
    next: 'Volgend standpunt',
    fullscreen: 'Volledig scherm',
    exitFullscreen: 'Volledig scherm sluiten',
    close: 'Sluiten',
    loading: 'De configurator wordt geladen…',
    empty: 'De renders van deze kleur komen eraan.',
    partial: '{name}: {n} van {total} standpunten gerenderd.',
    shown: 'Getoond {list} — nog niet gerenderd',
    with: 'met',
    without: 'zonder',
    and: 'en',
    optional: 'Optioneel',
    optionalAny: 'Optioneel · kies wat je wilt',
    pickColour: '{n} kleuren · kies er één',
    pickOne: '{n} opties · kies er één',
    gateTitle: 'Bekijk jouw configuratie',
    gateText: 'Laat je e-mailadres achter om de auto samen te stellen.',
    enquiryTitle: 'Verstuur je configuratie',
    enquiryText: 'We nemen contact met je op over deze configuratie.',
  },
} as const;

export type LabelKey = keyof typeof LABELS.en;
export type Labels = Record<LabelKey, string>;

export function labelsFor(lang: string, overrides: Partial<Record<string, string>> = {}): Labels {
  const base: Labels = { ...(lang.toLowerCase().startsWith('nl') ? LABELS.nl : LABELS.en) };
  for (const key of Object.keys(base) as LabelKey[]) {
    const v = overrides[key];
    if (typeof v === 'string' && v.trim()) base[key] = v;
  }
  return base;
}

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** "a", "a and b", "a, b and c". */
export function list(items: string[], and: string): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

// ---------------------------------------------------------------- money

export interface MoneyFormat {
  locale: string;
  currency: string;
}

const whole = (cents: number) => cents % 100 === 0;

/** "€4,850" (en-GB) / "€ 4.850" (nl-NL); decimals only when not whole. */
export function formatMoney(cents: number, f: MoneyFormat): string {
  try {
    return new Intl.NumberFormat(f.locale, {
      style: 'currency',
      currency: f.currency,
      minimumFractionDigits: whole(cents) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${f.currency} ${(cents / 100).toFixed(whole(cents) ? 0 : 2)}`;
  }
}

/** €10 million — anything above is a typo. */
export const MAX_PRICE_CENTS = 1_000_000_000;

/** Reads what an editor types in a CMS field: "4850", "4850.5", "4.850",
 *  "4.850,50", "4,850.50", "€ 4 850", "4850,-", "v.a. € 4.850", "ca. 4.850
 *  incl. btw". The text must hold exactly ONE amount; empty, unreadable,
 *  negative ("-500") or ambiguous ("2x 500") → null: no price shown, rather
 *  than a wrong one. */
export function parseAmount(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? clamp(Math.round(input * 100)) : null;
  if (typeof input !== 'string') return null;
  const text = input.replace(/\u2212/g, '-');
  const amounts = text.match(/\d[\d.,\s\u00a0]*\d|\d/g);
  if (!amounts || amounts.length !== 1) return null;
  const at = text.indexOf(amounts[0]);
  if (/-\s*(?:[^\d\s]{1,3}\s*)?$/.test(text.slice(0, at))) return null; // "-500", "- € 500"
  const raw = amounts[0].replace(/[\s\u00a0]/g, '');
  let normal: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw) || /^\d+(,\d{1,2})?$/.test(raw)) {
    normal = raw.replace(/\./g, '').replace(',', '.'); // 4.850,50 / 4850,5
  } else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(raw) || /^\d+(\.\d{1,2})?$/.test(raw)) {
    normal = raw.replace(/,/g, ''); // 4,850.50 / 4850.5
  } else {
    return null;
  }
  const cents = Math.round(Number(normal) * 100);
  return Number.isFinite(cents) && cents >= 0 ? clamp(cents) : null;
}

function clamp(cents: number): number | null {
  return cents > MAX_PRICE_CENTS ? null : cents;
}
