import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  UserX,
  FolderOpen,
  Archive,
  Send,
  StickyNote,
  Plus,
  Search,
  Building2,
  MapPin,
  FileText,
  Receipt,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  Trash2,
  X,
  CalendarClock,
  Eye,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

const AGENTS = [
  'Mamadou Lamine Diop',
  'Aminata Fatou Ndiaye',
  'Babacar Cheikh Fall',
];

const QUICK_SNIPPETS = [
  {
    label: 'Proforma & RIB CBAO/BOA',
    text: "Bonjour,\n\nVeuillez trouver ci-joint notre devis proforma conforme aux normes OHADA (TVA 18% incluse) accompagné de notre RIB CBAO / BOA et de notre attestation NINEA.\n\nDès réception de votre bon pour accord, nous lançons la préparation logistique.\n\nCordialement,",
  },
  {
    label: 'Confirmation RDV Démo',
    text: "Bonjour,\n\nJe vous confirme avec plaisir notre rendez-vous de démonstration dans vos locaux demain à 11h00. Nous présenterons le module de facturation OHADA, la gestion de stock et le lecteur code-barre.\n\nÀ très bientôt,",
  },
  {
    label: 'Règlement Wave / Orange Money',
    text: "Bonjour,\n\nVous pouvez régler votre facture en toute sécurité via le QR Code Wave Business ou Orange Money figurant au bas du document. Votre Reçu de Paiement officiel avec cachet numérique « FACTURE PAYÉE » vous sera transmis instantanément.\n\nCordialement,",
  },
];

