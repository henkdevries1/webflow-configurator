/* One configurator on the page: builds the viewer, the option cards, the
   summary and the dialog inside its root element, and keeps them in step
   with the build state. Port of the Venduetto public configurator
   (src/scripts/configurator.ts) without the server parts: the e-mail gate
   and the enquiry are Webflow forms, analytics are DOM events (and
   window.dataLayer when GTM is present). */

import {
  availableViews, buildConfig, groupHint, initialState, nearbyRenders, optionPriceLabel, optionSub,
  pad, paintGroup, partialNote, priceIndication, renderHint, stageRender, stepView, summarize, summaryByGroup,
  withChoice, withPaint, withToggle, type StageRender,
} from '../core/model.ts';
import { formatMoney, labelsFor, type Labels, type MoneyFormat } from '../core/labels.ts';
import { hasParams, readParams, writeParams, DEFAULT_PREFIX } from '../core/url.ts';
import type { BuildState, Group, Image, Model, Option } from '../core/types.ts';
import { truthy } from '../core/normalize.ts';
import { attr } from '../webflow/read-dom.ts';
import { findForm, WebflowForm } from '../webflow/forms.ts';
import { h, icon, loaded, reducedMotion } from './dom.ts';

export interface Settings {
  id: string;
  lang: string;
  money: MoneyFormat;
  showVat: boolean;
  showPrices: boolean;
  gate: 'off' | 'first-change';
  url: boolean;
  urlPrefix: string;
  startView: string | null;
  theme: 'light' | 'dark';
  thumbs: boolean;
  fullscreen: boolean;
  share: boolean;
  labels: Labels;
  /** Names of the hidden form fields. */
  fieldNames: { summary: string; config: string; price: string; shareUrl: string };
}

export type Options = Partial<Omit<Settings, 'labels' | 'money'>> & {
  labels?: Partial<Record<string, string>>;
  currency?: string;
  locale?: string;
};

/** Settings from the root's attributes, then the JS options on top. */
export function readSettings(root: Element, options: Options = {}): Settings {
  const a = (k: string) => attr(root, k);
  const flag = (k: string, def: boolean) => {
    const v = a(k);
    return v === null || v === '' ? def : truthy(v);
  };
  const lang = options.lang ?? a('lang') ?? (document.documentElement.lang || 'en');
  const nl = lang.toLowerCase().startsWith('nl');
  const labelOverrides: Record<string, string> = {};
  for (const at of root.getAttributeNames()) {
    const m = /^(?:data-)?tcfg-label-(.+)$/.exec(at);
    if (m) labelOverrides[m[1].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = root.getAttribute(at) ?? '';
  }
  const gateAttr = (options.gate ?? a('gate') ?? '').toLowerCase();
  const theme = (options.theme ?? a('theme') ?? 'light').toLowerCase() === 'dark' ? 'dark' : 'light';
  return {
    id: slugId(options.id ?? a('id') ?? autoId(root)),
    lang,
    money: { currency: options.currency ?? a('currency') ?? 'EUR', locale: options.locale ?? a('locale') ?? (nl ? 'nl-NL' : 'en-GB') },
    showVat: options.showVat ?? flag('vat', true),
    showPrices: options.showPrices ?? flag('prices', true),
    gate: gateAttr === 'off' || gateAttr === 'false' || gateAttr === 'none' ? 'off' : 'first-change',
    url: options.url ?? flag('url', true),
    // Several configurators on one page each get their own parameters.
    urlPrefix: options.urlPrefix ?? a('url-prefix') ?? (configuratorCount() > 1 ? `${DEFAULT_PREFIX}${slugId(options.id ?? a('id') ?? autoId(root))}-` : DEFAULT_PREFIX),
    startView: options.startView ?? a('start-view'),
    theme,
    thumbs: options.thumbs ?? flag('thumbs', true),
    fullscreen: options.fullscreen ?? flag('fullscreen', true),
    share: options.share ?? flag('share', true),
    labels: labelsFor(lang, { ...labelOverrides, ...(options.labels ?? {}) }),
    fieldNames: {
      summary: nl ? 'Configuratie' : 'Configuration',
      config: nl ? 'Configuratiecode' : 'Configuration code',
      price: nl ? 'Prijsindicatie' : 'Price indication',
      shareUrl: nl ? 'Link naar configuratie' : 'Share link',
      ...(options.fieldNames ?? {}),
    },
  };
}

function configuratorCount(): number {
  return document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]').length;
}

