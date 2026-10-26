# Tornante Configurator for Webflow

A product configurator for any Webflow site: visitors pick a paint, choices
(wheels) and on/off extras (roll cage, helmet shell); the image swaps to the
render of **that exact build**, prices add up, and the build can be shared
or sent through a native Webflow form.

It is the configurator of [venduetto.com](https://venduetto.com), taken out
of its Astro/Postgres stack: same render-matching rules, same behaviour, no
server. Everything is set up in the Webflow Designer and CMS.

- **One script tag**, CSS included (≈ 64 KB minified, ≈ 20 KB gzipped). No dependencies.
- **Data from the Webflow CMS** (or hand-built elements, or JSON), via `tcfg-*` attributes.
- **Renders per paint × option combination × view**, with the Venduetto fallback rules:
  never a render with an option the visitor did *not* choose; when a combination is not
  rendered yet, the closest render plus a quiet line (“Shown without roll cage — not rendered yet”).
- **Render file names do the bookkeeping**: `rosso_05_roll-cage.jpg` is paint *Rosso*, view 05, roll cage on.
- **Leads via Webflow forms**: optional e-mail gate before configuring, and an enquiry form that receives the build as hidden fields.
- Share link (the build in the URL), price indication, thumbnails, keyboard, swipe, full screen, English/Dutch, light/dark, container-responsive.

> Not included (Venduetto-specific): recolouring the rest of the website to the configured paint.

---

## Quick start

1. **Add the script** — Site settings → Custom code → *Footer code* (or the page's *Before `</body>`*):

   ```html
   <script defer src="https://cdn.jsdelivr.net/gh/henkdevries1/webflow-configurator@v0.1.0/dist/configurator.js"></script>
   ```

2. **Add a Div Block** where the configurator should appear, with the custom attribute
   `tcfg-element` = `configurator`.

3. **Inside it, add a Div Block** with `tcfg-element` = `data` (hidden automatically). Put the data in it:
   option groups, options and renders — static elements or Collection Lists (see [Setting up the CMS](#setting-up-the-cms)).

4. Publish. The configurator builds itself inside the Div Block.

Try it locally first: `npm install && npm run demo` → <http://localhost:4321> (`?lang=nl`, `?theme=dark`, `?gate=on`).
The demo page uses the exact markup Webflow publishes (paginated Collection Lists, form blocks).

---

## How the renders work

A paint has a **base set**: the renders of the *default build* — every choice group on its
default option, every toggle in its default state. If the helmet shell is *on* by default,
the base renders show it.

Every other render belongs to a **combination**: the ways it *deviates* from the default build.

| Combination | Means |
|---|---|
| *(none)* / `basis` / `base` | the base set |
| `roll-cage` | roll cage **on** |
| `zonder-helmet-shell` / `without-helmet-shell` / `no-helmet-shell` / `geen-…` | helmet shell **off** |
| `billet` | the *Billet* option of a choice group (wheels) |
| `roll-cage+zonder-helmet-shell` | both (join with `+`) |

What a combination does not name is as in the default build. Options are referred to by their
code or their name — case, accents and separators don’t matter (`Roll cage` = `roll-cage` = `ROLL_CAGE`).

For each view, the configurator shows the render that depicts most of the visitor’s build,
**never one that shows an option they did not choose**. Ties go to the render with fewer
deviations. If the best render is not exact, a hint says what differs. A view without any
render for that paint is left out of the thumbnails (“Oro Chiaro: 4 of 6 views rendered so far.”).

Option groups with **Visible on renders = false** (`tcfg-renders="false"`, e.g. interior trim
on exterior renders) are ignored for matching.

### Naming render files

Webflow keeps the original file name in its asset URLs, so a render can carry all its
information in its name. Upload with names like:

```
rosso_01.jpg                              Rosso, view 01, base set
rosso_05_roll-cage.jpg                    view 05, roll cage on
rosso_05_zonder-helmet-shell.jpg          view 05, helmet shell off
rosso_05_roll-cage+zonder-helmet-shell.jpg  both
rosso-cordoba_03_billet.jpg               the paint’s code or full name works too
```

- **Paint**: the paint’s code, its full name, or the first word of its name when that is unique.
- **View**: the last number in the name (`1` = `01`). Without declared views, the numbers found become the views.
- **Combination**: after the last `_` that follows the view number.

A name that does not follow these rules (e.g. `KeyShot-export.0412.jpg`)? Fill in the item’s
**Paint**, **View** and **Combination** fields instead — explicit fields always win over the file name.
Problems (unknown option, missing view, duplicates) are logged in the browser console as `[tcfg] …`
and the render is skipped, so a typo never puts a roll-cage render on the base set.

---

## Setting up the CMS

Suggested collections (field names are free; only the attributes matter):

**Paints** (or one *Options* collection for everything)

| Field | Type | Bound to |
|---|---|---|
| Name | Plain text | Text Block with `tcfg-field=name` |
| Slug | (built-in) | — |
| Code | Plain text, optional | Text Block `tcfg-field=code` (else the code is made from the name) |
| Price | Number / Plain text, optional | Text Block `tcfg-field=price` |
| Note | Plain text, optional | Text Block `tcfg-field=note` |
| Default | Switch | a Text Block `tcfg-field=default` with the text `yes`, shown only when the switch is on (conditional visibility) — or a Plain text/Option field bound to it |
| Colour | Color | a Div Block `tcfg-field=swatch` with its background bound to the field |
| Image | Image, optional | an Image (chip image instead of a colour) |

**Options** — the same fields plus **Group** (Option field or Plain text: the group’s code *or* title),
bound as `tcfg-group` (attribute) or `tcfg-field=group` (text). The Image becomes the round thumbnail of a choice.

**Renders**

| Field | Type | Bound to |
|---|---|---|
| Image | Image | an Image inside the item |
| Paint | Plain text / Reference name, optional | Text Block `tcfg-field=paint` |
| View | Plain text, optional | Text Block `tcfg-field=view` |
| Combination | Plain text, optional | Text Block `tcfg-field=set` |

Then, inside the `tcfg-element=data` Div Block:

```
Div  tcfg-element=group  tcfg-code=paint    tcfg-kind=paint   tcfg-title=Paint
Div  tcfg-element=group  tcfg-code=wheels   tcfg-kind=choice  tcfg-title=Wheels
Div  tcfg-element=group  tcfg-code=cockpit  tcfg-kind=toggle  tcfg-title=Cockpit
Div  tcfg-element=group  tcfg-code=interior tcfg-kind=choice  tcfg-title="Interior trim"  tcfg-renders=false

Collection List (Paints)   → Collection Item → Div  tcfg-element=option  tcfg-group=paint  (+ field elements)
Collection List (Options)  → Collection Item → Div  tcfg-element=option                    (+ field elements, incl. group)
Collection List (Renders)  → Collection Item → Div  tcfg-element=render                    (+ Image, optional fields)
```

- **More than 100 renders?** Turn on *Paginate items* on the Renders list. The script loads every
  following page before it starts (no nested lists needed, so no 10-item nesting limit).
- **Views with names** (optional): `Div tcfg-element=view tcfg-code=01 tcfg-name="Front three-quarter"`.
  Without them, views are the numbers in the render names, in numeric order.
- Groups can live in the CMS too (an *Option groups* collection with `tcfg-element=group` items).
- Group order = the order of the group elements (or `tcfg-sort`); option order = list order (or `tcfg-sort`).
- Kinds: `paint` (one per configurator, colour chips), `choice` (pick one), `toggle` (on/off, any number).
  Without a paint group, all renders belong to one implicit paint.

Every value can be given as an **attribute** on the element (`tcfg-name="Billet"`, also `data-tcfg-name`)
or as a **child element** `tcfg-field="name"` holding the text — whichever binds easier in Webflow.
Empty CMS bindings and elements hidden by conditional visibility count as empty.

---

## Leads: Webflow forms

Place a regular Webflow **Form Block** inside the `data` Div Block (so it is hidden until needed),
and give the Form Block wrapper one of these attributes:

- `tcfg-element=gate-form` — **e-mail gate**. The first option click opens it in a dialog; after a
  successful submission the click is applied and the configurator stays unlocked in this browser.
  Turn it off with `tcfg-gate="off"` on the configurator.
- `tcfg-element=enquiry-form` — **send my build**. Adds the *Enquire* button to the summary and opens
  the form in a dialog, with the build summarised above it.

### Prices behind the gate ("Click for the price")

With `tcfg-price-gate="on"` on the configurator (and a gate form), no price is shown until the visitor
has left their e-mail: "Your build" shows a **Click for the price** button that opens the same gate form
with price copy ("Enter your email to see the price."). Passing the gate either way — the first option
click or the price button — unlocks both the options and the prices, which then fade in. To gate only
the prices, add `tcfg-gate="off"`.

Once shown, following the Venduetto rules:

- options: “+ €4,850 excl. VAT”, “Included” (0), and — only in a group where some option has a
  price — “Standard” for the unpriced default and “On request” for any other unpriced option;
- “Your build”: “The car — From €185,000” (`tcfg-base-price`, bind it to a CMS field) and
  “Total — €189,850 excl. VAT — indication” (car + priced options; “Options” without a car price),
  plus “1 option on request not included.” when it applies.

> **Not secret.** Webflow publishes CMS content in the page’s HTML, so a determined visitor can
> still find the prices in the page source; the module only removes them from the page’s data
> elements once read. For truly withheld prices, serve them from your own endpoint after the gate
> (as venduetto.com does) — the `tcfg:unlock` event is the hook for that.

The script adds (and keeps current) hidden fields in both forms, so every submission carries the build:

| Field | Example |
|---|---|
| Configuration | Verde Pino · Stradale wheels · Roll cage · Leather interior trim |
| Price indication | €8,750 excl. VAT |
| *one per group* (Paint, Wheels, Cockpit, …) | Verde Pino / Stradale / Roll cage |
| Share link | https://site.com/configurator?cfg-paint=verde&cfg-cockpit=roll-cage… |
| Configuration code | `{"paint":"verde","choices":{"wheels":"stradale"},"toggles":{"cockpit":["roll-cage"]}}` |

Want them visible, renamed or in a specific place? Add your own input with `tcfg-field=summary`,
`price`, `share-url`, `config` or a group code; the script fills that one instead.
Submissions arrive like any Webflow form: Forms tab, notification e-mails, Zapier/Make, webhooks.
Webflow’s own success message is shown in the dialog.

---

## Configurator attributes

On the `tcfg-element=configurator` element:

| Attribute | Default | |
|---|---|---|
| `tcfg-id` | `configurator` | Name; needed with several configurators per site (gate memory, events) |
| `tcfg-lang` | page `lang` | `en` or `nl` (all copy) |
| `tcfg-currency` / `tcfg-locale` | `EUR` / `en-GB`, `nl-NL` | Price format |
| `tcfg-vat` | `true` | Show “excl. VAT” after prices |
| `tcfg-prices` | `true` | `false` hides every price |
| `tcfg-gate` | on when a gate form exists | `off`: no e-mail gate before the first option click |
| `tcfg-price-gate` | `off` | `on`: prices only after the e-mail gate (“Click for the price”) |
| `tcfg-base-price` | | The car’s own price, e.g. `185.000` (“The car — From €185,000”) |
| `tcfg-start-view` | first view | View the page opens on, e.g. `02` |
| `tcfg-url` | `true` | Keep the build in the address bar (`?cfg-paint=…`) |
| `tcfg-url-prefix` | `cfg-` | Prefix of those parameters |
| `tcfg-theme` | `light` | `dark` |
| `tcfg-thumbs` / `tcfg-fullscreen` / `tcfg-share` | `true` | Switch parts off |
| `tcfg-sticky` | `true` | On narrow screens the image stays at the top while options scroll |
| `tcfg-label-<key>` | | Override any text, e.g. `tcfg-label-cta="Request a quote"` (keys: see `src/core/labels.ts`) |

### Your own layout

By default the viewer sits next to the options (stacked below 900 px of *configurator* width).
To place the parts yourself, add empty Div Blocks inside the configurator with
`tcfg-slot=viewer`, `tcfg-slot=options` and `tcfg-slot=summary` and lay them out in Webflow.

### Styling

All colours, radii and the image ratio are CSS custom properties on `.tcfg` — set them in Webflow
(Style panel → custom properties on the configurator element) or in custom code:

```css
.tcfg {
  --tcfg-accent: #8c1c13;      /* selected rows, switches, button */
  --tcfg-on-accent: #fff;
  --tcfg-bg: transparent;
  --tcfg-surface: #fff;
  --tcfg-radius-lg: 4px;
  --tcfg-ratio: 16 / 10;       /* the renders’ aspect ratio */
  --tcfg-sticky-top: 72px;     /* height of a fixed navbar */
}
```

Every part has a `tcfg-*` class (`.tcfg-stage`, `.tcfg-row`, `.tcfg-chip`, `.tcfg-summary`, …);
the built-in CSS uses one class per rule, so a Webflow class or custom CSS overrides it.
Load the script with `tcfg-css="false"` to skip the built-in CSS entirely.

---

## Events and JavaScript API

Events bubble from the configurator element (`detail.id` = `tcfg-id`):

| Event | When | `detail` |
|---|---|---|
| `tcfg:ready` | built | |
| `tcfg:start` | first option click | |
| `tcfg:change` | any change | `state`, `config`, `summary`, `price` (cents), `priceLabel`, `shareUrl` |
| `tcfg:view` | a view seen for the first time | `view` |
| `tcfg:gate` / `tcfg:unlock` | gate opened (`reason`: option, price, enquiry) / passed | `email` on unlock |
| `tcfg:price` | prices revealed | `via` (option, price, enquiry) |
| `tcfg:enquiry` / `tcfg:submit` | enquiry opened / sent | as `change` |
| `tcfg:share` | share clicked | `shareUrl` |

With Google Tag Manager on the page, the same events are pushed to `dataLayer` as `tcfg_start`, `tcfg_view`, …

```js
document.addEventListener('tcfg:change', (e) => console.log(e.detail.summary));

const c = TornanteConfigurator.instances[0];
c.getState();            // { paint, view, choices, toggles }
c.setState({ paint: 'verde', toggles: { cockpit: ['roll-cage'] } });
c.shareUrl();
c.lock();                // forget the e-mail gate in this browser (testing)

// Without Webflow data: start one by hand with JSON (tcfg-auto="false" on the element)
TornanteConfigurator.init(element, { data: { groups: [...], options: [...], renders: ['https://…/rosso_01.jpg'] } });
```

A `<script type="application/json" tcfg-element="json">{ … }</script>` inside the configurator works too.

---

## Development

```bash
npm install
npm test           # node --test: resolver, file names, prices, model, URL (Node 22.6+)
npm run typecheck
npm run build      # dist/configurator.js
npm run demo       # build + http://localhost:4321
```

```
src/core/       pure logic, no DOM — resolve.ts (render matching), render-names.ts (file names),
                normalize.ts (raw data → model), model.ts (build state), url.ts, labels.ts
src/webflow/    reading the page: attributes, Collection List pagination, Webflow forms
src/ui/         the configurator UI and its CSS
demo/, scripts/ demo page and server (Webflow-like markup, generated SVG renders)
```

`src/core/resolve.ts` and `src/core/render-names.ts` are ported from the Venduetto repository
(`src/lib/configurator/render-match.ts`, `src/lib/media/render-names.ts`) with their tests;
fix matching bugs in both places.

### Publishing

The script is served by jsDelivr straight from this GitHub repository, so `dist/` is committed.
A release = bump `version` in `package.json`, `npm run build`, commit, tag `vX.Y.Z`, push the tag:

```
https://cdn.jsdelivr.net/gh/henkdevries1/webflow-configurator@v0.1.0/dist/configurator.js
```

Sites pin a tag, so a new release never changes a live site until its script tag is updated.
