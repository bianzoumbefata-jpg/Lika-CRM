import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Send,
  Copy,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { QuoteEditorModal } from './QuoteEditorModal';
import { QuotePdfPreview } from './QuotePdfPreview';
import { CloneQuoteModal } from './CloneQuoteModal';
import { SendDocumentModal } from '../common/SendDocumentModal';
import { exportToCSV } from '../../utils/csvExporter';

export function QuotesView() {
  const { quotes, deleteQuote, convertQuoteToInvoice, currencySymbol, currencyPosition } = useCrm();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState(null);
  const [pdfPreviewQuote, setPdfPreviewQuote] = useState(null);
  const [quoteToSend, setQuoteToSend] = useState(null);
  const [quoteToClone, setQuoteToClone] = useState(null);

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab !== 'all' && q.status !== activeTab) return false;

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.id.toLowerCase().includes(s) ||
      q.customerName.toLowerCase().includes(s) ||
      q.notes?.toLowerCase().includes(s)
    );
  });

  // Executive KPIs
  const totalQuotesTTC = quotes.reduce((sum, q) => sum + (Number(q.totalTTC) || 0), 0);
  const sentQuotes = quotes.filter((q) => q.status === 'envoye');
  const sentQuotesTTC = sentQuotes.reduce((sum, q) => sum + (Number(q.totalTTC) || 0), 0);
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepte');
  const acceptedQuotesTTC = acceptedQuotes.reduce((sum, q) => sum + (Number(q.totalTTC) || 0), 0);
  const conversionRate =
    quotes.length > 0
      ? Math.round(
          (acceptedQuotes.length / Math.max(1, quotes.filter((q) => q.status !== 'brouillon').length)) * 100
        )
      : 0;

  const handleExportCSV = () => {
    const rows = quotes.map((q) => ({
      Numero_Devis: q.id,
      Client: q.customerName,
      Date: q.date,
      Validite: q.validUntil,
      Statut: q.status,
      Total_HT: q.totalHT,
      TVA: q.totalVAT,
      Total_TTC: q.totalTTC,
      Converti_En_Facture: q.convertedToInvoiceId || 'NON',
    }));
    exportToCSV(`openflex-crm-devis-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              Propositions commerciales & Devis
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
              {quotes.length} dossiers
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Chiffrage en {currencySymbol}, clonage multi-clients, envoi WhatsApp/E-mail et transformation en facture.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="pro-btn-secondary">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>

          <button
            onClick={() => {
              setQuoteToEdit(null);
              setEditorOpen(true);
            }}
            className="pro-btn-brand"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau devis</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Volume total chiffré TTC
          </span>
          <div className="text-[20px] font-bold text-slate-900 tabular-nums mt-1.5">
            {formatCurrency(totalQuotesTTC, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{quotes.length} devis émis</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            En attente de signature
          </span>
          <div className="text-[20px] font-bold text-brand-600 tabular-nums mt-1.5">
            {formatCurrency(sentQuotesTTC, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {sentQuotes.length} proposition(s) envoyée(s)
          </span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Devis signés / acceptés
          </span>
          <div className="text-[20px] font-bold text-emerald-600 tabular-nums mt-1.5">
            {formatCurrency(acceptedQuotesTTC, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {acceptedQuotes.length} dossier(s) gagné(s)
          </span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Taux de transformation
          </span>
          <div className="text-[20px] font-bold text-slate-900 tabular-nums mt-1.5">
            {conversionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Performance commerciale
          </span>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="pro-card p-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[12px] font-semibold">
            {[
              { id: 'all', label: `Tous (${quotes.length})` },
              { id: 'envoye', label: `Envoyés (${quotes.filter((q) => q.status === 'envoye').length})` },
              { id: 'accepte', label: `Acceptés (${quotes.filter((q) => q.status === 'accepte').length})` },
              { id: 'brouillon', label: `Brouillons (${quotes.filter((q) => q.status === 'brouillon').length})` },
              { id: 'refuse', label: 'Refusés' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrer par référence, client, objet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[12.5px] bg-slate-50/90 border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="pro-card overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-[13.5px] font-semibold text-slate-700">Aucun devis correspondant</h3>
            <p className="text-[12px] text-slate-400 mt-1">
              Créez un nouveau devis ou ajustez vos filtres de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="pro-table-header">
                  <th className="py-3 px-4">Référence & Date</th>
                  <th className="py-3 px-4">Client / Prospect</th>
                  <th className="py-3 px-4">Échéance validité</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Montant HT</th>
                  <th className="py-3 px-4 text-right">Montant TTC</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => {
                  const canConvert = q.status === 'accepte' && !q.convertedToInvoiceId;
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/90 transition group cursor-pointer"
                      onClick={() => setPdfPreviewQuote(q)}
                    >
                      {/* Quote ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition flex items-center gap-1.5">
                          <span className="font-mono text-[12.5px]">{q.id}</span>
                          {q.clonedFromId && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200/80">
                              Cloné de {q.clonedFromId}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">Émis le {formatDate(q.date)}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{q.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{q.customerId}</div>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(q.validUntil)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={q.status} size="xs" />
                        {q.convertedToInvoiceId && (
                          <div className="text-[10px] font-semibold text-emerald-600 mt-1">
                            Facturé ({q.convertedToInvoiceId})
                          </div>
                        )}
                      </td>

                      {/* Total HT */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 tabular-nums whitespace-nowrap">
                        {formatCurrency(q.totalHT, currencySymbol, currencyPosition)}
                      </td>

                      {/* Total TTC */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(q.totalTTC, currencySymbol, currencyPosition)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {canConvert && (
                            <button
                              onClick={() => convertQuoteToInvoice(q.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition border border-emerald-200/80 flex items-center gap-1"
                              title="Convertir en Facture"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Facturer</span>
                            </button>
                          )}

                          <button
                            onClick={() => setQuoteToSend(q)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition border border-slate-200/90 flex items-center gap-1"
                            title="Envoyer par WhatsApp ou E-mail"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span className="hidden md:inline">Envoyer</span>
                          </button>

                          <button
                            onClick={() => setQuoteToClone(q)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition border border-slate-200/90 flex items-center gap-1"
                            title="Cloner ce devis vers un autre client"
                          >
                            <Copy className="w-3 h-3 text-brand-600" />
                            <span className="hidden md:inline">Cloner</span>
                          </button>

                          <button
                            onClick={() => setPdfPreviewQuote(q)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                            title="Aperçu & Impression A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setQuoteToEdit(q);
                              setEditorOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Supprimer le devis ${q.id} ?`)) {
                                deleteQuote(q.id);
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
      <QuoteEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        quoteToEdit={quoteToEdit}
      />

      {/* PDF Printable Preview Modal */}
      {pdfPreviewQuote && (
        <QuotePdfPreview
          isOpen={!!pdfPreviewQuote}
          onClose={() => setPdfPreviewQuote(null)}
          quote={pdfPreviewQuote}
          onConvertToInvoice={(id) => convertQuoteToInvoice(id)}
          onOpenSendModal={(q) => setQuoteToSend(q)}
          onOpenCloneModal={(q) => setQuoteToClone(q)}
        />
      )}

      {/* Clone Quote to Another Client Modal */}
      <CloneQuoteModal
        isOpen={Boolean(quoteToClone)}
        onClose={() => setQuoteToClone(null)}
        sourceQuote={quoteToClone}
        onClonedSuccess={(newQuote) => setPdfPreviewQuote(newQuote)}
        onCloneToEditor={(draftQuote) => {
          setQuoteToEdit(draftQuote);
          setEditorOpen(true);
        }}
      />

      {/* WhatsApp & Email Sender Modal */}
      <SendDocumentModal
        isOpen={Boolean(quoteToSend)}
        onClose={() => setQuoteToSend(null)}
        document={quoteToSend}
        documentType="devis"
        onOpenPdf={(q) => setPdfPreviewQuote(q)}
      />
    </div>
  );
}
