// =============================================================================
// Messagerie Lika : connexion de la boîte e-mail de l'entreprise au CRM.
//   - Réception : IMAP (imapflow + mailparser)
//   - Envoi     : SMTP (nodemailer), avec pièces jointes PDF
// Les identifiants restent côté serveur (data/mail_config.json, ignoré par git)
// et le mot de passe n'est jamais renvoyé au navigateur.
// =============================================================================
import fs from 'fs';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export const MAIL_PRESETS = {
  gmail: {
    label: 'Gmail / Google Workspace',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
    savesSent: true,
    help: "Activez la validation en 2 étapes de votre compte Google, puis créez un « mot de passe d'application » sur myaccount.google.com/apppasswords et utilisez-le ici.",
  },
  outlook: {
    label: 'Outlook / Microsoft 365',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
    savesSent: false,
    help: "L'accès IMAP/SMTP doit être autorisé par l'administrateur Microsoft 365. Certains comptes Outlook.com personnels n'acceptent plus le mot de passe simple.",
  },
  yahoo: {
    label: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    savesSent: false,
    help: 'Générez un mot de passe d’application dans la sécurité de votre compte Yahoo.',
  },
  zoho: {
    label: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 465, secure: true },
    savesSent: false,
    help: 'Activez l’accès IMAP dans Paramètres Zoho Mail > Comptes de messagerie.',
  },
  custom: {
    label: 'Autre hébergeur (cPanel, OVH, Orange…)',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
    savesSent: false,
    help: 'Renseignez les serveurs IMAP et SMTP fournis par votre hébergeur (souvent mail.votre-domaine.sn).',
  },
};

const normalizeSubject = (s = '') =>
  String(s)
    .replace(/^\s*((re|tr|fw|fwd|réf)\s*:\s*)+/gi, '')
    .trim()
    .toLowerCase();

