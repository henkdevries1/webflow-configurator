/* The configurator talks to native Webflow forms, so leads land where every
   Webflow site already collects them: Form submissions, the site's e-mail
   notifications, Zapier/Make and the form_submission webhook.

   - gate form (tcfg-element="gate-form"): the e-mail gate. Its successful
     submission unlocks the configurator in this browser.
   - enquiry form (tcfg-element="enquiry-form"): sends the build. The module
     adds hidden fields to it (or fills the ones you placed yourself with
     tcfg-field="summary" | "config" | "price" | "share-url" | "<group code>")
     and keeps them up to date: "Configuration", "Configuration code",
     "Price indication", "Share link" and one field per option group.

   Webflow reads every input of a form at the moment it is submitted
   (data-name, else name), so fields added by script are sent along. */

import { attr, ELEMENT } from './read-dom.ts';

export interface FormValues {
  summary: string;
  config: string;
  price: string;
  shareUrl: string;
  groups: { code: string; title: string; value: string }[];
}

export class WebflowForm {
  readonly wrapper: HTMLElement;
  readonly form: HTMLFormElement | null;
  private done: HTMLElement | null;
  private succeeded = false;
  private submitted = false;
  private listeners: (() => void)[] = [];
  private observer: MutationObserver | null = null;

  constructor(marked: HTMLElement) {
    this.form = marked instanceof HTMLFormElement ? marked : marked.querySelector('form');
    // The attribute may sit on the Form element itself: always move the whole
    // Form Block, which webflow.js needs (.w-form form) and which holds the
    // success and error messages.
    const block = this.form?.closest<HTMLElement>('.w-form') ?? null;
    if (this.form && !block) console.warn('[tcfg] This form is not inside a Webflow Form Block (.w-form); Webflow will not handle it.', marked);
    this.wrapper = block && block.contains(marked) ? block : marked;
    this.done = (block ?? this.wrapper).querySelector<HTMLElement>('.w-form-done');
    if (this.done) {
      this.observer = new MutationObserver(() => this.check());
      this.observer.observe(this.wrapper, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    }
    // Outside Webflow (or without a success block) a submit counts as success.
    this.form?.addEventListener('submit', () => {
      this.submitted = true;
      if (!this.done || !(window as any).Webflow) setTimeout(() => this.success(), 0);
    });
  }

  /** Success = Webflow showed the success block AFTER a submit (a success
   *  block styled visible by mistake never unlocks anything). */
  private check() {
    if (this.submitted && this.done && getComputedStyle(this.done).display !== 'none') this.success();
  }

  private success() {
    if (this.succeeded) return;
    this.succeeded = true;
    for (const fn of this.listeners) fn();
  }

  onSuccess(fn: () => void) {
    this.listeners.push(fn);
  }

  get email(): string {
    return this.form?.querySelector<HTMLInputElement>('input[type="email"]')?.value.trim() ?? '';
  }

  set email(value: string) {
    const input = this.form?.querySelector<HTMLInputElement>('input[type="email"]');
    if (input && !input.value) input.value = value;
  }

  focusFirst() {
    const first = this.form?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="submit"]), textarea, select');
    first?.focus();
  }

  /** The hidden field for `key`: one placed with tcfg-field, else created. */
  private input(key: string, name: string): HTMLInputElement | null {
    if (!this.form) return null;
    const placed = this.form.querySelector<HTMLInputElement>(`[tcfg-field="${key}"],[data-tcfg-field="${key}"]`);
    if (placed) return placed;
    let made = this.form.querySelector<HTMLInputElement>(`input[data-tcfg-auto="${key}"]`);
    if (!made) {
      made = document.createElement('input');
      made.type = 'hidden';
      made.name = name;
      made.setAttribute('data-name', name);
      made.setAttribute('data-tcfg-auto', key);
      // In order, at the top of the form: that is the order Webflow lists them.
      const autos = this.form.querySelectorAll('input[data-tcfg-auto]');
      if (autos.length) autos[autos.length - 1].after(made);
      else this.form.prepend(made);
    }
    return made;
  }

  fill(values: FormValues, names: { summary: string; config: string; price: string; shareUrl: string }) {
    const set = (key: string, name: string, value: string) => {
      const input = this.input(key, name);
      if (input) input.value = value;
    };
    set('summary', names.summary, values.summary);
    set('price', names.price, values.price);
    for (const g of values.groups) set(g.code, g.title, g.value);
    set('share-url', names.shareUrl, values.shareUrl);
    set('config', names.config, values.config);
  }

  destroy() {
    this.observer?.disconnect();
    this.listeners = [];
  }
}

export function findForm(root: Element, kind: 'gate-form' | 'enquiry-form'): HTMLElement | null {
  const sel = `[${ELEMENT}="${kind}"],[data-${ELEMENT}="${kind}"]`;
  const inside = root.querySelector<HTMLElement>(sel);
  if (inside) return inside;
  const id = attr(root, 'id');
  // Outside the configurator: only when it names this configurator (or there is one).
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    const forId = attr(el, 'for');
    if (forId ? forId === id : document.querySelectorAll(`[${ELEMENT}="configurator"],[data-${ELEMENT}="configurator"]`).length === 1) return el;
  }
  return null;
}
