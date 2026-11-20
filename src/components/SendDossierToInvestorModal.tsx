import React, { useEffect, useState } from 'react';
import {
  DirectSubmission,
  Dossier,
  DossierType,
  InvestorDirectoryEntry,
  InvestmentReturnMode,
  User,
} from '../types';
import { sendDirectDossierToInvestor } from '../services/firestoreService';
import { formatAriaryApprox, formatEuro } from '../utils/finance';
import { useModalEscape } from '../utils/useModalEscape';
import {
  X,
  Send,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  ExternalLink,
  FolderCheck,
  Sparkles,
} from 'lucide-react';

interface SendDossierToInvestorModalProps {
  isOpen: boolean;
  investor: InvestorDirectoryEntry | null;
  currentUser: User | null;
  myDossiers: Dossier[];
  onClose: () => void;
  onRequireAuth: () => void;
  onSentSuccess?: (submission: DirectSubmission) => void;
}

const CATEGORIES = [
  'Éducation & Formation',
  'Immobilier & Construction',
  'Artisanat & BTP',
  'Commerce de bouche',
  'Particulier / Refinancement',
  'Profession libérale & Freelance',
  'Automobile & Logistique',
  'Autre domaine',
];

const RETURN_MODES: Array<{ value: InvestmentReturnMode; label: string }> = [
  { value: 'remboursement', label: 'Remboursement mensuel avec intérêt' },
  { value: 'parts_sociales', label: 'Parts sociales / Entrée au capital' },
  { value: 'redevance_ca', label: "Partage du chiffre d'affaires / Bénéfices" },
  { value: 'hybride', label: 'Formule mixte (remboursement + parts)' },
];

