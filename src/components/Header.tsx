import React from 'react';
import { ActiveTab, User, Dossier } from '../types';
import { getLoyaltyNameColorClass, getLoyaltyStatus } from '../utils/finance';
import { PlusCircle, LogOut, HelpCircle, Award, Compass, BarChart3 } from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDeposit: () => void;
  dossiers: Dossier[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLoyalty: () => void;
  onOpenDailyReport?: () => void;
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
  onOpenDailyReport,
}) => {
  const detteCount = dossiers.filter((d) => d.type === 'dette').length;
  const investissementCount = dossiers.filter((d) => d.type === 'investissement').length;
  const autreCount = dossiers.filter((d) => d.type === 'autre').length;
  const loyalty = getLoyaltyStatus(currentUser);
  const nameColorClass = getLoyaltyNameColorClass(loyalty.tier, false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('explorer')}
              className="text-left group flex items-center gap-2.5 focus:outline-none cursor-pointer"
              title="SolvaPact"
            >
              <img
                src={solvapactLogo}
                alt="Logo SolvaPact"
                className="w-9 h-9 rounded-lg object-contain border border-slate-200/80 shadow-xs bg-white"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                SolvaPact
              </span>
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
              onClick={() => setActiveTab('dette')}
              className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'dette'
                  ? 'text-amber-900 font-bold border-b-2 border-amber-800'
                  : ''
              }`}
            >
              <span>Dettes</span>
              <span className="text-[11px] text-amber-700 font-mono tabular-nums">
                ({detteCount})
              </span>
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
              className={`hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'autre'
                  ? 'text-indigo-900 font-bold border-b-2 border-indigo-800'
                  : ''
              }`}
            >
              <span>Autres sujets</span>
              <span className="text-[11px] text-indigo-700 font-mono tabular-nums">
                ({autreCount})
              </span>
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
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1.5 flex items-center gap-1 cursor-pointer ${
                activeTab === 'aide'
                  ? 'text-blue-900 font-bold border-b-2 border-blue-900'
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
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className={`${nameColorClass} leading-tight max-w-[140px] truncate`}>
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                    {currentUser.profession || currentUser.role} · {currentUser.city}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Déconnexion"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Déposer un dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tablet / Mobile subbar */}
      <div className="xl:hidden flex items-center justify-around overflow-x-auto border-t border-slate-200 px-2 py-2 bg-slate-50 text-xs gap-2">
        <button
          onClick={() => setActiveTab('decouverte')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'decouverte'
              ? 'font-bold text-emerald-900 border-b-2 border-emerald-900'
              : 'text-slate-600'
          }`}
        >
          Découvrir
        </button>
        <button
          onClick={() => setActiveTab('dette')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'dette' ? 'font-bold text-amber-900 border-b-2 border-amber-900' : 'text-slate-600'
          }`}
        >
          Dettes ({detteCount})
        </button>
        <button
          onClick={() => setActiveTab('investissement')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'investissement'
              ? 'font-bold text-emerald-900 border-b-2 border-emerald-900'
              : 'text-slate-600'
          }`}
        >
          Invest. ({investissementCount})
        </button>
        <button
          onClick={() => setActiveTab('autre')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'autre' ? 'font-bold text-indigo-900 border-b-2 border-indigo-900' : 'text-slate-600'
          }`}
        >
          Autre ({autreCount})
        </button>
        <button
          onClick={() => setActiveTab('simulateur')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'simulateur' ? 'font-bold text-slate-900 border-b-2 border-slate-900' : 'text-slate-600'
          }`}
        >
          Simulateur
        </button>
        <button
          onClick={() => setActiveTab('mes_dossiers')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'mes_dossiers' ? 'font-bold text-slate-900 border-b-2 border-slate-900' : 'text-slate-600'
          }`}
        >
          Mes dossiers
        </button>
        <button
          onClick={onOpenLoyalty}
          className="py-1 px-2 whitespace-nowrap text-amber-800 font-semibold"
        >
          Fidélité
        </button>
        <button
          onClick={() => setActiveTab('aide')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'aide' ? 'font-bold text-blue-900 border-b-2 border-blue-900' : 'text-slate-600'
          }`}
        >
          Aide & IA
        </button>
      </div>
    </header>
  );
};