/** 'configurator', then 'configurator-2', … in page order. */
function autoId(root: Element): string {
  const all = [...document.querySelectorAll('[tcfg-element="configurator"],[data-tcfg-element="configurator"]')];
  const i = all.indexOf(root);
  return i > 0 ? `configurator-${i + 1}` : 'configurator';
}

function slugId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'configurator';
}

/** Rendered frames kept in the stage; older ones are dropped (memory on phones). */
const MAX_FRAMES = 24;

type EventName = 'ready' | 'change' | 'start' | 'view' | 'gate' | 'unlock' | 'enquiry' | 'submit' | 'share';

const UNLOCK_KEY = 'tcfg-unlocked:';

function storage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

export class Configurator {
  readonly root: HTMLElement;
  readonly model: Model;
  readonly settings: Settings;
  private state: BuildState;
  private L: Labels;

  // viewer
  private viewer!: HTMLElement;
  private stage!: HTMLElement;
  private frames!: HTMLElement;
  private hint!: HTMLElement;
  private position!: HTMLElement;
  private emptyNote!: HTMLElement;
  private note!: HTMLElement;
  private thumbs: HTMLElement | null = null;
  private fsButton: HTMLButtonElement | null = null;
  private frameBySrc = new Map<string, HTMLImageElement>();
  private active: HTMLImageElement | null = null;
  private stageSeq = 0;
  private thumbKey = '';
  private seenViews = new Set<string>();

  // options + summary
  private groupEls = new Map<string, HTMLElement>();
  private summaryText!: HTMLElement;
  private summaryPrice!: HTMLElement;
  private summaryPriceValue!: HTMLElement;
  private summaryEl!: HTMLElement;
  private cta: HTMLButtonElement | null = null;
  private shareButton: HTMLButtonElement | null = null;

  // gate + enquiry
  private dialog: HTMLDialogElement | null = null;
  private gateForm: WebflowForm | null = null;
  private enquiryForm: WebflowForm | null = null;
  private gatePane: HTMLElement | null = null;
  private enquiryPane: HTMLElement | null = null;
  private enquirySummary: HTMLElement | null = null;
  private pending: (() => void) | null = null;
  private returnFocus: HTMLElement | null = null;
  private unlocked: boolean;
  private started = false;
  private cleanup: (() => void)[] = [];

  constructor(root: HTMLElement, model: Model, settings: Settings) {
    this.root = root;
    this.model = model;
    this.settings = settings;
    this.L = settings.labels;
    let state = initialState(model, settings.startView);
    if (settings.url) {
      const params = new URLSearchParams(location.search);
      if (hasParams(model, params, settings.urlPrefix)) state = readParams(model, state, params, settings.urlPrefix);
    }
    this.state = state;
    const gateEl = findForm(root, 'gate-form');
    const enquiryEl = findForm(root, 'enquiry-form');
    this.gateForm = gateEl ? new WebflowForm(gateEl) : null;
    this.enquiryForm = enquiryEl ? new WebflowForm(enquiryEl) : null;
    this.unlocked = settings.gate === 'off' || !this.gateForm || storage()?.getItem(UNLOCK_KEY + settings.id) === '1';
    this.build();
    this.update(true);
    this.emit('ready', {});
  }

  // ------------------------------------------------------------ public API

  getState(): BuildState {
    return JSON.parse(JSON.stringify(this.state)) as BuildState;
  }

  /** Apply a (partial) build, as from code: { paint, choices, toggles, view }. */
  setState(next: Partial<BuildState>) {
    const merged: BuildState = {
      paint: next.paint ?? this.state.paint,
      view: next.view ?? this.state.view,
      choices: { ...this.state.choices, ...(next.choices ?? {}) },
      toggles: { ...this.state.toggles, ...(next.toggles ?? {}) },
    };
    const params = writeParams(this.model, merged, new URLSearchParams(), '');
    this.state = readParams(this.model, this.state, params, '');
    this.update();
  }

  get summary(): string {
    return summarize(this.model, this.state);
  }

  get price(): number | null {
    return priceIndication(this.model, this.state);
  }

  shareUrl(): string {
    const url = new URL(location.href);
    url.hash = '';
    writeParams(this.model, this.state, url.searchParams, this.settings.urlPrefix);
    return url.href;
  }

