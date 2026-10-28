import React from 'react';
import { CreditCard, FileCheck2, Send, Stamp, Truck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate, STATUS_CONFIG } from '../../utils/formatters';
import { PaymentQrCodes } from '../common/PaymentQrCodes';
import {
  DigitalInvoiceStamp,
  INVOICE_STAMP_OPTIONS,
  getEffectiveInvoiceStamp,
} from './DigitalInvoiceStamp';
import {
  DocumentShell,
  DocHeader,
  DocParties,
  DocItemsTable,
  TotalRow,
  DocFooter,
} from '../common/DocumentSheet';

export function InvoicePdfPreview({
  isOpen,
  onClose,
  invoice,
  onOpenPaymentModal,
  onOpenSendModal,
  onOpenDeliveryNote,
  onOpenPaymentReceipt,
}) {
  const {
    settings,
    customers,
    invoices,
    updateInvoiceStamp,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  if (!isOpen || !invoice) return null;

  // Always use the freshest invoice from CrmContext so stamp changes reflect immediately
  const liveInvoice = invoices.find((i) => i.id === invoice.id) || invoice;

  const company = settings?.company || {};
  const customer = customers?.find((c) => c.id === liveInvoice.customerId);
  const isCreditNote = liveInvoice.type === 'avoir';
  const accent = isCreditNote ? '#9f1239' : '#065f46';
  const fmt = (v) => formatCurrency(v, currencySymbol, currencyPosition);
  const statusLabel = STATUS_CONFIG[liveInvoice.status]?.label || liveInvoice.status;
  const activeStamp = getEffectiveInvoiceStamp(liveInvoice);

  const meta = [
    { label: "Date d'émission :", value: formatDate(liveInvoice.date) },
    { label: 'Échéance :', value: formatDate(liveInvoice.dueDate) },
  ];
  if (liveInvoice.quoteId) meta.push({ label: 'Réf. devis :', value: liveInvoice.quoteId });
  if (liveInvoice.originalInvoiceId)
    meta.push({ label: 'Facture d’origine :', value: liveInvoice.originalInvoiceId });
  meta.push({ label: 'Statut :', value: statusLabel });

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Interactive Digital Stamp Selector in Toolbar */}
      {!isCreditNote && (
        <div className="hidden md:flex items-center gap-1 bg-white/10 border border-white/15 rounded-lg p-1 mr-1 whitespace-nowrap shrink-0">
          <span className="flex items-center gap-1 px-2 text-[10.5px] font-semibold text-emerald-300 uppercase tracking-wider whitespace-nowrap shrink-0">
            <Stamp className="w-3.5 h-3.5 shrink-0" />
            Cachet :
          </span>
          {INVOICE_STAMP_OPTIONS.map((opt) => {
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
                title={`Apposer le cachet numérique : ${opt.shortLabel}`}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {!isCreditNote && onOpenDeliveryNote && (
        <button
          onClick={() => onOpenDeliveryNote(liveInvoice)}
          className="h-9 px-3 text-xs font-semibold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Générer et imprimer le Bordereau de Livraison (BL)"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bordereau BL</span>
        </button>
      )}

      {!isCreditNote && onOpenPaymentReceipt && (
        <button
          onClick={() => onOpenPaymentReceipt(liveInvoice)}
          className="h-9 px-3 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/30 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Générer et imprimer le Reçu de Paiement (Quittance)"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reçu de paiement</span>
        </button>
      )}

      {onOpenSendModal && (
        <button
          onClick={() => {
            onClose();
            onOpenSendModal(liveInvoice);
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1fb457] rounded-lg transition flex items-center gap-1.5"
          title="Envoyer par WhatsApp ou E-mail"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      )}
      {!isCreditNote && liveInvoice.status !== 'payee' && onOpenPaymentModal && (
        <button
          onClick={() => {
            onClose();
            onOpenPaymentModal(liveInvoice);
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition flex items-center gap-1.5"
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Encaisser</span>
        </button>
      )}
    </div>
  );

  return (
    <DocumentShell
      title={isCreditNote ? 'Aperçu de l’avoir' : 'Facture conforme OHADA'}
      reference={liveInvoice.id}
      actions={actions}
      onClose={onClose}
    >
      <DocHeader
        company={company}
        docTitle={isCreditNote ? 'AVOIR' : 'FACTURE'}
        docNumber={liveInvoice.id}
        accent={accent}
        meta={meta}
      />

      <DocParties
        company={company}
        customer={customer}
        fallbackName={liveInvoice.customerName}
        recipientLabel="Facturé à"
      />

      <DocItemsTable items={liveInvoice.items} currencyFmt={fmt} accent={accent} />

      {/* Règlements + Totaux + Cachet Numérique */}
      <div className="avoid-break grid grid-cols-[1fr_68mm] gap-5 mt-4 items-start">
        <div className="text-[9.5px] text-slate-600 space-y-2.5">
          <div>
            <div className="font-semibold text-slate-800 mb-0.5">Règlements reçus</div>
            {liveInvoice.payments && liveInvoice.payments.length > 0 ? (
              <table className="w-full">
                <tbody>
                  {liveInvoice.payments.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-0.5">{formatDate(p.date)}</td>
                      <td className="py-0.5 uppercase font-semibold">{p.method}</td>
                      <td className="py-0.5 text-slate-400 font-mono">{p.reference || ''}</td>
                      <td className="py-0.5 text-right font-mono font-semibold text-emerald-700">
                        {fmt(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="italic text-slate-400">Aucun règlement enregistré à ce jour.</div>
            )}
          </div>

          {liveInvoice.terms && (
            <div>
              <div className="font-semibold text-slate-800">Conditions de paiement</div>
              <div>{liveInvoice.terms}</div>
            </div>
          )}

          {liveInvoice.notes && (
            <div>
              <div className="font-semibold text-slate-800">Notes & Observations</div>
              <div className="whitespace-pre-wrap">{liveInvoice.notes}</div>
            </div>
          )}
        </div>

        {/* Colonne de droite : Tableau des totaux + Cachet Numérique Officiel */}
        <div className="space-y-4 flex flex-col items-end">
          <div className="w-full border border-slate-300 text-[10px]">
            <TotalRow label="Total net HT" value={fmt(liveInvoice.totalHT)} />
            <TotalRow label="TVA (18 %)" value={fmt(liveInvoice.totalVAT)} />
            <TotalRow
              label="Total TTC"
              value={fmt(liveInvoice.totalTTC)}
              className="border-t border-slate-200 font-semibold"
            />
            {!isCreditNote && (
              <TotalRow
                label="Déjà encaissé"
                value={`- ${fmt(liveInvoice.paidAmount)}`}
                className="text-emerald-700"
              />
            )}
            <TotalRow
              label={isCreditNote ? 'MONTANT DE L’AVOIR' : 'NET À PAYER'}
              value={fmt(isCreditNote ? liveInvoice.totalTTC : liveInvoice.remainingAmount)}
              strong
              accent={accent}
            />
          </div>

          {/* Zone d'apposition du Cachet Numérique Officiel */}
          {!isCreditNote && activeStamp && activeStamp !== 'aucun' && (
            <div className="pt-1 pr-2 flex flex-col items-center">
              <div className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Cachet numérique & Visa de l’entreprise
              </div>
              <DigitalInvoiceStamp invoice={liveInvoice} company={company} />
            </div>
          )}
        </div>
      </div>

      {/* QR Codes Wave & Orange Money */}
      {!isCreditNote && liveInvoice.remainingAmount > 0 && (
        <div className="avoid-break mt-4">
          <PaymentQrCodes
            documentType="facture"
            documentId={liveInvoice.id}
            amount={liveInvoice.remainingAmount}
            company={company}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      {company.invoiceNotes && (
        <div className="mt-3 text-[9px] italic text-slate-500">{company.invoiceNotes}</div>
      )}

      <DocFooter company={company} />
    </DocumentShell>
  );
}
