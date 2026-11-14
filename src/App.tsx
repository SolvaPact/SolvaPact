import React, { useState, useEffect } from 'react';
import { Dossier, ActiveTab, User, DossierType } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { DossierCard } from './components/DossierCard';
import { DossierDetailModal } from './components/DossierDetailModal';
import { ContactCreatorModal } from './components/ContactCreatorModal';
import { DepositDossierModal } from './components/DepositDossierModal';
import { FinanceCalculator } from './components/FinanceCalculatorModal';
import { AuthModal } from './components/AuthModal';
import { AccountEntryGate } from './components/AccountEntryGate';
import { PlatformDiscoveryView } from './components/PlatformDiscoveryView';
import { LoyaltyModal } from './components/LoyaltyModal';
import { HelpView } from './components/HelpView';
import { MarketTrustSection } from './components/MarketTrustSection';
import { SatisfactionSurveyModal } from './components/SatisfactionSurveyModal';
import { DailyReportModal } from './components/DailyReportModal';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  applyOwnerGoldStatus,
  canViewDailyReport,
  formatEuro,
  getLoyaltyStatus,
  isOwnerGoldEmail,
} from './utils/finance';
import {
  Search,
  PlusCircle,
  FileCheck,
  Inbox,
  Banknote,
  PiggyBank,
  FolderOpen,
  Trash2,
  MessageSquareHeart,
  ExternalLink,
} from 'lucide-react';

function syncUserToAccountsStore(updatedUser: User) {
  try {
    const raw = localStorage.getItem('solvapact_accounts_v1');
    if (!raw) return;
    const accounts = JSON.parse(raw) as Record<string, User & { passwordHash?: string }>;
    const key = updatedUser.email.toLowerCase();
    if (accounts[key]) {
      accounts[key] = { ...accounts[key], ...updatedUser };
      localStorage.setItem('solvapact_accounts_v1', JSON.stringify(accounts));
    }
  } catch (err) {
    console.error('Error syncing account store', err);
  }
}

