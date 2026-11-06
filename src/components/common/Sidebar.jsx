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
  Inbox,
  Megaphone,
  Workflow,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const NAV_LABELS = {
  dashboard: 'Tableau de bord',
  inbox: 'Boîte de réception',
  customers: 'Prospects & Clients',
  products: 'Produits & Stock',
  quotes: 'Devis',
  invoices: 'Factures & Avoirs',
  pipeline: 'Pipeline commercial',
  marketing: 'Marketing & Leads',
  workflows: 'Automatisations',
  agenda: 'Agenda & Relances',
  interventions: 'Interventions / SAV',
  contracts: 'Contrats & Abonnements',
  settings: 'Paramètres & Cloud',
};

export const NAV_SECTIONS = {
  dashboard: 'Pilotage',
  inbox: 'Pilotage',
  quotes: 'Ventes',
  invoices: 'Ventes',
  pipeline: 'Ventes',
  customers: 'Relation client',
  marketing: 'Relation client',
  workflows: 'Relation client',
  agenda: 'Relation client',
  contracts: 'Relation client',
  products: 'Logistique & SAV',
  interventions: 'Logistique & SAV',
  settings: 'Administration',
};

export function Sidebar({ currentTab, setTab, mobileOpen, onCloseMobile, onOpenAi }) {
  const { quotes, invoices, activities, products, inboxThreads = [], settings } = useCrm();

  const pendingQuotes = quotes.filter((q) => q.status === 'envoye').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'en_retard').length;
  const pendingActivities = activities.filter((a) => !a.completed).length;
  const unreadInbox = inboxThreads.filter((t) => t.unread && t.status !== 'closed').length;
  const lowStockCount = products.filter(
    (p) =>
      (p.type === 'produit' || p.type === 'product') &&
      Number(p.stock ?? 0) <= Number(p.minStockAlert ?? p.minStock ?? 2)
  ).length;

  const sections = [
    {
      title: 'Pilotage',
      items: [
        { id: 'dashboard', icon: LayoutDashboard },
        { id: 'inbox', icon: Inbox, badge: unreadInbox, tone: 'brand' },
      ],
    },
    {
      title: 'Ventes',
      items: [
        { id: 'quotes', icon: FileText, badge: pendingQuotes, tone: 'brand' },
        { id: 'invoices', icon: Receipt, badge: overdueInvoices, tone: 'red' },
        { id: 'pipeline', icon: Kanban },
      ],
    },
    {
      title: 'Relation client',
      items: [
        { id: 'customers', icon: Users },
        { id: 'marketing', icon: Megaphone },
        { id: 'workflows', icon: Workflow },
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
    brand: 'bg-[#7c5cff] text-white',
    red: 'bg-rose-500 text-white',
    amber: 'bg-amber-400 text-[#1a1200]',
  };

  const handleSelectTab = (id) => {
    setTab(id);
    onCloseMobile?.();
  };

  const companyName = settings?.company?.name || 'Lika Sénégal SARL';

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label="Navigation principale"
        className={`fixed lg:sticky top-0 z-50 h-screen w-[264px] shrink-0 pro-sidebar-surface text-[#d4d4dc] border-r border-white/[0.06] flex flex-col select-none transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Marque */}
        <div className="h-[68px] px-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl cf-gradient flex items-center justify-center shadow-lg shadow-[#7c5cff]/30 shrink-0">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 5v14h9" />
              </svg>
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[16px] font-extrabold text-white tracking-tight">
                Lika<span className="text-[#9b87ff]">CRM</span>
              </div>
              <div className="text-[11px] text-[#8d8d9a] font-medium truncate">Sénégal • FCFA (XOF)</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#8d8d9a] hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-1 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#5f5f6b]">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`group w-full flex items-center justify-between gap-2 h-11 pl-1.5 pr-2.5 rounded-2xl text-[13.5px] font-semibold transition-colors ${
                        active
                          ? 'bg-white/[0.07] text-white'
                          : 'text-[#9a9aa6] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            active
                              ? 'bg-[#7c5cff] text-white shadow-md shadow-[#7c5cff]/40'
                              : 'bg-white/[0.04] border border-white/[0.06] text-[#8d8d9a] group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-[16px] h-[16px]" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="truncate">{NAV_LABELS[item.id]}</span>
                      </span>
                      {item.badge > 0 && (
                        <span
                          className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center ${toneClass[item.tone]}`}
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

        {/* Carte Assistant IA */}
        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={() => {
              onOpenAi?.();
              onCloseMobile?.();
            }}
            className="relative w-full overflow-hidden rounded-2xl p-3.5 text-left cf-gradient shadow-lg shadow-[#7c5cff]/25 transition-transform hover:-translate-y-0.5"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15 blur-xl" aria-hidden="true" />
            <div className="relative flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold text-white">Assistant Lika IA</span>
                <span className="block text-[11px] text-white/80 truncate">Analyse, rédaction, relances</span>
              </span>
            </div>
          </button>

          <button
            onClick={() => handleSelectTab('settings')}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl hover:bg-white/[0.04] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {companyName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-white truncate">{companyName}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8d8d9a] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">TVA 18% • OHADA</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#5f5f6b] group-hover:text-white shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
