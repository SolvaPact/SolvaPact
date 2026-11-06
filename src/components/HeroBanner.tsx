import React from 'react';
import { ArrowRight, ShieldCheck, Scale, HandCoins } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
  onDeposit: () => void;
  totalVolume: string;
  activeCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExplore,
  onDeposit,
  totalVolume,
  activeCount,
}) => {
  return (
    <div className="relative bg-white border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Plateforme P2P de Financement Direct</span>
              <span aria-hidden="true">·</span>
              <span>Rachat & Apurement de Dettes</span>
              <span aria-hidden="true">·</span>
              <span>Accords Amiables</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
              Obtenez un financement ou réglez vos dettes en direct avec des investisseurs.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              SolvaPact met en relation directe porteurs de projets, personnes en quête de trésorerie ou cherchant à solder une dette avec des prêteurs et investisseurs privés. Échangez, négociez les taux ou les décotes, et formalisez un protocole d'accord sécurisé.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onDeposit}
                className="px-5 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Déposer un dossier</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExplore}
                className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Explorer les dossiers en cours ({activeCount})</span>
              </button>
            </div>

            {/* Proof Points Strip */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                  {totalVolume}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Engagés & restructurés
                </p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                  100 %
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Négociation directe sans intermédiaire
                </p>
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                  Code Civil
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protocoles & prêts sous seing privé
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
              <img
                src="/src/assets/images/fin_hero_collaboration_1793977326033.jpg"
                alt="Négociation financière et signature d'accord amiable"
                className="w-full h-80 sm:h-96 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dossiers vérifiés & garanties déclarées</span>
                  </div>
                  <span className="text-slate-400">Anonymat protégé jusqu'à accord</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
