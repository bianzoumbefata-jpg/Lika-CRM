import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Trash2,
  Edit,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export function InterventionsView() {
  const { interventions, saveIntervention, deleteIntervention, customers, settings } = useCrm();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    customerName: '',
    status: 'a_faire',
    priority: 'moyenne',
    scheduledDate: new Date().toISOString().slice(0, 10),
    durationHours: 2,
    technician: 'Faly Rakoto',
    description: '',
    report: '',
  });

  const filtered = interventions.filter((i) => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return i.title.toLowerCase().includes(s) || i.customerName.toLowerCase().includes(s);
  });

  const handleOpenModal = (intv = null) => {
    if (intv) {
      setSelectedIntervention(intv);
      setFormData(intv);
    } else {
      setSelectedIntervention(null);
      const cust = customers[0];
      setFormData({
        title: '',
        customerId: cust?.id || '',
        customerName: cust?.name || '',
        status: 'a_faire',
        priority: 'moyenne',
        scheduledDate: new Date().toISOString().slice(0, 10),
        durationHours: 2,
        technician: 'Faly Rakoto',
        description: '',
        report: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.customerId) return;

    saveIntervention(formData);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interventions & Support SAV</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
              {interventions.length} interventions
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Planification des interventions techniques, maintenance sur site, tickets SAV et rapports d'intervention.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Planifier une Intervention</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Toutes ({interventions.length})
          </button>
          <button
            onClick={() => setFilterStatus('a_faire')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterStatus === 'a_faire' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            À faire
          </button>
          <button
            onClick={() => setFilterStatus('en_cours')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterStatus === 'en_cours' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFilterStatus('resolu')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterStatus === 'resolu' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Résolues
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par titre, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Interventions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((intv) => (
          <div
            key={intv.id}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {intv.id} • {intv.customerName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{intv.title}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge status={intv.priority} />
                <Badge status={intv.status} />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{intv.description}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(intv.scheduledDate)} ({intv.durationHours}h)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <User className="w-3.5 h-3.5" />
                <span>Tech : {intv.technician}</span>
              </span>
            </div>

            {intv.report && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Rapport d'intervention :</span>
                <p className="text-slate-600 italic">{intv.report}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenModal(intv)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Modifier
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer l'intervention ${intv.id} ?`)) deleteIntervention(intv.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition"
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
              <h2 className="text-base font-black text-slate-900">
                {selectedIntervention ? `Modifier ${selectedIntervention.id}` : 'Planifier une Intervention'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'intervention *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Installation serveur, Dépannage caisse..."
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="resolu">Résolu</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="basse">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date programmée</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durée prévue (heures)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technicien en charge</label>
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rapport / Compte-rendu technique</label>
                <textarea
                  rows="3"
                  placeholder="Travaux réalisés, matériels remplacés..."
                  value={formData.report}
                  onChange={(e) => setFormData({ ...formData, report: e.target.value })}
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
