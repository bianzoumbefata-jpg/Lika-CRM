import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Layers, Percent, DollarSign, History, AlertCircle, MapPin } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function ProductFormModal({ isOpen, onClose, productToEdit }) {
  const { saveProduct, products, currencySymbol } = useCrm();

  const [formData, setFormData] = useState({
    name: '',
    type: 'produit', // 'produit' | 'service'
    reference: '',
    description: '',
    family: 'Matériel informatique',
    unit: 'unité',
    salePriceHT: 0,
    vatRate: 18,
    costPriceHT: 0,
    minSalePriceHT: 0,
    stock: 0,
    minStockAlert: 3,
    stockLocation: 'Dépôt Principal Dakar',
    pricingTiers: {
      particulier: 0,
      pme: 0,
      revendeur: 0,
      vip: 0,
    },
    isKit: false,
    kitItems: [],
    active: true,
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        minStockAlert: productToEdit.minStockAlert ?? 3,
        stockLocation: productToEdit.stockLocation || 'Dépôt Principal Dakar',
        pricingTiers: productToEdit.pricingTiers || {
          particulier: Math.round(Number(productToEdit.salePriceHT) * 1.1),
          pme: Number(productToEdit.salePriceHT),
          revendeur: Math.round(Number(productToEdit.salePriceHT) * 0.85),
          vip: Math.round(Number(productToEdit.salePriceHT) * 0.9),
        },
        kitItems: productToEdit.kitItems || [],
      });
    } else {
      setFormData({
        name: '',
        type: 'produit',
        reference: '',
        description: '',
        family: 'Matériel informatique',
        unit: 'unité',
        salePriceHT: 150000,
        vatRate: 18,
        costPriceHT: 100000,
        minSalePriceHT: 130000,
        stock: 10,
        minStockAlert: 3,
        stockLocation: 'Dépôt Principal Dakar',
        pricingTiers: {
          particulier: 165000,
          pme: 150000,
          revendeur: 135000,
          vip: 140000,
        },
        isKit: false,
        kitItems: [],
        active: true,
      });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSalePriceChange = (newVal) => {
    const val = Number(newVal);
    setFormData((prev) => ({
      ...prev,
      salePriceHT: val,
      minSalePriceHT: prev.minSalePriceHT || Math.round(val * 0.8),
      pricingTiers: {
        particulier: Math.round(val * 1.1),
        pme: val,
        revendeur: Math.round(val * 0.85),
        vip: Math.round(val * 0.9),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let history = formData.priceHistory || [];
    if (productToEdit && Number(productToEdit.salePriceHT) !== Number(formData.salePriceHT)) {
      history = [
        {
          date: new Date().toISOString().slice(0, 10),
          oldPrice: Number(productToEdit.salePriceHT),
          newPrice: Number(formData.salePriceHT),
          reason: 'Mise à jour tarifaire',
        },
        ...history,
      ];
    }

    saveProduct({
      ...formData,
      priceHistory: history,
    });
    onClose();
  };

  const margin = Number(formData.salePriceHT) - Number(formData.costPriceHT);
  const marginPercent =
    Number(formData.salePriceHT) > 0 ? Math.round((margin / Number(formData.salePriceHT)) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {productToEdit ? `Modifier : ${productToEdit.name}` : 'Ajouter un Article au Catalogue'}
            </h2>
            <p className="text-xs text-slate-500">
              Produit physique avec suivi de stock ou prestation de service
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'produit', unit: 'unité' })}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                formData.type === 'produit'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Produit Matériel (avec Stock)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'service', unit: 'forfait' })}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                formData.type === 'service'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prestation / Service (Immatériel)
            </button>
          </div>

          {/* Name & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Désignation de l'Article *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Ordinateur Dell, Imprimante caisse, Licence ERP..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Référence / Code Article</label>
              <input
                type="text"
                placeholder="REF-101"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full text-sm uppercase font-mono border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Family & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Famille / Catégorie</label>
              <select
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="Matériel informatique">Matériel informatique</option>
                <option value="Hébergement & Cloud">Hébergement & Cloud</option>
                <option value="Logiciels & Licences">Logiciels & Licences</option>
                <option value="Prestations de Conseil">Prestations de Conseil</option>
                <option value="Formations">Formations</option>
                <option value="Maintenance & Support">Maintenance & Support</option>
                <option value="Packs & Solutions">Packs & Solutions</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unité de vente</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="unité">Unité</option>
                <option value="heure">Heure</option>
                <option value="jour">Jour (TJM)</option>
                <option value="forfait">Forfait</option>
                <option value="mois">Mois (Abonnement)</option>
                <option value="licence">Licence</option>
                <option value="kg">Kilogramme (kg)</option>
                <option value="carton">Carton / Boîte</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taux de TVA (%)</label>
              <select
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value={18}>18 % (Standard Sénégal)</option>
                <option value={0}>0 % (Exonéré / Export)</option>
              </select>
            </div>
          </div>

          {/* Stock Section (Only if product is matériel) */}
          {formData.type === 'produit' && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> Gestion & Emplacement du Stock
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quantité en Stock Actuel *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full text-sm font-black bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Seuil d'Alerte Minimum (Stock de sécurité)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert ?? 2}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Emplacement / Dépôt
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Dépôt Dakar, Magasin Sandaga..."
                    value={formData.stockLocation || ''}
                    onChange={(e) => setFormData({ ...formData, stockLocation: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Structure Tarifaire ({currencySymbol})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prix Vente HT *</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={formData.salePriceHT}
                  onChange={(e) => handleSalePriceChange(e.target.value)}
                  className="w-full text-sm font-black bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prix d'Achat HT</label>
                <input
                  type="number"
                  step="100"
                  value={formData.costPriceHT}
                  onChange={(e) => setFormData({ ...formData, costPriceHT: Number(e.target.value) })}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prix Plancher Min HT</label>
                <input
                  type="number"
                  step="100"
                  value={formData.minSalePriceHT}
                  onChange={(e) => setFormData({ ...formData, minSalePriceHT: Number(e.target.value) })}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Marge Brute Estimée</label>
                <div className="h-[38px] px-3 flex items-center justify-between bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-600">
                  <span>+{margin.toLocaleString('fr-FR')} {currencySymbol}</span>
                  <span>({marginPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Grilles Tarifaires Multiples ({currencySymbol} HT)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Particulier (+10%)</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.pricingTiers?.particulier || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingTiers: { ...formData.pricingTiers, particulier: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PME (Standard)</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.pricingTiers?.pme || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingTiers: { ...formData.pricingTiers, pme: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Revendeur (-15%)</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.pricingTiers?.revendeur || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingTiers: { ...formData.pricingTiers, revendeur: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">VIP (-10%)</span>
                  <input
                    type="number"
                    step="100"
                    value={formData.pricingTiers?.vip || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingTiers: { ...formData.pricingTiers, vip: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description commerciale détaillée (figurera sur les devis & factures)
            </label>
            <textarea
              rows="3"
              placeholder="Détaillez les fonctionnalités, caractéristiques techniques, garanties..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition active:scale-95"
            >
              {productToEdit ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
