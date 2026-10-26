// Demo server: http://localhost:4321 — a page built the way Webflow
// publishes one (hidden Collection Lists with w-dyn-* classes, a paginated
// Renders list of 20 items per page, Webflow form blocks), plus a stand-in
// for webflow.js's form handling that logs what would be submitted.
//   npm run demo            English
//   http://localhost:4321/?lang=nl   Dutch
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paints, wheels, cockpit, trims, viewList, renderList, renderSvg } from './demo-data.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const PORT = Number(process.env.PORT ?? 4321);
const PAGE_KEY = 'a7c3e9f1_page';
const PER_PAGE = 20;
const renders = renderList();

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** A CMS-bound text field: empty fields get Webflow's w-dyn-bind-empty. */
const fieldEl = (key, value) => `<div tcfg-field="${key}" class="${value ? '' : 'w-dyn-bind-empty'}">${esc(value)}</div>`;

function optionItems(group, list) {
  return list.map((o) => `<div role="listitem" class="w-dyn-item">
      <div tcfg-element="option" tcfg-group="${group}" tcfg-default="${o.default ? 'true' : 'false'}">
        ${fieldEl('name', o.name)}${fieldEl('code', o.code)}${fieldEl('price', o.price)}${fieldEl('note', o.note)}
        ${o.hex ? `<div tcfg-field="swatch" style="background-color:${o.hex}"></div>` : ''}
      </div></div>`).join('\n');
}

function renderItems(page) {
  const start = (page - 1) * PER_PAGE;
  return renders.slice(start, start + PER_PAGE).map((r) => `<div role="listitem" class="w-dyn-item">
      <div tcfg-element="render">
        <img src="/assets/${r.file}" loading="lazy" alt="">
        ${r.explicit ? fieldEl('paint', 'Verde Pino') + fieldEl('view', r.view) + fieldEl('set', 'billet + roll cage') : fieldEl('paint', '') + fieldEl('set', '')}
      </div></div>`).join('\n');
}

function pagination(page) {
  const pages = Math.ceil(renders.length / PER_PAGE);
  const prev = page > 1 ? `<a href="?${PAGE_KEY}=${page - 1}" aria-label="Previous Page" class="w-pagination-previous">Previous</a>` : '';
  const next = page < pages ? `<a href="?${PAGE_KEY}=${page + 1}" aria-label="Next Page" class="w-pagination-next">Next</a>` : '';
  return `<div role="navigation" aria-label="List" class="w-pagination-wrapper">${prev}${next}</div>`;
}

const formBlock = (kind, fields, button) => `
  <div tcfg-element="${kind}" class="w-form">
    <form name="${kind}" data-name="${kind === 'gate-form' ? 'Configurator gate' : 'Configurator enquiry'}" method="get" class="demo-form">
      ${fields}
      <input type="submit" class="tcfg-button demo-submit" value="${button}">
    </form>
    <div class="w-form-done" tabindex="-1" role="region" style="display:none"><div>Thank you! Your submission has been received.</div></div>
    <div class="w-form-fail" style="display:none"><div>Oops! Something went wrong.</div></div>
  </div>`;

async function page(url) {
  const n = Math.max(1, Number(url.searchParams.get(PAGE_KEY) ?? 1));
  const lang = url.searchParams.get('lang') === 'nl' ? 'nl' : 'en';
  const dark = url.searchParams.get('theme') === 'dark';
  const gate = url.searchParams.get('gate') === 'on';
  const tpl = await readFile(join(root, 'demo/index.html'), 'utf8');
  return tpl
    .replaceAll('{{LANG}}', lang)
    .replaceAll('{{THEME}}', dark ? 'dark' : 'light')
    .replaceAll('{{GATE}}', gate ? 'first-change' : 'off')
    .replace('{{PAINTS}}', optionItems('paint', paints))
    .replace('{{WHEELS}}', optionItems('Wheels', wheels))
    .replace('{{COCKPIT}}', optionItems('cockpit', cockpit))
    .replace('{{TRIMS}}', optionItems('interior', trims))
    .replace('{{VIEWS}}', viewList.map((v) => `<div tcfg-element="view" tcfg-code="${v.code}" tcfg-name="${esc(v.name)}"></div>`).join(''))
    .replace('{{RENDERS}}', renderItems(n))
    .replace('{{PAGINATION}}', pagination(n))
    .replace('{{GATE_FORM}}', gate ? formBlock('gate-form', '<label for="g-email">Email</label><input type="email" id="g-email" name="email" data-name="Email" required class="demo-input">', 'Show me') : '')
    .replace('{{ENQUIRY_FORM}}', formBlock('enquiry-form', '<label for="e-name">Name</label><input id="e-name" name="name" data-name="Name" required class="demo-input"><label for="e-email">Email</label><input type="email" id="e-email" name="email" data-name="Email" required class="demo-input"><label for="e-msg">Message</label><textarea id="e-msg" name="message" data-name="Message" class="demo-input" rows="3"></textarea>', 'Send'));
}

const types = { '.js': 'text/javascript', '.map': 'application/json', '.svg': 'image/svg+xml', '.html': 'text/html' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(await page(url));
    }
    if (url.pathname.startsWith('/assets/')) {
      const file = decodeURIComponent(url.pathname.slice('/assets/'.length));
      const r = renders.find((x) => x.file === file);
      if (!r) throw new Error('not found');
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600' });
      return res.end(renderSvg(r));
    }
    if (url.pathname.startsWith('/dist/')) {
      const body = await readFile(join(root, url.pathname));
      res.writeHead(200, { 'content-type': types[extname(url.pathname)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(body);
    }
    throw new Error('not found');
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`Demo: http://localhost:${PORT}  (?lang=nl, ?theme=dark, ?gate=on)`));
