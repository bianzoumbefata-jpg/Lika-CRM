import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  DollarSign,
  RotateCw,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function ContractsView() {
  const { contracts, saveContract, deleteContract, customers, currencySymbol, currencyPosition } = useCrm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    customerName: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    billingFrequency: 'mensuel',
    amount: 300,
    status: 'actif',
    renewalNoticeDays: 30,
    notes: '',
  });

  const filtered = contracts.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.title.toLowerCase().includes(s) || c.customerName.toLowerCase().includes(s);
  });

  const totalMonthlyRecurring = contracts
    .filter((c) => c.status === 'actif')
    .reduce((sum, c) => {
      const amt = Number(c.amount) || 0;
      if (c.billingFrequency === 'annuel') return sum + amt / 12;
      if (c.billingFrequency === 'trimestriel') return sum + amt / 3;
      return sum + amt;
    }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.customerId) return;

    saveContract(formData);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contrats & Abonnements</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
              {contracts.length} contrats
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Suivi des contrats récurrents, infogérance, abonnements licences et alertes de préavis de renouvellement.
          </p>
        </div>

        <button
          onClick={() => {
            const cust = customers[0];
            setFormData({
              title: '',
              customerId: cust?.id || '',
              customerName: cust?.name || '',
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
              billingFrequency: 'mensuel',
              amount: 300,
              status: 'actif',
              renewalNoticeDays: 30,
              notes: '',
            });
            setModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Contrat</span>
        </button>
      </div>

      {/* MRR Card */}
      <div className="p-5 bg-gradient-to-r from-brand-900 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Revenu Récurrent Mensuel Estimé (MRR)
          </span>
          <div className="text-3xl font-black mt-1">
            {formatCurrency(totalMonthlyRecurring, currencySymbol, currencyPosition)}
            <span className="text-xs text-slate-300 font-normal"> / mois</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Généré automatiquement par vos abonnements actifs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold backdrop-blur-xs flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-brand-400 animate-spin-slow" />
            Facturation automatisable
          </span>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ctr) => (
          <div
            key={ctr.id}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {ctr.id} • {ctr.customerName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{ctr.title}</h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ctr.status === 'actif'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {ctr.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">Montant récurrent :</span>
              <span className="font-black text-slate-900 text-sm">
                {formatCurrency(ctr.amount, currencySymbol, currencyPosition)} / {ctr.billingFrequency}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block">Date de début</span>
                <strong className="text-slate-800">{formatDate(ctr.startDate)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Date de fin</span>
                <strong className="text-slate-800">{formatDate(ctr.endDate)}</strong>
              </div>
            </div>

            {ctr.notes && (
              <p className="text-xs text-slate-500 italic">{ctr.notes}</p>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Préavis : {ctr.renewalNoticeDays} jours
              </span>
              <button
                onClick={() => {
                  if (confirm(`Supprimer le contrat ${ctr.id} ?`)) deleteContract(ctr.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h2 className="text-base font-black text-slate-900">Enregistrer un Contrat</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <FileCheck2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Intitulé du contrat *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Contrat de maintenance annuelle..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      customerName: c ? c.name : '',
                    });
                  }}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fréquence</label>
                  <select
                    value={formData.billingFrequency}
                    onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Conditions</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
