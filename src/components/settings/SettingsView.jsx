import React, { useState } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Users,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  CreditCard,
  FileText,
  Smartphone,
  QrCode,
  Trash2,
  Image,
  Database,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { CloudDatabaseTab } from './CloudDatabaseTab';

export function SettingsView() {
  const {
    settings,
    updateSettings,
    resetDatabase,
    restoreBackup,
    data,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'financials' | 'users' | 'backup'
  const [companyData, setCompanyData] = useState(settings?.company || {});
  const [financialsData, setFinancialsData] = useState(settings?.financials || {});

  const handleSaveCompany = (e) => {
    e.preventDefault();
    updateSettings({ company: companyData });
  };

  const handleQrUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image sélectionnée est trop volumineuse (taille maximum 2 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCompanyData((prev) => ({
        ...prev,
        [field]: event.target?.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFinancials = (e) => {
    e.preventDefault();
    updateSettings({ financials: financialsData });
  };

  // 1-Click Backup Download
  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openflex-crm-sauvegarde-senegal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Restore from File
  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.customers && parsed.products && parsed.quotes && parsed.invoices) {
          if (confirm('Êtes-vous certain de vouloir restaurer cette sauvegarde ? Les données actuelles seront remplacées.')) {
            restoreBackup(parsed);
          }
        } else {
          alert('Format de sauvegarde invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paramètres du CRM</h1>
        <p className="text-sm text-slate-500">
          Personnalisation de votre entreprise au Sénégal, devises en Franc CFA, taxes (TVA 18%), utilisateurs et sauvegardes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'company'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Fiche Société (NINEA, RCCM, Wave)</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'financials'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Franc CFA & Taxes (TVA 18%)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Équipe & Rôles</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cloud'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base de Données En Ligne (Cloud & Wi-Fi)</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Sauvegardes & Restauration</span>
        </button>
      </div>

      {/* Tab: Company Info Senegal */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Identité de l'Entreprise au Sénégal</h3>
              <p className="text-xs text-slate-400">Ces informations figureront sur l'en-tête de vos devis et factures</p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom Commercial</label>
              <input
                type="text"
                value={companyData.name || ''}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Raison Sociale / Forme Juridique</label>
              <input
                type="text"
                value={companyData.legalName || ''}
                onChange={(e) => setCompanyData({ ...companyData, legalName: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Géographique</label>
              <input
                type="text"
                value={companyData.address || ''}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={companyData.city || 'Dakar'}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={companyData.country || 'Sénégal'}
                  onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Fixe</label>
              <input
                type="text"
                value={companyData.phone || ''}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Mobile Pro</label>
              <input
                type="text"
                value={companyData.mobile || ''}
                onChange={(e) => setCompanyData({ ...companyData, mobile: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Legal Numbers Senegal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Identifiants Fiscaux & Administratifs (Sénégal)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NINEA *</label>
                <input
                  type="text"
                  value={companyData.ninea || ''}
                  onChange={(e) => setCompanyData({ ...companyData, ninea: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">RCCM Sénégal *</label>
                <input
                  type="text"
                  value={companyData.rccm || ''}
                  onChange={(e) => setCompanyData({ ...companyData, rccm: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Centre Fiscal (COFI)</label>
                <input
                  type="text"
                  value={companyData.cofi || ''}
                  onChange={(e) => setCompanyData({ ...companyData, cofi: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Banking coordinates & Mobile Money Senegal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Coordonnées Bancaires & Mobile Money Sénégal
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Banque Partenaire</label>
                <input
                  type="text"
                  placeholder="CBAO / SGBS / Ecobank..."
                  value={companyData.bankName || ''}
                  onChange={(e) => setCompanyData({ ...companyData, bankName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">IBAN / RIB Sénégal</label>
                <input
                  type="text"
                  value={companyData.iban || ''}
                  onChange={(e) => setCompanyData({ ...companyData, iban: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Comptes Wave / Orange Money / Free Money acceptés
                </label>
                <input
                  type="text"
                  placeholder="Wave : +221 77 ... / Orange Money : +221 78 ..."
                  value={companyData.mobileMoney || ''}
                  onChange={(e) => setCompanyData({ ...companyData, mobileMoney: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Dedicated Wave & Orange Money QR Code Settings */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Espace Codes QR Wave & Orange Money (Devis & Factures)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Permet à vos clients de flasher le QR code directement sur les devis et factures pour vous payer
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={companyData.showQrCodesOnDocuments !== false}
                  onChange={(e) => setCompanyData({ ...companyData, showQrCodesOnDocuments: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">Activer sur Devis & Factures</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wave QR Setup */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#1dc4fe]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#007cb8] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1dc4fe]"></span>
                    Paiement Wave Sénégal
                  </span>
                  <span className="text-[10px] bg-[#1dc4fe]/10 text-[#007cb8] px-2 py-0.5 rounded-full font-bold">
                    Sans commission
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro Wave du Compte Récepteur
                  </label>
                  <input
                    type="text"
                    value={companyData.waveNumber || companyData.mobile || '+221 77 650 80 90'}
                    onChange={(e) => setCompanyData({ ...companyData, waveNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Image du QR Code Wave (Sticker / Logo officiel)
                  </label>
                  {companyData.waveQrImage ? (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={companyData.waveQrImage}
                        alt="QR Wave"
                        className="w-16 h-16 object-contain rounded-lg border bg-white"
                      />
                      <div className="flex-1 text-[11px]">
                        <span className="text-emerald-600 font-bold block">✓ QR Wave personnalisé actif</span>
                        <button
                          type="button"
                          onClick={() => setCompanyData({ ...companyData, waveQrImage: '' })}
                          className="mt-1 text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 text-[10px]"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer l'image (repasser au QR auto)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#1dc4fe]/40 rounded-xl cursor-pointer hover:bg-[#1dc4fe]/5 transition">
                        <Upload className="w-5 h-5 text-[#007cb8] mb-1" />
                        <span className="text-[11px] font-bold text-slate-700">Téléverser mon QR Sticker Wave</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG (max 2 Mo) - Sinon QR dynamique automatique</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQrUpload('waveQrImage', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Orange Money QR Setup */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#ff7900]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#c04c00] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff7900]"></span>
                    Paiement Orange Money Sénégal
                  </span>
                  <span className="text-[10px] bg-[#ff7900]/10 text-[#c04c00] px-2 py-0.5 rounded-full font-bold">
                    #144# / App
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro Orange Money / Code Marchand
                  </label>
                  <input
                    type="text"
                    value={companyData.orangeMoneyNumber || companyData.mobile || '+221 77 650 80 90'}
                    onChange={(e) => setCompanyData({ ...companyData, orangeMoneyNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Image du QR Code Orange Money (Sticker officiel)
                  </label>
                  {companyData.orangeMoneyQrImage ? (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={companyData.orangeMoneyQrImage}
                        alt="QR Orange Money"
                        className="w-16 h-16 object-contain rounded-lg border bg-white"
                      />
                      <div className="flex-1 text-[11px]">
                        <span className="text-emerald-600 font-bold block">✓ QR Orange Money personnalisé actif</span>
                        <button
                          type="button"
                          onClick={() => setCompanyData({ ...companyData, orangeMoneyQrImage: '' })}
                          className="mt-1 text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 text-[10px]"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer l'image (repasser au QR auto)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#ff7900]/40 rounded-xl cursor-pointer hover:bg-[#ff7900]/5 transition">
                        <Upload className="w-5 h-5 text-[#c04c00] mb-1" />
                        <span className="text-[11px] font-bold text-slate-700">Téléverser mon QR Sticker Orange Money</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG (max 2 Mo) - Sinon QR dynamique automatique</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQrUpload('orangeMoneyQrImage', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legal notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mentions Légales de Pied de Page (Devis & Factures)
            </label>
            <textarea
              rows="3"
              value={companyData.footerTerms || ''}
              onChange={(e) => setCompanyData({ ...companyData, footerTerms: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>
        </form>
      )}

      {/* Tab: Financials (FCFA & TVA 18%) */}
      {activeTab === 'financials' && (
        <form onSubmit={handleSaveFinancials} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Paramètres Monétaires & Fiscaux (Sénégal)</h3>
              <p className="text-xs text-slate-400">Configurez la devise principale en Franc CFA et la TVA légale à 18%</p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Devise Principale</label>
              <select
                value={financialsData.currencySymbol || 'FCFA'}
                onChange={(e) => setFinancialsData({ ...financialsData, currencySymbol: e.target.value })}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5"
              >
                <option value="FCFA">Franc CFA (FCFA / XOF)</option>
                <option value="€">Euro (€)</option>
                <option value="$">Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Position du Symbole</label>
              <select
                value={financialsData.currencyPosition || 'after'}
                onChange={(e) => setFinancialsData({ ...financialsData, currencyPosition: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5"
              >
                <option value="after">Après le montant (ex: 1 500 000 FCFA)</option>
                <option value="before">Avant le montant (ex: FCFA 1 500 000)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taux de TVA Standard Sénégal (%)</label>
              <input
                type="number"
                value={financialsData.defaultVatRate || 18}
                onChange={(e) => setFinancialsData({ ...financialsData, defaultVatRate: Number(e.target.value) })}
                className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Validité par défaut des Devis (jours)
              </label>
              <input
                type="number"
                value={financialsData.defaultQuoteValidityDays || 30}
                onChange={(e) =>
                  setFinancialsData({ ...financialsData, defaultQuoteValidityDays: Number(e.target.value) })
                }
                className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Délai de Règlement par défaut (jours)
              </label>
              <input
                type="number"
                value={financialsData.defaultPaymentTermsDays || 30}
                onChange={(e) =>
                  setFinancialsData({ ...financialsData, defaultPaymentTermsDays: Number(e.target.value) })
                }
                className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Équipe & Rôles Utilisateurs</h3>
            <p className="text-xs text-slate-400">
              Gérez les collaborateurs et leurs droits d'accès au CRM (Administrateur, Commercial, Manager)
            </p>
          </div>

          <div className="space-y-3">
            {settings?.users?.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{u.name}</h4>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : u.role === 'manager'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Actif
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Cloud Database & Remote Access */}
      {activeTab === 'cloud' && <CloudDatabaseTab />}

      {/* Tab: Backup & Maintenance */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Sauvegarde Complète & Export JSON</h3>
            <p className="text-xs text-slate-500">
              Téléchargez une copie intégrale de toutes vos données : clients, produits, stock, devis, factures, encaissements et paramètres.
            </p>

            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la Sauvegarde Complète (JSON)</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Restauration depuis un fichier</h3>
            <p className="text-xs text-slate-500">
              Restaurez vos données sauvegardées à partir d'un fichier JSON exporté précédemment.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer transition shadow-2xs">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Sélectionner un fichier de sauvegarde (.json)</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-900">Zone de Réinitialisation (Jeu d'Essai Sénégal)</h3>
            <p className="text-xs text-rose-700">
              Rétablit l'application avec les données d'essai initiales de démonstration configurées pour le Sénégal (clients d'exemple, devis en FCFA, factures, stock matériel et services).
            </p>

            <button
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser toutes les données aux valeurs de démo Sénégal (FCFA) ?')) {
                  resetDatabase();
                }
              }}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser aux Données Initiales Sénégal (FCFA)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
