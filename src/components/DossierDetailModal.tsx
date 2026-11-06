import React, { useState } from 'react';
import { Dossier } from '../types';
import {
  formatEuro,
  formatPct,
  calculateMonthlyPayment,
  calculateTotalInterest,
  generateAmortizationSchedule,
} from '../utils/finance';
import {
  X,
  ShieldCheck,
  FileText,
  User,
  Building,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Scale,
  Download,
} from 'lucide-react';

interface DossierDetailModalProps {
  dossier: Dossier | null;
  onClose: () => void;
  onStartNegotiation: (dossier: Dossier) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  onClose,
  onStartNegotiation,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'echeancier' | 'documents'>('details');

  if (!dossier) return null;

  const isDebt = dossier.type === 'dette';
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
              <span className={isDebt ? 'text-amber-700' : 'text-emerald-700'}>
                {isDebt ? 'Dossier de rachat ou apurement de dette' : 'Dossier de financement de projet'}
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
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Présentation & Garanties
          </button>
          <button
            onClick={() => setActiveTab('echeancier')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'echeancier'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulation de remboursement ({dossier.termMonths} mois)
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
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

              {/* 2% Commission indication */}
              <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-950">
                <span className="font-medium">
                  Commission de sécurisation de la transaction (2%) :
                </span>
                <span className="font-bold tabular-nums">
                  {formatEuro(Math.round(dossier.amountRequested * 0.02))}
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
                      <span className="text-slate-500">Pseudonyme anonymisé :</span>
                      <span className="font-semibold text-slate-900">
                        {dossier.applicant.pseudonym}
                      </span>
                    </div>
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
                      <span className="text-slate-500">Taux d'effort restant :</span>
                      <span className="font-semibold text-emerald-700 tabular-nums">
                        {Math.round(
                          ((dossier.maxMonthlyPayment + dossier.applicant.existingCharges) /
                            dossier.applicant.monthlyIncome) *
                            100
                        )}
                        % (Sain)
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
                      La garantie sera inscrite formellement dans le protocole sous seing privé (ou acte authentique notarié si gage ou nantissement de fonds).
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
                Ces pièces ont été téléchargées par le demandeur et font l'objet d'un contrôle de cohérence. Elles seront annexées au contrat final.
              </p>

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
                        Conforme
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Fermer
          </button>

          <button
            onClick={() => {
              onClose();
              onStartNegotiation(dossier);
            }}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Engager la discussion & Faire une offre</span>
          </button>
        </div>
      </div>
    </div>
  );
};
