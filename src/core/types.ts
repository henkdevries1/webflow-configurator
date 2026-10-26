/* The configurator's data model — what every data source (Webflow DOM
   attributes, a JSON block, the JS API) is turned into before anything is
   rendered. Mirrors the Venduetto model (src/components/configurator/
   model.ts) without the database ids. */

export type GroupKind = 'paint' | 'choice' | 'toggle';

export interface Image {
  src: string;
  srcset: string | null;
}

export interface Option {
  code: string;
  name: string;
  note: string;
  /** Paint chip colour (#rgb / #rrggbb / any CSS colour). */
  swatch: string | null;
  /** Choice thumbnail, or a paint chip image. */
  image: Image | null;
  /** Paint/choice: preselected. Toggle: on by default. */
  isDefault: boolean;
  /** Whole cents, or null = no price shown. */
  priceCents: number | null;
}

export interface Group {
  code: string;
  kind: GroupKind;
  title: string;
  /** Visible on the renders. false = the group never changes the image. */
  onRenders: boolean;
  options: Option[];
}

export interface View {
  code: string;
  name: string;
}

/** One render set of one paint: its deviations from the default build
 *  (entry refs, see resolve.ts) and its image per view. */
export interface RenderSet {
  entries: string[];
  views: Record<string, Image>;
}

export interface Model {
  views: View[];
  groups: Group[];
  /** Base set (the default build): paint code → view code → image. */
  renders: Record<string, Record<string, Image>>;
  /** Every other set per paint code. */
  renderSets: Record<string, RenderSet[]>;
}

export interface BuildState {
  paint: string | null;
  view: string | null;
  /** choice group code → option code */
  choices: Record<string, string>;
  /** toggle group code → the codes that are on, in option order */
  toggles: Record<string, string[]>;
}

/** The paint code used when a configurator has no paint group: every render
 *  belongs to this one virtual paint. */
export const NO_PAINT = '_';
