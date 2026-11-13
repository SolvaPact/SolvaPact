import React from 'react';
import { Dossier, DossierType } from '../types';
import { formatEuro, formatPct, getLoyaltyNameColorClass } from '../utils/finance';
import {
  Banknote,
  FolderOpen,
  Inbox,
  MessageSquare,
  PiggyBank,
  PlusCircle,
} from 'lucide-react';

interface MarketTrustSectionProps {
  dossiers: Dossier[];
  onSelectDossier: (dossier: Dossier) => void;
  onStartNegotiation: (dossier: Dossier) => void;
  onOpenDepositWithType: (type: DossierType) => void;
}

interface ColumnConfig {
  type: DossierType;
  title: string;
  subtitle: string;
  accentBorder: string;
  headerBg: string;
  titleColor: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const COLUMNS: ColumnConfig[] = [
  {
    type: 'autre',
    title: 'Autres sujets',
    subtitle: 'Solidarité, litiges & besoins divers',
    accentBorder: 'border-indigo-200',
    headerBg: 'bg-indigo-50/70',
    titleColor: 'text-indigo-900',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    Icon: FolderOpen,
  },
  {
    type: 'investissement',
    title: 'Investissements',
    subtitle: 'Projets, matériel & trésorerie',
    accentBorder: 'border-emerald-200',
    headerBg: 'bg-emerald-50/70',
    titleColor: 'text-emerald-900',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    Icon: PiggyBank,
  },
  {
    type: 'dette',
    title: 'Dettes à régler',
    subtitle: 'Rachats amiables & apurements',
    accentBorder: 'border-amber-200',
    headerBg: 'bg-amber-50/70',
    titleColor: 'text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800',
    Icon: Banknote,
  },
];

export const MarketTrustSection: React.FC<MarketTrustSectionProps> = ({
  dossiers,
  onSelectDossier,
  onStartNegotiation,
  onOpenDepositWithType,
}) => {
  return (
    <section className="bg-slate-50 border-b border-slate-200 py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 3 Scrollable Dossier Lanes: Autre (Left) | Investissement (Middle) | Dette (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {COLUMNS.map((col) => {
            const list = dossiers.filter((d) => d.type === col.type);
            const Icon = col.Icon;

            return (
              <div
                key={col.type}
                className={`bg-white rounded-2xl border ${col.accentBorder} shadow-2xs flex flex-col overflow-hidden`}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-slate-100 ${col.headerBg} flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${col.titleColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-extrabold truncate ${col.titleColor}`}>
                          {col.title}
                        </h3>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${col.badgeClass}`}>
                          {list.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{col.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDepositWithType(col.type)}
                    title={`Déposer un dossier (${col.title})`}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Déposer</span>
                  </button>
                </div>

                {/* Vertically Scrollable Dossier Feed */}
                <div className="p-4 space-y-3 overflow-y-auto max-h-[380px] min-h-[240px] flex-1 bg-slate-50/40">
                  {list.length > 0 ? (
                    list.map((dossier) => (
                      <div
                        key={dossier.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className={getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}>
                            {dossier.applicant.pseudonym}
                          </span>
                          <span>{dossier.applicant.city}</span>
                        </div>

                        <h4
                          onClick={() => onSelectDossier(dossier)}
                          className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-slate-700 cursor-pointer"
                        >
                          {dossier.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="font-extrabold text-slate-900 font-mono tabular-nums">
                            {formatEuro(dossier.amountRequested)}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {dossier.type === 'dette' && dossier.targetDiscount
                              ? `-${dossier.targetDiscount}%`
                              : dossier.targetInterestRate
                              ? formatPct(dossier.targetInterestRate)
                              : `${dossier.termMonths} mois`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => onSelectDossier(dossier)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Consulter
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartNegotiation(dossier)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Négocier</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
                      <Inbox className="w-7 h-7 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-500">
                        Aucun dossier {col.title.toLowerCase()} pour le moment
                      </p>
                      <p className="text-[11px] mt-1">
                        Les dossiers publiés défileront directement ici.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
