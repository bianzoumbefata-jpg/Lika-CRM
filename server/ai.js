// =============================================================================
// Assistant IA Lika — proxy serveur multi-fournisseur.
// La clé API reste côté serveur (data/ai_config.json, ignoré par git, ou
// variables d'environnement) et n'est jamais renvoyée au navigateur.
//
// Fournisseurs pris en charge :
//   - anthropic : Claude via le SDK officiel @anthropic-ai/sdk
//   - openai    : toute API compatible OpenAI /chat/completions
//                 (OpenAI, Mistral, DeepSeek, Groq, OpenRouter, Ollama…)
//   - gemini    : Google Gemini (generateContent)
//   - agnes     : Agnes AI (compatible OpenAI, https://apihub.agnes-ai.com/v1)
// =============================================================================
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

export const PROVIDERS = {
  agnes: { label: 'Agnes AI', defaultModel: 'agnes-2.5-flash', defaultBaseUrl: 'https://apihub.agnes-ai.com/v1' },
  anthropic: { label: 'Anthropic Claude', defaultModel: 'claude-opus-5-5', defaultBaseUrl: '' },
  openai: { label: 'Compatible OpenAI', defaultModel: 'gpt-4o-mini', defaultBaseUrl: 'https://api.openai.com/v1' },
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-2.5-flash', defaultBaseUrl: '' },
};

const SYSTEM_PROMPT = `Tu es « Lika IA », l'assistant intégré au logiciel Lika CRM, utilisé par une PME au Sénégal.
Contexte métier : devise Franc CFA (FCFA / XOF), TVA 18 %, normes comptables OHADA, paiements par Wave, Orange Money et virement bancaire.
Tu aides l'utilisateur à piloter ses ventes, ses devis, ses factures, son recouvrement, ses leads et ses e-mails clients.
Réponds en français, de façon concise et structurée (titres courts, listes à puces, montants au format « 1 250 000 FCFA »).
Appuie-toi uniquement sur les données CRM fournies ci-dessous ; si une information manque, dis-le plutôt que d'inventer.
Quand on te demande de rédiger un e-mail, fournis l'objet sur une ligne « Objet : … » puis le corps du message.`;

