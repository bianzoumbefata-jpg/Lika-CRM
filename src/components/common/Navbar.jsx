import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  Receipt,
  UserPlus,
  Target,
  Menu,
  Check,
  Building2,
  Eye,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { NAV_LABELS, NAV_SECTIONS } from './Sidebar';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

const ROLE_LABELS = { admin: 'Administrateur', manager: 'Directeur Commercial', commercial: 'Commercial' };

export function Navbar({
  currentTab,
  onOpenSearch,
  onOpenQuickAction,
  onToggleMobileMenu,
  onNavigate,
}) {
  const {
    settings,
    switchUser,
    quotes,
    invoices,
    readNotifications = [],
    markReadNotificationsSeen,
  } = useCrm();
  const [userOpen, setUserOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const userRef = useRef(null);
  const quickRef = useRef(null);
  const bellRef = useRef(null);
  useClickOutside(userRef, () => setUserOpen(false));
  useClickOutside(quickRef, () => setQuickOpen(false));
  useClickOutside(bellRef, () => setBellOpen(false));

  const currentUser = settings?.currentUser || { name: 'Admin', role: 'admin', avatar: 'AD' };
  const users = settings?.users || [];

  const pendingQuotes = quotes.filter((q) => q.status === 'envoye');
  const overdueInvoices = invoices.filter((i) => i.status === 'en_retard');
  const unreadReadReceipts = readNotifications.filter((n) => n.unread);
  const totalAlerts =
    pendingQuotes.length + overdueInvoices.length + unreadReadReceipts.length;

  const sectionLabel = NAV_SECTIONS[currentTab] || 'Espace de travail';
  const pageLabel = NAV_LABELS[currentTab] || 'Tableau de bord';

  const quickItems = [
    { id: 'new_quote', label: 'Nouveau devis client', desc: 'Devis chiffré en FCFA', icon: FileText },
    { id: 'new_invoice', label: 'Nouvelle facture', desc: 'Facture TVA 18% + Cachet numérique', icon: Receipt },
    { id: 'new_customer', label: 'Nouveau client / prospect', desc: 'Fiche société NINEA / RCCM', icon: UserPlus },
    { id: 'new_opportunity', label: 'Nouvelle opportunité', desc: 'Affaire dans le pipeline', icon: Target },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 max-w-[1440px] mx-auto">
        {/* Left: Breadcrumb navigation */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-[12.5px] min-w-0">
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition truncate"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{sectionLabel}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{pageLabel}</span>
          </nav>
        </div>

        {/* Center: Command search */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full h-8 flex items-center justify-between px-3 text-[12.5px] text-slate-400 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-md transition shadow-2xs"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Rechercher un client, devis, facture, article…</span>
            </span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded text-slate-500 shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications, Quick Actions & User */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications (Email Read Receipts + Overdue Invoices + Quotes) */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => {
                const next = !bellOpen;
                setBellOpen(next);
                if (next && unreadReadReceipts.length > 0) {
                  markReadNotificationsSeen?.();
                }
              }}
              className="relative h-8 w-8 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200/70 flex items-center justify-center transition"
              title="Notifications d'ouverture d'e-mails et échéances"
            >
              <Bell className="w-[16px] h-[16px]" />
              {totalAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {totalAlerts}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-88 bg-white rounded-lg shadow-xl border border-slate-200/90 z-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-800">
                    Centre de notifications & Accusés de lecture
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700">
                    {readNotifications.length} lecture(s)
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto text-[12.5px] divide-y divide-slate-100">
                  {readNotifications.length === 0 && totalAlerts === 0 && (
                    <div className="px-4 py-6 text-center text-slate-400">
                      Aucune alerte en attente.
                    </div>
                  )}

                  {/* Real-time Email Opened Notifications */}
                  {readNotifications.slice(0, 6).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        setBellOpen(false);
                        onNavigate?.('agenda');
                      }}
                      className="w-full text-left px-4 py-2.5 bg-emerald-50/50 hover:bg-emerald-50 flex gap-2.5 transition"
                    >
                      <span className="mt-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Eye className="w-3 h-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-bold text-emerald-950 block truncate">
                          📬 Mail lu par {notif.recipientCompany}
                        </span>
                        <span className="block text-slate-600 text-[11.5px] truncate">
                          « {notif.subject} »
                        </span>
                        <span className="block font-mono text-[10.5px] text-emerald-700 mt-0.5">
                          Ouvert à {notif.openedAt} ({notif.openCount} fois)
                        </span>
                      </span>
                    </button>
                  ))}

                  {overdueInvoices.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        setBellOpen(false);
                        onNavigate?.('invoices');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex gap-2.5 transition"
                    >
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          Facture <span className="font-mono">{i.id}</span> échue
                        </span>
                        <span className="block text-slate-500 text-[11.5px] truncate">{i.customerName}</span>
                      </span>
                    </button>
                  ))}
                  {pendingQuotes.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setBellOpen(false);
                        onNavigate?.('quotes');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex gap-2.5 transition"
                    >
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      <span className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          Devis <span className="font-mono">{q.id}</span> en attente
                        </span>
                        <span className="block text-slate-500 text-[11.5px] truncate">{q.customerName}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Button */}
          <div className="relative" ref={quickRef}>
            <button
              onClick={() => setQuickOpen(!quickOpen)}
              className="h-8 flex items-center gap-1.5 px-3 text-[12.5px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-2xs transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouveau</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {quickOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200/90 py-1.5 z-50">
                <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Création rapide
                </div>
                {quickItems.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setQuickOpen(false);
                        onOpenQuickAction(q.id);
                      }}
                      className="w-full flex items-start gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-left transition"
                    >
                      <div className="p-1.5 rounded-md bg-brand-50 text-brand-600 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-slate-800 leading-tight">{q.label}</div>
                        <div className="text-[11px] text-slate-400">{q.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px h-5 bg-slate-200 mx-1" />

          {/* User Switcher */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserOpen(!userOpen)}
              className="h-9 flex items-center gap-2 pl-1 pr-2 rounded-md hover:bg-slate-100/80 transition"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-600 to-brand-800 text-white font-semibold text-[11px] flex items-center justify-center shadow-2xs">
                {currentUser.avatar || 'AD'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-[12px] font-semibold text-slate-800">{currentUser.name}</div>
                <div className="text-[10.5px] text-slate-500">{ROLE_LABELS[currentUser.role] || currentUser.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200/90 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[12.5px] font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                </div>
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Compte actif
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setUserOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-[12.5px] text-left hover:bg-slate-50 transition"
                  >
                    <span>
                      <span className={u.id === currentUser.id ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                        {u.name}
                      </span>
                      <span className="block text-[10.5px] text-slate-400">{ROLE_LABELS[u.role] || u.role}</span>
                    </span>
                    {u.id === currentUser.id && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
