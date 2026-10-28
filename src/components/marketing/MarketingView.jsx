import React, { useState } from 'react';
import {
  Megaphone,
  UserPlus,
  Mail,
  MessageCircle,
  Sparkles,
  Search,
  Plus,
  Send,
  Flame,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Edit,
  Eye,
  Users,
  BarChart3,
  Download,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvExporter';
import { Badge } from '../common/Badge';

const EMAIL_TEMPLATES = [
  {
    id: 'tpl_prospection',
    title: 'Prospection B2B — Pack Gestion, Caisse & Stock (Sénégal)',
    segment: 'prospects',
    subject: 'Digitalisez votre facturation OHADA et vos stocks en FCFA avec OpenFlex Sénégal',
    body: `Bonjour {contact},

Dans le cadre du développement des entreprises à {ville}, OpenFlex Sénégal accompagne les PME et commerces avec une solution clé en main de Gestion Commerciale, Facturation et Stock adaptée aux réalités du Sénégal :

• Devis, Factures TVA 18%, Bordereaux de Livraison (BL) et Reçus de Paiement officiels A4
• Intégration native des QR Codes Wave Sénégal & Orange Money sur vos factures
• Suivi en temps réel des stocks multi-dépôts et alertes de réapprovisionnement
• Accès en ligne sécurisé sur ordinateur, tablette et téléphone

Seriez-vous disponible cette semaine pour une démonstration rapide de 15 minutes (en ligne ou dans vos locaux à {ville}) ?

Bien cordialement,
L'équipe Commerciale — OpenFlex Sénégal`,
  },
  {
    id: 'tpl_relance_lead',
    title: 'Relance Lead Chaud — Proposition & Chiffrage personnalisé',
    segment: 'leads_chauds',
    subject: 'Suite à votre demande : Votre projet d’équipement {nom_entreprise}',
    body: `Bonjour {contact},

Je fais suite à nos échanges concernant votre projet d'équipement et de gestion pour {nom_entreprise}.

Nous avons préparé une proposition chiffrée en Francs CFA adaptée à vos besoins opérationnels, incluant le déploiement sur site, le paramétrage complet et la formation de vos équipes.

Souhaitez-vous que je vous transmette le devis détaillé par WhatsApp ou par e-mail dès aujourd'hui ?

Restant à votre entière disposition,
Service Commercial — OpenFlex Sénégal`,
  },
  {
    id: 'tpl_wave_om',
    title: 'Information Clients — Règlement Express par QR Wave & Orange Money',
    segment: 'clients',
    subject: 'Nouveau : Réglez vos factures en 5 secondes via QR Code Wave ou Orange Money',
    body: `Bonjour {contact},

Pour faciliter le traitement de vos opérations comptables, toutes nos factures et nos devis intègrent désormais un espace QR Code Wave Sénégal et Orange Money.

Dès validation de votre règlement, vous recevez automatiquement :
1. Votre Facture revêtue du Cachet Numérique Officiel « PAYÉ & LIVRÉ »
2. Votre Reçu de Paiement (Quittance OHADA arrêtée en chiffres et en lettres)
3. Votre Bordereau de Livraison (BL) certifié

Nous vous remercions pour votre confiance fidèle.
Le Service Comptabilité & Relation Client — OpenFlex Sénégal`,
  },
  {
    id: 'tpl_promo',
    title: 'Offre Spéciale Fin d’Année — -15% Licences ERP & Matériel',
    segment: 'tous',
    subject: 'Offre Privilège : -15% sur votre équipement informatique & licences OpenFlex',
    body: `Bonjour {contact},

À l'occasion de la clôture budgétaire annuelle, OpenFlex Sénégal accorde une remise exceptionnelle de 15% sur :
- Les Licences annuelles OpenFlex CRM & ERP Cloud
- Les Packs Caisses Tactiles, Imprimantes Thermiques et Postes Dell Optiplex Core i7
- Les Contrats d'Infogérance et Maintenance Réactive 24/7

Cette offre est valable pour toute commande confirmée avant la fin du mois.
Répondez simplement à ce message pour réserver votre tarif préférentiel.

Cordialement,
La Direction Commerciale — OpenFlex Sénégal`,
  },
];

const LEAD_SOURCES = [
  'WhatsApp Business',
  'Site Web',
  'Salon FIDAK',
  'LinkedIn Sénégal',
  'Campagne E-mail',
  'Recommandation Client',
  'Appel Entrant',
];

export function MarketingView({ onNavigate }) {
  const {
    leads,
    campaigns,
    customers,
    settings,
    currencySymbol,
    currencyPosition,
    saveLead,
    deleteLead,
    convertLeadToProspect,
    saveCampaign,
    deleteCampaign,
    launchCampaign,
    showToast,
  } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState('leads'); // 'leads' | 'campaigns' | 'studio'
  const [statusFilter, setStatusFilter] = useState('all');
  const [tempFilter, setTempFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Lead Modal State
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [leadForm, setLeadForm] = useState({
    companyName: '',
    contactName: '',
    role: 'Gérant / Directeur',
    email: '',
    phone: '+221 77 ',
    city: 'Dakar',
    source: 'WhatsApp Business',
    status: 'nouveau',
    temperature: 'chaud',
    score: 80,
    estimatedBudget: 2500000,
    interest: 'Pack Gestion Commerciale & Stock',
    assignedTo: settings?.currentUser?.name || 'Aminata Fatou Ndiaye',
    notes: '',
  });

  // Campaign Preview Modal
  const [previewCampaign, setPreviewCampaign] = useState(null);

  // Email Studio State
  const [selectedTemplateId, setSelectedTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [studioSegment, setStudioSegment] = useState('tous');
  const [studioCampaignName, setStudioCampaignName] = useState(
    'Campagne Prospection PME Dakar — Novembre 2026'
  );
  const [studioSubject, setStudioSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [studioBody, setStudioBody] = useState(EMAIL_TEMPLATES[0].body);
  const [studioChannel, setStudioChannel] = useState('email');

  const fmt = (v) => formatCurrency(v, currencySymbol, currencyPosition);
  const company = settings?.company || {};

  // --- LEADS KPIs ---
  const activeLeads = leads.filter((l) => l.status !== 'converti');
  const hotLeads = leads.filter((l) => l.temperature === 'chaud' && l.status !== 'converti');
  const convertedLeads = leads.filter((l) => l.status === 'converti');
  const totalLeadsPotential = activeLeads.reduce(
    (sum, l) => sum + (Number(l.estimatedBudget) || 0),
    0
  );
  const leadConversionRate =
    leads.length > 0
      ? Math.round(
          ((convertedLeads.length + leads.filter((l) => l.status === 'qualifie').length) /
            leads.length) *
            100
        )
      : 0;

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (tempFilter !== 'all' && l.temperature !== tempFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.companyName?.toLowerCase().includes(q) ||
      l.contactName?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.interest?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q)
    );
  });

  // --- CAMPAIGNS KPIs ---
  const sentCampaigns = campaigns.filter((c) => c.status === 'envoyee');
  const totalRecipientsReached = sentCampaigns.reduce(
    (sum, c) => sum + (Number(c.recipientsCount) || 0),
    0
  );
  const avgOpenRate =
    sentCampaigns.length > 0
      ? Math.round(
          sentCampaigns.reduce((sum, c) => sum + (Number(c.openRate) || 0), 0) /
            sentCampaigns.length
        )
      : 0;
  const totalMarketingRevenue = campaigns.reduce(
    (sum, c) => sum + (Number(c.revenueGenerated) || 0),
    0
  );

  // Build dynamic recipient list from CRM Leads + Prospects + Clients for Email Studio
  const allAudiencePool = [
    ...leads.map((l) => ({
      id: l.id,
      type: 'lead',
      temperature: l.temperature,
      companyName: l.companyName,
      contactName: l.contactName,
      email: l.email,
      phone: l.phone,
      city: l.city || 'Dakar',
    })),
    ...customers.map((c) => {
      const primary = c.contacts?.find((ct) => ct.isPrimary) || c.contacts?.[0];
      return {
        id: c.id,
        type: c.type, // 'prospect' | 'client'
        temperature: c.type === 'prospect' ? 'chaud' : 'client',
        companyName: c.name,
        contactName: primary?.name || 'Direction',
        email: primary?.email || c.email,
        phone: primary?.phone || c.phone,
        city: c.city || 'Dakar',
      };
    }),
  ].filter((r) => r.email || r.phone);

  const studioRecipients = allAudiencePool.filter((r) => {
    if (studioSegment === 'leads_chauds') return r.type === 'lead' && r.temperature === 'chaud';
    if (studioSegment === 'prospects') return r.type === 'lead' || r.type === 'prospect';
    if (studioSegment === 'clients') return r.type === 'client';
    return true;
  });

  // Handlers
  const handleOpenNewLead = () => {
    setLeadToEdit(null);
    setLeadForm({
      companyName: '',
      contactName: '',
      role: 'Gérant / Directeur',
      email: '',
      phone: '+221 77 ',
      city: 'Dakar',
      source: 'WhatsApp Business',
      status: 'nouveau',
      temperature: 'chaud',
      score: 80,
      estimatedBudget: 2500000,
      interest: 'Pack Gestion Commerciale & Stock',
      assignedTo: settings?.currentUser?.name || 'Aminata Fatou Ndiaye',
      notes: '',
    });
    setLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead) => {
    setLeadToEdit(lead);
    setLeadForm({ ...lead });
    setLeadModalOpen(true);
  };

  const handleSubmitLead = (e) => {
    e.preventDefault();
    if (!leadForm.companyName.trim()) return;
    saveLead(leadForm);
    setLeadModalOpen(false);
  };

  // Direct WhatsApp message to a Lead
  const handleWhatsAppLead = (lead) => {
    const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');
    const msg = `Bonjour ${lead.contactName || ''},\n\nSuite à votre intérêt pour *${lead.interest || 'nos solutions OpenFlex'}* pour *${lead.companyName}*, je me tiens à votre disposition pour vous présenter notre proposition chiffrée en FCFA.\n\nCordialement,\n${lead.assignedTo || company.name || 'OpenFlex Sénégal'}`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Direct Email to a Lead
  const handleEmailLead = (lead) => {
    const subject = `Proposition OpenFlex Sénégal — ${lead.companyName}`;
    const body = `Bonjour ${lead.contactName || ''},\n\nSuite à nos échanges concernant votre projet (${lead.interest || 'Gestion & Équipement'}) pour ${lead.companyName} à ${lead.city || 'Dakar'}, nous serions ravis de vous accompagner.\n\nSouhaitez-vous recevoir notre devis détaillé en FCFA ?\n\nBien cordialement,\n${lead.assignedTo || ''}\n${company.name || 'OpenFlex Sénégal'}\nTél : ${company.phone || '+221 33 820 45 60'}`;
    window.location.href = `mailto:${lead.email || ''}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setStudioSegment(tpl.segment);
    setStudioSubject(tpl.subject);
    setStudioBody(tpl.body);
  };

  const renderPreviewText = (rawText, sampleRecipient) => {
    const rec = sampleRecipient || {
      contactName: 'Dr. Khady Sylla Diagne',
      companyName: 'Pharmacie & Laboratoire Casahous',
      city: 'Dakar Plateau',
    };
    return (rawText || '')
      .replace(/\{contact\}/g, rec.contactName || 'Madame, Monsieur')
      .replace(/\{nom_entreprise\}/g, rec.companyName || 'votre entreprise')
      .replace(/\{ville\}/g, rec.city || 'Dakar');
  };

  const handleSendStudioCampaign = (openMailClient = false) => {
    const saved = saveCampaign({
      name: studioCampaignName || 'Campagne E-mail Marketing',
      channel: studioChannel,
      targetSegment: studioSegment,
      subject: studioSubject,
      content: studioBody,
      status: 'envoyee',
      sentDate: new Date().toISOString().slice(0, 10),
      recipientsCount: studioRecipients.length,
      openRate: 62,
      clickRate: 26,
      leadsGenerated: 3,
      revenueGenerated: 0,
    });

    if (openMailClient) {
      const emails = studioRecipients
        .map((r) => r.email)
        .filter(Boolean)
        .join(',');
      const sampleBody = renderPreviewText(studioBody, studioRecipients[0]);
      window.location.href = `mailto:${company.email || ''}?bcc=${encodeURIComponent(
        emails
      )}&subject=${encodeURIComponent(studioSubject)}&body=${encodeURIComponent(sampleBody)}`;
    } else if (saved) {
      showToast(
        `Campagne "${saved.name}" enregistrée et envoyée à ${studioRecipients.length} contact(s) !`,
        'success'
      );
      setActiveSubTab('campaigns');
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
              Marketing, Acquisition de Leads & E-mailing
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-brand-50 text-brand-700 border border-brand-200/80">
              {leads.length} leads • {campaigns.length} campagnes
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Qualification des leads entrants, conversion en prospects/opportunités et campagnes E-mail & WhatsApp ciblées.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              exportToCSV(
                'openflex-leads-marketing',
                leads.map((l) => ({
                  ID: l.id,
                  Entreprise: l.companyName,
                  Contact: l.contactName,
                  Telephone: l.phone,
                  Email: l.email,
                  Ville: l.city,
                  Source: l.source,
                  Temperature: l.temperature,
                  Score: l.score,
                  Statut: l.status,
                  Budget_FCFA: l.estimatedBudget,
                }))
              )
            }
            className="pro-btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exporter Leads</span>
          </button>

          <button
            onClick={() => setActiveSubTab('studio')}
            className="pro-btn-secondary"
          >
            <Mail className="w-3.5 h-3.5 text-brand-600" />
            <span>Créer un E-mailing</span>
          </button>

          <button onClick={handleOpenNewLead} className="pro-btn-brand">
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Lead</span>
          </button>
        </div>
      </div>

      {/* Main Module Navigation Sub-Tabs */}
      <div className="pro-card p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            {
              id: 'leads',
              label: 'Suivi des Leads & Qualification',
              count: leads.length,
              icon: Target,
            },
            {
              id: 'campaigns',
              label: 'Campagnes E-mail & WhatsApp',
              count: campaigns.length,
              icon: Megaphone,
            },
            {
              id: 'studio',
              label: 'Studio Mail Marketing & Modèles',
              count: EMAIL_TEMPLATES.length,
              icon: Sparkles,
            },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[12.5px] font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono ${
                    active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 pr-2 text-[11.5px] text-slate-500">
          <span>Passerelle active :</span>
          <span className="font-semibold text-emerald-700">
            Lead → Prospect → Opportunité → Devis FCFA
          </span>
        </div>
      </div>

      {/* =====================================================================
          ONGLET 1 : SUIVI DES LEADS & QUALIFICATION
         ===================================================================== */}
      {activeSubTab === 'leads' && (
        <div className="space-y-5">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Leads entrants actifs
              </span>
              <div className="text-[22px] font-bold text-slate-900 font-mono mt-1">
                {activeLeads.length}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Sur {leads.length} leads enregistrés
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Leads Chauds prioritaires 🔥
              </span>
              <div className="text-[22px] font-bold text-rose-600 font-mono mt-1">
                {hotLeads.length}
              </div>
              <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">
                Score ≥ 75/100 • À convertir
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Potentiel commercial estimé
              </span>
              <div className="text-[20px] font-bold text-emerald-700 font-mono mt-1">
                {fmt(totalLeadsPotential)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Budgets cumulés déclarés
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Taux de qualification
              </span>
              <div className="text-[22px] font-bold text-slate-900 font-mono mt-1">
                {leadConversionRate}%
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                Qualifiés ou convertis en Prospect
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="pro-card p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold">
              {[
                { id: 'all', label: `Tous (${leads.length})` },
                {
                  id: 'nouveau',
                  label: `Nouveaux (${leads.filter((l) => l.status === 'nouveau').length})`,
                },
                {
                  id: 'contacte',
                  label: `Contactés (${leads.filter((l) => l.status === 'contacte').length})`,
                },
                {
                  id: 'qualifie',
                  label: `Qualifiés (${leads.filter((l) => l.status === 'qualifie').length})`,
                },
                {
                  id: 'converti',
                  label: `Convertis (${leads.filter((l) => l.status === 'converti').length})`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              {['all', 'chaud', 'tiede', 'froid'].map((tmp) => (
                <button
                  key={tmp}
                  onClick={() => setTempFilter(tmp)}
                  className={`px-2.5 py-1 rounded-md text-[11.5px] transition ${
                    tempFilter === tmp
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  {tmp === 'all'
                    ? 'Toutes temp.'
                    : tmp === 'chaud'
                    ? '🔥 Chaud'
                    : tmp === 'tiede'
                    ? '🌤️ Tiède'
                    : '❄️ Froid'}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher entreprise, contact, source…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[12.5px] bg-slate-50/90 border border-slate-200/90 rounded-md pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Leads Table */}
          <div className="pro-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="pro-table-header">
                    <th className="py-3 px-4">Lead & Interlocuteur</th>
                    <th className="py-3 px-4">Source & Intérêt exprimé</th>
                    <th className="py-3 px-4 text-center">Score & Température</th>
                    <th className="py-3 px-4 text-right">Budget estimé</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions & Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const isConverted = lead.status === 'converti';
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/90 transition">
                        {/* Company & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-brand-50 text-brand-700 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-brand-200/60">
                              {lead.companyName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{lead.companyName}</span>
                                <span className="text-[10.5px] font-mono text-slate-400">
                                  ({lead.id})
                                </span>
                              </div>
                              <div className="text-[11.5px] text-slate-600">
                                {lead.contactName} • <span className="text-slate-400">{lead.role}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {lead.phone} • {lead.city}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Source & Product Interest */}
                        <td className="py-3.5 px-4 max-w-[250px]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {lead.source}
                          </span>
                          <div className="text-[12px] font-medium text-slate-800 mt-1 truncate">
                            {lead.interest}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Suivi par {lead.assignedTo}
                          </div>
                        </td>

                        {/* Score & Temperature */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center gap-1">
                            <Badge status={lead.temperature} size="xs" />
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    lead.score >= 75
                                      ? 'bg-emerald-500'
                                      : lead.score >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${Math.min(100, lead.score)}%` }}
                                />
                              </div>
                              <span className="text-[10.5px] font-mono font-bold text-slate-700">
                                {lead.score}/100
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {fmt(lead.estimatedBudget)}
                        </td>

                        {/* Status Selector */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isConverted ? (
                            <Badge status="converti" size="xs" />
                          ) : (
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                saveLead({
                                  ...lead,
                                  status: e.target.value,
                                  lastContactDate: new Date().toISOString().slice(0, 10),
                                })
                              }
                              className="text-[11px] font-semibold px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="nouveau">● Nouveau Lead</option>
                              <option value="contacte">● Contacté</option>
                              <option value="qualifie">★ Qualifié (Prêt)</option>
                            </select>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* WhatsApp Direct */}
                            <button
                              onClick={() => handleWhatsAppLead(lead)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200/80 transition flex items-center gap-1"
                              title="Contacter ce lead sur WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-[#25D366]" />
                              <span className="hidden xl:inline">WhatsApp</span>
                            </button>

                            {/* Email Direct */}
                            <button
                              onClick={() => handleEmailLead(lead)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200/90 transition flex items-center gap-1"
                              title="Envoyer un e-mail de prospection"
                            >
                              <Mail className="w-3 h-3 text-brand-600" />
                              <span className="hidden xl:inline">Mail</span>
                            </button>

                            {/* Convert Lead -> Prospect + Opportunity */}
                            {!isConverted ? (
                              <button
                                onClick={() => convertLeadToProspect(lead.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-2xs transition flex items-center gap-1"
                                title="Convertir ce Lead en Prospect officiel + Créer l'opportunité dans le Pipeline"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>→ Prospect</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onNavigate?.('customers')}
                                className="px-2 py-1 text-[11px] font-mono font-semibold text-teal-800 bg-teal-50 rounded-md border border-teal-200"
                              >
                                Voir fiche →
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditLead(lead)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Supprimer le lead ${lead.companyName} ?`)) {
                                  deleteLead(lead.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ONGLET 2 : CAMPAGNES E-MAIL MARKETING & WHATSAPP
         ===================================================================== */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-5">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Campagnes créées
              </span>
              <div className="text-[22px] font-bold text-slate-900 font-mono mt-1">
                {campaigns.length}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {sentCampaigns.length} envoyée(s) • {campaigns.length - sentCampaigns.length} planifiée(s)
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Destinataires touchés
              </span>
              <div className="text-[22px] font-bold text-brand-600 font-mono mt-1">
                {totalRecipientsReached}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Contacts B2B Sénégal (E-mail & WhatsApp)
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                Taux d’ouverture moyen
              </span>
              <div className="text-[22px] font-bold text-emerald-600 font-mono mt-1">
                {avgOpenRate}%
              </div>
              <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                Performance supérieure à la moyenne B2B
              </span>
            </div>

            <div className="pro-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 block">
                CA généré par le Marketing
              </span>
              <div className="text-[20px] font-bold text-slate-900 font-mono mt-1">
                {fmt(totalMarketingRevenue)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Devis signés & factures payées attribués
              </span>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="pro-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="text-[14.5px] font-bold text-slate-900">
                  Historique & Planification des Campagnes Marketing
                </h2>
                <p className="text-[12px] text-slate-500">
                  Suivi des envois E-mail & WhatsApp, taux d’ouverture, clics et retour sur investissement en FCFA
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('studio')}
                className="pro-btn-brand"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle campagne</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="pro-table-header">
                    <th className="py-3 px-4">Campagne & Objet</th>
                    <th className="py-3 px-4">Canal & Audience</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-center">Destinataires</th>
                    <th className="py-3 px-4 text-center">Ouverture / Clics</th>
                    <th className="py-3 px-4 text-right">CA Généré</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4 max-w-[290px]">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-brand-700">{cmp.id}</span>
                          <span className="truncate">{cmp.name}</span>
                        </div>
                        <div className="text-[11.5px] text-slate-500 truncate mt-0.5">
                          Objet : « {cmp.subject} »
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          Date : {formatDate(cmp.sentDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {cmp.channel === 'email'
                            ? '✉️ E-mail Marketing'
                            : cmp.channel === 'whatsapp'
                            ? '💬 WhatsApp Broadcast'
                            : '✉️ + 💬 Mixte'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Cible : <span className="font-semibold uppercase">{cmp.targetSegment}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={cmp.status} size="xs" />
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {cmp.recipientsCount}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 font-mono text-[11.5px]">
                          <span className="font-bold text-emerald-700">{cmp.openRate}% ouv.</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-brand-700">{cmp.clickRate}% clics</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {cmp.leadsGenerated} lead(s) généré(s)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {fmt(cmp.revenueGenerated)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewCampaign(cmp)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200/90 flex items-center gap-1"
                            title="Aperçu du message de la campagne"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Aperçu</span>
                          </button>

                          {cmp.status !== 'envoyee' && (
                            <button
                              onClick={() => launchCampaign(cmp.id, allAudiencePool.length)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Envoyer</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la campagne ${cmp.name} ?`)) {
                                deleteCampaign(cmp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
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

      {/* =====================================================================
          ONGLET 3 : STUDIO E-MAIL MARKETING & MODÈLES PRÊTS À L'EMPLOI
         ===================================================================== */}
      {activeSubTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7/12): Template Selector + Composer */}
          <div className="lg:col-span-7 space-y-4">
            {/* Template Library */}
            <div className="pro-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[14.5px] font-bold text-slate-900">
                    1. Choisir un Modèle de Campagne (Sénégal / OHADA)
                  </h2>
                  <p className="text-[11.5px] text-slate-500">
                    Sélectionnez un modèle pré-rédigé avec variables personnalisées (&#123;contact&#125;, &#123;nom_entreprise&#125;, &#123;ville&#125;)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EMAIL_TEMPLATES.map((tpl) => {
                  const active = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-3 rounded-md border text-left transition ${
                        active
                          ? 'bg-brand-50/70 border-brand-500 ring-1 ring-brand-500/20'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="text-[12px] font-bold text-slate-900 leading-snug">
                        {tpl.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        Objet : {tpl.subject}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Editor */}
            <div className="pro-card p-5 space-y-4">
              <h2 className="text-[14.5px] font-bold text-slate-900">
                2. Paramétrer l’Audience & Rédiger le Message
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                    Nom de la campagne
                  </label>
                  <input
                    type="text"
                    value={studioCampaignName}
                    onChange={(e) => setStudioCampaignName(e.target.value)}
                    className="w-full text-[12.5px] bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                    Segment destinataire
                  </label>
                  <select
                    value={studioSegment}
                    onChange={(e) => setStudioSegment(e.target.value)}
                    className="w-full text-[12.5px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="tous">Toute la base ({allAudiencePool.length})</option>
                    <option value="prospects">Leads & Prospects</option>
                    <option value="leads_chauds">Leads Chauds 🔥 uniquement</option>
                    <option value="clients">Clients actifs uniquement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Objet de l’e-mail
                </label>
                <input
                  type="text"
                  value={studioSubject}
                  onChange={(e) => setStudioSubject(e.target.value)}
                  className="w-full text-[12.5px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-semibold text-slate-700">
                    Corps du message
                  </label>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-brand-700">
                    <span>Variables :</span>
                    {['{contact}', '{nom_entreprise}', '{ville}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setStudioBody((prev) => `${prev} ${v}`)}
                        className="px-1.5 py-0.5 rounded bg-brand-50 hover:bg-brand-100 border border-brand-200"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={studioBody}
                  onChange={(e) => setStudioBody(e.target.value)}
                  className="w-full text-[12.5px] bg-slate-50 border border-slate-200 rounded-md p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-[12px] text-slate-600">
                  Audience sélectionnée :{' '}
                  <span className="font-mono font-bold text-emerald-700">
                    {studioRecipients.length} contact(s) qualifié(s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendStudioCampaign(true)}
                    className="pro-btn-secondary"
                    title="Ouvrir votre messagerie avec tous les destinataires en copie cachée (BCC)"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-600" />
                    <span>Envoyer via Messagerie (BCC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendStudioCampaign(false)}
                    className="pro-btn-brand"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lancer la campagne ({studioRecipients.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5/12): Live Email Preview & Recipients List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="pro-card overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="text-[12px] font-semibold flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Aperçu E-mail Client en direct
                </span>
                <span className="text-[10.5px] font-mono text-slate-400">
                  Destinataire test : {studioRecipients[0]?.companyName || 'Prospect'}
                </span>
              </div>

              <div className="p-5 bg-slate-100/70">
                <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
                  {/* Email Header */}
                  <div className="px-5 py-4 bg-[#065f46] text-white flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold tracking-tight">
                        {company.name || 'OpenFlex Sénégal'}
                      </div>
                      <div className="text-[10.5px] text-emerald-200">
                        Solutions ERP, CRM & Facturation OHADA • Dakar
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/15 text-white">
                      FCFA • TVA 18%
                    </span>
                  </div>

                  {/* Email Subject & Body */}
                  <div className="p-5 space-y-3 text-[12.5px] text-slate-700">
                    <div className="pb-2.5 border-b border-slate-100">
                      <div className="text-[10.5px] text-slate-400 uppercase font-semibold">
                        Objet :
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {renderPreviewText(studioSubject, studioRecipients[0])}
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                      {renderPreviewText(studioBody, studioRecipients[0])}
                    </div>

                    <div className="pt-3">
                      <span className="inline-block px-4 py-2 rounded-md bg-emerald-700 text-white text-[12px] font-semibold">
                        Demander un Devis / Démonstration →
                      </span>
                    </div>
                  </div>

                  {/* Email Legal Footer */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[10.5px] text-slate-400">
                    <div>
                      {company.name || 'OpenFlex Sénégal SARL'} • {company.address || 'Dakar, Sénégal'}
                    </div>
                    <div className="font-mono mt-0.5">
                      Tél : {company.phone || '+221 33 820 45 60'} • {company.email || 'contact@openflex.sn'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Targeted Recipients Preview */}
            <div className="pro-card p-4">
              <div className="text-[12px] font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span>Destinataires inclus dans le segment ({studioRecipients.length})</span>
                <span className="text-[10.5px] font-mono text-emerald-700">Prêts à l’envoi</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-[11.5px]">
                {studioRecipients.map((r) => (
                  <div key={r.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{r.companyName}</div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {r.contactName} • {r.email || r.phone}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600 shrink-0">
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL : CRÉATION / ÉDITION DE LEAD
         ===================================================================== */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold">
                  {leadToEdit ? `Modifier le Lead ${leadToEdit.id}` : 'Nouveau Lead Marketing'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Qualification commerciale et estimation budgétaire en FCFA
                </p>
              </div>
              <button
                onClick={() => setLeadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 text-[12.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nom de l’entreprise / Organisation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Clinique Pasteur Dakar, Sédima..."
                    value={leadForm.companyName}
                    onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nom de l’interlocuteur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : M. Abdoulaye Ndiaye"
                    value={leadForm.contactName}
                    onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fonction / Rôle</label>
                  <input
                    type="text"
                    value={leadForm.role}
                    onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full font-mono border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail professionnel</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville / Région</label>
                  <input
                    type="text"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Source d’acquisition
                  </label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Température</label>
                  <select
                    value={leadForm.temperature}
                    onChange={(e) => setLeadForm({ ...leadForm, temperature: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white font-semibold"
                  >
                    <option value="chaud">🔥 Chaud (Prioritaire)</option>
                    <option value="tiede">🌤️ Tiède (À suivre)</option>
                    <option value="froid">❄️ Froid (Long terme)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Score de qualification (/100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={leadForm.score}
                    onChange={(e) => setLeadForm({ ...leadForm, score: Number(e.target.value) })}
                    className="w-full font-mono border border-slate-200 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Budget estimé (FCFA)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={leadForm.estimatedBudget}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, estimatedBudget: Number(e.target.value) })
                    }
                    className="w-full font-mono font-bold border border-slate-200 rounded-md px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Produit / Solution recherchée
                  </label>
                  <input
                    type="text"
                    value={leadForm.interest}
                    onChange={(e) => setLeadForm({ ...leadForm, interest: e.target.value })}
                    className="w-full border border-slate-200 rounded-md px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Notes de qualification
                  </label>
                  <textarea
                    rows={2}
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="w-full border border-slate-200 rounded-md p-2.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLeadModalOpen(false)}
                  className="pro-btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="pro-btn-brand">
                  Enregistrer le Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL : APERÇU D'UNE CAMPAGNE EXISTANTE
         ===================================================================== */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-[14px] font-bold">{previewCampaign.name}</span>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-[12.5px]">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="text-[10.5px] font-semibold uppercase text-slate-400">Objet</div>
                <div className="font-bold text-slate-900 mt-0.5">{previewCampaign.subject}</div>
              </div>
              <div className="p-4 bg-white rounded-md border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-700">
                {previewCampaign.content}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPreviewCampaign(null)}
                  className="pro-btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
