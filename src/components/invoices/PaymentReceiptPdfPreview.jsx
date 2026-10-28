import React, { useState } from 'react';
import { CreditCard, FileText, Stamp, Truck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  formatCurrency,
  formatDate,
  numberToFrenchWords,
} from '../../utils/formatters';
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

const PAYMENT_METHOD_LABELS = {
  wave: 'Wave Sénégal (Mobile Money)',
  orange_money: 'Orange Money Sénégal',
  free_money: 'Free Money / Mixx',
  virement: 'Virement Bancaire (CBAO / Ecobank)',
  cheque: 'Chèque Bancaire barré',
  especes: 'Espèces (Caisse FCFA)',
  carte: 'Carte Bancaire',
};

export function PaymentReceiptPdfPreview({
  isOpen,
  onClose,
  invoice,
  onOpenPaymentModal,
  onSwitchToInvoice,
  onSwitchToDeliveryNote,
}) {
  const {
    settings,
    customers,
    invoices,
    updateInvoiceStamp,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [selectedPaymentId, setSelectedPaymentId] = useState('latest');

  if (!isOpen || !invoice) return null;

  const liveInvoice = invoices.find((i) => i.id === invoice.id) || invoice;
  const company = settings?.company || {};
  const customer = customers?.find((c) => c.id === liveInvoice.customerId);

  const payments = liveInvoice.payments || [];
  const selectedPayment =
    selectedPaymentId === 'all'
      ? null
      : selectedPaymentId === 'latest'
      ? payments[payments.length - 1] || null
      : payments.find((p) => p.id === selectedPaymentId) || payments[payments.length - 1] || null;

  const receiptAmount = selectedPayment
    ? Number(selectedPayment.amount) || 0
    : Number(liveInvoice.paidAmount) || 0;

  const receiptDate = formatDate(
    selectedPayment?.date || liveInvoice.date
  );
  const paymentMethodKey = (selectedPayment?.method || 'wave').toLowerCase();
  const paymentMethodLabel =
    PAYMENT_METHOD_LABELS[paymentMethodKey] ||
    (selectedPayment?.method || 'Règlement comptant').toUpperCase();
  const paymentReference = selectedPayment?.reference || `TX-${liveInvoice.id}`;

  const receiptNumber = String(liveInvoice.id || '0001').replace(/^(FAC|AVO)-/, 'REC-');
  const accent = '#047857'; // Emerald OHADA
  const fmt = (v) => formatCurrency(v, currencySymbol, currencyPosition);
  const amountInWords = `${numberToFrenchWords(receiptAmount)} Francs CFA`;

  const remaining = Math.max(
    0,
    (Number(liveInvoice.totalTTC) || 0) - (Number(liveInvoice.paidAmount) || 0)
  );

  // Cachet numérique sur le reçu (par défaut : paye ou paye_livre)
  const stampForReceipt = {
    ...liveInvoice,
    stampType:
      liveInvoice.stampType && liveInvoice.stampType !== 'aucun' && liveInvoice.stampType !== 'livre_non_paye'
        ? liveInvoice.stampType
        : remaining <= 0
        ? 'paye_livre'
        : 'paye',
  };
  const activeStamp = getEffectiveInvoiceStamp(stampForReceipt);

  const meta = [
    { label: 'Date du reçu :', value: receiptDate },
    { label: 'Facture réglée :', value: liveInvoice.id },
    { label: 'Mode :', value: (selectedPayment?.method || 'Wave / Banque').toUpperCase() },
    { label: 'Réf. Transaction :', value: paymentReference },
  ];

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {payments.length > 1 && (
        <select
          value={selectedPaymentId}
          onChange={(e) => setSelectedPaymentId(e.target.value)}
          className="h-9 px-2.5 text-xs font-semibold bg-white/10 text-white border border-white/15 rounded-lg focus:outline-none"
        >
          <option value="latest" className="text-slate-900">
            Dernier versement ({fmt(payments[payments.length - 1]?.amount)})
          </option>
          <option value="all" className="text-slate-900">
            Cumul de tous les versements ({fmt(liveInvoice.paidAmount)})
          </option>
          {payments.map((p, idx) => (
            <option key={p.id || idx} value={p.id} className="text-slate-900">
              Versement #{idx + 1} du {formatDate(p.date)} ({fmt(p.amount)})
            </option>
          ))}
        </select>
      )}

      {/* Sélecteur de cachet numérique */}
      <div className="hidden lg:flex items-center gap-1 bg-white/10 border border-white/15 rounded-lg p-1 whitespace-nowrap shrink-0">
        <span className="flex items-center gap-1 px-2 text-[10.5px] font-semibold text-emerald-300 uppercase tracking-wider">
          <Stamp className="w-3.5 h-3.5 shrink-0" />
          Cachet :
        </span>
        {INVOICE_STAMP_OPTIONS.filter((o) =>
          ['paye', 'paye_livre', 'paye_non_livre'].includes(o.id)
        ).map((opt) => {
          const isSelected = activeStamp === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => updateInvoiceStamp(liveInvoice.id, opt.id)}
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

      {remaining > 0 && onOpenPaymentModal && (
        <button
          onClick={() => {
            onClose();
            onOpenPaymentModal(liveInvoice);
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Nouvel encaissement</span>
        </button>
      )}

      {onSwitchToInvoice && (
        <button
          onClick={() => onSwitchToInvoice(liveInvoice)}
          className="h-9 px-3 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Voir Facture</span>
        </button>
      )}

      {onSwitchToDeliveryNote && (
        <button
          onClick={() => onSwitchToDeliveryNote(liveInvoice)}
          className="h-9 px-3 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Bordereau BL</span>
        </button>
      )}
    </div>
  );

  return (
    <DocumentShell
      title="Reçu de paiement officiel"
      reference={receiptNumber}
      actions={actions}
      onClose={onClose}
    >
      <DocHeader
        company={company}
        docTitle="REÇU DE PAIEMENT"
        docNumber={receiptNumber}
        accent={accent}
        meta={meta}
      />

      <DocParties
        company={company}
        customer={customer}
        fallbackName={liveInvoice.customerName}
        recipientLabel="Reçu de (Client payeur)"
      />

      {/* Encadré Principal : Attestation de Quittance & Montant en chiffres / lettres */}
      <div className="mt-5 border-2 border-emerald-700/80 rounded-xs overflow-hidden">
        <div
          className="px-4 py-2 text-white flex items-center justify-between"
          style={{ backgroundColor: accent }}
        >
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em]">
            Quittance d’encaissement • Norme Comptable OHADA
          </span>
          <span className="font-mono text-[10.5px] font-semibold">
            {remaining <= 0 ? 'RÈGLEMENT POUR SOLDE DE TOUT COMPTE' : 'REÇU D’ACOMPTE / RÈGLEMENT PARTIEL'}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/30 space-y-3">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-emerald-200/80">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Montant encaissé (en chiffres)
              </div>
              <div className="text-[9.5px] text-slate-600 mt-0.5">
                Encaissé le <span className="font-semibold text-slate-900">{receiptDate}</span> par{' '}
                <span className="font-semibold text-slate-900">{paymentMethodLabel}</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xs bg-white border-2 border-emerald-700 font-mono text-[18px] font-extrabold text-emerald-800 shadow-2xs">
              {fmt(receiptAmount)}
            </div>
          </div>

          <div>
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Arrêté le présent reçu à la somme de (en toutes lettres) :
            </div>
            <div className="mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xs font-semibold text-[11px] text-slate-900 italic">
              « {amountInWords} »
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 text-[9.5px]">
            <div className="bg-white p-2 border border-slate-200 rounded-xs">
              <div className="text-[8px] font-semibold uppercase text-slate-400">Facture imputée</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {liveInvoice.id} (du {formatDate(liveInvoice.date)})
              </div>
            </div>
            <div className="bg-white p-2 border border-slate-200 rounded-xs">
              <div className="text-[8px] font-semibold uppercase text-slate-400">Moyen de paiement</div>
              <div className="font-semibold text-slate-900 mt-0.5">{paymentMethodLabel}</div>
            </div>
            <div className="bg-white p-2 border border-slate-200 rounded-xs">
              <div className="text-[8px] font-semibold uppercase text-slate-400">
                N° Pièce / Réf. Transaction
              </div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">{paymentReference}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Détail des prestations couvertes par la facture */}
      <div className="mt-4">
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Objet de la facturation ({liveInvoice.id})
        </div>
        <table className="w-full text-[9.5px] border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-[8.5px] uppercase text-slate-600">
              <th className="py-1.5 px-2.5 text-left font-semibold">Désignation des prestations / articles</th>
              <th className="py-1.5 px-2 text-center font-semibold w-[14%]">Quantité</th>
              <th className="py-1.5 px-2.5 text-right font-semibold w-[22%]">Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            {(liveInvoice.items || []).map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-slate-200">
                <td className="py-1.5 px-2.5 font-medium text-slate-800">
                  {item.description || item.name}
                </td>
                <td className="py-1.5 px-2 text-center font-mono text-slate-600">
                  {item.quantity ?? item.qty} {item.unit || ''}
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-900">
                  {fmt(item.totalTTC || Math.round((item.totalHT || 0) * (1 + (item.vatRate ?? 18) / 100)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Situation Financière de la Facture & Cachet Numérique */}
      <div className="avoid-break grid grid-cols-2 gap-6 mt-5 items-start">
        {/* Colonne Gauche : Situation du Compte Client sur la Facture */}
        <div className="border border-slate-300 rounded-xs overflow-hidden text-[10px]">
          <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider text-[8.5px] text-slate-700 border-b border-slate-300">
            Situation comptable sur la facture {liveInvoice.id}
          </div>
          <div className="divide-y divide-slate-200">
            <div className="flex justify-between px-3 py-1.5">
              <span className="text-slate-600">Montant Total TTC de la facture</span>
              <span className="font-mono font-semibold text-slate-900">{fmt(liveInvoice.totalTTC)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5 bg-emerald-50/50">
              <span className="font-semibold text-emerald-800">Montant du présent reçu</span>
              <span className="font-mono font-bold text-emerald-700">{fmt(receiptAmount)}</span>
            </div>
            <div className="flex justify-between px-3 py-1.5">
              <span className="text-slate-600">Total cumulé encaissé</span>
              <span className="font-mono font-semibold text-emerald-700">{fmt(liveInvoice.paidAmount)}</span>
            </div>
            <div
              className={`flex justify-between px-3 py-2 font-bold text-[11px] ${
                remaining <= 0
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-50 text-amber-900 border-t border-amber-300'
              }`}
            >
              <span>RESTE DÛ APRÈS CE PAIEMENT</span>
              <span className="font-mono">{fmt(remaining)}</span>
            </div>
          </div>

          {selectedPayment?.note && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-600">
              <span className="font-semibold text-slate-800">Note de caisse : </span>
              {selectedPayment.note}
            </div>
          )}
        </div>

        {/* Colonne Droite : Cachet Numérique & Visa Caisse / Comptabilité */}
        <div className="border border-slate-300 rounded-xs p-3 min-h-[42mm] flex flex-col items-center justify-between">
          <div className="w-full text-center border-b border-slate-200 pb-1">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Pour Acquit • Cachet Numérique & Visa Comptabilité
            </span>
          </div>

          <div className="my-2">
            <DigitalInvoiceStamp invoice={stampForReceipt} company={company} />
          </div>

          <div className="text-[8px] text-slate-400 text-center">
            Quittance délivrée à {company.city || 'Dakar'}, le {receiptDate} pour valoir ce que de droit.
          </div>
        </div>
      </div>

      <DocFooter company={company} />
    </DocumentShell>
  );
}
