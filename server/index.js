import express from 'express';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'data');
const dbFile = path.resolve(dataDir, 'crm_database.json');
const cloudConfigFile = path.resolve(dataDir, 'cloud_config.json');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Cloud config helper (Supabase REST API - PostgreSQL en ligne)
function readCloudConfig() {
  const envUrl = process.env.SUPABASE_URL || '';
  const envKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
  try {
    if (fs.existsSync(cloudConfigFile)) {
      const cfg = JSON.parse(fs.readFileSync(cloudConfigFile, 'utf8'));
      return {
        supabaseUrl: (cfg.supabaseUrl || envUrl).replace(/\/+$/, ''),
        supabaseKey: cfg.supabaseKey || envKey,
        lastSyncAt: cfg.lastSyncAt || null,
        enabled: Boolean(cfg.supabaseUrl || envUrl),
      };
    }
  } catch (e) {
    console.error('Erreur lecture cloud_config.json:', e.message);
  }
  return {
    supabaseUrl: envUrl.replace(/\/+$/, ''),
    supabaseKey: envKey,
    lastSyncAt: null,
    enabled: Boolean(envUrl && envKey),
  };
}

function writeCloudConfig(cfg) {
  fs.writeFileSync(cloudConfigFile, JSON.stringify(cfg, null, 2), 'utf8');
}

// Push state to Supabase table `crm_cloud_state`
async function pushToSupabase(data, customCfg) {
  const cfg = customCfg || readCloudConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    return { ok: false, error: 'URL ou Clé Supabase non configurée' };
  }

  const endpoint = `${cfg.supabaseUrl}/rest/v1/crm_cloud_state?on_conflict=id`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: cfg.supabaseKey,
      Authorization: `Bearer ${cfg.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: 'OPENFLEX-MAIN',
      payload: data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText };
  }

  const now = new Date().toISOString();
  writeCloudConfig({ ...cfg, lastSyncAt: now, enabled: true });
  return { ok: true, lastSyncAt: now };
}

// Pull state from Supabase table `crm_cloud_state`
async function pullFromSupabase(customCfg) {
  const cfg = customCfg || readCloudConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    return { ok: false, error: 'URL ou Clé Supabase non configurée' };
  }

  const endpoint = `${cfg.supabaseUrl}/rest/v1/crm_cloud_state?id=eq.OPENFLEX-MAIN&select=payload,updated_at`;
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: cfg.supabaseKey,
      Authorization: `Bearer ${cfg.supabaseKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText };
  }

  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
    return { ok: true, data: rows[0].payload, updatedAt: rows[0].updated_at };
  }
  return { ok: true, data: null };
}

// Helper to safely read DB
function readDb() {
  try {
    if (!fs.existsSync(dbFile)) {
      writeDb(initialData, false);
      return initialData;
    }
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erreur lecture DB locale, utilisation initialData:', err);
    return initialData;
  }
}

// Helper to safely write DB (atomic write via temp file + async cloud sync)
function writeDb(data, syncCloud = true) {
  const tempFile = `${dbFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, dbFile);

  if (syncCloud) {
    const cfg = readCloudConfig();
    if (cfg.enabled && cfg.supabaseUrl && cfg.supabaseKey) {
      pushToSupabase(data, cfg).catch((err) => {
        console.error('Erreur synchro Supabase en arrière-plan:', err.message);
      });
    }
  }
}

// Discover local network IPs for immediate Wi-Fi / LAN access
function getLanUrls(port) {
  const nets = os.networkInterfaces();
  const urls = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`);
      }
    }
  }
  return urls;
}

