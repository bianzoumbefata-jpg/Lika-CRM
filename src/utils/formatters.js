// Currency and number formatters adapted for Senegal (FCFA / XOF) and international
export function formatCurrency(amount, currencySymbol = 'FCFA', position = 'after') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return position === 'before' ? `${currencySymbol} 0` : `0 ${currencySymbol}`;
  }
  const num = Number(amount);
  
  // For FCFA, XOF, or MGA (Ariary), amounts in practice do not have cents/decimals
  const isCfaOrNoCent = ['FCFA', 'XOF', 'CFA', 'Ar', 'MGA'].includes(currencySymbol.trim());
  const decimals = isCfaOrNoCent ? 0 : 2;

  const formatted = num
    .toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    .replace(/\u202F/g, ' ');

  return position === 'before' ? `${currencySymbol} ${formatted}` : `${formatted} ${currencySymbol}`;
}

export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Date formatter (DD/MM/YYYY)
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

// Days difference relative to today
export function getDaysDiffFromToday(dateString) {
  if (!dateString) return 0;
  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Status badge styling mappings
export const STATUS_CONFIG = {
  // Quotes
  brouillon: { label: 'Brouillon', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  envoye: { label: 'Envoyé', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  accepte: { label: 'Accepté / Signé', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  refuse: { label: 'Refusé', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  expire: { label: 'Expiré', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },

  // Invoices
  envoyee: { label: 'Envoyée', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  partiellement_payee: { label: 'Partiellement payée', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  payee: { label: 'Payée', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  en_retard: { label: 'En retard (Impayé)', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },

  // Digital Invoice Stamps (Cachets numériques de facture)
  paye: { label: 'PAYÉ', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' },
  paye_livre: { label: 'PAYÉ & LIVRÉ', bg: 'bg-teal-50 text-teal-800 border-teal-300', dot: 'bg-teal-600' },
  livre_non_paye: { label: 'LIVRÉ NON PAYÉ', bg: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-600' },
  paye_non_livre: { label: 'PAYÉ NON LIVRÉ', bg: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-600' },

  // Stock statuses
  en_stock: { label: 'En stock', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  stock_faible: { label: 'Stock faible', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  rupture: { label: 'Rupture', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },

  // Stock Movement Types
  entree: { label: 'Entrée / Approvisionnement', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sortie: { label: 'Sortie / Vente', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  ajustement: { label: 'Ajustement Inventaire', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  perte: { label: 'Rebut / Perte', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Pipeline Stages
  qualification: { label: 'Qualification (20%)', bg: 'bg-slate-100 text-slate-800 border-slate-300', color: 'indigo' },
  proposition: { label: 'Proposition (50%)', bg: 'bg-blue-100 text-blue-800 border-blue-300', color: 'blue' },
  negociation: { label: 'Négociation (80%)', bg: 'bg-amber-100 text-amber-800 border-amber-300', color: 'amber' },
  gagne: { label: 'Gagnée (100%)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', color: 'emerald' },
  perdu: { label: 'Perdue (0%)', bg: 'bg-rose-100 text-rose-800 border-rose-300', color: 'rose' },

  // Interventions
  a_faire: { label: 'À faire', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  en_cours: { label: 'En cours', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolu: { label: 'Résolu', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  annule: { label: 'Annulé', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Priorities
  basse: { label: 'Basse', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  moyenne: { label: 'Moyenne', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  haute: { label: 'Haute', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgente: { label: 'Urgente', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Marketing Leads & Campaigns
  nouveau: { label: 'Nouveau Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  contacte: { label: 'Contacté', bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  qualifie: { label: 'Qualifié (Prêt)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  converti: { label: 'Converti en Prospect', bg: 'bg-teal-50 text-teal-800 border-teal-300', dot: 'bg-teal-600' },
  planifiee: { label: 'Planifiée', bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  chaud: { label: 'Chaud 🔥', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  tiede: { label: 'Tiède 🌤️', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  froid: { label: 'Froid ❄️', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// Convert integer FCFA amount to French words (OHADA accounting standard)
export function numberToFrenchWords(n) {
  const num = Math.round(Math.abs(Number(n) || 0));
  if (num === 0) return 'zéro';

  const units = [
    '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
    'dix-sept', 'dix-huit', 'dix-neuf',
  ];
  const tens = [
    '', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
    'soixante', 'quatre-vingt', 'quatre-vingt',
  ];

  function belowHundred(val) {
    if (val < 20) return units[val];
    const t = Math.floor(val / 10);
    const u = val % 10;
    if (t === 7 || t === 9) {
      const sub = 10 + u;
      const sep = t === 7 && u === 1 ? ' et ' : '-';
      return `${tens[t]}${sep}${units[sub]}`;
    }
    if (t === 8) {
      if (u === 0) return 'quatre-vingts';
      return `quatre-vingt-${units[u]}`;
    }
    if (u === 0) return tens[t];
    if (u === 1) return `${tens[t]} et un`;
    return `${tens[t]}-${units[u]}`;
  }

  function belowThousand(val) {
    if (val < 100) return belowHundred(val);
    const h = Math.floor(val / 100);
    const rem = val % 100;
    const hStr = h === 1 ? 'cent' : `${units[h]} cent${rem === 0 ? 's' : ''}`;
    return rem === 0 ? hStr : `${hStr} ${belowHundred(rem)}`;
  }

  const parts = [];
  const milliards = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  if (milliards > 0) {
    parts.push(`${belowThousand(milliards)} milliard${milliards > 1 ? 's' : ''}`);
  }
  if (millions > 0) {
    parts.push(`${belowThousand(millions)} million${millions > 1 ? 's' : ''}`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${belowThousand(thousands)} mille`);
  }
  if (remainder > 0) {
    parts.push(belowThousand(remainder));
  }

  const res = parts.join(' ').trim();
  return res.charAt(0).toUpperCase() + res.slice(1);
}
