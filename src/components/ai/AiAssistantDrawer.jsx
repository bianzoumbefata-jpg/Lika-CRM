import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  CalendarClock,
  MailCheck,
  TrendingUp,
  FileText,
  Receipt,
  Users,
  Zap,
  CheckCircle2,
  Eye,
  KeyRound,
  Copy,
  ArrowUpRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency } from '../../utils/formatters';

export function AiAssistantDrawer({ isOpen, onClose, onNavigate }) {
  const {
    leads = [],
    customers = [],
    quotes = [],
    invoices = [],
    inboxThreads = [],
    scheduledEmails = [],
    products = [],
    scheduleEmail,
    triggerEmailOpened,
    convertLeadToProspect,
    settings,
  } = useCrm();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'composer' | 'settings'
  const [promptInput, setPromptInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('openflex_gemini_api_key') || ''
  );

  // Composer IA state
  const [aiDraftTarget, setAiDraftTarget] = useState('BOA SENEGAL');
  const [aiDraftEmail, setAiDraftEmail] = useState('operations.dakar@boasenegal.com');
  const [aiDraftTone, setAiDraftTone] = useState('institutionnel');
  const [aiDraftObjective, setAiDraftObjective] = useState('relance_devis');
  const [aiDraftSubject, setAiDraftSubject] = useState(
    'Suivi Proposition Équipement 12 Agences Dakar — OpenFlex Sénégal (OHADA)'
  );
  const [aiDraftBody, setAiDraftBody] = useState(
    "Bonjour Direction des Opérations BOA SENEGAL,\n\nSuite à nos récents échanges concernant le déploiement des 12 postes de travail et imprimantes thermiques guichet pour vos agences de Dakar Plateau et Almadies, nous vous confirmons la disponibilité immédiate des équipements en stock à notre dépôt principal.\n\nNotre devis proforma inclut la TVA 18% conforme aux normes OHADA ainsi que nos références bancaires CBAO / BOA et notre NINEA pour faciliter votre comité d'engagement.\n\nSouhaitez-vous que nous bloquions le lot matériel dès aujourd'hui ?\n\nBien cordialement,\nDirection Commerciale — OpenFlex Sénégal"
  );
  const [aiScheduleDate, setAiScheduleDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 3600 * 1000 * 18);
    return tomorrow.toISOString().slice(0, 16);
  });

  // Live CRM Metrics for the AI brain
  const metrics = useMemo(() => {
    const totalInvoiced = invoices
      .filter((i) => i.type !== 'avoir')
      .reduce((s, i) => s + (Number(i.totalTTC) || 0), 0);
    const totalPaid = invoices
      .filter((i) => i.type !== 'avoir')
      .reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const overdueList = invoices.filter((i) => i.status === 'en_retard');
    const overdueAmount = overdueList.reduce(
      (s, i) => s + (Number(i.remainingAmount) || Number(i.totalTTC) || 0),
      0
    );
    const hotLeads = leads.filter(
      (l) => l.temperature === 'chaud' && l.status !== 'converti'
    );
    const pendingQuotes = quotes.filter(
      (q) => q.status === 'envoye' || q.status === 'accepte'
    );
    const unreadInbox = inboxThreads.filter((t) => t.unread && t.status !== 'closed');

    return {
      totalInvoiced,
      totalPaid,
      overdueList,
      overdueAmount,
      hotLeads,
      pendingQuotes,
      unreadInbox,
    };
  }, [invoices, leads, quotes, inboxThreads]);

  const [messages, setMessages] = useState([
    {
      id: 'AI-WELCOME',
      role: 'assistant',
      timestamp: 'En direct',
      text: `Bonjour **${
        settings?.currentUser?.name || 'Mamadou Lamine Diop'
      }** ! Je suis **OpenFlex IA**, votre assistant intelligent spécialisé **Fintech, Commercial & Comptabilité OHADA (Sénégal • FCFA)**.\n\nVoici mon diagnostic instantané de votre activité :\n• **Trésorerie encaissée** : ${formatCurrency(
        metrics.totalPaid
      )} sur ${formatCurrency(metrics.totalInvoiced)} facturés.\n• **Recouvrement prioritaire** : ${
        metrics.overdueList.length
      } facture(s) en retard pour **${formatCurrency(
        metrics.overdueAmount
      )}**.\n• **Acquisition & Leads Chauds 🔥** : ${
        metrics.hotLeads.length
      } lead(s) à fort potentiel prêts à convertir.\n• **Boîte de réception** : ${
        metrics.unreadInbox.length
      } message(s) non lu(s) (dont **BOA SENEGAL**).\n\nQue souhaitez-vous me confier aujourd'hui ?`,
      actions: [
        {
          label: '✍️ Rédiger & programmer une réponse à BOA SENEGAL',
          actionType: 'open_composer_boa',
        },
        {
          label: '⏰ Programmer une relance e-mail pour les factures échues',
          actionType: 'schedule_overdue_reminder',
        },
        {
          label: '🚀 Convertir le meilleur Lead Chaud en Prospect',
          actionType: 'convert_best_lead',
        },
      ],
    },
  ]);

  if (!isOpen) return null;

  const generateLocalSmartReply = (question) => {
    const q = question.toLowerCase();

    if (q.includes('facture') || q.includes('retard') || q.includes('impay') || q.includes('recouvrement')) {
      const details = metrics.overdueList
        .map(
          (inv) =>
            `• **${inv.id}** — *${inv.customerName}* : **${formatCurrency(
              inv.remainingAmount || inv.totalTTC
            )}** (Échéance : ${inv.dueDate})`
        )
        .join('\n');
      return {
        text: `📊 **Analyse Comptable OHADA — Factures & Recouvrement** :\n\nVous avez actuellement **${
          metrics.overdueList.length
        } facture(s) échue(s)** représentant un solde à recouvrer de **${formatCurrency(
          metrics.overdueAmount
        )}** :\n${
          details || '• Aucune facture en retard actuellement.'
        }\n\n💡 **Recommandation IA** : Envoyez un e-mail programmé à 09h00 avec pixel de suivi d'ouverture et QR Code Wave / Orange Money pour accélérer le règlement.`,
        actions: [
          {
            label: '⏰ Programmer la relance e-mail avec suivi de lecture',
            actionType: 'schedule_overdue_reminder',
          },
          {
            label: '📂 Ouvrir Factures & Avoirs',
            actionType: 'nav_invoices',
          },
        ],
      };
    }

    if (q.includes('lead') || q.includes('prospect') || q.includes('marketing') || q.includes('chaud')) {
      const topLeads = metrics.hotLeads
        .map(
          (l) =>
            `• **${l.companyName}** (${l.contactName}) — Score **${l.score}/100** • Budget : **${formatCurrency(
              l.estimatedBudget
            )}**`
        )
        .join('\n');
      return {
        text: `🔥 **Analyse Acquisition & Leads Chauds** :\n\nJ'ai identifié **${
          metrics.hotLeads.length
        } lead(s) chaud(s)** prêts pour une conversion immédiate en Prospect + Opportunité Pipeline :\n${
          topLeads || '• Tous vos leads chauds ont déjà été convertis !'
        }\n\nSouhaitez-vous que je convertisse automatiquement le lead ayant le score le plus élevé ou que je programme un e-mail de proposition ?`,
        actions: [
          {
            label: '🚀 Convertir le meilleur Lead Chaud maintenant',
            actionType: 'convert_best_lead',
          },
          {
            label: '✍️ Rédiger un e-mail suivi avec accusé de lecture',
            actionType: 'open_composer_lead',
          },
        ],
      };
    }

    if (q.includes('boa') || q.includes('banque') || q.includes('mail') || q.includes('programme')) {
      return {
        text: `📬 **Boîte de Réception & Suivi d'Ouverture E-mail** :\n\nLe dossier **BOA SENEGAL (Bank of Africa)** présente un enjeu de **8 450 000 FCFA**. Votre dernier proforma a été **ouvert 3 fois** par leur Direction des Opérations.\n\nJe peux préparer et programmer un e-mail de confirmation avec **pixel de suivi en temps réel** : dès que le lecteur ouvrira votre e-mail, vous recevrez une notification sonore et visuelle instantanée.`,
        actions: [
          {
            label: '✍️ Programmer l\'e-mail pour BOA SENEGAL',
            actionType: 'open_composer_boa',
          },
          {
            label: '👁️ Tester la notification d\'ouverture en direct',
            actionType: 'simulate_open',
          },
        ],
      };
    }

    return {
      text: `✨ **Synthèse Exécutive OpenFlex IA (Sénégal • FCFA)** :\n\n1. **Chiffre d'affaires TTC facturé** : **${formatCurrency(
        metrics.totalInvoiced
      )}** (dont **${formatCurrency(metrics.totalPaid)}** encaissés).\n2. **Devis prêts à conclure** : **${
        metrics.pendingQuotes.length
      } devis** actifs dans votre portefeuille.\n3. **E-mails programmés & suivis** : **${
        scheduledEmails.length
      } e-mail(s)** sous surveillance de lecture en temps réel.\n\nUtilisez l'onglet **« Rédacteur & Envoi Programmé »** ci-dessus pour générer un e-mail par IA et activer l'alerte d'ouverture.`,
      actions: [
        {
          label: '✍️ Ouvrir le Rédacteur d\'E-mail IA',
          actionType: 'open_composer_boa',
        },
        {
          label: '👁️ Simuler l\'ouverture d\'un mail par un client',
          actionType: 'simulate_open',
        },
      ],
    };
  };

  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const userText = promptInput.trim();
    setPromptInput('');
    const userMsg = {
      id: `USR-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toTimeString().slice(0, 5),
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // If user configured a Gemini API key, call Gemini 2.5 Flash with CRM context
    if (geminiApiKey.trim()) {
      try {
        const systemContext = `Tu es OpenFlex IA, l'assistant expert CRM, Fintech et Comptabilité OHADA au Sénégal (devise FCFA). Données actuelles du CRM: CA facturé=${metrics.totalInvoiced} FCFA, Encaissé=${metrics.totalPaid} FCFA, Factures en retard=${metrics.overdueList.length} (${metrics.overdueAmount} FCFA), Leads chauds=${metrics.hotLeads.length}. Réponds de façon concise, professionnelle et structurée en français.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            geminiApiKey.trim()
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemContext}\n\nQuestion utilisateur : ${userText}` }],
                },
              ],
            }),
          }
        );
        if (res.ok) {
          const json = await res.json();
          const candidateText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (candidateText) {
            setMessages((prev) => [
              ...prev,
              {
                id: `AI-${Date.now()}`,
                role: 'assistant',
                timestamp: new Date().toTimeString().slice(0, 5),
                text: candidateText,
                actions: [
                  {
                    label: '✍️ Programmer cet e-mail avec suivi d\'ouverture',
                    actionType: 'open_composer_boa',
                  },
                ],
              },
            ]);
            setIsThinking(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to built-in OHADA intelligence
      }
    }

    setTimeout(() => {
      const reply = generateLocalSmartReply(userText);
      setMessages((prev) => [
        ...prev,
        {
          id: `AI-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toTimeString().slice(0, 5),
          text: reply.text,
          actions: reply.actions,
        },
      ]);
      setIsThinking(false);
    }, 450);
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
        setAiDraftSubject(`Proposition Commerciale OpenFlex Sénégal — ${lead.companyName}`);
      }
      setActiveTab('composer');
    } else if (actionType === 'schedule_overdue_reminder') {
      const overdue = metrics.overdueList[0];
      const company = overdue?.customerName || 'Clinique Médicale de la Madeleine';
      const amount = formatCurrency(overdue?.remainingAmount || 191160);
      const docId = overdue?.id || 'FAC-2026-0003';
      const tomorrow9am = new Date();
      tomorrow9am.setDate(tomorrow9am.getDate() + 1);
      tomorrow9am.setHours(9, 0, 0, 0);

      scheduleEmail({
        recipientCompany: company,
        recipientName: `Service Comptabilité — ${company}`,
        recipientEmail: 'compta@clinique-madeleine.sn',
        subject: `Rappel d'échéance Facture ${docId} (${amount}) — Règlement Wave / CBAO`,
        body: `Bonjour,\n\nSauf erreur ou omission de notre part, la facture ${docId} d'un montant de ${amount} TTC demeure en attente de règlement.\n\nVous pouvez la régulariser instantanément par Wave Business, Orange Money ou virement CBAO. Votre Reçu de Paiement officiel avec cachet numérique « FACTURE PAYÉE » vous sera transmis dès réception.\n\nCordialement,\nService Comptabilité — OpenFlex Sénégal`,
        scheduledAt: tomorrow9am.toISOString().slice(0, 16),
        sendNow: false,
        trackOpen: true,
      });
    } else if (actionType === 'convert_best_lead') {
      const best = metrics.hotLeads[0] || leads.find((l) => l.status !== 'converti');
      if (best) {
        convertLeadToProspect(best.id);
      }
    } else if (actionType === 'simulate_open') {
      const targetEmail =
        scheduledEmails.find((e) => e.status === 'envoye') || scheduledEmails[0];
      if (targetEmail) {
        triggerEmailOpened(targetEmail.id);
      }
    } else if (actionType === 'nav_invoices') {
      onNavigate?.('invoices');
      onClose?.();
    }
  };

  const regenerateDraftWithAi = (objective, tone) => {
    setAiDraftObjective(objective);
    setAiDraftTone(tone);
    const polite =
      tone === 'institutionnel'
        ? 'Nous vous prions d\'agréer l\'expression de notre considération distinguée.'
        : 'Restant à votre entière disposition sur WhatsApp ou par téléphone.';

    if (objective === 'relance_devis') {
      setAiDraftSubject(
        `Suivi Proposition Commerciale & Disponibilité Stock — ${aiDraftTarget}`
      );
      setAiDraftBody(
        `Bonjour,\n\nSuite à la transmission de notre offre financière pour ${aiDraftTarget}, notre équipe technique à Dakar vous confirme la disponibilité immédiate des équipements et licences OpenFlex (conformes TVA 18% OHADA).\n\nDès validation de votre bon pour accord, nous planifions la livraison avec Bordereau de Livraison (BL) officiel sous 24h.\n\n${polite}\n\nL'équipe Commerciale OpenFlex Sénégal`
      );
    } else if (objective === 'relance_facture') {
      setAiDraftSubject(
        `Relance Règlement Facture Échue & Lien QR Wave / Orange Money — ${aiDraftTarget}`
      );
      setAiDraftBody(
        `Bonjour,\n\nNous nous permettons de revenir vers vous concernant le règlement de votre facture arrivée à échéance.\n\nPour vous faire gagner du temps, vous pouvez effectuer le règlement par virement bancaire CBAO/BOA ou via le QR Code Wave Business / Orange Money. Votre quittance officielle revêtue du cachet numérique « FACTURE PAYÉE » vous sera délivrée immédiatement.\n\n${polite}\n\nService Comptabilité — OpenFlex Sénégal`
      );
    } else {
      setAiDraftSubject(
        `Invitation Démonstration Personnalisée OpenFlex ERP & Facturation OHADA — ${aiDraftTarget}`
      );
      setAiDraftBody(
        `Bonjour,\n\nDans le cadre de la modernisation digitale des entreprises au Sénégal, nous serions ravis de vous présenter en 20 minutes comment OpenFlex automatise votre facturation OHADA, vos stocks et vos relances clients.\n\nQuel créneau vous conviendrait cette semaine dans vos locaux pour une démonstration sur mesure ?\n\n${polite}\n\nDirection Commerciale — OpenFlex Sénégal`
      );
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
    setMessages((prev) => [
      ...prev,
      {
        id: `AI-CONFIRM-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toTimeString().slice(0, 5),
        text: sendNow
          ? `✅ **E-mail envoyé avec succès à ${aiDraftTarget} (${aiDraftEmail})** !\n\n👁️ **Pixel de suivi activé** : Dès que le destinataire ouvrira ce message, je vous enverrai une notification immédiate.`
          : `⏰ **E-mail programmé avec succès pour ${aiDraftTarget}** le **${aiScheduleDate.replace(
              'T',
              ' à '
            )}** !\n\n👁️ **Suivi de lecture activé** : Vous serez alerté en temps réel dès la première ouverture par le lecteur.`,
        actions: [
          {
            label: '👁️ Simuler l\'ouverture par le lecteur maintenant',
            actionType: 'simulate_open',
          },
        ],
      },
    ]);
  };

  const handleSaveApiKey = (val) => {
    setGeminiApiKey(val);
    localStorage.setItem('openflex_gemini_api_key', val);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[2px]">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#07120f] via-[#0a1f19] to-emerald-950 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">
                  OpenFlex IA • Copilot Commercial & OHADA
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  En ligne
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Analyse temps réel • Envoi programmé • Alerte d'ouverture de mail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Assistant & Actions</span>
            </button>
            <button
              onClick={() => setActiveTab('composer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'composer'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Rédacteur & Envoi Programmé</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
              title="Paramètres Clé API Gemini"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Moteur IA</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CONVERSATIONAL AI COPILOT */}
        {activeTab === 'chat' && (
          <>
            {/* Quick Prompt Pills */}
            <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
              {[
                'Quelles sont les factures en retard à relancer ?',
                'Quels sont mes leads chauds à convertir ?',
                'Prépare un mail programmé pour BOA SENEGAL',
                'Bilan trésorerie et TVA 18%',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptInput(pill)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition shrink-0"
                >
                  ✦ {pill}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-emerald-700 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 opacity-75 text-[10.5px] font-semibold">
                      <span>
                        {m.role === 'user' ? 'Vous' : '✦ OpenFlex IA (Copilot OHADA)'}
                      </span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Action Buttons embedded in AI message */}
                    {Array.isArray(m.actions) && m.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                        {m.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act.actionType)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11.5px] font-semibold transition text-left"
                          >
                            <span>{act.label}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium px-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>OpenFlex IA analyse vos données CRM...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendPrompt}
              className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Posez une question ou demandez une action à l'Agent IA..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer</span>
              </button>
            </form>
          </>
        )}

        {/* TAB 2: AI EMAIL COMPOSER + SCHEDULED SEND + OPEN TRACKING */}
        {activeTab === 'composer' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Générateur IA avec Envoi Programmé & Pixel d'Ouverture</span>
              </div>
              <p className="text-[11.5px] text-emerald-800">
                Choisissez l'objectif et le ton : l'Agent IA rédige votre e-mail et y insère automatiquement une balise de suivi de lecture temps réel.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => regenerateDraftWithAi('relance_devis', aiDraftTone)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
                    aiDraftObjective === 'relance_devis'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Suivi Devis / Proforma
                </button>
                <button
                  type="button"
                  onClick={() => regenerateDraftWithAi('relance_facture', aiDraftTone)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
                    aiDraftObjective === 'relance_facture'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Relance Facture OHADA + Wave
                </button>
                <button
                  type="button"
                  onClick={() => regenerateDraftWithAi('prospection', aiDraftTone)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
                    aiDraftObjective === 'prospection'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Prospection / Démo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entreprise destinataire
                </label>
                <input
                  type="text"
                  value={aiDraftTarget}
                  onChange={(e) => setAiDraftTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adresse E-mail du lecteur
                </label>
                <input
                  type="email"
                  value={aiDraftEmail}
                  onChange={(e) => setAiDraftEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Objet de l'e-mail
              </label>
              <input
                type="text"
                value={aiDraftSubject}
                onChange={(e) => setAiDraftSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Corps du message rédigé par l'IA
              </label>
              <textarea
                rows={7}
                value={aiDraftBody}
                onChange={(e) => setAiDraftBody(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg leading-relaxed"
              />
            </div>

            {/* Schedule & Read Receipt Configuration */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-emerald-600" />
                  <span>Date & Heure d'envoi programmé</span>
                </span>
                <input
                  type="datetime-local"
                  value={aiScheduleDate}
                  onChange={(e) => setAiScheduleDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>
                    Notification immédiate dès que le lecteur ouvre le mail (Pixel GIF 1x1)
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10.5px] font-bold">
                  ACTIVÉ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleScheduleFromAi(true)}
                className="px-3.5 py-2 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer maintenant (avec suivi)</span>
              </button>
              <button
                type="button"
                onClick={() => handleScheduleFromAi(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Programmer l'envoi</span>
              </button>
            </div>

            {/* Liste des E-mails Programmés & Accusés de Lecture */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  File d'attente & Suivi des ouvertures ({scheduledEmails.length})
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Notification temps réel active
                </span>
              </div>

              <div className="space-y-2">
                {scheduledEmails.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {item.recipientCompany}{' '}
                        <span className="font-normal text-slate-500 font-mono text-[10.5px]">
                          ({item.recipientEmail})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        {item.subject}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                        {item.status === 'ouvert' ? (
                          <span className="text-emerald-700 font-bold">
                            👁️ Lu {item.openCount || 1} fois (Dernière : {item.openedAt})
                          </span>
                        ) : item.status === 'envoye' ? (
                          <span className="text-blue-700 font-semibold">
                            📤 Envoyé • En attente d'ouverture par le lecteur
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">
                            ⏰ Programmé pour le {String(item.scheduledAt || '').replace('T', ' à ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerEmailOpened(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-semibold shrink-0 flex items-center gap-1 transition"
                      title="Tester la notification d'ouverture du lecteur"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Simuler lecture</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI ENGINE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-5 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">
                Moteur IA Hybride (Local OHADA + Google Gemini API)
              </div>
              <p className="text-slate-600 leading-relaxed">
                Par défaut, <strong>OpenFlex IA</strong> fonctionne immédiatement sans configuration grâce à son moteur d'analyse financière OHADA embarqué. Vous pouvez en option renseigner une clé API <strong>Google Gemini (gemini-2.5-flash)</strong> pour étendre ses capacités génératives.
              </p>
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Clé API Google Gemini (Optionnel)
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                />
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                ✓ Vos données restent privées et sous votre contrôle.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
