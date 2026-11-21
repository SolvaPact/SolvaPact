import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  AttachmentUploadPayload,
  DirectSubmission,
  Dossier,
  ActiveTab,
  FirestoreNegotiationThread,
  InvestorDirectoryEntry,
  User,
  DossierType,
} from './types';
import { auth, getAuthHeaders } from './firebase';
import {
  activateUserLoyaltyInFirestore,
  createOrSyncUserProfile,
  deleteDossierInFirestore,
  fetchUserProfile,
  incrementLoyaltyAfterDossierInFirestore,
  markDossierAcceptedInFirestore,
  publishDossierToFirestore,
  recordAnalyticsEventInFirestore,
  subscribeToAllDirectSubmissionsForAdmin,
  subscribeToCreatorNegotiations,
  subscribeToDirectSubmissionsForUser,
  subscribeToInvestorDirectory,
  subscribeToPublicDossiers,
} from './services/firestoreService';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { DossierCard } from './components/DossierCard';
import { DossierDetailModal } from './components/DossierDetailModal';
import { ContactCreatorModal } from './components/ContactCreatorModal';
import { DepositDossierModal } from './components/DepositDossierModal';
import { FinanceCalculator } from './components/FinanceCalculatorModal';
import { AuthModal } from './components/AuthModal';
import { PlatformDiscoveryView } from './components/PlatformDiscoveryView';
import { LoyaltyModal } from './components/LoyaltyModal';
import { HelpView } from './components/HelpView';
import { MarketTrustSection } from './components/MarketTrustSection';
import { MadagascarActionHub } from './components/MadagascarActionHub';
import { SatisfactionSurveyModal } from './components/SatisfactionSurveyModal';
import { DailyReportModal } from './components/DailyReportModal';
import { InvestorContactView } from './components/InvestorContactView';
import { SendDossierToInvestorModal } from './components/SendDossierToInvestorModal';
import { InvestorProfileSettingsModal } from './components/InvestorProfileSettingsModal';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  applyOwnerGoldStatus,
  canViewDailyReport,
  formatAriaryApprox,
  formatEuro,
  getLoyaltyStatus,
  isOwnerGoldEmail,
} from './utils/finance';
import {
  Search,
  PlusCircle,
  FileCheck,
  Inbox,
  PiggyBank,
  FolderOpen,
  Trash2,
  MessageSquareHeart,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [dossiersLoading, setDossiersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [creatorThreads, setCreatorThreads] = useState<FirestoreNegotiationThread[]>([]);
  const [investorDirectory, setInvestorDirectory] = useState<InvestorDirectoryEntry[]>([]);
  const [incomingSubmissions, setIncomingSubmissions] = useState<DirectSubmission[]>([]);
  const [sentSubmissions, setSentSubmissions] = useState<DirectSubmission[]>([]);
  const [adminAllSubmissions, setAdminAllSubmissions] = useState<DirectSubmission[]>([]);
  const [selectedInvestorForSend, setSelectedInvestorForSend] =
    useState<InvestorDirectoryEntry | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<(() => void) | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<string | null>(null);
  const isAuthModalOpenRef = useRef(false);

  useEffect(() => {
    isAuthModalOpenRef.current = isAuthModalOpen;
  }, [isAuthModalOpen]);

  // Clean legacy localStorage test artifacts once
  useEffect(() => {
    localStorage.removeItem('solvapact_dossiers');
    localStorage.removeItem('solvapact_dossiers_v2');
    localStorage.removeItem('solvapact_negotiations');
    localStorage.removeItem('solvapact_negotiations_v2');
    localStorage.removeItem('solvapact_subscription_stats');
    localStorage.removeItem('solvapact_subscription_stats_v2');
    localStorage.removeItem('solvapact_has_paid_access');
    localStorage.removeItem('solvapact_test_pause_diamond_v1');
    sessionStorage.removeItem('solvapact_founder_unlocked');
  }, []);

  // Live Firestore public marketplace subscription
  useEffect(() => {
    const unsubscribe = subscribeToPublicDossiers(
      (list) => {
        setDossiers(list);
        setDossiersLoading(false);
      },
      () => {
        setDossiersLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Firebase Auth listener -> hydrate Firestore user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setCreatorThreads([]);
        return;
      }
      try {
        let profile = await fetchUserProfile(fbUser.uid);
        if (!profile && !isAuthModalOpenRef.current) {
          profile = await createOrSyncUserProfile(fbUser, {
            role: 'demandeur',
            city: 'Antananarivo',
          });
        }
        if (profile) {
          setCurrentUser(applyOwnerGoldStatus(profile));
        }
      } catch (err) {
        console.error('Failed loading Firebase profile:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  // Creator live incoming negotiation threads + Investor Directory + Direct Submissions
  useEffect(() => {
    if (!currentUser?.uid) {
      setCreatorThreads([]);
      setInvestorDirectory([]);
      setIncomingSubmissions([]);
      setSentSubmissions([]);
      setAdminAllSubmissions([]);
      return;
    }
    const unsubThreads = subscribeToCreatorNegotiations(currentUser.uid, (threads) => {
      setCreatorThreads(threads);
    });
    const unsubDirectory = subscribeToInvestorDirectory((investors) => {
      setInvestorDirectory(investors);
    });
    const unsubSubmissions = subscribeToDirectSubmissionsForUser(
      currentUser.uid,
      ({ incoming, sent }) => {
        setIncomingSubmissions(incoming);
        setSentSubmissions(sent);
      }
    );
    const unsubAdminSubmissions = isOwnerGoldEmail(currentUser.email)
      ? subscribeToAllDirectSubmissionsForAdmin((all) => {
          setAdminAllSubmissions(all);
        })
      : () => {};
    return () => {
      unsubThreads();
      unsubDirectory();
      unsubSubmissions();
      unsubAdminSubmissions();
    };
  }, [currentUser?.uid, currentUser?.email]);

  // Handle Stripe Checkout return (?payment=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus !== 'success' || !currentUser?.uid) return;

    const handleStripeReturn = async () => {
      const pendingLoyalty = sessionStorage.getItem('solvapact_pending_loyalty_stripe');
      const pendingDossierRaw = sessionStorage.getItem('solvapact_pending_dossier_stripe');

      if (pendingLoyalty === 'true') {
        sessionStorage.removeItem('solvapact_pending_loyalty_stripe');
        await handleActivateLoyalty();
        setPaymentBanner('Votre Compte Fidélité SolvaPact est activé à vie !');
      } else if (pendingDossierRaw) {
        sessionStorage.removeItem('solvapact_pending_dossier_stripe');
        try {
          const parsed = JSON.parse(pendingDossierRaw) as {
            dossier: Dossier;
            paidAmount: number;
            attachments?: AttachmentUploadPayload[];
            privateContact?: { fullName: string; email: string; phone?: string };
          };
          await handleCreateDossier(
            parsed.dossier,
            parsed.paidAmount,
            parsed.attachments,
            parsed.privateContact
          );
          setPaymentBanner('Paiement confirmé : votre dossier est en ligne sur SolvaPact Madagascar.');
        } catch (err) {
          console.error('Error finalizing Stripe dossier:', err);
        }
      }
      window.history.replaceState({}, '', '/');
    };

    handleStripeReturn();
  }, [currentUser?.uid]);

  // Tab & Modals State
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [selectedDossierForDetail, setSelectedDossierForDetail] = useState<Dossier | null>(null);
  const [contactDossier, setContactDossier] = useState<Dossier | null>(null);
  const [contactInitialThread, setContactInitialThread] =
    useState<FirestoreNegotiationThread | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGuidedBySolva, setDepositGuidedBySolva] = useState(false);
  const [depositDefaultType, setDepositDefaultType] = useState<DossierType>('investissement');
  const [depositPrefill, setDepositPrefill] = useState<{ amount?: number; term?: number }>({});
  const [confirmClearTests, setConfirmClearTests] = useState(false);
  const [surveyDossier, setSurveyDossier] = useState<Dossier | null>(null);
  const [surveyPaidAmount, setSurveyPaidAmount] = useState<number>(BASE_PUBLICATION_PRICE);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_negotiation' | 'agreement_reached'>('all');
  const [amountRange, setAmountRange] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'amount_asc' | 'amount_desc'>('recent');

  const availableCategories = Array.from(
    new Set([
      'Éducation & Formation',
      'Immobilier & Construction',
      'Artisanat & BTP',
      'Commerce de bouche',
      'Profession libérale & Freelance',
      'Automobile & Logistique',
      'Autre domaine',
      ...dossiers.map((d) => d.category).filter(Boolean),
    ])
  );

  // Filter dossiers according to current view / tab
  const getTabDossiers = () => {
    let list = dossiers;
    if (activeTab === 'investissement') {
      list = dossiers.filter((d) => d.type === 'investissement');
    } else if (activeTab === 'autre') {
      list = dossiers.filter((d) => d.type === 'autre');
    }

    if (categoryFilter !== 'all') {
      list = list.filter((d) => d.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
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
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    amountRange !== 'all' ||
    sortBy !== 'recent';

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAmountRange('all');
    setSortBy('recent');
  };

  // User's own dossiers
  const myDossiers = dossiers.filter((d) => {
    if (!currentUser) return false;
    if (d.ownerUid && currentUser.uid) {
      return d.ownerUid === currentUser.uid;
    }
    return (
      Boolean(d.applicant.email) &&
      d.applicant.email?.toLowerCase() === currentUser.email.toLowerCase()
    );
  });

  // Auth Guard Helper (no forced login on entry; opens modal only for protected actions)
  const requireAuth = (callback: () => void) => {
    if (!currentUser) {
      setPendingActionAfterAuth(() => callback);
      setIsAuthModalOpen(true);
    } else {
      callback();
    }
  };

  const handleAuthSuccess = (user: User) => {
    const upgraded = applyOwnerGoldStatus(user);
    setCurrentUser(upgraded);
    if (pendingActionAfterAuth) {
      pendingActionAfterAuth();
      setPendingActionAfterAuth(null);
    }
  };

  const trackAnalyticsEvent = (payload: {
    type: 'dossier_published' | 'loyalty_created' | 'dossier_accepted' | 'satisfaction_review';
    dossierId?: string;
    dossierTitle?: string;
    amount?: number;
    rating?: number;
    comment?: string;
    userName?: string;
    userEmail?: string;
  }) => {
    if (currentUser?.uid) {
      recordAnalyticsEventInFirestore(currentUser.uid, payload).catch(() => {});
    }
    getAuthHeaders({ 'Content-Type': 'application/json' })
      .then((headers) =>
        fetch('/api/analytics/event', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
      )
      .catch((err) => console.error('Analytics event tracking error:', err));
  };

  const isOwner = isOwnerGoldEmail(currentUser?.email);
  const canSeeDailyReport = canViewDailyReport(currentUser);

  const canMarkDossierAccepted = (dossier: Dossier): boolean => {
    if (!currentUser) return false;
    if (isOwner) return true;
    if (dossier.ownerUid && currentUser.uid && dossier.ownerUid === currentUser.uid) {
      return true;
    }
    const dossierEmail = dossier.applicant.email?.toLowerCase();
    const userEmail = currentUser.email.toLowerCase();
    return Boolean(dossierEmail) && dossierEmail === userEmail;
  };

  const handleMarkDossierAccepted = async (dossier: Dossier) => {
    if (dossier.status === 'agreement_reached') return;
    try {
      await markDossierAcceptedInFirestore(dossier.id);
    } catch (err) {
      console.error('Error marking dossier accepted in Firestore:', err);
    }
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

  const handleActivateLoyalty = async () => {
    if (!currentUser) return;
    const targetUid = currentUser.uid || currentUser.id;
    let activatedAt = new Date().toLocaleDateString('fr-FR');
    try {
      activatedAt = await activateUserLoyaltyInFirestore(targetUid);
    } catch (err) {
      console.error('Error activating loyalty in Firestore:', err);
    }
    const updatedUser: User = {
      ...currentUser,
      loyaltyActive: true,
      loyaltyExp: currentUser.loyaltyExp || 0,
      loyaltyActivatedAt: activatedAt,
    };
    setCurrentUser(updatedUser);
    trackAnalyticsEvent({
      type: 'loyalty_created',
      amount: LOYALTY_ACTIVATION_PRICE,
      userName: currentUser.name,
      userEmail: currentUser.email,
    });
  };

  const handleDeleteDossier = async (dossierId: string) => {
    try {
      await deleteDossierInFirestore(dossierId);
      setDossiers((prev) => prev.filter((d) => d.id !== dossierId));
      setSelectedDossierForDetail((prev) => (prev && prev.id === dossierId ? null : prev));
    } catch (err) {
      console.error('Error deleting dossier from Firestore:', err);
    }
  };

  const handleClearAllTests = async () => {
    const owned = myDossiers;
    for (const d of owned) {
      await deleteDossierInFirestore(d.id).catch(() => {});
    }
    setConfirmClearTests(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setCurrentUser(null);
    setInvestorDirectory([]);
    setIncomingSubmissions([]);
    setSentSubmissions([]);
    setSelectedInvestorForSend(null);
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
    setDepositDefaultType('investissement');
    setDepositPrefill({});
    requireAuth(() => {
      setActiveTab('explorer');
      setDepositGuidedBySolva(true);
      setIsDepositModalOpen(true);
    });
  };

  const handleOpenContact = (
    dossier: Dossier,
    initialThread?: FirestoreNegotiationThread | null
  ) => {
    requireAuth(() => {
      setContactInitialThread(initialThread || null);
      setContactDossier(dossier);
    });
  };

  const handleCreateDossier = async (
    newDossier: Dossier,
    paidAmount: number,
    attachments: AttachmentUploadPayload[] = [],
    privateContact?: { fullName: string; email: string; phone?: string }
  ) => {
    const ownerUid = currentUser?.uid || currentUser?.id;
    const enrichedDossier: Dossier = {
      ...newDossier,
      ownerUid,
    };

    if (ownerUid) {
      try {
        await publishDossierToFirestore(
          ownerUid,
          enrichedDossier,
          privateContact || {
            fullName: currentUser?.name || newDossier.applicant.name,
            email: currentUser?.email || newDossier.applicant.email || '',
            phone: currentUser?.phone || newDossier.applicant.phone,
          },
          attachments
        );
      } catch (err) {
        console.error('Error saving dossier to Firestore:', err);
      }
    }

    setDossiers((prev) =>
      prev.some((d) => d.id === enrichedDossier.id) ? prev : [enrichedDossier, ...prev]
    );

    if (currentUser?.loyaltyActive && ownerUid) {
      const currentLoyalty = getLoyaltyStatus(currentUser);
      const nextExp = (currentUser.loyaltyExp || 0) + EXP_PER_DOSSIER;
      const nextDiamondCount = currentLoyalty.isDiamond
        ? (currentUser.diamondPublicationsCount || 0) + 1
        : currentUser.diamondPublicationsCount || 0;
      try {
        await incrementLoyaltyAfterDossierInFirestore(ownerUid, nextExp, nextDiamondCount);
      } catch (err) {
        console.error('Error updating loyalty EXP in Firestore:', err);
      }
      setCurrentUser({
        ...currentUser,
        loyaltyExp: nextExp,
        diamondPublicationsCount: nextDiamondCount,
      });
    }

    trackAnalyticsEvent({
      type: 'dossier_published',
      dossierId: enrichedDossier.id,
      dossierTitle: enrichedDossier.title,
      amount: paidAmount,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
    });

    setActiveTab(enrichedDossier.type as ActiveTab);
    setSurveyPaidAmount(paidAmount);
    setSurveyDossier(enrichedDossier);
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

  const loyalty = getLoyaltyStatus(currentUser);
  const unreadIncomingCount = incomingSubmissions.filter((s) => s.status === 'envoye').length;

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-slate-900 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDeposit={() => handleOpenDepositWithType('investissement')}
        dossiers={dossiers}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenLoyalty={() =>
          requireAuth(() => {
            setIsLoyaltyModalOpen(true);
          })
        }
        onOpenProfileSettings={currentUser ? () => setIsProfileModalOpen(true) : undefined}
        onOpenDailyReport={canSeeDailyReport ? () => setIsDailyReportOpen(true) : undefined}
        unreadIncomingCount={unreadIncomingCount}
      />

      {paymentBanner && (
        <div className="bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{paymentBanner}</span>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="ml-3 underline text-emerald-100 hover:text-white cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      <main className="flex-1">
        {/* VIEW: DÉCOUVERTE / EXPLICATION DU SITE */}
        {activeTab === 'decouverte' && (
          <PlatformDiscoveryView
            currentUser={currentUser}
            onExploreMarketplace={() => setActiveTab('explorer')}
            onOpenDeposit={() => handleOpenDepositWithType('investissement')}
            onOpenContactInvestors={() => setActiveTab('prendre_contact')}
            onOpenLoyalty={() =>
              requireAuth(() => {
                setIsLoyaltyModalOpen(true);
              })
            }
            onOpenHelp={() => setActiveTab('aide')}
          />
        )}

        {/* VIEW: EXPLORER / INVESTISSEMENT / AUTRE */}
        {(activeTab === 'explorer' ||
          activeTab === 'investissement' ||
          activeTab === 'autre') && (
          <div>
            {activeTab === 'explorer' && (
              <HeroBanner
                onExplore={() => {
                  const el = document.getElementById('market-lanes-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onDeposit={() => handleOpenDepositWithType('investissement')}
                onOpenContactInvestors={() => setActiveTab('prendre_contact')}
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
                canDelete={canMarkDossierAccepted}
                onDeleteDossier={handleDeleteDossier}
              />
            )}

            {activeTab === 'explorer' && (
              <MadagascarActionHub
                onOpenCreateDossier={() => handleOpenDepositWithType('investissement')}
                onOpenSimulateur={() => setActiveTab('simulateur')}
                onOpenContactInvestors={() => setActiveTab('prendre_contact')}
                onOpenHelp={() => setActiveTab('aide')}
                onOpenDepositWithAmount={(amountEuro) =>
                  handleOpenDepositWithType('investissement', amountEuro)
                }
              />
            )}

            {(activeTab === 'investissement' || activeTab === 'autre') && (
              <section id="catalogue-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-white via-white to-orange-50/40 border border-orange-200/70 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600 block mb-1">
                      {activeTab === 'investissement'
                        ? "Onglet 1 · Demandes d'investissement & Projets Madagascar"
                        : 'Onglet 2 · Autres sujets & Besoins divers'}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeTab === 'investissement'
                        ? "Dossiers d'investissement & financements"
                        : "Dossiers d'autres sujets & accompagnements"}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Préparation du dossier gratuite · Publication en ligne à{' '}
                      <strong>{formatEuro(loyalty.publicationPrice)}</strong>{' '}
                      <span className="text-slate-400">({formatAriaryApprox(loyalty.publicationPrice)})</span>{' '}
                      {loyalty.discountPct > 0 ? `(Tarif ${loyalty.label} -${loyalty.discountPct} %)` : ''}{' '}
                      · <strong>Accord direct 100 % net</strong> · Transferts MVola, Orange Money ou virement entre vous hors site.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleOpenDepositWithType(
                        activeTab === 'autre' ? 'autre' : 'investissement'
                      )
                    }
                    className="px-4 py-2.5 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 transition-colors flex items-center gap-2 shrink-0 self-start shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      Déposer dans cet onglet (
                      {activeTab === 'investissement'
                        ? 'Investissement'
                        : activeTab === 'autre'
                        ? 'Autre sujet'
                        : 'Nouveau dossier'}
                      )
                    </span>
                  </button>
                </div>

                {/* 2 Interactive Tab Selector Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100">
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
                        ? 'bg-orange-600 text-white shadow-xs'
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
                    className="px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800"
                  >
                    Tous ({dossiers.length})
                  </button>
                </div>
              </div>

              {/* Search, Category, Status and Sorting */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-6 space-y-3 text-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="relative w-full lg:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrer par ville (Antananarivo, Toamasina...), secteur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                    <select
                      aria-label="Filtrer par secteur"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="all">Tous secteurs</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filtrer par statut"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as 'all' | 'open' | 'in_negotiation' | 'agreement_reached'
                        )
                      }
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="all">Tous statuts</option>
                      <option value="open">Ouverts</option>
                      <option value="in_negotiation">En négociation</option>
                      <option value="agreement_reached">Accord conclu</option>
                    </select>

                    <select
                      aria-label="Filtrer par montant"
                      value={amountRange}
                      onChange={(e) => setAmountRange(e.target.value as 'all' | 'small' | 'medium' | 'large')}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="all">Tous montants</option>
                      <option value="small">&lt; 5 000 € (~25M Ar)</option>
                      <option value="medium">5 000 € à 20 000 €</option>
                      <option value="large">&gt; 20 000 € (~99M Ar+)</option>
                    </select>

                    <select
                      aria-label="Trier les dossiers"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'amount_asc' | 'amount_desc')}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="recent">Plus récents (Diamond 1er)</option>
                      <option value="amount_asc">Montant croissant</option>
                      <option value="amount_desc">Montant décroissant</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>
                    <strong className="text-slate-900 tabular-nums">{displayedDossiers.length}</strong>{' '}
                    dossier{displayedDossiers.length > 1 ? 's' : ''} affiché
                    {displayedDossiers.length > 1 ? 's' : ''}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-orange-600 hover:text-orange-700 font-semibold underline cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>

              {/* Dossiers Grid or Skeleton / Clean Empty State */}
              {dossiersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-36 bg-slate-200 rounded" />
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-5/6 bg-slate-200 rounded" />
                        <div className="h-3 w-full bg-slate-100 rounded" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
                        <div className="h-7 bg-slate-100 rounded" />
                        <div className="h-7 bg-slate-100 rounded" />
                        <div className="h-7 bg-slate-100 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 flex-1 bg-slate-100 rounded-xl" />
                        <div className="h-8 flex-1 bg-slate-200 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedDossiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedDossiers.map((dossier) => (
                    <DossierCard
                      key={dossier.id}
                      dossier={dossier}
                      onSelect={(d) => setSelectedDossierForDetail(d)}
                      onStartNegotiation={(d) => handleOpenContact(d)}
                      onDelete={canMarkDossierAccepted(dossier) ? handleDeleteDossier : undefined}
                      canMarkAccepted={canMarkDossierAccepted(dossier)}
                      onMarkAccepted={handleMarkDossierAccepted}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aucun dossier dans l'onglet{' '}
                    {activeTab === 'investissement'
                      ? 'Investissement'
                      : activeTab === 'autre'
                      ? 'Autre sujet'
                      : 'actuel'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Préparez votre dossier gratuitement avec SolvaSolution. Vous ne réglez{' '}
                    {formatEuro(BASE_PUBLICATION_PRICE)} (ou tarif réduit Fidélité) qu'au moment de la publication en ligne.
                  </p>
                  <button
                    onClick={() =>
                      handleOpenDepositWithType(
                        activeTab === 'autre' ? 'autre' : 'investissement'
                      )
                    }
                    className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Préparer un dossier gratuitement</span>
                  </button>
                </div>
              )}
              </section>
            )}
          </div>
        )}

        {/* VIEW: MES DOSSIERS */}
        {activeTab === 'mes_dossiers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Mes dossiers & Négociations</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez vos demandes publiées et répondez en temps réel aux investisseurs intéressés.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {myDossiers.length > 0 &&
                  (confirmClearTests ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                      <span className="text-[11px] font-semibold text-rose-800">
                        Supprimer mes dossiers ?
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
                  onClick={() => handleOpenDepositWithType('investissement')}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 transition-colors flex items-center gap-1.5 self-start shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouveau dossier</span>
                </button>
              </div>
            </div>

            {/* Creator Live Investor Inquiries */}
            {currentUser && creatorThreads.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-orange-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  <span>Investisseurs intéressés en direct ({creatorThreads.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {creatorThreads.map((th) => {
                    const matchedDossier = dossiers.find((d) => d.id === th.dossierId);
                    return (
                      <div
                        key={th.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {th.investorName} · {th.dossierTitle}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {th.updatedAtLabel ? `Mis à jour le ${th.updatedAtLabel}` : 'Canal actif'}
                            {th.sharedCreatorEmail ? ' · Coordonnées partagées' : ''}
                          </span>
                        </div>
                        {matchedDossier && (
                          <button
                            type="button"
                            onClick={() => handleOpenContact(matchedDossier, th)}
                            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Répondre
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  {currentUser
                    ? "Vous n'avez pas encore de dossier publié"
                    : 'Connectez-vous pour retrouver vos dossiers'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {currentUser
                    ? `Remplissez votre dossier gratuitement puis réglez ${formatEuro(loyalty.publicationPrice)} à la dernière étape pour le publier.`
                    : 'Connectez-vous gratuitement avec Google pour publier un dossier ou suivre vos échanges avec les investisseurs.'}
                </p>
                <button
                  onClick={() =>
                    currentUser ? handleOpenDepositWithType('investissement') : setIsAuthModalOpen(true)
                  }
                  className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{currentUser ? 'Déposer un dossier' : 'Connexion Google gratuite'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: PRENDRE CONTACT (ANNUAIRE INVESTISSEURS & ENVOI DIRECT) */}
        {activeTab === 'prendre_contact' && (
          <InvestorContactView
            currentUser={currentUser}
            investors={investorDirectory}
            incomingSubmissions={incomingSubmissions}
            sentSubmissions={sentSubmissions}
            adminSubmissions={adminAllSubmissions}
            isAdmin={isOwner}
            dossiers={dossiers}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onUserUpdated={(updatedUser) => setCurrentUser(applyOwnerGoldStatus(updatedUser))}
            onSendDossierToInvestor={(inv) =>
              requireAuth(() => {
                setSelectedInvestorForSend(inv);
              })
            }
            onSelectDossier={(d) => setSelectedDossierForDetail(d)}
            onOpenDeposit={() => handleOpenDepositWithType('investissement')}
            onInvestorRemoved={(uid) =>
              setInvestorDirectory((prev) => prev.filter((item) => item.uid !== uid))
            }
          />
        )}

        {/* VIEW: SIMULATEUR FINANCIER */}
        {activeTab === 'simulateur' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FinanceCalculator
              onOpenDepositWithParams={(type, amount, term) => {
                handleOpenDepositWithType(type, amount, term);
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
        canDelete={
          selectedDossierForDetail ? canMarkDossierAccepted(selectedDossierForDetail) : false
        }
        onDelete={handleDeleteDossier}
      />

      <ContactCreatorModal
        dossier={contactDossier}
        currentUser={currentUser}
        initialThread={contactInitialThread}
        onClose={() => {
          setContactDossier(null);
          setContactInitialThread(null);
        }}
      />

      <SendDossierToInvestorModal
        isOpen={Boolean(selectedInvestorForSend)}
        investor={selectedInvestorForSend}
        currentUser={currentUser}
        myDossiers={myDossiers}
        onClose={() => setSelectedInvestorForSend(null)}
        onRequireAuth={() => setIsAuthModalOpen(true)}
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
        onOpenLoyalty={() =>
          requireAuth(() => {
            setIsLoyaltyModalOpen(true);
          })
        }
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

      {currentUser && (
        <InvestorProfileSettingsModal
          isOpen={isProfileModalOpen}
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdated={(updatedUser) => setCurrentUser(applyOwnerGoldStatus(updatedUser))}
        />
      )}

      {/* Footer with Madagascar Identity & Social Networks */}
      <footer className="bg-white border-t border-orange-200/70 py-10 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/60 via-white to-emerald-50/60 border border-orange-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MessageSquareHeart className="w-4 h-4 text-orange-600 shrink-0" />
                <span>SolvaPact Madagascar — Suivez nos actualités</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Antananarivo, Toamasina, Antsirabe, Mahajanga et diaspora : découvrez nos annonces sur les réseaux sociaux et partagez vos retours.
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
              <span className="font-bold text-slate-900">SolvaPact Madagascar</span>
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
                SolvaSolution IA &amp; Contact (solvapact.vercel.app@gmail.com)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
              <span>Accord direct 100 % net</span>
              <span aria-hidden="true">·</span>
              <span>MVola / Orange Money / BNI / BOA</span>
              <span aria-hidden="true">·</span>
              <span>Publication à 29,99 € ({formatAriaryApprox(29.99)})</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