export function createAiService({ configFile }) {
  function readConfig() {
    let file = {};
    try {
      if (fs.existsSync(configFile)) file = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e) {
      console.error('Erreur lecture ai_config.json:', e.message);
    }
    const provider = file.provider || process.env.AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : '');
    const envKey =
      process.env.AI_API_KEY ||
      (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : '') ||
      (provider === 'openai' ? process.env.OPENAI_API_KEY : '') ||
      (provider === 'gemini' ? process.env.GEMINI_API_KEY : '') ||
      (provider === 'agnes' ? process.env.AGNES_API_KEY : '') ||
      '';
    const meta = PROVIDERS[provider] || {};
    return {
      provider,
      apiKey: file.apiKey || envKey,
      model: file.model || process.env.AI_MODEL || meta.defaultModel || '',
      baseUrl: (file.baseUrl || process.env.AI_BASE_URL || meta.defaultBaseUrl || '').replace(/\/+$/, ''),
    };
  }

  function writeConfig(next) {
    fs.writeFileSync(configFile, JSON.stringify(next, null, 2), 'utf8');
  }

  function publicStatus() {
    const cfg = readConfig();
    return {
      configured: Boolean(cfg.provider && cfg.apiKey && PROVIDERS[cfg.provider]),
      provider: cfg.provider,
      providerLabel: PROVIDERS[cfg.provider]?.label || '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      keyHint: cfg.apiKey ? `••••${cfg.apiKey.slice(-4)}` : '',
      providers: Object.entries(PROVIDERS).map(([id, p]) => ({ id, ...p })),
    };
  }

  function saveConfig({ provider, apiKey, model, baseUrl }) {
    if (provider && !PROVIDERS[provider]) throw new Error(`Fournisseur inconnu : ${provider}`);
    const current = (() => {
      try {
        return fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : {};
      } catch {
        return {};
      }
    })();
    const next = {
      provider: provider ?? current.provider ?? '',
      // Une clé vide conserve la clé existante ; "__delete__" l'efface.
      apiKey: apiKey === '__delete__' ? '' : apiKey ? String(apiKey).trim() : current.apiKey || '',
      model: model ?? current.model ?? '',
      baseUrl: baseUrl ?? current.baseUrl ?? '',
    };
    writeConfig(next);
    return publicStatus();
  }

  // ---------------------------------------------------------------------------
  // Appels fournisseurs
  // ---------------------------------------------------------------------------
  async function callAnthropic(cfg, system, messages) {
    const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) });
    // Les modèles Claude récents acceptent un repli serveur automatique en cas de refus.
    const supportsFallback = /^claude-(opus-5|fable-5|sonnet-5-5)/.test(cfg.model);
    const params = {
      model: cfg.model,
      max_tokens: 16000,
      system,
      messages,
      output_config: { effort: 'low' },
    };
    const response = supportsFallback
      ? await client.beta.messages.create({
          ...params,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })
      : await client.messages.create(params);

    if (response.stop_reason === 'refusal') {
      throw new Error("Le modèle a refusé de répondre à cette demande.");
    }
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return { text, model: response.model, truncated: response.stop_reason === 'max_tokens' };
  }

  async function callOpenAi(cfg, system, messages) {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || `Erreur HTTP ${res.status}`);
    return { text: json?.choices?.[0]?.message?.content?.trim() || '', model: json?.model || cfg.model };
  }

  async function callGemini(cfg, system, messages) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || `Erreur HTTP ${res.status}`);
    const text = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return { text, model: cfg.model };
  }

  function friendlyError(err) {
    if (err instanceof Anthropic.AuthenticationError) return 'Clé API invalide ou expirée.';
    if (err instanceof Anthropic.PermissionDeniedError) return "Cette clé n'a pas accès au modèle demandé.";
    if (err instanceof Anthropic.NotFoundError) return 'Modèle introuvable : vérifiez son identifiant.';
    if (err instanceof Anthropic.RateLimitError) return 'Limite de requêtes atteinte, réessayez dans un instant.';
    if (err instanceof Anthropic.APIConnectionError) return 'Impossible de joindre le service IA (connexion Internet ?).';
    if (err instanceof Anthropic.APIError) return `Erreur du service IA (${err.status ?? 'inconnue'}).`;
    return err?.message || 'Erreur inconnue du service IA.';
  }

  async function chat({ messages = [], context = '' }) {
    const cfg = readConfig();
    if (!cfg.provider || !cfg.apiKey) {
      const e = new Error("Aucune clé API configurée pour l'assistant IA.");
      e.status = 412;
      throw e;
    }
    const clean = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
      .slice(-20)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) }));
    // L'API exige que la conversation commence par l'utilisateur.
    while (clean.length && clean[0].role !== 'user') clean.shift();
    if (!clean.length) throw Object.assign(new Error('Message vide.'), { status: 400 });

    const system = `${SYSTEM_PROMPT}\n\n### Données CRM actuelles\n${String(context).slice(0, 20000)}`;
    try {
      if (cfg.provider === 'anthropic') return await callAnthropic(cfg, system, clean);
      // Agnes AI expose une API compatible OpenAI (apihub.agnes-ai.com/v1)
      if (cfg.provider === 'openai' || cfg.provider === 'agnes') return await callOpenAi(cfg, system, clean);
      if (cfg.provider === 'gemini') return await callGemini(cfg, system, clean);
      throw new Error(`Fournisseur non pris en charge : ${cfg.provider}`);
    } catch (err) {
      const e = new Error(friendlyError(err));
      e.status = 502;
      throw e;
    }
  }

  return { publicStatus, saveConfig, chat };
}

export function registerAiRoutes(app, service) {
  app.get('/api/ai/status', (req, res) => res.json(service.publicStatus()));

  app.post('/api/ai/config', (req, res) => {
    try {
      res.json(service.saveConfig(req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      res.json(await service.chat(req.body || {}));
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  app.post('/api/ai/test', async (req, res) => {
    try {
      const out = await service.chat({
        messages: [{ role: 'user', content: 'Réponds uniquement « OK » pour confirmer que tu fonctionnes.' }],
        context: 'Test de connexion.',
      });
      res.json({ ok: true, model: out.model, reply: out.text.slice(0, 120) });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  });
}
