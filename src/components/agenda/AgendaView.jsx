import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Users,
  Wrench,
  FileText,
  Trash2,
  Search,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

export function AgendaView() {
  const {
    activities,
    saveActivity,
    toggleActivityCompleted,
    deleteActivity,
    customers,
    settings,
  } = useCrm();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    customerName: '',
    type: 'appel',
    description: '',
    dueDate: new Date().toISOString().slice(0, 16),
    assignedTo: settings?.currentUser?.name || 'Alexandre Dupuis',
    completed: false,
  });

  const icons = {
    appel: <Phone className="w-4 h-4 text-blue-600" />,
    email: <Mail className="w-4 h-4 text-purple-600" />,
    reunion: <Users className="w-4 h-4 text-emerald-600" />,
    relance: <Clock className="w-4 h-4 text-rose-600" />,
    intervention: <Wrench className="w-4 h-4 text-amber-600" />,
    note: <FileText className="w-4 h-4 text-slate-600" />,
  };

  const filtered = activities.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return a.title.toLowerCase().includes(s) || a.customerName.toLowerCase().includes(s);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    saveActivity(formData);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Partagé & Actions</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              {activities.filter((a) => !a.completed).length} à traiter
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Historique des interactions clients, planification de rendez-vous, appels et rappels de relances.
          </p>
        </div>

        <button
          onClick={() => {
            const cust = customers[0];
            setFormData({
              title: '',
              customerId: cust?.id || '',
              customerName: cust?.name || '',
              type: 'appel',
              description: '',
              dueDate: new Date().toISOString().slice(0, 16),
              assignedTo: settings?.currentUser?.name || 'Alexandre Dupuis',
              completed: false,
            });
            setModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Action / Rendez-vous</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Toutes ({activities.length})
          </button>
          <button
            onClick={() => setFilterType('appel')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterType === 'appel' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Appels
          </button>
          <button
            onClick={() => setFilterType('reunion')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterType === 'reunion' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rendez-vous
          </button>
          <button
            onClick={() => setFilterType('relance')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterType === 'relance' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Relances
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher une tâche, un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Activities Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Aucune action ou rendez-vous correspondant.
          </div>
        ) : (
          filtered.map((act) => (
            <div
              key={act.id}
              className={`p-4 bg-white rounded-2xl border transition flex items-start gap-4 shadow-2xs ${
                act.completed ? 'opacity-60 bg-slate-50/70 border-slate-200' : 'border-slate-200/80 hover:border-brand-300'
              }`}
            >
              <input
                type="checkbox"
                checked={act.completed}
                onChange={() => toggleActivityCompleted(act.id)}
                className="mt-1 h-5 w-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />

              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {icons[act.type] || icons.note}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-sm font-bold text-slate-900 truncate ${
                      act.completed ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {act.title}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    {formatDate(act.dueDate)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="font-semibold text-brand-700">{act.customerName}</span>
                  <span>•</span>
                  <span>Assigné à : <strong>{act.assignedTo}</strong></span>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{act.description}</p>
                )}
              </div>

              <button
                onClick={() => {
                  if (confirm('Supprimer cette action ?')) deleteActivity(act.id);
                }}
                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h2 className="text-base font-black text-slate-900">Programmer une Action / Tâche</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'action *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Appel de suivi devis, Réunion cadrage..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type d'action</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="appel">Appel Téléphonique</option>
                    <option value="reunion">Rendez-vous / Réunion</option>
                    <option value="relance">Relance Facture / Devis</option>
                    <option value="email">Envoi d'E-mail</option>
                    <option value="intervention">Intervention Technique</option>
                    <option value="note">Note Interne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client concerné</label>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date et Heure</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Objectif</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
