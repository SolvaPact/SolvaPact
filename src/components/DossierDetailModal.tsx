import React, { useState, useEffect } from 'react';
import { AttachmentUploadPayload, Dossier } from '../types';
import {
  formatEuro,
  formatAriaryApprox,
  formatPct,
  calculateMonthlyPayment,
  calculateTotalInterest,
  generateAmortizationSchedule,
  calculateEffortRate,
  getLoyaltyNameColorClass,
} from '../utils/finance';
import { fetchDossierAttachments } from '../services/firestoreService';
import { useModalEscape } from '../utils/useModalEscape';
import {
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Mail,
  Download,
  Building2,
  Trash2,
} from 'lucide-react';

interface DossierDetailModalProps {
  dossier: Dossier | null;
  onClose: () => void;
  onOpenContact: (dossier: Dossier) => void;
  canMarkAccepted?: boolean;
  onMarkAccepted?: (dossier: Dossier) => void;
  canDelete?: boolean;
  onDelete?: (dossierId: string) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  onClose,
  onOpenContact,
  canMarkAccepted = false,
  onMarkAccepted,
  canDelete = false,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'echeancier' | 'documents'>('details');
  const [downloadableFiles, setDownloadableFiles] = useState<AttachmentUploadPayload[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setActiveTab('details');
    setDownloadableFiles([]);
    setConfirmDelete(false);
  }, [dossier?.id]);

  useEffect(() => {
    if (!dossier || activeTab !== 'documents' || dossier.documents.length === 0) return;
    let active = true;
    setLoadingFiles(true);
    fetchDossierAttachments(dossier.id)
      .then((files) => {
        if (active) setDownloadableFiles(files);
      })
      .catch(() => {
        if (active) setDownloadableFiles([]);
      })
      .finally(() => {
        if (active) setLoadingFiles(false);
      });
    return () => {
      active = false;
    };
  }, [dossier?.id, activeTab, dossier?.documents.length]);

  useModalEscape(Boolean(dossier), onClose);

  if (!dossier) return null;

  const isEquityOrRevenueOnly =
    dossier.investmentReturnMode === 'parts_sociales' ||
    dossier.investmentReturnMode === 'redevance_ca' ||
    dossier.maxMonthlyPayment <= 0;

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
                  dossier.type === 'investissement' ? 'text-emerald-700' : 'text-rose-700'
                }
              >
                {dossier.type === 'investissement'
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
            {dossier.investmentReturnMode === 'parts_sociales' ||
            dossier.investmentReturnMode === 'redevance_ca'
              ? 'Accord & Contrepartie investisseur'
              : `Simulation de remboursement (${dossier.termMonths} mois)`}
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
              {(() => {
                const isParts = dossier.investmentReturnMode === 'parts_sociales';
                const isRoyalty = dossier.investmentReturnMode === 'redevance_ca';
                const isHybrid = dossier.investmentReturnMode === 'hybride';
                const isNoMonthly = isParts || isRoyalty;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-medium">
                        Montant demandé
                      </span>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {formatEuro(dossier.amountRequested)}
                      </p>
                      <span className="text-[11px] font-medium text-orange-700 block tabular-nums">
                        {formatAriaryApprox(dossier.amountRequested)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-medium">
                        {isParts
                          ? 'Parts proposées'
                          : isRoyalty
                          ? 'Partage revenus'
                          : isHybrid
                          ? 'Taux + Parts'
                          : 'Taux annuel ciblé'}
                      </span>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {isNoMonthly
                          ? `${dossier.equityPercentage || 15} %`
                          : isHybrid
                          ? `${dossier.targetInterestRate ? formatPct(dossier.targetInterestRate) : 'Mixte'} + ${dossier.equityPercentage || 10}%`
                          : dossier.targetInterestRate
                          ? formatPct(dossier.targetInterestRate)
                          : 'Négociable'}
                      </p>
                      <span className="text-xs text-slate-500">
                        {isParts
                          ? 'Entrée au capital'
                          : isRoyalty
                          ? 'Selon CA / bénéfices'
                          : 'Négociable'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-medium">
                        {isParts ? 'Horizon partenariat' : 'Durée souhaitée'}
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
                        {isNoMonthly ? 'Mensualité fixe' : 'Mensualité maximale'}
                      </span>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {isNoMonthly ? '0 € / mois' : formatEuro(dossier.maxMonthlyPayment)}
                      </p>
                      <span className="text-xs text-slate-500">
                        {isParts
                          ? 'Dividendes / Parts'
                          : isRoyalty
                          ? 'Partage sur recettes'
                          : 'Capacité déclarée'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Direct Negotiation Notice */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 py-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                <span className="font-medium">
                  Mise en relation 100 % directe · Cliquez sur « Négocier » pour ouvrir la messagerie directe ou accéder au Gmail / téléphone (+261 / +33) et convenir via MVola, Orange Money ou virement bancaire.
                </span>
              </div>

              {dossier.verifiedCompany && (
                <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 flex items-start gap-3 text-xs">
                  <Building2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-950 block">
                      Entreprise vérifiée ({dossier.verifiedCompany.registryType === 'NIF_STAT_MG' ? 'NIF / STAT Madagascar' : 'INSEE / SIREN'}) : {dossier.verifiedCompany.legalName}
                    </span>
                    <span className="text-[11px] text-orange-800 block mt-0.5">
                      Identifiant : {dossier.verifiedCompany.identifier}
                      {dossier.verifiedCompany.city ? ` · ${dossier.verifiedCompany.city}` : ''}
                      {dossier.verifiedCompany.activity ? ` · ${dossier.verifiedCompany.activity}` : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Project Precision Details */}
              {(dossier.counterpartSummary ||
                dossier.projectDetails?.projectStage ||
                dossier.projectDetails?.legalStructure ||
                dossier.projectDetails?.useOfFunds ||
                dossier.projectDetails?.timeline ||
                dossier.projectDetails?.projectedRevenue ||
                (dossier.projectDetails?.ownContribution && dossier.projectDetails.ownContribution > 0)) && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Précisions détaillées du dossier &amp; Affectation des fonds
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
                    {dossier.projectDetails?.projectStage && (
                      <div>
                        <span className="text-slate-500 block">Stade d'avancement :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.projectDetails.projectStage}
                        </span>
                      </div>
                    )}
                    {dossier.projectDetails?.legalStructure && (
                      <div>
                        <span className="text-slate-500 block">Structure / Porteur :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.projectDetails.legalStructure}
                        </span>
                      </div>
                    )}
                    {typeof dossier.projectDetails?.ownContribution === 'number' &&
                      dossier.projectDetails.ownContribution > 0 && (
                        <div>
                          <span className="text-slate-500 block">Apport personnel engagé :</span>
                          <span className="font-semibold text-emerald-700 tabular-nums">
                            {formatEuro(dossier.projectDetails.ownContribution)}
                          </span>
                        </div>
                      )}
                    {dossier.counterpartSummary && (
                      <div>
                        <span className="text-slate-500 block">Contrepartie investisseur :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.counterpartSummary}
                        </span>
                      </div>
                    )}
                    {dossier.projectDetails?.useOfFunds && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block">Utilisation précise des fonds :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.projectDetails.useOfFunds}
                        </span>
                      </div>
                    )}
                    {dossier.projectDetails?.timeline && (
                      <div>
                        <span className="text-slate-500 block">Calendrier :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.projectDetails.timeline}
                        </span>
                      </div>
                    )}
                    {dossier.projectDetails?.projectedRevenue && (
                      <div>
                        <span className="text-slate-500 block">Retombées / CA prévisionnel :</span>
                        <span className="font-semibold text-slate-900">
                          {dossier.projectDetails.projectedRevenue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Context Story */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Exposé du projet ou du besoin
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
                      <div className="text-right leading-tight">
                        {(dossier.applicant.loyaltyTitle ||
                          dossier.isDiamondPriority ||
                          dossier.applicant.loyaltyTier === 'diamond') && (
                          <span
                            className={`${getLoyaltyNameColorClass(
                              dossier.applicant.loyaltyTier,
                              false
                            )} text-[10px] uppercase tracking-wider block`}
                          >
                            {dossier.applicant.loyaltyTitle || 'Membre Prestigieux Officiel'}
                          </span>
                        )}
                        <span className={getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}>
                          {dossier.applicant.pseudonym}
                        </span>
                      </div>
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
                      <span className="text-slate-500">
                        {isEquityOrRevenueOnly ? 'Mode de contribution :' : "Taux d'effort estimé :"}
                      </span>
                      {isEquityOrRevenueOnly ? (
                        <span className="font-semibold text-emerald-700">
                          Parts / Partage CA ({dossier.equityPercentage || 15}%)
                        </span>
                      ) : dossier.applicant.monthlyIncome <= 0 ? (
                        <span className="font-semibold text-slate-600">Non renseigné</span>
                      ) : (
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
                      )}
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
            dossier.investmentReturnMode === 'parts_sociales' ||
            dossier.investmentReturnMode === 'redevance_ca' ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-950">
                    {dossier.investmentReturnMode === 'parts_sociales'
                      ? `Investissement en capital (${dossier.equityPercentage || 15} % de parts sociales)`
                      : `Partage des revenus / bénéfices (${dossier.equityPercentage || 8} %)`}
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Ce dossier ne fonctionne pas comme un crédit classique : il n'y a pas d'échéancier de remboursement mensuel fixe. L'investisseur apporte {formatEuro(dossier.amountRequested)} en échange d'une participation directe ({dossier.equityPercentage || 15} %) définie contractuellement entre vous.
                  </p>
                  {dossier.counterpartSummary && (
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800">
                      <span className="font-semibold text-emerald-900 block mb-0.5">
                        Modalités proposées :
                      </span>
                      {dossier.counterpartSummary}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Mensualité théorique estimée :</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums block">
                      {formatEuro(monthlyCalculated)} / mois
                    </span>
                    <span className="text-[11px] text-orange-700 tabular-nums">
                      {formatAriaryApprox(monthlyCalculated)} / mois
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Intérêts totaux reversés :</span>
                    <span className="text-lg font-bold text-emerald-700 tabular-nums block">
                      +{formatEuro(totalInterest)}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      +{formatAriaryApprox(totalInterest)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total remboursé :</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums block">
                      {formatEuro(dossier.amountRequested + totalInterest)}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatAriaryApprox(dossier.amountRequested + totalInterest)}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto thin-scrollbar">
                  <table className="w-full min-w-[520px] text-xs text-left">
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
            )
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pièces déposées par le créateur du dossier. Vous pouvez également demander des documents complémentaires lors de votre échange par e-mail ou téléphone.
              </p>

              {dossier.documents.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {dossier.documents.map((doc) => {
                    const matchedAtt = downloadableFiles.find((f) => f.name === doc.name);
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{doc.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {doc.size} · Déposé le {doc.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {loadingFiles ? (
                            <span className="text-[11px] text-slate-400">Chargement...</span>
                          ) : matchedAtt?.dataUrl ? (
                            <a
                              href={matchedAtt.dataUrl}
                              download={matchedAtt.name}
                              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Télécharger</span>
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Joint
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            {canDelete && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-rose-800">
                    Confirmer la suppression ?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(dossier.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              )
            )}

            {canMarkAccepted && onMarkAccepted && dossier.status === 'open' && (
              <button
                type="button"
                onClick={() => onMarkAccepted(dossier)}
                className="px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Négocier en direct</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
