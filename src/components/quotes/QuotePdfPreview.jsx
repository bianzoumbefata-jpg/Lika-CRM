import React from 'react';
import { CheckCircle, Send, Copy } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate, STATUS_CONFIG } from '../../utils/formatters';
import { PaymentQrCodes } from '../common/PaymentQrCodes';
import {
  DocumentShell,
  DocHeader,
  DocParties,
  DocItemsTable,
  TotalRow,
  DocFooter,
} from '../common/DocumentSheet';

const ACCENT = '#1e3a8a';

export function QuotePdfPreview({ isOpen, onClose, quote, onConvertToInvoice, onOpenSendModal, onOpenCloneModal }) {
  const { settings, customers, currencySymbol, currencyPosition } = useCrm();

  if (!isOpen || !quote) return null;

  const company = settings?.company || {};
  const customer = customers?.find((c) => c.id === quote.customerId);
  const fmt = (v) => formatCurrency(v, currencySymbol, currencyPosition);
  const statusLabel = STATUS_CONFIG[quote.status]?.label || quote.status;

  const actions = (
    <>
      {onOpenCloneModal && (
        <button
          onClick={() => {
            onClose();
            onOpenCloneModal(quote);
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition flex items-center gap-1.5"
          title="Cloner ce devis et l'attribuer à un autre client"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cloner vers un autre client</span>
        </button>
      )}
      {onOpenSendModal && (
        <button
          onClick={() => {
            onClose();
            onOpenSendModal(quote);
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1fb457] rounded-lg transition flex items-center gap-1.5"
          title="Envoyer par WhatsApp ou E-mail"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      )}
      {quote.status === 'accepte' && !quote.convertedToInvoiceId && onConvertToInvoice && (
        <button
          onClick={() => {
            onConvertToInvoice(quote.id);
            onClose();
          }}
          className="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition flex items-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Convertir en facture</span>
        </button>
      )}
    </>
  );

  return (
    <DocumentShell title="Aperçu du devis" reference={quote.id} actions={actions} onClose={onClose}>
      <DocHeader
        company={company}
        docTitle="DEVIS"
        docNumber={quote.id}
        accent={ACCENT}
        meta={[
          { label: "Date d'émission :", value: formatDate(quote.date) },
          { label: 'Valable jusqu’au :', value: formatDate(quote.validUntil) },
          { label: 'Statut :', value: statusLabel },
        ]}
      />

      <DocParties company={company} customer={customer} fallbackName={quote.customerName} recipientLabel="Adressé à" />

      <DocItemsTable items={quote.items} currencyFmt={fmt} accent={ACCENT} />

      {/* Notes + Totaux */}
      <div className="avoid-break grid grid-cols-[1fr_68mm] gap-5 mt-4">
        <div className="text-[9.5px] text-slate-600 space-y-2">
          {quote.terms && (
            <div>
              <div className="font-semibold text-slate-800">Modalités & conditions</div>
              <div>{quote.terms}</div>
            </div>
          )}
          {quote.notes && (
            <div>
              <div className="font-semibold text-slate-800">Notes</div>
              <div className="whitespace-pre-wrap">{quote.notes}</div>
            </div>
          )}
          {company.quoteNotes && <div className="italic text-slate-500">{company.quoteNotes}</div>}
        </div>

        <div className="border border-slate-300 text-[10px]">
          <TotalRow label="Total brut HT" value={fmt((quote.totalHT || 0) + (quote.totalDiscount || 0))} />
          {quote.totalDiscount > 0 && (
            <TotalRow label="Remises" value={`- ${fmt(quote.totalDiscount)}`} className="text-emerald-700" />
          )}
          <TotalRow label="Net HT" value={fmt(quote.totalHT)} className="border-t border-slate-200 font-semibold" />
          <TotalRow label="TVA 18 %" value={fmt(quote.totalVAT)} />
          <TotalRow label="TOTAL TTC" value={fmt(quote.totalTTC)} strong accent={ACCENT} />
        </div>
      </div>

      {/* QR Codes Wave & Orange Money */}
      <div className="avoid-break mt-4">
        <PaymentQrCodes
          documentType="devis"
          documentId={quote.id}
          amount={quote.totalTTC}
          company={company}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Signatures */}
      <div className="avoid-break grid grid-cols-2 gap-5 mt-4 text-[9px]">
        <div className="border border-slate-300 rounded-sm h-[26mm] p-2 flex flex-col justify-between">
          <span className="font-semibold uppercase tracking-wider text-slate-500">Pour {company.name || 'la société'}</span>
          <span className="italic text-slate-400">Signature & cachet</span>
        </div>
        <div className="border border-slate-300 rounded-sm h-[26mm] p-2 flex flex-col justify-between">
          <span className="font-semibold uppercase tracking-wider text-slate-500">Bon pour accord — le client</span>
          <span className="italic text-slate-400">Date, signature et mention « Bon pour accord »</span>
        </div>
      </div>

      <DocFooter company={company} />
    </DocumentShell>
  );
}
