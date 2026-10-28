import React, { useState, useEffect } from 'react';
import { Search, X, Users, Package, FileText, Receipt, Target, Calendar } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

export function GlobalSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const { customers, products, quotes, invoices, opportunities, currencySymbol, currencyPosition } = useCrm();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingCustomers = q ? customers.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.email?.toLowerCase().includes(q) || 
    c.city?.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchingProducts = q ? products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.reference?.toLowerCase().includes(q) ||
    p.family?.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchingQuotes = q ? quotes.filter(quote => 
    quote.id.toLowerCase().includes(q) || 
    quote.customerName.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchingInvoices = q ? invoices.filter(inv => 
    inv.id.toLowerCase().includes(q) || 
    inv.customerName.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchingOpportunities = q ? opportunities.filter(opp => 
    opp.title.toLowerCase().includes(q) || 
    opp.customerName.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const hasResults = matchingCustomers.length > 0 || matchingProducts.length > 0 || matchingQuotes.length > 0 || matchingInvoices.length > 0 || matchingOpportunities.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, devis, facture, produit, opportunité..."
            className="w-full text-slate-800 placeholder-slate-400 text-base focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Tapez au moins une lettre pour chercher dans l'ensemble de votre CRM...
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Aucun résultat trouvé pour « <span className="font-semibold text-slate-600">{query}</span> »
            </div>
          )}

          {/* Customers */}
          {matchingCustomers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Fiches Tiers ({matchingCustomers.length})
              </div>
              <div className="space-y-1">
                {matchingCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectResult('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {c.type === 'prospect' ? 'Prospect' : 'Client'} • {c.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{c.city || c.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes */}
          {matchingQuotes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Devis ({matchingQuotes.length})
              </div>
              <div className="space-y-1">
                {matchingQuotes.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      onSelectResult('quotes', q.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-600 text-sm">{q.id}</span>
                      <span className="text-sm text-slate-700">{q.customerName}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(q.totalTTC, currencySymbol, currencyPosition)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {matchingInvoices.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Factures & Avoirs ({matchingInvoices.length})
              </div>
              <div className="space-y-1">
                {matchingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onSelectResult('invoices', inv.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{inv.id}</span>
                      <span className="text-sm text-slate-700">{inv.customerName}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(inv.totalTTC, currencySymbol, currencyPosition)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {matchingProducts.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Produits & Services ({matchingProducts.length})
              </div>
              <div className="space-y-1">
                {matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectResult('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <span className="font-medium text-slate-800 text-sm">{p.name}</span>
                      <span className="ml-2 text-xs text-slate-400">({p.reference})</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(p.salePriceHT, currencySymbol, currencyPosition)} HT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {matchingOpportunities.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Pipeline Ventes ({matchingOpportunities.length})
              </div>
              <div className="space-y-1">
                {matchingOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => {
                      onSelectResult('pipeline', opp.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{opp.title}</div>
                      <div className="text-xs text-slate-400">{opp.customerName}</div>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(opp.value, currencySymbol, currencyPosition)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Conseil : Cliquez sur un résultat pour l'ouvrir immédiatement</span>
          <span>Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
}