// Initialize on start if not present
if (!fs.existsSync(dbFile)) {
  writeDb(initialData, false);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API: Get complete database (pulls from Supabase if online cloud is enabled)
app.get('/api/data', async (req, res) => {
  const cfg = readCloudConfig();
  if (cfg.enabled && cfg.supabaseUrl && cfg.supabaseKey) {
    try {
      const remote = await pullFromSupabase(cfg);
      if (remote.ok && remote.data && remote.data.customers) {
        writeDb(remote.data, false);
        return res.json(remote.data);
      }
    } catch (e) {
      console.error('Fallback lecture locale (Supabase injoignable):', e.message);
    }
  }
  const data = readDb();
  res.json(data);
});

// API: Save entire database state
app.post('/api/save', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Données invalides' });
    }
    writeDb(data, true);
    res.json({ success: true, message: 'Base de données mise à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Cloud status & LAN URLs
app.get('/api/cloud-status', (req, res) => {
  const cfg = readCloudConfig();
  res.json({
    enabled: Boolean(cfg.enabled && cfg.supabaseUrl && cfg.supabaseKey),
    supabaseUrl: cfg.supabaseUrl || '',
    hasKey: Boolean(cfg.supabaseKey),
    lastSyncAt: cfg.lastSyncAt,
    lanUrls: getLanUrls(PORT),
    port: PORT,
  });
});

// API: Save & test Supabase Cloud Configuration
app.post('/api/cloud-config', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, mode = 'push' } = req.body || {};
    if (!supabaseUrl || !supabaseKey) {
      writeCloudConfig({ supabaseUrl: '', supabaseKey: '', lastSyncAt: null, enabled: false });
      return res.json({ ok: true, enabled: false, message: 'Synchronisation cloud désactivée (mode local actif).' });
    }

    const cleanCfg = {
      supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ''),
      supabaseKey: supabaseKey.trim(),
      lastSyncAt: null,
      enabled: true,
    };

    if (mode === 'pull') {
      const pulled = await pullFromSupabase(cleanCfg);
      if (!pulled.ok) {
        return res.status(400).json({
          ok: false,
          error: `Impossible de lire la table crm_cloud_state sur Supabase : ${pulled.error}`,
        });
      }
      if (pulled.data && pulled.data.customers) {
        writeDb(pulled.data, false);
        const now = new Date().toISOString();
        writeCloudConfig({ ...cleanCfg, lastSyncAt: now });
        return res.json({
          ok: true,
          enabled: true,
          lastSyncAt: now,
          data: pulled.data,
          message: 'Données récupérées depuis Supabase Cloud avec succès !',
        });
      }
    }

    // Default: push current local DB to Supabase
    const localData = readDb();
    const pushed = await pushToSupabase(localData, cleanCfg);
    if (!pushed.ok) {
      return res.status(400).json({
        ok: false,
        error: `Connexion Supabase refusée (avez-vous exécuté le script SQL pour créer la table crm_cloud_state ?) : ${pushed.error}`,
      });
    }

    return res.json({
      ok: true,
      enabled: true,
      lastSyncAt: pushed.lastSyncAt,
      message: 'Connecté à Supabase ! Vos données sont maintenant synchronisées en ligne.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// API: Stock Movement Endpoint
app.post('/api/stock-movement', (req, res) => {
  try {
    const { productId, type, quantity, reason, reference, performedBy } = req.body;
    const db = readDb();
    const product = db.products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const qty = Number(quantity) || 0;
    const currentStock = Number(product.stock) || 0;
    let newStock = currentStock;

    if (type === 'entree') newStock += qty;
    else if (type === 'sortie' || type === 'perte') newStock = Math.max(0, currentStock - qty);
    else if (type === 'ajustement') newStock = qty;

    product.stock = newStock;

    const newMvt = {
      id: `MVT-${Date.now().toString().slice(-5)}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity: qty,
      date: new Date().toISOString().slice(0, 10),
      reason: reason || 'Mouvement stock',
      reference: reference || '',
      performedBy: performedBy || 'Admin',
    };

    db.stockMovements = [newMvt, ...(db.stockMovements || [])];
    writeDb(db, true);

    res.json({ success: true, movement: newMvt, newStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Reset to initial demo data (Senegal FCFA)
app.post('/api/reset', (req, res) => {
  try {
    writeDb(initialData, true);
    res.json({ success: true, message: 'Données réinitialisées (Sénégal - FCFA)', data: initialData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Backup download
app.get('/api/backup', (req, res) => {
  const data = readDb();
  const filename = `openflex-crm-senegal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

// API: Restore from backup
app.post('/api/restore', (req, res) => {
  try {
    const data = req.body;
    if (!data.customers || !data.products || !data.quotes || !data.invoices) {
      return res.status(400).json({ error: 'Structure de sauvegarde invalide' });
    }
    writeDb(data, true);
    res.json({ success: true, message: 'Sauvegarde restaurée avec succès', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Real-time Email Open Tracking Pixel (1x1 transparent GIF)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

app.get('/api/track/open/:trackingId', (req, res) => {
  try {
    const rawId = String(req.params.trackingId || '').replace(/\.gif$/i, '');
    const db = readDb();
    const nowIso = new Date().toISOString();
    const nowFormatted = nowIso.replace('T', ' ').slice(0, 16);

    if (Array.isArray(db.scheduledEmails)) {
      const target = db.scheduledEmails.find(
        (m) => m.trackingId === rawId || m.id === rawId
      );
      if (target) {
        target.status = 'ouvert';
        target.openedAt = nowFormatted;
        target.openCount = (Number(target.openCount) || 0) + 1;
        target.lastDevice = req.headers['user-agent'] || 'Client Mail / Mobile';

        const notif = {
          id: `NOTIF-${Date.now()}`,
          type: 'email_opened',
          emailId: target.id,
          recipientCompany: target.recipientCompany,
          recipientName: target.recipientName,
          recipientEmail: target.recipientEmail,
          subject: target.subject,
          openedAt: nowFormatted,
          openCount: target.openCount,
          unread: true,
        };
        db.readNotifications = [notif, ...(db.readNotifications || [])];
        writeDb(db, true);
      }
    }
  } catch (e) {
    console.error('Erreur tracking pixel:', e.message);
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.end(TRANSPARENT_GIF_BUFFER);
});

// Serve frontend build if exists in dist
const distPath = path.resolve(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenFlex CRM Sénégal (FCFA) démarré sur http://localhost:${PORT}`);
  const lan = getLanUrls(PORT);
  if (lan.length > 0) {
    console.log(`Accès réseau Wi-Fi / LAN : ${lan.join(' | ')}`);
  }
});
