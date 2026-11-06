// Génère la couche CSS "thème sombre" qui remappe les utilitaires Tailwind codés en dur.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(process.argv[2] + '/package.json');
const colors = require('tailwindcss/colors');

const esc = (c) => c.replace(/([:/\[\]#.])/g, '\\$1');
const scope = (sel) => `html.dark ${sel}:not(.a4-sheet, .a4-sheet *)`;
const hex2rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const out = [];
const rule = (classes, decl, pseudo = '') => {
  const sels = classes.map((c) => scope(`.${esc(c)}${pseudo}`));
  out.push(`${sels.join(',\n')} { ${decl} }`);
};
const withAlpha = (base, alphas = [30, 40, 50, 60, 70, 80, 90, 95]) => [base, ...alphas.map((a) => `${base}/${a}`)];

// ---- Neutres (slate) ----
rule([...withAlpha('bg-white', [95]), 'bg-[#f8fafc]'], 'background-color: var(--surface) !important;');
rule(withAlpha('bg-slate-50'), 'background-color: var(--surface-2) !important;');
rule([...withAlpha('bg-slate-100'), 'bg-slate-200'], 'background-color: var(--surface-3) !important;');
rule(['bg-slate-800', 'bg-slate-900'], 'background-color: var(--surface-4) !important;');
rule(['focus:bg-white'], 'background-color: var(--surface-2) !important;', ':focus');
rule(withAlpha('hover:bg-slate-50'), 'background-color: var(--hover) !important;', ':hover');
rule([...withAlpha('hover:bg-slate-100'), ...withAlpha('hover:bg-slate-200')], 'background-color: var(--hover-strong) !important;', ':hover');
rule(['text-slate-900', 'text-slate-800', 'text-gray-900', 'text-gray-800'], 'color: var(--text) !important;');
rule(['text-slate-700', 'text-gray-700'], 'color: var(--text-2) !important;');
rule(['text-slate-600', 'text-gray-600'], 'color: var(--text-3) !important;');
rule(['text-slate-500', 'text-gray-500'], 'color: var(--muted) !important;');
rule(['text-slate-400', 'text-gray-400'], 'color: var(--faint) !important;');
rule(['hover:text-slate-900', 'hover:text-slate-800', 'hover:text-slate-700'], 'color: var(--text) !important;', ':hover');
rule(['hover:text-slate-600'], 'color: var(--text-2) !important;', ':hover');
rule(
  [...withAlpha('border-slate-100'), ...withAlpha('border-slate-200'), 'border-gray-200', 'border-gray-100', 'border-white'],
  'border-color: var(--border) !important;'
);
rule(withAlpha('border-slate-300'), 'border-color: var(--border-strong) !important;');
rule(['hover:border-slate-100', 'hover:border-slate-200', 'hover:border-slate-200/70', 'hover:border-slate-300'], 'border-color: var(--border-strong) !important;', ':hover');
for (const d of ['divide-slate-100', 'divide-slate-200', 'divide-slate-300']) {
  out.push(`${scope(`.${d} > :not([hidden]) ~ :not([hidden])`)} { border-color: var(--border) !important; }`);
}
rule(['ring-white'], '--tw-ring-color: var(--surface) !important;');
rule(['from-slate-50'], '--tw-gradient-from: var(--surface-2) var(--tw-gradient-from-position) !important; --tw-gradient-to: transparent var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;');
rule(['to-white'], '--tw-gradient-to: var(--surface) var(--tw-gradient-to-position) !important;');

// ---- Teintes sémantiques : fonds pastel -> voiles translucides, textes foncés -> clairs ----
const hues = ['rose', 'red', 'amber', 'orange', 'yellow', 'blue', 'sky', 'indigo', 'violet', 'purple', 'green', 'emerald', 'teal', 'cyan', 'lime', 'pink', 'fuchsia'];
for (const h of hues) {
  const c = colors[h];
  const mid = hex2rgb(c[500]);
  rule(withAlpha(`bg-${h}-50`), `background-color: rgb(${mid} / 0.12) !important;`);
  rule(withAlpha(`bg-${h}-100`), `background-color: rgb(${mid} / 0.18) !important;`);
  rule([`hover:bg-${h}-50`, `hover:bg-${h}-100`, `hover:bg-${h}-50/80`, `hover:bg-${h}-100/80`], `background-color: rgb(${mid} / 0.22) !important;`, ':hover');
  rule([`text-${h}-700`, `text-${h}-800`, `text-${h}-900`, `text-${h}-950`], `color: ${c[300]} !important;`);
  rule([`text-${h}-600`], `color: ${c[400]} !important;`);
  rule([...withAlpha(`border-${h}-100`), ...withAlpha(`border-${h}-200`), ...withAlpha(`border-${h}-300`)], `border-color: rgb(${mid} / 0.32) !important;`);
}

// ---- Marque (violet piloté par variables) ----
rule(withAlpha('bg-brand-50'), 'background-color: rgb(var(--brand-500) / 0.13) !important;');
rule(withAlpha('bg-brand-100'), 'background-color: rgb(var(--brand-500) / 0.2) !important;');
rule(['hover:bg-brand-50', 'hover:bg-brand-100', 'hover:bg-brand-100/80', 'hover:bg-brand-50/80'], 'background-color: rgb(var(--brand-500) / 0.24) !important;', ':hover');
rule(['text-brand-700', 'text-brand-800', 'text-brand-900', 'text-brand-950'], 'color: rgb(var(--brand-300)) !important;');
rule(['text-brand-600'], 'color: rgb(var(--brand-400)) !important;');
rule(['hover:text-brand-800', 'hover:text-brand-700'], 'color: rgb(var(--brand-200)) !important;', ':hover');
rule([...withAlpha('border-brand-100'), ...withAlpha('border-brand-200'), ...withAlpha('border-brand-300')], 'border-color: rgb(var(--brand-500) / 0.35) !important;');

fs.writeFileSync(process.argv[3], `/* AUTO-GÉNÉRÉ — couche thème sombre (CentralFlow). Ne pas éditer à la main. */\n${out.join('\n')}\n`, 'utf8');
console.log('rules:', out.length);
