import React, { useState } from 'react';
import { Dossier } from '../types';
import { formatEuro, formatPct, getLoyaltyNameColorClass } from '../utils/finance';
import { ShieldCheck, MessageSquare, Clock, FileText, Trash2, CheckCircle2 } from 'lucide-react';

interface DossierCardProps {
  dossier: Dossier;
  onSelect: (dossier: Dossier) => void;
  onStartNegotiation: (dossier: Dossier) => void;
  onDelete?: (dossierId: string) => void;
  canMarkAccepted?: boolean;
  onMarkAccepted?: (dossier: Dossier) => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({
  dossier,
  onSelect,
  onStartNegotiation,
  onDelete,
  canMarkAccepted = false,
  onMarkAccepted,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDebt = dossier.type === 'dette';
  const isInvest = dossier.type === 'investissement';
  const isOther = dossier.type === 'autre';

  const typeLabel = isDebt
    ? 'Dette à régler'
    : isInvest
    ? 'Investissement'
    : 'Autre sujet';

  const typeColor = isDebt
    ? 'text-amber-800'
    : isInvest
    ? 'text-emerald-800'
    : 'text-indigo-800';

  const isDiamond = Boolean(
    dossier.isDiamondPriority || dossier.applicant.loyaltyTier === 'diamond'
  );

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all hover:shadow-sm flex flex-col justify-between ${
        isDiamond
          ? 'border-cyan-300 hover:border-cyan-400 ring-1 ring-cyan-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {isDiamond && (
          <div className="text-[11px] font-extrabold text-cyan-700 tracking-wide mb-1.5 flex items-center gap-1.5">
            <span aria-hidden="true">✦</span>
            <span>Membre Prestigieux Officiel · Mise en avant prioritaire</span>
          </div>
        )}
        {/* Unboxed Metadata Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span className={`font-bold ${typeColor}`}>
              [{typeLabel}]
            </span>
            <span aria-hidden="true">·</span>
            <span>{dossier.category}</span>
            <span aria-hidden="true">·</span>
            <span>{dossier.applicant.city}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{dossier.createdAt}</span>
            </div>
            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDelete(dossier.id)}
                    className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-800 rounded transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  title="Supprimer ce dossier"
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(dossier)}
          className="text-base font-bold text-slate-900 leading-snug hover:text-slate-700 cursor-pointer line-clamp-2"
        >
          {dossier.title}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {dossier.description}
        </p>

        {/* Financial KPI Grid */}
        {(() => {
          const isParts = dossier.investmentReturnMode === 'parts_sociales';
          const isRoyalty = dossier.investmentReturnMode === 'redevance_ca';
          const isHybrid = dossier.investmentReturnMode === 'hybride';
          const isNoMonthly = isParts || isRoyalty;

          return (
            <div className="grid grid-cols-3 gap-2 py-3.5 my-3.5 border-y border-slate-100 text-left">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {isDebt ? 'Rachat visé' : 'Montant demandé'}
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(dossier.amountRequested)}
                </span>
                {isDebt && dossier.originalDebtAmount && (
                  <span className="text-[11px] text-slate-400 line-through block tabular-nums">
                    {formatEuro(dossier.originalDebtAmount)}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {isDebt
                    ? 'Décote / Taux'
                    : isParts
                    ? 'Parts cédées'
                    : isRoyalty
                    ? 'Partage revenus'
                    : isHybrid
                    ? 'Taux + Parts'
                    : 'Taux proposé'}
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {isDebt && dossier.targetDiscount
                    ? `-${dossier.targetDiscount}% décote`
                    : isNoMonthly
                    ? `${dossier.equityPercentage || 15} %`
                    : isHybrid
                    ? `${dossier.targetInterestRate ? formatPct(dossier.targetInterestRate) : 'Mixte'} + ${dossier.equityPercentage || 10}%`
                    : dossier.targetInterestRate
                    ? formatPct(dossier.targetInterestRate)
                    : 'À débattre'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {isParts ? 'Entrée au capital' : `sur ${dossier.termMonths} mois`}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {isNoMonthly ? 'Contrepartie' : 'Mensualité max'}
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {isNoMonthly ? '0 € / mois' : formatEuro(dossier.maxMonthlyPayment)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {isParts
                    ? 'Dividendes / Parts'
                    : isRoyalty
                    ? 'Selon recettes'
                    : '/ mois déclarée'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Guarantees and Verification Row */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-start gap-1.5">
            <span className="text-slate-400 font-medium shrink-0">Garantie :</span>
            <span className="text-slate-700 truncate">{dossier.guaranteeType}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
            <div className="inline-flex flex-col leading-tight">
              {dossier.applicant.loyaltyTitle && (
                <span className={`${getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)} text-[9px] uppercase tracking-wider`}>
                  {dossier.applicant.loyaltyTitle}
                </span>
              )}
              <span className={getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}>
                {dossier.applicant.pseudonym}
              </span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Score {dossier.applicant.riskGrade}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {dossier.documents.length} justificatif{dossier.documents.length > 1 ? 's' : ''}
            </span>
            {(dossier.status === 'funded' || dossier.status === 'agreement_reached') && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-emerald-700">
                  {dossier.status === 'agreement_reached' ? 'Accepté' : 'Financé'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {canMarkAccepted && onMarkAccepted && dossier.status === 'open' && (
          <button
            type="button"
            onClick={() => onMarkAccepted(dossier)}
            className="w-full px-3 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marquer ce dossier comme accepté</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(dossier)}
            className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-center cursor-pointer"
          >
            Consulter le dossier
          </button>

          <button
            onClick={() => onStartNegotiation(dossier)}
            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Négocier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
