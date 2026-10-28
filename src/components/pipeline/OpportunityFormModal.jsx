import React, { useState, useEffect } from 'react';
import { X, Target, User, Calendar, DollarSign, Percent } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function OpportunityFormModal({ isOpen, onClose, oppToEdit }) {
  const { customers, settings, saveOpportunity, currencySymbol } = useCrm();

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    customerName: '',
    value: 1000,
    stage: 'qualification',
    probability: 20,
    expectedCloseDate: new Date().toISOString().slice(0, 10),
    assignedTo: '',
    notes: '',
  });

  const users = settings?.users || [];

  useEffect(() => {
    if (oppToEdit) {
      setFormData(oppToEdit);
    } else {
      const cust = customers[0];
      setFormData({
        title: '',
        customerId: cust?.id || '',
        customerName: cust?.name || '',
        value: 2500,
        stage: 'qualification',
        probability: 20,
        expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        assignedTo: users[0]?.name || 'Alexandre Dupuis',
        notes: '',
      });
    }
  }, [oppToEdit, isOpen]);

  if (!isOpen) return null;

  const handleStageChange = (newStage) => {
    const probabilities = {
      qualification: 20,
      proposition: 50,
      negociation: 80,
      gagne: 100,
      perdu: 0,
    };
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: probabilities[newStage] ?? prev.probability,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.customerId) return;

    saveOpportunity(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {oppToEdit ? `Modifier : ${oppToEdit.title}` : 'Nouvelle Opportunité Commerciale'}
              </h2>
              <p className="text-xs text-slate-500">Pipeline de vente et probabilité de succès</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Titre / Intitulé du projet *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Déploiement 10 postes & migration ERP..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client ou Prospect *</label>
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
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valeur Estimée ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="10"
                min="0"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full text-sm font-black border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Probabilité de succès (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                className="w-full text-sm font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Étape du Pipeline</label>
              <select
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="qualification">1. Qualification (20%)</option>
                <option value="proposition">2. Proposition / Devis (50%)</option>
                <option value="negociation">3. Négociation (80%)</option>
                <option value="gagne">4. Gagnée / Signée (100%)</option>
                <option value="perdu">5. Perdue (0%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date estimée de clôture</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Commercial assigné</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Stratégie commerciale</label>
            <textarea
              rows="3"
              placeholder="Enjeux du client, concurrents en lice, budget validé..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition active:scale-95"
            >
              {oppToEdit ? 'Enregistrer les modifications' : 'Ajouter au Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
