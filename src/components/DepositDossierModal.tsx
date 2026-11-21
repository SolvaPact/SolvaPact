import React, { useState, useEffect, useRef } from 'react';
import {
  AttachmentUploadPayload,
  Dossier,
  DossierType,
  InvestmentReturnMode,
  User,
  VerifiedCompanyInfo,
} from '../types';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  calculateMonthlyPayment,
  formatEuro,
  formatAriaryApprox,
  calculateEffortRate,
  computeRiskGrade,
  getLoyaltyStatus,
} from '../utils/finance';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Trash2,
  Zap,
  ShieldCheck,
  CreditCard,
  Award,
  Lock,
  Bot,
  FileText,
  Send,
  Sparkles,
  CheckCircle2,
  Building2,
  Search,
} from 'lucide-react';
import solvaBackdrop from '../assets/images/solvasolution_ai_backdrop_1794656956781.jpg';
import { FuturisticPaymentOverlay } from './FuturisticPaymentOverlay';

interface DepositDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDossier: (
    dossier: Dossier,
    paidAmount: number,
    attachments?: AttachmentUploadPayload[],
    privateContact?: { fullName: string; email: string; phone?: string }
  ) => void;
  currentUser?: User | null;
  defaultType?: DossierType;
  initialAmount?: number;
  initialTerm?: number;
  onOpenLoyalty?: () => void;
  guidedBySolva?: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeLabel: string;
  dataUrl?: string;
  base64?: string;
}

