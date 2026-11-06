import React, { useState } from 'react';
import { Dossier, DossierType, User } from '../types';
import { calculateMonthlyPayment, formatEuro } from '../utils/finance';
import { X, ArrowRight, ArrowLeft, Check, Upload, ShieldCheck, AlertCircle, Coins, HelpCircle } from 'lucide-react';

interface DepositDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDossier: (dossier: Dossier) => void;
  currentUser?: User | null;
  defaultType?: DossierType;
}

export const DepositDossierModal: React.FC<DepositDossierModalProps> = ({
  isOpen,
  onClose,
  onSubmitDossier,
  currentUser,
  defaultType = 'dette',
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State - 3 main dossier types requested by user
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

  // Applicant Profile
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantPseudonym, setApplicantPseudonym] = useState(
    currentUser?.name ? `${currentUser.name.split(' ')[0]}_Direct` : ''
  );
  const [city, setCity] = useState(currentUser?.city || '');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');
  const [profession, setProfession] = useState('Salarié / Indépendant');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2600);
  const [existingCharges, setExistingCharges] = useState<number>(800);

  // Documents
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Piece_identite_CNI.pdf',
    'Avis_imposition_2025.pdf',
  ]);

  if (!isOpen) return null;

  const estimatedMonthly = calculateMonthlyPayment(
    amountRequested,
    type === 'dette' ? 5.5 : targetInterestRate,
    termMonths
  );

  const platformRate = type === 'dette' ? 0.012 : 0.02;
  const platformFee = Math.round(amountRequested * platformRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDossier: Dossier = {
      id: `dos-${Date.now()}`,
      title:
        title ||
        (type === 'dette'
          ? 'Apurement de dette et rachat amiable'
          : type === 'investissement'
          ? 'Demande d\'investissement & développement'
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
        pseudonym: applicantPseudonym || `${(applicantName || 'Membre').split(' ')[0]}_Solv`,
        city: city || currentUser?.city || 'France',
        postalCode: postalCode || currentUser?.postalCode,
        profession,
        monthlyIncome: Number(monthlyIncome),
        existingCharges: Number(existingCharges),
        verifiedIdentity: true,
        verifiedIncome: true,
        riskGrade: 'A',
      },
      documents: uploadedFiles.map((name: string, i: number) => ({
        id: `doc-new-${i}`,
        name,
        category: 'justificatif_dette',
        size: '1.2 Mo',
        verified: true,
        date: new Date().toLocaleDateString('fr-FR'),
      })),
      status: 'open',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      offersCount: 0,
      urgency: 'prioritaire',
    };

    onSubmitDossier(newDossier);
    onClose();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Création d'un dossier · Étape {step} sur 4
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {step === 1 && '1. Quel type de dossier déposez-vous ?'}
              {step === 2 && '2. Montants, durée et conditions de remboursement'}
              {step === 3 && '3. Situation financière & Garanties pour l\'investisseur'}
              {step === 4 && '4. Description, justificatifs & Commission de 2%'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* STEP 1: Onglet de classement (Dette, Investissement, Autre sujet) */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-800 block">
                Sélectionnez l'onglet de classement pour votre dossier :
              </label>

              {/* 3 tabs / categories */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Dette */}
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

                {/* 2. Investissement */}
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

                {/* 3. Autre sujet */}
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
                      ? 'Ex: Financement d\'un four professionnel pour boulangerie'
                      : 'Ex: Financement solidaire pour reprise d\'activité'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
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

          {/* STEP 2: Amounts & Repayment */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {type === 'dette'
                      ? 'Montant proposé pour le rachat (€)'
                      : type === 'investissement'
                      ? 'Montant d\'investissement recherché (€)'
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

              {/* Monthly calculation check */}
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
                      estimatedMonthly <= maxMonthlyPayment
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {estimatedMonthly <= maxMonthlyPayment
                      ? '✓ Équilibré et réaliste'
                      : '⚠ Allongez la durée pour baisser la mensualité'}
                  </span>
                </div>
              </div>

              {/* Platform commission disclaimer (1.2% for dette, 2% for invest) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex items-center justify-between text-amber-950">
                <div>
                  <span className="font-semibold block">
                    Commission SolvaPact ({type === 'dette' ? '1,2 % sur les dettes' : '2,0 %'}) :
                  </span>
                  <span className="text-[11px] text-amber-800">
                    {type === 'dette'
                      ? 'Tarif allégé à 1,2 % sur les règlements de dette pour faciliter l\'apurement.'
                      : 'Prélevée sur la transaction pour la rédaction de l\'accord et le séquestre.'}
                  </span>
                </div>
                <span className="font-bold tabular-nums text-sm">
                  {formatEuro(platformFee)}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Situation & Guarantees for investors */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Votre nom complet (confidentiel jusqu'à accord) *
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
                    Pseudonyme public (affiché aux investisseurs) *
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ville *
                  </label>
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
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Indispensable pour donner confiance aux investisseurs et obtenir une négociation rapide.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Story, Documents & Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Explication détaillée de votre besoin pour l'investisseur *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Expliquez en détail pourquoi vous avez besoin de cet argent, comment vous allez l'utiliser, et comment vous garantissez le remboursement..."
                  value={contextStory}
                  onChange={(e) => setContextStory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>

              {/* Upload simulation */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Pièces justificatives déposées
                </label>
                <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600 font-medium">
                    Ajoutez vos justificatifs (CNI, avis d'imposition, fiches de paie, justificatif de dette ou devis)
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedFiles((prev: string[]) => [
                        ...prev,
                        `Justificatif_complementaire_${prev.length + 1}.pdf`,
                      ])
                    }
                    className="mt-2 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs"
                  >
                    + Ajouter une pièce justificative
                  </button>
                </div>

                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((file: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs text-slate-600 px-3 py-1.5 bg-slate-100 rounded-md"
                    >
                      <span className="truncate">{file}</span>
                      <span className="text-emerald-700 font-medium text-[11px]">Prêt à l'envoi</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classification recap */}
              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                <span>Classement automatique :</span>
                <span className="font-bold uppercase text-slate-900">
                  Onglet {type === 'dette' ? 'Dette' : type === 'investissement' ? 'Investissement' : 'Autre sujet'}
                </span>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s: number) => (s - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
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
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
              >
                <span>Étape suivante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Publier mon dossier dans l'onglet {type === 'dette' ? 'Dette' : type === 'investissement' ? 'Investissement' : 'Autre sujet'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
