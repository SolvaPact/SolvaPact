import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const TICKETS_FILE = path.resolve('.support-tickets.json');
const ANALYTICS_FILE = path.resolve('.analytics-data.json');
const REPORTS_SENT_FILE = path.resolve('.daily-reports-sent.json');

const OWNER_REPORT_EMAIL = 'solvapact.vercel.app@gmail.com';
const ALLOWED_OWNER_EMAILS = ['solvapact.vercel.app@gmail.com', 'hugolaumonier@gmail.com'];

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  aiTranscript?: string;
  createdAt: string;
}

type AnalyticsEventType =
  | 'dossier_published'
  | 'loyalty_created'
  | 'dossier_accepted'
  | 'satisfaction_review';

interface AnalyticsEvent {
  id: string;
  date: string; // YYYY-MM-DD in Europe/Paris
  timestamp: string;
  type: AnalyticsEventType;
  dossierId?: string;
  dossierTitle?: string;
  amount?: number;
  rating?: number;
  comment?: string;
  userName?: string;
  userEmail?: string;
}

interface DailyReportSummary {
  date: string;
  dossiersPosted: number;
  dossierRevenue: number;
  loyaltyAccountsCreated: number;
  loyaltyRevenue: number;
  dossiersAccepted: number;
  averageRating: number | null;
  reviews: Array<{
    id: string;
    dossierId?: string;
    dossierTitle?: string;
    rating: number;
    comment: string;
    userName?: string;
    timestamp: string;
  }>;
}

interface ReportDispatchRecord {
  date: string;
  dispatchedAt: string;
  deliveryMode: 'resend_api' | 'saved_mailto';
  recipientEmail: string;
  summary: DailyReportSummary;
}

const SOLVASOLUTION_SYSTEM_INSTRUCTION = `Tu es SolvaSolution, l'assistant IA officiel du service d'aide de la plateforme SolvaPact (solvapact.vercel.app).
Tu réponds en français, de façon claire, bienveillante, précise et concise (sans jargon inutile).

Voici les règles exactes et à jour de SolvaPact :
1. Création de compte obligatoire et gratuite à l'entrée + acceptation des Conditions d'Utilisation : chaque utilisateur crée son profil (Prénom, Nom, Email, Téléphone, Profession : Entrepreneur, Investisseur, Salarié, Artisan/Commerçant, etc.) et accepte que ses coordonnées (e-mail, téléphone, prénom, nom) soient visibles lorsqu'un membre souhaite négocier un dossier qu'il publie.
2. Mise en relation uniquement (négociation par Gmail/téléphone et virements en dehors du site) : les dossiers sont préparés et publiés sur SolvaPact. En cliquant sur le bouton « Négocier » en bas d'un dossier publié, la fiche de contact du créateur s'affiche (Gmail/e-mail, téléphone, nom, prénom). Toute la négociation ainsi que les virements d'argent, prêts, rachats de dettes et remboursements se font directement entre les parties en dehors du site. SolvaPact ne gère aucun virement ni aucun fonds client.
3. Rédaction de dossier 100 % gratuite & publication à 29,99 € : le paiement de 29,99 € est demandé uniquement au moment de publier le dossier en ligne.
4. Zéro commission sur les transactions : SolvaPact se rémunère uniquement via les frais de publication de dossier (29,99 €) et le Compte Fidélité (80 €), jamais via une commission sur les accords ou abonnements mensuels.
5. Compte Fidélité SolvaPact (80 € en une seule fois à vie) :
   - Chaque dossier publié rapporte +10 EXP.
   - Palier Bronze (50 EXP) : -10 % de réduction sur la publication (soit 26,99 €) et le nom du compte prend la couleur Bronze.
   - Palier Silver (150 EXP) : -17 % de réduction sur la publication (soit 24,89 €) et le nom du compte prend la couleur Silver.
   - Palier Gold (300 EXP) : -23 % de réduction sur la publication (soit 23,09 €) et le nom du compte prend la couleur Gold.
6. Cadre légal & réseaux sociaux : les accords entre particuliers/entrepreneurs relèvent du Code Civil français (articles 1892 et 2044). Les utilisateurs peuvent suivre les actualités et envoyer leurs conseils sur Instagram (@solvapact), Facebook (Solva Pact) et LinkedIn (Solva Pact).
7. Limites & transfert humain : tu ne peux pas modifier manuellement un paiement, vérifier une pièce d'identité, trancher un litige juridique individuel ni accéder aux comptes bancaires. Dans ces cas, ou dès que la demande dépasse l'information générale, explique honnêtement que l'équipe SolvaPact va prendre le relais et termine exactement ta réponse par le marqueur [ESCALADE_HUMAIN].`;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getParisDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts;
}

