import React, { useState, useEffect } from 'react';
import { Dossier } from '../types';
import {
  formatEuro,
  formatPct,
  calculateMonthlyPayment,
  calculateTotalInterest,
  generateAmortizationSchedule,
  calculateEffortRate,
  getLoyaltyNameColorClass,
} from '../utils/finance';
import {
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Mail,
} from 'lucide-react';

interface DossierDetailModalProps {
  dossier: Dossier | null;
  onClose: () => void;
  onOpenContact: (dossier: Dossier) => void;
  canMarkAccepted?: boolean;
  onMarkAccepted?: (dossier: Dossier) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  onClose,
  onOpenContact,
  canMarkAccepted = false,
  onMarkAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'echeancier' | 'documents'>('details');

  useEffect(() => {
    setActiveTab('details');
  }, [dossier?.id]);

  if (!dossier) return null;

  const isDebt = dossier.type === 'dette';
  const effortRate = calculateEffortRate(
    dossier.applicant.monthlyIncome,
    dossier.applicant.existingCharges,
    dossier.maxMonthlyPayment
  );
  const interestRate = dossier.targetInterestRate || 6.0;
  const monthlyCalculated = calculateMonthlyPayment(
    dossier.amountRequested,
    interestRate,
    dossier.termMonths
  );
  const totalInterest = calculateTotalInterest(
    dossier.amountRequested,
    monthlyCalculated,
    dossier.termMonths
  );
  const schedule = generateAmortizationSchedule(
    dossier.amountRequested,
    interestRate,
    dossier.termMonths
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <span
                className={
                  isDebt
                    ? 'text-amber-700'
                    : dossier.type === 'investissement'
                    ? 'text-emerald-700'
                    : 'text-indigo-700'
                }
              >
                {isDebt
                  ? 'Dossier de rachat ou apurement de dette'
                  : dossier.type === 'investissement'
                  ? 'Dossier de financement de projet'
                  : 'Dossier autre sujet'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{dossier.category}</span>
              <span aria-hidden="true">·</span>
              <span>Déposé le {dossier.createdAt}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {dossier.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Présentation & Garanties
          </button>
          <button
            onClick={() => setActiveTab('echeancier')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'echeancier'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulation de remboursement ({dossier.termMonths} mois)
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'documents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pièces justificatives ({dossier.documents.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'details' && (
            <>
              {/* Financial Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    {isDebt ? 'Montant à racheter' : 'Montant demandé'}
                  </span>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatEuro(dossier.amountRequested)}
                  </p>
                  {isDebt && dossier.originalDebtAmount && (
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      Initial : {formatEuro(dossier.originalDebtAmount)}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    {isDebt ? 'Décote visée' : 'Taux annuel ciblé'}
                  </span>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {isDebt && dossier.targetDiscount
                      ? `-${dossier.targetDiscount} %`
                      : dossier.targetInterestRate
                      ? formatPct(dossier.targetInterestRate)
                      : 'Négociable'}
                  </p>
                  <span className="text-xs text-slate-500">Taux fixe négociable</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Durée souhaitée
                  </span>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {dossier.termMonths} mois
                  </p>
                  <span className="text-xs text-slate-500">
                    {(dossier.termMonths / 12).toFixed(1)} ans
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Mensualité maximale
                  </span>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatEuro(dossier.maxMonthlyPayment)}
                  </p>
                  <span className="text-xs text-slate-500">Capacité déclarée</span>
                </div>
              </div>

              {/* Direct Negotiation Notice */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 py-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                <span className="font-medium">
                  0 % de commission SolvaPact · Cliquez sur « Négocier » pour obtenir les coordonnées directes du créateur (Gmail, e-mail, téléphone).
                </span>
              </div>

              {/* Context Story */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Exposé du projet ou de la situation de dette
                </h4>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {dossier.contextStory}
                </div>
              </div>

              {/* Applicant Profile */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Profil du demandeur & Solvabilité déclarée
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/60 border border-slate-200">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pseudonyme affiché :</span>
                      <span className={getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}>
                        {dossier.applicant.pseudonym}
                      </span>
                    </div>
                    {(dossier.isDiamondPriority || dossier.applicant.loyaltyTier === 'diamond') && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Statut Fidélité :</span>
                        <span className="font-extrabold text-cyan-700">
                          Membre Officiel Fidèle Diamond
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Activité / Profession :</span>
                      <span className="font-semibold text-slate-900">
                        {dossier.applicant.profession}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Localisation :</span>
                      <span className="font-semibold text-slate-900">
                        {dossier.applicant.city}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Revenus nets mensuels :</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatEuro(dossier.applicant.monthlyIncome)} / mois
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Charges fixes actuelles :</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatEuro(dossier.applicant.existingCharges)} / mois
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Taux d'effort estimé :</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          effortRate <= 35
                            ? 'text-emerald-700'
                            : effortRate <= 45
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {effortRate}% ({effortRate <= 35 ? 'Sain' : effortRate <= 45 ? 'Modéré' : 'Élevé'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Garanties et sûretés apportées
                </h4>
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      {dossier.guaranteeType}
                    </p>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      La garantie sera inscrite formellement dans le protocole sous seing privé établi directement entre vous.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'echeancier' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Mensualité théorique estimée :</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatEuro(monthlyCalculated)} / mois
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Intérêts totaux reversés :</span>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">
                    +{formatEuro(totalInterest)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total remboursé :</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatEuro(dossier.amountRequested + totalInterest)}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Mois</th>
                      <th className="py-2.5 px-3 text-right">Mensualité</th>
                      <th className="py-2.5 px-3 text-right">Part Capital</th>
                      <th className="py-2.5 px-3 text-right">Part Intérêts</th>
                      <th className="py-2.5 px-3 text-right">Capital restant dû</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedule.slice(0, 12).map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-900 tabular-nums">
                          Mois {row.month}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900 tabular-nums">
                          {formatEuro(row.payment)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                          {formatEuro(row.principalPaid)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 tabular-nums">
                          {formatEuro(row.interestPaid)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                          {formatEuro(row.remainingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dossier.termMonths > 12 && (
                  <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
                    Affichage des 12 premières échéances sur {dossier.termMonths} mois au total.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pièces déposées par le créateur du dossier. Vous pouvez également demander des documents complémentaires lors de votre échange par e-mail ou téléphone.
              </p>

              {dossier.documents.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {dossier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{doc.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.size} · Déposé le {doc.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Joint
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                  Aucune pièce jointe pour le moment. Contactez directement le créateur pour lui demander ses justificatifs.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canMarkAccepted && onMarkAccepted && dossier.status === 'open' && (
              <button
                type="button"
                onClick={() => onMarkAccepted(dossier)}
                className="px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dossier accepté</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenContact(dossier);
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Négocier (Voir les coordonnées de contact)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
