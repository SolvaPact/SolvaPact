import React, { useState, useEffect, useRef } from 'react';
import { Dossier, DossierType, User } from '../types';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  calculateMonthlyPayment,
  formatEuro,
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
} from 'lucide-react';
import solvaBackdrop from '../assets/images/solvasolution_ai_backdrop_1794656956781.jpg';

interface DepositDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDossier: (dossier: Dossier, paidAmount: number) => void;
  currentUser?: User | null;
  defaultType?: DossierType;
  initialAmount?: number;
  initialTerm?: number;
  onOpenLoyalty?: () => void;
  guidedBySolva?: boolean;
}

interface AttachedFile {
  name: string;
  sizeLabel: string;
}

export const DepositDossierModal: React.FC<DepositDossierModalProps> = ({
  isOpen,
  onClose,
  onSubmitDossier,
  currentUser,
  defaultType = 'dette',
  initialAmount,
  initialTerm,
  onOpenLoyalty,
  guidedBySolva = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Form State - 3 main dossier types
  const [type, setType] = useState<DossierType>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Particulier & Pro');
  const [amountRequested, setAmountRequested] = useState<number>(10000);
  const [originalDebtAmount, setOriginalDebtAmount] = useState<number>(13000);
  const [targetInterestRate, setTargetInterestRate] = useState<number>(6.0);
  const [targetDiscount, setTargetDiscount] = useState<number>(20);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [maxMonthlyPayment, setMaxMonthlyPayment] = useState<number>(320);
  const [description, setDescription] = useState('');
  const [contextStory, setContextStory] = useState('');
  const [guaranteeType, setGuaranteeType] = useState('Caution solidaire ou retenue sur salaire');

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

  // Documents (real user attachments)
  const [uploadedFiles, setUploadedFiles] = useState<AttachedFile[]>([]);

  // Step 4 Publication Payment State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // SolvaSolution Mini-Box State
  const [solvaInput, setSolvaInput] = useState('');
  const [isSolvaDrafting, setIsSolvaDrafting] = useState(false);
  const [solvaReply, setSolvaReply] = useState<string | null>(null);
  const [solvaError, setSolvaError] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  useEffect(() => {
    setSolvaInput('');
    setSolvaReply(null);
    setSolvaError(null);
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setPaymentError(null);
      setPdfUploadError(null);
      setSolvaInput('');
      setSolvaReply(null);
      setSolvaError(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const nextFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      sizeLabel: formatFileSize(f.size),
    }));
    setUploadedFiles((prev) => [...prev, ...nextFiles]);
    e.target.value = '';
  };

  const handlePdfImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const validPdfs: AttachedFile[] = [];
    let rejected = false;

    Array.from(files).forEach((f) => {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        validPdfs.push({
          name: f.name,
          sizeLabel: formatFileSize(f.size),
        });
      } else {
        rejected = true;
      }
    });

    if (validPdfs.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validPdfs]);
    }
    if (rejected) {
      setPdfUploadError('Seuls les fichiers au format PDF (.pdf) sont acceptés dans cette zone.');
    }
    e.target.value = '';
  };

  const handleSolvaDraft = async () => {
    const trimmed = solvaInput.trim();
    if (!trimmed || isSolvaDrafting) return;

    setSolvaError(null);
    setSolvaReply(null);
    setIsSolvaDrafting(true);

    const applyDraftFields = (fields: {
      title?: string;
      description?: string;
      guaranteeType?: string;
      contextStory?: string;
      coachMessage?: string;
    }) => {
      if (step === 1) {
        if (fields.title?.trim()) setTitle(fields.title.trim());
        if (fields.description?.trim()) setDescription(fields.description.trim());
      } else if (step === 3) {
        if (fields.guaranteeType?.trim()) setGuaranteeType(fields.guaranteeType.trim());
      } else if (step === 4) {
        if (fields.contextStory?.trim()) setContextStory(fields.contextStory.trim());
      }
      setSolvaReply(
        fields.coachMessage?.trim() ||
          (step === 2
            ? 'Conseil affiché ci-dessous (vos chiffres restent entièrement sous votre contrôle).'
            : 'Texte rédigé et inséré automatiquement dans votre dossier.')
      );
      setSolvaInput('');
    };

    try {
      const payload = JSON.stringify({
        step,
        userPrompt: trimmed,
        userName: applicantName || currentUser?.name,
        dossierContext: {
          type,
          category,
          title,
          description,
          amountRequested,
          originalDebtAmount,
          targetInterestRate,
          termMonths,
          maxMonthlyPayment,
          monthlyIncome,
          existingCharges,
          guaranteeType,
          contextStory,
          attachedFiles: uploadedFiles.map((f) => f.name),
        },
      });

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 35000);
      let response: Response | null = null;

      try {
        response = await fetch('/api/solvasolution/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: payload,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const rawText = await response.text();
      let parsedData: {
        title?: string;
        description?: string;
        guaranteeType?: string;
        contextStory?: string;
        coachMessage?: string;
        error?: string;
      } | null = null;

      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = null;
      }

      if (response.ok && parsedData && !parsedData.error) {
        applyDraftFields(parsedData);
        return;
      }

      // Automatic fallback via the proven /api/solvasolution/chat route if /draft is not yet deployed or returned 404/5xx
      const fallbackController = new AbortController();
      const fallbackTimeout = window.setTimeout(() => fallbackController.abort(), 35000);
      try {
        const tagInstruction =
          step === 1
            ? `Rédige pour mon dossier SolvaPact (type: ${type}, catégorie: ${category}) sans utiliser de #, * ni Markdown. Réponds exactement avec les balises [[TITRE]]...[[/TITRE]] et [[RESUME]]...[[/RESUME]]. Mon besoin : ${trimmed}`
            : step === 2
            ? `Réponds brièvement en texte clair (sans #, * ni Markdown) à ma question sur mes montants/durée (${amountRequested} €, ${termMonths} mois) : ${trimmed}`
            : step === 3
            ? `Formule en une phrase claire et rassurante (sans #, * ni Markdown) la garantie suivante pour mon dossier avec la balise [[GARANTIE]]...[[/GARANTIE]] : ${trimmed}`
            : `Rédige l'exposé complet de mon dossier en 3 paragraphes clairs (sans #, * ni Markdown) avec la balise [[EXPOSE]]...[[/EXPOSE]]. Contexte: ${amountRequested} € sur ${termMonths} mois, revenus ${monthlyIncome} €/mois. Mon texte : ${trimmed}`;

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
              'SolvaSolution n’a pas pu rédiger pour cette étape pour le moment. Réessayez dans un instant.'
          );
          return;
        }

        const replyStr = chatData.reply;
        const pickTag = (tag: string) => {
          const m = replyStr.match(new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)\\[\\[\\/${tag}\\]\\]`, 'i'));
          return m?.[1]?.trim() || '';
        };

        if (step === 1) {
          const t = pickTag('TITRE') || replyStr.split('\n')[0]?.trim().slice(0, 120) || '';
          const r = pickTag('RESUME') || replyStr.split('\n').slice(1).join(' ').trim().slice(0, 350);
          applyDraftFields({
            title: t,
            description: r,
            coachMessage: 'Titre et résumé rédigés et insérés dans votre dossier.',
          });
        } else if (step === 3) {
          applyDraftFields({
            guaranteeType: pickTag('GARANTIE') || replyStr.slice(0, 240),
            coachMessage: 'Garantie formulée et insérée dans votre dossier.',
          });
        } else if (step === 4) {
          applyDraftFields({
            contextStory: pickTag('EXPOSE') || replyStr,
            coachMessage: 'Exposé détaillé rédigé et inséré dans votre dossier.',
          });
        } else {
          applyDraftFields({ coachMessage: replyStr });
        }
      } catch {
        window.clearTimeout(fallbackTimeout);
        setSolvaError(
          parsedData?.error ||
            'Connexion interrompue avec SolvaSolution. Vérifiez votre connexion et réessayez.'
        );
      }
    } catch {
      setSolvaError(
        'Délai dépassé avec SolvaSolution. Réessayez votre demande ou remplissez le champ directement.'
      );
    } finally {
      setIsSolvaDrafting(false);
    }
  };

  const applyPreset = (presetKey: 'credit' | 'tresorerie' | 'contentieux' | 'solidaire') => {
    if (presetKey === 'credit') {
      setType('dette');
      setTitle('Regroupement & Apurement de crédits conso et découverts');
      setCategory('Particulier / Refinancement');
      setOriginalDebtAmount(16000);
      setAmountRequested(12000);
      setTargetDiscount(25);
      setTermMonths(36);
      setMaxMonthlyPayment(310);
      setDescription(
        "Restructuration complète de 2 crédits à la consommation et d'un découvert bancaire avec rachat au comptant décoté."
      );
      setContextStory(
        'Salarié en CDI, je cherche à assainir ma situation financière en regroupant mes charges en une mensualité unique et supportable sous seing privé.'
      );
      setGuaranteeType('Engagement de prélèvement SEPA & cession sur salaire');
    } else if (presetKey === 'tresorerie') {
      setType('investissement');
      setTitle("Besoin de trésorerie d'exploitation et outillage professionnel");
      setCategory('Artisanat & BTP');
      setAmountRequested(15000);
      setTargetInterestRate(6.5);
      setTermMonths(24);
      setMaxMonthlyPayment(670);
      setDescription(
        'Financement de matériel de chantier pour honorer de nouveaux contrats signés avec paiement des intérêts chaque mois.'
      );
      setContextStory(
        "Artisan du bâtiment depuis 4 ans, activité rentable avec carnet de commandes plein. Délais bancaires trop longs, je sollicite un investisseur réactif."
      );
      setGuaranteeType('Nantissement de matériel professionnel & caution solidaire');
    } else if (presetKey === 'contentieux') {
      setType('dette');
      setTitle("Apurement amiable d'une créance fournisseur avec décote comptant");
      setCategory('Commerce de bouche');
      setOriginalDebtAmount(10000);
      setAmountRequested(7000);
      setTargetDiscount(30);
      setTermMonths(24);
      setMaxMonthlyPayment(315);
      setDescription(
        'Règlement transactionnel sous seing privé avec le créancier pour éteindre le litige commercial et solder définitivement le dossier.'
      );
      setContextStory(
        "Le créancier a accepté par écrit un accord transactionnel à 70% de la somme. Je recherche un financeur pour débloquer les 7 000 € au comptant."
      );
      setGuaranteeType("Protocole d'accord sous seing privé avec désistement d'instance");
    } else {
      setType('autre');
      setTitle("Financement participatif de trésorerie d'urgence avec caution familiale");
      setCategory('Particulier / Refinancement');
      setAmountRequested(5000);
      setTargetInterestRate(5.0);
      setTermMonths(18);
      setMaxMonthlyPayment(290);
      setDescription(
        'Prêt direct pour surmonter un aléa temporaire de trésorerie avec engagement ferme de remboursement.'
      );
      setContextStory(
        "Revenus réguliers, suite à un imprévu j'ai besoin d'un prêt court terme direct sécurisé sans passer par le système bancaire classique."
      );
      setGuaranteeType("Caution solidaire d'un tiers solvable & engagement écrit");
    }
  };

  const estimatedMonthly = calculateMonthlyPayment(
    amountRequested,
    type === 'dette' ? 5.5 : targetInterestRate,
    termMonths
  );

  const effortRate = calculateEffortRate(monthlyIncome, existingCharges, estimatedMonthly);
  const computedRiskGrade = computeRiskGrade(effortRate);
  const resteAVivre = monthlyIncome - existingCharges - estimatedMonthly;

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      const nextExp = loyalty.active ? loyalty.exp + EXP_PER_DOSSIER : 0;
      const projectedUser: User | undefined = currentUser
        ? {
            ...currentUser,
            loyaltyExp: nextExp,
          }
        : undefined;
      const updatedLoyalty = getLoyaltyStatus(projectedUser);

      const newDossier: Dossier = {
        id: `dos-${Date.now()}`,
        title:
          title ||
          (type === 'dette'
            ? 'Apurement de dette et rachat amiable'
            : type === 'investissement'
            ? "Demande d'investissement & développement"
            : 'Dossier spécifique / Autre sujet'),
        type,
        category,
        amountRequested: Number(amountRequested),
        originalDebtAmount: type === 'dette' ? Number(originalDebtAmount) : undefined,
        targetInterestRate: type === 'investissement' ? Number(targetInterestRate) : 5.5,
        targetDiscount: type === 'dette' ? Number(targetDiscount) : undefined,
        maxMonthlyPayment: Number(maxMonthlyPayment),
        termMonths: Number(termMonths),
        description:
          description ||
          `Dossier classé dans l'onglet ${
            type === 'dette' ? 'Dette' : type === 'investissement' ? 'Investissement' : 'Autre sujet'
          } pour négociation directe avec des investisseurs.`,
        contextStory:
          contextStory ||
          'Exposé complet de la situation financière, du besoin de fonds et des engagements de remboursement.',
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
          city: city || currentUser?.city || 'France',
          postalCode: postalCode || currentUser?.postalCode,
          profession,
          monthlyIncome: Number(monthlyIncome),
          existingCharges: Number(existingCharges),
          verifiedIdentity: uploadedFiles.length > 0,
          verifiedIncome: uploadedFiles.length > 0,
          riskGrade: computedRiskGrade,
          loyaltyTier: updatedLoyalty.active ? updatedLoyalty.tier : undefined,
          loyaltyTitle:
            updatedLoyalty.active && updatedLoyalty.badgeTitle
              ? updatedLoyalty.badgeTitle
              : undefined,
        },
        documents: uploadedFiles.map((file, i) => ({
          id: `doc-new-${Date.now()}-${i}`,
          name: file.name,
          category: 'justificatif_dette',
          size: file.sizeLabel,
          verified: true,
          date: new Date().toLocaleDateString('fr-FR'),
        })),
        status: 'open',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        offersCount: 0,
        urgency: 'prioritaire',
        publicationPaidAmount: loyalty.publicationPrice,
        isDiamondPriority: updatedLoyalty.isDiamond || loyalty.isDiamond,
      };

      setIsPublishing(false);
      onSubmitDossier(newDossier, loyalty.publicationPrice);
      onClose();
      setStep(1);
      setUploadedFiles([]);
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }, 850);
  };

  const solvaPromptMeta =
    step === 1
      ? {
          question:
            'Expliquez en quelques mots votre besoin : SolvaSolution rédige votre titre et votre résumé d’accroche.',
          placeholder:
            'Ex : Je souhaite racheter 2 crédits conso et un découvert de 12 000 € pour n’avoir plus qu’une mensualité...',
          buttonLabel: 'Rédiger titre & résumé',
          writesText: true,
        }
      : step === 2
      ? {
          question:
            'Étape chiffrée : SolvaSolution n’écrit pas à votre place sur vos montants, mais répond à vos questions ici.',
          placeholder:
            'Ex : Quelle durée choisir pour garder une mensualité réaliste sur 10 000 € ?',
          buttonLabel: 'Poser la question',
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
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-slate-900 h-1 transition-all duration-300"
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
                      : 'Conseil chiffré (lecture seule)'}
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
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/35 text-[11px] text-emerald-100 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{solvaReply}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setType('dette')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    type === 'dette'
                      ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-1">
                    Onglet 1
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Dette à régler</h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Rachat de créance, apurement contentieux, découvert ou crédit à solder avec décote amiable.
                  </p>
                </div>

                <div
                  onClick={() => setType('investissement')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    type === 'investissement'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                    Onglet 2
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Investissement</h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Besoin de capital, achat de matériel, trésorerie de projet ou entreprise rémunéré par un taux d'intérêt.
                  </p>
                </div>

                <div
                  onClick={() => setType('autre')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    type === 'autre'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                    Onglet 3
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">Autre sujet</h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Accompagnement solidaire, litige particulier, accord spécifique ou restructuration sur-mesure.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modèles fréquents (cliquez pour pré-remplir instantanément) :</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyPreset('credit')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Rachat crédits & découverts</span>
                    <span className="text-[10px] text-slate-500">12 000 € · Décote 25% · 36 mois</span>
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
                    onClick={() => applyPreset('contentieux')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Apurement contentieux</span>
                    <span className="text-[10px] text-slate-500">7 000 € · Décote 30% · 24 mois</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('solidaire')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">Prêt solidaire personnel</span>
                    <span className="text-[10px] text-slate-500">5 000 € · 5.0% · 18 mois</span>
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
                    type === 'dette'
                      ? 'Ex: Rachat de créance fournisseur et apurement sur 24 mois'
                      : type === 'investissement'
                      ? "Ex: Financement d'un four professionnel pour boulangerie"
                      : "Ex: Financement solidaire pour reprise d'activité"
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sous-catégorie ou domaine
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Artisanat & BTP">Artisanat & BTP</option>
                  <option value="Commerce de bouche">Commerce de bouche</option>
                  <option value="Particulier / Refinancement">Particulier / Refinancement</option>
                  <option value="Profession libérale & Freelance">Profession libérale & Freelance</option>
                  <option value="Automobile & Logistique">Automobile & Logistique</option>
                  <option value="Autre domaine">Autre domaine</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {type === 'dette'
                      ? 'Montant proposé pour le rachat (€)'
                      : type === 'investissement'
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
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Capital à débourser par l'investisseur
                  </span>
                </div>

                {type === 'dette' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Dette nominale d'origine réclamée (€)
                    </label>
                    <input
                      type="number"
                      min="500"
                      value={originalDebtAmount}
                      onChange={(e) => setOriginalDebtAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Permet de mesurer l'économie de décote
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

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-950">
                <div>
                  <span className="font-semibold block">0 % de commission sur le montant financé</span>
                  <span className="text-[11px] text-emerald-800">
                    Vous recevrez 100 % du capital négocié. Seuls {formatEuro(loyalty.publicationPrice)} seront réglés à l'étape finale pour publier l'annonce.
                  </span>
                </div>
                <span className="font-bold tabular-nums text-sm">0 %</span>
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
                    Téléphone de contact pour négocier *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
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
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
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
                    onChange={(e) => setExistingCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 ${
                      effortRate <= 35
                        ? 'text-emerald-600'
                        : effortRate <= 45
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-slate-900">
                      Indice de solvabilité estimé : Note {computedRiskGrade} ({effortRate}% d'effort)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Reste à vivre après mensualité estimée :{' '}
                      <strong className="text-slate-800">
                        {formatEuro(Math.max(0, resteAVivre))} / mois
                      </strong>
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-[11px] px-2.5 py-1 rounded-md border shrink-0 ${
                    effortRate <= 35
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : effortRate <= 45
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {effortRate <= 35 ? 'Profil Sain' : effortRate <= 45 ? 'Modéré' : "Taux d'effort élevé"}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Garantie ou sûreté proposée pour sécuriser l'investisseur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caution solidaire, gage véhicule, nantissement d'épargne ou matériel..."
                  value={guaranteeType}
                  onChange={(e) => setGuaranteeType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
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
                  placeholder="Expliquez pourquoi vous sollicitez ce financement ou ce rachat de dette, et comment vous garantissez le remboursement (ou demandez à SolvaSolution ci-dessus de le rédiger pour vous)..."
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
                      {type === 'dette'
                        ? 'Dette'
                        : type === 'investissement'
                        ? 'Investissement'
                        : 'Autre sujet'}
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
                          ? `Réduction fidélité -${loyalty.discountPct} % appliquée`
                          : 'Compte Fidélité actif (Palier Bronze à 50 EXP)'}
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
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Étape suivante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPublishing}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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
    </div>
  );
};