export default function App() {
  // Persistence in localStorage - CLEAN SLATE (no fake / test dossiers)
  const [dossiers, setDossiers] = useState<Dossier[]>(() => {
    localStorage.removeItem('solvapact_dossiers');
    const saved = localStorage.getItem('solvapact_dossiers_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading dossiers from localStorage', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.removeItem('solvapact_negotiations');
    localStorage.removeItem('solvapact_negotiations_v2');
    localStorage.removeItem('solvapact_subscription_stats');
    localStorage.removeItem('solvapact_subscription_stats_v2');
    localStorage.removeItem('solvapact_has_paid_access');
    sessionStorage.removeItem('solvapact_founder_unlocked');
  }, []);

  // User Authentication (Mandatory free account creation on entry)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('solvapact_user');
    if (saved) {
      try {
        let parsed = JSON.parse(saved) as User;
        if (
          isOwnerGoldEmail(parsed.email) &&
          !localStorage.getItem('solvapact_test_pause_diamond_v1')
        ) {
          parsed = {
            ...parsed,
            loyaltyActive: false,
            loyaltyExp: 0,
            diamondPublicationsCount: 0,
            loyaltyActivatedAt: undefined,
          };
          localStorage.setItem('solvapact_user', JSON.stringify(parsed));
          localStorage.setItem('solvapact_test_pause_diamond_v1', 'true');
          syncUserToAccountsStore(parsed);
        }
        return applyOwnerGoldStatus(parsed);
      } catch (e) {
        console.error('Error loading user from localStorage', e);
      }
    }
    return null;
  });

  const [showOnboardingGuide, setShowOnboardingGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem('solvapact_user');
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved) as User;
      return localStorage.getItem(`solvapact_guide_done_${parsed.id}`) !== 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<(() => void) | null>(null);

  useEffect(() => {
    localStorage.setItem('solvapact_dossiers_v2', JSON.stringify(dossiers));
  }, [dossiers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('solvapact_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('solvapact_user');
    }
  }, [currentUser]);

  // Tab & Modals State
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [selectedDossierForDetail, setSelectedDossierForDetail] = useState<Dossier | null>(null);
  const [contactDossier, setContactDossier] = useState<Dossier | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGuidedBySolva, setDepositGuidedBySolva] = useState(false);
  const [depositDefaultType, setDepositDefaultType] = useState<DossierType>('dette');
  const [depositPrefill, setDepositPrefill] = useState<{ amount?: number; term?: number }>({});
  const [confirmClearTests, setConfirmClearTests] = useState(false);
  const [surveyDossier, setSurveyDossier] = useState<Dossier | null>(null);
  const [surveyPaidAmount, setSurveyPaidAmount] = useState<number>(BASE_PUBLICATION_PRICE);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter] = useState<string>('all');
  const [amountRange, setAmountRange] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'amount_asc' | 'amount_desc'>('recent');

  // Filter dossiers according to current view / tab
  const getTabDossiers = () => {
    let list = dossiers;
    if (activeTab === 'dette') {
      list = dossiers.filter((d) => d.type === 'dette');
    } else if (activeTab === 'investissement') {
      list = dossiers.filter((d) => d.type === 'investissement');
    } else if (activeTab === 'autre') {
      list = dossiers.filter((d) => d.type === 'autre');
    }

    if (categoryFilter !== 'all') {
      list = list.filter((d) => d.category === categoryFilter);
    }

    if (amountRange === 'small') {
      list = list.filter((d) => d.amountRequested < 5000);
    } else if (amountRange === 'medium') {
      list = list.filter((d) => d.amountRequested >= 5000 && d.amountRequested <= 20000);
    } else if (amountRange === 'large') {
      list = list.filter((d) => d.amountRequested > 20000);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) => {
        return (
          d.title.toLowerCase().includes(q) ||
          d.applicant.city.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'amount_asc') return a.amountRequested - b.amountRequested;
      if (sortBy === 'amount_desc') return b.amountRequested - a.amountRequested;
      const aPriority = a.isDiamondPriority || a.applicant.loyaltyTier === 'diamond' ? 1 : 0;
      const bPriority = b.isDiamondPriority || b.applicant.loyaltyTier === 'diamond' ? 1 : 0;
      return bPriority - aPriority;
    });
  };

  const displayedDossiers = getTabDossiers();

  // User's own dossiers
  const myDossiers = dossiers.filter((d) => {
    if (!currentUser) return false;
    return (
      d.applicant.name === currentUser.name ||
      d.applicant.pseudonym.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])
    );
  });

  // Auth Guard Helper
  const requireAuth = (callback: () => void) => {
    if (!currentUser) {
      setPendingActionAfterAuth(() => callback);
      setIsAuthModalOpen(true);
    } else {
      callback();
    }
  };

  const handleEntryAuthSuccess = (user: User, isNewAccount: boolean) => {
    const upgraded = applyOwnerGoldStatus(user);
    setCurrentUser(upgraded);
    const guideDone = localStorage.getItem(`solvapact_guide_done_${upgraded.id}`) === 'true';
    if (isNewAccount || !guideDone) {
      setShowOnboardingGuide(true);
    } else {
      setShowOnboardingGuide(false);
      setActiveTab('explorer');
    }
  };

  const handleAuthSuccess = (user: User) => {
    const upgraded = applyOwnerGoldStatus(user);
    setCurrentUser(upgraded);
    setShowOnboardingGuide(true);
    if (pendingActionAfterAuth) {
      pendingActionAfterAuth();
      setPendingActionAfterAuth(null);
    }
  };

  const trackAnalyticsEvent = (payload: Record<string, unknown>) => {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Analytics event tracking error:', err));
  };

  const isOwner = isOwnerGoldEmail(currentUser?.email);
  const canSeeDailyReport = canViewDailyReport(currentUser);

  const canMarkDossierAccepted = (dossier: Dossier): boolean => {
    if (!currentUser) return false;
    if (isOwner) return true;
    const dossierEmail = dossier.applicant.email?.toLowerCase();
    const userEmail = currentUser.email.toLowerCase();
    return (
      (Boolean(dossierEmail) && dossierEmail === userEmail) ||
      dossier.applicant.name === currentUser.name
    );
  };

  const handleMarkDossierAccepted = (dossier: Dossier) => {
    if (dossier.status === 'agreement_reached') return;
    setDossiers((prev) =>
      prev.map((d) =>
        d.id === dossier.id ? { ...d, status: 'agreement_reached' } : d
      )
    );
    setSelectedDossierForDetail((prev) =>
      prev && prev.id === dossier.id
        ? { ...prev, status: 'agreement_reached' }
        : prev
    );
    trackAnalyticsEvent({
      type: 'dossier_accepted',
      dossierId: dossier.id,
      dossierTitle: dossier.title,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
    });
  };

  const handleActivateLoyalty = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      loyaltyActive: true,
      loyaltyExp: currentUser.loyaltyExp || 0,
      loyaltyActivatedAt: new Date().toLocaleDateString('fr-FR'),
    };
    setCurrentUser(updatedUser);
    syncUserToAccountsStore(updatedUser);
    trackAnalyticsEvent({
      type: 'loyalty_created',
      amount: LOYALTY_ACTIVATION_PRICE,
      userName: currentUser.name,
      userEmail: currentUser.email,
    });
  };

  const handleDeleteDossier = (dossierId: string) => {
    setDossiers((prev) => prev.filter((d) => d.id !== dossierId));
  };

  const handleClearAllTests = () => {
    setDossiers([]);
    setConfirmClearTests(false);
    localStorage.removeItem('solvapact_dossiers');
    localStorage.removeItem('solvapact_negotiations');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowOnboardingGuide(false);
    setIsDailyReportOpen(false);
    setActiveTab('explorer');
  };

  const handleOpenDepositWithType = (
    targetType: DossierType,
    prefillAmount?: number,
    prefillTerm?: number
  ) => {
    setDepositGuidedBySolva(false);
    setDepositDefaultType(targetType);
    setDepositPrefill({ amount: prefillAmount, term: prefillTerm });
    requireAuth(() => setIsDepositModalOpen(true));
  };

  const handleStartGuidedDossier = () => {
    setDepositDefaultType('dette');
    setDepositPrefill({});
    requireAuth(() => {
      setActiveTab('explorer');
      setDepositGuidedBySolva(true);
      setIsDepositModalOpen(true);
    });
  };

  const handleOpenContact = (dossier: Dossier) => {
    requireAuth(() => {
      setContactDossier(dossier);
    });
  };

  const handleCreateDossier = (newDossier: Dossier, paidAmount: number) => {
    setDossiers((prev) => [newDossier, ...prev]);

    // Award +10 EXP if Loyalty Account is active & advance Diamond 5-dossier cycle
    if (currentUser?.loyaltyActive) {
      const currentLoyalty = getLoyaltyStatus(currentUser);
      const nextExp = (currentUser.loyaltyExp || 0) + EXP_PER_DOSSIER;
      const nextDiamondCount = currentLoyalty.isDiamond
        ? (currentUser.diamondPublicationsCount || 0) + 1
        : currentUser.diamondPublicationsCount || 0;
      const updatedUser: User = {
        ...currentUser,
        loyaltyExp: nextExp,
        diamondPublicationsCount: nextDiamondCount,
      };
      setCurrentUser(updatedUser);
      syncUserToAccountsStore(updatedUser);
    }

    trackAnalyticsEvent({
      type: 'dossier_published',
      dossierId: newDossier.id,
      dossierTitle: newDossier.title,
      amount: paidAmount,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
    });

    setActiveTab(newDossier.type as ActiveTab);
    setSurveyPaidAmount(paidAmount);
    setSurveyDossier(newDossier);
  };

  const handleSubmitSatisfaction = (rating: number, comment: string) => {
    trackAnalyticsEvent({
      type: 'satisfaction_review',
      dossierId: surveyDossier?.id,
      dossierTitle: surveyDossier?.title,
      rating,
      comment,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
    });
    setSurveyDossier(null);
  };

  // MANDATORY FREE ACCOUNT ENTRY GATE:
  // Visitors must create an account (with Prénom, Nom, Email, Téléphone, Profession) or sign in first.
  if (!currentUser) {
    return <AccountEntryGate onAuthSuccess={handleEntryAuthSuccess} />;
  }

  // FULL-PAGE DISCOVERY GUIDE ON ACCOUNT ACTIVATION:
  // User reads the complete guide page; scrolling to the bottom reveals the button to enter the site.
  if (showOnboardingGuide) {
    return (
      <PlatformDiscoveryView
        currentUser={currentUser}
        isOnboarding
        onExploreMarketplace={() => {
          localStorage.setItem(`solvapact_guide_done_${currentUser.id}`, 'true');
          setShowOnboardingGuide(false);
          setActiveTab('explorer');
        }}
      />
    );
  }

  const loyalty = getLoyaltyStatus(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDeposit={() => handleOpenDepositWithType('dette')}
        dossiers={dossiers}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenLoyalty={() => setIsLoyaltyModalOpen(true)}
        onOpenDailyReport={canSeeDailyReport ? () => setIsDailyReportOpen(true) : undefined}
      />

      <main className="flex-1">
        {/* VIEW: DÉCOUVERTE / EXPLICATION DU SITE */}
        {activeTab === 'decouverte' && (
          <PlatformDiscoveryView
            currentUser={currentUser}
            onExploreMarketplace={() => setActiveTab('explorer')}
            onOpenDeposit={() => handleOpenDepositWithType('dette')}
            onOpenLoyalty={() => setIsLoyaltyModalOpen(true)}
            onOpenHelp={() => setActiveTab('aide')}
          />
        )}

        {/* VIEW: EXPLORER / DETTE / INVESTISSEMENT / AUTRE */}
        {(activeTab === 'explorer' ||
          activeTab === 'dette' ||
          activeTab === 'investissement' ||
          activeTab === 'autre') && (
          <div>
            {activeTab === 'explorer' && (
              <HeroBanner
                onExplore={() => {
                  const el = document.getElementById('catalogue-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onDeposit={() => handleOpenDepositWithType('dette')}
                totalVolume={formatEuro(dossiers.reduce((acc, d) => acc + d.amountRequested, 0))}
                activeCount={dossiers.length}
              />
            )}

            {activeTab === 'explorer' && (
              <MarketTrustSection
                dossiers={dossiers}
                onSelectDossier={(d) => setSelectedDossierForDetail(d)}
                onStartNegotiation={(d) => handleOpenContact(d)}
                onOpenDepositWithType={(type) => handleOpenDepositWithType(type)}
              />
            )}

            <section id="catalogue-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {activeTab === 'dette' && 'Onglet 1 · Dettes à régler & Rachats'}
                      {activeTab === 'investissement' && "Onglet 2 · Demandes d'investissement & Projets"}
                      {activeTab === 'autre' && 'Onglet 3 · Autres sujets & Besoins divers'}
                      {activeTab === 'explorer' && 'Vue Globale · Tous les dossiers classés'}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeTab === 'dette' && "Dossiers de rachat & d'apurement de dette"}
                      {activeTab === 'investissement' && "Dossiers d'investissement & financements"}
                      {activeTab === 'autre' && "Dossiers d'autres sujets & accompagnements"}
                      {activeTab === 'explorer' && "Explorez l'ensemble des dossiers disponibles"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Préparation du dossier gratuite · Publication en ligne à{' '}
                      <strong>{formatEuro(loyalty.publicationPrice)}</strong>{' '}
                      {loyalty.discountPct > 0 ? `(Tarif ${loyalty.label} -${loyalty.discountPct} %)` : ''}{' '}
                      · <strong>0 % de commission</strong> · Virements effectués entre vous en dehors du site.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleOpenDepositWithType(
                        activeTab === 'dette'
                          ? 'dette'
                          : activeTab === 'investissement'
                          ? 'investissement'
                          : activeTab === 'autre'
                          ? 'autre'
                          : 'dette'
                      )
                    }
                    className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0 self-start shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      Déposer dans cet onglet (
                      {activeTab === 'dette'
                        ? 'Dette'
                        : activeTab === 'investissement'
                        ? 'Investissement'
                        : activeTab === 'autre'
                        ? 'Autre sujet'
                        : 'Nouveau dossier'}
                      )
                    </span>
                  </button>
                </div>

                {/* 3 Interactive Tab Selector Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('dette')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'dette'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Onglet Dette ({dossiers.filter((d) => d.type === 'dette').length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('investissement')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'investissement'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>
                      Onglet Investissement (
                      {dossiers.filter((d) => d.type === 'investissement').length})
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('autre')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'autre'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>
                      Onglet Autre sujet ({dossiers.filter((d) => d.type === 'autre').length})
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('explorer')}
                    className={`px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      activeTab === 'explorer'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tous ({dossiers.length})
                  </button>
                </div>
              </div>

              {/* Search and Sorting */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer dans cet onglet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Montant :</span>
                    <select
                      value={amountRange}
                      onChange={(e) => setAmountRange(e.target.value as any)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                    >
                      <option value="all">Tous montants</option>
                      <option value="small">&lt; 5 000 € (Micro)</option>
                      <option value="medium">5 000 € à 20 000 €</option>
                      <option value="large">&gt; 20 000 € (Envergure)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Trier :</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                    >
                      <option value="recent">Plus récents</option>
                      <option value="amount_asc">Montant croissant</option>
                      <option value="amount_desc">Montant décroissant</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dossiers Grid or Clean Empty State */}
              {displayedDossiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedDossiers.map((dossier) => (
                    <DossierCard
                      key={dossier.id}
                      dossier={dossier}
                      onSelect={(d) => setSelectedDossierForDetail(d)}
                      onStartNegotiation={(d) => handleOpenContact(d)}
                      onDelete={handleDeleteDossier}
                      canMarkAccepted={canMarkDossierAccepted(dossier)}
                      onMarkAccepted={handleMarkDossierAccepted}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aucun dossier dans l'onglet{' '}
                    {activeTab === 'dette'
                      ? 'Dette'
                      : activeTab === 'investissement'
                      ? 'Investissement'
                      : activeTab === 'autre'
                      ? 'Autre sujet'
                      : 'actuel'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Préparez votre dossier gratuitement. Vous ne réglez {formatEuro(BASE_PUBLICATION_PRICE)} (ou tarif réduit Fidélité) qu'au moment de la publication en ligne.
                  </p>
                  <button
                    onClick={() =>
                      handleOpenDepositWithType(
                        activeTab === 'dette'
                          ? 'dette'
                          : activeTab === 'investissement'
                          ? 'investissement'
                          : 'autre'
                      )
                    }
                    className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Préparer un dossier gratuitement</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW: MES DOSSIERS */}
        {activeTab === 'mes_dossiers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Mes dossiers publiés</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez vos demandes publiées dans les onglets Dette, Investissement ou Autre sujet.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {myDossiers.length > 0 &&
                  (confirmClearTests ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                      <span className="text-[11px] font-semibold text-rose-800">
                        Tout effacer ?
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllTests}
                        className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearTests(false)}
                        className="px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearTests(true)}
                      className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Tout effacer</span>
                    </button>
                  ))}
                <button
                  onClick={() => handleOpenDepositWithType('dette')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouveau dossier</span>
                </button>
              </div>
            </div>

            {myDossiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myDossiers.map((dossier) => (
                  <DossierCard
                    key={dossier.id}
                    dossier={dossier}
                    onSelect={(d) => setSelectedDossierForDetail(d)}
                    onStartNegotiation={(d) => handleOpenContact(d)}
                    onDelete={handleDeleteDossier}
                    canMarkAccepted={canMarkDossierAccepted(dossier)}
                    onMarkAccepted={handleMarkDossierAccepted}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  Vous n'avez pas encore de dossier publié
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Remplissez votre dossier gratuitement puis réglez {formatEuro(loyalty.publicationPrice)} à la dernière étape pour le publier.
                </p>
                <button
                  onClick={() => handleOpenDepositWithType('dette')}
                  className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Déposer un dossier</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: SIMULATEUR FINANCIER */}
        {activeTab === 'simulateur' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FinanceCalculator
              onOpenDepositWithParams={(type, amount, term) => {
                handleOpenDepositWithType(
                  type === 'dette' ? 'dette' : 'investissement',
                  amount,
                  term
                );
              }}
            />
          </div>
        )}

        {/* VIEW: CENTRE D'AIDE (SOLVASOLUTION IA + ESCALADE HUMAINE) */}
        {activeTab === 'aide' && (
          <HelpView
            onNavigateToTab={setActiveTab}
            currentUser={currentUser}
            onStartGuidedDossier={handleStartGuidedDossier}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingActionAfterAuth(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <DossierDetailModal
        dossier={selectedDossierForDetail}
        onClose={() => setSelectedDossierForDetail(null)}
        onOpenContact={(d) => handleOpenContact(d)}
        canMarkAccepted={
          selectedDossierForDetail ? canMarkDossierAccepted(selectedDossierForDetail) : false
        }
        onMarkAccepted={handleMarkDossierAccepted}
      />

      <ContactCreatorModal
        dossier={contactDossier}
        onClose={() => setContactDossier(null)}
      />

      <DepositDossierModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setDepositGuidedBySolva(false);
        }}
        onSubmitDossier={handleCreateDossier}
        currentUser={currentUser}
        defaultType={depositDefaultType}
        initialAmount={depositPrefill.amount}
        initialTerm={depositPrefill.term}
        onOpenLoyalty={() => setIsLoyaltyModalOpen(true)}
        guidedBySolva={depositGuidedBySolva}
      />

      <LoyaltyModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        currentUser={currentUser}
        onActivateLoyalty={handleActivateLoyalty}
      />

      <SatisfactionSurveyModal
        dossier={surveyDossier}
        paidAmount={surveyPaidAmount}
        onSubmitReview={handleSubmitSatisfaction}
        onSkip={() => setSurveyDossier(null)}
      />

      {canSeeDailyReport && (
        <DailyReportModal
          isOpen={isDailyReportOpen}
          onClose={() => setIsDailyReportOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Footer with Social Networks & Feedback */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Social Networks & Feedback Callout */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MessageSquareHeart className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Suivez nos publications et partagez vos conseils</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Découvrez nos actualités, publications et annonces sur nos réseaux sociaux. Tous vos conseils, avis et retours pour améliorer SolvaPact sont pris avec grand plaisir et le plus grand sérieux.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href="https://www.instagram.com/solvapact"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Instagram : @solvapact</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://www.facebook.com/search/top?q=Solva%20Pact"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Facebook : Solva Pact</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://www.linkedin.com/search/results/all/?keywords=Solva%20Pact"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>LinkedIn : Solva Pact</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900">SolvaPact</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActiveTab('decouverte')}
                className="text-slate-600 hover:text-slate-900 underline transition-colors cursor-pointer"
              >
                Découvrir le fonctionnement
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActiveTab('aide')}
                className="text-slate-600 hover:text-slate-900 underline transition-colors cursor-pointer"
              >
                SolvaSolution IA & Contact (solvapact.vercel.app@gmail.com)
              </button>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>0 % de commission</span>
              <span aria-hidden="true">·</span>
              <span>Publication à 29,99 €</span>
              <span aria-hidden="true">·</span>
              <span>Articles 1892 & 2044 du Code Civil</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