export function InboxView({ onNavigate, onCreateQuoteForCustomer, onOpenAiAssistant }) {
  const {
    inboxThreads = [],
    replyToThread,
    toggleThreadStatus,
    assignThread,
    markThreadRead,
    createInboxThread,
    callLogs = [],
    saveCallLog,
    deleteCallLog,
    scheduledEmails = [],
    scheduleEmail,
    sendScheduledEmailNow,
    triggerEmailOpened,
    deleteScheduledEmail,
    customers = [],
    quotes = [],
    invoices = [],
    settings,
  } = useCrm();

  const currentUserName = settings?.currentUser?.name || 'Mamadou Lamine Diop';

  // Top mode: 'inbox' | 'scheduled' | 'calls'
  const [activeMode, setActiveMode] = useState('inbox');

  // Schedule Email Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(() => {
    const tomorrow = new Date(Date.now() + 3600 * 1000 * 18);
    return {
      recipientCompany: 'BOA SENEGAL',
      recipientName: 'Direction des Opérations — Bank of Africa',
      recipientEmail: 'operations.dakar@boasenegal.com',
      subject: 'Devis Proforma & Disponibilité Équipement — OpenFlex Sénégal',
      body: "Bonjour,\n\nVeuillez trouver ci-joint notre proposition commerciale conforme aux normes OHADA (TVA 18%).\n\nDès validation de votre bon pour accord, nous lançons la livraison.\n\nCordialement,",
      scheduledAt: tomorrow.toISOString().slice(0, 16),
      trackOpen: true,
    };
  });

  // Agent availability status (HubSpot top-left toggle)
  const [agentAvailable, setAgentAvailable] = useState(true);

  // Inbox sidebar filters
  const [inboxFilter, setInboxFilter] = useState('all_open'); // 'unassigned' | 'mine' | 'all_open' | 'closed'
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'email' | 'whatsapp'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected thread ID
  const [selectedThreadId, setSelectedThreadId] = useState(
    inboxThreads[0]?.id || null
  );

  // Composer state
  const [composerMode, setComposerMode] = useState('message'); // 'message' | 'note'
  const [replyText, setReplyText] = useState('');

  // New conversation modal
  const [newThreadModalOpen, setNewThreadModalOpen] = useState(false);
  const [newThreadForm, setNewThreadForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '+221 77 ',
    city: 'Dakar',
    channel: 'email',
    subject: '',
    estimatedValue: 1500000,
    initialMessage: '',
  });

  // New call modal
  const [newCallModalOpen, setNewCallModalOpen] = useState(false);
  const [callSearch, setCallSearch] = useState('');
  const [callOutcomeFilter, setCallOutcomeFilter] = useState('all');
  const [newCallForm, setNewCallForm] = useState({
    companyName: '',
    contactName: '',
    phone: '+221 77 ',
    direction: 'sortant',
    outcome: 'connecte',
    duration: '04:30',
    notes: '',
  });

  // Counts for HubSpot left sidebar views
  const counts = useMemo(() => {
    const openThreads = inboxThreads.filter((t) => t.status !== 'closed');
    return {
      unassigned: openThreads.filter((t) => !t.assignedTo).length,
      mine: openThreads.filter((t) => t.assignedTo === currentUserName).length,
      all_open: openThreads.length,
      closed: inboxThreads.filter((t) => t.status === 'closed').length,
      unread: openThreads.filter((t) => t.unread).length,
    };
  }, [inboxThreads, currentUserName]);

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return inboxThreads.filter((t) => {
      if (inboxFilter === 'unassigned' && (t.status === 'closed' || t.assignedTo)) {
        return false;
      }
      if (
        inboxFilter === 'mine' &&
        (t.status === 'closed' || t.assignedTo !== currentUserName)
      ) {
        return false;
      }
      if (inboxFilter === 'all_open' && t.status === 'closed') {
        return false;
      }
      if (inboxFilter === 'closed' && t.status !== 'closed') {
        return false;
      }
      if (channelFilter !== 'all' && t.channel !== channelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (t.companyName || '').toLowerCase().includes(q) ||
          (t.contactName || '').toLowerCase().includes(q) ||
          (t.subject || '').toLowerCase().includes(q) ||
          (t.email || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [inboxThreads, inboxFilter, channelFilter, searchQuery, currentUserName]);

  const activeThread = useMemo(() => {
    return (
      inboxThreads.find((t) => t.id === selectedThreadId) ||
      filteredThreads[0] ||
      null
    );
  }, [inboxThreads, selectedThreadId, filteredThreads]);

  // Linked customer documents for the right-hand 360° drawer
  const relatedDocs = useMemo(() => {
    if (!activeThread) return { customer: null, quotes: [], invoices: [] };
    const nameLower = (activeThread.companyName || '').toLowerCase();
    const customer = customers.find(
      (c) =>
        c.id === activeThread.linkedEntityId ||
        (c.name || '').toLowerCase().includes(nameLower) ||
        nameLower.includes((c.name || '').toLowerCase())
    );
    const relQuotes = quotes.filter(
      (q) =>
        (customer && q.customerId === customer.id) ||
        (q.customerName || '').toLowerCase().includes(nameLower)
    );
    const relInvoices = invoices.filter(
      (inv) =>
        (customer && inv.customerId === customer.id) ||
        (inv.customerName || '').toLowerCase().includes(nameLower)
    );
    return { customer, quotes: relQuotes, invoices: relInvoices };
  }, [activeThread, customers, quotes, invoices]);

  const handleSelectThread = (thread) => {
    setSelectedThreadId(thread.id);
    if (thread.unread) {
      markThreadRead(thread.id);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    replyToThread(activeThread.id, replyText.trim(), composerMode);
    setReplyText('');
  };

  const handleCreateNewThread = (e) => {
    e.preventDefault();
    if (!newThreadForm.companyName.trim() || !newThreadForm.subject.trim()) return;
    const created = createInboxThread(newThreadForm);
    setSelectedThreadId(created.id);
    setNewThreadModalOpen(false);
    setNewThreadForm({
      companyName: '',
      contactName: '',
      email: '',
      phone: '+221 77 ',
      city: 'Dakar',
      channel: 'email',
      subject: '',
      estimatedValue: 1500000,
      initialMessage: '',
    });
  };

  const handleCreateCall = (e) => {
    e.preventDefault();
    if (!newCallForm.companyName.trim()) return;
    saveCallLog(newCallForm);
    setNewCallModalOpen(false);
    setNewCallForm({
      companyName: '',
      contactName: '',
      phone: '+221 77 ',
      direction: 'sortant',
      outcome: 'connecte',
      duration: '04:30',
      notes: '',
    });
  };

  const openLogCallForActiveThread = () => {
    if (!activeThread) return;
    setNewCallForm({
      companyName: activeThread.companyName,
      contactName: activeThread.contactName,
      phone: activeThread.phone || '+221 77 ',
      direction: 'sortant',
      outcome: 'connecte',
      duration: '05:00',
      notes: `Suivi téléphonique concernant : ${activeThread.subject}`,
    });
    setNewCallModalOpen(true);
  };

  const filteredCalls = useMemo(() => {
    return callLogs.filter((c) => {
      if (callOutcomeFilter !== 'all' && c.outcome !== callOutcomeFilter) {
        return false;
      }
      if (callSearch.trim()) {
        const q = callSearch.toLowerCase();
        return (
          (c.companyName || '').toLowerCase().includes(q) ||
          (c.contactName || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [callLogs, callOutcomeFilter, callSearch]);

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SN';

  const outcomeBadge = (outcome) => {
    switch (outcome) {
      case 'connecte':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Connecté
          </span>
        );
      case 'rdv_pris':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            📅 RDV Confirmé
          </span>
        );
      case 'messagerie':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            voicemail Messagerie
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Pas de réponse
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & HubSpot-inspired Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
            {activeMode === 'inbox' ? (
              <Inbox className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeMode === 'inbox'
                  ? 'Boîte de Réception Omnicanale (Inbox)'
                  : 'Journal des Appels & Téléphonie CRM'}
              </h1>
              <span className="px-2 py-0.5 text-[10.5px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                E-mail • WhatsApp • Téléphonie
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Centralisez tous vos échanges clients, prospects et banques (BOA, CBAO...) avec fiche 360° temps réel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveMode('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'inbox'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Boîte de réception</span>
              {counts.all_open > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-mono">
                  {counts.all_open}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveMode('scheduled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'scheduled'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Mails Programmés & Suivi Lecture ({scheduledEmails.length})</span>
            </button>
            <button
              onClick={() => setActiveMode('calls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeMode === 'calls'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appels ({callLogs.length})</span>
            </button>
          </div>

          <button
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs font-semibold shadow-xs transition"
          >
            <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Programmer un mail suivi</span>
          </button>

          {activeMode === 'inbox' ? (
            <button
              onClick={() => setNewThreadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau message</span>
            </button>
          ) : activeMode === 'calls' ? (
            <button
              onClick={() => setNewCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enregistrer un appel</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* MODE 1: OMNICHANNEL INBOX (4 PANES LIKE HUBSPOT SCREENSHOT) */}
      {activeMode === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden min-h-[680px]">
          {/* PANE 1: VIEWS & AVAILABILITY (2 cols) */}
          <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Availability status button like HubSpot "Vous êtes disponible / indisponible" */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Statut opérateur Inbox
                </div>
                <button
                  onClick={() => setAgentAvailable(!agentAvailable)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 hover:text-emerald-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        agentAvailable
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                          : 'bg-amber-500 ring-4 ring-amber-500/20'
                      }`}
                    />
                    <span>
                      {agentAvailable
                        ? 'Vous êtes disponible'
                        : 'Vous êtes indisponible'}
                    </span>
                  </span>
                </button>
              </div>

              {/* Views */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Boîte de réception
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setInboxFilter('unassigned')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      inboxFilter === 'unassigned'
                        ? 'bg-emerald-600/10 text-emerald-900 font-semibold border border-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>Non attribués</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {counts.unassigned}
                    </span>
                  </button>

                  <button
                    onClick={() => setInboxFilter('mine')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      inboxFilter === 'mine'
                        ? 'bg-emerald-600/10 text-emerald-900 font-semibold border border-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Qui me sont attribués</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {counts.mine}
                    </span>
                  </button>

                  <button
                    onClick={() => setInboxFilter('all_open')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      inboxFilter === 'all_open'
                        ? 'bg-emerald-600/10 text-emerald-900 font-semibold border border-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Toutes les ouvertures</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-900">
                      {counts.all_open}
                    </span>
                  </button>

                  <button
                    onClick={() => setInboxFilter('closed')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      inboxFilter === 'closed'
                        ? 'bg-emerald-600/10 text-emerald-900 font-semibold border border-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Fermées / Archivées</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {counts.closed}
                    </span>
                  </button>
                </div>
              </div>

              {/* Channel Filter */}
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Canaux connectés
                </div>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'Tous les canaux' },
                    { id: 'email', label: 'E-mails (IMAP/SMTP)' },
                    { id: 'whatsapp', label: 'WhatsApp Business' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setChannelFilter(ch.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        channelFilter === ch.id
                          ? 'bg-slate-200/80 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Connected Account Footer */}
            <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-100 border border-emerald-800/60 space-y-1 mt-4">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Canal synchronisé</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-300">ACTIF</span>
              </div>
              <div className="text-[11px] text-emerald-200/90 font-mono truncate">
                {settings?.company?.email || 'contact@openflex.sn'}
              </div>
            </div>
          </div>

          {/* PANE 2: THREAD LIST (3 cols) */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Les plus récents ({filteredThreads.length})
                </span>
                {counts.unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    {counts.unread} non lu(s)
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher BOA, client, sujet..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucune conversation dans cette vue.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = activeThread?.id === thread.id;
                  const lastMsg =
                    thread.messages?.[thread.messages.length - 1]?.body || '';
                  return (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread)}
                      className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {getInitials(thread.companyName)}
                        </div>
                        {thread.unread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -top-0.5 -right-0.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs truncate ${
                              thread.unread
                                ? 'font-bold text-slate-900'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            {thread.companyName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {String(thread.updatedAt || '').slice(5, 10)}
                          </span>
                        </div>

                        <div className="text-[11.5px] font-medium text-slate-800 truncate mt-0.5">
                          {thread.subject}
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {lastMsg}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              thread.channel === 'whatsapp'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {thread.channel === 'whatsapp' ? (
                              <MessageSquare className="w-2.5 h-2.5" />
                            ) : (
                              <Mail className="w-2.5 h-2.5" />
                            )}
                            {thread.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                          </span>

                          {!thread.assignedTo ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Non attribué
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 truncate">
                              → {thread.assignedTo.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANE 3: CONVERSATION THREAD & COMPOSER (4 cols) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-slate-50/30">
            {activeThread ? (
              <>
                {/* Conversation Header (Like HubSpot "BOA SENEGAL" + "Fermer la conversation") */}
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
                      {getInitials(activeThread.companyName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 truncate">
                          {activeThread.companyName}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            activeThread.status === 'closed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {activeThread.status === 'closed' ? 'Fermée' : 'Ouverte'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        depuis{' '}
                        <span className="font-semibold text-emerald-700">
                          {activeThread.contactName}
                        </span>{' '}
                        • {activeThread.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={activeThread.assignedTo || ''}
                      onChange={(e) => assignThread(activeThread.id, e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">Non attribué</option>
                      {AGENTS.map((ag) => (
                        <option key={ag} value={ag}>
                          Attribué à : {ag}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleThreadStatus(activeThread.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        activeThread.status === 'closed'
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800'
                      }`}
                    >
                      {activeThread.status === 'closed' ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rouvrir</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fermer la conversation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Subject Banner */}
                <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span className="truncate">Objet : {activeThread.subject}</span>
                  <span className="font-mono text-[11px] text-emerald-700 shrink-0 ml-2">
                    Enjeu : {formatCurrency(activeThread.estimatedValue || 0)}
                  </span>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[360px]">
                  {(activeThread.messages || []).map((msg) => {
                    const isNote = msg.type === 'note';
                    const isAgent = msg.sender === 'agent';
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-3.5 border text-xs leading-relaxed ${
                          isNote
                            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                            : isAgent
                            ? 'bg-emerald-50/80 border-emerald-200 text-slate-800 ml-6'
                            : 'bg-white border-slate-200 text-slate-800 mr-6 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isNote && (
                              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {msg.senderName}
                            {isNote && (
                              <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-200/70 text-amber-900 font-semibold">
                                Note interne d'équipe
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-400">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div className="whitespace-pre-line">{msg.body}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply / Note Composer */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3 bg-white border-t border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setComposerMode('message')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          composerMode === 'message'
                            ? 'bg-white text-emerald-800 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Répondre au client
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerMode('note')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                          composerMode === 'note'
                            ? 'bg-amber-100 text-amber-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        <StickyNote className="w-3 h-3" />
                        <span>Note interne</span>
                      </button>
                    </div>

                    {/* Quick Snippets */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {QUICK_SNIPPETS.map((snip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(snip.text)}
                          className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 transition"
                        >
                          + {snip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      composerMode === 'note'
                        ? 'Rédigez une note interne visible uniquement par votre équipe...'
                        : `Répondre à ${activeThread.companyName} (${activeThread.email})...`
                    }
                    className={`w-full p-2.5 text-xs rounded-lg border focus:outline-none ${
                      composerMode === 'note'
                        ? 'bg-amber-50/50 border-amber-300 focus:border-amber-500'
                        : 'bg-slate-50/60 border-slate-200 focus:bg-white focus:border-emerald-600'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date(Date.now() + 3600 * 1000 * 14);
                          setScheduleForm({
                            recipientCompany: activeThread.companyName,
                            recipientName: activeThread.contactName,
                            recipientEmail: activeThread.email || '',
                            subject: `Re: ${activeThread.subject}`,
                            body:
                              replyText ||
                              `Bonjour ${activeThread.contactName},\n\nSuite à notre échange concernant ${activeThread.subject}, voici nos éléments...`,
                            scheduledAt: tomorrow.toISOString().slice(0, 16),
                            trackOpen: true,
                          });
                          setScheduleModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition"
                        title="Programmer l'envoi à une date/heure précise avec notification d'ouverture"
                      >
                        <CalendarClock className="w-3 h-3 text-amber-700" />
                        <span>Programmer + Suivi Lecture</span>
                      </button>

                      {onOpenAiAssistant && (
                        <button
                          type="button"
                          onClick={onOpenAiAssistant}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-950 text-emerald-100 hover:bg-emerald-900 transition"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Agent IA</span>
                        </button>
                      )}

                      {activeThread.phone && (
                        <a
                          href={`https://wa.me/${activeThread.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            replyText || `Bonjour ${activeThread.contactName},`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {composerMode === 'note'
                          ? 'Enregistrer la note'
                          : 'Envoyer la réponse'}
                      </span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">
                Sélectionnez une conversation à gauche.
              </div>
            )}
          </div>

          {/* PANE 4: RIGHT CONTEXT DRAWER "À PROPOS DU CONTACT / ENTREPRISE" (3 cols like HubSpot) */}
          <div className="lg:col-span-3 p-4 bg-white space-y-4 overflow-y-auto max-h-[680px]">
            {activeThread ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    À propos de l'objet Contact
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Fiche 360°
                  </span>
                </div>

                {/* Identity Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-bold text-sm">
                      {getInitials(activeThread.companyName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {activeThread.companyName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {activeThread.contactName}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {activeThread.email || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">
                        {activeThread.phone || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11.5px]">
                        {activeThread.city || 'Dakar, Sénégal'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions inside Right Drawer */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <button
                      onClick={openLogCallForActiveThread}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[11px] font-semibold transition"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Noter un appel</span>
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('quotes')}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[11px] font-semibold transition"
                    >
                      <FileText className="w-3 h-3 text-emerald-600" />
                      <span>Créer un devis</span>
                    </button>
                  </div>
                </div>

                {/* Financial Potential */}
                <div className="p-3.5 rounded-xl bg-emerald-950 text-white space-y-1">
                  <div className="text-[10.5px] uppercase tracking-wider text-emerald-300 font-semibold">
                    Enjeu commercial estimé
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {formatCurrency(activeThread.estimatedValue || 0)}
                  </div>
                  <div className="text-[11px] text-emerald-200/80">
                    Responsable : {activeThread.assignedTo || 'Non attribué'}
                  </div>
                </div>

                {/* Linked Quotes & Invoices */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Devis & Factures associés</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {relatedDocs.quotes.length + relatedDocs.invoices.length}
                    </span>
                  </div>

                  {relatedDocs.quotes.length === 0 &&
                  relatedDocs.invoices.length === 0 ? (
                    <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-[11.5px] text-slate-500">
                      Aucun devis ou facture rattaché pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {relatedDocs.quotes.map((q) => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-800">
                              {q.id}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                              Devis • {q.date}
                            </div>
                          </div>
                          <div className="font-mono font-semibold text-emerald-700">
                            {formatCurrency(q.totalTTC)}
                          </div>
                        </div>
                      ))}

                      {relatedDocs.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-800">
                              {inv.id}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                              Facture • {inv.status}
                            </div>
                          </div>
                          <div className="font-mono font-semibold text-slate-900">
                            {formatCurrency(inv.totalTTC)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* MODE 1.5: SCHEDULED EMAILS & REAL-TIME READ TRACKING */}
      {activeMode === 'scheduled' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                E-mails Programmés
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                {scheduledEmails.filter((e) => e.status === 'programme').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Envoi automatique à l'heure prévue
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Envoyés sous Suivi Pixel
              </div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                {scheduledEmails.filter((e) => e.status !== 'programme').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Surveillance d'ouverture active
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Mails Lus par le Destinataire
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {scheduledEmails.filter((e) => e.status === 'ouvert').length}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Notification instantanée déclenchée
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Total Lectures Détectées
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {scheduledEmails.reduce(
                  (acc, e) => acc + (Number(e.openCount) || 0),
                  0
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Pixel invisible GIF 1x1 temps réel
              </div>
            </div>
          </div>

          {/* Table of Scheduled & Tracked Emails */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  File d'Envoi Programmé & Accusés d'Ouverture en Temps Réel
                </h3>
                <p className="text-xs text-slate-500">
                  Dès que le lecteur ouvre votre e-mail, le pixel de suivi déclenche une alerte sonore et une notification en haut de l'écran.
                </p>
              </div>
              <button
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Programmer un nouvel e-mail</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Destinataire & Entreprise</th>
                    <th className="py-3 px-4">Objet & Pixel ID</th>
                    <th className="py-3 px-4">Date Programmée / Envoi</th>
                    <th className="py-3 px-4">Statut & Suivi de Lecture</th>
                    <th className="py-3 px-4 text-right">Actions & Test Lecture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {scheduledEmails.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {item.recipientCompany}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.recipientEmail || item.recipientName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-800 truncate">
                          {item.subject}
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-400 mt-0.5">
                          Pixel : /api/track/open/{item.trackingId}.gif
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-800">
                          {String(item.scheduledAt || '').replace('T', ' à ')}
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {item.sentAt
                            ? `Envoyé le ${item.sentAt}`
                            : 'En file d\'attente auto'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.status === 'programme' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Programmé</span>
                          </span>
                        )}
                        {item.status === 'envoye' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <Send className="w-3 h-3 text-blue-600" />
                            <span>Envoyé • En attente de lecture</span>
                          </span>
                        )}
                        {item.status === 'ouvert' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                Lu • Ouvert {item.openCount || 1} fois
                              </span>
                            </span>
                            <div className="text-[10.5px] font-mono text-emerald-700 mt-1">
                              Dernière ouverture : {item.openedAt}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {item.status === 'programme' && (
                            <button
                              onClick={() => sendScheduledEmailNow(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px] transition"
                            >
                              Envoyer maintenant
                            </button>
                          )}

                          <button
                            onClick={() => triggerEmailOpened(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition"
                            title="Simuler l'ouverture du mail par le lecteur et déclencher la notification"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Simuler ouverture lecteur</span>
                          </button>

                          <button
                            onClick={() => deleteScheduledEmail(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CALL LOGS & TELEPHONY ("Appels" from HubSpot Sidebar) */}
      {activeMode === 'calls' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Appels</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {callLogs.length}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Entrants & Sortants enregistrés
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Appels Connectés
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {
                  callLogs.filter(
                    (c) => c.outcome === 'connecte' || c.outcome === 'rdv_pris'
                  ).length
                }
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Interlocuteur joint directement
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                RDV Commerciaux Fixés
              </div>
              <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
                {callLogs.filter((c) => c.outcome === 'rdv_pris').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Démonstrations sur site validées
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                Click-to-Call & WhatsApp
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1.5">
                Numérotation +221 Active
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Appel direct téléphone ou WhatsApp
              </div>
            </div>
          </div>

          {/* Filter & Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  placeholder="Rechercher un appel, société, note..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'Tous les appels' },
                  { id: 'connecte', label: 'Connectés' },
                  { id: 'rdv_pris', label: 'RDV Pris' },
                  { id: 'messagerie', label: 'Messagerie' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCallOutcomeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      callOutcomeFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Entreprise & Interlocuteur</th>
                    <th className="py-3 px-4">Sens & Téléphone</th>
                    <th className="py-3 px-4">Résultat</th>
                    <th className="py-3 px-4">Durée & Date</th>
                    <th className="py-3 px-4">Compte-rendu d'appel</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {call.companyName}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {call.contactName} • Par {call.agent}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800">
                          {call.direction === 'entrant' ? (
                            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <PhoneOutgoing className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{call.phone}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 capitalize">
                          Appel {call.direction}
                        </div>
                      </td>
                      <td className="py-3 px-4">{outcomeBadge(call.outcome)}</td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{call.duration}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {call.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="text-slate-700 line-clamp-2">{call.notes}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`tel:${call.phone}`}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] border border-emerald-200"
                          >
                            Appeler
                          </a>
                          <button
                            onClick={() => deleteCallLog(call.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW CONVERSATION */}
      {newThreadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Nouvelle Conversation Omnicanale
              </h3>
              <button
                onClick={() => setNewThreadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNewThread} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entreprise / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={newThreadForm.companyName}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, companyName: e.target.value })
                    }
                    placeholder="Ex: BOA SENEGAL / CBAO"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Interlocuteur
                  </label>
                  <input
                    type="text"
                    value={newThreadForm.contactName}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, contactName: e.target.value })
                    }
                    placeholder="Ex: Direction des Opérations"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={newThreadForm.email}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, email: e.target.value })
                    }
                    placeholder="contact@entreprise.sn"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newThreadForm.phone}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Canal
                  </label>
                  <select
                    value={newThreadForm.channel}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, channel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="email">E-mail professionnel</option>
                    <option value="whatsapp">WhatsApp Business</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Enjeu estimé (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newThreadForm.estimatedValue}
                    onChange={(e) =>
                      setNewThreadForm({
                        ...newThreadForm,
                        estimatedValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Objet de la conversation *
                </label>
                <input
                  type="text"
                  required
                  value={newThreadForm.subject}
                  onChange={(e) =>
                    setNewThreadForm({ ...newThreadForm, subject: e.target.value })
                  }
                  placeholder="Ex: Demande de proforma équipement informatique"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Premier message
                </label>
                <textarea
                  rows={3}
                  value={newThreadForm.initialMessage}
                  onChange={(e) =>
                    setNewThreadForm({
                      ...newThreadForm,
                      initialMessage: e.target.value,
                    })
                  }
                  placeholder="Saisissez le message envoyé ou reçu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewThreadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Créer la conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG A CALL */}
      {newCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Enregistrer un Appel Commercial
              </h3>
              <button
                onClick={() => setNewCallModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCall} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCallForm.companyName}
                    onChange={(e) =>
                      setNewCallForm({ ...newCallForm, companyName: e.target.value })
                    }
                    placeholder="Ex: BOA SENEGAL"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Interlocuteur
                  </label>
                  <input
                    type="text"
                    value={newCallForm.contactName}
                    onChange={(e) =>
                      setNewCallForm({ ...newCallForm, contactName: e.target.value })
                    }
                    placeholder="Nom du contact"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={newCallForm.phone}
                    onChange={(e) =>
                      setNewCallForm({ ...newCallForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Résultat d'appel
                  </label>
                  <select
                    value={newCallForm.outcome}
                    onChange={(e) =>
                      setNewCallForm({ ...newCallForm, outcome: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="connecte">✓ Connecté</option>
                    <option value="rdv_pris">📅 RDV Confirmé</option>
                    <option value="messagerie">Messagerie vocale</option>
                    <option value="pas_de_reponse">Pas de réponse</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durée (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={newCallForm.duration}
                    onChange={(e) =>
                      setNewCallForm({ ...newCallForm, duration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Compte-rendu & Prochaines étapes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCallForm.notes}
                  onChange={(e) =>
                    setNewCallForm({ ...newCallForm, notes: e.target.value })
                  }
                  placeholder="Résumé de l'échange téléphonique..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCallModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Enregistrer l'appel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE EMAIL WITH READ NOTIFICATION */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Programmer un E-mail avec Notification d'Ouverture
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                scheduleEmail({ ...scheduleForm, sendNow: false });
                setScheduleModalOpen(false);
                setActiveMode('scheduled');
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entreprise destinataire *
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.recipientCompany}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        recipientCompany: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail du lecteur *
                  </label>
                  <input
                    type="email"
                    required
                    value={scheduleForm.recipientEmail}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        recipientEmail: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Objet de l'e-mail *
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.subject}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={scheduleForm.body}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, body: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-emerald-700" />
                    <span>Date & Heure d'envoi programmé :</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledAt}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        scheduledAt: e.target.value,
                      })
                    }
                    className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-emerald-900 font-semibold cursor-pointer pt-1 border-t border-emerald-200/70">
                  <input
                    type="checkbox"
                    checked={scheduleForm.trackOpen}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        trackOpen: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>
                    M'envoyer une notification dès que le lecteur ouvre l'e-mail
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    scheduleEmail({ ...scheduleForm, sendNow: true });
                    setScheduleModalOpen(false);
                    setActiveMode('scheduled');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold"
                >
                  Envoyer maintenant (avec suivi)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Programmer l'envoi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
