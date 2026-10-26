# Configurator in Webflow zetten — stap voor stap

Voor de Webflow-designer. De volledige referentie (alle attributen, events, styling) staat in de
[README](../README.md). Reken op 1–2 uur voor de eerste opzet; daarna beheert de klant alles in het CMS.

## 1. Script toevoegen

Site settings → Custom code → **Footer code**:

```html
<script defer src="https://cdn.jsdelivr.net/gh/henkdevries1/webflow-configurator@v0.1.0/dist/configurator.js"></script>
```

## 2. CMS-collecties aanmaken

| Collectie | Velden |
|---|---|
| **Lakken** | Name, Code (tekst, optioneel), Prijs (getal, optioneel), Notitie (tekst), Kleur (Color), Standaard (Switch) |
| **Opties** | Name, Code (optioneel), **Groep** (Option-veld: bijv. *Velgen*, *Cockpit*, *Interieur*), Prijs, Notitie, Afbeelding (optioneel, rond thumbnail), Standaard (Switch) |
| **Renders** | Afbeelding (Image), en optioneel Lak, Standpunt, Combinatie (alle drie plain text) |

Prijzen mag de klant typen zoals hij wil: `4850`, `4.850`, `4.850,50`. Leeg = geen prijs tonen. `0` = “Inbegrepen”.

## 3. De configurator op de pagina

1. Sleep een **Div Block** op de pagina → Settings → Custom attributes: `tcfg-element` = `configurator`.
   Optioneel: `tcfg-lang` = `nl`, `tcfg-theme` = `dark`, `tcfg-start-view` = `02`.
2. Daarin een **Div Block** met `tcfg-element` = `data`. Alles hierin is onzichtbaar.
3. In de data-div, per optiegroep een lege Div Block:

   | tcfg-element | tcfg-code | tcfg-kind | tcfg-title | extra |
   |---|---|---|---|---|
   | group | paint | paint | Lak | |
   | group | velgen | choice | Velgen | |
   | group | cockpit | toggle | Cockpit | |
   | group | interieur | choice | Interieur | `tcfg-renders` = `false` (niet zichtbaar op de renders) |

   *choice* = kies er één, *toggle* = aan/uit (meerdere tegelijk), *paint* = kleurbolletjes (één groep).
   `tcfg-code` moet gelijk zijn aan de waarde van het Groep-veld in de Opties-collectie (of `tcfg-title`).

4. **Collection List “Lakken”** in de data-div. Op het Collection Item een Div Block met
   `tcfg-element` = `option` en `tcfg-group` = `paint`. Daarin:
   - Text Block gekoppeld aan Name, met attribuut `tcfg-field` = `name`
   - idem voor Code (`code`), Prijs (`price`), Notitie (`note`)
   - een Div Block met `tcfg-field` = `swatch`, achtergrondkleur gekoppeld aan het Kleur-veld
   - een Text Block met de tekst `ja` en `tcfg-field` = `default`, met *Conditional visibility*: alleen tonen als Standaard aan staat
5. **Collection List “Opties”**: hetzelfde, maar `tcfg-group` niet als vast attribuut: voeg een Text Block
   toe gekoppeld aan het Groep-veld met `tcfg-field` = `group`. Een Image gekoppeld aan Afbeelding wordt het thumbnail.
6. **Collection List “Renders”**: Collection Item → Div Block `tcfg-element` = `render`, daarin een Image gekoppeld
   aan Afbeelding, en (als je die velden gebruikt) Text Blocks met `tcfg-field` = `paint`, `view` en `set`.
   Zet **Paginate items** aan: de configurator laadt zelf alle pagina’s (er mogen dus honderden renders in).

## 4. Renders aanleveren

De **basisrenders** van een lak tonen de *standaardauto*: standaardvelg, en elke aan/uit-optie in haar standaardstand
(staat helmet shell standaard aan, dan zijn de basisrenders mét helmet shell). Andere renders noemen alleen hun
**afwijkingen**. De bestandsnaam regelt alles:

```
rosso_01.jpg                                   basis, standpunt 01
rosso_05_roll-cage.jpg                         + rolkooi
rosso_05_zonder-helmet-shell.jpg               zonder helmet shell
rosso_05_roll-cage+zonder-helmet-shell.jpg     beide
rosso_05_billet.jpg                            Billet-velgen
```

- Lak = code, volledige naam of het eerste woord van de naam (`rosso` voor *Rosso Cordoba*).
- Standpunt = het laatste getal (`5` = `05`).
- Opties = code of naam van de optie; `zonder-`, `without-`, `no-`, `geen-` = uit; meerdere met `+`.
- Past de naam niet (bijv. een KeyShot-export)? Vul dan de velden Lak, Standpunt en Combinatie
  (`roll cage + zonder helmet shell`) in; die gaan altijd vóór de bestandsnaam.

Ontbreekt een combinatie voor een standpunt, dan toont de configurator de render die het meest van de
gekozen auto laat zien — nooit een optie die de bezoeker níet koos — met een regel als
“Getoond zonder rolkooi — nog niet gerenderd”. Wat er mis is met een render (onbekende optie, geen standpunt)
staat in de browserconsole als `[tcfg] …`.

## 5. Leads (optioneel)

Zet een gewone **Form Block** in de data-div en geef de Form Block-wrapper:

- `tcfg-element` = `gate-form` → e-mailpoort: bij de eerste klik op een optie opent het formulier; na verzenden
  is de configurator in die browser ontgrendeld.
- `tcfg-element` = `enquiry-form` → de knop “Informatie aanvragen” in de samenvatting; het formulier krijgt
  automatisch verborgen velden met de configuratie, prijsindicatie, een link naar de configuratie en één veld per groep.

Inzendingen komen binnen zoals elk Webflow-formulier (Forms-tab, notificatiemail, Zapier/Make).

## 6. Opmaak

Kleuren, afrondingen en beeldverhouding zijn CSS-variabelen op het configurator-element, bijv. in een Embed:

```html
<style>
  .tcfg { --tcfg-accent: #8c1c13; --tcfg-ratio: 16 / 10; --tcfg-sticky-top: 72px; }
</style>
```

Teksten aanpassen: `tcfg-label-cta` = `Offerte aanvragen` (zie de README voor alle sleutels).
Eigen indeling: lege Div Blocks met `tcfg-slot` = `viewer`, `options` en `summary` binnen de configurator.

## Testen

- Werkt het niet? Open de console: alle meldingen beginnen met `[tcfg]`.
- E-mailpoort opnieuw testen: in de console `TornanteConfigurator.instances[0].lock()`.
- Gedeelde link: de knop *Delen* kopieert een link waarmee precies deze configuratie weer opent.
