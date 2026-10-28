import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Database,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Server,
  ShieldCheck,
  ArrowUpRight,
  DownloadCloud,
  UploadCloud,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatDateTime } from '../../utils/formatters';

const SUPABASE_QUICK_SQL = `-- Copiez-collez ce script dans "SQL Editor" sur Supabase puis cliquez sur "Run"
CREATE TABLE IF NOT EXISTS crm_cloud_state (
    id TEXT PRIMARY KEY DEFAULT 'OPENFLEX-MAIN',
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE crm_cloud_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to crm_cloud_state"
ON crm_cloud_state FOR ALL
USING (true)
WITH CHECK (true);`;

export function CloudDatabaseTab() {
  const { restoreBackup } = useCrm();

  const [status, setStatus] = useState({
    enabled: false,
    supabaseUrl: '',
    hasKey: false,
    lastSyncAt: null,
    lanUrls: [],
    port: 3001,
  });
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedLan, setCopiedLan] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cloud-status');
      if (res.ok) {
        const json = await res.json();
        setStatus(json);
        if (json.supabaseUrl && !supabaseUrl) {
          setSupabaseUrl(json.supabaseUrl);
        }
      }
    } catch (e) {
      // ignore if offline
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SUPABASE_QUICK_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyLan = (url) => {
    navigator.clipboard?.writeText(url);
    setCopiedLan(url);
    setTimeout(() => setCopiedLan(''), 2000);
  };

  const handleConnectAndSync = async (mode = 'push') => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setFeedback({
        type: 'error',
        text: 'Veuillez renseigner l’URL du projet Supabase (https://xxx.supabase.co) et la clé API (anon / service_role).',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/cloud-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: supabaseUrl.trim(),
          supabaseKey: supabaseKey.trim(),
          mode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({
          type: 'error',
          text: json.error || 'Échec de connexion à Supabase.',
        });
      } else {
        if (mode === 'pull' && json.data) {
          restoreBackup(json.data);
        }
        setFeedback({
          type: 'success',
          text: json.message || 'Base de données en ligne connectée et synchronisée !',
        });
        fetchStatus();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Erreur réseau : ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectCloud = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await fetch('/api/cloud-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl: '', supabaseKey: '' }),
      });
      setSupabaseKey('');
      setFeedback({
        type: 'success',
        text: 'Synchronisation cloud désactivée. Vos données restent enregistrées localement.',
      });
      fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* 1. Accès immédiat sur le réseau Wi-Fi / Bureau local */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Option A — Accès immédiat sur votre Wi-Fi (Téléphone, Tablette, PC du bureau)
              </h3>
              <p className="text-xs text-slate-500">
                Tous vos appareils connectés au même réseau Wi-Fi peuvent ouvrir le CRM dès maintenant via l'adresse ci-dessous
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Actif immédiatement
          </span>
        </div>

        {status.lanUrls && status.lanUrls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {status.lanUrls.map((url) => (
              <div
                key={url}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Adresse à taper sur votre téléphone ou autre PC :
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-mono font-bold text-brand-600 hover:underline"
                  >
                    {url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLan(url)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  {copiedLan === url ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Connectez votre ordinateur à un réseau Wi-Fi pour afficher votre adresse IP locale partageable.
          </p>
        )}
      </div>

      {/* 2. Base de données PostgreSQL en ligne (Supabase Cloud) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Option B — Base de Données PostgreSQL en Ligne (Supabase Cloud — Gratuit)
              </h3>
              <p className="text-xs text-slate-500">
                Synchronisez automatiquement tous vos clients, stocks, devis et factures dans une base de données cloud sécurisée accessible partout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {status.enabled ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Cloud Connecté
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                Non connecté (Stockage local)
              </span>
            )}
          </div>
        </div>

        {/* Étapes guidées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Étape 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold">
                ÉTAPE 1
              </span>
              <span className="text-[10px] text-slate-400">1 minute</span>
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Créer un projet gratuit Supabase</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ouvrez <strong>Supabase.com</strong>, cliquez sur <em>« New Project »</em>, nommez-le{' '}
              <code className="bg-white px-1 py-0.5 rounded border">openflex-crm</code> et choisissez la région Europe (Frankfurt/Paris).
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 pt-1"
            >
              <span>Ouvrir Supabase.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Étape 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold">
                ÉTAPE 2
              </span>
              <span className="text-[10px] text-slate-400">30 secondes</span>
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Initialiser la table SQL</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dans le menu gauche de Supabase, cliquez sur <strong>SQL Editor</strong>, collez le script ci-dessous et cliquez sur <strong>Run</strong>.
            </p>
            <button
              type="button"
              onClick={handleCopySql}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-xs"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Script SQL copié ! Collez-le dans Supabase</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le Script SQL Supabase</span>
                </>
              )}
            </button>
          </div>

          {/* Étape 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold">
                ÉTAPE 3
              </span>
              <span className="text-[10px] text-slate-400">30 secondes</span>
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Copier l'URL & la Clé API</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dans Supabase, allez dans <strong>Project Settings → Data API / API Keys</strong>, copiez <strong>Project URL</strong> et la clé <strong>anon public</strong> puis collez-les ci-dessous.
            </p>
          </div>
        </div>

        {/* Formulaire de connexion directe */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Project URL Supabase *
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Clé API Supabase (anon public ou service_role) *
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder={status.hasKey ? '•••••••••••••••••••••••• (Clé enregistrée)' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {status.lastSyncAt && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dernière synchronisation en ligne : <strong>{formatDateTime(status.lastSyncAt)}</strong></span>
            </div>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConnectAndSync('push')}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{loading ? 'Connexion en cours...' : 'Connecter & Envoyer mes données vers le Cloud'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleConnectAndSync('pull')}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4 text-brand-600" />
                <span>Récupérer depuis le Cloud</span>
              </button>
            </div>

            {status.enabled && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDisconnectCloud}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                Déconnecter le Cloud
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Hébergement Web 24h/24 sur Render.com */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Option C — Mettre tout le logiciel sur Internet 24h/24 (Même ordinateur éteint)
            </h3>
            <p className="text-xs text-slate-500">
              Pour obtenir une adresse web permanente (ex: <code className="font-mono">https://mon-crm-senegal.onrender.com</code>) accessible en 4G/5G partout au Sénégal et à l'étranger :
            </p>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 pl-1">
          <li>
            Créez un compte gratuit sur{' '}
            <a
              href="https://render.com"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-brand-600 hover:underline"
            >
              Render.com
            </a>{' '}
            et liez votre dossier CRM (via GitHub).
          </li>
          <li>
            Choisissez <strong>New Web Service</strong> → Build Command :{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">npm install && npm run build</code> → Start Command :{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">node server/index.js</code>.
          </li>
          <li>
            Dans <strong>Environment Variables</strong> sur Render, ajoutez vos variables{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">SUPABASE_URL</code> et{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">SUPABASE_KEY</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}
