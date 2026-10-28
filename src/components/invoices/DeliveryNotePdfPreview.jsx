import React, { useState } from 'react';
import { Eye, EyeOff, FileText, Receipt, Stamp, Truck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  DigitalInvoiceStamp,
  INVOICE_STAMP_OPTIONS,
  getEffectiveInvoiceStamp,
} from './DigitalInvoiceStamp';
import {
  DocumentShell,
  DocHeader,
  DocParties,
  DocFooter,
} from '../common/DocumentSheet';

export function DeliveryNotePdfPreview({
  isOpen,
  onClose,
  document, // Peut être une facture (FAC-...) ou un devis (DEV-...)
  onSwitchToInvoice,
  onSwitchToReceipt,
}) {
  const {
    settings,
    customers,
    invoices,
    quotes,
    updateInvoiceStamp,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [showPrices, setShowPrices] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('Livraison sur site client');

  if (!isOpen || !document) return null;

  const isQuote = String(document.id || '').startsWith('DEV-');
  const liveDoc = isQuote
    ? quotes.find((q) => q.id === document.id) || document
    : invoices.find((i) => i.id === document.id) || document;

  const company = settings?.company || {};
  const customer = customers?.find((c) => c.id === liveDoc.customerId);
  const primaryContact =
    customer?.contacts?.find((c) => c.isPrimary) || customer?.contacts?.[0];

  const accent = '#065f46'; // Emerald OHADA
  const fmt = (v) => formatCurrency(v, currencySymbol, currencyPosition);

  // Numéro de Bordereau de Livraison dérivé de la pièce (ex: FAC-2026-0001 -> BL-2026-0001)
  const blNumber = String(liveDoc.id || '0001').replace(/^(FAC|DEV|AVO)-/, 'BL-');
  const deliveryDate = formatDate(liveDoc.deliveredAt || liveDoc.date);

  const items = liveDoc.items || [];
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity ?? item.qty) || 0), 0);

  // Cachet numérique appliqué sur le BL (par défaut : paye_livre si payée, sinon livre_non_paye)
  const stampForBl = {
    ...liveDoc,
    stampType:
      liveDoc.stampType && liveDoc.stampType !== 'aucun'
        ? liveDoc.stampType
        : liveDoc.status === 'payee'
        ? 'paye_livre'
        : 'livre_non_paye',
  };
  const activeStamp = getEffectiveInvoiceStamp(stampForBl);

  const meta = [
    { label: 'Date de livraison :', value: deliveryDate },
    { label: isQuote ? 'Réf. Devis :' : 'Réf. Facture :', value: liveDoc.id },
    { label: 'Code Client :', value: liveDoc.customerId || '—' },
    { label: 'Mode :', value: deliveryMode },
  ];

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sélecteur de cachet numérique si facture */}
      {!isQuote && (
        <div className="hidden lg:flex items-center gap-1 bg-white/10 border border-white/15 rounded-lg p-1 whitespace-nowrap shrink-0">
          <span className="flex items-center gap-1 px-2 text-[10.5px] font-semibold text-emerald-300 uppercase tracking-wider">
            <Stamp className="w-3.5 h-3.5 shrink-0" />
            Cachet BL :
          </span>
          {INVOICE_STAMP_OPTIONS.filter((o) => o.id !== 'aucun').map((opt) => {
            const isSelected = activeStamp === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => updateInvoiceStamp(liveDoc.id, opt.id)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Toggle afficher/masquer les prix sur le BL */}
      <button
        onClick={() => setShowPrices(!showPrices)}
        className="h-9 px-3 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        title="Afficher ou masquer les prix sur le bordereau de livraison"
      >
        {showPrices ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span>{showPrices ? 'Masquer prix' : 'Afficher prix'}</span>
      </button>

      {onSwitchToInvoice && !isQuote && (
        <button
          onClick={() => onSwitchToInvoice(liveDoc)}
          className="h-9 px-3 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Voir Facture</span>
        </button>
      )}

      {onSwitchToReceipt && !isQuote && (
        <button
          onClick={() => onSwitchToReceipt(liveDoc)}
          className="h-9 px-3 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/30 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Reçu de paiement</span>
        </button>
      )}
    </div>
  );

  return (
    <DocumentShell
      title="Bordereau de livraison (BL)"
      reference={blNumber}
      actions={actions}
      onClose={onClose}
    >
      <DocHeader
        company={company}
        docTitle="BORDEREAU DE LIVRAISON"
        docNumber={blNumber}
        accent={accent}
        meta={meta}
      />

      <DocParties
        company={company}
        customer={customer}
        fallbackName={liveDoc.customerName}
        recipientLabel="Livré à (Destinataire & Adresse de livraison)"
      />

      {/* Bandeau logistique de livraison */}
      <div className="mt-4 grid grid-cols-4 border border-slate-300 bg-slate-50/80 text-[9.5px] divide-x divide-slate-300">
        <div className="px-2.5 py-1.5">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            Document de référence
          </div>
          <div className="font-mono font-bold text-slate-800 mt-0.5">{liveDoc.id}</div>
        </div>
        <div className="px-2.5 py-1.5">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            Lieu de livraison
          </div>
          <div className="font-semibold text-slate-800 truncate mt-0.5">
            {customer?.city || 'Dakar'}, {customer?.country || 'Sénégal'}
          </div>
        </div>
        <div className="px-2.5 py-1.5">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            Contact Réceptionnaire
          </div>
          <div className="font-semibold text-slate-800 truncate mt-0.5">
            {primaryContact
              ? `${primaryContact.name} (${primaryContact.phone || customer?.phone || ''})`
              : customer?.phone || 'Service Réception'}
          </div>
        </div>
        <div className="px-2.5 py-1.5">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            Total colis / unités
          </div>
          <div className="font-mono font-bold text-emerald-800 mt-0.5">
            {totalUnits} article(s) • {items.length} réf.
          </div>
        </div>
      </div>

      {/* Tableau des articles livrés */}
      <table className="w-full mt-4 text-[9.5px] border border-slate-300">
        <thead>
          <tr
            className="text-white text-[8.5px] uppercase tracking-wider"
            style={{ backgroundColor: accent }}
          >
            <th className="py-1.5 px-2 text-center font-semibold w-[6%]">N°</th>
            <th className="py-1.5 px-2 text-left font-semibold w-[16%]">Référence</th>
            <th className="py-1.5 px-2 text-left font-semibold">
              Désignation des Articles / Prestations
            </th>
            <th className="py-1.5 px-2 text-center font-semibold w-[10%]">Unité</th>
            <th className="py-1.5 px-2 text-center font-semibold w-[11%]">Qté Cmd.</th>
            <th className="py-1.5 px-2 text-center font-semibold w-[11%]">Qté Livrée</th>
            {showPrices ? (
              <th className="py-1.5 px-2 text-right font-semibold w-[16%]">Total HT</th>
            ) : (
              <th className="py-1.5 px-2 text-center font-semibold w-[16%]">Contrôle</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.quantity ?? item.qty) || 0;
            return (
              <tr
                key={item.id || idx}
                className={`avoid-break border-b border-slate-200 ${
                  idx % 2 ? 'bg-slate-50/70' : ''
                }`}
              >
                <td className="py-2 px-2 text-center font-mono text-slate-500">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="py-2 px-2 font-mono font-semibold text-slate-700">
                  {item.reference || `ART-0${idx + 1}`}
                </td>
                <td className="py-2 px-2">
                  <div className="font-semibold text-slate-900">{item.description || item.name}</div>
                </td>
                <td className="py-2 px-2 text-center text-slate-600">{item.unit || 'unité'}</td>
                <td className="py-2 px-2 text-center font-mono text-slate-700">{qty}</td>
                <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-emerald-50/40">
                  {qty}
                </td>
                {showPrices ? (
                  <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                    {fmt(item.totalHT)}
                  </td>
                ) : (
                  <td className="py-2 px-2 text-center font-mono text-[9px] text-emerald-700 font-semibold">
                    ☑ Conforme
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
            <td colSpan={4} className="py-1.5 px-2.5 text-right uppercase text-[9px]">
              Total général des quantités livrées :
            </td>
            <td className="py-1.5 px-2 text-center font-mono">{totalUnits}</td>
            <td className="py-1.5 px-2 text-center font-mono text-emerald-800">{totalUnits}</td>
            <td className="py-1.5 px-2 text-right font-mono">
              {showPrices ? fmt(liveDoc.totalHT) : 'COMPLET'}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Observations éventuelles */}
      <div className="mt-3 text-[9px] text-slate-600 border border-slate-200 bg-slate-50/50 px-3 py-2 rounded-xs">
        <span className="font-semibold text-slate-800">Observations & réserves à la livraison : </span>
        {liveDoc.notes ||
          'Matériel vérifié et testé avant expédition. Le client reconnaît avoir reçu les articles ci-dessus en parfait état de fonctionnement.'}
      </div>

      {/* Double Cadre Officiel de Décharge : Expéditeur (avec Cachet Numérique) & Réceptionnaire (Client) */}
      <div className="avoid-break grid grid-cols-2 gap-5 mt-5">
        {/* Colonne Gauche : Visa Expéditeur + Cachet Numérique */}
        <div className="border border-slate-300 rounded-xs p-3 min-h-[42mm] flex flex-col justify-between">
          <div>
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              Visa de l’Expéditeur / Service Logistique
            </div>
            <div className="text-[9px] text-slate-600 mt-1">
              Expédié par : <span className="font-semibold text-slate-800">{company.name}</span>
            </div>
          </div>

          <div className="my-1 flex justify-center">
            <DigitalInvoiceStamp invoice={stampForBl} company={company} />
          </div>
        </div>

        {/* Colonne Droite : Accusé de Réception du Client */}
        <div className="border border-slate-300 rounded-xs p-3 min-h-[42mm] flex flex-col justify-between bg-slate-50/30">
          <div>
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              Accusé de Réception du Client (Destinataire)
            </div>
            <div className="text-[8.5px] italic text-slate-500 mt-1">
              « Marchandises reçues conformes en quantité et en qualité. »
            </div>
            <div className="mt-2 space-y-1.5 text-[9px] text-slate-700">
              <div>
                Reçu le : <span className="font-mono">....../....../2026</span> à{' '}
                <span className="font-mono">......h......</span>
              </div>
              <div>Nom & qualité du réceptionnaire : ....................................................</div>
              <div>N° CNI / Téléphone : ........................................................................</div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Signature du client</span>
            <span>Cachet commercial du destinataire</span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-[8px] italic text-slate-400 text-center">
        Clause de réserve de propriété (Acte Uniforme OHADA) : Les marchandises livrées demeurent la propriété de{' '}
        {company.name} jusqu’au paiement intégral du prix en principal et accessoires.
      </div>

      <DocFooter company={company} />
    </DocumentShell>
  );
}
