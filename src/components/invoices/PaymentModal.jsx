import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2, Smartphone } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

export function PaymentModal({ isOpen, onClose, invoice }) {
  const { addPayment, currencySymbol, currencyPosition } = useCrm();

  const [paymentData, setPaymentData] = useState({
    amount: invoice?.remainingAmount || 0,
    date: new Date().toISOString().slice(0, 10),
    method: 'wave', // Default to Wave (most popular mobile payment in Senegal)
    reference: '',
    note: '',
  });

  if (!isOpen || !invoice) return null;

  const remaining = Number(invoice.remainingAmount) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(paymentData.amount) <= 0) return;

    addPayment(invoice.id, paymentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Enregistrer un Encaissement</h2>
              <p className="text-xs text-slate-500">
                Facture {invoice.id} • {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial info summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold">Total Facturé TTC</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(invoice.totalTTC, currencySymbol, currencyPosition)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold">Déjà réglé</span>
            <span className="font-bold text-emerald-600">
              {formatCurrency(invoice.paidAmount, currencySymbol, currencyPosition)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold">Solde restant</span>
            <span className="font-black text-rose-600">
              {formatCurrency(remaining, currencySymbol, currencyPosition)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Montant du règlement ({currencySymbol}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="100"
                max={remaining > 0 ? remaining : undefined}
                required
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                className="w-full text-lg font-black border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: remaining })}
                className="absolute right-2.5 top-2.5 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Solde total ({formatCurrency(remaining, currencySymbol, currencyPosition)})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date du paiement</label>
              <input
                type="date"
                required
                value={paymentData.date}
                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode de règlement (Sénégal) *
              </label>
              <select
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="wave">Wave Sénégal (Mobile)</option>
                <option value="orange_money">Orange Money Sénégal (Mobile)</option>
                <option value="free_money">Free Money Sénégal (Mobile)</option>
                <option value="virement">Virement Bancaire (CBAO / SGBS / Ecobank)</option>
                <option value="cheque">Chèque Bancaire</option>
                <option value="especes">Espèces / Caisse physique</option>
                <option value="cb">Carte Bancaire / GIM-UEMOA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Référence transaction (ex: ID Wave, n° transaction OM, réf. virement...)
            </label>
            <input
              type="text"
              placeholder="ex: WV-2026-9910, OM-88190, VIR-CBAO-12..."
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
              className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Note interne / Émetteur</label>
            <input
              type="text"
              placeholder="ex: Payé par M. Diagne via Wave..."
              value={paymentData.note}
              onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider l'Encaissement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
