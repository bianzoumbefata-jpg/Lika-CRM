import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Mail,
  MapPin,
  ChevronRight,
  CheckCircle,
  FileText,
  Phone,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { exportToCSV, parseCSV } from '../../utils/csvExporter';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';

export function CustomersView({ onOpenQuote, onOpenInvoice, onCreateQuoteForCustomer }) {
  const { customers, convertProspectToClient, saveCustomer } = useCrm();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'clients' | 'prospects'
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [defaultCreateType, setDefaultCreateType] = useState('prospect');

  // Filter list
  const filteredCustomers = customers.filter((c) => {
    if (activeTab === 'clients' && c.type !== 'client') return false;
    if (activeTab === 'prospects' && c.type !== 'prospect') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.siret?.toLowerCase().includes(q) ||
      c.nif?.toLowerCase().includes(q) ||
      c.contacts?.some((ctc) => ctc.name.toLowerCase().includes(q))
    );
  });

  const totalClients = customers.filter((c) => c.type === 'client').length;
  const totalProspects = customers.filter((c) => c.type === 'prospect').length;
  const totalContacts = customers.reduce((sum, c) => sum + (c.contacts?.length || 0), 0);

  const handleExportCSV = () => {
    const rows = customers.map((c) => ({
      ID: c.id,
      Type: c.type,
      Raison_Sociale: c.name,
      Categorie: c.category,
      RCCM: c.siret,
      NINEA: c.nif,
      COFI: c.stat,
      Forme_Juridique: c.rcs,
      Email: c.email,
      Telephone: c.phone,
      Ville: c.city,
      Pays: c.country,
      Remise_Pourcent: c.defaultDiscount,
    }));
    exportToCSV(`openflex-crm-clients-prospects-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const records = parseCSV(text);
      records.forEach((r) => {
        if (r.Raison_Sociale || r.name) {
          saveCustomer({
            name: r.Raison_Sociale || r.name,
            type: r.Type === 'client' ? 'client' : 'prospect',
            category: r.Categorie || 'PME',
            siret: r.RCCM || r.SIRET || '',
            nif: r.NINEA || r.NIF || '',
            stat: r.COFI || r.STAT || '',
            rcs: r.Forme_Juridique || r.RCS || '',
            email: r.Email || '',
            phone: r.Telephone || '',
            city: r.Ville || 'Dakar',
            country: r.Pays || 'Sénégal',
            defaultDiscount: Number(r.Remise_Pourcent) || 0,
            contacts: [],
          });
        }
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              Annuaire Clients & Prospects
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
              {customers.length} comptes
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Gestion des fiches entreprises (NINEA, RCCM, COFI), interlocuteurs privilégiés et remises commerciales.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="pro-btn-secondary cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Importer CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button onClick={handleExportCSV} className="pro-btn-secondary">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          <button
            onClick={() => {
              setCustomerToEdit(null);
              setDefaultCreateType('prospect');
              setFormModalOpen(true);
            }}
            className="pro-btn-brand"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau tiers</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Portefeuille global
          </span>
          <div className="text-[22px] font-bold text-slate-900 font-mono mt-1">
            {customers.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Entreprises & organisations</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Clients actifs
          </span>
          <div className="text-[22px] font-bold text-emerald-600 font-mono mt-1">
            {totalClients}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Comptes facturés en FCFA</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Prospects qualifiés
          </span>
          <div className="text-[22px] font-bold text-amber-600 font-mono mt-1">
            {totalProspects}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">En phase de négociation</span>
        </div>

        <div className="pro-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
            Interlocuteurs directs
          </span>
          <div className="text-[22px] font-bold text-brand-600 font-mono mt-1">
            {totalContacts}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Contacts WhatsApp & E-mail</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="pro-card p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-[12px] font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tous ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'clients' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Clients ({totalClients})
          </button>
          <button
            onClick={() => setActiveTab('prospects')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'prospects' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Prospects ({totalProspects})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par raison sociale, NINEA, ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[12.5px] bg-slate-50/90 border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="pro-card overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-[13.5px] font-semibold text-slate-700">Aucune fiche tiers trouvée</h3>
            <p className="text-[12px] text-slate-400 mt-1">
              Essayez un autre mot-clé ou créez une nouvelle fiche client/prospect.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="pro-table-header">
                  <th className="py-3 px-4">Raison sociale & Interlocuteur</th>
                  <th className="py-3 px-4">Statut & Segment</th>
                  <th className="py-3 px-4">Coordonnées</th>
                  <th className="py-3 px-4">Identifiants (RCCM / NINEA)</th>
                  <th className="py-3 px-4 text-center">Remise</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const primaryContact =
                    cust.contacts?.find((c) => c.isPrimary) || cust.contacts?.[0];
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/90 transition group cursor-pointer"
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      {/* Name & Primary Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-[12px] flex items-center justify-center shrink-0 group-hover:bg-brand-50 group-hover:text-brand-700 transition">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {primaryContact
                                ? `${primaryContact.name} • ${primaryContact.role}`
                                : `${cust.contacts?.length || 0} contact(s)`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                              cust.type === 'client'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-amber-50 text-amber-700 border-amber-200/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cust.type === 'client' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {cust.type === 'client' ? 'Client' : 'Prospect'}
                          </span>
                          <span className="text-[11.5px] font-medium text-slate-500">
                            {cust.category}
                          </span>
                        </div>
                      </td>

                      {/* Contact details */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {cust.phone && (
                            <div className="flex items-center gap-1.5 text-[11.5px] font-mono text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cust.phone}</span>
                            </div>
                          )}
                          {cust.city && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{cust.city}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Legal IDs */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11.5px] font-mono whitespace-nowrap">
                        <div>RCCM : {cust.siret || '-'}</div>
                        <div className="text-[10.5px] text-slate-400">NINEA : {cust.nif || '-'}</div>
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-semibold text-slate-700">
                          {cust.defaultDiscount > 0 ? `${cust.defaultDiscount}%` : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onCreateQuoteForCustomer(cust)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition border border-slate-200/90 flex items-center gap-1"
                            title="Créer un devis pour ce tiers"
                          >
                            <FileText className="w-3 h-3 text-brand-600" />
                            <span>Devis +</span>
                          </button>

                          {cust.type === 'prospect' && (
                            <button
                              onClick={() => convertProspectToClient(cust.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition border border-emerald-200/80 flex items-center gap-1"
                              title="Convertir en client"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Convertir</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
          onEdit={(cust) => {
            setSelectedCustomer(null);
            setCustomerToEdit(cust);
            setFormModalOpen(true);
          }}
          onCreateQuoteForCustomer={(cust) => {
            setSelectedCustomer(null);
            onCreateQuoteForCustomer(cust);
          }}
          onOpenQuote={onOpenQuote}
          onOpenInvoice={onOpenInvoice}
        />
      )}

      {/* Form Modal (Create / Edit) */}
      <CustomerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        customerToEdit={customerToEdit}
        defaultType={defaultCreateType}
      />
    </div>
  );
}