export const SendDossierToInvestorModal: React.FC<SendDossierToInvestorModalProps> = ({
  isOpen,
  investor,
  currentUser,
  myDossiers,
  onClose,
  onRequireAuth,
  onSentSuccess,
}) => {
  const [mode, setMode] = useState<'existing_dossier' | 'quick_pitch'>(
    myDossiers.length > 0 ? 'existing_dossier' : 'quick_pitch'
  );
  const [selectedDossierId, setSelectedDossierId] = useState<string>(myDossiers[0]?.id || '');

  const [dossierTitle, setDossierTitle] = useState('');
  const [dossierType, setDossierType] = useState<DossierType>('investissement');
  const [category, setCategory] = useState('Commerce de bouche');
  const [amountRequested, setAmountRequested] = useState<number>(5000);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [returnMode, setReturnMode] = useState<InvestmentReturnMode>('parts_sociales');
  const [equityPercentage, setEquityPercentage] = useState<string>('15');
  const [dossierSummary, setDossierSummary] = useState('');

  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [senderEmail, setSenderEmail] = useState(currentUser?.email || '');
  const [senderPhone, setSenderPhone] = useState(currentUser?.phone || '');
  const [senderCity, setSenderCity] = useState(currentUser?.city || 'Antananarivo');
  const [personalMessage, setPersonalMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSubmission, setSentSubmission] = useState<DirectSubmission | null>(null);

  useEffect(() => {
    if (!isOpen || !investor) return;
    setError(null);
    setSentSubmission(null);
    const hasDossiers = myDossiers.length > 0;
    setMode(hasDossiers ? 'existing_dossier' : 'quick_pitch');
    setSelectedDossierId(myDossiers[0]?.id || '');
    setSenderName(currentUser?.name || '');
    setSenderEmail(currentUser?.email || '');
    setSenderPhone(currentUser?.phone || '');
    setSenderCity(currentUser?.city || 'Antananarivo');
    setPersonalMessage(
      `Bonjour ${investor.displayName}, votre profil d'investisseur sur SolvaPact Madagascar correspond à notre besoin. Je vous transmets notre dossier ci-joint pour en discuter directement.`
    );
  }, [isOpen, investor, currentUser, myDossiers]);

  useModalEscape(isOpen, onClose);

  if (!isOpen || !investor) return null;

  const selectedDossier = myDossiers.find((d) => d.id === selectedDossierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!senderName.trim() || !senderEmail.trim() || !senderEmail.includes('@')) {
      setError('Veuillez renseigner votre nom complet et une adresse e-mail de réponse valide.');
      return;
    }

    if (!personalMessage.trim() || personalMessage.trim().length < 5) {
      setError('Ajoutez un court message personnel pour présenter votre prise de contact.');
      return;
    }

    let finalTitle = dossierTitle.trim();
    let finalType: DossierType = dossierType;
    let finalCategory = category;
    let finalAmount = Number(amountRequested) || 5000;
    let finalTerm = Number(termMonths) || 24;
    let finalReturnMode: InvestmentReturnMode | undefined = returnMode;
    let finalEquity: number | undefined =
      returnMode !== 'remboursement' && equityPercentage !== ''
        ? Math.min(100, Math.max(0, Number(equityPercentage) || 0))
        : undefined;
    let finalSummary = dossierSummary.trim();
    let linkedDossierId: string | undefined = undefined;

    if (mode === 'existing_dossier') {
      if (!selectedDossier) {
        setError('Sélectionnez un dossier existant ou choisissez la présentation directe.');
        return;
      }
      linkedDossierId = selectedDossier.id;
      finalTitle = selectedDossier.title;
      finalType = selectedDossier.type;
      finalCategory = selectedDossier.category;
      finalAmount = selectedDossier.amountRequested;
      finalTerm = selectedDossier.termMonths;
      finalReturnMode = selectedDossier.investmentReturnMode;
      finalEquity = selectedDossier.equityPercentage;
      finalSummary = selectedDossier.description || selectedDossier.contextStory || selectedDossier.title;
    } else {
      if (finalTitle.length < 3) {
        setError('Veuillez indiquer un titre de projet clair (minimum 3 caractères).');
        return;
      }
      if (finalAmount < 500 || finalAmount > 1000000) {
        setError('Le montant demandé doit être compris entre 500 € et 1 000 000 €.');
        return;
      }
      if (finalTerm < 6 || finalTerm > 120) {
        setError('La durée indicative doit être comprise entre 6 et 120 mois.');
        return;
      }
      if (finalSummary.length < 10) {
        setError('Veuillez rédiger un résumé de projet (au moins 10 caractères).');
        return;
      }
    }

    setIsSending(true);
    try {
      const submission = await sendDirectDossierToInvestor(currentUser.uid || currentUser.id, {
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone.trim() || undefined,
        senderCity: senderCity.trim() || 'Antananarivo',
        investorUid: investor.uid,
        investorName: investor.displayName,
        investorEmail: investor.contactEmail,
        dossierId: linkedDossierId,
        dossierTitle: finalTitle,
        dossierType: finalType,
        category: finalCategory,
        amountRequested: finalAmount,
        termMonths: finalTerm,
        investmentReturnMode: finalReturnMode,
        equityPercentage: finalEquity,
        dossierSummary: finalSummary,
        personalMessage: personalMessage.trim(),
      });
      setSentSubmission(submission);
      onSentSuccess?.(submission);
    } catch (err) {
      console.error('Direct dossier submission error:', err);
      setError("Impossible d'envoyer votre dossier pour le moment. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsSending(false);
    }
  };

  const mailtoHref = sentSubmission
    ? `mailto:${encodeURIComponent(investor.contactEmail)}?subject=${encodeURIComponent(
        `[SolvaPact Madagascar] Dossier : ${sentSubmission.dossierTitle}`
      )}&body=${encodeURIComponent(
        `Bonjour ${investor.displayName},\n\nJe viens de vous transmettre mon dossier sur SolvaPact Madagascar :\n- Projet : ${sentSubmission.dossierTitle}\n- Montant : ${formatEuro(sentSubmission.amountRequested)} (${formatAriaryApprox(sentSubmission.amountRequested)})\n- Durée : ${sentSubmission.termMonths} mois\n\nRésumé : ${sentSubmission.dossierSummary}\n\nMessage : ${sentSubmission.personalMessage}\n\nMes coordonnées :\n- Nom : ${sentSubmission.senderName}\n- Ville : ${sentSubmission.senderCity}\n- E-mail : ${sentSubmission.senderEmail}${
          sentSubmission.senderPhone ? `\n- Téléphone : ${sentSubmission.senderPhone}` : ''
        }`
      )}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block">
              Envoi direct à un investisseur · SolvaPact Madagascar
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Transmettre mon dossier à {investor.displayName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1 w-full flex">
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-[#FC3D32]" />
          <span className="w-1/3 bg-[#007E3A]" />
        </div>

        {sentSubmission ? (
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900">
                Dossier envoyé directement à {investor.displayName} !
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Votre dossier « <strong>{sentSubmission.dossierTitle}</strong> » est désormais visible dans la boîte de réception directe de l&apos;investisseur sur SolvaPact. Vous pouvez aussi le doubler par e-mail.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
              <p className="font-bold text-slate-900">Coordonnées directes de l&apos;investisseur :</p>
              <p className="text-slate-700 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>{investor.contactEmail}</span>
              </p>
              {investor.contactPhone && (
                <p className="text-slate-700 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{investor.contactPhone}</span>
                </p>
              )}
              <p className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{investor.city}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={mailtoHref}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Doubler par e-mail / Gmail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Terminer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Investor recipient preview */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-emerald-950 block">
                  Destinataire : {investor.displayName} ({investor.city})
                </span>
                <span className="text-emerald-800">
                  {investor.investmentFocus || 'Investisseur privé SolvaPact'}
                  {investor.ticketRange ? ` · ${investor.ticketRange}` : ''}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                OK pour recevoir votre dossier · Accord direct
              </span>
            </div>

            {/* Choose existing dossier vs direct pitch */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Comment souhaitez-vous présenter votre dossier ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={myDossiers.length === 0}
                  onClick={() => setMode('existing_dossier')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === 'existing_dossier'
                      ? 'border-orange-600 bg-orange-50/70 ring-1 ring-orange-600'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <FolderCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Un de mes dossiers ({myDossiers.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {myDossiers.length > 0
                        ? 'Envoi en 1 clic avec fiche liée'
                        : 'Aucun dossier publié pour le moment'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('quick_pitch')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                    mode === 'quick_pitch'
                      ? 'border-emerald-700 bg-emerald-50/70 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Dossier direct sur mesure
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Gratuit · envoi privé direct sans publication publique
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {mode === 'existing_dossier' && myDossiers.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Sélectionnez votre dossier à transmettre *
                </label>
                <select
                  value={selectedDossierId}
                  onChange={(e) => setSelectedDossierId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {myDossiers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} — {formatEuro(d.amountRequested)} ({d.termMonths} mois)
                    </option>
                  ))}
                </select>
                {selectedDossier && (
                  <p className="text-[11px] text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>Résumé transmis :</strong> {selectedDossier.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Contenu du dossier transmis à l&apos;investisseur</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Titre du projet / besoin *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Extension boulangerie artisanale à Antananarivo"
                      value={dossierTitle}
                      onChange={(e) => setDossierTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nature du besoin *
                    </label>
                    <select
                      value={dossierType}
                      onChange={(e) => setDossierType(e.target.value as DossierType)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="investissement">Investissement &amp; Projet</option>
                      <option value="autre">Autre sujet</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Montant recherché (€) *
                    </label>
                    <input
                      type="number"
                      min={500}
                      max={1000000}
                      step={100}
                      required
                      value={amountRequested}
                      onChange={(e) => setAmountRequested(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 tabular-nums"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      ≈ {formatAriaryApprox(Number(amountRequested) || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Durée souhaitée (mois) *
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={120}
                      required
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Contrepartie proposée
                    </label>
                    <select
                      value={returnMode}
                      onChange={(e) => setReturnMode(e.target.value as InvestmentReturnMode)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {RETURN_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {returnMode !== 'remboursement' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Part proposée (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={equityPercentage}
                        onChange={(e) => setEquityPercentage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 tabular-nums"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Résumé structuré du dossier (objectif, usage des fonds, garanties) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={2000}
                    placeholder="Décrivez clairement votre projet, le chiffre d'affaires prévu, les garanties ou justificatifs (NIF/STAT) disponibles..."
                    value={dossierSummary}
                    onChange={(e) => setDossierSummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Sender contact details */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Vos coordonnées pour que l&apos;investisseur puisse vous répondre
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    E-mail de réponse *
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Téléphone / MVola / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+261 34 12 345 67"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Message personnel à {investor.displayName} *
              </label>
              <textarea
                rows={3}
                required
                maxLength={2000}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon dossier directement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
