import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';

/**
 * Coque commune d'aperçu A4 (Devis / Factures).
 * - Rendue dans un portail (document.body) pour que l'impression ne contienne
 *   QUE la feuille A4, sans l'application en arrière-plan.
 * - La feuille fait exactement 210 x 297 mm (voir .a4-sheet dans index.css).
 */
export function DocumentShell({ title, reference, actions, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="print-shell fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm overflow-auto">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="no-print sticky top-0 z-10 bg-slate-950/95 border-b border-white/10 text-white">
        <div className="max-w-[1280px] mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <span className="text-sm font-semibold whitespace-nowrap">{title}</span>
            {reference && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/10 text-slate-200 whitespace-nowrap shrink-0">
                {reference}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            <button
              onClick={() => window.print()}
              className="h-9 px-3.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center shrink-0"
              title="Fermer (Échap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone de prévisualisation : feuille A4 centrée */}
      <div className="print-shell py-8 px-4 flex justify-center">
        <div className="print-shell shadow-2xl shadow-black/40 rounded-sm">
          <div className="a4-sheet">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** En-tête : société émettrice à gauche, titre du document à droite */
export function DocHeader({ company, docTitle, docNumber, accent = '#1e3a8a', meta = [] }) {
  return (
    <div className="flex justify-between items-start gap-6 pb-4 border-b-2" style={{ borderColor: accent }}>
      <div className="flex items-start gap-3 min-w-0">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
        ) : (
          <div
            className="h-11 w-11 rounded-md flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ backgroundColor: accent }}
          >
            {(company.name || 'OF')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-slate-900 leading-tight">{company.name || 'Votre Société'}</div>
          {company.legalName && <div className="text-[9.5px] text-slate-500">{company.legalName}</div>}
          <div className="mt-1.5 text-[9.5px] text-slate-600 leading-snug">
            <div>{company.address}</div>
            <div>
              {company.postalCode ? `${company.postalCode} ` : ''}
              {company.city}, {company.country}
            </div>
            <div>
              Tél : {company.phone}
              {company.mobile ? ` • Mob : ${company.mobile}` : ''}
            </div>
            {company.email && <div>{company.email}{company.website ? ` • ${company.website}` : ''}</div>}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[22px] font-extrabold tracking-[0.12em] leading-none" style={{ color: accent }}>
          {docTitle}
        </div>
        <div className="mt-1 text-[11px] font-mono font-semibold text-slate-800">N° {docNumber}</div>
        <table className="mt-2.5 ml-auto text-[9.5px]">
          <tbody>
            {meta.map((m) => (
              <tr key={m.label}>
                <td className="pr-2 py-[1px] text-slate-500 text-right">{m.label}</td>
                <td className="py-[1px] font-semibold text-slate-800 text-right">{m.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Bloc identifiants émetteur + destinataire */
export function DocParties({ company, customer, fallbackName, recipientLabel = 'Destinataire' }) {
  const c = customer || {};
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="text-[9.5px] text-slate-600 leading-snug">
        <div className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Identifiants légaux</div>
        {company.ninea && <div>NINEA : <span className="font-mono text-slate-800">{company.ninea}</span></div>}
        {company.rccm && <div>RCCM : <span className="font-mono text-slate-800">{company.rccm}</span></div>}
        {company.cofi && <div>Centre fiscal : <span className="text-slate-800">{company.cofi}</span></div>}
      </div>

      <div className="border border-slate-300 rounded-sm px-3 py-2">
        <div className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{recipientLabel}</div>
        <div className="text-[12px] font-bold text-slate-900 leading-tight">{c.name || fallbackName}</div>
        <div className="text-[9.5px] text-slate-600 leading-snug mt-0.5">
          {c.address && <div>{c.address}</div>}
          {(c.city || c.country) && (
            <div>
              {c.postalCode ? `${c.postalCode} ` : ''}
              {c.city}
              {c.country ? `, ${c.country}` : ''}
            </div>
          )}
          {(c.phone || c.mobile) && <div>Tél : {c.mobile || c.phone}</div>}
          {c.email && <div>{c.email}</div>}
          {(c.ninea || c.rccm) && (
            <div className="mt-0.5 font-mono text-[9px] text-slate-500">
              {c.ninea ? `NINEA ${c.ninea}` : ''}
              {c.ninea && c.rccm ? ' • ' : ''}
              {c.rccm ? `RCCM ${c.rccm}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tableau des lignes */
export function DocItemsTable({ items = [], currencyFmt, showDiscount = true, accent = '#1e3a8a' }) {
  return (
    <table className="w-full mt-5 text-[9.5px]">
      <thead>
        <tr className="text-white text-[8.5px] uppercase tracking-wider" style={{ backgroundColor: accent }}>
          <th className="py-1.5 px-2 text-left font-semibold">Désignation</th>
          <th className="py-1.5 px-2 text-center font-semibold w-[13%]">Qté</th>
          <th className="py-1.5 px-2 text-right font-semibold w-[16%]">P.U. HT</th>
          {showDiscount && <th className="py-1.5 px-2 text-center font-semibold w-[8%]">Rem.</th>}
          <th className="py-1.5 px-2 text-center font-semibold w-[7%]">TVA</th>
          <th className="py-1.5 px-2 text-right font-semibold w-[17%]">Total HT</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className={`avoid-break border-b border-slate-200 ${idx % 2 ? 'bg-slate-50' : ''}`}>
            <td className="py-1.5 px-2 align-top">
              <div className="font-semibold text-slate-900">{item.description}</div>
              {item.reference && <div className="text-[8.5px] text-slate-400 font-mono">Réf : {item.reference}</div>}
            </td>
            <td className="py-1.5 px-2 text-center align-top text-slate-700">
              {item.quantity} {item.unit || ''}
            </td>
            <td className="py-1.5 px-2 text-right align-top text-slate-700 whitespace-nowrap">{currencyFmt(item.unitPriceHT)}</td>
            {showDiscount && (
              <td className="py-1.5 px-2 text-center align-top text-slate-500">
                {item.discountPercent > 0 ? `${item.discountPercent}%` : '–'}
              </td>
            )}
            <td className="py-1.5 px-2 text-center align-top text-slate-500">{item.vatRate}%</td>
            <td className="py-1.5 px-2 text-right align-top font-semibold text-slate-900 whitespace-nowrap">
              {currencyFmt(item.totalHT)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Ligne de totaux */
export function TotalRow({ label, value, strong = false, accent, className = '' }) {
  return (
    <div
      className={`flex justify-between px-3 py-1 ${strong ? 'text-white font-bold text-[11.5px] py-1.5' : 'text-slate-700'} ${className}`}
      style={strong ? { backgroundColor: accent } : undefined}
    >
      <span>{label}</span>
      <span className="whitespace-nowrap font-mono">{value}</span>
    </div>
  );
}

/** Pied de page légal (collé en bas de la feuille) */
export function DocFooter({ company }) {
  return (
    <div className="mt-auto pt-3 border-t border-slate-200 text-center text-[8.5px] text-slate-500 leading-relaxed">
      {company.footerTerms && <div>{company.footerTerms}</div>}
      <div className="font-mono">
        {company.bankName ? `${company.bankName}` : ''}
        {company.iban ? ` • IBAN : ${company.iban}` : ''}
        {company.bic ? ` • BIC : ${company.bic}` : ''}
      </div>
    </div>
  );
}
