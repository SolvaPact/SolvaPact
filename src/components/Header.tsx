import React from 'react';
import { ActiveTab, User, Dossier } from '../types';
import { ShieldCheck, PlusCircle, LogOut, Coins, HelpCircle } from 'lucide-react';
import solvapactLogo from '../assets/images/solvapact_logo_1793983769514.jpg';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDeposit: () => void;
  dossiers: Dossier[];
  activeNegotiationCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDeposit,
  dossiers,
  activeNegotiationCount,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const detteCount = dossiers.filter((d) => d.type === 'dette').length;
  const investissementCount = dossiers.filter((d) => d.type === 'investissement').length;
  const autreCount = dossiers.filter((d) => d.type === 'autre').length;

  const isFounder =
    !!currentUser &&
    (currentUser.email === 'solvapact.vercel.app@gmail.com' ||
      currentUser.email === 'hugolaumonier@gmail.com' ||
      currentUser.name.toLowerCase().includes('hugo'));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('explorer')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
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

          {/* Zone 2: Navigation Links featuring the 3 core tabs: Dette, Investissement, Autre sujet */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            {/* Onglet 1: Dette */}
            <button
              onClick={() => setActiveTab('dette')}
              className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'dette'
                  ? 'text-amber-900 font-bold border-b-2 border-amber-800'
                  : ''
              }`}
            >
              <span>Onglet Dette</span>
              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                {detteCount}
              </span>
            </button>

            {/* Onglet 2: Investissement */}
            <button
              onClick={() => setActiveTab('investissement')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'investissement'
                  ? 'text-emerald-900 font-bold border-b-2 border-emerald-800'
                  : ''
              }`}
            >
              <span>Onglet Investissement</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                {investissementCount}
              </span>
            </button>

            {/* Onglet 3: Autre sujet */}
            <button
              onClick={() => setActiveTab('autre')}
              className={`hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'autre'
                  ? 'text-indigo-900 font-bold border-b-2 border-indigo-800'
                  : ''
              }`}
            >
              <span>Onglet Autre sujet</span>
              <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                {autreCount}
              </span>
            </button>

            {/* Négociations */}
            <button
              onClick={() => setActiveTab('negociations')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 relative ${
                activeTab === 'negociations'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Négociations
              {activeNegotiationCount > 0 && (
                <span className="ml-1 text-xs text-slate-500 tabular-nums">
                  ({activeNegotiationCount})
                </span>
              )}
            </button>

            {/* Simulateur */}
            <button
              onClick={() => setActiveTab('simulateur')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'simulateur'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Simulateur & 2%
            </button>

            {/* Mes dossiers */}
            <button
              onClick={() => setActiveTab('mes_dossiers')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'mes_dossiers'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Mes dossiers
            </button>

            {/* Espace Fondateur (Réservé au compte Fondateur / Administrateur) */}
            {isFounder && (
              <button
                onClick={() => setActiveTab('fondateur')}
                className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                  activeTab === 'fondateur'
                    ? 'text-amber-900 font-bold border-b-2 border-amber-800'
                    : 'text-amber-700'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Espace Fondateur (Mes 2%)</span>
              </button>
            )}

            {/* Aide & Contact */}
            <button
              onClick={() => setActiveTab('aide')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'aide'
                  ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                  : 'text-slate-600'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Aide</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action + Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className="font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {currentUser.city} · {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Déconnexion"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Connexion / Inscription
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Déposer un dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile subbar with the 3 main tabs */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200 px-2 py-2 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('dette')}
          className={`py-1 px-2 ${activeTab === 'dette' ? 'font-bold text-amber-900 border-b-2 border-amber-900' : 'text-slate-600'}`}
        >
          Dette ({detteCount})
        </button>
        <button
          onClick={() => setActiveTab('investissement')}
          className={`py-1 px-2 ${activeTab === 'investissement' ? 'font-bold text-emerald-900 border-b-2 border-emerald-900' : 'text-slate-600'}`}
        >
          Investissement ({investissementCount})
        </button>
        <button
          onClick={() => setActiveTab('autre')}
          className={`py-1 px-2 ${activeTab === 'autre' ? 'font-bold text-indigo-900 border-b-2 border-indigo-900' : 'text-slate-600'}`}
        >
          Autre ({autreCount})
        </button>
        <button
          onClick={() => setActiveTab('negociations')}
          className={`py-1 px-2 ${activeTab === 'negociations' ? 'font-bold text-slate-900' : 'text-slate-600'}`}
        >
          Négos ({activeNegotiationCount})
        </button>
        <button
          onClick={() => setActiveTab('aide')}
          className={`py-1 px-2 ${activeTab === 'aide' ? 'font-bold text-blue-900 border-b-2 border-blue-900' : 'text-slate-600'}`}
        >
          Aide
        </button>
      </div>
    </header>
  );
};
