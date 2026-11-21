import React, { useState } from 'react';
import { Dossier } from '../types';
import { formatAriaryApprox, formatEuro, formatPct, getLoyaltyNameColorClass } from '../utils/finance';
import { ShieldCheck, MessageSquare, Clock, FileText, Trash2, CheckCircle2, Building2 } from 'lucide-react';
import { LoyaltyVerifiedBadge } from './LoyaltyVerifiedBadge';

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
  const isInvest = dossier.type === 'investissement';

  const typeLabel = isInvest ? 'Investissement' : 'Autre sujet';

  const typeColor = isInvest ? 'text-emerald-700' : 'text-orange-600';

  const bottomStripClass = isInvest ? 'bg-emerald-600' : 'bg-orange-600';

  const isDiamond = Boolean(
    dossier.isDiamondPriority || dossier.applicant.loyaltyTier === 'diamond'
  );

  return (
    <div
      className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
        isDiamond
          ? 'border-cyan-300 hover:border-cyan-400 ring-1 ring-cyan-100 shadow-sm'
          : 'border-slate-200 hover:border-orange-300 shadow-xs'
      }`}
    >
      <div className="p-5 flex-1">
        {isDiamond && (
          <div className="text-[11px] font-extrabold text-cyan-700 tracking-wide mb-1.5 flex items-center gap-1.5">
            <span aria-hidden="true">✦</span>
            <span>Membre Prestigieux Officiel · Mise en avant prioritaire</span>
          </div>
        )}

        {/* Unboxed Metadata Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 font-medium min-w-0 truncate">
            <span className={`font-bold shrink-0 ${typeColor}`}>
              [{typeLabel}]
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{dossier.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate font-semibold text-slate-700">{dossier.applicant.city}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 shrink-0">
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
          className="text-base font-extrabold text-slate-900 leading-snug hover:text-orange-600 cursor-pointer line-clamp-2 transition-colors"
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
                  Montant
                </span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums block">
                  {formatEuro(dossier.amountRequested)}
                </span>
                <span className="text-[10px] text-orange-700 font-medium tabular-nums block">
                  {formatAriaryApprox(dossier.amountRequested)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {isParts
                    ? 'Parts cédées'
                    : isRoyalty
                    ? 'Partage revenus'
                    : isHybrid
                    ? 'Taux + Parts'
                    : 'Taux proposé'}
                </span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  {isNoMonthly
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
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
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
        <div className="space-y-1.5 text-xs text-slate-600 mb-2">
          <div className="flex items-start gap-1.5">
            <span className="text-slate-400 font-medium shrink-0">Garantie :</span>
            <span className="text-slate-700 truncate">{dossier.guaranteeType}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
            <div className="inline-flex flex-col leading-tight">
              {dossier.applicant.loyaltyTitle && (
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {dossier.applicant.loyaltyTitle}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className={getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}>
                  {dossier.applicant.pseudonym}
                </span>
                <LoyaltyVerifiedBadge tier={dossier.applicant.loyaltyTier} size="xs" />
              </span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Score {dossier.applicant.riskGrade}
            </span>
            {dossier.verifiedCompany && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Building2 className="w-3.5 h-3.5" />
                  Société vérifiée
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {dossier.documents.length} pièce{dossier.documents.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-4 pt-2 border-t border-slate-100 space-y-2">
        {canMarkAccepted && onMarkAccepted && dossier.status === 'open' && (
          <button
            type="button"
            onClick={() => onMarkAccepted(dossier)}
            className="w-full px-3 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marquer ce dossier comme accepté</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(dossier)}
            className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
          >
            + Voir la page
          </button>

          <button
            onClick={() => onStartNegotiation(dossier)}
            className="flex-1 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Négocier</span>
          </button>
        </div>
      </div>

      {/* Signature Malagasy Colored Bottom Status Strip */}
      <div className={`${bottomStripClass} px-5 py-2 text-white text-[11px] font-bold flex items-center justify-between`}>
        <span>
          {dossier.status === 'agreement_reached'
            ? 'Accord conclu entre membres'
            : dossier.status === 'in_negotiation'
            ? `En négociation (${dossier.offersCount || 1})`
            : isInvest
            ? 'Opportunité ouverte · Accord direct'
            : 'Dossier ouvert · Accord direct'}
        </span>
        <span className="opacity-90">{dossier.applicant.city}</span>
      </div>
    </div>
  );
};
