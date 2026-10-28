import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RotateCw, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function StockMovementModal({ isOpen, onClose, defaultProduct = null }) {
  const { products, addStockMovement } = useCrm();

  const physicalProducts = products.filter((p) => p.type === 'produit');

  const [formData, setFormData] = useState({
    productId: defaultProduct?.id || physicalProducts[0]?.id || '',
    type: 'entree', // 'entree' | 'sortie' | 'ajustement' | 'perte'
    quantity: 1,
    date: new Date().toISOString().slice(0, 10),
    reason: 'Approvisionnement fournisseur',
    reference: '',
    performedBy: '',
  });

  if (!isOpen) return null;

  const selectedProd = products.find((p) => p.id === formData.productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productId || Number(formData.quantity) <= 0) return;

    addStockMovement(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Mouvement de Stock & Inventaire</h2>
              <p className="text-xs text-slate-500">Enregistrer une entrée, sortie ou ajustement de stock</p>
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
          {/* Movement Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Type d'opération *</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'entree', reason: 'Approvisionnement fournisseur' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  formData.type === 'entree'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Entrée (+ Réception)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'sortie', reason: 'Sortie / Vente directe' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  formData.type === 'sortie'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-blue-600" />
                <span>Sortie (- Vente)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'ajustement', reason: 'Inventaire physique de comptage' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  formData.type === 'ajustement'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCw className="w-4 h-4 text-purple-600" />
                <span>Ajustement Inventaire</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'perte', reason: 'Avarie / Matériel endommagé' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  formData.type === 'perte'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Rebut / Perte</span>
              </button>
            </div>
          </div>

          {/* Product selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Article concerné *</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {physicalProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.reference}] {p.name} (Stock actuel : {p.stock ?? 0} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {selectedProd && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Emplacement :</span>
                <span className="font-bold text-slate-700">{selectedProd.stockLocation || 'Dépôt Principal'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] font-semibold">Stock avant opération :</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedProd.stock ?? 0} {selectedProd.unit || 'unités'}
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.type === 'ajustement' ? 'Nouveau Stock Réel (Inventaire) *' : 'Quantité du mouvement *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full text-sm font-black border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date du mouvement</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motif / Justification</label>
              <input
                type="text"
                placeholder="ex: Arrivage fournisseur, inventaire..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">N° Bon / Référence</label>
              <input
                type="text"
                placeholder="ex: BL-2026-90, INV-FIN-MOIS..."
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
            >
              Valider le Mouvement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
