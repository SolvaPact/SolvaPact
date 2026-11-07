import React, { useState, useEffect } from 'react';
import { Dossier, NegotiationThread, ActiveTab, Offer, ChatMessage, User, DossierType } from './types';
import { INITIAL_DOSSIERS, INITIAL_NEGOTIATIONS } from './data/mockDossiers';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { DossierCard } from './components/DossierCard';
import { DossierDetailModal } from './components/DossierDetailModal';
import { DepositDossierModal } from './components/DepositDossierModal';
import { NegotiationRoom } from './components/NegotiationRoom';
import { ContractModal } from './components/ContractModal';
import { FinanceCalculator } from './components/FinanceCalculatorModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AccessPaywallGate } from './components/AccessPaywallGate';
import { FounderPayoutView } from './components/FounderPayoutView';
import { HelpView } from './components/HelpView';
import { formatEuro } from './utils/finance';
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Coins,
  ArrowRight,
  TrendingUp,
  Inbox,
  Sparkles,
  HelpCircle,
  Banknote,
  PiggyBank,
  FolderOpen,
  Trash2,
} from 'lucide-react';

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

  const [negotiations, setNegotiations] = useState<NegotiationThread[]>(() => {
    localStorage.removeItem('solvapact_negotiations');
    const saved = localStorage.getItem('solvapact_negotiations_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading negotiations from localStorage', e);
      }
    }
    return [];
  });

  // User Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('solvapact_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading user from localStorage', e);
      }
    }
    return null;
  });

  // Mandatory Access Paywall State
  const [hasPaidAccess, setHasPaidAccess] = useState<boolean>(() => {
    return localStorage.getItem('solvapact_has_paid_access') === 'true';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<(() => void) | null>(null);

  useEffect(() => {
    localStorage.setItem('solvapact_dossiers_v2', JSON.stringify(dossiers));
  }, [dossiers]);

  useEffect(() => {
    localStorage.setItem('solvapact_negotiations_v2', JSON.stringify(negotiations));
  }, [negotiations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('solvapact_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('solvapact_user');
    }
  }, [currentUser]);

  // Tab & Persona State
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const userRole = currentUser?.role || 'investisseur';

  // Selected thread & modals
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    negotiations[0]?.id || null
  );
  const [viewingContractThread, setViewingContractThread] = useState<NegotiationThread | null>(null);
  const [selectedDossierForDetail, setSelectedDossierForDetail] = useState<Dossier | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositDefaultType, setDepositDefaultType] = useState<DossierType>('dette');

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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

    return list.sort((a, b) => {
      if (sortBy === 'amount_asc') return a.amountRequested - b.amountRequested;
      if (sortBy === 'amount_desc') return b.amountRequested - a.amountRequested;
      return 0;
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

  // Calculate platform commissions generated on signed transactions (1.2% on debt, 2% on invest)
  const signedNegotiations = negotiations.filter((n) => n.status === 'agreement_signed');
  const totalCommissionsEarned = signedNegotiations.reduce(
    (sum, n) =>
      sum + Math.round(n.currentOffer.proposedAmount * (n.dossierType === 'dette' ? 0.012 : 0.02)),
    0
  );

  // Auth Guard Helper
  const requireAuth = (callback: () => void) => {
    if (!currentUser) {
      setPendingActionAfterAuth(() => callback);
      setIsAuthModalOpen(true);
    } else {
      callback();
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (!user.isSubscribed) {
      setIsSubscriptionModalOpen(true);
    }
    if (pendingActionAfterAuth) {
      pendingActionAfterAuth();
      setPendingActionAfterAuth(null);
    }
  };

  const handleSubscriptionSuccess = (plan: 'demandeur' | 'investisseur', price: number) => {
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        isSubscribed: true,
        subscriptionPlan: plan,
        subscriptionPrice: price,
        subscriptionNextBilling: 'Dans 30 jours',
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('solvapact_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteDossier = (dossierId: string) => {
    setDossiers((prev) => prev.filter((d) => d.id !== dossierId));
  };

  const handleDeleteNegotiation = (threadId: string) => {
    setNegotiations((prev) => {
      const updated = prev.filter((n) => n.id !== threadId);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const handleClearAllTests = () => {
    if (window.confirm('Voulez-vous supprimer tous les dossiers et discussions de test ?')) {
      setDossiers([]);
      setNegotiations([]);
      setSelectedThreadId(null);
      localStorage.removeItem('solvapact_dossiers');
      localStorage.removeItem('solvapact_negotiations');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOpenDepositWithType = (targetType: DossierType) => {
    setDepositDefaultType(targetType);
    requireAuth(() => setIsDepositModalOpen(true));
  };

  const handleStartNegotiation = (dossier: Dossier) => {
    requireAuth(() => {
      let thread = negotiations.find((t) => t.dossierId === dossier.id);

      if (!thread) {
        const invName = currentUser ? currentUser.name : 'Investisseur';
        const commissionRate = dossier.type === 'dette' ? 0.012 : 0.02;
        const commissionAmount = Math.round(dossier.amountRequested * commissionRate);
        const newThread: NegotiationThread = {
          id: `neg-${Date.now()}`,
          dossierId: dossier.id,
          dossierTitle: dossier.title,
          dossierType: dossier.type,
          applicantName: dossier.applicant.name,
          applicantPseudonym: dossier.applicant.pseudonym,
          investorName: invName,
          currentOffer: {
            id: `off-${Date.now()}`,
            dossierId: dossier.id,
            investorName: invName,
            proposedAmount: dossier.amountRequested,
            platformFee: commissionAmount,
            netAmountToApplicant: dossier.amountRequested - commissionAmount,
            proposedInterestRate: dossier.targetInterestRate || 5.8,
            proposedTermMonths: dossier.termMonths,
            discountPercentage: dossier.targetDiscount,
            proposedMonthlyPayment: dossier.maxMonthlyPayment,
            conditions: `Accord sous seing privé avec commission SolvaPact de ${dossier.type === 'dette' ? '1,2%' : '2%'} et échéancier SEPA.`,
            status: 'pending',
            createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          offerHistory: [],
          messages: [
            {
              id: `msg-init-1`,
              senderRole: 'investisseur',
              senderName: invName,
              text: `Bonjour ${dossier.applicant.pseudonym}, votre dossier « ${dossier.title} » a retenu mon attention. Je suis prêt à discuter des modalités et formaliser un accord direct.`,
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            },
          ],
          status: 'active',
          updatedAt: 'Aujourd\'hui',
        };

        setNegotiations((prev) => [newThread, ...prev]);
        setSelectedThreadId(newThread.id);
      } else {
        setSelectedThreadId(thread.id);
      }

      setActiveTab('negociations');
    });
  };

  const handleSendMessage = (threadId: string, text: string) => {
    setNegotiations((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const role = currentUser?.role || 'investisseur';
        const senderName = currentUser?.name || (role === 'investisseur' ? 'Investisseur' : thread.applicantName);

        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderRole: role,
          senderName,
          text,
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        return {
          ...thread,
          messages: [...thread.messages, newMsg],
          updatedAt: 'À l\'instant',
        };
      })
    );
  };

  const handleSubmitCounterOffer = (threadId: string, offerUpdate: Partial<Offer>) => {
    setNegotiations((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const amount = offerUpdate.proposedAmount || thread.currentOffer.proposedAmount;
        const commissionRate = thread.dossierType === 'dette' ? 0.012 : 0.02;
        const fee = Math.round(amount * commissionRate);

        const updatedOffer: Offer = {
          ...thread.currentOffer,
          ...offerUpdate,
          id: `off-${Date.now()}`,
          platformFee: fee,
          netAmountToApplicant: amount - fee,
          status: 'pending',
          createdAt: `Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        };

        const role = currentUser?.role || 'investisseur';
        const senderName = currentUser?.name || (role === 'investisseur' ? 'Investisseur' : thread.applicantName);

        const counterMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderRole: role,
          senderName,
          text: `Nouvelle proposition formulée : ${formatEuro(
            updatedOffer.proposedAmount
          )} (Com. SolvaPact ${thread.dossierType === 'dette' ? '1,2%' : '2%'} : ${formatEuro(fee)}) à ${updatedOffer.proposedInterestRate}% sur ${
            updatedOffer.proposedTermMonths
          } mois. Mensualité calculée : ${formatEuro(
            updatedOffer.proposedMonthlyPayment
          )}/mois.`,
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          attachedOffer: updatedOffer,
        };

        return {
          ...thread,
          currentOffer: updatedOffer,
          offerHistory: [...thread.offerHistory, thread.currentOffer],
          messages: [...thread.messages, counterMsg],
          updatedAt: 'À l\'instant',
        };
      })
    );
  };

  const handleAcceptOffer = (threadId: string) => {
    setNegotiations((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const acceptedMsg: ChatMessage = {
          id: `msg-acc-${Date.now()}`,
          senderRole: 'system',
          senderName: 'Protocole SolvaPact',
          text: '✓ Accord validé par les deux parties. Commission de 2% enregistrée et protocole sous seing privé opposable généré.',
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        const updated: NegotiationThread = {
          ...thread,
          status: 'agreement_signed',
          currentOffer: {
            ...thread.currentOffer,
            status: 'accepted',
          },
          messages: [...thread.messages, acceptedMsg],
          updatedAt: 'Signé',
        };

        setViewingContractThread(updated);
        return updated;
      })
    );

    const targetThread = negotiations.find((t) => t.id === threadId);
    if (targetThread) {
      setDossiers((prev) =>
        prev.map((d) =>
          d.id === targetThread.dossierId ? { ...d, status: 'agreement_reached' } : d
        )
      );
    }
  };

  const handleCreateDossier = (newDossier: Dossier) => {
    setDossiers((prev) => [newDossier, ...prev]);
    // Redirect directly into the corresponding tab!
    setActiveTab(newDossier.type as ActiveTab);
  };

  const handleUnlockAccess = (
    plan: 'demandeur' | 'investisseur',
    price: number,
    userEmail?: string
  ) => {
    setHasPaidAccess(true);
    localStorage.setItem('solvapact_has_paid_access', 'true');
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userEmail ? userEmail.split('@')[0] : 'Membre SolvaPact',
      email: userEmail || 'client@solvapact.fr',
      role: plan,
      city: 'France',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      isSubscribed: true,
      subscriptionPlan: plan,
      subscriptionPrice: price,
      subscriptionNextBilling: new Date(
        Date.now() + 30 * 24 * 3600 * 1000
      ).toLocaleDateString('fr-FR'),
    };
    setCurrentUser(newUser);
  };

  const isFounderUser =
    currentUser?.email === 'solvapact.vercel.app@gmail.com' ||
    currentUser?.email === 'hugolaumonier@gmail.com' ||
    sessionStorage.getItem('solvapact_founder_unlocked') === 'true';

  // OBLIGATION DE PAIEMENT POUR ENTRER SUR LE SITE :
  // Si le visiteur n'a pas payé son abonnement et n'est pas le fondateur, le portique payant bloque tout accès !
  if (!hasPaidAccess && !isFounderUser && activeTab !== 'fondateur') {
    return (
      <AccessPaywallGate
        onUnlockAccess={handleUnlockAccess}
        onOpenFounderSpace={() => setActiveTab('fondateur')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Header conforming to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDeposit={() => handleOpenDepositWithType('dette')}
        dossiers={dossiers}
        activeNegotiationCount={negotiations.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* VIEW: EXPLORER / DETTE / INVESTISSEMENT / AUTRE */}
        {(activeTab === 'explorer' ||
          activeTab === 'dette' ||
          activeTab === 'investissement' ||
          activeTab === 'autre') && (
          <div>
            {/* Hero banner shown on explorer */}
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

            <section id="catalogue-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Tab Header Banner */}
              <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {activeTab === 'dette' && 'Onglet 1 · Dettes à régler & Rachats'}
                      {activeTab === 'investissement' && 'Onglet 2 · Demandes d\'investissement & Projets'}
                      {activeTab === 'autre' && 'Onglet 3 · Autres sujets & Besoins divers'}
                      {activeTab === 'explorer' && 'Vue Globale · Tous les dossiers classés'}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeTab === 'dette' && 'Dossiers de rachat & d\'apurement de dette'}
                      {activeTab === 'investissement' && 'Dossiers d\'investissement & financements'}
                      {activeTab === 'autre' && 'Dossiers d\'autres sujets & accompagnements'}
                      {activeTab === 'explorer' && 'Explorez l\'ensemble des dossiers disponibles'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {activeTab === 'dette' &&
                        'Les débiteurs y déposent leurs créances avec proposition de décote ou d\'étalement pour que des créanciers ou investisseurs les rachètent comptant.'}
                      {activeTab === 'investissement' &&
                        'Porteurs de projets, artisans, commerçants ou particuliers cherchant des fonds en contrepartie d\'une rémunération d\'intérêt négociable.'}
                      {activeTab === 'autre' &&
                        'Besoins solidaires, restructurations amiables spécifiques, médiations et projets hors cadre bancaire.'}
                      {activeTab === 'explorer' &&
                        'Chaque dossier créé se classe automatiquement dans l\'un des 3 onglets (Dette, Investissement, Autre sujet). Les investisseurs peuvent échanger directement.'}
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
                    className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0 self-start shadow-xs"
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
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
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
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
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
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
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
                    className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
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

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-slate-400">Trier :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="amount_asc">Montant croissant</option>
                    <option value="amount_desc">Montant décroissant</option>
                  </select>
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
                      onStartNegotiation={(d) => handleStartNegotiation(d)}
                      onDelete={handleDeleteDossier}
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
                    L'application est toute neuve. Dès qu'un utilisateur remplit le formulaire de dépôt, le dossier est automatiquement classé ici et prêt pour les investisseurs.
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
                    className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Déposer un dossier dans cet onglet</span>
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
                <h1 className="text-2xl font-bold text-slate-900">Mes dossiers déposés</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez vos demandes classées dans les onglets Dette, Investissement ou Autre sujet.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {myDossiers.length > 0 && (
                  <button
                    onClick={handleClearAllTests}
                    className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Effacer les tests</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenDepositWithType('dette')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start shadow-xs"
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
                    onStartNegotiation={(d) => handleStartNegotiation(d)}
                    onDelete={handleDeleteDossier}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  Vous n'avez pas encore de dossier actif
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Remplissez le formulaire de dépôt pour publier votre besoin dans l'onglet Dette, Investissement ou Autre sujet.
                </p>
                <button
                  onClick={() => handleOpenDepositWithType('dette')}
                  className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Déposer un dossier</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: NÉGOCIATIONS EN DIRECT */}
        {activeTab === 'negociations' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Espace de Négociation & Accords Amiables
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Échangez directement entre demandeurs et financeurs, formulez des contre-offres et ratifiez des protocoles d'accord juridiquement conformes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {negotiations.length > 0 && (
                  <button
                    onClick={handleClearAllTests}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Effacer les tests</span>
                  </button>
                )}
                <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Commission plateforme de 2% retenue au succès</span>
                </div>
              </div>
            </div>

            <NegotiationRoom
              threads={negotiations}
              activeThreadId={selectedThreadId}
              onSelectThread={(id) => setSelectedThreadId(id)}
              onSendMessage={handleSendMessage}
              onSubmitCounterOffer={handleSubmitCounterOffer}
              onAcceptOffer={handleAcceptOffer}
              onViewContract={(thread) => setViewingContractThread(thread)}
              currentUserRole={userRole}
              onDeleteThread={handleDeleteNegotiation}
            />
          </div>
        )}

        {/* VIEW: SIMULATEUR FINANCIER & 2% */}
        {activeTab === 'simulateur' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FinanceCalculator
              onOpenDepositWithParams={(type, amount, term) => {
                handleOpenDepositWithType(type === 'dette' ? 'dette' : 'investissement');
              }}
            />
          </div>
        )}

        {/* VIEW: ESPACE FONDATEUR (MES 2%) */}
        {activeTab === 'fondateur' && (
          <FounderPayoutView
            signedThreads={signedNegotiations}
            founderEmail={currentUser?.email || 'solvapact.vercel.app@gmail.com'}
          />
        )}

        {/* VIEW: CENTRE D'AIDE & CONTACT */}
        {activeTab === 'aide' && (
          <HelpView onNavigateToTab={setActiveTab} />
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
        onStartNegotiation={(d) => handleStartNegotiation(d)}
      />

      <DepositDossierModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSubmitDossier={handleCreateDossier}
        currentUser={currentUser}
        defaultType={depositDefaultType}
      />

      <ContractModal
        thread={viewingContractThread}
        onClose={() => setViewingContractThread(null)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />

      {/* Clean Unboxed Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900">SolvaPact</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('aide')}
              className="text-slate-600 hover:text-slate-900 underline transition-colors"
            >
              Aide & Contact (solvapact.vercel.app@gmail.com)
            </button>
            <span aria-hidden="true">·</span>
            {isFounderUser && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setActiveTab('fondateur')}
                  className="text-amber-800 hover:text-amber-950 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors"
                >
                  🏦 Espace Fondateur (Saisie IBAN & MRR)
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('solvapact_has_paid_access');
                    setHasPaidAccess(false);
                  }}
                  className="text-slate-400 hover:text-slate-700 underline transition-colors text-[11px]"
                  title="Réactiver le portique de paiement pour vérifier l'expérience d'un nouvel arrivant"
                >
                  🔒 Tester le Portique Payant
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Articles 1892 & 2044 du Code Civil</span>
            <span aria-hidden="true">·</span>
            <span>Prêts & transactions sous seing privé</span>
            <span aria-hidden="true">·</span>
            <span>Confidentialité & Sécurité</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
