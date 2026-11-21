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
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  FolderOpen,
  Handshake,
  HelpCircle,
  Lock,
  MapPin,
  PiggyBank,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';
import { MadagascarBackdropEffect } from './MadagascarBackdropEffect';
import { LoyaltyVerifiedBadge } from './LoyaltyVerifiedBadge';

const SolvaPactMadagascarBrand: React.FC<{ sizeClass?: string }> = ({
  sizeClass = 'text-lg sm:text-xl',
}) => (
  <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight leading-none ${sizeClass}`}>
    <span
      aria-hidden="true"
      className="inline-flex h-3.5 w-5 overflow-hidden rounded-[3px] border border-white/30 shadow-2xs shrink-0"
    >
      <span className="w-1.5 bg-white" />
      <span className="flex-1 flex flex-col">
        <span className="h-1/2 bg-[#FC3D32]" />
        <span className="h-1/2 bg-[#007E3A]" />
      </span>
    </span>
    <span>
      <span className="text-white">Sol</span>
      <span className="text-[#FC3D32]">va</span>
      <span className="text-[#00A651]">Pact</span>
    </span>
  </span>
);

interface PlatformDiscoveryViewProps {
  currentUser: User | null;
  onExploreMarketplace: () => void;
  onOpenDeposit?: () => void;
  onOpenContactInvestors?: () => void;
  onOpenLoyalty?: () => void;
  onOpenHelp?: () => void;
  isOnboarding?: boolean;
}

export const PlatformDiscoveryView: React.FC<PlatformDiscoveryViewProps> = ({
  currentUser,
  onExploreMarketplace,
  onOpenDeposit,
  onOpenContactInvestors,
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
      className={`relative overflow-hidden bg-gradient-to-br from-[#0b1711] via-[#131c17] to-[#24120b] text-white ${
        isOnboarding ? 'min-h-screen flex flex-col' : ''
      }`}
    >
      {/* Animated Madagascar tricolor aurora & silk wave backdrop (Blanc, Rouge, Vert) */}
      <MadagascarBackdropEffect />

      {/* Standalone Top Header when displayed as full-page onboarding */}
      {isOnboarding && (
        <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-orange-400/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src={solvapactLogo}
                alt="SolvaPact Madagascar"
                className="w-8 h-8 rounded-lg object-contain border border-orange-300/30 bg-white"
              />
              <div className="flex items-center flex-wrap gap-x-2">
                <SolvaPactMadagascarBrand sizeClass="text-lg" />
                <span className="hidden sm:inline text-xs text-orange-200/85 font-medium">
                  · Guide complet de confiance Madagascar
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {currentUser && (
                <div className="flex flex-col text-right leading-tight">
                  {loyalty.active && loyalty.badgeTitle && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                      {loyalty.badgeTitle}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-end gap-1">
                    <span className={nameColorDark}>{currentUser.name}</span>
                    {loyalty.active && <LoyaltyVerifiedBadge tier={loyalty.tier} size="xs" />}
                  </span>
                </div>
              )}
              {!hasScrolledToBottom ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-orange-100 bg-orange-950/70 border border-orange-400/30 px-3 py-1.5 rounded-lg">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce text-orange-400" />
                  <span>Lisez jusqu'en bas pour entrer</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onExploreMarketplace}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Entrer sur le site</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </header>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10 flex-1 w-full">
        {/* Welcome Hero Card */}
        <section className="bg-slate-950/65 backdrop-blur-md text-white rounded-3xl p-8 sm:p-10 border border-orange-400/25 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>
                {isOnboarding
                  ? 'Compte activé · Guide de confiance SolvaPact Madagascar'
                  : 'Guide complet de confiance · 100 % dédié à Madagascar'}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15">
              <SolvaPactMadagascarBrand sizeClass="text-sm sm:text-base" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300">
                Madagascar
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            {currentUser?.firstName ? (
              <>
                Bienvenue{' '}
                <span className={`inline-flex items-center gap-1.5 ${nameColorDark}`}>
                  <span>{currentUser.firstName}</span>
                  {loyalty.active && <LoyaltyVerifiedBadge tier={loyalty.tier} size="md" />}
                </span>{' '}
                sur{' '}
                <span>
                  <span className="text-white">Sol</span>
                  <span className="text-[#FC3D32]">va</span>
                  <span className="text-[#00A651]">Pact</span>
                </span>{' '}
                Madagascar : avancez en toute confiance.
              </>
            ) : (
              <>
                Découvrez comment{' '}
                <span>
                  <span className="text-white">Sol</span>
                  <span className="text-[#FC3D32]">va</span>
                  <span className="text-[#00A651]">Pact</span>
                </span>{' '}
                connecte Madagascar et sa diaspora en toute confiance.
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-3xl">
            <strong className="text-white">SolvaPact est conçu spécialement pour Madagascar</strong> (Antananarivo, Toamasina, Mahajanga, Fianarantsoa, Nosy Be et toute la diaspora malgache). Notre mission est de mettre en relation directe des porteurs de projets sérieux à Madagascar et des investisseurs privés ou partenaires fiables.{' '}
            <strong className="text-white">
              Aucune banque intermédiaire, aucun abonnement mensuel et un accord direct 100 % net
            </strong>{' '}
            avec vérifications d&apos;identité et de sérieux entre les parties.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-400/25 flex items-start gap-2.5 text-xs">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Ancrage 100 % Madagascar</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Projets locaux et diaspora malgache réunis sur un réseau dédié avec repères en Euro et Ariary (~Ar).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-orange-400/25 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Sérieux &amp; pièces vérifiées</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  NIF, STAT, RCS/SIREN, coordonnées complètes et consentement signé des investisseurs pour rassurer chaque membre.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-amber-400/25 flex items-start gap-2.5 text-xs">
              <Users className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Canaux malgaches &amp; diaspora</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Règlements directs hors site convenus entre vous : MVola, Orange Money, Airtel Money, BNI, BOA ou virement SEPA.
                </p>
              </div>
            </div>
          </div>

          {!isOnboarding && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExploreMarketplace}
                className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Accéder aux dossiers en ligne</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onOpenDeposit && (
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-orange-300/25 transition-colors cursor-pointer"
                >
                  Préparer un dossier gratuitement
                </button>
              )}
              {onOpenContactInvestors && (
                <button
                  type="button"
                  onClick={onOpenContactInvestors}
                  className="px-5 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm border border-emerald-400/30 transition-colors cursor-pointer"
                >
                  Prendre contact (Investisseurs)
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section 1: 2 Dossier Categories */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              1. À quoi sert la plateforme ?
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Deux espaces dédiés selon votre situation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-400/25 p-6 space-y-2.5">
              <PiggyBank className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Investissements &amp; Projets Madagascar</h3>
              <p className="text-xs text-slate-200/85 leading-relaxed">
                Entrepreneurs, commerçants, agriculteurs ou porteurs de projets à Madagascar présentent leur besoin (avec justificatifs NIF/STAT ou SIREN) et négocient directement les parts sociales, le partage des revenus ou les modalités avec des investisseurs locaux ou de la diaspora.
              </p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-orange-400/25 p-6 space-y-2.5">
              <FolderOpen className="w-6 h-6 text-orange-400" />
              <h3 className="text-base font-bold text-white">Autres sujets &amp; Besoins à Madagascar</h3>
              <p className="text-xs text-slate-200/85 leading-relaxed">
                Prêts solidaires, besoins ponctuels de trésorerie, accords privés ou projets personnels à Madagascar et dans la diaspora, gérés en relation directe et transparente.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: 4-Step Workflow & Pricing */}
        <section className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              2. Comment fonctionne le dépôt et la négociation ?
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Préparation 100 % gratuite, paiement unique à la publication
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-orange-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/35 text-orange-300 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-orange-300 uppercase">Étape 01 · Gratuit</span>
                <h3 className="text-sm font-bold text-white">
                  Montez votre dossier et simulez sans frais
                </h3>
                <p className="text-slate-200/85 leading-relaxed">
                  Utilisez le simulateur financier, calculez votre taux d'effort et remplissez toutes les informations de votre dossier gratuitement avant de décider de publier.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-orange-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-amber-300 uppercase">Étape 02 · Publication</span>
                <h3 className="text-sm font-bold text-white">
                  Réglez {formatEuro(BASE_PUBLICATION_PRICE)} uniquement pour publier
                </h3>
                <p className="text-slate-200/85 leading-relaxed">
                  Le paiement de {formatEuro(BASE_PUBLICATION_PRICE)} n'intervient qu'à la validation finale pour mettre votre dossier en ligne face aux investisseurs.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-300 uppercase">Étape 03 · Mise en relation directe</span>
                <h3 className="text-sm font-bold text-white">
                  Annuaire « Prendre contact », Gmail / tél &amp; virements hors site
                </h3>
                <p className="text-slate-200/85 leading-relaxed">
                  Consultez la liste des investisseurs volontaires (ayant signé la lettre de consentement) dans l&apos;onglet « Prendre contact » pour leur envoyer votre dossier directement, ou cliquez sur « Négocier » sur n&apos;importe quel dossier publié. Les transferts se font ensuite entre vous hors site.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-300/20 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-300 uppercase">Étape 04 · Assistance</span>
                <h3 className="text-sm font-bold text-white">
                  IA SolvaSolution disponible 24h/24 + relais humain
                </h3>
                <p className="text-slate-200/85 leading-relaxed">
                  Posez vos questions en direct à l'assistant IA SolvaSolution dans la section Aide ou transmettez votre demande directement à notre équipe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Compte Fidélité */}
        <section className="bg-slate-950/65 backdrop-blur-md rounded-3xl border border-orange-300/25 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-300/15 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>3. Le Compte Fidélité ({formatEuro(LOYALTY_ACTIVATION_PRICE)} en une seule fois)</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Cumulez +{EXP_PER_DOSSIER} EXP par dossier et obtenez jusqu&apos;à -35 % permanents (et jusqu&apos;à -50 % en période de réduction)
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/85 max-w-2xl">
                Votre statut évolue automatiquement au fil de vos publications et affiche un badge de vérification officiel à côté de votre nom selon votre palier atteint.
              </p>
            </div>

            {!isOnboarding && onOpenLoyalty && (
              <button
                type="button"
                onClick={onOpenLoyalty}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Ouvrir mon Compte Fidélité</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-orange-950/45 border border-orange-400/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-orange-300 uppercase">Palier Bronze · Base (0 EXP)</span>
                <span className="font-mono font-bold text-orange-200">-10 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block leading-none">
                  Membre Vérifié
                </span>
                <p className="text-sm font-bold text-white mt-0.5 inline-flex items-center gap-1.5">
                  <span>Badge vérifié Bronze</span>
                  <LoyaltyVerifiedBadge tier="bronze" size="xs" />
                </p>
              </div>
              <p className="text-slate-200/85 leading-relaxed">
                Dès l&apos;activation (0 EXP), la publication de dossier passe à{' '}
                <strong className="text-white">{formatEuro(26.99)}</strong> au lieu de {formatEuro(BASE_PUBLICATION_PRICE)}.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/55 border border-slate-300/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-200 uppercase">Palier Silver · 30 EXP</span>
                <span className="font-mono font-bold text-slate-100">-17 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block leading-none">
                  Membre Fidèle · 3 dossiers
                </span>
                <p className="text-sm font-bold text-white mt-0.5 inline-flex items-center gap-1.5">
                  <span>Badge vérifié Silver</span>
                  <LoyaltyVerifiedBadge tier="silver" size="xs" />
                </p>
              </div>
              <p className="text-slate-200/85 leading-relaxed">
                À 30 EXP (3 dossiers publiés), bénéficiez de -17 % sur chaque publication ({formatEuro(24.89)}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/45 border border-amber-400/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 uppercase">Palier Gold · 60 EXP</span>
                <span className="font-mono font-bold text-amber-200">-23 %</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block leading-none">
                  Membre Précieux · 6 dossiers
                </span>
                <p className="text-sm font-bold text-white mt-0.5 inline-flex items-center gap-1.5">
                  <span>Badge vérifié Gold</span>
                  <LoyaltyVerifiedBadge tier="gold" size="xs" />
                </p>
              </div>
              <p className="text-slate-200/85 leading-relaxed">
                À 60 EXP (6 dossiers publiés), obtenez -23 % permanents sur toutes vos publications ({formatEuro(23.09)}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-950/55 border border-cyan-400/45 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-cyan-300 uppercase">Palier Diamond · 120 EXP</span>
                <span className="font-mono font-extrabold text-cyan-200">-35 %</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 block leading-none">
                  Membre Prestigieux Officiel · 12 dossiers
                </span>
                <p className="text-sm font-extrabold text-white mt-0.5 inline-flex items-center gap-1.5">
                  <span>Coche bleue officielle</span>
                  <LoyaltyVerifiedBadge tier="diamond" size="xs" />
                </p>
              </div>
              <p className="text-cyan-50/90 leading-relaxed">
                À 120 EXP (12 dossiers) : <strong className="text-white">-35 %</strong> ({formatEuro(19.49)}), <strong className="text-white">réduction encore plus grande jusqu&apos;à -50 % ({formatEuro(14.99)}) pendant les périodes de réduction</strong>, mise en avant &amp; support prioritaires.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Legal & Help */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-300/20 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-white">
                Mise en contact directe &amp; Cadre Juridique (Code Civil)
              </h3>
              <p className="text-slate-200/85 leading-relaxed">
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

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-orange-300/20 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/35 text-orange-300 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-white">
                Aide instantanée par IA &amp; Contact Humain
              </h3>
              <p className="text-slate-200/85 leading-relaxed">
                Notre assistant IA <strong className="text-white">SolvaSolution</strong> répond immédiatement dans l'onglet Aide, avec transfert possible vers le responsable si votre situation l'exige.
              </p>
              {!isOnboarding && onOpenHelp && (
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 hover:text-orange-200 pt-1 cursor-pointer"
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
            <div className="bg-slate-950/75 backdrop-blur-md text-white rounded-3xl p-8 border border-orange-400/35 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Vous avez lu le guide complet
                </p>
                <h3 className="text-xl font-extrabold text-white">
                  Prêt à explorer les dossiers ou déposer votre demande ?
                </h3>
                <p className="text-xs text-slate-200/85">
                  Accédez maintenant à la plateforme{' '}
                  <strong className="font-extrabold">
                    <span className="text-white">Sol</span>
                    <span className="text-[#FC3D32]">va</span>
                    <span className="text-[#00A651]">Pact</span>
                  </strong>{' '}
                  dédiée à Madagascar et à sa diaspora, en toute confiance.
                </p>
              </div>

              <button
                type="button"
                onClick={onExploreMarketplace}
                className="px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
              >
                <span>Accéder à SolvaPact Madagascar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-orange-300/35 bg-slate-950/45 text-center text-xs text-slate-200/85">
              Poursuivez votre lecture jusqu'en bas de la page pour faire apparaître le bouton d'accès au site.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
