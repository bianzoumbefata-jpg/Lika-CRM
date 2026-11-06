import React, { useEffect, useState } from 'react';
import {
  Mail,
  RefreshCw,
  Settings2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PlugZap,
  Unplug,
  ShieldCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

const timeAgo = (iso) => {
  if (!iso) return 'jamais';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(iso).toLocaleString('fr-FR');
};

/** Bandeau d'état de la boîte e-mail connectée (en tête de la boîte de réception) */
export function MailboxBar() {
  const { mailStatus, mailSyncing, syncMailbox } = useCrm();
  const [open, setOpen] = useState(false);
  const connected = Boolean(mailStatus?.configured);

  return (
    <>
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
          connected ? 'bg-white border-slate-200' : 'bg-brand-50 border-brand-200'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connected ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-100 text-brand-600'
            }`}
          >
            {connected ? <Mail className="w-5 h-5" /> : <PlugZap className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            {connected ? (
              <>
                <div className="text-[13.5px] font-bold text-slate-900 truncate flex items-center gap-2">
                  {mailStatus.email}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                    Connectée
                  </span>
                </div>
                <div className="text-[12px] text-slate-500">
                  Réception et envoi réels · dernière relève {timeAgo(mailStatus.lastSyncAt)} · relève auto toutes les 3 min
                </div>
              </>
            ) : (
              <>
                <div className="text-[13.5px] font-bold text-slate-900">Connectez votre boîte e-mail au CRM</div>
                <div className="text-[12px] text-slate-600">
                  Recevez vos e-mails ici et envoyez devis et factures en pièce jointe depuis votre propre adresse.
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && (
            <button
              onClick={() => syncMailbox()}
              disabled={mailSyncing}
              className="pro-btn-secondary disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mailSyncing ? 'animate-spin' : ''}`} />
              {mailSyncing ? 'Relève…' : 'Relever'}
            </button>
          )}
          <button onClick={() => setOpen(true)} className={connected ? 'pro-btn-secondary' : 'pro-btn-brand'}>
            {connected ? <Settings2 className="w-3.5 h-3.5" /> : <PlugZap className="w-3.5 h-3.5" />}
            {connected ? 'Paramètres' : 'Connecter ma boîte'}
          </button>
        </div>
      </div>
      {open && <MailboxSettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Fenêtre de configuration IMAP / SMTP */
export function MailboxSettingsModal({ onClose }) {
  const { mailStatus, refreshMailStatus, syncMailbox, settings } = useCrm();
  const presets = mailStatus?.presets || [];
  const [form, setForm] = useState({
    preset: mailStatus?.preset || 'gmail',
    email: mailStatus?.email || '',
    displayName: mailStatus?.displayName || settings?.company?.name || '',
    username: mailStatus?.username || '',
    password: '',
    imapHost: mailStatus?.imap?.host || '',
    imapPort: mailStatus?.imap?.port || 993,
    smtpHost: mailStatus?.smtp?.host || '',
    smtpPort: mailStatus?.smtp?.port || 465,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preset = presets.find((p) => p.id === form.preset);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls =
    'w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/mail/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: form.preset,
          email: form.email,
          displayName: form.displayName,
          username: form.username,
          password: form.password,
          imap: { host: form.imapHost, port: Number(form.imapPort), secure: Number(form.imapPort) === 993 },
          smtp: { host: form.smtpHost, port: Number(form.smtpPort), secure: Number(form.smtpPort) === 465 },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setResult(json);
      if (json.imap && json.smtp) {
        await refreshMailStatus();
        syncMailbox();
      }
    } catch (err) {
      setResult({ errors: [err.message] });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    await fetch('/api/mail/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await refreshMailStatus();
    setBusy(false);
    onClose();
  };

  const ok = result?.imap && result?.smtp;

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Connexion de la boîte e-mail"
        className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl"
      >
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-extrabold text-slate-900">Boîte e-mail de l'entreprise</h2>
              <p className="text-[12.5px] text-slate-500">Réception (IMAP) et envoi (SMTP) directement dans Lika CRM</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 text-[13px]">
          <div>
            <span className="block font-semibold text-slate-700 mb-1.5">Fournisseur de messagerie</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      preset: p.id,
                      imapHost: p.imap.host,
                      imapPort: p.imap.port,
                      smtpHost: p.smtp.host,
                      smtpPort: p.smtp.port,
                    }))
                  }
                  className={`px-3 py-2.5 rounded-xl border text-[12px] font-semibold text-left transition ${
                    form.preset === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset?.help && (
              <p className="mt-2 flex gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                {preset.help}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mb-email" className="block font-semibold text-slate-700 mb-1">Adresse e-mail</label>
              <input id="mb-email" type="email" required value={form.email} onChange={set('email')} placeholder="contact@votre-entreprise.sn" className={inputCls} />
            </div>
            <div>
              <label htmlFor="mb-name" className="block font-semibold text-slate-700 mb-1">Nom affiché</label>
              <input id="mb-name" type="text" value={form.displayName} onChange={set('displayName')} placeholder="Lika Sénégal" className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="mb-pass" className="block font-semibold text-slate-700 mb-1">
              Mot de passe {form.preset === 'gmail' || form.preset === 'yahoo' ? "d'application" : ''}
            </label>
            <input
              id="mb-pass"
              type="password"
              autoComplete="new-password"
              required={!mailStatus?.hasPassword}
              value={form.password}
              onChange={set('password')}
              placeholder={mailStatus?.hasPassword ? 'Laisser vide pour conserver le mot de passe actuel' : '••••••••••••••••'}
              className={`${inputCls} font-mono`}
            />
            <p className="mt-1 text-[11.5px] text-slate-500">
              Conservé uniquement sur le serveur Lika (<code className="font-mono">data/mail_config.json</code>), jamais renvoyé au navigateur.
            </p>
          </div>

          {form.preset === 'custom' && (
            <div className="grid grid-cols-[1fr_96px] gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label htmlFor="mb-imap" className="block font-semibold text-slate-700 mb-1">Serveur IMAP (réception)</label>
                <input id="mb-imap" required value={form.imapHost} onChange={set('imapHost')} placeholder="mail.votre-domaine.sn" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label htmlFor="mb-imap-port" className="block font-semibold text-slate-700 mb-1">Port</label>
                <input id="mb-imap-port" type="number" value={form.imapPort} onChange={set('imapPort')} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label htmlFor="mb-smtp" className="block font-semibold text-slate-700 mb-1">Serveur SMTP (envoi)</label>
                <input id="mb-smtp" required value={form.smtpHost} onChange={set('smtpHost')} placeholder="mail.votre-domaine.sn" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label htmlFor="mb-smtp-port" className="block font-semibold text-slate-700 mb-1">Port</label>
                <input id="mb-smtp-port" type="number" value={form.smtpPort} onChange={set('smtpPort')} className={`${inputCls} font-mono`} />
              </div>
              <div className="col-span-2">
                <label htmlFor="mb-user" className="block font-semibold text-slate-700 mb-1">Identifiant (si différent de l'adresse)</label>
                <input id="mb-user" value={form.username} onChange={set('username')} className={`${inputCls} font-mono`} />
              </div>
            </div>
          )}

          {result && (
            <div
              role="status"
              className={`p-3 rounded-xl border flex items-start gap-2 ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
            >
              {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="space-y-0.5">
                {ok ? (
                  <div>Connexion réussie : réception et envoi fonctionnent. Première relève en cours…</div>
                ) : (
                  (result.errors || []).map((er) => <div key={er}>{er}</div>)
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {mailStatus?.configured ? (
            <button type="button" onClick={disconnect} disabled={busy} className="pro-btn-secondary !text-rose-600">
              <Unplug className="w-3.5 h-3.5" />
              Déconnecter
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="pro-btn-secondary">
              {ok ? 'Fermer' : 'Annuler'}
            </button>
            <button type="submit" disabled={busy || mailStatus?.offline} className="pro-btn-brand disabled:opacity-60">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlugZap className="w-3.5 h-3.5" />}
              {busy ? 'Test de connexion…' : 'Tester et connecter'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
