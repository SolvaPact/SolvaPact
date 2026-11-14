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

    const hasRealFinances =
      typeof ctx.monthlyIncome === 'number' && Number.isFinite(ctx.monthlyIncome) && ctx.monthlyIncome > 0;
    const financeContextLine = hasRealFinances
      ? `Revenus déclarés=${ctx.monthlyIncome} €/mois, Charges déclarées=${typeof ctx.existingCharges === 'number' ? ctx.existingCharges : 0} €/mois`
      : `Revenus=NON RENSEIGNÉS (INTERDICTION ABSOLUE d'inventer, supposer ou mentionner un salaire, un revenu mensuel ou des charges fixes)`;

    const VALID_TERMS = [12, 24, 36, 48, 60, 72, 84, 120];
    const snapTermMonths = (val: number) =>
      VALID_TERMS.reduce((best, curr) =>
        Math.abs(curr - val) < Math.abs(best - val) ? curr : best
      , 48);

    const computeAnnuityMonthly = (principal: number, annualRate: number, months: number) => {
      if (principal <= 0 || months <= 0) return 0;
      const r = annualRate / 100 / 12;
      if (r === 0) return Math.round(principal / months);
      return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
    };

    const extractAmountFromPrompt = (text: string, fallback: number) => {
      const kMatch = text.match(/\b(\d{1,3})\s*k\b/i);
      if (kMatch) {
        const val = Number(kMatch[1]) * 1000;
        if (val >= 500 && val <= 1000000) return val;
      }
      const euroMatch = text.match(/(\d[\d\s\u00a0.]{1,9})\s*(?:€|euros?)/i);
      if (euroMatch) {
        const digits = Number(euroMatch[1].replace(/[^\d]/g, ''));
        if (digits >= 500 && digits <= 1000000) return digits;
      }
      const numMatch = text.match(/\b(\d{4,7})\b/);
      if (numMatch) {
        const digits = Number(numMatch[1]);
        if (digits >= 500 && digits <= 1000000) return digits;
      }
      return fallback >= 500 ? fallback : 10000;
    };

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
        ? `Résume brièvement la demande du client (montant et projet si précisés) et propose les meilleurs délais/conditions (montant, durée parmi 12, 24, 36, 48, 60, 72, 84 ou 120 mois, taux annuel réaliste et mensualité).
Ne cite JAMAIS de salaire ou de charges si Revenus=NON RENSEIGNÉS. Ne dis JAMAIS "je reste à votre disposition pour finaliser", termine plutôt en invitant le client à cliquer sur "OK, ça me va" juste en dessous si ces conditions lui conviennent.
Retourne OBLIGATOIREMENT ces 5 balises exactes :
[[CONSEIL]]réponse claire en 2 à 4 phrases sans aucun symbole Markdown résumant la demande et expliquant pourquoi cette durée et cette mensualité sont optimales[[/CONSEIL]]
[[MONTANT]]nombre entier en euros (ex: 13000)[[/MONTANT]]
[[DUREE]]un seul nombre parmi 12, 24, 36, 48, 60, 72, 84, 120[[/DUREE]]
[[TAUX]]nombre décimal du taux annuel proposé entre 3.0 et 12.0 (ex: 6.0)[[/TAUX]]
[[MENSUALITE]]nombre entier en euros de la mensualité mensuelle conseillée[[/MENSUALITE]]`
        : stepNumber === 3
        ? `Retourne UNIQUEMENT ces 2 balises exactes :
[[GARANTIE]]une phrase claire, sérieuse et crédible formulant la garantie réelle décrite par le client sans rien inventer[[/GARANTIE]]
[[CONSEIL]]une phrase brève pour confirmer la formulation au client[[/CONSEIL]]`
        : `Retourne UNIQUEMENT ces 2 balises exactes :
[[EXPOSE]]un texte complet, structuré et convaincant en 3 paragraphes bien aérés présentant le besoin, l'usage exact des fonds, le sérieux du remboursement et les justificatifs (${attachedList}) sans inventer de salaire non communiqué[[/EXPOSE]]
[[CONSEIL]]une phrase brève pour confirmer la rédaction de l'exposé au client[[/CONSEIL]]`;

    const draftPrompt = `Tu es SolvaSolution, l'assistant expert de SolvaPact.
Règle absolue : Rédige en français naturel, clair et fluide. N'utilise JAMAIS de symboles Markdown (#, *, **, _, \`) ni de listes à astérisques. N'invente JAMAIS de salaire, de revenus, de charges ou de faux chiffres non donnés par le client.

Client : ${typeof userName === 'string' && userName.trim() ? userName.trim().slice(0, 60) : 'Membre SolvaPact'}
Contexte actuel : Onglet sélectionné=${ctx.type || 'dette'}, Sous-domaine=${ctx.category || 'Particulier & Pro'}, Montant actuel=${ctx.amountRequested || 10000} €, Durée actuelle=${ctx.termMonths || 36} mois, ${financeContextLine}, Pièces=${attachedList}.

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
              maxOutputTokens: stepNumber === 4 ? 850 : 600,
              ...thinkingConfig,
            },
          }),
          8500,
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

    let proposedTerms:
      | {
          amountRequested: number;
          termMonths: number;
          targetInterestRate?: number;
          maxMonthlyPayment: number;
        }
      | undefined;

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
      const rawAmount = extractFlexibleTag(rawOutput, ['MONTANT']);
      const rawDuration = extractFlexibleTag(rawOutput, ['DUREE', 'DURÉE']);
      const rawRate = extractFlexibleTag(rawOutput, ['TAUX']);
      const rawMonthly = extractFlexibleTag(rawOutput, ['MENSUALITE', 'MENSUALITÉ']);

      const fallbackAmount = extractAmountFromPrompt(userPrompt, Number(ctx.amountRequested) || 10000);
      const parsedAmountNum = Number(rawAmount.replace(/[^\d]/g, ''));
      const finalAmount =
        parsedAmountNum >= 500 && parsedAmountNum <= 1000000 ? parsedAmountNum : fallbackAmount;

      const parsedDurationNum = Number(rawDuration.replace(/[^\d]/g, ''));
      const defaultTerm = finalAmount >= 25000 ? 60 : finalAmount >= 12000 ? 48 : 36;
      const finalDuration = snapTermMonths(
        parsedDurationNum >= 12 && parsedDurationNum <= 120
          ? parsedDurationNum
          : Number(ctx.termMonths) || defaultTerm
      );

      const parsedRateNum = Number(rawRate.replace(',', '.').replace(/[^\d.]/g, ''));
      const baseRate =
        ctx.type === 'dette'
          ? 5.5
          : parsedRateNum >= 1 && parsedRateNum <= 15
          ? Math.round(parsedRateNum * 10) / 10
          : Number(ctx.targetInterestRate) || 6.0;

      const exactMonthly = computeAnnuityMonthly(finalAmount, baseRate, finalDuration);
      const parsedMonthlyNum = Number(rawMonthly.replace(/[^\d]/g, ''));
      const advisedBudget =
        parsedMonthlyNum >= exactMonthly && parsedMonthlyNum <= exactMonthly * 1.5
          ? parsedMonthlyNum
          : Math.max(exactMonthly, Math.ceil(exactMonthly / 10) * 10);

      proposedTerms = {
        amountRequested: finalAmount,
        termMonths: finalDuration,
        targetInterestRate: ctx.type === 'dette' ? undefined : baseRate,
        maxMonthlyPayment: advisedBudget,
      };

      if (!coachMessage) {
        coachMessage = cleanedAll.split('\n')[0] || `Pour un besoin de ${finalAmount} €, une durée de ${finalDuration} mois permet de viser environ ${exactMonthly} € par mois.`;
      }
      coachMessage = coachMessage
        .replace(/je reste à votre disposition[^.!?\n]*[.!?]?/gi, '')
        .replace(/n'hésitez pas à me solliciter[^.!?\n]*[.!?]?/gi, '')
        .trim();
      if (!coachMessage) {
        coachMessage = `Voici ma proposition chiffrée pour ${finalAmount} € sur ${finalDuration} mois (environ ${exactMonthly} € par mois). Cliquez sur « OK, ça me va » ci-dessous pour remplir automatiquement votre dossier.`;
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
      proposedTerms,
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
