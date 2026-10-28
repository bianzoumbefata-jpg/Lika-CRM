import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Search,
  UserPlus,
  Check,
  ArrowRight,
  Edit3,
  Building2,
  MapPin,
  Percent,
  Calendar,
  FileText,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function CloneQuoteModal({
  isOpen,
  onClose,
  sourceQuote,
  onClonedSuccess, // (newQuote) => void
  onCloneToEditor, // (draftQuoteData) => void
}) {
  const {
    customers,
    saveCustomer,
    cloneQuote,
    settings,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [applyCustomerDiscount, setApplyCustomerDiscount] = useState(false);
  const [date, setDate] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Quick inline new customer creation
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustType, setNewCustType] = useState('prospect');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('Dakar');

  useEffect(() => {
    if (!isOpen || !sourceQuote) return;

    const today = new Date();
    const valid = new Date();
    const defaultDays = settings?.financials?.defaultQuoteValidityDays || 30;
    valid.setDate(today.getDate() + defaultDays);

    setDate(today.toISOString().slice(0, 10));
    setValidUntil(valid.toISOString().slice(0, 10));
    setSearch('');
    setShowQuickCreate(false);
    setApplyCustomerDiscount(false);

    // Pre-select the first customer that is different from the source quote's customer (or fallback to same)
    const otherCustomer = customers.find((c) => c.id !== sourceQuote.customerId) || customers[0];
    setSelectedCustomerId(otherCustomer?.id || '');
  }, [isOpen, sourceQuote?.id]);

  if (!isOpen || !sourceQuote) return null;

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.city || '').toLowerCase().includes(s) ||
      (c.ninea || '').toLowerCase().includes(s) ||
      (c.mobile || '').toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleQuickCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = saveCustomer({
      name: newCustName.trim(),
      type: newCustType,
      category: 'PME',
      city: newCustCity || 'Dakar',
      region: newCustCity || 'Dakar',
      country: 'Sénégal',
      mobile: newCustMobile.trim(),
      phone: newCustMobile.trim(),
      email: newCustEmail.trim(),
      defaultDiscount: 0,
      contacts: [],
      customFields: [],
    });

    if (created?.id) {
      setSelectedCustomerId(created.id);
      setShowQuickCreate(false);
      setNewCustName('');
      setNewCustMobile('');
      setNewCustEmail('');
    }
  };

  // Option 1: Clone and save immediately
  const handleCloneImmediate = () => {
    if (!selectedCustomerId) return;
    const created = cloneQuote(sourceQuote, selectedCustomerId, {
      applyCustomerDiscount,
      date,
      validUntil,
    });
    onClose();
    if (created && onClonedSuccess) {
      onClonedSuccess(created);
    }
  };

  // Option 2: Clone and open in QuoteEditorModal before saving
  const handleCloneToEditorClick = () => {
    if (!selectedCustomer) return;

    const custDisc = Number(selectedCustomer.defaultDiscount) || 0;
    const clonedItems = (sourceQuote.items || []).map((item, idx) => ({
      ...item,
      id: `ITM-${Date.now()}-${idx}`,
      discountPercent: applyCustomerDiscount ? custDisc : Number(item.discountPercent) || 0,
    }));

    const draftClone = {
      ...sourceQuote,
      id: undefined, // undefined so saveQuote generates a new DEV-YYYY-XXXX ID
      clonedFromId: sourceQuote.id,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date,
      validUntil,
      status: 'brouillon',
      convertedToInvoiceId: null,
      items: clonedItems,
    };

    onClose();
    if (onCloneToEditor) {
      onCloneToEditor(draftClone);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Cloner & Attribuer le Devis à un autre Client</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-brand-200">
                  {sourceQuote.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dupliquez l'intégralité des articles et tarifs vers un nouveau destinataire en un clic
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
          {/* Source Quote Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Devis Modèle (Source)
                </div>
                <div className="font-bold text-slate-900">
                  {sourceQuote.id} — <span className="text-slate-600">{sourceQuote.customerName}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {(sourceQuote.items || []).length} ligne(s) d'articles • Émis le {formatDate(sourceQuote.date)}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[10px] text-slate-400 block">Montant TTC d'origine</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {formatCurrency(sourceQuote.totalTTC, currencySymbol, currencyPosition)}
              </span>
            </div>
          </div>

          {/* Step 1: Select Target Customer */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>1. Choisir le nouveau Client ou Prospect destinataire :</span>
              </label>

              <button
                type="button"
                onClick={() => setShowQuickCreate(!showQuickCreate)}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showQuickCreate ? 'Masquer la création' : '+ Nouveau client/prospect'}</span>
              </button>
            </div>

            {/* Optional Quick Create Customer Inline Form */}
            {showQuickCreate && (
              <form
                onSubmit={handleQuickCreateCustomer}
                className="p-3.5 bg-brand-50/60 border border-brand-200 rounded-xl space-y-3"
              >
                <div className="font-bold text-brand-900 text-xs">
                  Création rapide d'un nouveau destinataire
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Nom de l'entreprise ou du client *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="Ex: Société Sénégalaise de Distribution SARL"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Type</label>
                    <select
                      value={newCustType}
                      onChange={(e) => setNewCustType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="prospect">Prospect</option>
                      <option value="client">Client</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Téléphone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      placeholder="+221 77 ..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">E-mail</label>
                    <input
                      type="email"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      placeholder="contact@entreprise.sn"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Ville</label>
                    <input
                      type="text"
                      value={newCustCity}
                      onChange={(e) => setNewCustCity(e.target.value)}
                      placeholder="Dakar"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickCreate(false)}
                    className="px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[11px] font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                  >
                    Ajouter et Sélectionner
                  </button>
                </div>
              </form>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client ou prospect (nom, ville, NINEA, téléphone)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Customers Grid */}
            <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
              {filteredCustomers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                const isOriginal = c.id === sourceQuote.customerId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-50/90 border-brand-600 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="font-bold text-slate-900 truncate">{c.name}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOriginal && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Actuel
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            c.type === 'prospect'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {c.type === 'prospect' ? 'Prospect' : 'Client'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {c.city || 'Dakar'}
                      </span>
                      {c.defaultDiscount > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          Remise {c.defaultDiscount}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="sm:col-span-2 py-6 text-center text-slate-400">
                  Aucun client ou prospect ne correspond à « {search} ».
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Dates & Discount Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>2. Paramètres du nouveau devis cloné :</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nouvelle date d'émission
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nouvelle date de validité
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            {selectedCustomer && selectedCustomer.defaultDiscount > 0 && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyCustomerDiscount}
                  onChange={(e) => setApplyCustomerDiscount(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700">
                  Appliquer la remise habituelle de <strong>{selectedCustomer.name}</strong> (
                  <strong className="text-emerald-700">{selectedCustomer.defaultDiscount}%</strong>) sur les lignes
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Annuler
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={!selectedCustomerId}
              onClick={handleCloneToEditorClick}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition flex items-center justify-center gap-1.5"
              title="Ouvrir dans l'éditeur pour ajuster les quantités ou les prix avant d'enregistrer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Cloner & Modifier avant d'enregistrer</span>
            </button>

            <button
              type="button"
              disabled={!selectedCustomerId}
              onClick={handleCloneImmediate}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Cloner & Créer le Devis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
