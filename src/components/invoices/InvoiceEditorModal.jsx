import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, Calendar, CreditCard, RotateCw, Stamp } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';
import { INVOICE_STAMP_OPTIONS } from './DigitalInvoiceStamp';

export function InvoiceEditorModal({ isOpen, onClose, invoiceToEdit, defaultType = 'facture' }) {
  const { customers, products, saveInvoice, currencySymbol, currencyPosition } = useCrm();

  const [formData, setFormData] = useState({
    type: defaultType,
    customerId: '',
    customerName: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    status: 'envoyee',
    isRecurring: false,
    recurringFrequency: 'mensuel',
    items: [],
    discountGlobalPercent: 0,
    totalHT: 0,
    totalDiscount: 0,
    totalVAT: 0,
    totalTTC: 0,
    paidAmount: 0,
    remainingAmount: 0,
    payments: [],
    notes: '',
    terms: 'Paiement à 30 jours par virement CBAO ou Wave.',
  });

  useEffect(() => {
    if (invoiceToEdit) {
      setFormData({
        ...invoiceToEdit,
        items: invoiceToEdit.items || [],
        payments: invoiceToEdit.payments || [],
      });
    } else {
      const today = new Date();
      const due = new Date();
      due.setDate(today.getDate() + 30);
      const cust = customers[0];

      setFormData({
        type: defaultType,
        customerId: cust?.id || '',
        customerName: cust?.name || '',
        date: today.toISOString().slice(0, 10),
        dueDate: due.toISOString().slice(0, 10),
        status: 'envoyee',
        isRecurring: false,
        recurringFrequency: 'mensuel',
        discountGlobalPercent: 0,
        paidAmount: 0,
        remainingAmount: 0,
        payments: [],
        notes: '',
        terms: 'Paiement à 30 jours par virement CBAO ou Wave.',
        items: [
          {
            id: `INV-ITM-${Date.now()}`,
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
  }, [invoiceToEdit, defaultType, isOpen]);

  // Recalculate totals
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

    const paid = Number(formData.paidAmount) || 0;
    const remaining = Math.max(0, finalTTC - paid);

    setFormData((prev) => ({
      ...prev,
      totalHT: Math.round(finalNetHT),
      totalDiscount: Math.round(lineDiscounts + globalDiscAmount),
      totalVAT: Math.round(finalVAT),
      totalTTC: Math.round(finalTTC),
      remainingAmount: Math.round(remaining),
    }));
  }, [formData.items, formData.discountGlobalPercent, formData.paidAmount]);

  if (!isOpen) return null;

  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    setFormData((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
    }));
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem = {
      id: `INV-ITM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: defaultProd?.id || '',
      reference: defaultProd?.reference || '',
      description: defaultProd?.name || 'Nouvelle ligne de facture',
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

    saveInvoice(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {invoiceToEdit
                  ? `Modifier la ${formData.type === 'avoir' ? 'Note d\'Avoir' : 'Facture'} ${invoiceToEdit.id}`
                  : `Créer une ${formData.type === 'avoir' ? 'Note d\'Avoir' : 'Facture'}`}
              </h2>
              <p className="text-xs text-slate-500">
                Lignes de facturation, TVA 18% et conditions de paiement en {currencySymbol}
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
          {/* Main Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            {/* Customer select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client à Facturer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type}) - {c.city}
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

            {/* Due date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date d'échéance</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            {/* Recurring toggle */}
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isRecurring" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-brand-600" />
                Facturation récurrente / Abonnement
              </label>
            </div>

            {/* Digital Stamp selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-brand-600" />
                Cachet numérique apposé sur la facture
              </label>
              <select
                value={formData.stampType || 'aucun'}
                onChange={(e) => setFormData({ ...formData, stampType: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {INVOICE_STAMP_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.id === 'aucun'
                      ? 'Aucun cachet numérique'
                      : `★ ${opt.stampTitle} (${opt.subtitle})`}
                  </option>
                ))}
              </select>
            </div>

            {formData.isRecurring && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Fréquence de renouvellement</label>
                <select
                  value={formData.recurringFrequency || 'mensuel'}
                  onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="mensuel">Mensuelle (tous les mois)</option>
                  <option value="trimestriel">Trimestrielle (tous les 3 mois)</option>
                  <option value="annuel">Annuelle (tous les ans)</option>
                </select>
              </div>
            )}
          </div>

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lignes de facturation ({formData.items.length})
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
              {formData.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Article / Prestation
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

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Prix HT ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={item.unitPriceHT}
                        onChange={(e) => handleUpdateItem(idx, 'unitPriceHT', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TVA %</label>
                      <input
                        type="number"
                        value={item.vatRate}
                        onChange={(e) => handleUpdateItem(idx, 'vatRate', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none"
                      />
                    </div>

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

                  <div>
                    <input
                      type="text"
                      placeholder="Description figurant sur la facture..."
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs space-y-1">
              <div>Total Brut HT : {formatCurrency(formData.totalHT, currencySymbol, currencyPosition)}</div>
              <div>Total TVA (18%) : {formatCurrency(formData.totalVAT, currencySymbol, currencyPosition)}</div>
              <div>Déjà Réglé : {formatCurrency(formData.paidAmount, currencySymbol, currencyPosition)}</div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                Total TTC Facturé
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(formData.totalTTC, currencySymbol, currencyPosition)}
              </span>
              <div className="text-xs text-rose-300 font-semibold mt-1">
                Reste à payer : {formatCurrency(formData.remainingAmount, currencySymbol, currencyPosition)}
              </div>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95"
            >
              {invoiceToEdit ? 'Enregistrer les modifications' : 'Émettre la Facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
