import React, { useState } from 'react';
import { X, Send, AlertTriangle, Mail, History, CheckCircle } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function ReminderModal({ isOpen, onClose, invoice }) {
  const { sendPaymentReminder, currencySymbol, currencyPosition, settings } = useCrm();
  const [level, setLevel] = useState('courtois'); // 'courtois' | 'ferme' | 'mise_en_demeure'
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !invoice) return null;

  const company = settings?.company || {};
  const remaining = Number(invoice.remainingAmount) || 0;

  const templates = {
    courtois: {
      title: 'Niveau 1 : Relance Courtoise',
      subject: `Rappel amical : Facture ${invoice.id} en attente de règlement - ${company.name}`,
      body: `Bonjour,\n\nSauf erreur ou omission de notre part, le règlement de la facture ${invoice.id} d'un montant de ${formatCurrency(remaining, currencySymbol, currencyPosition)}, échue le ${formatDate(invoice.dueDate)}, ne nous est pas parvenu.\n\nNous vous remercions de bien vouloir procéder à son règlement par virement ou par le mode de paiement convenu dès réception.\n\nRestant à votre disposition,\nBien cordialement,\nL'équipe ${company.name}`,
    },
    ferme: {
      title: 'Niveau 2 : Relance Ferme',
      subject: `URGENT - 2ème Relance : Facture ${invoice.id} échue (${formatCurrency(remaining, currencySymbol, currencyPosition)})`,
      body: `Madame, Monsieur,\n\nMalgré notre première relance, nous constatons que la facture ${invoice.id} d'un montant restant de ${formatCurrency(remaining, currencySymbol, currencyPosition)} reste impayée à ce jour.\n\nNous vous demandons de régulariser cette situation sous un délai strict de 48 heures.\n\nDans l'attente de votre confirmation de virement bancaire,\nSalutations distinguées,\n${company.name}`,
    },
    mise_en_demeure: {
      title: 'Niveau 3 : Mise en Demeure Formelle',
      subject: `MISE EN DEMEURE DE PAYER - Facture ${invoice.id}`,
      body: `Madame, Monsieur,\n\nPar la présente, nous vous mettons formellement en demeure de régler sous 8 jours la somme principale de ${formatCurrency(remaining, currencySymbol, currencyPosition)} correspondant à la facture ${invoice.id}.\n\nConformément aux dispositions légales en vigueur, des intérêts de retard ainsi que l'indemnité forfaitaire de 40€ pour frais de recouvrement seront appliqués à défaut de règlement sous ce délai.\n\nService Recouvrement - ${company.name}`,
    },
  };

  const currentTemplate = templates[level];

  const handleSend = () => {
    sendPaymentReminder(invoice.id, level, customNote || currentTemplate.subject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Relancer un Impayé par E-mail</h2>
              <p className="text-xs text-slate-500">
                Facture {invoice.id} • Destinataire : {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Level selector tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Niveau d'urgence de la relance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLevel('courtois')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  level === 'courtois'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                1. Courtoise
              </button>
              <button
                type="button"
                onClick={() => setLevel('ferme')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  level === 'ferme'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                2. Ferme (48h)
              </button>
              <button
                type="button"
                onClick={() => setLevel('mise_en_demeure')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  level === 'mise_en_demeure'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                3. Mise en demeure
              </button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Objet de l'e-mail</label>
            <input
              type="text"
              readOnly
              value={currentTemplate.subject}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            />
          </div>

          {/* Email Body Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Corps du message (Généré automatiquement)
            </label>
            <textarea
              rows="6"
              readOnly
              value={currentTemplate.body}
              className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 leading-relaxed"
            />
          </div>

          {/* Past reminder history */}
          {invoice.reminderHistory && invoice.reminderHistory.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Historique des relances déjà envoyées :
              </span>
              <div className="space-y-1">
                {invoice.reminderHistory.map((rem, idx) => (
                  <div key={idx} className="text-slate-500 text-[11px] flex justify-between">
                    <span>
                      {formatDate(rem.date)} - Niveau <strong>{rem.level}</strong> (par {rem.sentBy})
                    </span>
                    <span className="text-slate-400 truncate max-w-[200px]">{rem.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer & Enregistrer la Relance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
