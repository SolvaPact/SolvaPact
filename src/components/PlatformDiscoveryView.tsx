import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  formatEuro,
  getLoyaltyNameColorClass,
  getLoyaltyStatus,
} from '../utils/finance';
import {
  ArrowDown,
  ArrowRight,
  Award,
  Banknote,
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  FolderOpen,
  Handshake,
  HelpCircle,
  Lock,
  PiggyBank,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';

interface PlatformDiscoveryViewProps {
  currentUser: User | null;
  onExploreMarketplace: () => void;
  onOpenDeposit?: () => void;
  onOpenLoyalty?: () => void;
  onOpenHelp?: () => void;
  isOnboarding?: boolean;
}

export const PlatformDiscoveryView: React.FC<PlatformDiscoveryViewProps> = ({
  currentUser,
  onExploreMarketplace,
  onOpenDeposit,
  onOpenLoyalty,
  onOpenHelp,
  isOnboarding = false,
}) => {
  const loyalty = getLoyaltyStatus(currentUser);
  const nameColorLight = getLoyaltyNameColorClass(loyalty.tier, false);
  const nameColorDark = getLoyaltyNameColorClass(loyalty.tier, true);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!isOnboarding);
  const [scrollProgress, setScrollProgress] = useState(0);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOnboarding) {
      setHasScrolledToBottom(true);
      return;
    }

    setHasScrolledToBottom(false);
    window.scrollTo({ top: 0, behavior: 'auto' });

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 20) {
        setScrollProgress(100);
        setHasScrolledToBottom(true);
        return;
      }
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      setScrollProgress(pct);
      if (scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 140) {
        setHasScrolledToBottom(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasScrolledToBottom(true);
        }
      },
      { threshold: 0.15 }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [isOnboarding]);

  return (
    <div className={isOnboarding ? 'min-h-screen bg-slate-50 flex flex-col' : ''}>
      {/* Standalone Top Header when displayed as full-page onboarding */}
      {isOnboarding && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src={solvapactLogo}
                alt="SolvaPact"
                className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-white"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">SolvaPact</span>
                <span className="hidden sm:inline text-xs text-slate-400 ml-2">
                  · Guide complet de bienvenue
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {currentUser && (
                <span className={nameColorLight}>{currentUser.name}</span>
              )}
              {!hasScrolledToBottom ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce text-emerald-600" />
                  <span>Lisez jusqu'en bas pour entrer</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onExploreMarketplace}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Entrer sur le site</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1 bg-slate-100">
            <div
              className="h-full bg-emerald-600 transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </header>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10 flex-1 w-full">
        {/* Welcome Hero Card */}
        <section className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-lg space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>
              {isOnboarding
                ? 'Compte activé · Guide de découverte SolvaPact'
                : 'Guide complet de découverte SolvaPact'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            {currentUser?.firstName ? (
              <>
                Bienvenue <span className={nameColorDark}>{currentUser.firstName}</span>, voici tout ce qu'il faut savoir avant d'utiliser SolvaPact.
              </>
            ) : (
              'Découvrez comment fonctionne SolvaPact en toute transparence.'
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            SolvaPact est une plateforme de mise en relation directe entre personnes ayant un projet à financer ou une dette à régler et des investisseurs privés.{' '}
            <strong className="text-white">
              Aucune banque intermédiaire, aucun abonnement mensuel et 0 % de commission
            </strong>{' '}
            sur les sommes négociées entre les parties.
          </p>

          {!isOnboarding && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExploreMarketplace}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Accéder aux dossiers en ligne</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onOpenDeposit && (
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-colors cursor-pointer"
                >
                  Préparer un dossier gratuitement
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section 1: 3 Dossier Categories */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. À quoi sert la plateforme ?
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Trois espaces dédiés selon votre situation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
              <Banknote className="w-6 h-6 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Dettes à régler</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Déposez vos créances ou crédits pour obtenir un rachat comptant avec décote amiable ou un rééchelonnement direct en une seule mensualité.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
              <PiggyBank className="w-6 h-6 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">Investissements & Projets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Entrepreneurs, artisans ou particuliers présentent leur besoin de financement et négocient directement le taux d'intérêt et les garanties avec des investisseurs.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
              <FolderOpen className="w-6 h-6 text-indigo-700" />
              <h3 className="text-base font-bold text-slate-900">Autres sujets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prêts solidaires, restructurations amiables spécifiques, accords transactionnels ou besoins urgents hors circuit bancaire classique.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: 4-Step Workflow & Pricing */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Comment fonctionne le dépôt et la négociation ?
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Préparation 100 % gratuite, paiement unique à la publication
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-400 uppercase">Étape 01 · Gratuit</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Montez votre dossier et simulez sans frais
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Utilisez le simulateur financier, calculez votre taux d'effort et remplissez toutes les informations de votre dossier gratuitement avant de décider de publier.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-amber-600 uppercase">Étape 02 · Publication</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Réglez {formatEuro(BASE_PUBLICATION_PRICE)} uniquement pour publier
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Le paiement de {formatEuro(BASE_PUBLICATION_PRICE)} n'intervient qu'à la validation finale pour mettre votre dossier en ligne face aux investisseurs.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-700 uppercase">Étape 03 · Mise en relation directe</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Contact direct par Gmail / tél, virements en dehors du site
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Cliquez sur le bouton « Négocier » d'un dossier pour afficher les coordonnées du créateur (e-mail, Gmail, téléphone, prénom et nom) et échanger directement avec lui. Les virements se font ensuite entre vous en dehors du site.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-indigo-700 uppercase">Étape 04 · Assistance</span>
                <h3 className="text-sm font-bold text-slate-900">
                  IA SolvaSolution disponible 24h/24 + relais humain
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Posez vos questions en direct à l'assistant IA SolvaSolution dans la section Aide ou transmettez votre demande directement à notre équipe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Compte Fidélité */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                <Sparkles className="w-4 h-4" />
                <span>3. Le Compte Fidélité ({formatEuro(LOYALTY_ACTIVATION_PRICE)} en une seule fois)</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Cumulez +{EXP_PER_DOSSIER} EXP par dossier et obtenez jusqu'à -23 % à vie
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Votre statut évolue automatiquement au fil de vos publications et colore discrètement le nom de votre compte selon votre palier atteint.
              </p>
            </div>

            {!isOnboarding && onOpenLoyalty && (
              <button
                type="button"
                onClick={onOpenLoyalty}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Ouvrir mon Compte Fidélité</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-800 uppercase">Palier Bronze · 50 EXP</span>
                <span className="font-mono font-bold text-amber-900">-10 %</span>
              </div>
              <p className="text-sm font-bold text-amber-800">Nom de compte Bronze</p>
              <p className="text-slate-600 leading-relaxed">
                Dès 50 EXP, la publication de dossier passe à{' '}
                <strong>{formatEuro(26.99)}</strong> au lieu de {formatEuro(BASE_PUBLICATION_PRICE)}.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100/90 border border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-600 uppercase">Palier Silver · 150 EXP</span>
                <span className="font-mono font-bold text-slate-800">-17 %</span>
              </div>
              <p className="text-sm font-bold text-slate-500">Nom de compte Silver</p>
              <p className="text-slate-600 leading-relaxed">
                À 150 EXP cumulés, bénéficiez de -17 % sur chaque publication ({formatEuro(24.89)}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-600 uppercase">Palier Gold · 300 EXP</span>
                <span className="font-mono font-bold text-amber-700">-23 %</span>
              </div>
              <p className="text-sm font-bold text-amber-500">Nom de compte Gold</p>
              <p className="text-slate-600 leading-relaxed">
                À 300 EXP, obtenez -23 % permanents sur toutes vos publications ({formatEuro(23.09)}).
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Legal & Help */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Mise en contact directe & Cadre Juridique (Code Civil)
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Conformément aux Conditions d'Utilisation, les coordonnées du créateur d'un dossier publié (e-mail, téléphone, prénom et nom) sont accessibles via le bouton « Négocier » pour conclure vos accords sous seing privé (articles 1892 et 2044 du Code Civil).
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-emerald-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100 % net entre les parties
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Données protégées
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Aide instantanée par IA & Contact Humain
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Notre assistant IA <strong>SolvaSolution</strong> répond immédiatement dans l'onglet Aide, avec transfert possible vers le responsable si votre situation l'exige.
              </p>
              {!isOnboarding && onOpenHelp && (
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 pt-1 cursor-pointer"
                >
                  <span>Ouvrir SolvaSolution & le Centre d'Aide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Sentinel & Scroll-Revealed Enter Site Button */}
        <div ref={bottomSentinelRef} className="pt-4">
          {hasScrolledToBottom ? (
            <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Vous avez lu le guide complet
                </p>
                <h3 className="text-xl font-extrabold">
                  Prêt à explorer les dossiers ou déposer votre demande ?
                </h3>
                <p className="text-xs text-slate-300">
                  Accédez maintenant à l'ensemble de la plateforme SolvaPact.
                </p>
              </div>

              <button
                type="button"
                onClick={onExploreMarketplace}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
              >
                <span>Accéder au site SolvaPact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500">
              Poursuivez votre lecture jusqu'en bas de la page pour faire apparaître le bouton d'accès au site.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
