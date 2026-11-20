import React, { useEffect, useState } from 'react';
import { signInWithPopup, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  createOrSyncUserProfile,
  fetchUserProfile,
  updateUserInvestorProfileInFirestore,
} from '../services/firestoreService';
import { User } from '../types';
import { useModalEscape } from '../utils/useModalEscape';
import {
  X,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Loader2,
  Mail,
  FileSignature,
  CheckSquare,
  Square,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNewAccount?: boolean) => void;
  defaultRole?: 'demandeur' | 'investisseur';
}

const MADAGASCAR_CITIES = [
  'Antananarivo',
  'Toamasina',
  'Antsirabe',
  'Mahajanga',
  'Fianarantsoa',
  'Toliara',
  'Antsiranana',
  'Nosy Be',
  'Diaspora / Autre',
];

const PROFESSIONS = [
  'Entrepreneur / Dirigeant',
  'Investisseur / Prêteur privé',
  'Commerçant / Artisan',
  'Profession libérale / Indépendant',
  'Salarié',
  'Étudiant / Particulier',
  'Autre',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'demandeur',
}) => {
  const [step, setStep] = useState<'google' | 'profile' | 'investor_update'>('google');
  const [pendingFbUser, setPendingFbUser] = useState<FirebaseAuthUser | null>(null);
  const [existingProfile, setExistingProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [role, setRole] = useState<'demandeur' | 'investisseur'>(defaultRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('Antananarivo');
  const [postalCode, setPostalCode] = useState('101');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState(
    defaultRole === 'investisseur' ? 'Investisseur / Prêteur privé' : 'Entrepreneur / Dirigeant'
  );
  const [reasonForJoining, setReasonForJoining] = useState(
    defaultRole === 'investisseur'
      ? 'Investir des capitaux et financer des dossiers'
      : 'Trouver un investissement pour mon projet'
  );

  // Investor contact & consent fields
  const [investorContactEmail, setInvestorContactEmail] = useState('');
  const [investorFocus, setInvestorFocus] = useState('');
  const [investorTicketRange, setInvestorTicketRange] = useState('1 000 € - 25 000 €');
  const [investorBio, setInvestorBio] = useState('');
  const [investorDirectoryConsent, setInvestorDirectoryConsent] = useState<boolean>(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('google');
    setPendingFbUser(null);
    setExistingProfile(null);
    setIsLoading(false);
    setError(null);
    setRole(defaultRole);
    setProfession(
      defaultRole === 'investisseur' ? 'Investisseur / Prêteur privé' : 'Entrepreneur / Dirigeant'
    );
    setReasonForJoining(
      defaultRole === 'investisseur'
        ? 'Investir des capitaux et financer des dossiers'
        : 'Trouver un investissement pour mon projet'
    );
  }, [isOpen, defaultRole]);

  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const handleSelectRole = (selected: 'demandeur' | 'investisseur') => {
    setRole(selected);
    if (selected === 'investisseur') {
      setReasonForJoining('Investir des capitaux et financer des dossiers');
      if (profession === 'Entrepreneur / Dirigeant') {
        setProfession('Investisseur / Prêteur privé');
      }
    } else {
      setReasonForJoining('Trouver un investissement pour mon projet');
      if (profession === 'Investisseur / Prêteur privé') {
        setProfession('Entrepreneur / Dirigeant');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const existing = await fetchUserProfile(fbUser.uid);

      if (existing) {
        // If user explicitly checked "Investisseur" at login and has not yet completed
        // their investor contact/consent step (or switched from demandeur), show quick review step
        if (
          role === 'investisseur' &&
          (existing.role !== 'investisseur' || !existing.investorConsentAt)
        ) {
          setExistingProfile(existing);
          setPendingFbUser(fbUser);
          setPhone(existing.phone || '');
          setCity(existing.city || 'Antananarivo');
          setProfession(existing.profession || 'Investisseur / Prêteur privé');
          setInvestorContactEmail(existing.investorContactEmail || existing.email || fbUser.email || '');
          setInvestorFocus(existing.investorFocus || '');
          setInvestorTicketRange(existing.investorTicketRange || '1 000 € - 25 000 €');
          setInvestorBio(existing.investorBio || '');
          setInvestorDirectoryConsent(Boolean(existing.investorDirectoryConsent));
          setStep('investor_update');
          return;
        }

        onSuccess(existing, false);
        onClose();
        return;
      }

      const displayParts = (fbUser.displayName || '').trim().split(/\s+/);
      setFirstName(displayParts[0] || '');
      setLastName(displayParts.slice(1).join(' ') || '');
      setInvestorContactEmail(fbUser.email || '');
      setPendingFbUser(fbUser);
      setStep('profile');
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Fenêtre Google fermée avant la fin. Cliquez à nouveau pour vous connecter.');
      } else if (code === 'auth/popup-blocked') {
        setError('Votre navigateur a bloqué la fenêtre Google. Autorisez les popups puis réessayez.');
      } else {
        setError('Connexion Google impossible pour le moment. Réessayez dans un instant.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pendingFbUser) {
      setStep('google');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Veuillez renseigner votre prénom et votre nom.');
      return;
    }
    if (!city.trim()) {
      setError('Veuillez renseigner votre ville (ex: Antananarivo, Toamasina...).');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Veuillez indiquer un numéro de téléphone valide (ex: +261 34 12 345 67).');
      return;
    }
    if (
      role === 'investisseur' &&
      investorDirectoryConsent &&
      (!investorContactEmail.trim() || !investorContactEmail.includes('@'))
    ) {
      setError(
        "Pour apparaître dans la liste des investisseurs, veuillez renseigner un e-mail de contact valide."
      );
      return;
    }
    if (!acceptedTerms) {
      setError(
        "Veuillez accepter les Conditions d'Utilisation pour finaliser votre inscription gratuite."
      );
      return;
    }

    setIsLoading(true);
    try {
      const createdUser = await createOrSyncUserProfile(pendingFbUser, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim(),
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
        profession,
        role,
        reasonForJoining,
        acceptedTermsAt: new Date().toLocaleDateString('fr-FR'),
        investorDirectoryConsent: role === 'investisseur' ? investorDirectoryConsent : false,
        investorContactEmail:
          role === 'investisseur' ? investorContactEmail.trim() || pendingFbUser.email || '' : undefined,
        investorFocus: role === 'investisseur' ? investorFocus.trim() || undefined : undefined,
        investorTicketRange:
          role === 'investisseur' ? investorTicketRange.trim() || undefined : undefined,
        investorBio: role === 'investisseur' ? investorBio.trim() || undefined : undefined,
        investorConsentAt:
          role === 'investisseur' ? new Date().toLocaleDateString('fr-FR') : undefined,
      });
      onSuccess(createdUser, true);
      onClose();
    } catch (err) {
      console.error('Profile creation error:', err);
      setError("Impossible d'enregistrer votre profil. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExistingInvestorStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!existingProfile) {
      setStep('google');
      return;
    }

    if (
      investorDirectoryConsent &&
      (!investorContactEmail.trim() || !investorContactEmail.includes('@'))
    ) {
      setError(
        "Pour figurer dans la liste des investisseurs, indiquez un e-mail de contact valide (ou sélectionnez « Je refuse » pour continuer sans figurer dans la liste)."
      );
      return;
    }

    setIsLoading(true);
    try {
      const updated = await updateUserInvestorProfileInFirestore(existingProfile, {
        role: 'investisseur',
        phone: phone.trim() || existingProfile.phone,
        city: city.trim() || existingProfile.city,
        profession,
        investorDirectoryConsent,
        investorContactEmail: investorContactEmail.trim() || existingProfile.email,
        investorFocus: investorFocus.trim() || undefined,
        investorTicketRange: investorTicketRange.trim() || undefined,
        investorBio: investorBio.trim() || undefined,
      });
      onSuccess(updated, false);
      onClose();
    } catch (err) {
      console.error('Investor profile update error:', err);
      setError("Impossible de mettre à jour votre statut investisseur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInvestorFieldsAndConsent = () => (
    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3.5">
      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
        <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>Coordonnées de contact &amp; Lettre de consentement Investisseur</span>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          E-mail de contact pour les demandeurs {investorDirectoryConsent ? '*' : '(optionnel si refus)'}
        </label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            placeholder="investisseur@exemple.com"
            value={investorContactEmail}
            onChange={(e) => setInvestorContactEmail(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Secteurs recherchés
          </label>
          <input
            type="text"
            placeholder="Ex: Commerce, Agriculture, Tech..."
            value={investorFocus}
            onChange={(e) => setInvestorFocus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Enveloppe indicative
          </label>
          <input
            type="text"
            placeholder="Ex: 1 000 € - 25 000 €"
            value={investorTicketRange}
            onChange={(e) => setInvestorTicketRange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Mot d&apos;accueil pour les porteurs de projets (optionnel)
        </label>
        <textarea
          rows={2}
          maxLength={600}
          placeholder="Ex: J'accompagne des projets sérieux à Antananarivo et en province contre parts sociales ou partage de revenus."
          value={investorBio}
          onChange={(e) => setInvestorBio(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Lettre de consentement */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <FileSignature className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Lettre de consentement — Liste des investisseurs (« Prendre contact »)</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          En acceptant cette lettre de consentement, vous confirmez être <strong>OK pour recevoir directement des dossiers venant des demandeurs</strong> et vous autorisez SolvaPact Madagascar à afficher votre fiche (Nom, Ville, Secteurs, Enveloppe, E-mail et Téléphone de contact) dans l&apos;onglet <strong>« Prendre contact »</strong>. Vous pouvez modifier ou retirer votre accord à tout moment. <strong>Si vous refusez, aucun souci :</strong> vous continuez et vous connectez normalement sans apparaître dans la liste.
        </p>

        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setInvestorDirectoryConsent(true)}
            className={`p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
              investorDirectoryConsent
                ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
            }`}
          >
            {investorDirectoryConsent ? (
              <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span>
              Oui, j&apos;accepte la lettre de consentement : je suis OK pour recevoir des dossiers venant de demandeurs et figurer dans la liste des investisseurs.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInvestorDirectoryConsent(false)}
            className={`p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
              !investorDirectoryConsent
                ? 'border-slate-900 bg-slate-100 text-slate-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {!investorDirectoryConsent ? (
              <CheckSquare className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span>
              Non, je refuse pour le moment : continuer et me connecter normalement sans figurer dans la liste publique.
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header with Madagascar Accent */}
        <div className="p-5 border-b border-slate-100 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SolvaPact Madagascar · Compte Vérifié</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {step === 'google'
                ? 'Connexion ou Inscription gratuite'
                : step === 'investor_update'
                ? 'Profil Investisseur & Lettre de consentement'
                : 'Finalisez votre profil membre'}
            </h2>
          </div>

          <button
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

        {step === 'google' ? (
          <div className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-center">
              <p className="text-sm font-bold text-slate-900">
                Choisissez votre profil puis connectez-vous
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cochez si vous êtes <strong>Demandeur</strong> ou <strong>Investisseur</strong> (si vous cochez Investisseur, vous indiquerez votre e-mail de contact et confirmerez via la lettre de consentement si vous êtes OK pour recevoir des dossiers venant de demandeurs dans « Prendre contact »).
              </p>
            </div>

            {/* Role Checkboxes at Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectRole('demandeur')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  role === 'demandeur'
                    ? 'border-orange-600 bg-orange-50/70 text-slate-900 ring-1 ring-orange-600'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {role === 'demandeur' ? (
                  <CheckSquare className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold block">Demandeur</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Déposer un dossier &amp; contacter des investisseurs
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('investisseur')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  role === 'investisseur'
                    ? 'border-emerald-700 bg-emerald-50/80 text-slate-900 ring-1 ring-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {role === 'investisseur' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold block">Investisseur</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Recevoir des dossiers &amp; investir sur projets
                  </span>
                </div>
              </button>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-3 transition-colors shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Connexion sécurisée en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                  <ArrowRight className="w-4 h-4 text-orange-400" />
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-600 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-slate-900">100 % Gratuit</strong>
                <span>Inscription sans frais</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-emerald-700">Temps réel</strong>
                <span>Dossiers synchronisés</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-orange-700">Accord direct</strong>
                <span>Sans intermédiaire bancaire</span>
              </div>
            </div>
          </div>
        ) : step === 'investor_update' ? (
          <form onSubmit={handleSaveExistingInvestorStep} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {error}
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Connecté en tant qu&apos;<strong>Investisseur</strong> ({existingProfile?.name})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Téléphone / WhatsApp / MVola
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+261 34 12 345 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ville / Province
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={MADAGASCAR_CITIES.includes(city) ? city : 'Diaspora / Autre'}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {MADAGASCAR_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {renderInvestorFieldsAndConsent()}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Enregistrer et accéder à SolvaPact</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteProfile} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {error}
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Compte Google validé : <strong>{pendingFbUser?.email}</strong>
              </span>
            </div>

            {/* Role selection checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Cochez votre statut principal sur SolvaPact *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectRole('demandeur')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                    role === 'demandeur'
                      ? 'border-orange-600 bg-orange-50/70 text-slate-900 ring-1 ring-orange-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {role === 'demandeur' ? (
                    <CheckSquare className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">Demandeur</span>
                    <span className="text-[11px] text-slate-500">Porteur de projet</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('investisseur')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                    role === 'investisseur'
                      ? 'border-emerald-700 bg-emerald-50/80 text-slate-900 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {role === 'investisseur' ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">Investisseur</span>
                    <span className="text-[11px] text-slate-500">Financeur / Partenaire</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rindra"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rakotoarisoa"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Téléphone (MVola / Orange / Airtel / Tél) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+261 34 12 345 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Profession *
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {PROFESSIONS.map((prof) => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ville / Province à Madagascar *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={MADAGASCAR_CITIES.includes(city) ? city : 'Diaspora / Autre'}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {MADAGASCAR_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Code Postal
                </label>
                <input
                  type="text"
                  placeholder="101"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 tabular-nums"
                />
              </div>
            </div>

            {role === 'investisseur' && renderInvestorFieldsAndConsent()}

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-orange-50/40 text-[11px] text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-orange-600"
              />
              <span className="leading-relaxed">
                <strong>J&apos;accepte les Conditions d&apos;Utilisation :</strong> mes coordonnées ne sont partagées que selon mes choix (négociations de dossiers ou inscription volontaire dans l&apos;annuaire investisseurs si j&apos;ai signé la lettre de consentement).
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Valider mon compte SolvaPact Madagascar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