export const DepositDossierModal: React.FC<DepositDossierModalProps> = ({
  isOpen,
  onClose,
  onSubmitDossier,
  currentUser,
  defaultType = 'investissement',
  initialAmount,
  initialTerm,
  onOpenLoyalty,
  guidedBySolva = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Form State - 2 main dossier types (investissement | autre)
  const [type, setType] = useState<DossierType>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Éducation & Formation');
  const [amountRequested, setAmountRequested] = useState<number>(10000);
  const [targetInterestRate, setTargetInterestRate] = useState<number>(6.0);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [maxMonthlyPayment, setMaxMonthlyPayment] = useState<number>(320);
  const [description, setDescription] = useState('');
  const [contextStory, setContextStory] = useState('');
  const [guaranteeType, setGuaranteeType] = useState('Caution solidaire ou pacte d’associés');

  // Investment return structure & Detailed project fields
  const [investmentReturnMode, setInvestmentReturnMode] =
    useState<InvestmentReturnMode>('remboursement');
  const [equityPercentage, setEquityPercentage] = useState<number>(15);
  const [counterpartSummary, setCounterpartSummary] = useState<string>('');
  const [projectStage, setProjectStage] = useState<string>('En cours de structuration');
  const [legalStructure, setLegalStructure] = useState<string>('Particulier / Porteur de projet');
  const [ownContribution, setOwnContribution] = useState<number>(0);
  const [useOfFunds, setUseOfFunds] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  const [projectedRevenue, setProjectedRevenue] = useState<string>('');
  const [employmentTenure, setEmploymentTenure] = useState<string>('');

  // Applicant Profile & Contact info
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(currentUser?.phone || '');
  const [applicantPseudonym, setApplicantPseudonym] = useState(
    currentUser?.name ? `${currentUser.name.split(' ')[0]}_Direct` : ''
  );
  const [city, setCity] = useState(currentUser?.city || '');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');
  const [profession, setProfession] = useState(currentUser?.profession || 'Entrepreneur / Salarié');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2600);
  const [existingCharges, setExistingCharges] = useState<number>(800);

  // Applicant finances confirmation flag (prevents AI from quoting unentered defaults)
  const [hasEnteredFinances, setHasEnteredFinances] = useState(false);

  // Company Verification (NIF/STAT Madagascar or INSEE France)
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyCountry, setCompanyCountry] = useState<'MG' | 'FR'>('MG');
  const [isVerifyingCompany, setIsVerifyingCompany] = useState(false);
  const [companySearchResults, setCompanySearchResults] = useState<
    Array<{
      registryType: 'INSEE_FR' | 'NIF_STAT_MG';
      identifier: string;
      legalName: string;
      legalForm?: string;
      city?: string;
      activity?: string;
    }>
  >([]);
  const [verifiedCompany, setVerifiedCompany] = useState<VerifiedCompanyInfo | undefined>(undefined);
  const [companyVerifyError, setCompanyVerifyError] = useState<string | null>(null);

  // Documents (real user attachments)
  const [uploadedFiles, setUploadedFiles] = useState<AttachedFile[]>([]);

  // Step 4 Publication Payment State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<'verifying' | 'approved' | null>(null);

  // SolvaSolution Mini-Box State
  const [solvaInput, setSolvaInput] = useState('');
  const [isSolvaDrafting, setIsSolvaDrafting] = useState(false);
  const [solvaReply, setSolvaReply] = useState<string | null>(null);
  const [solvaError, setSolvaError] = useState<string | null>(null);
  const [solvaProposal, setSolvaProposal] = useState<{
    investmentReturnMode?: InvestmentReturnMode;
    equityPercentage?: number;
    amountRequested: number;
    termMonths: number;
    targetInterestRate?: number;
    maxMonthlyPayment: number;
    applied?: boolean;
  } | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  useEffect(() => {
    setSolvaInput('');
    setSolvaReply(null);
    setSolvaError(null);
    setSolvaProposal(null);
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setInvestmentReturnMode('remboursement');
      setEquityPercentage(15);
      setCounterpartSummary('');
      setOwnContribution(0);
      setUseOfFunds('');
      setTimeline('');
      setProjectedRevenue('');
      setEmploymentTenure('');
      setHasEnteredFinances(false);
      setPaymentError(null);
      setPdfUploadError(null);
      setSolvaInput('');
      setSolvaReply(null);
      setSolvaError(null);
      setSolvaProposal(null);
      if (initialAmount && initialAmount >= 500) {
        setAmountRequested(initialAmount);
      }
      if (initialTerm && initialTerm >= 12) {
        setTermMonths(initialTerm);
      }
      if (currentUser) {
        setApplicantName((prev) => prev || currentUser.name || '');
        setApplicantEmail((prev) => prev || currentUser.email || '');
        setApplicantPhone((prev) => prev || currentUser.phone || '');
        setApplicantPseudonym((prev) => prev || `${currentUser.name.split(' ')[0]}_Direct`);
        setCity((prev) => prev || currentUser.city || '');
        setPostalCode((prev) => prev || currentUser.postalCode || '');
        setProfession((prev) => prev || currentUser.profession || 'Entrepreneur / Salarié');
      }
    }
  }, [isOpen, defaultType, initialAmount, initialTerm, currentUser]);

  if (!isOpen) return null;

  const loyalty = getLoyaltyStatus(currentUser);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const readFilePayload = (file: File): Promise<AttachedFile> =>
    new Promise((resolve) => {
      const id = `doc-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const base: AttachedFile = {
        id,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeLabel: formatFileSize(file.size),
      };
      // Read dataUrl for <= 3.5 MB files (Firestore saves <= 520 KB attachments; AI reads PDFs <= 3.5 MB)
      if (file.size <= 3.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const commaIdx = result.indexOf(',');
          const rawBase64 = commaIdx > -1 ? result.slice(commaIdx + 1) : '';
          resolve({
            ...base,
            base64: rawBase64 || undefined,
            dataUrl: result && result.length <= 720000 ? result : undefined,
          });
        };
        reader.onerror = () => resolve(base);
        reader.readAsDataURL(file);
      } else {
        resolve(base);
      }
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const nextFiles = await Promise.all(Array.from(files).map(readFilePayload));
    setUploadedFiles((prev) => [...prev, ...nextFiles]);
    e.target.value = '';
  };

  const handlePdfImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const pdfCandidates: File[] = [];
    let rejected = false;

    Array.from(files).forEach((f) => {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        pdfCandidates.push(f);
      } else {
        rejected = true;
      }
    });

    if (pdfCandidates.length > 0) {
      const validPdfs = await Promise.all(pdfCandidates.map(readFilePayload));
      setUploadedFiles((prev) => [...prev, ...validPdfs]);
    }
    if (rejected) {
      setPdfUploadError('Seuls les fichiers au format PDF (.pdf) sont acceptés dans cette zone.');
    }
    e.target.value = '';
  };

  const handleVerifyCompany = async () => {
    const q = companyQuery.trim();
    if (q.length < 3) {
      setCompanyVerifyError('Saisissez un NIF/STAT malgache (10-17 chiffres) ou un SIREN / nom d’entreprise.');
      return;
    }
    setCompanyVerifyError(null);
    setIsVerifyingCompany(true);
    try {
      const res = await fetch(
        `/api/company/verify?q=${encodeURIComponent(q)}&country=${companyCountry}`
      );
      const data = (await res.json()) as {
        results?: typeof companySearchResults;
        error?: string;
      };
      if (!res.ok) {
        setCompanyVerifyError(data.error || 'Vérification indisponible.');
        setCompanySearchResults([]);
        return;
      }
      const list = data.results || [];
      setCompanySearchResults(list);
      if (list.length === 0) {
        setCompanyVerifyError('Aucune entreprise trouvée avec cet identifiant.');
      }
    } catch {
      setCompanyVerifyError('Erreur réseau lors de la vérification du registre.');
    } finally {
      setIsVerifyingCompany(false);
    }
  };

  const inferStep1TypeAndCategory = (promptText: string, currentTab: DossierType) => {
    const lower = promptText.toLowerCase();
    const otherScore = [
      'solidaire',
      'personnel',
      'urgence',
      'ponctuel',
      'famille',
      'aléa',
      'alea',
      'autre',
    ].filter((k) => lower.includes(k)).length;

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
      'formation',
      'association',
      'fonds de commerce',
      'développement',
      'developpement',
      'bâtiment',
      'batiment',
      'travaux',
      'parts',
      'capital',
    ].filter((k) => lower.includes(k)).length;

    let detectedType: DossierType = currentTab;
    if (investScore >= otherScore && investScore > 0) detectedType = 'investissement';
    else if (otherScore > investScore && otherScore > 0) detectedType = 'autre';

    let detectedCat = 'Autre domaine';
    if (
      lower.includes('école') ||
      lower.includes('ecole') ||
      lower.includes('éduc') ||
      lower.includes('educ') ||
      lower.includes('formation') ||
      lower.includes('crèche')
    ) {
      detectedCat = 'Éducation & Formation';
    } else if (
      lower.includes('constru') ||
      lower.includes('immobilier') ||
      lower.includes('bâtiment') ||
      lower.includes('batiment') ||
      lower.includes('local')
    ) {
      detectedCat = 'Immobilier & Construction';
    } else if (lower.includes('artisan') || lower.includes('btp') || lower.includes('chantier') || lower.includes('outillage')) {
      detectedCat = 'Artisanat & BTP';
    } else if (lower.includes('boulanger') || lower.includes('restaur') || lower.includes('traiteur')) {
      detectedCat = 'Commerce de bouche';
    } else if (lower.includes('auto') || lower.includes('camion') || lower.includes('utilitaire') || lower.includes('transport')) {
      detectedCat = 'Automobile & Logistique';
    } else if (lower.includes('freelance') || lower.includes('libérale') || lower.includes('indépendant')) {
      detectedCat = 'Profession libérale & Freelance';
    } else if (lower.includes('particulier') || lower.includes('personnel')) {
      detectedCat = 'Particulier / Refinancement';
    }

    return { detectedType, detectedCat };
  };

  const handleSolvaDraft = async () => {
    const trimmed = solvaInput.trim();
    if (!trimmed || isSolvaDrafting) return;

    setSolvaError(null);
    setSolvaReply(null);
    setSolvaProposal(null);
    setIsSolvaDrafting(true);

    const applyDraftFields = (fields: {
      recommendedType?: DossierType;
      recommendedCategory?: string;
      proposedTerms?: {
        investmentReturnMode?: InvestmentReturnMode;
        equityPercentage?: number;
        amountRequested: number;
        termMonths: number;
        targetInterestRate?: number;
        maxMonthlyPayment: number;
      };
      title?: string;
      description?: string;
      guaranteeType?: string;
      contextStory?: string;
      coachMessage?: string;
    }) => {
      if (step === 1) {
        const fallbackClassification = inferStep1TypeAndCategory(trimmed, type);
        const targetType = fields.recommendedType || fallbackClassification.detectedType;
        const targetCategory = fields.recommendedCategory || fallbackClassification.detectedCat;
        const previousType = type;

        setType(targetType);
        if (targetCategory) setCategory(targetCategory);
        if (fields.title?.trim()) setTitle(fields.title.trim());

        const cleanDesc =
          fields.description?.trim() ||
          (targetType === 'investissement'
            ? `Demande de financement participatif direct pour concrétiser ce projet (${trimmed.slice(0, 130)}). Contrepartie négociable en direct (parts, dividendes ou remboursement).`
            : `Demande d'accompagnement financier direct (${trimmed.slice(0, 130)}) avec engagement clair et justificatifs fournis.`);
        setDescription(cleanDesc);

        const tabLabel =
          targetType === 'investissement'
            ? 'Onglet 1 : Investissement'
            : 'Onglet 2 : Autre sujet';

        const redirectPrefix =
          previousType !== targetType
            ? `Votre projet relève plutôt de ${tabLabel} — j'ai basculé automatiquement votre dossier sur cet onglet et sélectionné le domaine « ${targetCategory} ». `
            : '';

        setSolvaReply(
          `${redirectPrefix}${
            fields.coachMessage?.trim() ||
            'Titre et résumé d’accroche rédigés et insérés dans votre dossier.'
          }`
        );
        setSolvaInput('');
        return;
      } else if (step === 2) {
        if (fields.proposedTerms) {
          setSolvaProposal({ ...fields.proposedTerms, applied: false });
        }
      } else if (step === 3) {
        if (fields.guaranteeType?.trim()) setGuaranteeType(fields.guaranteeType.trim());
      } else if (step === 4) {
        if (fields.contextStory?.trim()) setContextStory(fields.contextStory.trim());
      }
      setSolvaReply(
        fields.coachMessage?.trim() ||
          (step === 2
            ? 'Proposition prête ci-dessous : cliquez sur « OK, ça me va » pour l’appliquer automatiquement.'
            : 'Texte rédigé et inséré automatiquement dans votre dossier.')
      );
      setSolvaInput('');
    };

    const firstReadablePdf = uploadedFiles.find(
      (f) => f.base64 && (f.mimeType === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    );

    try {
      const payload = JSON.stringify({
        step,
        userPrompt: trimmed,
        userName: applicantName || currentUser?.name,
        attachedPdf: firstReadablePdf?.base64
          ? {
              name: firstReadablePdf.name,
              dataBase64: firstReadablePdf.base64,
            }
          : undefined,
        dossierContext: {
          type,
          category,
          title,
          description,
          amountRequested,
          targetInterestRate,
          termMonths,
          maxMonthlyPayment,
          investmentReturnMode,
          equityPercentage,
          counterpartSummary,
          projectDetails: {
            projectStage,
            legalStructure,
            ownContribution,
            useOfFunds,
            timeline,
            projectedRevenue,
            employmentTenure,
          },
          monthlyIncome: hasEnteredFinances ? monthlyIncome : undefined,
          existingCharges: hasEnteredFinances ? existingCharges : undefined,
          guaranteeType,
          contextStory,
          attachedFiles: uploadedFiles.map((f) => f.name),
        },
      });

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 45000);
      let response: Response | null = null;
      let parsedData: {
        recommendedType?: DossierType;
        recommendedCategory?: string;
        proposedTerms?: {
          investmentReturnMode?: InvestmentReturnMode;
          equityPercentage?: number;
          amountRequested: number;
          termMonths: number;
          targetInterestRate?: number;
          maxMonthlyPayment: number;
        };
        title?: string;
        description?: string;
        guaranteeType?: string;
        contextStory?: string;
        coachMessage?: string;
        error?: string;
      } | null = null;

      try {
        response = await fetch('/api/solvasolution/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: payload,
        });
        const rawText = await response.text();
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = null;
        }
      } catch {
        response = null;
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (response && response.ok && parsedData && !parsedData.error) {
        applyDraftFields(parsedData);
        return;
      }

      // Automatic fallback via /api/solvasolution/chat
      const fallbackController = new AbortController();
      const fallbackTimeout = window.setTimeout(() => fallbackController.abort(), 45000);
      try {
        const tagInstruction =
          step === 1
            ? `Rédige pour mon dossier SolvaPact sans aucun Markdown (#, *, _). Choisis le bon onglet (investissement pour projet/entreprise/matériel/école ou autre pour besoin ponctuel/solidaire) et réponds exactement avec :
[[ONGLET]]investissement ou autre[[/ONGLET]]
[[TITRE]]titre clair de 6 à 14 mots[[/TITRE]]
[[RESUME]]résumé d'accroche complet en 2 phrases rassurantes[[/RESUME]]
Besoin : ${trimmed}`
            : step === 2
            ? `Résume ma demande et propose les meilleurs délais/conditions SANS inventer aucun salaire ni charges (n'utilise jamais "je reste à votre disposition pour finaliser", ni de Markdown). Si le besoin parle de parts sociales, capital ou dividendes sans remboursement mensuel, choisis [[MODE]]parts_sociales[[/MODE]] et [[MENSUALITE]]0[[/MENSUALITE]]; si royalties/% CA choisis [[MODE]]redevance_ca[[/MODE]] et [[MENSUALITE]]0[[/MENSUALITE]]; sinon remboursement ou hybride. Réponds exactement avec :
[[CONSEIL]]réponse claire en 2 à 4 phrases[[/CONSEIL]]
[[MODE]]remboursement ou parts_sociales ou redevance_ca ou hybride[[/MODE]]
[[PARTS]]pourcentage de parts ou CA entre 0 et 49[[/PARTS]]
[[MONTANT]]montant en euros[[/MONTANT]]
[[DUREE]]durée parmi 12, 24, 36, 48, 60, 72, 84, 120[[/DUREE]]
[[TAUX]]6.0[[/TAUX]]
[[MENSUALITE]]mensualité en euros (0 si parts_sociales ou redevance_ca)[[/MENSUALITE]]
Ma demande : ${trimmed}`
            : step === 3
            ? `Formule en une phrase claire et rassurante (sans #, * ni Markdown) la garantie suivante pour mon dossier avec [[GARANTIE]]...[[/GARANTIE]] : ${trimmed}`
            : `Rédige l'exposé complet de mon dossier en 3 paragraphes clairs (sans #, * ni Markdown et sans inventer de salaire non communiqué) avec [[EXPOSE]]...[[/EXPOSE]]. Contexte: ${amountRequested} € sur ${termMonths} mois${hasEnteredFinances ? `, revenus ${monthlyIncome} €/mois` : ''}. Mon texte : ${trimmed}`;

        const chatRes = await fetch('/api/solvasolution/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: fallbackController.signal,
          body: JSON.stringify({
            message: tagInstruction,
            history: [],
            userContext: currentUser
              ? {
                  name: currentUser.name,
                  profession: currentUser.profession,
                  loyaltyTier: loyalty.label,
                  exp: loyalty.exp,
                }
              : undefined,
          }),
        });
        window.clearTimeout(fallbackTimeout);

        const chatRaw = await chatRes.text();
        const chatData = JSON.parse(chatRaw) as { reply?: string; error?: string };

        if (!chatRes.ok || !chatData.reply) {
          setSolvaError(
            parsedData?.error ||
              chatData.error ||
              'SolvaSolution n’a pas pu répondre à cette demande pour le moment. Vous pouvez réessayer dans quelques secondes.'
          );
          return;
        }

        const replyStr = chatData.reply;
        const pickFlexTag = (tags: string[]) => {
          for (const tag of tags) {
            const m = replyStr.match(new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)\\[\\[\\/${tag}\\]\\]`, 'i'));
            if (m?.[1]?.trim()) return m[1].trim();
            const openM = replyStr.match(new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)(?=\\[\\[|$)`, 'i'));
            if (openM?.[1]?.trim()) return openM[1].trim();
          }
          return '';
        };

        if (step === 1) {
          const { detectedType, detectedCat } = inferStep1TypeAndCategory(trimmed, type);
          const rawOnglet = pickFlexTag(['ONGLET', 'TYPE']).toLowerCase();
          const finalType: DossierType = rawOnglet.includes('invest')
            ? 'investissement'
            : rawOnglet.includes('autre')
            ? 'autre'
            : detectedType;

          const cleanedLines = replyStr
            .replace(/\[\[\/?[A-ZÉÀÈÊÔÛÎ_]+\]\]/gi, '\n')
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

          const t = pickFlexTag(['TITRE', 'INTITULE']) || cleanedLines[0]?.slice(0, 120) || '';
          const r =
            pickFlexTag(['RESUME', 'RÉSUMÉ', 'RESUMÉ', 'ACCROCHE']) ||
            cleanedLines
              .filter((l) => l !== t && !l.toLowerCase().startsWith('investissement'))
              .slice(0, 2)
              .join(' ')
              .slice(0, 360);

          applyDraftFields({
            recommendedType: finalType,
            recommendedCategory: detectedCat,
            title: t,
            description: r,
            coachMessage: 'Titre et résumé d’accroche rédigés et insérés dans votre dossier.',
          });
        } else if (step === 3) {
          applyDraftFields({
            guaranteeType: pickFlexTag(['GARANTIE']) || replyStr.slice(0, 240),
            coachMessage: 'Garantie formulée et insérée dans votre dossier.',
          });
        } else if (step === 4) {
          applyDraftFields({
            contextStory: pickFlexTag(['EXPOSE', 'EXPOSÉ']) || replyStr,
            coachMessage: 'Exposé détaillé rédigé et inséré dans votre dossier.',
          });
        } else {
          const validTerms = [12, 24, 36, 48, 60, 72, 84, 120];
          const snapTerm = (v: number) =>
            validTerms.reduce((b, c) => (Math.abs(c - v) < Math.abs(b - v) ? c : b), 48);
          const rawMode = pickFlexTag(['MODE']).toLowerCase();
          const detectedMode: InvestmentReturnMode =
            rawMode.includes('part') || rawMode.includes('capital') || rawMode.includes('equity')
              ? 'parts_sociales'
              : rawMode.includes('redevance') || rawMode.includes('ca') || rawMode.includes('royalt')
              ? 'redevance_ca'
              : rawMode.includes('hybride')
              ? 'hybride'
              : investmentReturnMode;
          const rawParts = Number(pickFlexTag(['PARTS']).replace(',', '.').replace(/[^\d.]/g, ''));
          const pParts =
            rawParts > 0 && rawParts <= 49
              ? Math.round(rawParts * 10) / 10
              : detectedMode === 'parts_sociales' || detectedMode === 'redevance_ca' || detectedMode === 'hybride'
              ? equityPercentage || 15
              : undefined;
          const rawAmt = Number(pickFlexTag(['MONTANT']).replace(/[^\d]/g, ''));
          const rawDur = Number(pickFlexTag(['DUREE', 'DURÉE']).replace(/[^\d]/g, ''));
          const rawRate = Number(pickFlexTag(['TAUX']).replace(',', '.').replace(/[^\d.]/g, ''));
          const pAmount = rawAmt >= 500 && rawAmt <= 1000000 ? rawAmt : amountRequested;
          const pTerm = rawDur >= 12 && rawDur <= 120 ? snapTerm(rawDur) : termMonths;
          const pRate =
            detectedMode === 'parts_sociales' || detectedMode === 'redevance_ca'
              ? 0
              : rawRate >= 1 && rawRate <= 15
              ? Math.round(rawRate * 10) / 10
              : targetInterestRate || 6.0;
          const isZeroRepay = detectedMode === 'parts_sociales' || detectedMode === 'redevance_ca';
          const exactM = isZeroRepay ? 0 : calculateMonthlyPayment(pAmount, pRate, pTerm);
          const rawMens = Number(pickFlexTag(['MENSUALITE', 'MENSUALITÉ']).replace(/[^\d]/g, ''));
          const pMens = isZeroRepay ? 0 : rawMens >= exactM ? rawMens : Math.max(exactM, Math.ceil(exactM / 10) * 10);
          const conseilClean = (pickFlexTag(['CONSEIL']) || replyStr)
            .replace(/je reste à votre disposition[^.!?\n]*[.!?]?/gi, '')
            .trim();

          applyDraftFields({
            coachMessage: conseilClean,
            proposedTerms: {
              investmentReturnMode: detectedMode,
              equityPercentage: pParts,
              amountRequested: pAmount,
              termMonths: pTerm,
              targetInterestRate: pRate,
              maxMonthlyPayment: pMens,
            },
          });
        }
      } catch {
        window.clearTimeout(fallbackTimeout);
        setSolvaError(
          parsedData?.error ||
            'Connexion interrompue avec SolvaSolution (le serveur a mis trop de temps à répondre). Cliquez à nouveau pour réessayer.'
        );
      }
    } catch {
      setSolvaError(
        'Délai dépassé avec SolvaSolution. Cliquez à nouveau pour réessayer ou remplissez directement le champ.'
      );
    } finally {
      setIsSolvaDrafting(false);
    }
  };

  const handleApplySolvaProposal = () => {
    if (!solvaProposal) return;
    setAmountRequested(solvaProposal.amountRequested);
    setTermMonths(solvaProposal.termMonths);
    if (solvaProposal.investmentReturnMode) {
      setInvestmentReturnMode(solvaProposal.investmentReturnMode);
    }
    if (typeof solvaProposal.equityPercentage === 'number') {
      setEquityPercentage(solvaProposal.equityPercentage);
    }
    if (typeof solvaProposal.targetInterestRate === 'number') {
      setTargetInterestRate(solvaProposal.targetInterestRate);
    }
    setMaxMonthlyPayment(solvaProposal.maxMonthlyPayment);
    setSolvaProposal((prev) => (prev ? { ...prev, applied: true } : null));
  };

  const applyPreset = (presetKey: 'parts' | 'tresorerie' | 'solidaire') => {
    if (presetKey === 'parts') {
      setType('investissement');
      setInvestmentReturnMode('parts_sociales');
      setEquityPercentage(15);
      setCounterpartSummary('15 % des parts sociales + versement annuel des dividendes (aucun remboursement mensuel)');
      setTitle("Ouverture de capital (15 % de parts) pour développement d'activité");
      setCategory('Éducation & Formation');
      setProjectStage('Prêt à lancer (devis signés)');
      setLegalStructure('Projet en création / École / Société');
      setOwnContribution(4000);
      setAmountRequested(15000);
      setMaxMonthlyPayment(0);
      setTermMonths(60);
      setUseOfFunds('8 000 € aménagement des locaux, 4 500 € matériel, 2 500 € fonds de roulement');
      setTimeline('Lancement opérationnel sous 2 mois');
      setProjectedRevenue('Chiffre d’affaires prévisionnel de 9 000 €/mois dès le 4e mois');
      setEmploymentTenure('6 ans d’expérience dans le secteur');
      setDescription(
        "Entrée au capital à hauteur de 15 % des parts en échange d'un apport de 15 000 € sans remboursement mensuel."
      );
      setContextStory(
        "Porteur d'un projet structuré avec apport personnel de 4 000 €, je recherche un associé investisseur entrant au capital à hauteur de 15 % des parts sociales."
      );
      setGuaranteeType("Pacte d'associés enregistré, bilan trimestriel transparent et clause de suivi");
    } else if (presetKey === 'tresorerie') {
      setType('investissement');
      setInvestmentReturnMode('remboursement');
      setTitle("Besoin de trésorerie d'exploitation et outillage professionnel");
      setCategory('Artisanat & BTP');
      setProjectStage('Activité déjà existante');
      setLegalStructure('Auto-entrepreneur / Indépendant');
      setOwnContribution(2500);
      setAmountRequested(15000);
      setTargetInterestRate(6.5);
      setTermMonths(24);
      setMaxMonthlyPayment(670);
      setUseOfFunds('11 000 € outillage chantier pro + 4 000 € avance fournitures');
      setTimeline('Déploiement immédiat pour chantiers déjà signés');
      setProjectedRevenue('Carnet de commandes de 42 000 € sur les 6 prochains mois');
      setEmploymentTenure('Artisan établi depuis 4 ans');
      setDescription(
        'Financement de matériel de chantier pour honorer de nouveaux contrats signés avec paiement des intérêts chaque mois.'
      );
      setContextStory(
        "Artisan du bâtiment depuis 4 ans, activité rentable avec carnet de commandes plein. Délais bancaires trop longs, je sollicite un investisseur réactif."
      );
      setGuaranteeType('Nantissement de matériel professionnel & caution solidaire');
    } else {
      setType('autre');
      setInvestmentReturnMode('remboursement');
      setTitle("Financement participatif de trésorerie d'urgence avec caution familiale");
      setCategory('Particulier / Refinancement');
      setProjectStage('Situation urgente / Restructuration');
      setLegalStructure('Particulier');
      setOwnContribution(500);
      setAmountRequested(5000);
      setTargetInterestRate(5.0);
      setTermMonths(24);
      setMaxMonthlyPayment(230);
      setUseOfFunds('Couverture d’un besoin ponctuel urgent sans crédit revolving');
      setTimeline('Remboursement dès le mois suivant l’accord');
      setProjectedRevenue('Revenus réguliers mensuels vérifiables');
      setEmploymentTenure('Poste stable depuis 3 ans');
      setDescription(
        'Prêt direct pour surmonter un aléa temporaire de trésorerie avec engagement ferme de remboursement.'
      );
      setContextStory(
        "Revenus réguliers, suite à un imprévu j'ai besoin d'un prêt court terme direct sécurisé sans passer par le système bancaire classique."
      );
      setGuaranteeType("Caution solidaire d'un tiers solvable & engagement écrit");
    }
  };

  const isEquityOrRevenueMode =
    investmentReturnMode === 'parts_sociales' || investmentReturnMode === 'redevance_ca';

  const estimatedMonthly = isEquityOrRevenueMode
    ? 0
    : calculateMonthlyPayment(amountRequested, targetInterestRate, termMonths);

  const effortRate = calculateEffortRate(monthlyIncome, existingCharges, estimatedMonthly);
  const computedRiskGrade = computeRiskGrade(effortRate);
  const resteAVivre = monthlyIncome - existingCharges - estimatedMonthly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (step !== 4) return;

    if (!contextStory.trim()) {
      setPaymentError('Veuillez rédiger une explication détaillée de votre besoin.');
      return;
    }

    if (
      !loyalty.isFreePublicationNow &&
      (cardNumber.replace(/\s/g, '').length < 16 ||
        expiry.length < 5 ||
        cvc.length < 3)
    ) {
      setPaymentError(
        `Pour publier votre dossier (${formatEuro(loyalty.publicationPrice)}), veuillez renseigner une carte bancaire valide (16 chiffres, MM/AA et CVC).`
      );
      return;
    }

    setIsPublishing(true);
    setPaymentPhase('verifying');

    try {
      const checkoutRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'publication',
          loyaltyActive: Boolean(currentUser?.loyaltyActive),
          loyaltyExp: currentUser?.loyaltyExp || 0,
          diamondPublicationsCount: currentUser?.diamondPublicationsCount || 0,
          userEmail: currentUser?.email || applicantEmail,
        }),
      });
      const checkoutData = (await checkoutRes.json()) as {
        mode?: string;
        verifiedAmount?: number;
        checkoutUrl?: string;
        transactionId?: string;
        error?: string;
      };
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Paiement refusé par le serveur.');
      }

      const verifiedPaidAmount =
        typeof checkoutData.verifiedAmount === 'number'
          ? checkoutData.verifiedAmount
          : loyalty.publicationPrice;

      const buildFinalDossierAndPayloads = () => {
        const nextExp = loyalty.active ? loyalty.exp + EXP_PER_DOSSIER : 0;
        const projectedUser: User | undefined = currentUser
          ? {
              ...currentUser,
              loyaltyExp: nextExp,
            }
          : undefined;
        const updatedLoyalty = getLoyaltyStatus(projectedUser);

        const effectiveMode: InvestmentReturnMode = investmentReturnMode;

        const defaultCounterpartSummary =
          effectiveMode === 'parts_sociales'
            ? `${equityPercentage} % des parts sociales (sans remboursement mensuel)`
            : effectiveMode === 'redevance_ca'
            ? `${equityPercentage} % du chiffre d'affaires / bénéfices pendant ${termMonths} mois`
            : effectiveMode === 'hybride'
            ? `Remboursement à ${targetInterestRate} % + ${equityPercentage} % de parts`
            : undefined;

        const dossierId = `dos-${Date.now()}`;
        const newDossier: Dossier = {
          id: dossierId,
          ownerUid: currentUser?.uid || currentUser?.id,
          title:
            title ||
            (type === 'investissement'
              ? "Demande d'investissement & développement"
              : 'Dossier spécifique / Autre sujet'),
          type,
          category,
          amountRequested: Number(amountRequested),
          targetInterestRate: isEquityOrRevenueMode ? 0 : Number(targetInterestRate),
          maxMonthlyPayment: isEquityOrRevenueMode ? 0 : Number(maxMonthlyPayment),
          termMonths: Number(termMonths),
          investmentReturnMode: effectiveMode,
          equityPercentage:
            effectiveMode === 'remboursement' ? undefined : Number(equityPercentage),
          counterpartSummary: counterpartSummary.trim() || defaultCounterpartSummary,
          projectDetails: {
            projectStage,
            legalStructure,
            ownContribution: Number(ownContribution) || 0,
            useOfFunds: useOfFunds.trim() || undefined,
            timeline: timeline.trim() || undefined,
            projectedRevenue: projectedRevenue.trim() || undefined,
            employmentTenure: employmentTenure.trim() || undefined,
            equityExitNote: counterpartSummary.trim() || defaultCounterpartSummary,
          },
          verifiedCompany,
          description:
            description ||
            `Dossier classé dans l'onglet ${
              type === 'investissement' ? 'Investissement' : 'Autre sujet'
            } pour négociation directe avec des investisseurs.`,
          contextStory:
            contextStory ||
            'Exposé complet de la situation financière, du besoin de fonds et des engagements proposés.',
          guaranteeType,
          applicant: {
            name: applicantName || currentUser?.name || 'Demandeur',
            firstName:
              currentUser?.firstName ||
              (applicantName || currentUser?.name || 'Demandeur').split(' ')[0],
            lastName:
              currentUser?.lastName ||
              (applicantName || currentUser?.name || '').split(' ').slice(1).join(' ') ||
              undefined,
            email: applicantEmail.trim() || currentUser?.email || '',
            phone: applicantPhone.trim() || currentUser?.phone || '',
            pseudonym: applicantPseudonym || `${(applicantName || 'Membre').split(' ')[0]}_Solv`,
            city: city || currentUser?.city || 'Antananarivo',
            postalCode: postalCode || currentUser?.postalCode || '101',
            profession,
            monthlyIncome: Number(monthlyIncome),
            existingCharges: Number(existingCharges),
            verifiedIdentity: uploadedFiles.length > 0 || Boolean(verifiedCompany),
            verifiedIncome: uploadedFiles.length > 0,
            riskGrade: computedRiskGrade,
            loyaltyTier: updatedLoyalty.active ? updatedLoyalty.tier : undefined,
            loyaltyTitle:
              updatedLoyalty.active && updatedLoyalty.badgeTitle
                ? updatedLoyalty.badgeTitle
                : undefined,
          },
          documents: uploadedFiles.map((file, i) => ({
            id: file.id || `doc-new-${Date.now()}-${i}`,
            name: file.name,
            category: 'justificatif_dette',
            size: file.sizeLabel,
            verified: true,
            date: new Date().toLocaleDateString('fr-FR'),
            hasDownloadableFile: Boolean(file.dataUrl),
          })),
          status: 'open',
          createdAt: new Date().toLocaleDateString('fr-FR'),
          offersCount: 0,
          urgency: 'prioritaire',
          publicationPaidAmount: verifiedPaidAmount,
          paymentVerifiedMode: checkoutData.mode || 'sandbox_verified',
          isDiamondPriority: updatedLoyalty.isDiamond || loyalty.isDiamond,
        };

        const attachmentsPayload: AttachmentUploadPayload[] = uploadedFiles
          .filter((f) => Boolean(f.dataUrl))
          .map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            sizeLabel: f.sizeLabel,
            dataUrl: f.dataUrl!,
          }));

        const privateContact = {
          fullName: applicantName || currentUser?.name || 'Demandeur',
          email: applicantEmail.trim() || currentUser?.email || '',
          phone: applicantPhone.trim() || currentUser?.phone || undefined,
        };

        return { newDossier, attachmentsPayload, privateContact };
      };

      const { newDossier, attachmentsPayload, privateContact } = buildFinalDossierAndPayloads();

      if (checkoutData.mode === 'stripe' && checkoutData.checkoutUrl) {
        sessionStorage.setItem(
          'solvapact_pending_dossier_stripe',
          JSON.stringify({
            dossier: newDossier,
            paidAmount: verifiedPaidAmount,
            attachments: attachmentsPayload,
            privateContact,
          })
        );
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      window.setTimeout(() => {
        setPaymentPhase('approved');
        window.setTimeout(() => {
          setPaymentPhase(null);
          setIsPublishing(false);
          onSubmitDossier(newDossier, verifiedPaidAmount, attachmentsPayload, privateContact);
          onClose();
          setStep(1);
          setUploadedFiles([]);
          setVerifiedCompany(undefined);
          setCardNumber('');
          setExpiry('');
          setCvc('');
        }, 850);
      }, 650);
    } catch (err) {
      setPaymentPhase(null);
      setIsPublishing(false);
      setPaymentError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la validation serveur du paiement.'
      );
    }
  };

  const solvaPromptMeta =
    step === 1
      ? {
          question:
            'Expliquez en quelques mots votre besoin : SolvaSolution rédige votre titre et votre résumé d’accroche.',
          placeholder:
            'Ex : Je cherche 15 000 € pour ouvrir un atelier à Antananarivo en échange de 15 % des parts...',
          buttonLabel: 'Rédiger titre & résumé',
          writesText: true,
        }
      : step === 2
      ? {
          question:
            'Indiquez votre besoin ou montant : SolvaSolution résume votre demande et vous propose les meilleurs délais à valider en 1 clic.',
          placeholder:
            'Ex : Il me faut 13 000 € pour une école, quel délai choisir pour une mensualité raisonnable ?',
          buttonLabel: 'Proposer les conditions',
          writesText: false,
        }
      : step === 3
      ? {
          question:
            'Décrivez les garanties ou sécurités que vous pouvez apporter : SolvaSolution les formule pour rassurer l’investisseur.',
          placeholder:
            'Ex : Je suis en CDI depuis 5 ans avec un garant familial et un véhicule déjà payé...',
          buttonLabel: 'Formuler la garantie',
          writesText: true,
        }
      : {
          question:
            'Racontez librement votre situation et votre plan de remboursement : SolvaSolution rédige le texte complet de votre dossier.',
          placeholder:
            'Ex : Artisan depuis 4 ans, carnet plein, besoin de 15 000 € pour un utilitaire, remboursement facile avec mes factures...',
          buttonLabel: 'Rédiger mon exposé',
          writesText: true,
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {guidedBySolva
                ? `Mode accompagné SolvaSolution · Étape ${step} sur 4`
                : `Préparation gratuite · Étape ${step} sur 4`}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {step === 1 && '1. Quel type de dossier préparez-vous ? (Gratuit)'}
              {step === 2 && '2. Montants, durée et conditions (Gratuit)'}
              {step === 3 && "3. Situation financière & Garanties (Gratuit)"}
              {step === 4 &&
                (loyalty.isFreePublicationNow
                  ? '4. Justificatifs & Publication gratuite (Avantage Diamond 0 €)'
                  : `4. Justificatifs & Publication en ligne (${formatEuro(loyalty.publicationPrice)})`)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-orange-600 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Compact SolvaSolution Step Square (visible at every step) */}
          <div className="relative rounded-xl overflow-hidden border border-emerald-400/40 bg-slate-950 text-white shadow-sm">
            <img
              src={solvaBackdrop}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none select-none"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-slate-950/70 pointer-events-none"
            />
            <div className="relative z-10 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">SolvaSolution</span>
                  <span className="text-[10px] font-semibold text-emerald-300">
                    {solvaPromptMeta.writesText
                      ? 'Rédaction assistée (champs texte)'
                      : 'Proposition chiffrée (validation en 1 clic)'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-medium">
                  Étape {step}/4
                </span>
              </div>

              <p className="text-[11px] text-slate-200 leading-relaxed">
                {solvaPromptMeta.question}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={solvaInput}
                  onChange={(e) => setSolvaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSolvaDraft();
                    }
                  }}
                  placeholder={solvaPromptMeta.placeholder}
                  className="flex-1 px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <button
                  type="button"
                  disabled={isSolvaDrafting || !solvaInput.trim()}
                  onClick={handleSolvaDraft}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-45 shrink-0 cursor-pointer"
                >
                  {isSolvaDrafting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Rédaction...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{solvaPromptMeta.buttonLabel}</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {solvaError && (
                <div className="p-2 rounded-lg bg-rose-950/85 border border-rose-500/40 text-[11px] text-rose-200">
                  {solvaError}
                </div>
              )}

              {solvaReply && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/35 text-[11px] text-emerald-100 leading-relaxed space-y-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{solvaReply}</span>
                  </div>

                  {step === 2 && solvaProposal && (
                    <div className="pt-2 border-t border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 tabular-nums">
                        <span>
                          Montant : <strong className="text-white">{formatEuro(solvaProposal.amountRequested)}</strong>
                        </span>
                        {solvaProposal.investmentReturnMode === 'parts_sociales' ||
                        solvaProposal.investmentReturnMode === 'redevance_ca' ? (
                          <>
                            <span>
                              Mode :{' '}
                              <strong className="text-white">
                                {solvaProposal.investmentReturnMode === 'parts_sociales'
                                  ? 'Parts sociales'
                                  : 'Partage CA / Bénéfices'}
                              </strong>
                            </span>
                            {typeof solvaProposal.equityPercentage === 'number' && (
                              <span>
                                Contrepartie :{' '}
                                <strong className="text-white">{solvaProposal.equityPercentage} %</strong>
                              </span>
                            )}
                            <span>
                              Mensualité : <strong className="text-white">0 €/mois</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Durée : <strong className="text-white">{solvaProposal.termMonths} mois</strong>
                            </span>
                            {typeof solvaProposal.targetInterestRate === 'number' &&
                              solvaProposal.targetInterestRate > 0 && (
                                <span>
                                  Taux : <strong className="text-white">{solvaProposal.targetInterestRate} %</strong>
                                </span>
                              )}
                            {typeof solvaProposal.equityPercentage === 'number' &&
                              solvaProposal.equityPercentage > 0 && (
                                <span>
                                  + Parts : <strong className="text-white">{solvaProposal.equityPercentage} %</strong>
                                </span>
                              )}
                            <span>
                              Mensualité : <strong className="text-white">{formatEuro(solvaProposal.maxMonthlyPayment)}/mois</strong>
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleApplySolvaProposal}
                        disabled={solvaProposal.applied}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          solvaProposal.applied
                            ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {solvaProposal.applied
                            ? 'Données appliquées automatiquement'
                            : 'OK, ça me va — Appliquer'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>
                  Vous montez votre dossier <strong>100 % gratuitement</strong>. Le règlement de{' '}
                  <strong>{formatEuro(loyalty.publicationPrice)}</strong> intervient uniquement à l'étape finale de mise en ligne.
                </span>
              </div>

              <label className="text-xs font-bold text-slate-800 block">
                Sélectionnez l'onglet de classement pour votre dossier :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setType('investissement')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    type === 'investissement'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                    Onglet 1
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Investissement</h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Ouverture au capital contre parts, partage des bénéfices, matériel ou financement avec intérêts.
                  </p>
                </div>

                <div
                  onClick={() => setType('autre')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    type === 'autre'
                      ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block mb-1">
                    Onglet 2
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Autre sujet</h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Accompagnement solidaire, partenariat spécifique, besoin ponctuel ou accord sur-mesure.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modèles fréquents (cliquez pour pré-remplir instantanément) :</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyPreset('parts')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 hover:border-emerald-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-emerald-950 block">Investissement contre parts (%)</span>
                    <span className="text-[10px] text-emerald-800">15 000 € · 15 % des parts · 0 €/mois</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('tresorerie')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Trésorerie Pro / Artisan</span>
                    <span className="text-[10px] text-slate-500">15 000 € · 6.5% · 24 mois</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('solidaire')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Prêt solidaire personnel</span>
                    <span className="text-[10px] text-slate-500">5 000 € · 5.0% · 24 mois</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Intitulé explicite de votre dossier *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'investissement'
                      ? "Ex: Ouverture au capital (15 % de parts) pour création d'une école ou entreprise"
                      : "Ex: Financement solidaire pour reprise d'activité ou besoin ponctuel"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Résumé d'accroche du dossier (optionnel — rédigé avec vous par SolvaSolution)
                </label>
                <textarea
                  rows={2}
                  placeholder="Courte présentation en 1 ou 2 phrases affichée sur la carte du dossier..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sous-catégorie ou domaine
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Éducation & Formation">Éducation &amp; Formation</option>
                    <option value="Immobilier & Construction">Immobilier &amp; Construction</option>
                    <option value="Artisanat & BTP">Artisanat &amp; BTP</option>
                    <option value="Commerce de bouche">Commerce de bouche</option>
                    <option value="Particulier / Refinancement">Particulier / Refinancement</option>
                    <option value="Profession libérale & Freelance">Profession libérale &amp; Freelance</option>
                    <option value="Automobile & Logistique">Automobile &amp; Logistique</option>
                    <option value="Autre domaine">Autre domaine</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Stade d'avancement du dossier
                  </label>
                  <select
                    value={projectStage}
                    onChange={(e) => setProjectStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Idée / Étude en cours">Idée / Étude en cours</option>
                    <option value="En cours de structuration">En cours de structuration</option>
                    <option value="Prêt à lancer (devis signés)">Prêt à lancer (devis signés)</option>
                    <option value="Activité déjà existante">Activité déjà existante</option>
                    <option value="Restructuration urgente">Restructuration urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Statut du porteur / structure juridique
                  </label>
                  <select
                    value={legalStructure}
                    onChange={(e) => setLegalStructure(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Particulier / Porteur de projet">Particulier / Porteur de projet</option>
                    <option value="Auto-entrepreneur / Indépendant">Auto-entrepreneur / Indépendant</option>
                    <option value="Société (SAS / SARL / EURL)">Société (SAS / SARL / EURL)</option>
                    <option value="Projet en création / École / Association">Projet en création / École / Association</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Apport personnel déjà engagé (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ownContribution}
                    onChange={(e) => setOwnContribution(Math.max(0, Number(e.target.value)))}
                    placeholder="Ex: 2000"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Comment rémunérez-vous l'investisseur ou le partenaire ?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInvestmentReturnMode('parts_sociales')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      investmentReturnMode === 'parts_sociales'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">
                      Parts sociales / Entrée au capital (%)
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                      Aucun remboursement mensuel : l'investisseur reçoit des parts et dividendes du projet.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvestmentReturnMode('redevance_ca')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      investmentReturnMode === 'redevance_ca'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">
                      Partage des bénéfices / Royalties (%)
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                      Reversement d'un % du chiffre d'affaires ou des bénéfices sans mensualité fixe.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvestmentReturnMode('remboursement')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      investmentReturnMode === 'remboursement'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">
                      Remboursement mensuel avec intérêts
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                      Prêt direct remboursé chaque mois selon un taux annuel fixe et une durée choisie.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvestmentReturnMode('hybride')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      investmentReturnMode === 'hybride'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">
                      Formule mixte (Remboursement + Parts)
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                      Remboursement du capital à taux modéré + une part minoritaire au capital.
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {type === 'investissement'
                      ? "Montant d'investissement recherché (€)"
                      : 'Montant sollicité (€)'}
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="1000000"
                    required
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Capital apporté · Équivalent indicatif : <strong className="text-orange-700">{formatAriaryApprox(amountRequested)}</strong>
                  </span>
                </div>

                {isEquityOrRevenueMode ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {investmentReturnMode === 'parts_sociales'
                        ? 'Parts sociales proposées à l’investisseur (%)'
                        : 'Partage du CA ou des bénéfices proposé (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="49"
                      value={equityPercentage}
                      onChange={(e) =>
                        setEquityPercentage(Math.min(49, Math.max(1, Number(e.target.value))))
                      }
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {investmentReturnMode === 'parts_sociales'
                        ? 'Part du capital détenue par l’investisseur (1 % à 49 %)'
                        : 'Pourcentage reversé selon vos recettes réelles'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Taux d'intérêt annuel proposé à l'investisseur (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="15"
                      value={targetInterestRate}
                      onChange={(e) => setTargetInterestRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Rémunération annuelle de l'investisseur
                    </span>
                  </div>
                )}
              </div>

              {investmentReturnMode === 'hybride' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bonus parts sociales / intéressement en plus du remboursement (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="49"
                    value={equityPercentage}
                    onChange={(e) =>
                      setEquityPercentage(Math.min(49, Math.max(1, Number(e.target.value))))
                    }
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              )}

              {isEquityOrRevenueMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {investmentReturnMode === 'parts_sociales'
                        ? 'Horizon de partenariat / pacte d’associés'
                        : 'Durée de partage des revenus / royalties'}
                    </label>
                    <select
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value={12}>12 mois (1 an)</option>
                      <option value={24}>24 mois (2 ans)</option>
                      <option value={36}>36 mois (3 ans)</option>
                      <option value={48}>48 mois (4 ans)</option>
                      <option value={60}>60 mois (5 ans - Standard pacte)</option>
                      <option value={72}>72 mois (6 ans)</option>
                      <option value={84}>84 mois (7 ans)</option>
                      <option value={120}>120 mois (10 ans - Long terme)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Précision sur les dividendes ou la sortie
                    </label>
                    <input
                      type="text"
                      value={counterpartSummary}
                      onChange={(e) => setCounterpartSummary(e.target.value)}
                      placeholder="Ex: Dividendes annuels + possibilité de rachat des parts à 5 ans"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Durée souhaitée de remboursement
                    </label>
                    <select
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value={12}>12 mois (1 an) - Remboursement très rapide</option>
                      <option value={24}>24 mois (2 ans)</option>
                      <option value={36}>36 mois (3 ans)</option>
                      <option value={48}>48 mois (4 ans)</option>
                      <option value={60}>60 mois (5 ans) - Mensualité modérée</option>
                      <option value={72}>72 mois (6 ans) - Mensualité allégée</option>
                      <option value={84}>84 mois (7 ans) - Petite mensualité</option>
                      <option value={120}>120 mois (10 ans) - Mensualité minimale</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Votre mensualité maximale (€ / mois)
                    </label>
                    <input
                      type="number"
                      min="50"
                      value={maxMonthlyPayment}
                      onChange={(e) => setMaxMonthlyPayment(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Capacité financière mensuelle
                    </span>
                  </div>
                </div>
              )}

              {isEquityOrRevenueMode ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-3">
                  <div>
                    <span className="text-emerald-800 font-bold block">
                      {investmentReturnMode === 'parts_sociales'
                        ? `Entrée au capital : ${equityPercentage} % des parts pour ${formatEuro(amountRequested)}`
                        : `Partage de résultats : ${equityPercentage} % du CA / bénéfices sur ${termMonths} mois`}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Aucune mensualité fixe à rembourser : l'investisseur est associé à la réussite du projet.
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-900 shrink-0">0 €/mois</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">Mensualité théorique résultante :</span>
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {formatEuro(estimatedMonthly)} / mois
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Budget mensuel :</span>
                    <span
                      className={`font-semibold ${
                        estimatedMonthly <= maxMonthlyPayment ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {estimatedMonthly <= maxMonthlyPayment
                        ? '✓ Équilibré et réaliste'
                        : '⚠ Allongez la durée pour baisser la mensualité'}
                    </span>
                  </div>
                </div>
              )}

              {/* Detailed Project / Fund Allocation Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Précisions concrètes sur l'utilisation des fonds (rassure les investisseurs)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Ventilation exacte de l'argent demandé
                    </label>
                    <input
                      type="text"
                      value={useOfFunds}
                      onChange={(e) => setUseOfFunds(e.target.value)}
                      placeholder="Ex: 6 000 € travaux locaux, 4 000 € matériel, 3 000 € trésorerie"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Calendrier de mise en œuvre / Délai
                    </label>
                    <input
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="Ex: Travaux sur 2 mois, ouverture prévue en septembre"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-950">
                <div>
                  <span className="font-semibold block">Accord direct et 100 % net entre les parties</span>
                  <span className="text-[11px] text-emerald-800">
                    Aucun intermédiaire bancaire sur le capital convenu. Seuls {formatEuro(loyalty.publicationPrice)} seront réglés à l'étape finale pour publier l'annonce.
                  </span>
                </div>
                <span className="font-bold text-sm">100 % net</span>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Prénom & Nom (visibles au clic sur « Négocier ») *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Pseudonyme public *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantPseudonym}
                    onChange={(e) => setApplicantPseudonym(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    E-mail / Gmail de contact pour négocier *
                  </label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="votre.nom@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Téléphone de contact (+261 MVola/Airtel/Orange ou +33) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+261 34 12 345 67"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ville (Madagascar / Diaspora) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Antananarivo, Toamasina..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Profession *
                  </label>
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Revenus nets mensuels déclarés (€)
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => {
                      setMonthlyIncome(Number(e.target.value));
                      setHasEnteredFinances(true);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Charges fixes mensuelles (€)
                  </label>
                  <input
                    type="number"
                    value={existingCharges}
                    onChange={(e) => {
                      setExistingCharges(Number(e.target.value));
                      setHasEnteredFinances(true);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 ${
                      isEquityOrRevenueMode || effortRate <= 35
                        ? 'text-emerald-600'
                        : effortRate <= 45
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-slate-900">
                      {isEquityOrRevenueMode
                        ? `Mode ${investmentReturnMode === 'parts_sociales' ? 'Parts sociales' : 'Partage de résultats'} (${equityPercentage} %)`
                        : `Indice de solvabilité estimé : Note ${computedRiskGrade} (${effortRate}% d'effort)`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isEquityOrRevenueMode ? (
                        'Aucune mensualité fixe retenue sur votre budget mensuel.'
                      ) : (
                        <>
                          Reste à vivre après mensualité estimée :{' '}
                          <strong className="text-slate-800">
                            {formatEuro(Math.max(0, resteAVivre))} / mois
                          </strong>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-[11px] px-2.5 py-1 rounded-md border shrink-0 ${
                    isEquityOrRevenueMode || effortRate <= 35
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : effortRate <= 45
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {isEquityOrRevenueMode
                    ? '0 € de mensualité fixe'
                    : effortRate <= 35
                    ? 'Profil Sain'
                    : effortRate <= 45
                    ? 'Modéré'
                    : "Taux d'effort élevé"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ancienneté / Expérience dans ce domaine
                  </label>
                  <input
                    type="text"
                    value={employmentTenure}
                    onChange={(e) => setEmploymentTenure(e.target.value)}
                    placeholder="Ex: 5 ans d'expérience, gérant ou CDI depuis 3 ans"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Chiffre d’affaires ou retombées prévisionnelles
                  </label>
                  <input
                    type="text"
                    value={projectedRevenue}
                    onChange={(e) => setProjectedRevenue(e.target.value)}
                    placeholder="Ex: 8 500 €/mois de recettes estimées la 1ère année"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Garantie, pacte ou sûreté proposée pour sécuriser l'investisseur *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isEquityOrRevenueMode
                      ? "Ex: Pacte d'associés, suivi comptable trimestriel, engagement de transparence..."
                      : "Ex: Caution solidaire, gage véhicule, nantissement d'épargne ou matériel..."
                  }
                  value={guaranteeType}
                  onChange={(e) => setGuaranteeType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Optional Company Registry Verification (Madagascar NIF/STAT or INSEE SIREN) */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span>Vérifier votre entreprise (NIF / STAT Madagascar ou SIREN) — optionnel</span>
                  </div>
                  {verifiedCompany && (
                    <button
                      type="button"
                      onClick={() => setVerifiedCompany(undefined)}
                      className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
                    >
                      Retirer
                    </button>
                  )}
                </div>

                {verifiedCompany ? (
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-300 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-800 block">
                        ✓ {verifiedCompany.legalName} ({verifiedCompany.identifier})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {verifiedCompany.legalForm || ''} {verifiedCompany.city ? `· ${verifiedCompany.city}` : ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value as 'MG' | 'FR')}
                        className="px-2.5 py-2 text-xs bg-white border border-orange-200 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="MG">Madagascar (NIF / STAT)</option>
                        <option value="FR">France (SIREN / Nom)</option>
                      </select>
                      <input
                        type="text"
                        value={companyQuery}
                        onChange={(e) => setCompanyQuery(e.target.value)}
                        placeholder={
                          companyCountry === 'MG'
                            ? 'Ex: NIF 10 chiffres ou STAT 17 chiffres'
                            : 'Ex: Numéro SIREN ou raison sociale'
                        }
                        className="flex-1 px-3 py-2 text-xs bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCompany}
                        disabled={isVerifyingCompany}
                        className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isVerifyingCompany ? 'Contrôle...' : 'Vérifier'}</span>
                      </button>
                    </div>
                    {companyVerifyError && (
                      <p className="text-[11px] text-rose-700 font-medium">{companyVerifyError}</p>
                    )}
                    {companySearchResults.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {companySearchResults.map((resItem) => (
                          <button
                            key={`${resItem.registryType}-${resItem.identifier}`}
                            type="button"
                            onClick={() => {
                              setVerifiedCompany({
                                ...resItem,
                                verifiedAt: new Date().toLocaleDateString('fr-FR'),
                              });
                              setCompanySearchResults([]);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-slate-900 block">
                              {resItem.legalName} — {resItem.identifier}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {resItem.city || 'Madagascar'} {resItem.activity ? `· ${resItem.activity}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: PDF Import (above text), Story, Documents & Publication Payment */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Dedicated PDF Import Area directly ABOVE the narrative text */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Importer un fichier PDF (optionnel)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ajoutez votre dossier, contrat, avis d'imposition ou justificatif au format PDF juste au-dessus du texte.
                      </span>
                    </div>
                  </div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={handlePdfImportChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer un PDF</span>
                  </button>
                </div>

                {pdfUploadError && (
                  <p className="text-[11px] text-rose-700 font-medium">{pdfUploadError}</p>
                )}

                {uploadedFiles.some((f) => f.name.toLowerCase().endsWith('.pdf')) && (
                  <div className="space-y-1 pt-1">
                    {uploadedFiles
                      .map((file, idx) => ({ file, idx }))
                      .filter(({ file }) => file.name.toLowerCase().endsWith('.pdf'))
                      .map(({ file, idx }) => (
                        <div
                          key={`pdf-${file.name}-${idx}`}
                          className="flex items-center justify-between text-xs text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        >
                          <span className="truncate font-medium flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-slate-400 font-normal">({file.sizeLabel})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-600 ml-2 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Explication détaillée de votre besoin pour l'investisseur *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Expliquez pourquoi vous sollicitez ce financement ou partenariat, et comment vous sécurisez l'investisseur (ou demandez à SolvaSolution ci-dessus de le rédiger pour vous)..."
                  value={contextStory}
                  onChange={(e) => setContextStory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Pièces justificatives (optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-600">
                      Joignez CNI, avis d'imposition, créance ou devis depuis votre appareil
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
                  >
                    + Ajouter des fichiers
                  </button>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center justify-between text-xs text-slate-700 px-3 py-1.5 bg-slate-100 rounded-md"
                      >
                        <span className="truncate font-medium">
                          {file.name}{' '}
                          <span className="text-slate-400 font-normal">({file.sizeLabel})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-slate-400 hover:text-rose-600 ml-2 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Publication Fee Checkout Box */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Frais uniques de publication en ligne
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Mise en ligne dans l'onglet{' '}
                      {type === 'investissement' ? 'Investissement' : 'Autre sujet'}
                    </h4>
                  </div>
                  <div className="text-left sm:text-right">
                    {loyalty.discountPct > 0 && (
                      <span className="text-xs text-slate-400 line-through block font-mono">
                        {formatEuro(BASE_PUBLICATION_PRICE)}
                      </span>
                    )}
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {formatEuro(loyalty.publicationPrice)}
                    </span>
                  </div>
                </div>

                {loyalty.active ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-950/60 border border-emerald-700/60 px-3 py-2.5 rounded-xl text-emerald-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {loyalty.isFreePublicationNow
                          ? 'Avantage Diamond : ce 5e dossier est 100 % OFFERT (0 €) !'
                          : loyalty.isDiamond
                          ? `Membre Prestigieux Officiel (-45 %) · Prochain dossier offert dans ${loyalty.dossiersUntilFreePublication} publication(s)`
                          : loyalty.discountPct > 0
                          ? `Réduction fidélité -${loyalty.discountPct} % appliquée (${loyalty.label})`
                          : 'Compte Fidélité actif (Palier Bronze -10 %)'}
                      </span>
                    </span>
                    <span className="font-bold text-amber-300 shrink-0">
                      +{EXP_PER_DOSSIER} EXP crédités
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-300">
                    <span>
                      Astuce : activez le <strong>Compte Fidélité ({formatEuro(LOYALTY_ACTIVATION_PRICE)})</strong> pour gagner +{EXP_PER_DOSSIER} EXP par dossier et obtenir jusqu'à -45 % + 1 dossier offert / 5.
                    </span>
                    {onOpenLoyalty && (
                      <button
                        type="button"
                        onClick={onOpenLoyalty}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 cursor-pointer"
                      >
                        Voir Fidélité
                      </button>
                    )}
                  </div>
                )}

                {paymentError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/90 border border-rose-700 text-xs text-rose-200 font-medium">
                    {paymentError}
                  </div>
                )}

                {/* Payment Card Fields (hidden when 5th Diamond dossier is 100% Free) */}
                {loyalty.isFreePublicationNow ? (
                  <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-100 space-y-1">
                    <p className="font-bold text-cyan-300">
                      ✦ Dossier offert — Aucune carte bancaire requise
                    </p>
                    <p className="text-[11px] text-cyan-100/90 leading-relaxed">
                      En tant que Membre Prestigieux Officiel (Diamond), votre 5e dossier est publié gratuitement (0 €) avec mise en avant prioritaire automatique.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Numéro de carte bancaire *
                      </label>
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="4970 •••• •••• ••••"
                          value={cardNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setCardNumber(raw.match(/.{1,4}/g)?.join(' ') || raw);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Expiration *
                        </label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={expiry}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setExpiry(raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg font-mono text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          CVC *
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg font-mono text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s: number) => (s - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s: number) => (s + 1) as 1 | 2 | 3 | 4)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Étape suivante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPublishing}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Publication en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <Check className="w-4 h-4" />
                    <span>
                      {loyalty.isFreePublicationNow
                        ? 'Publier gratuitement (5e dossier Diamond offert)'
                        : `Payer ${formatEuro(loyalty.publicationPrice)} et publier mon dossier`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      <FuturisticPaymentOverlay
        phase={paymentPhase}
        amountLabel={
          loyalty.isFreePublicationNow
            ? '0 € (Offert)'
            : formatEuro(loyalty.publicationPrice)
        }
        subtitle="Publication officielle et mise en ligne du dossier sur SolvaPact"
      />
    </div>
  );
};
