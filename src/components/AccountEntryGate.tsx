import React, { useState } from 'react';
import { User } from '../types';
import { applyOwnerGoldStatus } from '../utils/finance';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Scale,
  Award,
  FileText,
} from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';

interface AccountEntryGateProps {
  onAuthSuccess: (user: User, isNewAccount: boolean) => void;
}

const PROFESSIONS = [
  'Entrepreneur / Dirigeant',
  'Investisseur / Prêteur privé',
  'Artisan / Commerçant',
  'Profession libérale / Indépendant',
  'Salarié',
  'Étudiant / Particulier',
  'Autre',
];

export const AccountEntryGate: React.FC<AccountEntryGateProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('Entrepreneur / Dirigeant');
  const [customProfession, setCustomProfession] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'demandeur' | 'investisseur'>('demandeur');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'terms'>('form');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const finalizeRegistration = () => {
    const normalizedEmail = email.trim().toLowerCase();
    let storedAccounts: Record<string, User & { passwordHash?: string }> = {};
    try {
      const raw = localStorage.getItem('solvapact_accounts_v1');
      if (raw) storedAccounts = JSON.parse(raw);
    } catch (err) {
      console.error(err);
    }

    const finalProfession =
      profession === 'Autre' && customProfession.trim()
        ? customProfession.trim()
        : profession;

    const existingLoyalty = storedAccounts[normalizedEmail];
    const newUser: User = {
      id: existingLoyalty?.id || `usr-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      profession: finalProfession,
      role,
      city: city.trim(),
      createdAt: existingLoyalty?.createdAt || new Date().toLocaleDateString('fr-FR'),
      acceptedTermsAt: new Date().toLocaleDateString('fr-FR'),
      loyaltyActive: existingLoyalty?.loyaltyActive || false,
      loyaltyExp: existingLoyalty?.loyaltyExp || 0,
      loyaltyActivatedAt: existingLoyalty?.loyaltyActivatedAt,
    };

    const finalNewUser = applyOwnerGoldStatus(newUser);
    try {
      storedAccounts[normalizedEmail] = { ...finalNewUser, passwordHash: password };
      localStorage.setItem('solvapact_accounts_v1', JSON.stringify(storedAccounts));
    } catch (err) {
      console.error(err);
    }

    onAuthSuccess(finalNewUser, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMsg('Veuillez choisir un mot de passe d’au moins 4 caractères.');
      return;
    }

    let storedAccounts: Record<string, User & { passwordHash?: string }> = {};
    try {
      const raw = localStorage.getItem('solvapact_accounts_v1');
      if (raw) storedAccounts = JSON.parse(raw);
    } catch (err) {
      console.error(err);
    }

    if (mode === 'login') {
      const existing = storedAccounts[normalizedEmail];
      if (!existing) {
        setErrorMsg("Aucun compte trouvé avec cet e-mail. Créez votre compte gratuitement ci-contre.");
        return;
      }
      if (existing.passwordHash && existing.passwordHash !== password) {
        setErrorMsg('Mot de passe incorrect.');
        return;
      }
      const { passwordHash: _ignored, ...cleanUser } = existing;
      onAuthSuccess(applyOwnerGoldStatus(cleanUser), false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom et votre nom.');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    if (!city.trim()) {
      setErrorMsg('Veuillez renseigner votre ville.');
      return;
    }

    setRegistrationStep('terms');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={solvapactLogo}
            alt="SolvaPact Logo"
            className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
          />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white block leading-tight">
              SolvaPact
            </span>
            <span className="text-[10px] text-slate-400">
              Financement Direct · Rachat de Dettes · Accords Privés
            </span>
          </div>
        </div>

        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Inscription gratuite · Accès immédiat</span>
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Platform Presentation */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Plateforme P2P Sans Intermédiaire Bancaire
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Créez votre compte gratuit pour accéder à SolvaPact
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                SolvaPact met en relation des particuliers, entrepreneurs et investisseurs pour financer un projet ou apurer une dette sous seing privé. L'inscription est gratuite : vous ne payez que lorsque vous décidez de publier un dossier.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ce qui vous attend dès votre connexion
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Préparation de dossier 100 % gratuite</h3>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Simulez vos mensualités, évaluez votre taux d'effort et montez votre dossier gratuitement. Vous ne réglez <strong>29,99 €</strong> qu'au moment de le publier en ligne.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">0 % de commission sur les fonds négociés</h3>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Aucun prélèvement sur le capital financé ou les accords signés. Tous les contrats respectent les articles 1892 et 2044 du Code Civil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-700/80 text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Compte Fidélité & Paliers EXP</h3>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Gagnez +10 EXP à chaque dossier publié et débloquez jusqu'à <strong>-23 % de réduction</strong> sur vos publications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Registration / Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              {/* Toggle Tabs */}
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegistrationStep('form');
                    setErrorMsg('');
                  }}
                  className={`py-3.5 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                    mode === 'register'
                      ? 'border-slate-900 text-slate-900 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Créer mon compte (Gratuit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegistrationStep('form');
                    setErrorMsg('');
                  }}
                  className={`py-3.5 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                    mode === 'login'
                      ? 'border-slate-900 text-slate-900 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Déjà inscrit ? Se connecter
                </button>
              </div>

              {mode === 'register' && registrationStep === 'terms' ? (
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Étape 2 sur 2 · Conditions d'Utilisation
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Confidentialité & Visibilité de vos coordonnées pour la négociation
                    </h2>
                    <p className="text-xs text-slate-500">
                      Veuillez lire et accepter les conditions ci-dessous pour finaliser la création de votre compte SolvaPact.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto">
                    <div>
                      <p className="font-bold text-slate-900">
                        1. Partage de vos coordonnées personnelles lors de la publication
                      </p>
                      <p className="mt-1">
                        En créant votre compte et en publiant un dossier sur SolvaPact, vous acceptez expressément que vos coordonnées personnelles renseignées (<strong>Prénom, Nom, Adresse e-mail / Gmail, Numéro de téléphone, Profession et Ville</strong>) soient visibles sur la fiche de contact accessible via le bouton <strong>« Négocier »</strong> de vos dossiers publiés, afin que les investisseurs ou partenaires intéressés puissent vous contacter directement.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        2. Négociation et virements en dehors du site
                      </p>
                      <p className="mt-1">
                        SolvaPact agit exclusivement comme plateforme de mise en relation. Les échanges de négociation (par Gmail, e-mail ou téléphone) ainsi que tous les virements bancaires, paiements, rachats de dette et remboursements se font directement entre les utilisateurs en dehors du site, sous leur propre responsabilité.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        3. Tarifs & Compte Fidélité
                      </p>
                      <p className="mt-1">
                        La création de compte et la préparation des dossiers sont gratuites. Seule la publication d'un dossier est facturée <strong>29,99 €</strong> (hors réduction fidélité Bronze -10 %, Silver -17 %, Gold -23 %), sans aucune commission sur les sommes négociées.
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-emerald-50/50 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        setErrorMsg('');
                      }}
                      className="mt-0.5 rounded border-slate-300 text-slate-900"
                    />
                    <span className="leading-relaxed">
                      <strong>J'ai lu et j'accepte les Conditions d'Utilisation de SolvaPact</strong>, y compris l'affichage de mon adresse e-mail, numéro de téléphone, prénom et nom aux membres cliquant sur « Négocier » sur mes dossiers publiés.
                    </span>
                  </label>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationStep('form');
                        setErrorMsg('');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!acceptedTerms) {
                          setErrorMsg(
                            "Veuillez cocher la case d'acceptation des Conditions d'Utilisation pour continuer."
                          );
                          return;
                        }
                        finalizeRegistration();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Accepter et créer mon compte</span>
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                    {errorMsg}
                  </div>
                )}

                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Thomas"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nom *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Martin"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Téléphone *
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            placeholder="06 12 34 56 78"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ville *
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Paris, Lyon, Bordeaux..."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Votre profession / profil *
                      </label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={profession}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfession(val);
                            if (val.includes('Investisseur')) {
                              setRole('investisseur');
                            } else {
                              setRole('demandeur');
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                        >
                          {PROFESSIONS.map((prof) => (
                            <option key={prof} value={prof}>
                              {prof}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {profession === 'Autre' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Précisez votre profession ou situation *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Consultant, Commerçant, Retraité..."
                          value={customProfession}
                          onChange={(e) => setCustomProfession(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Vous venez principalement sur SolvaPact pour :
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setRole('demandeur')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            role === 'demandeur'
                              ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          Déposer un dossier (Dette / Projet)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('investisseur')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            role === 'investisseur'
                              ? 'border-emerald-700 bg-emerald-700 text-white font-semibold'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          Investir & Financer des dossiers
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="nom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer mt-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {mode === 'register'
                      ? 'Créer mon compte et découvrir SolvaPact'
                      : 'Me connecter à mon espace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-slate-500 pt-1">
                  Compte 100 % gratuit · Les conditions d'utilisation s'affichent à l'étape suivante avant activation.
                </p>
              </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-5 text-xs text-slate-500 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© {new Date().getFullYear()} SolvaPact · Actes sous seing privé conformes aux articles 1892 & 2044 du Code Civil.</p>
          <p>Contact : solvapact.vercel.app@gmail.com</p>
        </div>
      </footer>
    </div>
  );
};
