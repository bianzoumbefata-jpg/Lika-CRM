import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  CalendarClock,
  Eye,
  KeyRound,
  ArrowUpRight,
  PenLine,
  Rocket,
  Receipt,
  BellRing,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

// -----------------------------------------------------------------------------
// Rendu Markdown léger (gras, italique, listes, titres) sans dépendance
// -----------------------------------------------------------------------------
function renderInline(text, keyPrefix) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key} className="font-bold text-[var(--text)]">{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))
      return (
        <code key={key} className="font-mono text-[11.5px] px-1 py-0.5 rounded bg-[var(--surface-3)]">
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function MarkdownLite({ text }) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-1 pl-1">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" aria-hidden="true" />
              <span>{renderInline(item, `li-${blocks.length}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
      list = null;
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      (list ||= []).push(bullet[1]);
      return;
    }
    flush();
    if (!line.trim()) {
      blocks.push(<div key={`sp-${idx}`} className="h-1.5" />);
      return;
    }
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push(
        <div key={`h-${idx}`} className="font-bold text-[var(--text)] text-[13px] pt-1">
          {renderInline(heading[1], `h-${idx}`)}
        </div>
      );
      return;
    }
    blocks.push(<p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>);
  });
  flush();
  return <div className="space-y-1">{blocks}</div>;
}

const ACTION_ICONS = {
  open_composer_boa: PenLine,
  open_composer_lead: PenLine,
  schedule_overdue_reminder: BellRing,
  convert_best_lead: Rocket,
  simulate_open: Eye,
  nav_invoices: Receipt,
};

const now = () => new Date().toTimeString().slice(0, 5);

async function api(path, body) {
  const res = await fetch(path, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } : undefined);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export function AiAssistantDrawer({ isOpen, onClose, onNavigate }) {
  const {
    leads = [],
    customers = [],
    quotes = [],
    invoices = [],
    inboxThreads = [],
    scheduledEmails = [],
    scheduleEmail,
    triggerEmailOpened,
    convertLeadToProspect,
    settings,
  } = useCrm();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'composer' | 'settings'
  const [promptInput, setPromptInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // ---- Statut du moteur IA (côté serveur) ----
  const [aiStatus, setAiStatus] = useState(null);
  const [cfgForm, setCfgForm] = useState({ provider: 'agnes', apiKey: '', model: '', baseUrl: '' });
  const [cfgBusy, setCfgBusy] = useState(false);
  const [cfgMessage, setCfgMessage] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api('/api/ai/status');
      setAiStatus(s);
      setCfgForm((f) => ({
        ...f,
        provider: s.provider || f.provider,
        model: s.model || '',
        baseUrl: s.baseUrl || '',
        apiKey: '',
      }));
    } catch {
      setAiStatus({ configured: false, providers: [], offline: true });
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadStatus();
  }, [isOpen, loadStatus]);

  // ---- Rédacteur d'e-mail ----
  const companyName = settings?.company?.name || 'Lika Sénégal';
  const [aiDraftTarget, setAiDraftTarget] = useState('BOA SENEGAL');
  const [aiDraftEmail, setAiDraftEmail] = useState('operations.dakar@boasenegal.com');
  const [aiDraftTone, setAiDraftTone] = useState('institutionnel');
  const [aiDraftObjective, setAiDraftObjective] = useState('relance_devis');
  const [aiDraftSubject, setAiDraftSubject] = useState(
    `Suivi de notre proposition — équipement des agences de Dakar`
  );
  const [aiDraftBody, setAiDraftBody] = useState(
    `Bonjour,\n\nSuite à nos récents échanges concernant le déploiement des postes de travail et imprimantes guichet pour vos agences de Dakar Plateau et Almadies, nous vous confirmons la disponibilité immédiate des équipements.\n\nNotre devis proforma inclut la TVA 18 % conforme OHADA ainsi que nos références bancaires et notre NINEA.\n\nSouhaitez-vous que nous réservions le lot dès aujourd'hui ?\n\nBien cordialement,\nDirection Commerciale — ${companyName}`
  );
  const [draftBusy, setDraftBusy] = useState(false);
  const [aiScheduleDate, setAiScheduleDate] = useState(() => {
    const d = new Date(Date.now() + 3600 * 1000 * 18);
    return d.toISOString().slice(0, 16);
  });

  // ---- Indicateurs CRM transmis à l'IA ----
  const metrics = useMemo(() => {
    const billable = invoices.filter((i) => i.type !== 'avoir');
    const totalInvoiced = billable.reduce((s, i) => s + (Number(i.totalTTC) || 0), 0);
    const totalPaid = billable.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const overdueList = invoices.filter((i) => i.status === 'en_retard');
    const overdueAmount = overdueList.reduce(
      (s, i) => s + (Number(i.remainingAmount) || Number(i.totalTTC) || 0),
      0
    );
    const hotLeads = leads
      .filter((l) => l.temperature === 'chaud' && l.status !== 'converti')
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    const pendingQuotes = quotes.filter((q) => q.status === 'envoye' || q.status === 'accepte');
    const unreadInbox = inboxThreads.filter((t) => t.unread && t.status !== 'closed');
    return { totalInvoiced, totalPaid, overdueList, overdueAmount, hotLeads, pendingQuotes, unreadInbox };
  }, [invoices, leads, quotes, inboxThreads]);

  const crmContext = useMemo(() => {
    const fc = (n) => formatCurrency(Number(n) || 0);
    const lines = [
      `Entreprise : ${companyName}. Utilisateur : ${settings?.currentUser?.name || 'inconnu'}. Date : ${new Date().toLocaleDateString('fr-FR')}.`,
      `Chiffre d'affaires TTC facturé : ${fc(metrics.totalInvoiced)} ; encaissé : ${fc(metrics.totalPaid)}.`,
      `Clients : ${customers.length}. Devis actifs (envoyés/acceptés) : ${metrics.pendingQuotes.length}.`,
      `Factures en retard (${metrics.overdueList.length}, total ${fc(metrics.overdueAmount)}) :`,
      ...metrics.overdueList.slice(0, 15).map(
        (i) => `- ${i.id} • ${i.customerName} • reste ${fc(i.remainingAmount || i.totalTTC)} • échéance ${i.dueDate}`
      ),
      `Devis en cours :`,
      ...metrics.pendingQuotes.slice(0, 15).map(
        (q) => `- ${q.id} • ${q.customerName} • ${fc(q.totalTTC)} • statut ${q.status}`
      ),
      `Leads chauds :`,
      ...metrics.hotLeads.slice(0, 10).map(
        (l) => `- ${l.companyName} (${l.contactName}) • score ${l.score}/100 • budget ${fc(l.estimatedBudget)}`
      ),
      `Messages non lus :`,
      ...metrics.unreadInbox.slice(0, 10).map((t) => `- ${t.companyName || t.from || ''} : ${t.subject || ''}`),
      `E-mails programmés/suivis : ${scheduledEmails.length}.`,
    ];
    return lines.join('\n');
  }, [metrics, customers.length, scheduledEmails.length, companyName, settings]);

  const [messages, setMessages] = useState(() => [
    {
      id: 'AI-WELCOME',
      role: 'assistant',
      timestamp: 'En direct',
      local: true,
      text: `Bonjour **${settings?.currentUser?.name || ''}** ! Je suis **Lika IA**, votre copilote commercial et comptable (OHADA • FCFA).\n\nDiagnostic instantané :\n- **Trésorerie encaissée** : ${formatCurrency(metrics.totalPaid)} sur ${formatCurrency(metrics.totalInvoiced)} facturés\n- **Recouvrement** : ${metrics.overdueList.length} facture(s) en retard pour **${formatCurrency(metrics.overdueAmount)}**\n- **Leads chauds** : ${metrics.hotLeads.length} prêt(s) à convertir\n- **Boîte de réception** : ${metrics.unreadInbox.length} message(s) non lu(s)\n\nQue souhaitez-vous me confier ?`,
      actions: [
        { label: 'Rédiger et programmer une réponse à BOA SENEGAL', actionType: 'open_composer_boa' },
        { label: 'Programmer une relance des factures échues', actionType: 'schedule_overdue_reminder' },
        { label: 'Convertir le meilleur lead chaud en prospect', actionType: 'convert_best_lead' },
      ],
    },
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const configured = Boolean(aiStatus?.configured);

  // ---------------------------------------------------------------------------
  // Moteur local (sans clé API) : réponses à partir des données CRM
  // ---------------------------------------------------------------------------
  const generateLocalSmartReply = (question) => {
    const q = question.toLowerCase();
    if (/(facture|retard|impay|recouvr)/.test(q)) {
      const details = metrics.overdueList
        .map((inv) => `- **${inv.id}** — ${inv.customerName} : **${formatCurrency(inv.remainingAmount || inv.totalTTC)}** (échéance ${inv.dueDate})`)
        .join('\n');
      return {
        text: `**Recouvrement — factures échues**\n\n${metrics.overdueList.length} facture(s) à recouvrer pour **${formatCurrency(metrics.overdueAmount)}** :\n${details || '- Aucune facture en retard.'}\n\n**Conseil** : programmez une relance à 9 h avec suivi d'ouverture et QR Wave / Orange Money.`,
        actions: [
          { label: 'Programmer la relance avec suivi de lecture', actionType: 'schedule_overdue_reminder' },
          { label: 'Ouvrir Factures & Avoirs', actionType: 'nav_invoices' },
        ],
      };
    }
    if (/(lead|prospect|marketing|chaud)/.test(q)) {
      const top = metrics.hotLeads
        .map((l) => `- **${l.companyName}** (${l.contactName}) — score **${l.score}/100**, budget **${formatCurrency(l.estimatedBudget)}**`)
        .join('\n');
      return {
        text: `**Leads chauds**\n\n${metrics.hotLeads.length} lead(s) prêt(s) pour une conversion :\n${top || '- Tous vos leads chauds sont déjà convertis.'}`,
        actions: [
          { label: 'Convertir le meilleur lead chaud', actionType: 'convert_best_lead' },
          { label: 'Rédiger un e-mail de suivi', actionType: 'open_composer_lead' },
        ],
      };
    }
    return {
      text: `**Synthèse**\n\n1. CA TTC facturé : **${formatCurrency(metrics.totalInvoiced)}** (dont **${formatCurrency(metrics.totalPaid)}** encaissés)\n2. Devis prêts à conclure : **${metrics.pendingQuotes.length}**\n3. E-mails suivis : **${scheduledEmails.length}**\n\n*Mode hors ligne : ajoutez une clé API dans l'onglet « Moteur IA » pour des réponses rédigées sur mesure.*`,
      actions: [
        { label: "Ouvrir le rédacteur d'e-mail", actionType: 'open_composer_boa' },
        { label: 'Configurer la clé API', actionType: 'open_settings' },
      ],
    };
  };

  const pushAssistant = (text, extra = {}) =>
    setMessages((prev) => [...prev, { id: `AI-${Date.now()}`, role: 'assistant', timestamp: now(), text, ...extra }]);

  const sendPrompt = async (userText) => {
    if (!userText.trim() || isThinking) return;
    const userMsg = { id: `USR-${Date.now()}`, role: 'user', timestamp: now(), text: userText.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsThinking(true);

    if (configured) {
      try {
        const out = await api('/api/ai/chat', {
          context: crmContext,
          messages: history
            .filter((m) => !m.local && !m.error)
            .map((m) => ({ role: m.role, content: m.text })),
        });
        pushAssistant(out.text || '(réponse vide)', { model: out.model });
      } catch (err) {
        const local = generateLocalSmartReply(userText);
        pushAssistant(`**Le service IA n'a pas répondu** : ${err.message}\n\nVoici l'analyse du moteur local :\n\n${local.text}`, {
          error: true,
          actions: local.actions,
        });
      } finally {
        setIsThinking(false);
      }
      return;
    }

    setTimeout(() => {
      const reply = generateLocalSmartReply(userText);
      pushAssistant(reply.text, { actions: reply.actions, local: true });
      setIsThinking(false);
    }, 350);
  };

  const handleSendPrompt = (e) => {
    e.preventDefault();
    const text = promptInput;
    setPromptInput('');
    sendPrompt(text);
  };

  const handleActionClick = (actionType) => {
    if (actionType === 'open_composer_boa') {
      setAiDraftTarget('BOA SENEGAL');
      setAiDraftEmail('operations.dakar@boasenegal.com');
      setActiveTab('composer');
    } else if (actionType === 'open_composer_lead') {
      const lead = metrics.hotLeads[0];
      if (lead) {
        setAiDraftTarget(lead.companyName);
        setAiDraftEmail(lead.email);
        setAiDraftSubject(`Proposition commerciale — ${lead.companyName}`);
      }
      setActiveTab('composer');
    } else if (actionType === 'schedule_overdue_reminder') {
      const overdue = metrics.overdueList[0];
      if (!overdue) {
        pushAssistant('Aucune facture en retard à relancer pour le moment.');
        return;
      }
      const amount = formatCurrency(overdue.remainingAmount || overdue.totalTTC);
      const customer = customers.find((c) => c.id === overdue.customerId);
      const tomorrow9am = new Date();
      tomorrow9am.setDate(tomorrow9am.getDate() + 1);
      tomorrow9am.setHours(9, 0, 0, 0);
      scheduleEmail({
        recipientCompany: overdue.customerName,
        recipientName: `Service comptabilité — ${overdue.customerName}`,
        recipientEmail: customer?.email || '',
        subject: `Rappel d'échéance — facture ${overdue.id} (${amount})`,
        body: `Bonjour,\n\nSauf erreur de notre part, la facture ${overdue.id} d'un montant de ${amount} TTC reste en attente de règlement.\n\nVous pouvez la régler par Wave Business, Orange Money ou virement bancaire. Votre reçu officiel vous sera transmis dès réception.\n\nCordialement,\nService comptabilité — ${companyName}`,
        scheduledAt: tomorrow9am.toISOString().slice(0, 16),
        sendNow: false,
        trackOpen: true,
      });
      pushAssistant(`Relance programmée demain à 9 h pour **${overdue.customerName}** (${overdue.id}, ${amount}), avec suivi d'ouverture.`);
    } else if (actionType === 'convert_best_lead') {
      const best = metrics.hotLeads[0] || leads.find((l) => l.status !== 'converti');
      if (best) {
        convertLeadToProspect(best.id);
        pushAssistant(`**${best.companyName}** a été converti en prospect avec une opportunité dans le pipeline.`);
      } else {
        pushAssistant('Aucun lead à convertir.');
      }
    } else if (actionType === 'simulate_open') {
      const target = scheduledEmails.find((e) => e.status === 'envoye') || scheduledEmails[0];
      if (target) triggerEmailOpened(target.id);
    } else if (actionType === 'nav_invoices') {
      onNavigate?.('invoices');
      onClose?.();
    } else if (actionType === 'open_settings') {
      setActiveTab('settings');
    }
  };

  // ---------------------------------------------------------------------------
  // Rédaction d'e-mail
  // ---------------------------------------------------------------------------
  const OBJECTIVES = {
    relance_devis: 'Suivi de devis / proforma',
    relance_facture: 'Relance de facture échue',
    prospection: 'Prospection / démonstration',
  };

  const templateDraft = (objective, tone) => {
    const polite =
      tone === 'institutionnel'
        ? "Nous vous prions d'agréer l'expression de notre considération distinguée."
        : 'Je reste disponible sur WhatsApp ou par téléphone.';
    if (objective === 'relance_devis') {
      setAiDraftSubject(`Suivi de notre proposition commerciale — ${aiDraftTarget}`);
      setAiDraftBody(`Bonjour,\n\nSuite à l'envoi de notre offre pour ${aiDraftTarget}, nous vous confirmons la disponibilité immédiate des équipements (TVA 18 % OHADA incluse).\n\nDès réception de votre bon pour accord, nous planifions la livraison avec bordereau officiel sous 24 h.\n\n${polite}\n\nL'équipe commerciale — ${companyName}`);
    } else if (objective === 'relance_facture') {
      setAiDraftSubject(`Règlement de votre facture échue — ${aiDraftTarget}`);
      setAiDraftBody(`Bonjour,\n\nNous revenons vers vous au sujet du règlement de votre facture arrivée à échéance.\n\nVous pouvez régler par virement bancaire ou via le QR Code Wave / Orange Money. Votre reçu officiel vous sera délivré immédiatement.\n\n${polite}\n\nService comptabilité — ${companyName}`);
    } else {
      setAiDraftSubject(`Démonstration personnalisée de Lika CRM — ${aiDraftTarget}`);
      setAiDraftBody(`Bonjour,\n\nNous serions ravis de vous présenter en 20 minutes comment automatiser votre facturation OHADA, vos stocks et vos relances clients.\n\nQuel créneau vous conviendrait cette semaine ?\n\n${polite}\n\nDirection commerciale — ${companyName}`);
    }
  };

  const draftWithAi = async (objective = aiDraftObjective, tone = aiDraftTone) => {
    setAiDraftObjective(objective);
    setAiDraftTone(tone);
    if (!configured) {
      templateDraft(objective, tone);
      return;
    }
    setDraftBusy(true);
    try {
      const out = await api('/api/ai/chat', {
        context: crmContext,
        messages: [
          {
            role: 'user',
            content: `Rédige un e-mail professionnel en français pour l'entreprise « ${aiDraftTarget} ».\nObjectif : ${OBJECTIVES[objective]}.\nTon : ${tone === 'institutionnel' ? 'institutionnel et formel' : 'chaleureux et direct'}.\nSigne au nom de ${companyName}. Utilise les données CRM si elles concernent ce client.\nFormat : première ligne « Objet : … », puis une ligne vide, puis le corps. Pas de Markdown.`,
          },
        ],
      });
      const text = String(out.text || '').trim();
      const m = text.match(/^\s*Objet\s*:\s*(.+)\n+([\s\S]*)$/i);
      if (m) {
        setAiDraftSubject(m[1].trim());
        setAiDraftBody(m[2].trim());
      } else {
        setAiDraftBody(text);
      }
    } catch (err) {
      templateDraft(objective, tone);
      setCfgMessage({ type: 'error', text: `Rédaction IA indisponible (${err.message}) : modèle de texte utilisé.` });
    } finally {
      setDraftBusy(false);
    }
  };

  const handleScheduleFromAi = (sendNow = false) => {
    scheduleEmail({
      recipientCompany: aiDraftTarget,
      recipientName: aiDraftTarget,
      recipientEmail: aiDraftEmail,
      subject: aiDraftSubject,
      body: aiDraftBody,
      scheduledAt: aiScheduleDate,
      sendNow,
      trackOpen: true,
    });
    setActiveTab('chat');
    pushAssistant(
      sendNow
        ? `**E-mail envoyé à ${aiDraftTarget}** (${aiDraftEmail}).\n\nSuivi d'ouverture activé : vous serez notifié dès la première lecture.`
        : `**E-mail programmé pour ${aiDraftTarget}** le **${aiScheduleDate.replace('T', ' à ')}**.\n\nSuivi d'ouverture activé.`,
      { actions: [{ label: "Simuler l'ouverture par le destinataire", actionType: 'simulate_open' }] }
    );
  };

  // ---------------------------------------------------------------------------
  // Configuration du moteur
  // ---------------------------------------------------------------------------
  const providerMeta = (aiStatus?.providers || []).find((p) => p.id === cfgForm.provider);

  const saveConfig = async (e) => {
    e?.preventDefault();
    setCfgBusy(true);
    setCfgMessage(null);
    try {
      await api('/api/ai/config', {
        provider: cfgForm.provider,
        apiKey: cfgForm.apiKey,
        model: cfgForm.model.trim() || providerMeta?.defaultModel || '',
        baseUrl: cfgForm.provider === 'openai' ? cfgForm.baseUrl.trim() || providerMeta?.defaultBaseUrl : cfgForm.baseUrl.trim(),
      });
      await loadStatus();
      const test = await api('/api/ai/test', {}).catch((err) => ({ ok: false, error: err.message }));
      setCfgMessage(
        test.ok
          ? { type: 'ok', text: `Connexion réussie (${test.model}). L'assistant utilise désormais votre clé.` }
          : { type: 'error', text: `Clé enregistrée, mais le test a échoué : ${test.error}` }
      );
    } catch (err) {
      setCfgMessage({ type: 'error', text: err.message });
    } finally {
      setCfgBusy(false);
    }
  };

  const removeKey = async () => {
    setCfgBusy(true);
    try {
      await api('/api/ai/config', { apiKey: '__delete__' });
      await loadStatus();
      setCfgMessage({ type: 'ok', text: 'Clé supprimée. Le moteur local reprend le relais.' });
    } catch (err) {
      setCfgMessage({ type: 'error', text: err.message });
    } finally {
      setCfgBusy(false);
    }
  };

  const tabs = [
    { id: 'chat', label: 'Assistant', icon: Bot },
    { id: 'composer', label: 'Rédacteur e-mail', icon: PenLine },
    { id: 'settings', label: 'Moteur IA', icon: KeyRound },
  ];

  const suggestions = [
    'Quelles factures dois-je relancer en priorité ?',
    'Quels leads chauds convertir cette semaine ?',
    'Fais-moi un bilan de trésorerie et de TVA 18 %',
    'Rédige une relance polie pour la facture la plus ancienne',
  ];

  const inputCls =
    'w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-[3px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Assistant Lika IA"
        onClick={(e) => e.stopPropagation()}
        className="cf-slide-in w-full max-w-[560px] h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* En-tête */}
        <div className="relative px-5 pt-5 pb-4 overflow-hidden">
          <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full cf-gradient opacity-25 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl cf-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Lika IA</h2>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {configured ? `${aiStatus.providerLabel} • ${aiStatus.model}` : 'Moteur local (aucune clé API)'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer l'assistant"
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Onglets en pastilles */}
          <div className="relative mt-4 inline-flex p-1 rounded-full bg-slate-100 border border-slate-200" role="tablist">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`cf-pill ${active ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ONGLET 1 : CONVERSATION */}
        {activeTab === 'chat' && (
          <>
            <div ref={scrollRef} className="flex-1 px-5 py-4 overflow-y-auto space-y-4 border-t border-[var(--border)]">
              {!configured && aiStatus && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-amber-200 bg-amber-50 text-left hover:bg-amber-100 transition"
                >
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-[12.5px] text-amber-800">
                    <strong>Ajoutez votre clé API</strong> pour des réponses rédigées par l'IA. En attendant, le moteur local analyse vos données.
                  </span>
                </button>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`cf-fade-up flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-8 h-8 rounded-xl cf-gradient flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : `bg-slate-50 border ${m.error ? 'border-rose-200' : 'border-slate-200'} text-slate-700 rounded-tl-md`
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-3 mb-1 text-[11px] font-semibold ${m.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                      <span>{m.role === 'user' ? 'Vous' : 'Lika IA'}</span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>
                    {m.role === 'user' ? <div className="whitespace-pre-line">{m.text}</div> : <MarkdownLite text={m.text} />}

                    {Array.isArray(m.actions) && m.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                        {m.actions.map((act) => {
                          const Icon = ACTION_ICONS[act.actionType] || ArrowUpRight;
                          return (
                            <button
                              key={act.actionType + act.label}
                              onClick={() => handleActionClick(act.actionType)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[12.5px] font-semibold text-slate-800 transition text-left"
                            >
                              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              <span className="flex-1">{act.label}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-[12.5px] text-brand-600 font-semibold pl-10" role="status">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lika IA analyse vos données…
                </div>
              )}
            </div>

            {/* Suggestions + saisie */}
            <div className="px-5 pt-3 pb-4 border-t border-[var(--border)] space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendPrompt(s)}
                    disabled={isThinking}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSendPrompt} className="flex items-end gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-brand-500">
                <label htmlFor="ai-prompt" className="sr-only">Votre question</label>
                <textarea
                  id="ai-prompt"
                  ref={inputRef}
                  rows={1}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) handleSendPrompt(e);
                  }}
                  placeholder="Posez une question ou demandez une action…"
                  className="flex-1 resize-none max-h-32 px-3 py-2 text-[13px] bg-transparent focus:outline-none"
                  style={{ backgroundColor: 'transparent' }}
                />
                <button
                  type="submit"
                  disabled={!promptInput.trim() || isThinking}
                  aria-label="Envoyer"
                  className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center justify-center transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}

        {/* ONGLET 2 : RÉDACTEUR D'E-MAIL */}
        {activeTab === 'composer' && (
          <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4 text-[13px] border-t border-[var(--border)]">
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-3">
              <div className="font-bold text-brand-900 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-600" />
                {configured ? "Rédaction par l'IA" : 'Modèles de rédaction'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(OBJECTIVES).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    disabled={draftBusy}
                    onClick={() => draftWithAi(id, aiDraftTone)}
                    className={`cf-pill border ${aiDraftObjective === id ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {[['institutionnel', 'Formel'], ['chaleureux', 'Chaleureux']].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAiDraftTone(id)}
                      className={`cf-pill border ${aiDraftTone === id ? 'bg-[var(--text)] text-[var(--bg)] border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => draftWithAi()}
                  disabled={draftBusy}
                  className="pro-btn-brand !py-1.5 disabled:opacity-60"
                >
                  {draftBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {draftBusy ? 'Rédaction…' : 'Régénérer'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ai-target" className="block font-semibold text-slate-700 mb-1">Entreprise destinataire</label>
                <input id="ai-target" type="text" value={aiDraftTarget} onChange={(e) => setAiDraftTarget(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ai-email" className="block font-semibold text-slate-700 mb-1">Adresse e-mail</label>
                <input id="ai-email" type="email" value={aiDraftEmail} onChange={(e) => setAiDraftEmail(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
            </div>
            <div>
              <label htmlFor="ai-subject" className="block font-semibold text-slate-700 mb-1">Objet</label>
              <input id="ai-subject" type="text" value={aiDraftSubject} onChange={(e) => setAiDraftSubject(e.target.value)} className={`${inputCls} font-semibold`} />
            </div>
            <div>
              <label htmlFor="ai-body" className="block font-semibold text-slate-700 mb-1">Message</label>
              <textarea id="ai-body" rows={9} value={aiDraftBody} onChange={(e) => setAiDraftBody(e.target.value)} className={`${inputCls} leading-relaxed`} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="ai-date" className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-brand-600" />
                  Date et heure d'envoi
                </label>
                <input id="ai-date" type="datetime-local" value={aiScheduleDate} onChange={(e) => setAiScheduleDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl font-mono text-[12px] bg-white" />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200 text-slate-600">
                <Eye className="w-4 h-4 text-brand-600 shrink-0" />
                Notification dès que le destinataire ouvre l'e-mail
                <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-mono text-[10.5px] font-bold">ACTIF</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="button" onClick={() => handleScheduleFromAi(true)} className="pro-btn-secondary">
                <Send className="w-3.5 h-3.5" />
                Envoyer maintenant
              </button>
              <button type="button" onClick={() => handleScheduleFromAi(false)} className="pro-btn-brand">
                <CalendarClock className="w-3.5 h-3.5" />
                Programmer l'envoi
              </button>
            </div>

            {scheduledEmails.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-900">File d'attente et suivi ({scheduledEmails.length})</div>
                {scheduledEmails.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.recipientCompany}</div>
                      <div className="text-[12px] text-slate-500 truncate">{item.subject}</div>
                      <div className="text-[11px] font-mono mt-0.5">
                        {item.status === 'ouvert' ? (
                          <span className="text-emerald-600 font-bold">Lu {item.openCount || 1} fois • {item.openedAt}</span>
                        ) : item.status === 'envoye' ? (
                          <span className="text-blue-600 font-semibold">Envoyé • en attente d'ouverture</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Programmé • {String(item.scheduledAt || '').replace('T', ' à ')}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerEmailOpened(item.id)}
                      className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11.5px] font-semibold shrink-0 flex items-center gap-1 transition"
                      title="Tester la notification d'ouverture"
                    >
                      <Eye className="w-3 h-3" />
                      Simuler
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : MOTEUR IA */}
        {activeTab === 'settings' && (
          <form onSubmit={saveConfig} className="flex-1 px-5 py-4 overflow-y-auto space-y-4 text-[13px] border-t border-[var(--border)]">
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${configured ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              {configured ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <KeyRound className="w-5 h-5 text-slate-500 shrink-0" />}
              <div className="text-slate-700">
                {aiStatus?.offline ? (
                  <>Serveur Lika injoignable : lancez <code className="font-mono">demarrer.bat</code> pour configurer l'IA.</>
                ) : configured ? (
                  <>
                    <strong>Connecté</strong> — {aiStatus.providerLabel}, modèle <code className="font-mono">{aiStatus.model}</code>, clé {aiStatus.keyHint}.
                  </>
                ) : (
                  <>
                    <strong>Aucune clé API.</strong> L'assistant fonctionne avec son moteur local. Renseignez une clé pour activer la rédaction et l'analyse par IA.
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="block font-semibold text-slate-700 mb-1.5">Fournisseur</span>
              <div className="grid grid-cols-2 gap-2">
                {(aiStatus?.providers?.length ? aiStatus.providers : [
                  { id: 'agnes', label: 'Agnes AI' },
                  { id: 'anthropic', label: 'Anthropic Claude' },
                  { id: 'openai', label: 'Compatible OpenAI' },
                  { id: 'gemini', label: 'Google Gemini' },
                ]).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCfgForm((f) => ({ ...f, provider: p.id, model: '', baseUrl: '' }))}
                    className={`px-3 py-2.5 rounded-xl border text-[12.5px] font-semibold transition ${
                      cfgForm.provider === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ai-key" className="block font-semibold text-slate-700 mb-1">Clé API</label>
              <input
                id="ai-key"
                type="password"
                autoComplete="off"
                value={cfgForm.apiKey}
                onChange={(e) => setCfgForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder={configured && aiStatus.provider === cfgForm.provider ? `Clé actuelle ${aiStatus.keyHint} — laisser vide pour la conserver` : 'Collez votre clé ici'}
                className={`${inputCls} font-mono`}
              />
              <p className="mt-1 text-[11.5px] text-slate-500">
                Stockée uniquement sur le serveur Lika (<code className="font-mono">data/ai_config.json</code>), jamais renvoyée au navigateur.
              </p>
            </div>

            <div>
              <label htmlFor="ai-model" className="block font-semibold text-slate-700 mb-1">Modèle</label>
              <input
                id="ai-model"
                type="text"
                value={cfgForm.model}
                onChange={(e) => setCfgForm((f) => ({ ...f, model: e.target.value }))}
                placeholder={providerMeta?.defaultModel || ''}
                className={`${inputCls} font-mono`}
              />
            </div>

            {cfgForm.provider === 'openai' && (
              <div>
                <label htmlFor="ai-base" className="block font-semibold text-slate-700 mb-1">URL de l'API</label>
                <input
                  id="ai-base"
                  type="url"
                  value={cfgForm.baseUrl}
                  onChange={(e) => setCfgForm((f) => ({ ...f, baseUrl: e.target.value }))}
                  placeholder={providerMeta?.defaultBaseUrl || 'https://api.openai.com/v1'}
                  className={`${inputCls} font-mono`}
                />
                <p className="mt-1 text-[11.5px] text-slate-500">OpenAI, Mistral, DeepSeek, Groq, OpenRouter ou un serveur local compatible.</p>
              </div>
            )}

            {cfgMessage && (
              <div
                role="status"
                className={`p-3 rounded-xl border flex items-start gap-2 ${cfgMessage.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
              >
                {cfgMessage.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{cfgMessage.text}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {configured ? (
                <button type="button" onClick={removeKey} disabled={cfgBusy} className="pro-btn-secondary !text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer la clé
                </button>
              ) : <span />}
              <button
                type="submit"
                disabled={cfgBusy || aiStatus?.offline || (!cfgForm.apiKey.trim() && !(configured && aiStatus.provider === cfgForm.provider))}
                className="pro-btn-brand disabled:opacity-50"
              >
                {cfgBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Enregistrer et tester
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
