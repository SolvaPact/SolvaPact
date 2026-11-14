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

type DossierTabType = 'dette' | 'investissement' | 'autre';

const VALID_CATEGORIES = [
  'Éducation & Formation',
  'Immobilier & Construction',
  'Artisanat & BTP',
  'Commerce de bouche',
  'Particulier / Refinancement',
  'Profession libérale & Freelance',
  'Automobile & Logistique',
  'Autre domaine',
];

let cachedWorkingDraftModel: string | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function inferDossierTab(rawText: string, fallbackType?: string): DossierTabType {
  const lower = rawText.toLowerCase();
  const investScore = [
    'invest',
    'construi',
    'école',
    'ecole',
    'projet',
    'créer',
    'creer',
    'création',
    'creation',
    'entreprise',
    'société',
    'societe',
    'matériel',
    'materiel',
    'outillage',
    'ouvrir',
    'lancer',
    'boutique',
    'local',
    'machine',
    'véhicule pro',
    'vehicule pro',
    'formation',
    'association',
    'fonds de commerce',
    'développement',
    'developpement',
    'rentab',
    'bâtiment',
    'batiment',
    'travaux',
    'agrandi',
  ].filter((k) => lower.includes(k)).length;

  const debtScore = [
    'dette',
    'créanc',
    'creanc',
    'rachat de crédit',
    'rachat crédit',
    'rachat de credit',
    'regroupement',
    'découvert',
    'decouvert',
    'huissier',
    'contentieux',
    'impayé',
    'impaye',
    'apurer',
    'solder',
    'rembourser un crédit',
    'urssaf',
    'fisc',
    'retard de paiement',
    'décote',
    'decote',
  ].filter((k) => lower.includes(k)).length;

  if (investScore > debtScore && investScore > 0) return 'investissement';
  if (debtScore > investScore && debtScore > 0) return 'dette';
  if (lower.includes('solidaire') || lower.includes('litige')) return 'autre';
  if (fallbackType === 'dette' || fallbackType === 'investissement' || fallbackType === 'autre') {
    return fallbackType;
  }
  return 'dette';
}

function normalizeCategory(rawCat: string, promptAndText: string): string {
  const exact = VALID_CATEGORIES.find((c) => c.toLowerCase() === rawCat.trim().toLowerCase());
  if (exact) return exact;

  const combined = `${rawCat} ${promptAndText}`.toLowerCase();
  if (
    combined.includes('école') ||
    combined.includes('ecole') ||
    combined.includes('éduc') ||
    combined.includes('educ') ||
    combined.includes('formation') ||
    combined.includes('campus') ||
    combined.includes('crèche') ||
    combined.includes('creche')
  ) {
    return 'Éducation & Formation';
  }
  if (
    combined.includes('constru') ||
    combined.includes('immobilier') ||
    combined.includes('bâtiment') ||
    combined.includes('batiment') ||
    combined.includes('rénov') ||
    combined.includes('renov') ||
    combined.includes('local')
  ) {
    return 'Immobilier & Construction';
  }
  if (combined.includes('artisan') || combined.includes('btp') || combined.includes('chantier') || combined.includes('outillage')) {
    return 'Artisanat & BTP';
  }
  if (combined.includes('boulanger') || combined.includes('restaur') || combined.includes('commerce de bouche') || combined.includes('traiteur')) {
    return 'Commerce de bouche';
  }
  if (combined.includes('auto') || combined.includes('camion') || combined.includes('utilitaire') || combined.includes('logist') || combined.includes('transport')) {
    return 'Automobile & Logistique';
  }
  if (combined.includes('freelance') || combined.includes('libérale') || combined.includes('indépendant') || combined.includes('cabinet')) {
    return 'Profession libérale & Freelance';
  }
  if (combined.includes('particulier') || combined.includes('crédit') || combined.includes('découvert') || combined.includes('refinanc')) {
    return 'Particulier / Refinancement';
  }
  return 'Autre domaine';
}

