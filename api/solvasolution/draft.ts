import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function cleanSolvaSolutionText(text: string): string {
  return text
    .replace(/\[ESCALADE_HUMAIN\]/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[*•]+\s+/gm, '— ')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/`+/g, '')
    .replace(/(^|\s)#{1,6}(\s|$)/g, '$1$2')
    .replace(/\*{2,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsedBody =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const { step, userPrompt, dossierContext, userName } = parsedBody as {
      step?: number;
      userPrompt?: string;
      userName?: string;
      dossierContext?: {
        type?: string;
        category?: string;
        title?: string;
        description?: string;
        amountRequested?: number;
        originalDebtAmount?: number;
        targetInterestRate?: number;
        termMonths?: number;
        maxMonthlyPayment?: number;
        monthlyIncome?: number;
        existingCharges?: number;
        guaranteeType?: string;
        contextStory?: string;
        attachedFiles?: string[];
      };
    };

    const stepNumber = Number(step);
    if (![1, 2, 3, 4].includes(stepNumber)) {
      return res.status(400).json({ error: 'Étape de dossier invalide.' });
    }

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({
        error: 'Décrivez brièvement votre besoin pour que SolvaSolution rédige pour vous.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error:
          "Le service IA SolvaSolution nécessite la variable d'environnement GEMINI_API_KEY sur votre hébergeur.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const ctx = dossierContext || {};
    const attachedList =
      Array.isArray(ctx.attachedFiles) && ctx.attachedFiles.length > 0
        ? ctx.attachedFiles.slice(0, 8).join(', ')
        : 'Aucun fichier importé pour le moment';

    const stepFormat =
      stepNumber === 1
        ? `Retourne UNIQUEMENT ces 3 balises exactes :
[[TITRE]]un titre clair, sérieux et percutant de 6 à 14 mots[[/TITRE]]
[[RESUME]]un résumé court et rassurant de 1 à 2 phrases pour la carte du dossier[[/RESUME]]
[[CONSEIL]]une phrase brève pour confirmer la rédaction au client[[/CONSEIL]]`
        : stepNumber === 2
        ? `Cette étape ne contient que des chiffres. Ne propose pas de modifier les montants. Retourne UNIQUEMENT :
[[CONSEIL]]ta réponse claire et brève de 2 à 4 phrases en texte naturel pour aider le client sur ses montants ou sa durée[[/CONSEIL]]`
        : stepNumber === 3
        ? `Retourne UNIQUEMENT ces 2 balises exactes :
[[GARANTIE]]une phrase claire, sérieuse et crédible formulant la garantie réelle décrite par le client sans rien inventer[[/GARANTIE]]
[[CONSEIL]]une phrase brève pour confirmer la formulation au client[[/CONSEIL]]`
        : `Retourne UNIQUEMENT ces 2 balises exactes :
[[EXPOSE]]un texte complet, structuré et convaincant en 3 à 4 paragraphes bien aérés présentant le besoin, l'usage exact des fonds, le sérieux du remboursement et les justificatifs (${attachedList})[[/EXPOSE]]
[[CONSEIL]]une phrase brève pour confirmer la rédaction de l'exposé au client[[/CONSEIL]]`;

    const draftPrompt = `Tu es SolvaSolution, l'assistant de rédaction de dossiers de la plateforme SolvaPact.
Règle absolue : Rédige en français naturel, clair et fluide. N'utilise JAMAIS de symboles Markdown (#, *, **, _, \`) ni de listes à astérisques. N'invente jamais de faux chiffres.

Client : ${typeof userName === 'string' && userName.trim() ? userName.trim().slice(0, 60) : 'Membre SolvaPact'}
Contexte : Type=${ctx.type || 'dette'}, Catégorie=${ctx.category || 'Particulier & Pro'}, Montant=${ctx.amountRequested || 0} €, Durée=${ctx.termMonths || 36} mois, Revenus=${ctx.monthlyIncome || 0} €/mois, Charges=${ctx.existingCharges || 0} €/mois, Pièces=${attachedList}.

Demande du client :
"${userPrompt.trim().slice(0, 2000)}"

${stepFormat}`;

    const modelAttempts: Array<{ model: string; useThinkingLevel: boolean }> = [
      { model: 'gemini-4-hydrogen', useThinkingLevel: true },
      { model: 'gemini-3.1-flash-lite', useThinkingLevel: true },
      { model: 'gemini-2.5-flash', useThinkingLevel: false },
    ];

    let response;
    let lastError: any = null;

    for (const candidate of modelAttempts) {
      try {
        response = await ai.models.generateContent({
          model: candidate.model,
          contents: draftPrompt,
          config: {
            ...(candidate.useThinkingLevel
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Vercel draft model ${candidate.model} failed:`, err?.message || err);
      }
    }

    if (lastError && !response) {
      throw lastError;
    }

    const rawOutput = (response?.text || '').trim();
    const extractTag = (tag: string): string => {
      const match = rawOutput.match(
        new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)\\[\\[\\/${tag}\\]\\]`, 'i')
      );
      return match?.[1] ? cleanSolvaSolutionText(match[1]) : '';
    };

    const title = extractTag('TITRE');
    const description = extractTag('RESUME');
    const guaranteeType = extractTag('GARANTIE');
    let contextStory = extractTag('EXPOSE');
    let coachMessage = extractTag('CONSEIL');

    if (!title && !description && !guaranteeType && !contextStory && rawOutput) {
      const cleaned = cleanSolvaSolutionText(rawOutput);
      if (stepNumber === 1) {
        const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
        return res.json({
          title: (lines[0] || cleaned).slice(0, 120),
          description: lines.slice(1).join(' ').slice(0, 350),
          guaranteeType: '',
          contextStory: '',
          coachMessage: 'Titre et résumé rédigés et insérés dans votre dossier.',
        });
      } else if (stepNumber === 3) {
        return res.json({
          title: '',
          description: '',
          guaranteeType: cleaned.slice(0, 250),
          contextStory: '',
          coachMessage: 'Garantie formulée et insérée dans votre dossier.',
        });
      } else if (stepNumber === 4) {
        contextStory = cleaned;
        coachMessage = 'Exposé détaillé rédigé et inséré dans votre dossier.';
      } else {
        coachMessage = cleaned;
      }
    }

    return res.json({
      title,
      description,
      guaranteeType,
      contextStory,
      coachMessage:
        coachMessage ||
        (stepNumber === 2
          ? 'Voici la recommandation de SolvaSolution.'
          : 'Texte rédigé et appliqué dans votre dossier.'),
    });
  } catch (error: any) {
    const status = error?.status || error?.code || 'ERR';
    console.error('Vercel SolvaSolution Draft API error:', status, error?.message || error);
    return res.status(500).json({
      error: `SolvaSolution rencontre une difficulté momentanée (${status}). Vous pouvez réessayer ou saisir votre texte directement.`,
    });
  }
}
