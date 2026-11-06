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
  TotalsCard,
  DocSectionTitle,
  DocFooter,
  DOC_ACCENTS,
} from '../common/DocumentSheet';

const ACCENT = DOC_ACCENTS.devis;

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
          { label: 'Statut :', value: statusLabel, highlight: true },
        ]}
      />

      <DocParties company={company} customer={customer} fallbackName={quote.customerName} recipientLabel="Adressé à" accent={ACCENT} />

      <DocItemsTable items={quote.items} currencyFmt={fmt} accent={ACCENT} />

      {/* Notes + Totaux */}
      <div className="avoid-break grid grid-cols-[1fr_70mm] gap-5 mt-4 items-start">
        <div className="text-[9.5px] text-[#475569] space-y-3 pt-1">
          {quote.terms && (
            <div>
              <DocSectionTitle accent={ACCENT}>Modalités & conditions</DocSectionTitle>
              <div className="leading-[1.6]">{quote.terms}</div>
            </div>
          )}
          {quote.notes && (
            <div>
              <DocSectionTitle accent={ACCENT}>Notes</DocSectionTitle>
              <div className="whitespace-pre-wrap leading-[1.6]">{quote.notes}</div>
            </div>
          )}
          {company.quoteNotes && <div className="italic text-[#64748B]">{company.quoteNotes}</div>}
        </div>

        <TotalsCard>
          <TotalRow label="Total brut HT" value={fmt((quote.totalHT || 0) + (quote.totalDiscount || 0))} />
          {quote.totalDiscount > 0 && <TotalRow label="Remises" value={`- ${fmt(quote.totalDiscount)}`} />}
          <TotalRow label="Net HT" value={fmt(quote.totalHT)} className="font-semibold !text-[#0F172A]" />
          <TotalRow label="TVA 18 %" value={fmt(quote.totalVAT)} />
          <TotalRow label="Total TTC" value={fmt(quote.totalTTC)} strong accent={ACCENT} />
        </TotalsCard>
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
      <div className="avoid-break grid grid-cols-2 gap-3 mt-4 text-[9px]">
        <div className="border border-[#E4E7EB] h-[27mm] px-3.5 py-2.5 flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#1E3A5F]">Pour {company.name || 'la société'}</span>
          <span className="italic text-[#94A3B8]">Signature & cachet</span>
        </div>
        <div className="h-[27mm] px-3.5 py-2.5 flex flex-col justify-between border border-dashed border-[#94A3B8] bg-[#F8FAFC]">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#1E3A5F]">Bon pour accord — le client</span>
          <span className="italic text-[#64748B]">Date, signature et mention « Bon pour accord »</span>
        </div>
      </div>

      <DocFooter company={company} />
    </DocumentShell>
  );
}
