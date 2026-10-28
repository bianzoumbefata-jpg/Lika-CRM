import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Percent,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

export function QuoteEditorModal({ isOpen, onClose, quoteToEdit, initialCustomer }) {
  const { customers, products, saveQuote, convertQuoteToInvoice, currencySymbol, currencyPosition } = useCrm();

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: new Date().toISOString().slice(0, 10),
    validUntil: '',
    status: 'brouillon',
    items: [],
    discountGlobalPercent: 0,
    totalHT: 0,
    totalDiscount: 0,
    totalVAT: 0,
    totalTTC: 0,
    notes: '',
    terms: "Acompte de 50% à la commande par virement ou Wave, solde à la livraison.",
    convertedToInvoiceId: null,
  });

  // Calculate default validUntil (+30 days)
  useEffect(() => {
    if (quoteToEdit) {
      setFormData({
        ...quoteToEdit,
        items: quoteToEdit.items || [],
      });
    } else {
      const today = new Date();
      const valid = new Date();
      valid.setDate(today.getDate() + 30);

      const cust = initialCustomer || customers[0];

      setFormData({
        customerId: cust?.id || '',
        customerName: cust?.name || '',
        date: today.toISOString().slice(0, 10),
        validUntil: valid.toISOString().slice(0, 10),
        status: 'brouillon',
        discountGlobalPercent: 0,
        notes: "Devis établi selon vos spécifications. Restant à votre entière disposition.",
        terms: "Règlement à 30 jours par virement CBAO ou Wave.",
        convertedToInvoiceId: null,
        items: [
          {
            id: `ITM-${Date.now()}`,
            productId: products[0]?.id || '',
            reference: products[0]?.reference || '',
            description: products[0]?.name || 'Prestation standard',
            quantity: 1,
            unit: products[0]?.unit || 'unité',
            unitPriceHT: products[0]?.salePriceHT || 150000,
            discountPercent: cust?.defaultDiscount || 0,
            vatRate: products[0]?.vatRate || 18,
            totalHT: products[0]?.salePriceHT || 150000,
            totalTTC: (products[0]?.salePriceHT || 150000) * 1.18,
          },
        ],
        totalHT: 0,
        totalDiscount: 0,
        totalVAT: 0,
        totalTTC: 0,
      });
    }
  }, [quoteToEdit, initialCustomer, isOpen]);

  // Recalculate totals whenever items or discount changes
  useEffect(() => {
    let rawTotalHT = 0;
    let lineDiscounts = 0;
    let vatAmount = 0;

    const computedItems = formData.items.map((item) => {
      const q = Number(item.quantity) || 0;
      const pu = Number(item.unitPriceHT) || 0;
      const disc = Number(item.discountPercent) || 0;
      const vat = Number(item.vatRate) ?? 18;

      const baseHT = q * pu;
      const discAmount = (baseHT * disc) / 100;
      const lineHT = Math.max(0, baseHT - discAmount);
      const lineVat = (lineHT * vat) / 100;
      const lineTTC = lineHT + lineVat;

      rawTotalHT += baseHT;
      lineDiscounts += discAmount;
      vatAmount += lineVat;

      return {
        ...item,
        totalHT: Math.round(lineHT),
        totalTTC: Math.round(lineTTC),
      };
    });

    const globalDisc = Number(formData.discountGlobalPercent) || 0;
    const netHTBeforeGlobal = rawTotalHT - lineDiscounts;
    const globalDiscAmount = (netHTBeforeGlobal * globalDisc) / 100;
    const finalNetHT = Math.max(0, netHTBeforeGlobal - globalDiscAmount);
    const finalVAT = vatAmount * (1 - globalDisc / 100);
    const finalTTC = finalNetHT + finalVAT;

    setFormData((prev) => ({
      ...prev,
      totalHT: Math.round(finalNetHT),
      totalDiscount: Math.round(lineDiscounts + globalDiscAmount),
      totalVAT: Math.round(finalVAT),
      totalTTC: Math.round(finalTTC),
    }));
  }, [formData.items, formData.discountGlobalPercent]);

  if (!isOpen) return null;

  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    setFormData((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
      items: prev.items.map((itm) => ({
        ...itm,
        discountPercent: itm.discountPercent || cust.defaultDiscount || 0,
      })),
    }));
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem = {
      id: `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: defaultProd?.id || '',
      reference: defaultProd?.reference || '',
      description: defaultProd?.name || 'Nouvelle ligne de devis',
      quantity: 1,
      unit: defaultProd?.unit || 'unité',
      unitPriceHT: defaultProd?.salePriceHT || 100000,
      discountPercent: 0,
      vatRate: defaultProd?.vatRate || 18,
      totalHT: defaultProd?.salePriceHT || 100000,
      totalTTC: (defaultProd?.salePriceHT || 100000) * 1.18,
    };
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleSelectProductForLine = (index, productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        reference: prod.reference,
        description: prod.name,
        unit: prod.unit,
        unitPriceHT: prod.salePriceHT,
        vatRate: prod.vatRate,
        minSalePriceHT: prod.minSalePriceHT,
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index][field] = value;
      return { ...prev, items: updated };
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerId || formData.items.length === 0) return;

    saveQuote(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {quoteToEdit
                  ? quoteToEdit.id
                    ? `Modifier le Devis ${quoteToEdit.id}`
                    : `Cloner le Devis ${quoteToEdit.clonedFromId || ''} → ${formData.customerName}`
                  : 'Nouveau Devis Commercial'}
              </h2>
              <p className="text-xs text-slate-500">
                Sélectionnez le client, composez les articles et calculez les montants en {currencySymbol}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Customer & Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            {/* Customer select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client / Prospect Destinataire *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'prospect' ? 'Prospect' : 'Client'}) - {c.city || 'Sénégal'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date d'émission</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            {/* Validity date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Validité jusqu'au</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Statut du Devis</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé au client</option>
                <option value="accepte">Accepté / Signé</option>
                <option value="refuse">Refusé</option>
                <option value="expire">Expiré</option>
              </select>
            </div>

            {/* Global Discount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remise Globale (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountGlobalPercent}
                onChange={(e) => setFormData({ ...formData, discountGlobalPercent: Number(e.target.value) })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Articles & Prestations ({formData.items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => {
                const matchedProd = products.find((p) => p.id === item.productId);
                const isBelowMin =
                  matchedProd && matchedProd.minSalePriceHT && Number(item.unitPriceHT) < matchedProd.minSalePriceHT;

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Product Selector */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Article du Catalogue
                        </label>
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleSelectProductForLine(idx, e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value="">-- Ligne personnalisée --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.reference}] {p.name} ({p.salePriceHT.toLocaleString('fr-FR')} {currencySymbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qté</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                        />
                      </div>

                      {/* Unit Price HT */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Prix HT ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          step="100"
                          value={item.unitPriceHT}
                          onChange={(e) => handleUpdateItem(idx, 'unitPriceHT', e.target.value)}
                          className={`w-full text-xs font-semibold bg-white border rounded-xl px-2.5 py-1.5 focus:outline-none ${
                            isBelowMin ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      {/* Remise % */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rem. %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleUpdateItem(idx, 'discountPercent', e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none"
                        />
                      </div>

                      {/* Total HT line */}
                      <div className="sm:col-span-2 flex items-center justify-between">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total HT</label>
                          <span className="text-xs font-bold text-slate-900">
                            {formatCurrency(item.totalHT, currencySymbol, currencyPosition)}
                          </span>
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Description affichée sur le devis..."
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>

                    {/* Warning if below minimum price */}
                    {isBelowMin && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-100/70 p-2 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Attention : Le prix saisi ({formatCurrency(item.unitPriceHT, currencySymbol, currencyPosition)}) est inférieur au prix plancher minimum ({formatCurrency(matchedProd.minSalePriceHT, currencySymbol, currencyPosition)}) !
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs space-y-1">
              <div>Total Brut HT : {formatCurrency((formData.totalHT || 0) + (formData.totalDiscount || 0), currencySymbol, currencyPosition)}</div>
              {formData.totalDiscount > 0 && (
                <div className="text-emerald-400 font-bold">
                  Remise totale : -{formatCurrency(formData.totalDiscount, currencySymbol, currencyPosition)}
                </div>
              )}
              <div>TVA (18%) : {formatCurrency(formData.totalVAT, currencySymbol, currencyPosition)}</div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                Total TTC Net à Payer
              </span>
              <span className="text-2xl font-black text-brand-400 font-mono">
                {formatCurrency(formData.totalTTC, currencySymbol, currencyPosition)}
              </span>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Conditions de règlement</label>
              <input
                type="text"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes particulières</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {quoteToEdit && quoteToEdit.status === 'accepte' && !quoteToEdit.convertedToInvoiceId ? (
              <button
                type="button"
                onClick={() => {
                  convertQuoteToInvoice(quoteToEdit.id);
                  onClose();
                }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Transformer immédiatement en Facture</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-500/20 transition active:scale-95"
              >
                {quoteToEdit ? 'Enregistrer le Devis' : 'Créer le Devis'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
