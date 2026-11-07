import React from 'react';
import { Dossier } from '../types';
import { formatEuro, formatPct } from '../utils/finance';
import { ShieldCheck, MessageSquare, ArrowRight, Clock, FileText, Trash2 } from 'lucide-react';

interface DossierCardProps {
  dossier: Dossier;
  onSelect: (dossier: Dossier) => void;
  onStartNegotiation: (dossier: Dossier) => void;
  onDelete?: (dossierId: string) => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({
  dossier,
  onSelect,
  onStartNegotiation,
  onDelete,
}) => {
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all hover:shadow-sm flex flex-col justify-between">
      <div>
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Voulez-vous supprimer ce dossier de test ?')) {
                    onDelete(dossier.id);
                  }
                }}
                title="Supprimer ce dossier"
                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
              {isDebt ? 'Décote / Taux' : 'Taux proposé'}
            </span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {isDebt && dossier.targetDiscount
                ? `-${dossier.targetDiscount}% décote`
                : dossier.targetInterestRate
                ? formatPct(dossier.targetInterestRate)
                : 'À débattre'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              sur {dossier.termMonths} mois
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Mensualité max
            </span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {formatEuro(dossier.maxMonthlyPayment)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              / mois déclarée
            </span>
          </div>
        </div>

        {/* Guarantees and Verification Row */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-start gap-1.5">
            <span className="text-slate-400 font-medium shrink-0">Garantie :</span>
            <span className="text-slate-700 truncate">{dossier.guaranteeType}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Identité vérifiée
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {dossier.documents.length} justificatifs déposés
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onSelect(dossier)}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-center"
        >
          Consulter le dossier
        </button>

        <button
          onClick={() => onStartNegotiation(dossier)}
          className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Négocier</span>
        </button>
      </div>
    </div>
  );
};
