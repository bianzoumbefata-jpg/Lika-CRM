import React, { useState } from 'react';
import {
  Target,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Sparkles,
  Trophy,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { OpportunityFormModal } from './OpportunityFormModal';

export function PipelineKanbanView() {
  const {
    opportunities,
    updateOpportunityStage,
    deleteOpportunity,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [modalOpen, setModalOpen] = useState(false);
  const [oppToEdit, setOppToEdit] = useState(null);

  const stages = [
    { id: 'qualification', title: 'Qualification', defaultProba: 20, color: 'border-slate-300 text-slate-800 bg-slate-100' },
    { id: 'proposition', title: 'Proposition / Devis', defaultProba: 50, color: 'border-blue-300 text-blue-800 bg-blue-100' },
    { id: 'negociation', title: 'Négociation', defaultProba: 80, color: 'border-amber-300 text-amber-800 bg-amber-100' },
    { id: 'gagne', title: 'Gagnée / Signée', defaultProba: 100, color: 'border-emerald-300 text-emerald-800 bg-emerald-100' },
    { id: 'perdu', title: 'Perdue', defaultProba: 0, color: 'border-rose-300 text-rose-800 bg-rose-100' },
  ];

  // Pipeline metrics
  const totalValue = opportunities.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
  const forecastValue = opportunities.reduce(
    (sum, o) => sum + ((Number(o.value) || 0) * (Number(o.probability) || 0)) / 100,
    0
  );

  const handleMoveStage = (oppId, currentStage, direction) => {
    const stageIds = stages.map((s) => s.id);
    const currIndex = stageIds.indexOf(currentStage);
    const nextIndex = currIndex + direction;

    if (nextIndex >= 0 && nextIndex < stageIds.length) {
      const nextStage = stageIds[nextIndex];
      updateOpportunityStage(oppId, nextStage);

      // Trigger confetti celebration if deal was just won!
      if (nextStage === 'gagne') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pipeline des Ventes</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
              {opportunities.length} opportunités
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Suivi visuel des affaires en cours par probabilité de succès et forecast prévisionnel de chiffre d'affaires.
          </p>
        </div>

        <button
          onClick={() => {
            setOppToEdit(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-sm shadow-purple-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Opportunité</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Valeur Totale du Pipeline
            </span>
            <div className="text-xl font-black text-slate-900">
              {formatCurrency(totalValue, currencySymbol, currencyPosition)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Cumul de toutes les affaires</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              CA Prévisionnel Pondéré (Forecast)
            </span>
            <div className="text-xl font-black text-purple-600">
              {formatCurrency(forecastValue, currencySymbol, currencyPosition)}
            </div>
            <span className="text-[10px] text-purple-500 font-semibold mt-0.5 block">
              Pondéré selon probabilité de signature
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Affaires Gagnées ce mois
            </span>
            <div className="text-xl font-black text-emerald-600">
              {opportunities.filter((o) => o.stage === 'gagne').length} deal(s)
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              Taux de conversion global élevé
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage, colIdx) => {
          const colDeals = opportunities.filter((o) => o.stage === stage.id);
          const colSum = colDeals.reduce((sum, o) => sum + (Number(o.value) || 0), 0);

          return (
            <div
              key={stage.id}
              className="bg-slate-100/70 rounded-2xl p-3 flex flex-col min-w-[240px] max-w-xs border border-slate-200/60"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{stage.title}</h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {formatCurrency(colSum, currencySymbol, currencyPosition)}
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[10px] font-black flex items-center justify-center shadow-2xs">
                  {colDeals.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {colDeals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px]">
                    Aucune opportunité
                  </div>
                ) : (
                  colDeals.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition group space-y-2.5"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => {
                            setOppToEdit(opp);
                            setModalOpen(true);
                          }}
                          className="text-xs font-bold text-slate-900 hover:text-purple-600 cursor-pointer leading-tight line-clamp-2"
                        >
                          {opp.title}
                        </h4>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer l'opportunité ${opp.title} ?`)) {
                              deleteOpportunity(opp.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Customer */}
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {opp.customerName}
                      </div>

                      {/* Value & Probability */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="font-black text-slate-900">
                          {formatCurrency(opp.value, currencySymbol, currencyPosition)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            opp.stage === 'gagne'
                              ? 'bg-emerald-50 text-emerald-700'
                              : opp.stage === 'perdu'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {opp.probability}%
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{opp.assignedTo || 'Non assigné'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(opp.expectedCloseDate)}</span>
                        </span>
                      </div>

                      {/* Stage Move Controls */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <button
                          disabled={colIdx === 0}
                          onClick={() => handleMoveStage(opp.id, opp.stage, -1)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition"
                          title="Étape précédente"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Déplacer
                        </span>

                        <button
                          disabled={colIdx === stages.length - 1}
                          onClick={() => handleMoveStage(opp.id, opp.stage, 1)}
                          className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 disabled:opacity-20 transition"
                          title="Étape suivante"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Opportunity Modal */}
      <OpportunityFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        oppToEdit={oppToEdit}
      />
    </div>
  );
}
