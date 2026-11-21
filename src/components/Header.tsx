import React from 'react';
import { ActiveTab, User, Dossier } from '../types';
import { getLoyaltyNameColorClass, getLoyaltyStatus } from '../utils/finance';
import { PlusCircle, LogOut, HelpCircle, Award, Compass, BarChart3, Send } from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';
import { LoyaltyVerifiedBadge } from './LoyaltyVerifiedBadge';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDeposit: () => void;
  dossiers: Dossier[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLoyalty: () => void;
  onOpenProfileSettings?: () => void;
  onOpenDailyReport?: () => void;
  unreadIncomingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDeposit,
  dossiers,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenLoyalty,
  onOpenProfileSettings,
  onOpenDailyReport,
  unreadIncomingCount = 0,
}) => {
  const investissementCount = dossiers.filter((d) => d.type === 'investissement').length;
  const autreCount = dossiers.filter((d) => d.type === 'autre').length;
  const loyalty = getLoyaltyStatus(currentUser);
  const nameColorClass = getLoyaltyNameColorClass(loyalty.tier, false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark & Logo Madagascar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('explorer')}
              className="text-left group flex items-center gap-2.5 focus:outline-none cursor-pointer"
              title="SolvaPact Madagascar"
            >
              <div className="relative">
                <img
                  src={solvapactLogo}
                  alt="Logo SolvaPact"
                  className="w-9 h-9 rounded-lg object-contain border border-slate-200/80 shadow-xs bg-white"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-3.5 overflow-hidden rounded-[3px] border border-white shadow-2xs"
                >
                  <span className="w-1 bg-white" />
                  <span className="flex-1 flex flex-col">
                    <span className="h-1/2 bg-[#FC3D32]" />
                    <span className="h-1/2 bg-[#007E3A]" />
                  </span>
                </span>
              </div>
              <div className="leading-none">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors block">
                  SolvaPact
                </span>
                <span className="text-[10px] font-bold text-orange-600 tracking-wide">
                  Madagascar
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('decouverte')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'decouverte'
                  ? 'text-emerald-900 font-bold border-b-2 border-emerald-800'
                  : ''
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Découvrir</span>
            </button>

            <button
              onClick={() => setActiveTab('investissement')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'investissement'
                  ? 'text-emerald-900 font-bold border-b-2 border-emerald-800'
                  : ''
              }`}
            >
              <span>Investissements</span>
              <span className="text-[11px] text-emerald-700 font-mono tabular-nums">
                ({investissementCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('autre')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'autre'
                  ? 'text-orange-600 font-bold border-b-2 border-orange-600'
                  : ''
              }`}
            >
              <span>Autres sujets</span>
              <span className="text-[11px] text-orange-600 font-mono tabular-nums">
                ({autreCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prendre_contact')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'prendre_contact'
                  ? 'text-orange-600 font-bold border-b-2 border-orange-600'
                  : ''
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Prendre contact</span>
              {unreadIncomingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px] font-bold leading-tight tabular-nums">
                  {unreadIncomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('simulateur')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 cursor-pointer ${
                activeTab === 'simulateur'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Simulateur
            </button>

            <button
              onClick={() => setActiveTab('mes_dossiers')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 cursor-pointer ${
                activeTab === 'mes_dossiers'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Mes dossiers
            </button>

            <button
              onClick={() => setActiveTab('aide')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'aide'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-800'
                  : 'text-slate-600'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Aide & IA</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action + Loyalty + Auth */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenProfileSettings}
                  title="Modifier mon statut (Demandeur / Investisseur) et ma lettre de consentement"
                  className="hidden sm:flex flex-col text-right text-xs px-2.5 py-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                >
                  {loyalty.active && loyalty.badgeTitle && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                      {loyalty.badgeTitle}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-end gap-1 leading-tight">
                    <span className={`${nameColorClass} max-w-[148px] truncate`}>
                      {currentUser.name}
                    </span>
                    {loyalty.active && (
                      <LoyaltyVerifiedBadge tier={loyalty.tier} size="xs" />
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[165px]">
                    {currentUser.role === 'investisseur' ? 'Investisseur' : 'Demandeur'} · {currentUser.city}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Déconnexion"
                  aria-label="Déconnexion"
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Connexion
              </button>
            )}

            {/* Owner-only Private Daily Report Button (never rendered for clients) */}
            {onOpenDailyReport && (
              <button
                type="button"
                onClick={onOpenDailyReport}
                title="Rendu privé de fin de journée"
                className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bilan jour</span>
              </button>
            )}

            {/* Discreet Loyalty Account Button (no loud tier text displayed) */}
            <button
              onClick={onOpenLoyalty}
              className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer ${
                loyalty.active
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Compte Fidélité</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Déposer un dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tablet / Mobile subbar */}
      <div className="xl:hidden flex items-center justify-start sm:justify-around overflow-x-auto thin-scrollbar border-t border-orange-100 px-2 py-1.5 bg-[#faf6f0] text-xs gap-1.5">
        <button
          onClick={() => setActiveTab('decouverte')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'decouverte'
              ? 'font-bold text-emerald-900 border-b-2 border-emerald-900'
              : 'text-slate-600'
          }`}
        >
          Découvrir
        </button>
        <button
          onClick={() => setActiveTab('investissement')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'investissement'
              ? 'font-bold text-emerald-900 border-b-2 border-emerald-900'
              : 'text-slate-600'
          }`}
        >
          Invest. ({investissementCount})
        </button>
        <button
          onClick={() => setActiveTab('autre')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'autre' ? 'font-bold text-orange-600 border-b-2 border-orange-600' : 'text-slate-600'
          }`}
        >
          Autres ({autreCount})
        </button>
        <button
          onClick={() => setActiveTab('prendre_contact')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeTab === 'prendre_contact'
              ? 'font-bold text-orange-600 border-b-2 border-orange-600'
              : 'text-slate-600'
          }`}
        >
          <span>Prendre contact</span>
          {unreadIncomingCount > 0 && (
            <span className="px-1.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
              {unreadIncomingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('simulateur')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'simulateur' ? 'font-bold text-slate-900 border-b-2 border-slate-900' : 'text-slate-600'
          }`}
        >
          Simulateur
        </button>
        <button
          onClick={() => setActiveTab('mes_dossiers')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'mes_dossiers' ? 'font-bold text-slate-900 border-b-2 border-slate-900' : 'text-slate-600'
          }`}
        >
          Mes dossiers
        </button>
        <button
          onClick={onOpenLoyalty}
          className="min-h-[36px] py-1 px-2.5 whitespace-nowrap text-amber-800 font-semibold cursor-pointer"
        >
          Fidélité
        </button>
        {currentUser && onOpenProfileSettings && (
          <button
            onClick={onOpenProfileSettings}
            className="min-h-[36px] py-1 px-2.5 whitespace-nowrap text-slate-700 font-semibold cursor-pointer"
          >
            Mon profil
          </button>
        )}
        {onOpenDailyReport && (
          <button
            onClick={onOpenDailyReport}
            className="min-h-[36px] py-1 px-2.5 whitespace-nowrap text-slate-800 font-bold cursor-pointer"
          >
            Bilan
          </button>
        )}
        <button
          onClick={() => setActiveTab('aide')}
          className={`min-h-[36px] py-1 px-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'aide' ? 'font-bold text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-600'
          }`}
        >
          Aide &amp; IA
        </button>
      </div>
    </header>
  );
};
