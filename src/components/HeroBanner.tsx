import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Send, Building2 } from 'lucide-react';
import heroImage from '../assets/images/madagascar_solvapact_hero_1795018949676.jpg';

interface HeroBannerProps {
  onExplore: () => void;
  onDeposit: () => void;
  onOpenContactInvestors?: () => void;
  totalVolume: string;
  activeCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExplore,
  onDeposit,
  onOpenContactInvestors,
  totalVolume,
  activeCount,
}) => {
  const [imageError, setImageError] = useState(false);
  return (
    <div className="relative bg-gradient-to-b from-slate-950 via-[#0f172a] to-[#111c2d] text-white border-b border-orange-500/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Proposition Madagascar */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 rounded-full bg-orange-500" />
                <span className="text-xs font-bold tracking-wider uppercase text-orange-400">
                  SolvaPact Madagascar · Antananarivo & Diaspora
                </span>
              </div>
              <p className="text-sm sm:text-base font-extrabold tracking-tight text-emerald-400">
                La rencontre directe entre vos projets à Madagascar et ceux qui peuvent agir.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
                <span>Investissements, Parts Sociales &amp; Prêts P2P</span>
                <span aria-hidden="true">·</span>
                <span>Autres sujets &amp; Projets</span>
                <span aria-hidden="true">·</span>
                <span>Accord direct entre vous</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-balance leading-tight">
              Financez vos projets ou trouvez un partenaire en direct à Madagascar.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              SolvaPact réunit porteurs de projets malgaches, entrepreneurs, particuliers et investisseurs locaux ou de la diaspora. Consultez un dossier, échangez en direct via la messagerie ou Gmail / téléphone, puis réalisez vos transferts (MVola, Orange Money, Airtel Money ou virement bancaire) en dehors du site.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onDeposit}
                className="min-h-[44px] px-5 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors shadow-lg shadow-orange-950/40 flex items-center gap-2 cursor-pointer"
              >
                <span>Déposer un dossier</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenContactInvestors && (
                <button
                  onClick={onOpenContactInvestors}
                  className="min-h-[44px] px-5 py-3 text-sm font-bold text-emerald-100 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/30 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Prendre contact (Investisseurs)</span>
                </button>
              )}

              <button
                onClick={onExplore}
                className="min-h-[44px] px-5 py-3 text-sm font-semibold text-slate-100 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Explorer les dossiers ({activeCount})</span>
              </button>
            </div>

            {/* Proof Points Strip */}
            <div className="pt-5 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                  {totalVolume}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Demandes présentées
                </p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
                  100 % net
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accord privé · Transfert direct
                </p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-orange-400 tabular-nums">
                  NIF / Contrats
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accords privés & pièces vérifiées
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Madagascar Hero Visual + Signature Floating White Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900">
              {!imageError ? (
                <img
                  src={heroImage}
                  alt="Entrepreneurs à Antananarivo, Madagascar collaborant sur un projet SolvaPact"
                  onError={() => setImageError(true)}
                  className="w-full h-72 sm:h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-72 sm:h-80 bg-gradient-to-br from-slate-900 via-emerald-950 to-orange-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400/30 text-orange-300 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">SolvaPact Madagascar</p>
                  <p className="text-xs text-slate-300 max-w-xs">
                    Mise en relation directe entre porteurs de projets et investisseurs à Madagascar et dans la diaspora.
                  </p>
                </div>
              )}
              {/* Floating crisp white card mimicking modern Malagasy card style */}
              <div className="bg-white text-slate-900 overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Réseau Madagascar</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-emerald-600 px-4 py-2 text-[11px] font-bold text-white flex items-center justify-between">
                  <span>Plateforme active en temps réel</span>
                  <span>100 % net entre les parties</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
