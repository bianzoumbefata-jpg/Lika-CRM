import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2, User, Phone, Mail, Globe, MapPin, Percent, Smartphone } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function CustomerFormModal({ isOpen, onClose, customerToEdit, defaultType = 'prospect' }) {
  const { saveCustomer } = useCrm();

  const [formData, setFormData] = useState({
    name: '',
    type: defaultType,
    category: 'PME',
    ninea: '', // NINEA Sénégal
    rccm: '',  // RCCM Sénégal
    cofi: '',  // Centre des Services Fiscaux
    vatNumber: '',
    email: '',
    phone: '',
    mobile: '', // Wave / Orange Money
    website: '',
    address: '',
    postalCode: '10200',
    city: 'Dakar',
    region: 'Dakar',
    country: 'Sénégal',
    defaultDiscount: 0,
    notes: '',
    contacts: [],
    customFields: [
      { label: "Secteur", value: "" },
      { label: "Source", value: "" },
    ],
  });

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        ...customerToEdit,
        contacts: customerToEdit.contacts || [],
        customFields: customerToEdit.customFields || [],
      });
    } else {
      setFormData({
        name: '',
        type: defaultType,
        category: 'PME',
        ninea: '',
        rccm: '',
        cofi: 'CSF Dakar Plateau',
        vatNumber: '',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        address: '',
        postalCode: '10200',
        city: 'Dakar',
        region: 'Dakar',
        country: 'Sénégal',
        defaultDiscount: 0,
        notes: '',
        contacts: [
          { id: `CTC-${Date.now()}`, name: '', role: 'Contact Principal', email: '', phone: '', isPrimary: true }
        ],
        customFields: [
          { label: "Secteur", value: "" },
          { label: "Source", value: "" },
        ],
      });
    }
  }, [customerToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { id: `CTC-${Date.now()}`, name: '', role: '', email: '', phone: '', isPrimary: false },
      ],
    }));
  };

  const handleUpdateContact = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.contacts];
      updated[index][field] = value;
      return { ...prev, contacts: updated };
    });
  };

  const handleRemoveContact = (index) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    saveCustomer(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {customerToEdit ? `Modifier : ${customerToEdit.name}` : `Créer une fiche ${formData.type === 'prospect' ? 'Prospect' : 'Client'}`}
            </h2>
            <p className="text-xs text-slate-500">
              Coordonnées, NINEA, RCCM Sénégal, Wave/Orange Money et carnet de contacts
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type de Tiers *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="prospect">Prospect</option>
                <option value="client">Client Confirmé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie / Segment</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="PME">PME / GIE / TPE</option>
                <option value="Grand Compte">Grand Compte / Multinationale</option>
                <option value="Particulier">Particulier / Commerçant</option>
                <option value="VIP">VIP / Partenaire Privilégié</option>
                <option value="Revendeur">Revendeur / Distributeur</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remise accordée (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultDiscount}
                  onChange={(e) => setFormData({ ...formData, defaultDiscount: Number(e.target.value) })}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Company Main Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Entreprise / Raison Sociale
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Raison Sociale / Nom Commercial *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dakar Digital Services, Sédima Agro, Transatlantique..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="contact@entreprise.sn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Fixe</label>
                <input
                  type="text"
                  placeholder="+221 33 820 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Wave / Orange Money)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="+221 77 / 78 / 76..."
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none"
                  />
                  <Smartphone className="w-4 h-4 text-emerald-600 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Site Web</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Géographique</label>
                <input
                  type="text"
                  placeholder="Rue, quartier, immeuble, zone industrielle..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="Dakar">Dakar</option>
                  <option value="Thiès">Thiès</option>
                  <option value="Touba">Touba</option>
                  <option value="Saint-Louis">Saint-Louis</option>
                  <option value="Mbour">Mbour</option>
                  <option value="Kaolack">Kaolack</option>
                  <option value="Ziguinchor">Ziguinchor</option>
                  <option value="Rufisque">Rufisque</option>
                  <option value="Diourbel">Diourbel</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Legal Identifiers Senegal (NINEA / RCCM / COFI) */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Identifiants Légaux Sénégal (Facturation Normalisée)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NINEA *</label>
                <input
                  type="text"
                  placeholder="ex: 008429182 2V3"
                  value={formData.ninea || ''}
                  onChange={(e) => setFormData({ ...formData, ninea: e.target.value })}
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">RCCM Sénégal</label>
                <input
                  type="text"
                  placeholder="ex: SN.DKR.2023.B.14820"
                  value={formData.rccm || ''}
                  onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Centre Fiscal (COFI)</label>
                <input
                  type="text"
                  placeholder="ex: CSF Dakar Plateau, CSF Grand Dakar..."
                  value={formData.cofi || ''}
                  onChange={(e) => setFormData({ ...formData, cofi: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contacts Multiples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Carnet de Contacts ({formData.contacts.length})
              </h3>
              <button
                type="button"
                onClick={handleAddContact}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un contact
              </button>
            </div>

            <div className="space-y-3">
              {formData.contacts.map((ctc, idx) => (
                <div
                  key={ctc.id || idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Nom & Prénom *"
                      value={ctc.name}
                      onChange={(e) => handleUpdateContact(idx, 'name', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Fonction (DG, DSI, Achats...)"
                      value={ctc.role}
                      onChange={(e) => handleUpdateContact(idx, 'role', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email professionnel"
                      value={ctc.email}
                      onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tél / WhatsApp"
                      value={ctc.phone}
                      onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                    {formData.contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Internes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Historique commercial</label>
            <textarea
              rows="3"
              placeholder="Informations sur le client, habitudes de commande, historique..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-500/20 transition active:scale-95"
            >
              {customerToEdit ? 'Enregistrer les modifications' : 'Créer la fiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
