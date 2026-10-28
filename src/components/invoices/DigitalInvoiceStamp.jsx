import React from 'react';
import { formatDate } from '../../utils/formatters';

export const INVOICE_STAMP_OPTIONS = [
  {
    id: 'aucun',
    shortLabel: 'Aucun cachet',
    stampTitle: '',
    subtitle: '',
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  {
    id: 'paye',
    shortLabel: 'Facture Payée',
    stampTitle: 'FACTURE PAYÉE',
    subtitle: 'RÈGLEMENT INTÉGRAL REÇU',
    color: '#047857', // Emerald ink
    bgTint: 'rgba(4, 120, 87, 0.04)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  {
    id: 'paye_livre',
    shortLabel: 'Payé & Livré',
    stampTitle: 'PAYÉ & LIVRÉ',
    subtitle: 'SOLDÉ & MARCHANDISE LIVRÉE',
    color: '#0f766e', // Teal-Emerald ink
    bgTint: 'rgba(15, 118, 110, 0.04)',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
  },
  {
    id: 'livre_non_paye',
    shortLabel: 'Livré Non Payé',
    stampTitle: 'LIVRÉ • NON PAYÉ',
    subtitle: 'LIVRAISON EFFECTUÉE • SOLDE DÛ',
    color: '#be123c', // Crimson ink
    bgTint: 'rgba(190, 18, 60, 0.04)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
  },
  {
    id: 'paye_non_livre',
    shortLabel: 'Payé Non Livré',
    stampTitle: 'PAYÉ • NON LIVRÉ',
    subtitle: 'RÈGLEMENT REÇU • À LIVRER',
    color: '#1d4ed8', // Cobalt blue ink
    bgTint: 'rgba(29, 78, 216, 0.04)',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
  },
];

export function getEffectiveInvoiceStamp(invoice) {
  if (!invoice) return 'aucun';
  if (invoice.stampType) return invoice.stampType;
  if (invoice.status === 'payee') return 'paye_livre';
  if (invoice.status === 'en_retard') return 'livre_non_paye';
  if (invoice.status === 'partiellement_payee') return 'livre_non_paye';
  return 'aucun';
}

export function getStampConfig(stampId) {
  return (
    INVOICE_STAMP_OPTIONS.find((s) => s.id === stampId) || INVOICE_STAMP_OPTIONS[0]
  );
}

/**
 * Cachet Humide Numérique Officiel apposé sur la facture A4.
 */
export function DigitalInvoiceStamp({ invoice, company = {} }) {
  const effectiveStampId = getEffectiveInvoiceStamp(invoice);
  if (!effectiveStampId || effectiveStampId === 'aucun') return null;

  const cfg = getStampConfig(effectiveStampId);
  if (!cfg || !cfg.stampTitle) return null;

  const companyName = (company.name || 'OPENFLEX SÉNÉGAL SARL').toUpperCase();
  const ninea = company.ninea || company.nif || company.siret || '008491204 2G3';
  const city = (company.city || 'DAKAR').toUpperCase();
  const stampDate = formatDate(
    invoice.stampedAt || invoice.payments?.[invoice.payments.length - 1]?.date || invoice.date
  );

  return (
    <div
      className="avoid-break select-none inline-block"
      style={{
        transform: 'rotate(-6deg)',
        transformOrigin: 'center center',
      }}
    >
      {/* Cadre externe du tampon humide */}
      <div
        className=" rounded-[3px] p-[3px]"
        style={{
          border: `2.5px solid ${cfg.color}`,
          backgroundColor: cfg.bgTint || 'transparent',
          color: cfg.color,
          width: '62mm',
          boxShadow: `inset 0 0 0 0.5px ${cfg.color}`,
        }}
      >
        {/* Filet interne */}
        <div
          className="px-2.5 py-1.5 text-center flex flex-col items-center"
          style={{
            border: `1px dashed ${cfg.color}`,
          }}
        >
          {/* En-tête Société & NINEA */}
          <div className="text-[7.5px] font-bold tracking-[0.14em] leading-tight uppercase truncate w-full">
            ★ {companyName} ★
          </div>
          <div className="text-[6.5px] font-mono font-semibold tracking-[0.08em] opacity-90 mt-0.5">
            NINEA : {ninea} • {city}
          </div>

          {/* Bandeau Central : Mention Principale du Cachet */}
          <div
            className="w-full my-1 py-1 px-1.5 font-mono font-extrabold text-[11.5px] tracking-[0.1em] leading-none uppercase"
            style={{
              borderTop: `1.8px solid ${cfg.color}`,
              borderBottom: `1.8px solid ${cfg.color}`,
              backgroundColor: 'rgba(255,255,255,0.65)',
            }}
          >
            {cfg.stampTitle}
          </div>

          {/* Sous-titre métier */}
          <div className="text-[6.8px] font-bold tracking-[0.09em] uppercase leading-tight">
            {cfg.subtitle}
          </div>

          {/* Date, Référence & Paraphe */}
          <div className="w-full mt-1 pt-0.5 flex items-center justify-between text-[6.5px] font-mono font-semibold opacity-90">
            <span>LE : {stampDate}</span>
            <span>VISA COMPTABILITÉ</span>
          </div>

          {/* Paraphe / Signature vectorielle intégrée au cachet */}
          <svg
            viewBox="0 0 140 22"
            className="w-24 h-4 -mt-0.5 opacity-85"
            fill="none"
            stroke={cfg.color}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16 C25 4, 32 18, 46 8 C54 3, 58 17, 72 11 C86 5, 98 15, 124 7" />
            <path d="M26 18 L112 14" strokeWidth="0.9" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
