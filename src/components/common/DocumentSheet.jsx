import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { downloadElementAsPdf } from '../../utils/pdfExport';

/**
 * Charte des documents commerciaux Lika (Devis, Factures, Avoirs, Reçus, BL).
 * Direction issue du skill UI/UX Pro Max, profil « Invoice & Billing Tool » :
 *   - style Minimalism / Swiss + Flat : aplats, grille stricte, aucune ombre
 *   - bleu marine professionnel #1E3A5F, bleu d'action #2563EB,
 *     vert « payé » #059669, rouge « en retard » #DC2626, gris neutres
 *   - typographie « Modern Professional » : Poppins (titres) + Open Sans (texte)
 */
export const DOC_NAVY = '#1E3A5F';
export const DOC_ACCENTS = {
  devis: DOC_NAVY,
  facture: DOC_NAVY,
  avoir: '#B91C1C',
  recu: '#047857',
  bl: DOC_NAVY,
};

const initials = (name = '') =>
  (name || 'LK')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Mode « capture » : le document est rendu hors écran (sans barre d'outils)
 * pour être converti en PDF puis joint à un e-mail ou partagé sur WhatsApp.
 */
export const DocCaptureContext = createContext(null);

/**
 * Coque commune d'aperçu A4.
 * - Rendue dans un portail (document.body) pour que l'impression ne contienne
 *   QUE la feuille A4, sans l'application en arrière-plan.
 * - La feuille fait exactement 210 x 297 mm (voir .a4-sheet dans index.css).
 */
export function DocumentShell({ title, reference, actions, onClose, children }) {
  const capture = useContext(DocCaptureContext);
  const sheetRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (capture) {
      capture.onReady?.(sheetRef.current);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, capture]);

  const sheet = (
    <div ref={sheetRef} className="a4-sheet doc-sheet">
      {children}
    </div>
  );

  if (capture) {
    return createPortal(
      <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}>
        {sheet}
      </div>,
      document.body
    );
  }

  const handleDownload = async () => {
    if (!sheetRef.current) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(sheetRef.current, `${reference || 'document'}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="print-shell fixed inset-0 z-[60] bg-[#09090b]/85 backdrop-blur-md overflow-auto">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="no-print sticky top-0 z-10 bg-[#0e0e12]/95 backdrop-blur-xl border-b border-white/[0.07] text-white">
        <div className="max-w-[1280px] mx-auto px-4 min-h-16 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-[#1E3A5F] flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4 text-white" />
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-bold whitespace-nowrap">{title}</div>
              {reference && <div className="text-[11.5px] font-mono text-[#8d8d9a] whitespace-nowrap">{reference}</div>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="h-10 px-4 text-[13px] font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-60 rounded-full transition flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 shrink-0" />}
              <span>Télécharger PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="h-10 px-4 text-[13px] font-bold text-[#0b0b0e] bg-[#ffffff] hover:bg-[#ececf2] rounded-full transition flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer l'aperçu"
              className="h-10 w-10 rounded-full text-[#8d8d9a] hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/[0.08] transition flex items-center justify-center shrink-0"
              title="Fermer (Échap)"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone de prévisualisation : feuille A4 centrée */}
      <div className="print-shell py-10 px-4 flex justify-center">
        <div className="print-shell shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">{sheet}</div>
      </div>
    </div>,
    document.body
  );
}

/**
 * En-tête : bandeau bleu marine pleine largeur (société + titre du document),
 * puis la rangée des métadonnées.
 */
export function DocHeader({ company, docTitle, docNumber, accent = DOC_NAVY, meta = [] }) {
  const status = meta.find((m) => m.highlight);
  return (
    <>
      <div className="doc-band" style={{ backgroundColor: accent }}>
        <div className="flex items-center gap-3.5 min-w-0">
          {company.logoUrl ? (
            <div className="h-[15mm] px-2 rounded-[1.5mm] bg-white flex items-center">
              <img src={company.logoUrl} alt="Logo" className="max-h-[12mm] w-auto max-w-[38mm] object-contain" />
            </div>
          ) : (
            <div className="h-[14mm] w-[14mm] rounded-[1.5mm] bg-white flex items-center justify-center font-doc-heading font-bold text-[17px] shrink-0" style={{ color: accent }}>
              {initials(company.name)}
            </div>
          )}
          <div className="min-w-0 text-white">
            <div className="font-doc-heading text-[17px] font-semibold leading-tight">{company.name || 'Votre Société'}</div>
            {company.legalName && <div className="text-[9px] text-white/70 mt-0.5">{company.legalName}</div>}
          </div>
        </div>
        <div className="text-right text-white shrink-0">
          <div className="font-doc-heading text-[26px] font-bold leading-none tracking-[0.04em] uppercase">{docTitle}</div>
          <div className="mt-1.5 text-[10.5px] text-white/80">
            N° <span className="font-semibold text-white">{docNumber}</span>
          </div>
        </div>
      </div>
      <div className="doc-band-rule" />

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-6 items-start">
        <div className="text-[9px] text-[#475569] leading-[1.6]">
          <div>{company.address}</div>
          <div>
            {company.postalCode ? `${company.postalCode} ` : ''}
            {company.city}
            {company.country ? `, ${company.country}` : ''}
          </div>
          <div>
            {company.phone && <>Tél. {company.phone}</>}
            {company.mobile ? ` · Mob. ${company.mobile}` : ''}
          </div>
          {company.email && (
            <div>
              {company.email}
              {company.website ? ` · ${company.website}` : ''}
            </div>
          )}
        </div>
        {status && (
          <StatusBadge label={status.value} />
        )}
      </div>

      <DocMeta meta={meta.filter((m) => !m.highlight)} />
    </>
  );
}

const STATUS_TONES = [
  { test: /(retard|impay|refus|échu|annul)/i, bg: '#FEF2F2', fg: '#B91C1C', bd: '#FECACA' },
  { test: /(partiel|attente|envoy)/i, bg: '#FFFBEB', fg: '#B45309', bd: '#FDE68A' },
  { test: /(pay|sold|encaiss|accept|sign|livr)/i, bg: '#ECFDF5', fg: '#047857', bd: '#A7F3D0' },
];

export function StatusBadge({ label }) {
  const tone = STATUS_TONES.find((t) => t.test.test(String(label))) || { bg: '#F1F5F9', fg: '#334155', bd: '#E2E8F0' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap"
      style={{ backgroundColor: tone.bg, color: tone.fg, border: `1px solid ${tone.bd}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tone.fg }} />
      {label}
    </span>
  );
}

