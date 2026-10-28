import React, { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  FileText,
  Receipt,
  User,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Edit,
  Trash2,
  Share2,
  Smartphone,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onEdit,
  onCreateQuoteForCustomer,
  onOpenQuote,
  onOpenInvoice,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    convertProspectToClient,
    deleteCustomer,
    quotes,
    invoices,
    opportunities,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  if (!isOpen || !customer) return null;

  const customerQuotes = quotes.filter((q) => q.customerId === customer.id);
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerDeals = opportunities.filter((o) => o.customerId === customer.id);

  const totalInvoiced = customerInvoices
    .filter((i) => i.type === 'facture')
    .reduce((sum, i) => sum + (Number(i.totalTTC) || 0), 0);

  const totalPaid = customerInvoices
    .filter((i) => i.type === 'facture')
    .reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);

  const remainingBalance = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in flex flex-col max-h-[90vh]">
        {/* Top Header Card */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">{customer.name}</h2>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    customer.type === 'client'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {customer.type === 'client' ? 'Client Actif' : 'Prospect Qualifié'}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 rounded-full text-slate-300">
                  {customer.category}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 flex-wrap">
                {customer.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.city}, {customer.country}
                  </span>
                )}
                {customer.mobile && (
                  <a
                    href={`tel:${customer.mobile}`}
                    className="flex items-center gap-1 text-emerald-400 font-semibold hover:underline"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Wave / OM : {customer.mobile}
                  </a>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {customer.type === 'prospect' && (
              <button
                onClick={() => convertProspectToClient(customer.id)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Convertir en Client</span>
              </button>
            )}

            <button
              onClick={() => onEdit(customer)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Modifier la fiche"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Financial Snapshot */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 py-3 px-6 text-center">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Commandes Facturées</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {formatCurrency(totalInvoiced, currencySymbol, currencyPosition)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Règlements Reçus</div>
            <div className="text-sm font-black text-emerald-600 mt-0.5">
              {formatCurrency(totalPaid, currencySymbol, currencyPosition)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Solde Débiteur (Reste dû)</div>
            <div
              className={`text-sm font-black mt-0.5 ${
                remainingBalance > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {formatCurrency(remainingBalance, currencySymbol, currencyPosition)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fiche & Contacts ({customer.contacts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'quotes'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Devis ({customerQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Factures & Avoirs ({customerInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'pipeline'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Opportunités ({customerDeals.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Identifiants légaux Sénégal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Identifiants Fiscaux & Administratifs (Sénégal)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">NINEA</span>
                    <span className="font-bold text-slate-800 font-mono">{customer.ninea || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">RCCM</span>
                    <span className="font-bold text-slate-800 font-mono">{customer.rccm || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Centre Fiscal (COFI)</span>
                    <span className="font-bold text-slate-800">{customer.cofi || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Remise Accordée</span>
                    <span className="font-bold text-brand-600">{customer.defaultDiscount || 0} %</span>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Interlocuteurs & Contacts ({customer.contacts?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.contacts?.map((ctc) => (
                    <div
                      key={ctc.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{ctc.name}</span>
                        {ctc.isPrimary && (
                          <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{ctc.role || 'Contact'}</p>
                      <div className="pt-1 flex items-center gap-3 text-xs text-slate-600">
                        {ctc.email && (
                          <a href={`mailto:${ctc.email}`} className="hover:text-brand-600 transition flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {ctc.email}
                          </a>
                        )}
                        {ctc.phone && (
                          <a href={`tel:${ctc.phone}`} className="hover:text-brand-600 transition flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {ctc.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs">
                  <span className="font-bold text-amber-900 block mb-1">Notes internes :</span>
                  <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Devis émis pour {customer.name}</span>
                <button
                  onClick={() => onCreateQuoteForCustomer(customer)}
                  className="px-3 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Nouveau Devis
                </button>
              </div>

              {customerQuotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Aucun devis créé pour l'instant.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {customerQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => onOpenQuote(q.id)}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-brand-600 font-mono">{q.id}</span>
                          <Badge status={q.status} />
                        </div>
                        <span className="text-[11px] text-slate-400">Date : {formatDate(q.date)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrency(q.totalTTC, currencySymbol, currencyPosition)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Factures & Avoirs</span>
              </div>

              {customerInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Aucune facture émise pour ce client.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => onOpenInvoice(inv.id)}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 font-mono">{inv.id}</span>
                          <Badge status={inv.status} />
                        </div>
                        <span className="text-[11px] text-slate-400">Échéance : {formatDate(inv.dueDate)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrency(inv.totalTTC, currencySymbol, currencyPosition)}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Reste : {formatCurrency(inv.remainingAmount, currencySymbol, currencyPosition)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-3">
              {customerDeals.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Aucune opportunité commerciale active.</p>
              ) : (
                customerDeals.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{opp.title}</div>
                      <div className="text-[11px] text-slate-500">Étape : {opp.stage} ({opp.probability}%)</div>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(opp.value, currencySymbol, currencyPosition)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Voulez-vous vraiment supprimer la fiche de ${customer.name} ?`)) {
                deleteCustomer(customer.id);
                onClose();
              }
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer ce tiers
          </button>

          <button
            onClick={() => onCreateQuoteForCustomer(customer)}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Créer un Devis pour ce Client
          </button>
        </div>
      </div>
    </div>
  );
}