  /** Forget the e-mail gate in this browser (for testing). */
  lock() {
    storage()?.removeItem(UNLOCK_KEY + this.settings.id);
    this.unlocked = this.settings.gate === 'off' || !this.gateForm;
    this.updateCta();
  }

  destroy() {
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
    this.gateForm?.destroy();
    this.enquiryForm?.destroy();
    if (this.dialog?.open) this.dialog.close();
  }

  // ------------------------------------------------------------ events

  private emit(name: EventName, detail: Record<string, unknown>) {
    const full = { id: this.settings.id, ...detail };
    this.root.dispatchEvent(new CustomEvent(`tcfg:${name}`, { detail: full, bubbles: true }));
    const dl = (window as any).dataLayer;
    if (Array.isArray(dl) && name !== 'ready' && name !== 'change') dl.push({ event: `tcfg_${name}`, tcfg: full });
  }

  // ------------------------------------------------------------ building

  private build() {
    const s = this.settings;
    this.root.classList.add('tcfg');
    this.root.setAttribute('data-tcfg-theme', s.theme);
    this.root.removeAttribute('aria-busy');
    this.root.querySelector(':scope > .tcfg-loading')?.remove();

    const viewer = this.buildViewer();
    const options = this.buildOptions();
    const summary = this.buildSummary();
    const slot = (name: string) => this.root.querySelector<HTMLElement>(`[tcfg-slot="${name}"],[data-tcfg-slot="${name}"]`);
    const slots = { viewer: slot('viewer'), options: slot('options'), summary: slot('summary') };
    if (slots.viewer || slots.options || slots.summary) {
      // The designer laid out the parts in Webflow; a part without a slot goes after the last one.
      const fallback = slots.summary ?? slots.options ?? slots.viewer!;
      (slots.viewer ?? fallback).append(viewer);
      (slots.options ?? fallback).append(options);
      (slots.summary ?? fallback).append(summary);
    } else {
      const panel = h('div', { class: 'tcfg-panel' }, options, summary);
      this.root.append(h('div', { class: 'tcfg-layout' }, viewer, panel));
    }
    this.buildDialog();
    this.bindKeys();
  }

