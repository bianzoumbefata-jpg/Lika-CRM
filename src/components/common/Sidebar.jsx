import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  Kanban,
  Calendar,
  Wrench,
  FileCheck2,
  Settings,
  X,
  Cloud,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const NAV_LABELS = {
  dashboard: 'Tableau de bord',
  customers: 'Prospects & Clients',
  products: 'Produits & Stock',
  quotes: 'Devis',
  invoices: 'Factures & Avoirs',
  pipeline: 'Pipeline commercial',
  agenda: 'Agenda & Relances',
  interventions: 'Interventions / SAV',
  contracts: 'Contrats & Abonnements',
  settings: 'Paramètres & Cloud',
};

export const NAV_SECTIONS = {
  dashboard: 'Pilotage',
  quotes: 'Gestion commerciale',
  invoices: 'Gestion commerciale',
  pipeline: 'Gestion commerciale',
  customers: 'Relation client',
  agenda: 'Relation client',
  contracts: 'Relation client',
  products: 'Logistique & SAV',
  interventions: 'Logistique & SAV',
  settings: 'Administration',
};

export function Sidebar({ currentTab, setTab, mobileOpen, onCloseMobile }) {
  const { quotes, invoices, activities, products, settings } = useCrm();

  const pendingQuotes = quotes.filter((q) => q.status === 'envoye').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'en_retard').length;
  const pendingActivities = activities.filter((a) => !a.completed).length;
  const lowStockCount = products.filter(
    (p) =>
      (p.type === 'produit' || p.type === 'product') &&
      Number(p.stock ?? 0) <= Number(p.minStockAlert ?? p.minStock ?? 2)
  ).length;

  const sections = [
    {
      title: 'Pilotage',
      items: [{ id: 'dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Gestion commerciale',
      items: [
        { id: 'quotes', icon: FileText, badge: pendingQuotes, tone: 'blue' },
        { id: 'invoices', icon: Receipt, badge: overdueInvoices, tone: 'red' },
        { id: 'pipeline', icon: Kanban },
      ],
    },
    {
      title: 'Relation client',
      items: [
        { id: 'customers', icon: Users },
        { id: 'agenda', icon: Calendar, badge: pendingActivities, tone: 'amber' },
        { id: 'contracts', icon: FileCheck2 },
      ],
    },
    {
      title: 'Logistique & SAV',
      items: [
        { id: 'products', icon: Package, badge: lowStockCount, tone: 'amber' },
        { id: 'interventions', icon: Wrench },
      ],
    },
    {
      title: 'Administration',
      items: [{ id: 'settings', icon: Settings }],
    },
  ];

  const toneClass = {
    blue: 'bg-brand-500/20 text-brand-300 border border-brand-400/20',
    red: 'bg-rose-500/20 text-rose-300 border border-rose-400/20',
    amber: 'bg-amber-500/20 text-amber-300 border border-amber-400/20',
  };

  const handleSelectTab = (id) => {
    setTab(id);
    onCloseMobile?.();
  };

  const companyName = settings?.company?.name || 'OpenFlex Sénégal SARL';
  const companyNinea = settings?.company?.siret || 'SN-DKR-2026-B-1458';

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-[256px] shrink-0 pro-sidebar-surface text-slate-300 border-r border-white/[0.07] flex flex-col select-none transition-all duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-950/60 ring-1 ring-white/15 shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3z" strokeLinejoin="round" />
                <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" strokeLinejoin="round" opacity="0.65" />
              </svg>
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14.5px] font-bold text-white tracking-tight">OpenFlex</span>
                <span className="px-1.5 py-0.2 text-[9.5px] font-semibold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-400/25 rounded">
                  ERP
                </span>
              </div>
              <div className="text-[10.5px] text-slate-400 font-medium truncate">Édition Sénégal • FCFA</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`group relative w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/5 text-white ring-1 ring-brand-500/30 shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand-400 shadow-[0_0_8px_#60a5fa]" />
                      )}
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-[16px] h-[16px] shrink-0 transition-colors ${
                            active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                          strokeWidth={1.9}
                        />
                        <span className="truncate">{NAV_LABELS[item.id]}</span>
                      </span>
                      {item.badge > 0 && (
                        <span
                          className={`min-w-[20px] h-[18px] px-1.5 rounded-md text-[10px] font-semibold tabular-nums flex items-center justify-center ${toneClass[item.tone]}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Workspace & Cloud Status Card */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          <button
            onClick={() => handleSelectTab('settings')}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {companyName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-slate-100 truncate">{companyName}</div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">TVA 18% • FCFA (XOF)</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
          </button>

          <div className="flex items-center justify-between px-2 py-1 text-[10.5px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3 h-3 text-brand-400" />
              <span>Base SQLite + Cloud Sync</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">v2.5 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
}