/** Rangée de métadonnées (dates, références) */
export function DocMeta({ meta = [] }) {
  if (!meta.length) return null;
  return (
    <div
      className="mt-4 grid border-y border-[#E4E7EB]"
      style={{ gridTemplateColumns: `repeat(${Math.min(meta.length, 5)}, minmax(0, 1fr))` }}
    >
      {meta.map((m, i) => (
        <div key={m.label} className={`py-2 min-w-0 ${i > 0 ? 'pl-3 border-l border-[#E4E7EB]' : ''}`}>
          <div className="text-[7.5px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
            {String(m.label).replace(/\s*:\s*$/, '')}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-[#0F172A] truncate">{m.value || '—'}</div>
        </div>
      ))}
    </div>
  );
}

/** Bloc émetteur (identifiants légaux) + destinataire */
export function DocParties({ company, customer, fallbackName, recipientLabel = 'Destinataire', accent = DOC_NAVY }) {
  const c = customer || {};
  return (
    <div className="grid grid-cols-2 gap-6 mt-5">
      <div>
        <DocSectionTitle accent={accent}>{recipientLabel}</DocSectionTitle>
        <div className="font-doc-heading text-[13px] font-semibold text-[#0F172A] leading-tight">{c.name || fallbackName}</div>
        <div className="text-[9px] text-[#475569] leading-[1.6] mt-1">
          {c.address && <div>{c.address}</div>}
          {(c.city || c.country) && (
            <div>
              {c.postalCode ? `${c.postalCode} ` : ''}
              {c.city}
              {c.country ? `, ${c.country}` : ''}
            </div>
          )}
          {(c.mobile || c.phone) && <div>Tél. {c.mobile || c.phone}</div>}
          {c.email && <div>{c.email}</div>}
          {(c.ninea || c.rccm) && (
            <div className="mt-0.5 text-[8.5px] text-[#64748B]">
              {c.ninea ? `NINEA ${c.ninea}` : ''}
              {c.ninea && c.rccm ? ' · ' : ''}
              {c.rccm ? `RCCM ${c.rccm}` : ''}
            </div>
          )}
        </div>
      </div>

      <div>
        <DocSectionTitle accent={accent}>Émetteur</DocSectionTitle>
        <div className="font-doc-heading text-[13px] font-semibold text-[#0F172A] leading-tight">{company.name}</div>
        <div className="text-[9px] text-[#475569] leading-[1.6] mt-1">
          {company.ninea && <div>NINEA {company.ninea}</div>}
          {company.rccm && <div>RCCM {company.rccm}</div>}
          {company.cofi && <div>Centre fiscal : {company.cofi}</div>}
        </div>
      </div>
    </div>
  );
}

/** Tableau des lignes */
export function DocItemsTable({ items = [], currencyFmt, showDiscount = true, accent = DOC_NAVY }) {
  return (
    <table className="w-full mt-6 text-[9.5px]">
      <thead>
        <tr className="text-white text-[8px] uppercase tracking-[0.1em]" style={{ backgroundColor: accent }}>
          <th className="py-2 pl-3 pr-2 text-left font-semibold w-[6%]">N°</th>
          <th className="py-2 px-2 text-left font-semibold">Désignation</th>
          <th className="py-2 px-2 text-center font-semibold w-[11%]">Qté</th>
          <th className="py-2 px-2 text-right font-semibold w-[16%]">P.U. HT</th>
          {showDiscount && <th className="py-2 px-2 text-center font-semibold w-[8%]">Rem.</th>}
          <th className="py-2 px-2 text-center font-semibold w-[7%]">TVA</th>
          <th className="py-2 pl-2 pr-3 text-right font-semibold w-[17%]">Total HT</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className={`avoid-break border-b border-[#E4E7EB] ${idx % 2 ? 'bg-[#F8FAFC]' : ''}`}>
            <td className="py-2 pl-3 pr-2 align-top text-[#64748B]">{String(idx + 1).padStart(2, '0')}</td>
            <td className="py-2 px-2 align-top">
              <div className="font-semibold text-[#0F172A]">{item.description}</div>
              {item.reference && <div className="text-[8px] text-[#64748B] mt-0.5">Réf. {item.reference}</div>}
            </td>
            <td className="py-2 px-2 text-center align-top text-[#334155]">
              {item.quantity} {item.unit || ''}
            </td>
            <td className="py-2 px-2 text-right align-top text-[#334155] whitespace-nowrap">{currencyFmt(item.unitPriceHT)}</td>
            {showDiscount && (
              <td className="py-2 px-2 text-center align-top text-[#64748B]">
                {item.discountPercent > 0 ? `${item.discountPercent}%` : '–'}
              </td>
            )}
            <td className="py-2 px-2 text-center align-top text-[#64748B]">{item.vatRate}%</td>
            <td className="py-2 pl-2 pr-3 text-right align-top font-semibold text-[#0F172A] whitespace-nowrap">
              {currencyFmt(item.totalHT)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Bloc des totaux (enveloppe les TotalRow) */
export function TotalsCard({ children }) {
  return <div className="text-[10px]">{children}</div>;
}

/** Ligne de totaux */
export function TotalRow({ label, value, strong = false, accent = DOC_NAVY, className = '' }) {
  if (strong) {
    return (
      <div className={`flex items-center justify-between mt-1.5 px-3 py-2.5 text-white ${className}`} style={{ backgroundColor: accent }}>
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em]">{label}</span>
        <span className="whitespace-nowrap font-doc-heading text-[14px] font-bold">{value}</span>
      </div>
    );
  }
  return (
    <div className={`flex justify-between px-3 py-1.5 text-[#334155] border-b border-[#E4E7EB] ${className}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

/** Intitulé de section */
export function DocSectionTitle({ children, accent = DOC_NAVY }) {
  return (
    <div className="mb-1.5 pb-1 border-b-2 text-[8px] font-bold uppercase tracking-[0.12em] inline-block" style={{ color: accent, borderColor: accent }}>
      {children}
    </div>
  );
}

/** Pied de page légal (collé en bas de la feuille) */
export function DocFooter({ company, accent = DOC_NAVY }) {
  const bank = [
    company.bankName,
    company.iban ? `IBAN ${company.iban}` : '',
    company.bic ? `BIC ${company.bic}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="mt-auto pt-5">
      <div className="text-center text-[8.5px] font-semibold text-[#0F172A] mb-2">Merci pour votre confiance.</div>
      <div className="pt-2 border-t border-[#E4E7EB] text-center text-[7.5px] text-[#64748B] leading-[1.6]">
        {company.footerTerms && <div>{company.footerTerms}</div>}
        {bank && <div>{bank}</div>}
      </div>
      <div className="doc-foot-band" style={{ backgroundColor: accent }} />
    </div>
  );
}