function extractFlexibleTag(raw: string, variants: string[]): string {
  for (const tag of variants) {
    const closed = raw.match(new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)\\[\\[\\/${tag}\\]\\]`, 'i'));
    if (closed?.[1]) return cleanSolvaSolutionText(closed[1]);

    const openUntilNext = raw.match(new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)(?=\\[\\[|$)`, 'i'));
    if (openUntilNext?.[1]) return cleanSolvaSolutionText(openUntilNext[1]);
  }
  return '';
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
        ? `Analyse la demande du client. S'il s'agit d'un financement de projet, d'une construction, d'achat de matériel ou de création (ex: école, commerce, entreprise), le bon onglet est obligatoirement investissement (et non dette). S'il s'agit de rembourser ou racheter des dettes/crédits/découverts, le bon onglet est dette.
Retourne OBLIGATOIREMENT ces 5 balises exactes (chacune remplie avec soin) :
[[ONGLET]]investissement ou dette ou autre[[/ONGLET]]
[[CATEGORIE]]une de ces valeurs exactes : Éducation & Formation | Immobilier & Construction | Artisanat & BTP | Commerce de bouche | Particulier / Refinancement | Profession libérale & Freelance | Automobile & Logistique | Autre domaine[[/CATEGORIE]]
[[TITRE]]un titre clair, sérieux et percutant de 6 à 14 mots[[/TITRE]]
[[RESUME]]un résumé d'accroche complet et rassurant de 2 phrases bien construites donnant envie à un investisseur d'ouvrir le dossier[[/RESUME]]
[[CONSEIL]]une phrase brève informant le client (mentionne s'il y a eu réorientation vers Investissement/Dette et rappelle de vérifier le montant éventuel à l'étape 2)[[/CONSEIL]]`
        : stepNumber === 2
        ? `Cette étape ne contient que des chiffres. Ne modifie aucun chiffre. Retourne UNIQUEMENT :
[[CONSEIL]]ta réponse claire, directe et précise de 2 à 5 phrases en texte naturel répondant exactement à la question du client sur ses montants, sa durée ou son taux[[/CONSEIL]]`
        : stepNumber === 3
        ? `Retourne UNIQUEMENT ces 2 balises exactes :
[[GARANTIE]]une phrase claire, sérieuse et crédible formulant la garantie réelle décrite par le client sans rien inventer[[/GARANTIE]]
[[CONSEIL]]une phrase brève pour confirmer la formulation au client[[/CONSEIL]]`
        : `Retourne UNIQUEMENT ces 2 balises exactes :
[[EXPOSE]]un texte complet, structuré et convaincant en 3 paragraphes bien aérés présentant le besoin, l'usage exact des fonds, le sérieux du remboursement et les justificatifs (${attachedList})[[/EXPOSE]]
[[CONSEIL]]une phrase brève pour confirmer la rédaction de l'exposé au client[[/CONSEIL]]`;

    const draftPrompt = `Tu es SolvaSolution, l'assistant expert de SolvaPact.
Règle absolue : Rédige en français naturel, clair et fluide. N'utilise JAMAIS de symboles Markdown (#, *, **, _, \`) ni de listes à astérisques. N'invente jamais de faux chiffres.

Client : ${typeof userName === 'string' && userName.trim() ? userName.trim().slice(0, 60) : 'Membre SolvaPact'}
Contexte actuel : Onglet sélectionné=${ctx.type || 'dette'}, Sous-domaine=${ctx.category || 'Particulier & Pro'}, Montant=${ctx.amountRequested || 0} €, Durée=${ctx.termMonths || 36} mois, Revenus=${ctx.monthlyIncome || 0} €/mois, Charges=${ctx.existingCharges || 0} €/mois, Pièces=${attachedList}.

Message du client :
"${userPrompt.trim().slice(0, 2000)}"

${stepFormat}`;

    const baseCandidates: Array<{
      model: string;
      thinkingMode: 'minimal' | 'budget0' | 'none';
    }> = [
      { model: 'gemini-4-hydrogen', thinkingMode: 'minimal' },
      { model: 'gemini-3.1-flash-lite', thinkingMode: 'minimal' },
      { model: 'gemini-2.5-flash', thinkingMode: 'budget0' },
    ];

    const modelAttempts = cachedWorkingDraftModel
      ? [
          ...baseCandidates.filter((c) => c.model === cachedWorkingDraftModel),
          ...baseCandidates.filter((c) => c.model !== cachedWorkingDraftModel),
        ]
      : baseCandidates;

    let response;
    let lastError: any = null;

    for (const candidate of modelAttempts) {
      try {
        const thinkingConfig =
          candidate.thinkingMode === 'minimal'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
            : candidate.thinkingMode === 'budget0'
            ? { thinkingConfig: { thinkingBudget: 0 } }
            : {};

        response = await withTimeout(
          ai.models.generateContent({
            model: candidate.model,
            contents: draftPrompt,
            config: {
              maxOutputTokens: stepNumber === 4 ? 850 : 550,
              ...thinkingConfig,
            },
          }),
          9500,
          candidate.model
        );
        cachedWorkingDraftModel = candidate.model;
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Vercel draft model ${candidate.model} failed, trying next:`, err?.message || err);
        continue;
      }
    }

    if (lastError && !response) {
      throw lastError;
    }

    const rawOutput = (response?.text || '').trim();
    const rawTab = extractFlexibleTag(rawOutput, ['ONGLET', 'TYPE']).toLowerCase();
    const aiRecommendedType: DossierTabType | undefined =
      rawTab.includes('invest')
        ? 'investissement'
        : rawTab.includes('dette')
        ? 'dette'
        : rawTab.includes('autre')
        ? 'autre'
        : undefined;

    const deterministicType = inferDossierTab(userPrompt, ctx.type);
    const recommendedType: DossierTabType =
      aiRecommendedType &&
      !(aiRecommendedType === 'dette' && deterministicType === 'investissement')
        ? aiRecommendedType
        : deterministicType;

    const rawCat = extractFlexibleTag(rawOutput, ['CATEGORIE', 'CATÉGORIE', 'DOMAINE']);
    const recommendedCategory =
      stepNumber === 1 ? normalizeCategory(rawCat, `${userPrompt} ${rawOutput}`) : undefined;

    let title = extractFlexibleTag(rawOutput, ['TITRE', 'INTITULE', 'INTITULÉ']);
    let description = extractFlexibleTag(rawOutput, [
      'RESUME',
      'RÉSUMÉ',
      'RESUMÉ',
      'ACCROCHE',
      'DESCRIPTION',
    ]);
    const guaranteeType = extractFlexibleTag(rawOutput, ['GARANTIE']);
    let contextStory = extractFlexibleTag(rawOutput, ['EXPOSE', 'EXPOSÉ', 'HISTOIRE']);
    let coachMessage = extractFlexibleTag(rawOutput, ['CONSEIL', 'REPONSE', 'RÉPONSE']);

    const cleanedAll = cleanSolvaSolutionText(
      rawOutput.replace(/\[\[\/?[A-ZÉÀÈÊÔÛÎ_]+\]\]/gi, '\n')
    );

    if (stepNumber === 1) {
      const lines = cleanedAll
        .split('\n')
        .map((l) => l.replace(/^(titre|résumé|resume|catégorie|categorie|onglet)\s*:\s*/i, '').trim())
        .filter(Boolean);

      if (!title) {
        title = (lines[0] || userPrompt.trim()).slice(0, 110);
      }
      if (!description) {
        const remainingLines = lines.filter((l) => l !== title && l.length > 20);
        if (remainingLines.length > 0) {
          description = remainingLines.slice(0, 2).join(' ').slice(0, 360);
        } else {
          const cleanSubject = userPrompt.trim().replace(/\s+/g, ' ');
          description =
            recommendedType === 'investissement'
              ? `Demande de financement participatif direct pour concrétiser ce projet (${cleanSubject.slice(0, 140)}). Conditions et échéancier de remboursement proposés en direct à l'investisseur sans intermédiaire bancaire.`
              : recommendedType === 'dette'
              ? `Demande d'apurement amiable pour restructurer et solder une situation existante (${cleanSubject.slice(0, 140)}). Remboursement mensuel encadré par un protocole sous seing privé.`
              : `Demande d'accompagnement direct sur-mesure (${cleanSubject.slice(0, 140)}) avec engagement de remboursement détaillé et justificatifs fournis.`;
        }
      }
      if (!coachMessage) {
        const tabSwitched = ctx.type && recommendedType !== ctx.type;
        const tabLabel =
          recommendedType === 'investissement'
            ? 'Investissement'
            : recommendedType === 'dette'
            ? 'Dette à régler'
            : 'Autre sujet';
        coachMessage = tabSwitched
          ? `J'ai réorienté votre dossier vers l'onglet ${tabLabel} (${recommendedCategory}) et rédigé votre titre ainsi que votre résumé d'accroche.`
          : `Onglet ${tabLabel} (${recommendedCategory}) confirmé : titre et résumé d'accroche rédigés dans votre dossier.`;
      }
    } else if (stepNumber === 2) {
      if (!coachMessage) {
        coachMessage = cleanedAll || 'Voici la recommandation de SolvaSolution.';
      }
    } else if (stepNumber === 3 && !guaranteeType && cleanedAll) {
      return res.json({
        title: '',
        description: '',
        guaranteeType: cleanedAll.slice(0, 260),
        contextStory: '',
        coachMessage: coachMessage || 'Garantie formulée et insérée dans votre dossier.',
      });
    } else if (stepNumber === 4 && !contextStory && cleanedAll) {
      contextStory = cleanedAll;
      if (!coachMessage) coachMessage = 'Exposé détaillé rédigé et inséré dans votre dossier.';
    }

    return res.json({
      recommendedType: stepNumber === 1 ? recommendedType : undefined,
      recommendedCategory,
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