  private buildViewer(): HTMLElement {
    const L = this.L;
    this.frames = h('div', { class: 'tcfg-frames' });
    this.hint = h('p', { class: 'tcfg-hint', 'aria-live': 'polite' });
    this.position = h('p', { class: 'tcfg-position', 'aria-live': 'polite' });
    this.emptyNote = h('p', { class: 'tcfg-empty', text: L.empty, hidden: true });
    const prev = h('button', { type: 'button', class: 'tcfg-arrow tcfg-arrow-prev', 'aria-label': L.prev }, icon('prev'));
    const next = h('button', { type: 'button', class: 'tcfg-arrow tcfg-arrow-next', 'aria-label': L.next }, icon('next'));
    prev.addEventListener('click', () => this.step(-1));
    next.addEventListener('click', () => this.step(1));
    this.stage = h('div', { class: 'tcfg-stage' }, this.frames, this.hint, this.position, prev, next, this.emptyNote);
    if (this.settings.fullscreen && document.fullscreenEnabled) {
      this.fsButton = h('button', { type: 'button', class: 'tcfg-fs', 'aria-label': L.fullscreen }, icon('expand'));
      this.fsButton.addEventListener('click', () => this.toggleFullscreen());
      this.stage.append(this.fsButton);
      const onFs = () => {
        const on = document.fullscreenElement === this.viewer;
        this.viewer.classList.toggle('is-fullscreen', on);
        this.fsButton!.setAttribute('aria-label', on ? L.exitFullscreen : L.fullscreen);
        this.fsButton!.replaceChildren(icon(on ? 'shrink' : 'expand'));
        this.sizeFrames();
      };
      document.addEventListener('fullscreenchange', onFs);
      this.cleanup.push(() => document.removeEventListener('fullscreenchange', onFs));
    }
    this.bindSwipe();
    this.note = h('p', { class: 'tcfg-note', hidden: true });
    this.viewer = h('div', { class: 'tcfg-viewer' }, this.stage);
    if (this.settings.thumbs) {
      this.thumbs = h('div', { class: 'tcfg-thumbs', role: 'group', 'aria-label': L.views });
      this.viewer.append(this.thumbs);
    }
    this.viewer.append(this.note);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => this.sizeFrames());
      ro.observe(this.stage);
      this.cleanup.push(() => ro.disconnect());
    }
    return this.viewer;
  }

  private buildOptions(): HTMLElement {
    const wrap = h('div', { class: 'tcfg-groups' });
    this.model.groups.forEach((g, i) => {
      const titleId = `tcfg-${this.settings.id}-${g.code}-title`;
      const hintId = `tcfg-${this.settings.id}-${g.code}-hint`;
      const head = h('div', { class: 'tcfg-group-head' },
        h('h3', { class: 'tcfg-group-title', id: titleId, text: g.title }),
        h('span', { class: 'tcfg-group-index', 'aria-hidden': 'true', text: pad(i + 1) }),
        h('p', { class: 'tcfg-group-hint', id: hintId, text: groupHint(g, this.L) }),
      );
      const body = g.kind === 'paint' ? this.paintBody(g, titleId) : this.rowsBody(g, titleId);
      const section = h('section', { class: `tcfg-group tcfg-group-${g.kind}`, 'data-group': g.code, 'aria-labelledby': titleId, 'aria-describedby': hintId }, head, body);
      this.groupEls.set(g.code, section);
      wrap.append(section);
    });
    return wrap;
  }

  private priceTag(o: Option): HTMLElement | null {
    if (!this.settings.showPrices) return null;
    const label = optionPriceLabel(o, this.settings.money, this.L);
    if (!label) return null;
    const vat = this.settings.showVat && o.priceCents !== 0 ? h('span', { class: 'tcfg-vat', text: ` ${this.L.vat}` }) : null;
    return h('span', { class: 'tcfg-price' }, label, vat);
  }

  private paintBody(g: Group, titleId: string): HTMLElement {
    const chips = h('div', { class: 'tcfg-chips', role: 'radiogroup', 'aria-labelledby': titleId });
    for (const o of g.options) {
      const priceLabel = this.settings.showPrices ? optionPriceLabel(o, this.settings.money, this.L) : null;
      const chip = h('button', {
        type: 'button', class: 'tcfg-chip', role: 'radio', 'data-option': o.code,
        'aria-label': priceLabel ? `${o.name}, ${priceLabel}` : o.name, title: o.name,
      });
      if (o.image) chip.append(h('img', { src: o.image.src, alt: '', loading: 'lazy' }));
      else chip.style.setProperty('--tcfg-swatch', o.swatch || '#777');
      chip.addEventListener('click', () => {
        if (this.state.paint === o.code) return;
        this.choose(() => this.apply(withPaint(this.model, this.state, o.code)));
      });
      chips.append(chip);
    }
    this.bindRadioKeys(chips);
    const meta = h('div', { class: 'tcfg-paint-meta' },
      h('span', { class: 'tcfg-paint-name' }),
      h('span', { class: 'tcfg-paint-note' }),
      h('span', { class: 'tcfg-paint-price' }),
    );
    return h('div', { class: 'tcfg-group-body' }, chips, meta);
  }

  private rowsBody(g: Group, titleId: string): HTMLElement {
    const choice = g.kind === 'choice';
    const rows = h('div', { class: 'tcfg-rows', role: choice ? 'radiogroup' : 'group', 'aria-labelledby': titleId });
    for (const o of g.options) {
      const sub = optionSub(o, this.settings.money, this.L);
      const row = h('button', { type: 'button', class: 'tcfg-row', role: choice ? 'radio' : 'switch', 'data-option': o.code });
      if (choice && (o.image || g.options.some((x) => x.image))) {
        row.append(h('span', { class: 'tcfg-thumb', 'aria-hidden': 'true' }, o.image ? h('img', { src: o.image.src, alt: '', loading: 'lazy' }) : icon('wheel')));
      }
      row.append(
        h('span', { class: 'tcfg-row-text' }, h('span', { class: 'tcfg-row-name', text: o.name }), sub ? h('span', { class: 'tcfg-row-sub', text: sub }) : null),
        this.priceTag(o) ?? '',
        h('span', { class: choice ? 'tcfg-radio' : 'tcfg-switch', 'aria-hidden': 'true' }),
      );
      row.addEventListener('click', () => {
        if (choice) {
          if (this.state.choices[g.code] === o.code) return;
          this.choose(() => this.apply(withChoice(this.model, this.state, g.code, o.code)));
        } else {
          this.choose(() => this.apply(withToggle(this.model, this.state, g.code, o.code)));
        }
      });
      rows.append(row);
    }
    if (choice) this.bindRadioKeys(rows);
    return h('div', { class: 'tcfg-group-body' }, rows);
  }

  private buildSummary(): HTMLElement {
    const L = this.L;
    this.summaryText = h('p', { class: 'tcfg-summary-text' });
    this.summaryPriceValue = h('strong', { class: 'tcfg-summary-amount' });
    this.summaryPrice = h('p', { class: 'tcfg-summary-price', hidden: true },
      h('span', { text: L.indication }), ' ', this.summaryPriceValue,
      this.settings.showVat ? h('span', { class: 'tcfg-vat', text: ` ${L.vat}` }) : null);
    const toggle = h('button', { type: 'button', class: 'tcfg-summary-toggle', 'aria-expanded': 'false', 'aria-label': L.showMore }, icon('chevron'));
    toggle.addEventListener('click', () => {
      const open = this.summaryEl.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? L.showLess : L.showMore);
    });
    const actions = h('div', { class: 'tcfg-summary-actions' });
    if (this.settings.share) {
      this.shareButton = h('button', { type: 'button', class: 'tcfg-button tcfg-button-quiet tcfg-share' }, icon('share'), h('span', { text: L.share }));
      this.shareButton.addEventListener('click', () => this.share());
      actions.append(this.shareButton);
    }
    if (this.enquiryForm) {
      this.cta = h('button', { type: 'button', class: 'tcfg-button tcfg-cta' });
      this.cta.addEventListener('click', () => this.onCta());
      actions.append(this.cta);
    }
    this.summaryEl = h('div', { class: 'tcfg-summary' },
      h('div', { class: 'tcfg-summary-head' }, h('span', { class: 'tcfg-summary-label', text: L.yourBuild }), toggle),
      this.summaryText, this.summaryPrice, actions);
    this.updateCta();
    return this.summaryEl;
  }

  private buildDialog() {
    if (!this.gateForm && !this.enquiryForm) return;
    const L = this.L;
    const close = h('button', { type: 'button', class: 'tcfg-dialog-close', 'aria-label': L.close }, icon('close'));
    close.addEventListener('click', () => this.dialog?.close());
    const panel = h('div', { class: 'tcfg-dialog-panel' }, close);
    const pane = (kind: string, title: string, text: string, form: WebflowForm, extra?: HTMLElement) => {
      const id = `tcfg-${this.settings.id}-${kind}-title`;
      const el = h('div', { class: `tcfg-pane tcfg-pane-${kind}`, hidden: true, 'data-title': id },
        h('h2', { class: 'tcfg-dialog-title', id, text: title }),
        text ? h('p', { class: 'tcfg-dialog-text', text }) : null,
        extra ?? null);
      el.append(form.wrapper);
      form.wrapper.removeAttribute('hidden');
      form.wrapper.classList.add('tcfg-form');
      panel.append(el);
      return el;
    };
    if (this.gateForm) {
      this.gatePane = pane('gate', L.gateTitle, L.gateText, this.gateForm);
      this.gateForm.onSuccess(() => this.onUnlock());
    }
    if (this.enquiryForm) {
      this.enquirySummary = h('div', { class: 'tcfg-dialog-summary' });
      this.enquiryPane = pane('enquiry', L.enquiryTitle, L.enquiryText, this.enquiryForm, this.enquirySummary);
      this.enquiryForm.form?.addEventListener('submit', () => this.fillForms(), true);
      this.enquiryForm.onSuccess(() => this.emit('submit', this.payload()));
    }
    this.dialog = h('dialog', { class: 'tcfg-dialog' }, panel);
    // Close on a click on the backdrop — only when the press started there too
    // (not when a text selection in a field ends outside the panel).
    let downOnBackdrop = false;
    this.dialog.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === this.dialog; });
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog && downOnBackdrop) this.dialog!.close();
      downOnBackdrop = false;
    });
    this.dialog.addEventListener('close', () => {
      this.pending = null;
      this.returnFocus?.focus();
      this.returnFocus = null;
    });
    this.root.append(this.dialog);
  }

  private openPane(which: 'gate' | 'enquiry') {
    if (!this.dialog) return;
    const target = which === 'gate' ? this.gatePane : this.enquiryPane;
    if (!target) return;
    for (const p of [this.gatePane, this.enquiryPane]) if (p) p.hidden = p !== target;
    this.dialog.setAttribute('aria-labelledby', target.getAttribute('data-title')!);
    this.fillForms();
    if (which === 'enquiry' && this.gateForm && this.enquiryForm) this.enquiryForm.email = this.gateForm.email;
    if (!this.dialog.open) {
      this.returnFocus = document.activeElement as HTMLElement | null;
      this.dialog.showModal();
    }
    (which === 'gate' ? this.gateForm : this.enquiryForm)?.focusFirst();
  }

  // ------------------------------------------------------------ the gate

  /** Run an option change, through the e-mail gate when it is locked. */
  private choose(run: () => void) {
    if (!this.started) {
      this.started = true;
      this.emit('start', {});
    }
    if (this.unlocked) return run();
    this.pending = run;
    this.emit('gate', {});
    this.openPane('gate');
  }

  private onUnlock() {
    this.unlocked = true;
    storage()?.setItem(UNLOCK_KEY + this.settings.id, '1');
    this.emit('unlock', { email: this.gateForm?.email ?? '' });
    this.updateCta();
    const run = this.pending;
    this.pending = null;
    // Let the visitor read Webflow's success message for a moment.
    setTimeout(() => {
      if (run) run();
      // run() may have switched the dialog to the enquiry pane; otherwise close it.
      if (this.dialog?.open && !this.gatePane?.hidden) this.dialog.close();
    }, 900);
  }

  private onCta() {
    this.emit('enquiry', this.payload());
    if (this.unlocked) this.openPane('enquiry');
    else {
      this.pending = () => this.openPane('enquiry');
      this.openPane('gate');
    }
  }

  private updateCta() {
    if (!this.cta) return;
    this.cta.textContent = this.unlocked && this.gateForm ? this.L.ctaUnlocked : this.L.cta;
  }

  // ------------------------------------------------------------ forms

  private payload() {
    const price = priceIndication(this.model, this.state);
    return {
      state: this.getState(),
      config: buildConfig(this.state),
      summary: summarize(this.model, this.state),
      price,
      priceLabel: price === null ? '' : formatMoney(price, this.settings.money),
      shareUrl: this.shareUrl(),
    };
  }

  private fillForms() {
    const p = this.payload();
    const values = {
      summary: p.summary,
      config: JSON.stringify(p.config),
      price: p.price ? `${p.priceLabel}${this.settings.showVat ? ` ${this.L.vat}` : ''}` : '',
      shareUrl: p.shareUrl,
      groups: summaryByGroup(this.model, this.state).map(({ group, value }) => ({ code: group.code, title: group.title, value })),
    };
    for (const f of [this.gateForm, this.enquiryForm]) f?.fill(values, this.settings.fieldNames);
    if (this.enquirySummary) {
      this.enquirySummary.replaceChildren(
        h('p', { class: 'tcfg-dialog-build', text: p.summary }),
        p.priceLabel && this.settings.showPrices && p.price ? h('p', { class: 'tcfg-dialog-price', text: `${this.L.indication} ${values.price}` }) : '',
      );
    }
  }

  // ------------------------------------------------------------ state → DOM

  private apply(next: BuildState) {
    if (next === this.state) return;
    this.state = next;
    this.update();
  }

  private update(first = false) {
    const { model, state } = this;
    // Options
    for (const g of model.groups) {
      const section = this.groupEls.get(g.code);
      if (!section) continue;
      for (const el of section.querySelectorAll<HTMLElement>('[data-option]')) {
        const code = el.getAttribute('data-option')!;
        const on = g.kind === 'paint' ? state.paint === code
          : g.kind === 'choice' ? state.choices[g.code] === code
          : (state.toggles[g.code] ?? []).includes(code);
        el.setAttribute('aria-checked', String(on));
        el.classList.toggle('is-active', on);
        if (g.kind !== 'toggle') el.tabIndex = on ? 0 : -1;
      }
      if (g.kind === 'paint') {
        const o = g.options.find((x) => x.code === state.paint);
        section.querySelector('.tcfg-paint-name')!.textContent = o?.name ?? '';
        const noteEl = section.querySelector<HTMLElement>('.tcfg-paint-note')!;
        noteEl.textContent = o?.note ?? '';
        noteEl.hidden = !o?.note;
        const priceEl = section.querySelector<HTMLElement>('.tcfg-paint-price')!;
        const tag = o && g.options.some((x) => x.priceCents !== null) ? this.priceTag(o) : null;
        priceEl.replaceChildren(tag ?? '');
        priceEl.hidden = !tag;
      }
    }
    // Summary
    this.summaryText.textContent = summarize(model, state);
    // A total of 0 (only "Included" options) says nothing: no line then.
    const price = this.settings.showPrices ? priceIndication(model, state) : null;
    this.summaryPrice.hidden = !price;
    if (price) this.summaryPriceValue.textContent = formatMoney(price, this.settings.money);
    // Viewer
    this.renderStage();
    this.renderThumbs();
    const partial = partialNote(model, state, this.L);
    this.note.textContent = partial ?? '';
    this.note.hidden = !partial;
    // Address bar
    if (this.settings.url && !first) {
      const url = new URL(location.href);
      writeParams(model, state, url.searchParams, this.settings.urlPrefix);
      history.replaceState(history.state, '', url.href);
    }
    if (this.dialog?.open) this.fillForms();
    if (!first) this.emit('change', this.payload());
  }

  // ------------------------------------------------------------ stage

  private sizes(): string {
    const w = Math.round(this.stage?.clientWidth || this.root.clientWidth || 1200);
    return `${Math.max(w, 320)}px`;
  }

  private sizeFrames() {
    const sizes = this.sizes();
    for (const img of this.frameBySrc.values()) if (img.srcset) img.sizes = sizes;
  }

  private frame(image: Image, alt: string): HTMLImageElement {
    let img = this.frameBySrc.get(image.src);
    if (!img) {
      img = h('img', { class: 'tcfg-frame', alt: '', decoding: 'async', draggable: 'false' });
      if (image.srcset) {
        img.srcset = image.srcset;
        img.sizes = this.sizes();
      }
      img.src = image.src;
      img.setAttribute('aria-hidden', 'true');
      this.frames.append(img);
    } else {
      this.frameBySrc.delete(image.src); // re-inserted below: most recently used last
    }
    this.frameBySrc.set(image.src, img);
    if (alt) img.alt = alt;
    this.trimFrames();
    return img;
  }

  /** Drop the least recently used frames beyond MAX_FRAMES (never the one shown or fading out). */
  private trimFrames() {
    for (const [src, img] of this.frameBySrc) {
      if (this.frameBySrc.size <= MAX_FRAMES) break;
      if (img === this.active || img.classList.contains('is-leaving')) continue;
      img.remove();
      this.frameBySrc.delete(src);
    }
  }

  private altFor(view: string | null): string {
    const paint = paintGroup(this.model)?.options.find((o) => o.code === this.state.paint)?.name;
    const v = this.model.views.find((x) => x.code === view);
    const viewName = v && v.name !== v.code ? v.name : view ? `${this.L.views} ${view}` : '';
    return [paint, viewName].filter(Boolean).join(' — ');
  }

  private async renderStage() {
    const seq = ++this.stageSeq;
    const { model, state } = this;
    const render = stageRender(model, state, state.view);
    this.emptyNote.hidden = !!render;
    this.stage.classList.toggle('is-empty', !render);
    const count = availableViews(model, state).length;
    this.stage.classList.toggle('has-one-view', count < 2);
    this.position.textContent = render ? this.positionLabel() : '';
    this.setHint(renderHint(model, render, this.L));
    if (!render) {
      this.active?.classList.remove('is-active');
      this.active?.setAttribute('aria-hidden', 'true');
      this.active = null;
      return;
    }
    const img = this.frame(render.image, this.altFor(state.view));
    if (img !== this.active) {
      await loaded(img);
      if (seq !== this.stageSeq) return;
      const old = this.active;
      if (!old) {
        // The first render appears at once; only changes fade.
        img.style.transition = 'none';
        requestAnimationFrame(() => requestAnimationFrame(() => { img.style.transition = ''; }));
      }
      img.removeAttribute('aria-hidden');
      img.classList.add('is-active');
      img.classList.remove('is-leaving');
      if (old) {
        old.classList.remove('is-active');
        old.classList.add('is-leaving');
        old.setAttribute('aria-hidden', 'true');
        setTimeout(() => old.classList.remove('is-leaving'), reducedMotion() ? 0 : 650);
      }
      this.active = img;
    }
    if (state.view && !this.seenViews.has(state.view)) {
      this.seenViews.add(state.view);
      this.emit('view', { view: state.view });
    }
    this.preload(render);
  }

  private positionLabel(): string {
    const { model, state } = this;
    const views = availableViews(model, state);
    const i = views.findIndex((v) => v.code === state.view);
    const v = views[i];
    const name = v && v.name !== v.code ? `  ${v.name}` : '';
    return `${pad(i + 1)} / ${pad(views.length)}${name}`;
  }

  private setHint(text: string | null) {
    const value = text ?? '';
    if (this.hint.textContent !== value) this.hint.textContent = value;
    this.hint.hidden = !value;
  }

  /** The neighbouring views and the renders one option click away. */
  private preload(now: StageRender) {
    const { model, state } = this;
    const around = [stepView(model, state, state.view, -1), stepView(model, state, state.view, 1)];
    for (const view of around) {
      const r = view ? stageRender(model, state, view) : null;
      if (r && r.image.src !== now.image.src) this.frame(r.image, '');
    }
    for (const r of nearbyRenders(model, state)) this.frame(r.image, '');
  }

  private step(delta: number) {
    const view = stepView(this.model, this.state, this.state.view, delta);
    if (view && view !== this.state.view) this.apply({ ...this.state, view });
  }

  private showView(view: string) {
    if (view !== this.state.view) this.apply({ ...this.state, view });
  }

  private renderThumbs() {
    if (!this.thumbs) return;
    const { model, state } = this;
    const views = availableViews(model, state);
    const key = views.map((v) => v.code).join(',');
    this.thumbs.hidden = views.length < 2;
    if (key !== this.thumbKey) {
      this.thumbKey = key;
      this.thumbs.replaceChildren(...views.map((v) => {
        const b = h('button', { type: 'button', class: 'tcfg-thumb-button', 'data-view': v.code, 'aria-label': v.name !== v.code ? v.name : `${this.L.views} ${v.code}` },
          h('img', { alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }));
        b.addEventListener('click', () => this.showView(v.code));
        b.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          e.stopPropagation();
          this.step(e.key === 'ArrowRight' ? 1 : -1);
          this.thumbs!.querySelector<HTMLElement>(`[data-view="${this.state.view}"]`)?.focus();
        });
        return b;
      }));
    }
    for (const b of this.thumbs.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      const view = b.getAttribute('data-view')!;
      const r = stageRender(model, state, view);
      const img = b.querySelector('img')!;
      if (r && img.getAttribute('src') !== r.image.src) {
        if (r.image.srcset) {
          img.srcset = r.image.srcset;
          img.sizes = '160px';
        } else img.removeAttribute('srcset');
        img.src = r.image.src;
      }
      const on = view === state.view;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-active', on);
      b.tabIndex = on ? 0 : -1;
      if (on && this.thumbs.scrollWidth > this.thumbs.clientWidth) {
        const left = b.offsetLeft - (this.thumbs.clientWidth - b.offsetWidth) / 2;
        this.thumbs.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
  }

  // ------------------------------------------------------------ input

  private bindKeys() {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || this.dialog?.open) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable], [role="radiogroup"]')) return;
      e.preventDefault();
      this.step(e.key === 'ArrowRight' ? 1 : -1);
    };
    this.root.addEventListener('keydown', onKey);
    this.cleanup.push(() => this.root.removeEventListener('keydown', onKey));
    this.stage.tabIndex = 0;
    this.stage.setAttribute('role', 'region');
    this.stage.setAttribute('aria-label', this.L.views);
  }

  /** Arrows/Home/End move the choice within a radio group (and select it). */
  private bindRadioKeys(group: HTMLElement) {
    group.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      const items = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      e.preventDefault();
      e.stopPropagation();
      const n = items.length;
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : (i + 1) % n;
      items[j].focus();
      items[j].click();
    });
  }

  private bindSwipe() {
    let x0 = 0;
    let y0 = 0;
    let id: number | null = null;
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      id = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    this.stage.addEventListener('pointerup', (e) => {
      if (e.pointerId !== id) return;
      id = null;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) this.step(dx < 0 ? 1 : -1);
    });
    this.stage.addEventListener('pointercancel', () => { id = null; });
  }

  private toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else this.viewer.requestFullscreen?.().catch(() => undefined);
  }

  private async share() {
    const url = this.shareUrl();
    this.emit('share', { shareUrl: url });
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ url, title: document.title, text: summarize(this.model, this.state) });
        return;
      } catch { /* cancelled: fall back to copying */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      const label = this.shareButton!.querySelector('span')!;
      label.textContent = this.L.copied;
      setTimeout(() => { label.textContent = this.L.share; }, 2000);
    } catch {
      window.prompt(this.L.share, url);
    }
  }
}

