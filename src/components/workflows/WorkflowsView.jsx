import React, { useState } from 'react';
import {
  Workflow,
  Layers,
  Zap,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  ArrowRight,
  Users,
  Filter,
  Mail,
  Trash2,
  Sparkles,
  Clock,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function WorkflowsView({ onNavigate }) {
  const {
    workflows = [],
    saveWorkflow,
    toggleWorkflowActive,
    runWorkflowNow,
    deleteWorkflow,
    segments = [],
    saveSegment,
    deleteSegment,
    leads = [],
    customers = [],
    invoices = [],
  } = useCrm();

  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows' | 'segments'

  // Workflow modal
  const [wkfModalOpen, setWkfModalOpen] = useState(false);
  const [wkfForm, setWkfForm] = useState({
    name: '',
    category: 'Acquisition & Marketing',
    trigger: 'Lorsqu\'un nouveau Lead est créé (Score ≥ 70)',
    conditions: 'Ville = Dakar ET Budget estimé ≥ 1 000 000 FCFA',
    actions:
      'Attribuer au commercial senior\nEnvoyer l\'e-mail de bienvenue OHADA\nCréer une tâche de rappel à J+1',
  });

  // Segment modal
  const [segModalOpen, setSegModalOpen] = useState(false);
  const [segForm, setSegForm] = useState({
    name: '',
    type: 'dynamique',
    criteria: 'Ville = Dakar • Température = Chaud',
    targetKey: 'leads_chauds',
    membersCount: 12,
    description: '',
  });

  const handleCreateWorkflow = (e) => {
    e.preventDefault();
    if (!wkfForm.name.trim()) return;
    saveWorkflow(wkfForm);
    setWkfModalOpen(false);
    setWkfForm({
      name: '',
      category: 'Acquisition & Marketing',
      trigger: 'Lorsqu\'un nouveau Lead est créé (Score ≥ 70)',
      conditions: 'Ville = Dakar ET Budget estimé ≥ 1 000 000 FCFA',
      actions:
        'Attribuer au commercial senior\nEnvoyer l\'e-mail de bienvenue OHADA\nCréer une tâche de rappel à J+1',
    });
  };

  const handleCreateSegment = (e) => {
    e.preventDefault();
    if (!segForm.name.trim()) return;
    saveSegment(segForm);
    setSegModalOpen(false);
    setSegForm({
      name: '',
      type: 'dynamique',
      criteria: 'Ville = Dakar • Température = Chaud',
      targetKey: 'leads_chauds',
      membersCount: 12,
      description: '',
    });
  };

  const activeWorkflowsCount = workflows.filter((w) => w.active).length;
  const totalRuns = workflows.reduce((acc, w) => acc + (Number(w.runsCount) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Workflows d'Automatisation & Segments Ciblés
              </h1>
              <span className="px-2 py-0.5 text-[10.5px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                Moteur CRM Automatisé
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automatisez l'attribution des leads, les relances de devis, le recouvrement des factures échues et la segmentation client.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'workflows'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Workflows ({workflows.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('segments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'segments'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Segments ({segments.length})</span>
            </button>
          </div>

          {activeTab === 'workflows' ? (
            <button
              onClick={() => setWkfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Workflow</span>
            </button>
          ) : (
            <button
              onClick={() => setSegModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer un Segment</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: WORKFLOWS */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Workflows Actifs
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {activeWorkflowsCount} / {workflows.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Scénarios en surveillance 24/7
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Exécutions Automatisées
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {totalRuns}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Actions traitées sans effort manuel
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Factures & Devis Surveillés
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {invoices.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Relance Wave / Orange Money auto
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Gain de Temps Équipe
              </div>
              <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
                ~14h / sem
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Qualification & recouvrement OHADA
              </div>
            </div>
          </div>

          {/* Workflow Cards */}
          <div className="space-y-3">
            {workflows.map((wkf) => (
              <div
                key={wkf.id}
                className={`bg-white rounded-xl border transition p-5 shadow-2xs ${
                  wkf.active
                    ? 'border-slate-200/90 hover:border-emerald-300'
                    : 'border-slate-200/60 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {wkf.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {wkf.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          wkf.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            wkf.active ? 'bg-emerald-600' : 'bg-slate-500'
                          }`}
                        />
                        {wkf.active ? 'ACTIF' : 'EN PAUSE'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {wkf.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2 hidden sm:block">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {wkf.runsCount} exécutions • Conv. {wkf.conversionRate}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{wkf.lastRun}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => runWorkflowNow(wkf.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tester / Exécuter</span>
                    </button>

                    <button
                      onClick={() => toggleWorkflowActive(wkf.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        wkf.active
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {wkf.active ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Activer</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => deleteWorkflow(wkf.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Supprimer ce workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Pipeline: Trigger -> Condition -> Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      1. Déclencheur (Trigger)
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {wkf.trigger}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                      2. Conditions de filtrage
                    </div>
                    <div className="text-xs font-semibold text-amber-950">
                      {wkf.conditions}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      3. Actions automatiques ({(wkf.actions || []).length})
                    </div>
                    <ul className="space-y-1 text-xs text-emerald-950">
                      {(wkf.actions || []).map((act, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SEGMENTS DYNAMIQUES */}
      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {seg.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                      Segment {seg.type}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSegment(seg.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900">{seg.name}</h3>
                <p className="text-xs text-slate-600">{seg.description}</p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{seg.criteria}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center">
                    {seg.membersCount}
                  </span>
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800">
                      Contacts qualifiés
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Mis à jour le {seg.updatedAt}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('marketing')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Cibler par E-mail / WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NEW WORKFLOW */}
      {wkfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Créer un Nouveau Workflow Automatisé
              </h3>
              <button
                onClick={() => setWkfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom du Workflow *
                </label>
                <input
                  type="text"
                  required
                  value={wkfForm.name}
                  onChange={(e) => setWkfForm({ ...wkfForm, name: e.target.value })}
                  placeholder="Ex: Relance automatique Grands Comptes Dakar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={wkfForm.category}
                  onChange={(e) =>
                    setWkfForm({ ...wkfForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="Acquisition & Marketing">
                    Acquisition & Marketing
                  </option>
                  <option value="Ventes & Devis">Ventes & Devis</option>
                  <option value="Comptabilité OHADA & Facturation">
                    Comptabilité OHADA & Facturation
                  </option>
                  <option value="Logistique & Encaissement">
                    Logistique & Encaissement
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Déclencheur (Trigger) *
                </label>
                <input
                  type="text"
                  required
                  value={wkfForm.trigger}
                  onChange={(e) =>
                    setWkfForm({ ...wkfForm, trigger: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Conditions
                </label>
                <input
                  type="text"
                  value={wkfForm.conditions}
                  onChange={(e) =>
                    setWkfForm({ ...wkfForm, conditions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Actions automatiques (1 action par ligne)
                </label>
                <textarea
                  rows={3}
                  value={wkfForm.actions}
                  onChange={(e) =>
                    setWkfForm({ ...wkfForm, actions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWkfModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Activer le Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SEGMENT */}
      {segModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Nouveau Segment Dynamique
              </h3>
              <button
                onClick={() => setSegModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSegment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom du Segment *
                </label>
                <input
                  type="text"
                  required
                  value={segForm.name}
                  onChange={(e) => setSegForm({ ...segForm, name: e.target.value })}
                  placeholder="Ex: PME Agro-Industrie Thiès & Diamniadio"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Critères de filtrage *
                </label>
                <input
                  type="text"
                  required
                  value={segForm.criteria}
                  onChange={(e) =>
                    setSegForm({ ...segForm, criteria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={segForm.description}
                  onChange={(e) =>
                    setSegForm({ ...segForm, description: e.target.value })
                  }
                  placeholder="Objectif marketing ou commercial de ce segment..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSegModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Enregistrer le Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