function getParisHourMinute(date = new Date()): { hour: number; minute: number } {
  const str = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const [h, m] = str.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_OWNER_EMAILS.includes(email.trim().toLowerCase());
}

function readTickets(): SupportTicket[] {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, 'utf8');
      return JSON.parse(raw) as SupportTicket[];
    }
  } catch (err) {
    console.error('Error reading support tickets:', err);
  }
  return [];
}

function saveTicket(ticket: SupportTicket): void {
  try {
    const existing = readTickets();
    existing.unshift(ticket);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(existing.slice(0, 200), null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving support ticket:', err);
  }
}

function readAnalyticsEvents(): AnalyticsEvent[] {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
      return JSON.parse(raw) as AnalyticsEvent[];
    }
  } catch (err) {
    console.error('Error reading analytics events:', err);
  }
  return [];
}

function saveAnalyticsEvents(events: AnalyticsEvent[]): void {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(events.slice(0, 5000), null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving analytics events:', err);
  }
}

function readReportsSent(): Record<string, ReportDispatchRecord> {
  try {
    if (fs.existsSync(REPORTS_SENT_FILE)) {
      const raw = fs.readFileSync(REPORTS_SENT_FILE, 'utf8');
      return JSON.parse(raw) as Record<string, ReportDispatchRecord>;
    }
  } catch (err) {
    console.error('Error reading sent reports:', err);
  }
  return {};
}

function saveReportSent(record: ReportDispatchRecord): void {
  try {
    const existing = readReportsSent();
    existing[record.date] = record;
    fs.writeFileSync(REPORTS_SENT_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving report dispatch record:', err);
  }
}

function computeDailyReport(dateKey: string): DailyReportSummary {
  const events = readAnalyticsEvents().filter((e) => e.date === dateKey);

  const publishedEvents = events.filter((e) => e.type === 'dossier_published');
  const loyaltyEvents = events.filter((e) => e.type === 'loyalty_created');
  const acceptedEvents = events.filter((e) => e.type === 'dossier_accepted');
  const reviewEvents = events.filter((e) => e.type === 'satisfaction_review');

  const dossierRevenue =
    Math.round(publishedEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) * 100) / 100;
  const loyaltyRevenue =
    Math.round(loyaltyEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) * 100) / 100;

  const reviews = reviewEvents.map((r) => ({
    id: r.id,
    dossierId: r.dossierId,
    dossierTitle: r.dossierTitle,
    rating: Number(r.rating) || 5,
    comment: r.comment || '',
    userName: r.userName,
    timestamp: r.timestamp,
  }));

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return {
    date: dateKey,
    dossiersPosted: publishedEvents.length,
    dossierRevenue,
    loyaltyAccountsCreated: loyaltyEvents.length,
    loyaltyRevenue,
    dossiersAccepted: acceptedEvents.length,
    averageRating,
    reviews,
  };
}

function formatFrenchCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDailyReportEmail(report: DailyReportSummary): {
  subject: string;
  body: string;
} {
  const [y, m, d] = report.date.split('-');
  const frDate = y && m && d ? `${d}/${m}/${y}` : report.date;
  const subject = `[SolvaPact] Rendu de fin de journée — ${frDate}`;

  const reviewsBlock =
    report.reviews.length > 0
      ? report.reviews
          .map(
            (r, idx) =>
              `  ${idx + 1}. ${r.rating}/5 étoiles${r.userName ? ` — ${r.userName}` : ''}${
                r.dossierTitle ? ` (${r.dossierTitle})` : ''
              }${r.comment ? `\n     Commentaire : "${r.comment}"` : ''}`
          )
          .join('\n')
      : '  Aucun avis déposé sur cette journée.';

  const body = `Bonjour,

Voici le rendu automatique de fin de journée de votre plateforme SolvaPact pour le ${frDate} :

1. Nombre de dossiers postés : ${report.dossiersPosted}
2. Chiffre d'affaires lié aux dossiers publiés : ${formatFrenchCurrency(report.dossierRevenue)}
3. Nombre de comptes fidélité créés : ${report.loyaltyAccountsCreated}${
    report.loyaltyRevenue > 0 ? ` (${formatFrenchCurrency(report.loyaltyRevenue)})` : ''
  }
4. Nombre de dossiers acceptés : ${report.dossiersAccepted}

--- Satisfaction clients (${report.reviews.length} avis${
    report.averageRating !== null ? ` · Note moyenne : ${report.averageRating}/5` : ''
  }) ---
${reviewsBlock}

---
Rendu privé destiné uniquement au propriétaire (${OWNER_REPORT_EMAIL}).`;

  return { subject, body };
}

