import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Mail,
  Smartphone,
  Check,
  Copy,
  Printer,
  ExternalLink,
  User,
  Building2,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Clean phone number for WhatsApp wa.me links
 * Handles Senegalese numbers (+221, 221, or 9 local digits starting with 7X)
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) {
    return `221${digits}`;
  }
  return digits;
}

export function SendDocumentModal({
  isOpen,
  onClose,
  document,
  documentType = 'devis', // 'devis' | 'facture'
  onOpenPdf,
}) {
  const { customers, settings, saveQuote, saveInvoice, saveActivity, currencySymbol, currencyPosition } = useCrm();

  const [activeChannel, setActiveChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [selectedContactId, setSelectedContactId] = useState('primary');
  const [targetName, setTargetName] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !document) return null;

  const isQuote = documentType === 'devis';
  const docLabel = isQuote ? 'Devis' : 'Facture';
  const company = settings?.company || {};
  const currentUser = settings?.currentUser || {};

  // Retrieve customer from database by ID
  const customer = customers.find((c) => c.id === document.customerId) || {
    name: document.customerName,
    email: '',
    phone: '',
    mobile: '',
    contacts: [],
  };

  // Compile list of available pre-registered contacts
  const contactsList = [];

  // 1. Company direct mobile & phone
  if (customer.mobile || customer.phone || customer.email) {
    contactsList.push({
      id: 'main_company',
      name: customer.name,
      role: customer.type === 'prospect' ? 'Fiche Prospect' : 'Siège Entreprise',
      phone: customer.mobile || customer.phone || '',
      email: customer.email || '',
      isPrimary: !customer.contacts || customer.contacts.length === 0,
    });
  }

  // 2. Individual pre-registered contacts
  if (customer.contacts && customer.contacts.length > 0) {
    customer.contacts.forEach((ctc) => {
      contactsList.push({
        id: ctc.id,
        name: ctc.name,
        role: ctc.role || 'Contact',
        phone: ctc.phone || '',
        email: ctc.email || '',
        isPrimary: Boolean(ctc.isPrimary),
      });
    });
  }

  // Initialize selected contact on open
  useEffect(() => {
    if (!isOpen) return;

    const primaryContact = contactsList.find((c) => c.isPrimary) || contactsList[0];
    if (primaryContact) {
      setSelectedContactId(primaryContact.id);
      applyContact(primaryContact);
    } else {
      setSelectedContactId('custom');
      setTargetName(document.customerName || '');
      setTargetPhone(customer.mobile || customer.phone || '');
      setTargetEmail(customer.email || '');
      generateTemplates(document.customerName || '', customer.mobile || customer.phone || '', customer.email || '');
    }
  }, [isOpen, document?.id]);

  const applyContact = (ctc) => {
    setTargetName(ctc.name || customer.name);
    setTargetPhone(ctc.phone || customer.mobile || customer.phone || '');
    setTargetEmail(ctc.email || customer.email || '');
    generateTemplates(ctc.name || customer.name, ctc.phone || customer.mobile || '', ctc.email || '');
  };

  const handleContactChange = (ctcId) => {
    setSelectedContactId(ctcId);
    if (ctcId === 'custom') {
      return;
    }
    const found = contactsList.find((c) => c.id === ctcId);
    if (found) {
      applyContact(found);
    }
  };

  // Generate Senegal-tailored WhatsApp and Email templates
  const generateTemplates = (contactName, phone, email) => {
    const greeting = contactName ? `Bonjour ${contactName},` : `Bonjour,`;
    const companyName = company.name || 'Notre Entreprise';
    const amountStr = formatCurrency(document.totalTTC, currencySymbol, currencyPosition);
    const dateStr = formatDate(document.date);
    const validUntilStr = document.validUntil ? formatDate(document.validUntil) : '';
    const waveNum = company.waveNumber || company.mobile || '+221 77 650 80 90';
    const omNum = company.orangeMoneyNumber || company.mobile || '+221 77 650 80 90';
    const senderName = currentUser?.name || 'Votre Responsable Commercial';

    // Articles summary (up to 3 items)
    let itemsSummary = '';
    if (document.items && document.items.length > 0) {
      itemsSummary = document.items
        .slice(0, 3)
        .map((it) => `  • ${it.description} (x${it.quantity})`)
        .join('\n');
      if (document.items.length > 3) {
        itemsSummary += `\n  • ...et ${document.items.length - 3} autre(s) prestation(s)`;
      }
    }

    // 1. WhatsApp Template (Markdown formatting for WhatsApp with *bold*)
    if (isQuote) {
      const waText = `${greeting}

Veuillez trouver ci-dessous les détails de notre proposition commerciale pour le *Devis N° ${document.id}* émis le ${dateStr} par *${companyName}*.

📋 *Détails de l'offre :*
${itemsSummary ? `${itemsSummary}\n` : ''}• Montant HT : ${formatCurrency(document.totalHT, currencySymbol, currencyPosition)}
• TVA (18%) : ${formatCurrency(document.totalVAT, currencySymbol, currencyPosition)}
• *Total Net TTC : ${amountStr}*
${validUntilStr ? `• Validité de l'offre : jusqu'au ${validUntilStr}\n` : ''}
💳 *Modalités de Règlement Sénégal :*
• Wave & Orange Money : ${waveNum}
• Virement bancaire ${company.bankName ? `(${company.bankName})` : ''}
• Merci d'indiquer la référence *${document.id}* lors de votre transfert.

Le devis complet au format PDF vous a été adressé. Nous restons à votre entière disposition pour tout échange ou validation.

Bien cordialement,
*${senderName}*
*${companyName}*
📞 ${company.phone || company.mobile || ''}`;
      setWaMessage(waText);

      // 2. Email Subject & Body
      setEmailSubject(`Devis ${document.id} - Proposition Commerciale - ${companyName}`);
      const emailText = `${greeting}

Nous avons le plaisir de vous transmettre notre meilleure proposition commerciale concernant le Devis N° ${document.id} daté du ${dateStr}.

RÉSUMÉ DU DEVIS :
--------------------------------------------------
Destinataire : ${customer.name}
${validUntilStr ? `Date limite de validité : ${validUntilStr}\n` : ''}
Montant Total HT   : ${formatCurrency(document.totalHT, currencySymbol, currencyPosition)}
TVA légale (18%)   : ${formatCurrency(document.totalVAT, currencySymbol, currencyPosition)}
TOTAL NET À PAYER  : ${amountStr}
--------------------------------------------------

CONDITIONS DE RÈGLEMENT (SÉNÉGAL) :
- Wave / Orange Money : ${waveNum}
- Virement bancaire : ${company.bankName || 'CBAO / Ecobank'} (IBAN : ${company.iban || 'SN08...'})
- Référence obligatoire à préciser : ${document.id}

Vous trouverez le devis détaillé en pièce jointe (PDF) avec les spécifications techniques et les conditions générales de vente.

Pour valider cette offre, il vous suffit de nous retourner ce devis signé et revêtu de la mention manuscrite « Bon pour accord ».

Nous restons à votre disposition pour toute information complémentaire.

Excellente réception et cordiales salutations,

${senderName}
${companyName}
${company.address || 'Dakar, Sénégal'}
Tél : ${company.phone || ''} | Mobile : ${company.mobile || ''}
${company.website || 'https://openflex.sn'}`;
      setEmailBody(emailText);
    } else {
      // Invoices WhatsApp & Email
      const remainingStr = formatCurrency(document.remainingAmount || document.totalTTC, currencySymbol, currencyPosition);
      const waText = `${greeting}

Veuillez trouver ci-dessous les détails de votre *Facture Officielle N° ${document.id}* émise le ${dateStr} par *${companyName}*.

📄 *Montant à régler : ${remainingStr}* (Échéance le ${formatDate(document.dueDate)})

💳 *Règlement direct par Mobile Money Sénégal :*
• Wave & Orange Money : ${waveNum}
• Virement : ${company.bankName || 'CBAO / Ecobank'}
• Référence à indiquer : *${document.id}*

Merci pour votre confiance.
*${senderName}* - *${companyName}*`;
      setWaMessage(waText);

      setEmailSubject(`Facture ${document.id} - ${companyName}`);
      setEmailBody(`${greeting}

Veuillez trouver ci-joint votre facture N° ${document.id} d'un montant de ${remainingStr}, arrivant à échéance le ${formatDate(document.dueDate)}.

Paiements acceptés : Wave, Orange Money (${waveNum}) ou virement bancaire.
Merci de rappeler la référence ${document.id} lors de votre règlement.

Cordialement,
${senderName} - ${companyName}`);
    }
  };

  // Action: Mark document as sent and log activity
  const markAsSent = (channelName) => {
    if (isQuote && document.status === 'brouillon') {
      saveQuote({
        ...document,
        status: 'envoye',
      });
    }

    // Record activity in customer timeline
    saveActivity({
      customerId: document.customerId,
      customerName: document.customerName,
      type: channelName === 'whatsapp' ? 'message' : 'email',
      title: `${docLabel} ${document.id} envoyé via ${channelName === 'whatsapp' ? 'WhatsApp' : 'E-mail'}`,
      description: `Destinataire : ${targetName} (${channelName === 'whatsapp' ? targetPhone : targetEmail}) - Montant : ${formatCurrency(document.totalTTC, currencySymbol, currencyPosition)}`,
      dueDate: new Date().toISOString(),
      completed: true,
      assignedTo: currentUser?.name || 'Mamadou Lamine Diop',
    });
  };

  // Launch WhatsApp Web or Mobile App
  const handleSendWhatsApp = () => {
    const cleanPhone = formatWhatsAppPhone(targetPhone);
    if (!cleanPhone) {
      alert('Veuillez renseigner un numéro de téléphone valide pour WhatsApp.');
      return;
    }
    const encoded = encodeURIComponent(waMessage);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
    markAsSent('whatsapp');
    onClose();
  };

  // Launch Email Client (mailto)
  const handleSendEmail = () => {
    if (!targetEmail) {
      alert('Veuillez renseigner une adresse e-mail de destination.');
      return;
    }
    const mailto = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailto;
    markAsSent('email');
    onClose();
  };

  const handleCopyWa = () => {
    navigator.clipboard?.writeText(waMessage);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(emailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const isPhoneValid = Boolean(formatWhatsAppPhone(targetPhone));
  const isEmailValid = Boolean(targetEmail && targetEmail.includes('@'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  Envoyer le {docLabel} au Client ou Prospect
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-brand-300">
                  {document.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Coordonnées préenregistrées de <strong className="text-white">{document.customerName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
          {/* Step 1: Pre-registered Contacts Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-brand-600" />
                Coordonnées Préenregistrées du Destinataire :
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Réf Client : {document.customerId}
              </span>
            </div>

            {contactsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contactsList.map((ctc) => {
                  const isSelected = selectedContactId === ctc.id;
                  return (
                    <button
                      key={ctc.id}
                      type="button"
                      onClick={() => handleContactChange(ctc.id)}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-slate-900 truncate">{ctc.name}</span>
                        {ctc.isPrimary && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Principal
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate">{ctc.role}</span>
                      <div className="mt-1.5 text-[10px] text-slate-600 font-mono space-y-0.5">
                        {ctc.phone && <div className="truncate">📞 {ctc.phone}</div>}
                        {ctc.email && <div className="truncate">✉️ {ctc.email}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Aucune coordonnée directe n'a été trouvée sur la fiche. Vous pouvez saisir le numéro ou l'e-mail manuellement ci-dessous.
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Channel Switcher (WhatsApp vs Email) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveChannel('whatsapp')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs ${
                activeChannel === 'whatsapp'
                  ? 'bg-[#25D366] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Envoyer par WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('email')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs ${
                activeChannel === 'email'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Envoyer par E-mail</span>
            </button>
          </div>

          {/* Step 3: Channel Form Content */}
          {activeChannel === 'whatsapp' ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Numéro WhatsApp du destinataire</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Sénégal : 77, 78, 76, 70 ou international)
                    </span>
                  </label>
                  {isPhoneValid ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Numéro valide ({formatWhatsAppPhone(targetPhone)})
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">
                      Numéro manquant
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+221 77 450 11 22 ou 774501122"
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Message WhatsApp pré-rempli (personnalisable) :
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyWa}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                  >
                    {copiedWa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedWa ? 'Copié !' : 'Copier le texte'}</span>
                  </button>
                </div>
                <textarea
                  rows="9"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 font-sans leading-relaxed focus:outline-none focus:border-brand-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Le message inclut automatiquement le montant total en Franc CFA, les coordonnées Wave / OM et la validité du devis.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Adresse E-mail du destinataire
                  </label>
                  {isEmailValid ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> E-mail valide
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">
                      E-mail manquant
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="contact@client-senegal.sn"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Objet de l'E-mail
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Corps de l'E-mail officiel :
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmail ? 'Copié !' : 'Copier le texte'}</span>
                  </button>
                </div>
                <textarea
                  rows="9"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 font-mono leading-relaxed focus:outline-none focus:border-brand-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onOpenPdf ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPdf(document);
              }}
              className="text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4 text-brand-600" />
              <span>Aperçu & Télécharger le PDF</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Annuler
            </button>

            {activeChannel === 'whatsapp' ? (
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!isPhoneValid}
                className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition flex items-center justify-center gap-2 ${
                  isPhoneValid
                    ? 'bg-[#25D366] hover:bg-[#20ba59] active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Ouvrir dans WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={!isEmailValid}
                className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition flex items-center justify-center gap-2 ${
                  isEmailValid
                    ? 'bg-brand-600 hover:bg-brand-700 active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Ouvrir dans mon E-mail</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
