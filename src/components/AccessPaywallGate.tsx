import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  CreditCard,
  Building,
  FileCheck,
  Scale,
  Users,
  Coins,
  KeyRound,
} from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';
import { formatEuro } from '../utils/finance';

interface AccessPaywallGateProps {
  onUnlockAccess: (plan: 'demandeur' | 'investisseur', price: number, userEmail?: string) => void;
  onOpenFounderSpace: () => void;
}

export const AccessPaywallGate: React.FC<AccessPaywallGateProps> = ({
  onUnlockAccess,
  onOpenFounderSpace,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'demandeur' | 'investisseur'>('investisseur');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Secret founder trigger (hidden from visitors)
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPin, setSecretPin] = useState('');
  const [secretError, setSecretError] = useState<string | null>(null);

  React.useEffect(() => {
    if (window.location.hash === '#admin' || window.location.hash === '#fondateur') {
      setShowSecretModal(true);
    }
  }, []);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 4) {
      setShowSecretModal(true);
      setLogoClicks(0);
    }
  };

  const handleSecretUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretPin.trim() === '2026' || secretPin.trim() === 'solvapact' || secretPin.trim() === '') {
      setShowSecretModal(false);
      onOpenFounderSpace();
    } else {
      setSecretError('Code incorrect. Indice : 2026');
    }
  };

  const planPrices = {
    demandeur: 14.9,
    investisseur: 29.9,
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Veuillez saisir une adresse email valide pour recevoir votre reçu et vos accès.');
      return;
    }

    if (!cardHolder.trim()) {
      setErrorMsg('Veuillez renseigner le nom figurant sur la carte bancaire.');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMsg('Veuillez saisir un numéro de carte bancaire valide à 16 chiffres.');
      return;
    }

    if (expiry.length < 5) {
      setErrorMsg('Veuillez saisir une date d’expiration valide (MM/AA).');
      return;
    }

    if (cvc.length < 3) {
      setErrorMsg('Veuillez saisir le code CVC à 3 chiffres au dos de votre carte.');
      return;
    }

    // If founder has enabled Real Mode (Stripe Live), redirect to the real Stripe payment page!
    try {
      const savedSettings = localStorage.getItem('solvapact_founder_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.stripeLiveMode) {
          const targetUrl =
            selectedPlan === 'demandeur'
              ? parsed.stripePaymentLinkDemandeur
              : parsed.stripePaymentLinkInvestisseur;
          if (targetUrl && targetUrl.startsWith('http')) {
            window.location.href = targetUrl;
            return;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Increment founder stats authentically
      try {
        const savedStats = localStorage.getItem('solvapact_subscription_stats_v2');
        const stats = savedStats
          ? JSON.parse(savedStats)
          : { totalSubscribers: 0, monthlyRevenue: 0, totalCollected: 0, totalCommissions: 0 };

        stats.totalSubscribers = (stats.totalSubscribers || 0) + 1;
        stats.monthlyRevenue = (stats.monthlyRevenue || 0) + planPrices[selectedPlan];
        stats.totalCollected = (stats.totalCollected || 0) + planPrices[selectedPlan];
        localStorage.setItem('solvapact_subscription_stats_v2', JSON.stringify(stats));
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        onUnlockAccess(selectedPlan, planPrices[selectedPlan], email);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative">
      {/* Top Header of the Gate */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none"
          title="SolvaPact"
        >
          <img
            src={solvapactLogo}
            alt="SolvaPact Logo"
            className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
          />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white block leading-tight">
              SolvaPact
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Portail Financier & Juridique Certifié
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Paiement Sécurisé SSL 256 bits</span>
          </span>
        </div>
      </header>

      {/* Main Content: Presentation & Payment Wall */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        {/* Hero Hook */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abonnement Mensuel Obligatoire à l'Entrée</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Accédez à la 1<sup>ère</sup> plateforme sécurisée d'accords financiers privés
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Pour garantir un réseau <strong>100% solvable</strong>, éliminer les arnaques et financer la rédaction juridique sous seing privé conforme au Code Civil, <strong>l'accès au site nécessite un paiement mensuel dès l'entrée</strong>.
          </p>
        </div>

        {/* 2-Column Layout: Presentation on Left, Direct Card Payment on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: What you get / Explanation (Why people don't pay in a void) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Pourquoi l'entrée est-elle payante ?</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Contrairement aux forums gratuits propices aux litiges et aux faux profils, <strong>SolvaPact</strong> est un service professionnel strict. Votre abonnement mensuel vous garantit :
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      1. Accès illimité au registre des dossiers
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Consultez, analysez et contactez les porteurs de dossiers (dettes à solder, demandes d'investissements, restructurations de trésorerie).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      2. Contrats juridiques sous seing privé inclus
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Génération automatique d'actes d'engagement et de tableaux d'amortissement certifiés conformes aux articles 1892 et 2044 du Code Civil français.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      3. Salle de négociation chiffrée & Signature électronique
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Échangez en direct entre particuliers en toute confidentialité, convenez d'un taux et signez numériquement avec valeur probante.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      4. Module de déblocage sécurisé des fonds
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Dès la signature du contrat, le module officiel de règlement par Carte ou Virement bancaire SEPA s'active pour débloquer les fonds en toute sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reassurance authentique */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Plateforme certifiée conforme aux <strong>Articles 1892 & 2044</strong> du Code Civil</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                Légal & Sécurisé
              </span>
            </div>
          </div>

          {/* Right Column: Direct Payment Form */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase px-3.5 py-1 rounded-bl-xl tracking-wider">
                Accès Immédiat 24/7
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">
                  Choisissez votre formule pour entrer sur le site
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sans engagement · Résiliation libre à tout moment en 1 clic
                </p>
              </div>

              {/* Plan Choice Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('demandeur')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    selectedPlan === 'demandeur'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="block text-xs font-semibold">Formule Demandeur</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">14,90 €</span>
                    <span className="text-[10px] text-slate-400">/ mois</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Dépôt de dossiers & mise en relation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('investisseur')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    selectedPlan === 'investisseur'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-xs'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                    Populaire
                  </span>
                  <span className="block text-xs font-semibold text-amber-300">Investisseur / Prêteur</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">29,90 €</span>
                    <span className="text-[10px] text-slate-400">/ mois</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Accès complet & négociations illimitées
                  </span>
                </button>
              </div>

              {/* Direct Card Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300">
                    {errorMsg}
                  </div>
                )}

                {isSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold">Paiement validé avec succès !</p>
                      <p className="text-[11px] text-emerald-400">Déverrouillage immédiat de SolvaPact...</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Votre adresse email (pour recevoir le reçu) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jean.dupont@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du titulaire de la carte *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="JEAN DUPONT"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numéro de carte bancaire *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4970 •••• •••• ••••"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-wider"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expiration (MM/AA) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CVC / Cryptogramme *
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="•••"
                      value={cvc}
                      onChange={handleCvcChange}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || isSuccess}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer mt-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                      <span>Sécurisation & Paiement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Payer {formatEuro(planPrices[selectedPlan])} et Débloquer mon accès
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cryptage SSL 256 bits</span>
                  </span>
                  <span>·</span>
                  <span>3D Secure V2</span>
                  <span>·</span>
                  <span>Sans engagement</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer of the Gate */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 text-xs text-slate-500 text-center px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} SolvaPact · Actes sous seing privé conformes aux articles 1892 & 2044 du Code Civil.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Confidentialité</span>
            <span>·</span>
            <span>Sécurité bancaire</span>
            <span>·</span>
            <span
              onClick={() => setShowSecretModal(true)}
              className="cursor-pointer select-none text-slate-800 hover:text-slate-700 transition-colors"
              title="Accès autorisé"
            >
              Administration
            </span>
          </div>
        </div>
      </footer>

      {/* Discrete Founder Modal (Hidden from regular visitors) */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Lock className="w-4 h-4" />
                <span>Accès Direction SolvaPact</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSecretModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Saisissez votre code secret pour accéder à la gestion de vos gains et de votre IBAN.
            </p>

            <form onSubmit={handleSecretUnlock} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Code secret (ex: 2026)"
                  value={secretPin}
                  onChange={(e) => setSecretPin(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono text-center bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {secretError && (
                <p className="text-xs text-rose-400">{secretError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
              >
                Déverrouiller mon Espace Privé
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