export function createMailService({ configFile }) {
  function read() {
    try {
      if (fs.existsSync(configFile)) return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e) {
      console.error('Erreur lecture mail_config.json:', e.message);
    }
    return {};
  }
  function write(cfg) {
    fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), 'utf8');
  }

  const isConfigured = (c) => Boolean(c.email && c.password && c.imap?.host && c.smtp?.host);

  function publicStatus() {
    const c = read();
    return {
      configured: isConfigured(c),
      preset: c.preset || 'gmail',
      email: c.email || '',
      displayName: c.displayName || '',
      username: c.username || '',
      imap: c.imap || null,
      smtp: c.smtp || null,
      hasPassword: Boolean(c.password),
      lastSyncAt: c.lastSyncAt || null,
      presets: Object.entries(MAIL_PRESETS).map(([id, p]) => ({ id, label: p.label, help: p.help, imap: p.imap, smtp: p.smtp })),
    };
  }

  function imapClient(c) {
    return new ImapFlow({
      host: c.imap.host,
      port: Number(c.imap.port) || 993,
      secure: c.imap.secure !== false,
      auth: { user: c.username || c.email, pass: c.password },
      logger: false,
      socketTimeout: 60000,
    });
  }

  function smtpTransport(c) {
    return nodemailer.createTransport({
      host: c.smtp.host,
      port: Number(c.smtp.port) || 465,
      secure: c.smtp.secure !== false && Number(c.smtp.port) !== 587,
      auth: { user: c.username || c.email, pass: c.password },
    });
  }

  function friendly(err) {
    const msg = String(err?.responseText || err?.response || err?.message || err);
    if (/auth|credentials|invalid login|535|AUTHENTICATIONFAILED/i.test(msg))
      return "Identifiants refusés : vérifiez l'adresse et le mot de passe (souvent un « mot de passe d'application »).";
    if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return 'Serveur introuvable : vérifiez le nom du serveur ou votre connexion Internet.';
    if (/ETIMEDOUT|timeout/i.test(msg)) return 'Le serveur de messagerie ne répond pas (délai dépassé).';
    if (/ECONNREFUSED/i.test(msg)) return 'Connexion refusée : vérifiez le port et le chiffrement SSL/TLS.';
    return msg.slice(0, 240);
  }

  async function test(c = read()) {
    const result = { imap: false, smtp: false, errors: [] };
    const client = imapClient(c);
    try {
      await client.connect();
      result.imap = true;
    } catch (e) {
      result.errors.push(`Réception (IMAP) : ${friendly(e)}`);
    } finally {
      await client.logout().catch(() => {});
    }
    try {
      await smtpTransport(c).verify();
      result.smtp = true;
    } catch (e) {
      result.errors.push(`Envoi (SMTP) : ${friendly(e)}`);
    }
    return result;
  }

  async function saveConfig(body = {}) {
    const cur = read();
    const preset = MAIL_PRESETS[body.preset] ? body.preset : cur.preset || 'gmail';
    const p = MAIL_PRESETS[preset];
    const next = {
      ...cur,
      preset,
      email: String(body.email ?? cur.email ?? '').trim(),
      displayName: String(body.displayName ?? cur.displayName ?? '').trim(),
      username: String(body.username ?? cur.username ?? '').trim(),
      password: body.password ? String(body.password) : cur.password || '',
      imap: preset === 'custom' ? { ...p.imap, ...(cur.imap || {}), ...(body.imap || {}) } : p.imap,
      smtp: preset === 'custom' ? { ...p.smtp, ...(cur.smtp || {}), ...(body.smtp || {}) } : p.smtp,
    };
    if (next.email !== cur.email) {
      next.lastUid = 0;
      next.uidValidity = null;
    }
    if (!isConfigured(next)) throw Object.assign(new Error('Adresse, mot de passe et serveurs sont obligatoires.'), { status: 400 });
    const t = await test(next);
    if (t.imap && t.smtp) write(next);
    return { ...t, status: t.imap && t.smtp ? publicStatus() : undefined };
  }

  function disconnect() {
    write({});
    return publicStatus();
  }

  async function sync({ limit = 40 } = {}) {
    const c = read();
    if (!isConfigured(c)) throw Object.assign(new Error('Boîte e-mail non connectée.'), { status: 412 });
    const client = imapClient(c);
    const messages = [];
    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        const box = client.mailbox;
        const fresh = !c.lastUid || String(c.uidValidity) !== String(box.uidValidity);
        let range;
        let byUid = true;
        if (fresh) {
          if (!box.exists) range = null;
          else {
            range = `${Math.max(1, box.exists - limit + 1)}:*`;
            byUid = false;
          }
        } else {
          range = `${c.lastUid + 1}:*`;
        }
        let maxUid = fresh ? 0 : c.lastUid;
        if (range) {
          for await (const msg of client.fetch(range, { uid: true, flags: true, source: true }, { uid: byUid })) {
            if (!fresh && msg.uid <= c.lastUid) continue;
            maxUid = Math.max(maxUid, msg.uid);
            const parsed = await simpleParser(msg.source);
            const from = parsed.from?.value?.[0] || {};
            messages.push({
              uid: msg.uid,
              messageId: parsed.messageId || `uid-${box.uidValidity}-${msg.uid}`,
              inReplyTo: parsed.inReplyTo || null,
              references: [].concat(parsed.references || []),
              subject: parsed.subject || '(sans objet)',
              subjectKey: normalizeSubject(parsed.subject),
              fromName: from.name || from.address || 'Expéditeur inconnu',
              fromEmail: (from.address || '').toLowerCase(),
              to: parsed.to?.text || '',
              date: (parsed.date || new Date()).toISOString(),
              text: String(parsed.text || '').trim().slice(0, 20000) || '(message sans texte)',
              seen: msg.flags?.has('\\Seen') || false,
              attachments: (parsed.attachments || []).map((a) => ({ filename: a.filename, size: a.size, contentType: a.contentType })),
            });
          }
        }
        write({ ...c, lastUid: maxUid, uidValidity: String(box.uidValidity), lastSyncAt: new Date().toISOString() });
      } finally {
        lock.release();
      }
    } catch (e) {
      throw Object.assign(new Error(friendly(e)), { status: 502 });
    } finally {
      await client.logout().catch(() => {});
    }
    messages.sort((a, b) => a.date.localeCompare(b.date));
    return { messages, lastSyncAt: new Date().toISOString() };
  }

  async function send({ to, cc, subject, text, html, inReplyTo, references, attachments = [] } = {}) {
    const c = read();
    if (!isConfigured(c)) throw Object.assign(new Error('Boîte e-mail non connectée.'), { status: 412 });
    if (!to || !String(to).includes('@')) throw Object.assign(new Error('Adresse du destinataire invalide.'), { status: 400 });

    const mail = {
      from: c.displayName ? `"${c.displayName.replace(/"/g, '')}" <${c.email}>` : c.email,
      to,
      cc: cc || undefined,
      subject: subject || '(sans objet)',
      text: text || '',
      html: html || undefined,
      inReplyTo: inReplyTo || undefined,
      references: references?.length ? references : undefined,
      attachments: attachments
        .filter((a) => a?.contentBase64)
        .map((a) => ({
          filename: a.filename || 'document.pdf',
          content: Buffer.from(a.contentBase64, 'base64'),
          contentType: a.contentType || 'application/pdf',
        })),
    };

    try {
      const raw = await new MailComposer(mail).compile().build();
      const info = await smtpTransport(c).sendMail({
        envelope: { from: c.email, to: [].concat(to, cc || []).join(',') },
        raw,
      });
      const messageId = (raw.toString('utf8').match(/^Message-ID:\s*(<[^>]+>)/im) || [])[1] || info.messageId;

      // Copie dans « Envoyés » (Gmail le fait déjà automatiquement)
      if (!MAIL_PRESETS[c.preset]?.savesSent) {
        const client = imapClient(c);
        try {
          await client.connect();
          const boxes = await client.list();
          const sent = boxes.find((b) => b.specialUse === '\\Sent') || boxes.find((b) => /sent|envoy/i.test(b.path));
          if (sent) await client.append(sent.path, raw, ['\\Seen']);
        } catch {
          /* copie facultative : on ignore les erreurs */
        } finally {
          await client.logout().catch(() => {});
        }
      }
      return { ok: true, messageId, sentAt: new Date().toISOString() };
    } catch (e) {
      throw Object.assign(new Error(friendly(e)), { status: 502 });
    }
  }

  return { publicStatus, saveConfig, disconnect, test, sync, send };
}

export function registerMailRoutes(app, service) {
  const wrap = (fn) => async (req, res) => {
    try {
      res.json(await fn(req.body || {}));
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  };
  app.get('/api/mail/status', (req, res) => res.json(service.publicStatus()));
  app.post('/api/mail/config', wrap((b) => service.saveConfig(b)));
  app.post('/api/mail/disconnect', wrap(() => service.disconnect()));
  app.post('/api/mail/sync', wrap((b) => service.sync(b)));
  app.post('/api/mail/send', wrap((b) => service.send(b)));
}
