import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  CreditCard,
  Mail,
  AlertTriangle,
  FileMinus,
  RotateCw,
  Trash2,
  Send,
  Stamp,
  Truck,
  FileCheck2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import {
  INVOICE_STAMP_OPTIONS,
  getEffectiveInvoiceStamp,
  getStampConfig,
} from './DigitalInvoiceStamp';
import { PaymentModal } from './PaymentModal';
import { ReminderModal } from './ReminderModal';
import { InvoicePdfPreview } from './InvoicePdfPreview';
import { DeliveryNotePdfPreview } from './DeliveryNotePdfPreview';
import { PaymentReceiptPdfPreview } from './PaymentReceiptPdfPreview';
import { InvoiceEditorModal } from './InvoiceEditorModal';
import { SendDocumentModal } from '../common/SendDocumentModal';
import { exportToCSV } from '../../utils/csvExporter';

export function InvoicesView() {
  const {
    invoices,
    deleteInvoice,
    createCreditNote,
    updateInvoiceStamp,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [reminderModalInvoice, setReminderModalInvoice] = useState(null);
  const [pdfPreviewInvoice, setPdfPreviewInvoice] = useState(null);
  const [deliveryNoteInvoice, setDeliveryNoteInvoice] = useState(null);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [invoiceToSend, setInvoiceToSend] = useState(null);

  // Financial Stats
  const regularInvoices = invoices.filter((i) => i.type === 'facture');
  const totalInvoiced = regularInvoices.reduce((sum, i) => sum + (Number(i.totalTTC) || 0), 0);
  const totalPaid = regularInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalUnpaid = regularInvoices.reduce((sum, i) => sum + (Number(i.remainingAmount) || 0), 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'en_retard');
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + (Number(i.remainingAmount) || 0), 0);

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const stamp = getEffectiveInvoiceStamp(inv);
    if (activeTab === 'en_retard' && inv.status !== 'en_retard') return false;
    if (activeTab === 'partiellement_payee' && inv.status !== 'partiellement_payee') return false;
    if (activeTab === 'payee' && inv.status !== 'payee') return false;
    if (activeTab === 'avoir' && inv.type !== 'avoir') return false;
    if (activeTab === 'recurring' && !inv.isRecurring) return false;
    if (
      ['paye', 'paye_livre', 'livre_non_paye', 'paye_non_livre'].includes(activeTab) &&
      stamp !== activeTab
    ) {
      return false;
    }

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      inv.id.toLowerCase().includes(s) ||
      inv.customerName.toLowerCase().includes(s) ||
      inv.notes?.toLowerCase().includes(s)
    );
  });

  // Export Sales Journal (Journal des ventes comptable)
  const handleExportSalesJournal = () => {
    const rows = invoices.map((inv) => ({
      Type_Piece: inv.type === 'avoir' ? 'AVOIR' : 'FACTURE',
      Numero_Piece: inv.id,
      Ref_Devis: inv.quoteId || '',
      Date_Piece: inv.date,
      Date_Echeance: inv.dueDate,
      Code_Client: inv.customerId,
      Nom_Client: inv.customerName,
      Montant_HT: inv.totalHT,
      Montant_TVA: inv.totalVAT,
      Montant_TTC: inv.totalTTC,
      Montant_Encaisse: inv.paidAmount,
      Solde_Restant_Du: inv.remainingAmount,
      Statut_Reglement: inv.status,
      Est_Recurrente: inv.isRecurring ? 'OUI' : 'NON',
    }));
    exportToCSV(`openflex-crm-journal-des-ventes-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              Facturation, Encaissements & Recouvrement
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
              {invoices.length} pièces
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Factures TVA 18%, avoirs, encaissements Wave / Orange Money / Virement et relances d’échéances.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportSalesJournal} className="pro-btn-secondary">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Journal des ventes (CSV)</span>
          </button>

          <button
            onClick={() => {
              setInvoiceToEdit(null);
              setEditorOpen(true);
            }}
            className="pro-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle facture</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Total facturé TTC
          </span>
          <div className="text-[20px] font-bold text-slate-900 tabular-nums mt-1.5">
            {formatCurrency(totalInvoiced, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Chiffre d’affaires brut émis</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Total encaissé
          </span>
          <div className="text-[20px] font-bold text-emerald-600 tabular-nums mt-1.5">
            {formatCurrency(totalPaid, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Règlements reçus (Wave, OM, Banque)</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Solde restant à encaisser
          </span>
          <div className="text-[20px] font-bold text-amber-600 tabular-nums mt-1.5">
            {formatCurrency(totalUnpaid, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Encours clients ouvert</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Créances échues (En retard)
          </span>
          <div className="text-[20px] font-bold text-rose-600 tabular-nums mt-1.5">
            {formatCurrency(overdueTotal, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">
            {overdueInvoices.length} facture(s) à relancer
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="pro-card p-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[12px] font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Toutes ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('en_retard')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'en_retard' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>En retard ({overdueInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('partiellement_payee')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'partiellement_payee'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Acomptes / Partiel
            </button>
            <button
              onClick={() => setActiveTab('payee')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'payee' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Soldées
            </button>
            <button
              onClick={() => setActiveTab('paye_livre')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'paye_livre' ? 'bg-teal-700 text-white' : 'text-teal-800 bg-teal-50/70 hover:bg-teal-100/80'
              }`}
            >
              <Stamp className="w-3 h-3" />
              <span>Payé & Livré</span>
            </button>
            <button
              onClick={() => setActiveTab('livre_non_paye')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'livre_non_paye' ? 'bg-rose-700 text-white' : 'text-rose-800 bg-rose-50/70 hover:bg-rose-100/80'
              }`}
            >
              <Stamp className="w-3 h-3" />
              <span>Livré Non Payé</span>
            </button>
            <button
              onClick={() => setActiveTab('paye_non_livre')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'paye_non_livre' ? 'bg-blue-700 text-white' : 'text-blue-800 bg-blue-50/70 hover:bg-blue-100/80'
              }`}
            >
              <Stamp className="w-3 h-3" />
              <span>Payé Non Livré</span>
            </button>
            <button
              onClick={() => setActiveTab('avoir')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'avoir' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Avoirs ({invoices.filter((i) => i.type === 'avoir').length})
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'recurring' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>Récurrentes</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par n° de facture, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[12.5px] bg-slate-50/90 border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="pro-card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-[13.5px] font-semibold text-slate-700">Aucune pièce de facturation trouvée</h3>
            <p className="text-[12px] text-slate-400 mt-1">
              Créez une nouvelle facture ou convertissez un devis accepté.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="pro-table-header">
                  <th className="py-3 px-4">Pièce & Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Cachet numérique</th>
                  <th className="py-3 px-4 text-right">Total TTC</th>
                  <th className="py-3 px-4 text-right">Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste dû</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isCreditNote = inv.type === 'avoir';
                  const remaining = Number(inv.remainingAmount) || 0;
                  const canPay = remaining > 0 && !isCreditNote;
                  const activeStamp = getEffectiveInvoiceStamp(inv);
                  const stampCfg = getStampConfig(activeStamp);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/90 transition group cursor-pointer"
                      onClick={() => setPdfPreviewInvoice(inv)}
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition flex items-center gap-1.5 font-mono">
                          <span>{inv.id}</span>
                          {inv.isRecurring && (
                            <span
                              className="p-0.5 rounded bg-brand-50 text-brand-600"
                              title="Abonnement récurrent"
                            >
                              <RotateCw className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">Émise le {formatDate(inv.date)}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{inv.customerName}</div>
                        {inv.quoteId && (
                          <div className="text-[11px] text-slate-400 font-mono">Réf. {inv.quoteId}</div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={
                            inv.status === 'en_retard'
                              ? 'font-semibold text-rose-600'
                              : 'text-slate-600'
                          }
                        >
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={inv.status} size="xs" />
                      </td>

                      {/* Digital Stamp Selector */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCreditNote ? (
                          <span className="text-[11px] text-slate-400">—</span>
                        ) : (
                          <div className="inline-flex items-center">
                            <select
                              value={activeStamp}
                              onChange={(e) => updateInvoiceStamp(inv.id, e.target.value)}
                              className={`text-[11px] font-mono font-bold uppercase tracking-tight px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${stampCfg.badgeClass}`}
                              title="Choisir le cachet numérique à apposer sur la facture"
                            >
                              {INVOICE_STAMP_OPTIONS.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  className="bg-white text-slate-800 font-sans font-semibold"
                                >
                                  {opt.id === 'aucun' ? '○ Aucun cachet' : `★ ${opt.stampTitle}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Total TTC */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(inv.totalTTC, currencySymbol, currencyPosition)}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(inv.paidAmount, currencySymbol, currencyPosition)}
                      </td>

                      {/* Remaining */}
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                        <span className={remaining > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          {formatCurrency(remaining, currencySymbol, currencyPosition)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {canPay && (
                            <button
                              onClick={() => setPaymentModalInvoice(inv)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition border border-emerald-200/80 flex items-center gap-1"
                              title="Enregistrer un règlement"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span className="hidden sm:inline">Encaisser</span>
                            </button>
                          )}

                          {inv.status === 'en_retard' && (
                            <button
                              onClick={() => setReminderModalInvoice(inv)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition border border-rose-200/80 flex items-center gap-1"
                              title="Envoyer une relance"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="hidden sm:inline">Relancer</span>
                            </button>
                          )}

                          <button
                            onClick={() => setInvoiceToSend(inv)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition border border-slate-200/90 flex items-center gap-1"
                            title="Envoyer la facture par WhatsApp ou E-mail"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span className="hidden md:inline">Envoyer</span>
                          </button>

                          {!isCreditNote && (
                            <>
                              <button
                                onClick={() => setDeliveryNoteInvoice(inv)}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition border border-slate-200/90 flex items-center gap-1"
                                title="Générer et imprimer le Bordereau de Livraison (BL)"
                              >
                                <Truck className="w-3 h-3 text-brand-600" />
                                <span className="hidden xl:inline">BL</span>
                              </button>

                              <button
                                onClick={() => setReceiptInvoice(inv)}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 rounded-md transition border border-emerald-200/90 flex items-center gap-1"
                                title="Générer et imprimer le Reçu de Paiement (Quittance)"
                              >
                                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                                <span className="hidden xl:inline">Reçu</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setPdfPreviewInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                            title="Aperçu & Impression Facture A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isCreditNote && (
                            <button
                              onClick={() => {
                                if (confirm(`Créer un avoir sur la facture ${inv.id} ?`)) {
                                  createCreditNote(inv.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                              title="Créer un avoir sur cette facture"
                            >
                              <FileMinus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la pièce ${inv.id} ?`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <InvoiceEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        invoiceToEdit={invoiceToEdit}
      />

      {/* Payment Modal */}
      {paymentModalInvoice && (
        <PaymentModal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
        />
      )}

      {/* Reminder Modal */}
      {reminderModalInvoice && (
        <ReminderModal
          isOpen={!!reminderModalInvoice}
          onClose={() => setReminderModalInvoice(null)}
          invoice={reminderModalInvoice}
        />
      )}

      {/* PDF Printable Preview Modal */}
      {pdfPreviewInvoice && (
        <InvoicePdfPreview
          isOpen={!!pdfPreviewInvoice}
          onClose={() => setPdfPreviewInvoice(null)}
          invoice={pdfPreviewInvoice}
          onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
          onOpenSendModal={(inv) => setInvoiceToSend(inv)}
          onOpenDeliveryNote={(inv) => {
            setPdfPreviewInvoice(null);
            setDeliveryNoteInvoice(inv);
          }}
          onOpenPaymentReceipt={(inv) => {
            setPdfPreviewInvoice(null);
            setReceiptInvoice(inv);
          }}
        />
      )}

      {/* Bordereau de Livraison (BL) Printable Preview Modal */}
      {deliveryNoteInvoice && (
        <DeliveryNotePdfPreview
          isOpen={!!deliveryNoteInvoice}
          onClose={() => setDeliveryNoteInvoice(null)}
          document={deliveryNoteInvoice}
          onSwitchToInvoice={(inv) => {
            setDeliveryNoteInvoice(null);
            setPdfPreviewInvoice(inv);
          }}
          onSwitchToReceipt={(inv) => {
            setDeliveryNoteInvoice(null);
            setReceiptInvoice(inv);
          }}
        />
      )}

      {/* Reçu de Paiement (Quittance) Printable Preview Modal */}
      {receiptInvoice && (
        <PaymentReceiptPdfPreview
          isOpen={!!receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
          invoice={receiptInvoice}
          onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
          onSwitchToInvoice={(inv) => {
            setReceiptInvoice(null);
            setPdfPreviewInvoice(inv);
          }}
          onSwitchToDeliveryNote={(inv) => {
            setReceiptInvoice(null);
            setDeliveryNoteInvoice(inv);
          }}
        />
      )}

      {/* WhatsApp & Email Sender Modal */}
      <SendDocumentModal
        isOpen={Boolean(invoiceToSend)}
        onClose={() => setInvoiceToSend(null)}
        document={invoiceToSend}
        documentType="facture"
        onOpenPdf={(inv) => setPdfPreviewInvoice(inv)}
      />
    </div>
  );
}
