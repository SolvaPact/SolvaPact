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
import { CosmicStarfieldCanvas } from './CosmicStarfieldCanvas';

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
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#030b20] via-[#081d4a] to-[#04102b] text-white ${
        isOnboarding ? 'min-h-screen flex flex-col' : ''
      }`}
    >
      {/* Futuristic Cosmic Starfield & Shooting Stars in Loyalty Tier Color */}
      <CosmicStarfieldCanvas tier={loyalty.tier} />

      {/* Standalone Top Header when displayed as full-page onboarding */}
      {isOnboarding && (
        <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-blue-400/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src={solvapactLogo}
                alt="SolvaPact"
                className="w-8 h-8 rounded-lg object-contain border border-blue-300/30 bg-white"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-white">SolvaPact</span>
                <span className="hidden sm:inline text-xs text-blue-200/75 ml-2">
                  · Guide complet de bienvenue
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {currentUser && (
                <div className="flex flex-col text-right leading-tight">
                  {loyalty.active && loyalty.badgeTitle && (
                    <span className={`${nameColorDark} text-[9px] uppercase tracking-wider`}>
                      {loyalty.badgeTitle}
                    </span>
                  )}
                  <span className={nameColorDark}>{currentUser.name}</span>
                </div>
              )}
              {!hasScrolledToBottom ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-100 bg-blue-950/80 border border-blue-400/30 px-3 py-1.5 rounded-lg">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                  <span>Lisez jusqu'en bas pour entrer</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onExploreMarketplace}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Entrer sur le site</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1 bg-blue-950">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </header>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10 flex-1 w-full">
        {/* Welcome Hero Card */}
        <section className="bg-slate-950/60 backdrop-blur-md text-white rounded-3xl p-8 sm:p-10 border border-cyan-400/25 shadow-2xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Compass className="w-4 h-4" />
            <span>
              {isOnboarding
                ? 'Compte activé · Guide de découverte SolvaPact'
                : 'Guide complet de découverte SolvaPact'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            {currentUser?.firstName ? (
              <>
                Bienvenue <span className={nameColorDark}>{currentUser.firstName}</span>, voici tout ce qu'il faut savoir avant d'utiliser SolvaPact.
              </>
            ) : (
              'Découvrez comment fonctionne SolvaPact en toute transparence.'
            )}
          </h1>

          <p className="text-sm sm:text-base text-blue-100/85 leading-relaxed max-w-3xl">
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
                className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Accéder aux dossiers en ligne</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onOpenDeposit && (
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-blue-300/25 transition-colors cursor-pointer"
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
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              1. À quoi sert la plateforme ?
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Trois espaces dédiés selon votre situation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 space-y-2.5">
              <Banknote className="w-6 h-6 text-amber-300" />
              <h3 className="text-base font-bold text-white">Dettes à régler</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Déposez vos créances ou crédits pour obtenir un rachat comptant avec décote amiable ou un rééchelonnement direct en une seule mensualité.
              </p>
            </div>

            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 space-y-2.5">
              <PiggyBank className="w-6 h-6 text-emerald-300" />
              <h3 className="text-base font-bold text-white">Investissements &amp; Projets</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Entrepreneurs, artisans ou particuliers présentent leur besoin de financement et négocient directement le taux d'intérêt et les garanties avec des investisseurs.
              </p>
            </div>

            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 space-y-2.5">
              <FolderOpen className="w-6 h-6 text-cyan-300" />
              <h3 className="text-base font-bold text-white">Autres sujets</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Prêts solidaires, restructurations amiables spécifiques, accords transactionnels ou besoins urgents hors circuit bancaire classique.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: 4-Step Workflow & Pricing */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              2. Comment fonctionne le dépôt et la négociation ?
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Préparation 100 % gratuite, paiement unique à la publication
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-cyan-300 uppercase">Étape 01 · Gratuit</span>
                <h3 className="text-sm font-bold text-white">
                  Montez votre dossier et simulez sans frais
                </h3>
                <p className="text-blue-100/80 leading-relaxed">
                  Utilisez le simulateur financier, calculez votre taux d'effort et remplissez toutes les informations de votre dossier gratuitement avant de décider de publier.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-amber-300 uppercase">Étape 02 · Publication</span>
                <h3 className="text-sm font-bold text-white">
                  Réglez {formatEuro(BASE_PUBLICATION_PRICE)} uniquement pour publier
                </h3>
                <p className="text-blue-100/80 leading-relaxed">
                  Le paiement de {formatEuro(BASE_PUBLICATION_PRICE)} n'intervient qu'à la validation finale pour mettre votre dossier en ligne face aux investisseurs.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-300 uppercase">Étape 03 · Mise en relation directe</span>
                <h3 className="text-sm font-bold text-white">
                  Contact direct par Gmail / tél, virements en dehors du site
                </h3>
                <p className="text-blue-100/80 leading-relaxed">
                  Cliquez sur le bouton « Négocier » d'un dossier pour afficher les coordonnées du créateur (e-mail, Gmail, téléphone, prénom et nom) et échanger directement avec lui. Les virements se font ensuite entre vous en dehors du site.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-cyan-300 uppercase">Étape 04 · Assistance</span>
                <h3 className="text-sm font-bold text-white">
                  IA SolvaSolution disponible 24h/24 + relais humain
                </h3>
                <p className="text-blue-100/80 leading-relaxed">
                  Posez vos questions en direct à l'assistant IA SolvaSolution dans la section Aide ou transmettez votre demande directement à notre équipe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Compte Fidélité */}
        <section className="bg-slate-950/60 backdrop-blur-md rounded-3xl border border-blue-300/25 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-300/15 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>3. Le Compte Fidélité ({formatEuro(LOYALTY_ACTIVATION_PRICE)} en une seule fois)</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Cumulez +{EXP_PER_DOSSIER} EXP par dossier et obtenez jusqu'à -45 % et 1 dossier offert tous les 5
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-2xl">
                Votre statut évolue automatiquement au fil de vos publications et colore discrètement le nom de votre compte selon votre palier atteint.
              </p>
            </div>

            {!isOnboarding && onOpenLoyalty && (
              <button
                type="button"
                onClick={onOpenLoyalty}
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Ouvrir mon Compte Fidélité</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-orange-950/45 border border-orange-400/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-orange-300 uppercase">Palier Bronze · 50 EXP</span>
                <span className="font-mono font-bold text-orange-200">-10 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block leading-none">
                  Membre Vérifié
                </span>
                <p className="text-sm font-bold text-orange-300 mt-0.5">Nom de compte Bronze</p>
              </div>
              <p className="text-blue-100/80 leading-relaxed">
                Dès 50 EXP, la publication de dossier passe à{' '}
                <strong className="text-white">{formatEuro(26.99)}</strong> au lieu de {formatEuro(BASE_PUBLICATION_PRICE)}.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/55 border border-slate-300/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-200 uppercase">Palier Silver · 150 EXP</span>
                <span className="font-mono font-bold text-slate-100">-17 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block leading-none">
                  Membre Fidèle
                </span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">Nom de compte Silver</p>
              </div>
              <p className="text-blue-100/80 leading-relaxed">
                À 150 EXP cumulés, bénéficiez de -17 % sur chaque publication ({formatEuro(24.89)}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/45 border border-amber-400/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 uppercase">Palier Gold · 300 EXP</span>
                <span className="font-mono font-bold text-amber-200">-23 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block leading-none">
                  Membre Précieux
                </span>
                <p className="text-sm font-bold text-amber-300 mt-0.5">Nom de compte Gold</p>
              </div>
              <p className="text-blue-100/80 leading-relaxed">
                À 300 EXP, obtenez -23 % permanents sur toutes vos publications ({formatEuro(23.09)}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-950/55 border border-cyan-400/45 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-cyan-300 uppercase">Palier Diamond · 500 EXP</span>
                <span className="font-mono font-extrabold text-cyan-200">-45 %</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 block leading-none">
                  Membre Prestigieux Officiel
                </span>
                <p className="text-sm font-extrabold text-cyan-300 mt-0.5">Nom de compte Diamond</p>
              </div>
              <p className="text-cyan-50/90 leading-relaxed">
                À 500 EXP : <strong className="text-white">-45 %</strong> ({formatEuro(16.49)}), <strong className="text-white">1 dossier offert (0 €)</strong> tous les 5 dossiers, mise en avant &amp; support prioritaires.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Legal & Help */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-white">
                Mise en contact directe &amp; Cadre Juridique (Code Civil)
              </h3>
              <p className="text-blue-100/80 leading-relaxed">
                Conformément aux Conditions d'Utilisation, les coordonnées du créateur d'un dossier publié (e-mail, téléphone, prénom et nom) sont accessibles via le bouton « Négocier » pour conclure vos accords sous seing privé (articles 1892 et 2044 du Code Civil).
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-emerald-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100 % net entre les parties
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Données protégées
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/55 backdrop-blur-md rounded-2xl border border-blue-300/20 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/35 text-cyan-300 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-white">
                Aide instantanée par IA &amp; Contact Humain
              </h3>
              <p className="text-blue-100/80 leading-relaxed">
                Notre assistant IA <strong className="text-white">SolvaSolution</strong> répond immédiatement dans l'onglet Aide, avec transfert possible vers le responsable si votre situation l'exige.
              </p>
              {!isOnboarding && onOpenHelp && (
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 pt-1 cursor-pointer"
                >
                  <span>Ouvrir SolvaSolution &amp; le Centre d'Aide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Sentinel & Scroll-Revealed Enter Site Button */}
        <div ref={bottomSentinelRef} className="pt-4">
          {hasScrolledToBottom ? (
            <div className="bg-slate-950/70 backdrop-blur-md text-white rounded-3xl p-8 border border-cyan-400/35 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Vous avez lu le guide complet
                </p>
                <h3 className="text-xl font-extrabold text-white">
                  Prêt à explorer les dossiers ou déposer votre demande ?
                </h3>
                <p className="text-xs text-blue-100/80">
                  Accédez maintenant à l'ensemble de la plateforme SolvaPact.
                </p>
              </div>

              <button
                type="button"
                onClick={onExploreMarketplace}
                className="px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
              >
                <span>Accéder au site SolvaPact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-blue-300/35 bg-slate-950/45 text-center text-xs text-blue-100/80">
              Poursuivez votre lecture jusqu'en bas de la page pour faire apparaître le bouton d'accès au site.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