async function dispatchDailyReport(dateKey: string): Promise<{
  record: ReportDispatchRecord;
  emailSubject: string;
  emailBody: string;
}> {
  const summary = computeDailyReport(dateKey);
  const { subject, body } = formatDailyReportEmail(summary);
  let deliveryMode: 'resend_api' | 'saved_mailto' = 'saved_mailto';

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey !== 'MY_RESEND_API_KEY') {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.REPORT_FROM_EMAIL || 'SolvaPact <onboarding@resend.dev>',
          to: [OWNER_REPORT_EMAIL],
          subject,
          text: body,
        }),
      });
      if (resp.ok) {
        deliveryMode = 'resend_api';
      } else {
        console.error('Resend API dispatch warning:', await resp.text());
      }
    } catch (err) {
      console.error('Error sending email via Resend:', err);
    }
  }

  const record: ReportDispatchRecord = {
    date: dateKey,
    dispatchedAt: new Date().toISOString(),
    deliveryMode,
    recipientEmail: OWNER_REPORT_EMAIL,
    summary,
  };
  saveReportSent(record);

  return { record, emailSubject: subject, emailBody: body };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/solvasolution/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, userContext } = req.body as {
        message?: string;
        history?: ChatTurn[];
        userContext?: { name?: string; profession?: string; loyaltyTier?: string; exp?: number };
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Veuillez saisir une question pour SolvaSolution.' });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Le service IA SolvaSolution n'est pas encore configuré avec une clé API. Vous pouvez utiliser le formulaire juste à côté pour contacter directement l'équipe.",
          suggestHumanSupport: true,
        });
        return;
      }

      const contextNote = userContext?.name
        ? `\nContexte utilisateur connecté : ${userContext.name} (${userContext.profession || 'Membre'}), Niveau fidélité : ${userContext.loyaltyTier || 'Standard'} (${userContext.exp || 0} EXP).`
        : '';

      const contents = [
        ...(Array.isArray(history) ? history.slice(-10) : []).map((turn) => ({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        })),
        {
          role: 'user',
          parts: [{ text: message.trim() }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: SOLVASOLUTION_SYSTEM_INSTRUCTION + contextNote,
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.json({
          reply:
            "Je n'ai pas pu formuler de réponse précise pour cette demande. Je vous invite à la transmettre directement à l'équipe SolvaPact via le formulaire de contact.",
          suggestHumanSupport: true,
        });
        return;
      }

      const suggestHumanSupport = rawText.includes('[ESCALADE_HUMAIN]');
      const cleanReply = rawText.replace(/\[ESCALADE_HUMAIN\]/g, '').trim();

      res.json({
        reply: cleanReply,
        suggestHumanSupport,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('SolvaSolution API error:', errMsg);
      res.status(500).json({
        error:
          "SolvaSolution rencontre une difficulté momentanée. Vous pouvez transmettre votre question directement à notre équipe ci-contre.",
        suggestHumanSupport: true,
      });
    }
  });

  app.post('/api/support/ticket', (req: Request, res: Response) => {
    const { name, email, subject, message, aiTranscript } = req.body as Partial<SupportTicket>;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Nom, e-mail et message sont requis.' });
      return;
    }

    const ticketId = `SP-SUP-${Math.floor(10000 + Math.random() * 90000)}`;
    const ticket: SupportTicket = {
      id: ticketId,
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'Demande d’assistance').trim(),
      message: message.trim(),
      aiTranscript: aiTranscript?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveTicket(ticket);

    res.json({
      ok: true,
      ticketId,
      recipientEmail: OWNER_REPORT_EMAIL,
    });
  });

  // Record business & satisfaction events (used by frontend; never exposed to normal clients)
  app.post('/api/analytics/event', (req: Request, res: Response) => {
    const body = req.body as Partial<AnalyticsEvent>;
    const validTypes: AnalyticsEventType[] = [
      'dossier_published',
      'loyalty_created',
      'dossier_accepted',
      'satisfaction_review',
    ];

    if (!body.type || !validTypes.includes(body.type)) {
      res.status(400).json({ error: 'Type d’événement invalide.' });
      return;
    }

    const dateKey = body.date || getParisDateKey();
    const events = readAnalyticsEvents();

    // Prevent duplicate recording for same dossier published or accepted
    if (
      (body.type === 'dossier_published' || body.type === 'dossier_accepted') &&
      body.dossierId &&
      events.some((e) => e.type === body.type && e.dossierId === body.dossierId)
    ) {
      res.json({ ok: true, deduplicated: true });
      return;
    }

    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateKey,
      timestamp: new Date().toISOString(),
      type: body.type,
      dossierId: body.dossierId,
      dossierTitle: body.dossierTitle,
      amount: typeof body.amount === 'number' ? body.amount : undefined,
      rating: typeof body.rating === 'number' ? body.rating : undefined,
      comment: body.comment?.trim(),
      userName: body.userName?.trim(),
      userEmail: body.userEmail?.trim(),
    };

    events.unshift(newEvent);
    saveAnalyticsEvents(events);
    res.json({ ok: true, event: newEvent });
  });

  // Owner-only private daily report retrieval
  app.get('/api/analytics/daily', (req: Request, res: Response) => {
    const ownerEmail = typeof req.query.ownerEmail === 'string' ? req.query.ownerEmail : '';
    if (!isOwnerEmail(ownerEmail)) {
      res.status(403).json({ error: 'Accès réservé au propriétaire.' });
      return;
    }

    const dateKey =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : getParisDateKey();

    const report = computeDailyReport(dateKey);
    const { subject, body } = formatDailyReportEmail(report);
    const sentRecords = readReportsSent();

    res.json({
      report,
      emailSubject: subject,
      emailBody: body,
      recipientEmail: OWNER_REPORT_EMAIL,
      lastDispatch: sentRecords[dateKey] || null,
    });
  });

  // Owner-only trigger to send or prepare the end-of-day email report to solvapact.vercel.app@gmail.com
  app.post('/api/analytics/send-daily-report', async (req: Request, res: Response) => {
    const { ownerEmail, date } = req.body as { ownerEmail?: string; date?: string };
    if (!isOwnerEmail(ownerEmail)) {
      res.status(403).json({ error: 'Accès réservé au propriétaire.' });
      return;
    }

    const dateKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getParisDateKey();
    const { record, emailSubject, emailBody } = await dispatchDailyReport(dateKey);
    const mailtoUrl = `mailto:${OWNER_REPORT_EMAIL}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    res.json({
      ok: true,
      deliveryMode: record.deliveryMode,
      dispatchedAt: record.dispatchedAt,
      recipientEmail: OWNER_REPORT_EMAIL,
      mailtoUrl,
      report: record.summary,
    });
  });

  // Background end-of-day scheduler (fires automatically at 23:55 Europe/Paris time)
  setInterval(async () => {
    try {
      const now = new Date();
      const todayKey = getParisDateKey(now);
      const { hour, minute } = getParisHourMinute(now);
      const sentRecords = readReportsSent();

      if (hour === 23 && minute >= 55 && !sentRecords[todayKey]) {
        await dispatchDailyReport(todayKey);
        console.log(`[SolvaPact] End-of-day report dispatched for ${todayKey}`);
      }
    } catch (err) {
      console.error('End-of-day scheduler error:', err);
    }
  }, 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolvaPact server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
