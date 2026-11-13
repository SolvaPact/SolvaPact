import React from 'react';
import { NegotiationThread } from '../types';
import { formatEuro, formatPct, generateAmortizationSchedule } from '../utils/finance';
import { X, Printer, ShieldCheck, CheckCircle2, Download, Scale } from 'lucide-react';

interface ContractModalProps {
  thread: NegotiationThread | null;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ thread, onClose }) => {
  if (!thread) return null;

  const offer = thread.currentOffer;
  const isDebt = thread.dossierType === 'dette';
  const schedule = generateAmortizationSchedule(
    offer.proposedAmount,
    offer.proposedInterestRate,
    offer.proposedTermMonths
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Accord ratifié · Valeur probante sous seing privé
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document */}
        <div className="p-8 sm:p-12 space-y-8 text-slate-800 text-xs sm:text-sm font-serif leading-relaxed max-h-[80vh] overflow-y-auto bg-white print:max-h-none print:overflow-visible">
          {/* Header Document */}
          <div className="text-center space-y-2 border-b border-slate-300 pb-6">
            <p className="text-[11px] tracking-widest uppercase font-mono text-slate-500">
              RÉPUBLIQUE FRANÇAISE · ACTE SOUS SEING PRIVÉ
            </p>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              PROTOCOLE TRANSACTIONNEL & CONTRAT DE FINANCEMENT P2P
            </h1>
            <p className="text-xs text-slate-600 font-sans">
              Établi en application des articles 1892 et suivants, 1905 et 2044 du Code Civil
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              RÉFÉRENCE UNIQUE D'ACCORD : SP-{thread.id.toUpperCase()}-2026
            </p>
          </div>

          {/* Visual trust strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs">
            <div>
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] mb-1">
                PARTIE 1 · LE CRÉANCIER / INVESTISSEUR
              </span>
              <p className="font-medium text-slate-800">{thread.investorName}</p>
              <p className="text-slate-500">Agissant en qualité de bailleur de fonds / cessionnaire</p>
              <p className="text-slate-500 mt-1">Identité vérifiée au niveau standard SolvaPact</p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] mb-1">
                PARTIE 2 · LE DÉBITEUR / PORTEUR DU DOSSIER
              </span>
              <p className="font-medium text-slate-800">{thread.applicantName}</p>
              <p className="text-slate-500">Représenté sur la plateforme sous : {thread.applicantPseudonym}</p>
              <p className="text-slate-500 mt-1">Dossier : « {thread.dossierTitle} »</p>
            </div>
          </div>

          {/* Clauses */}
          <div className="space-y-6">
            <section className="space-y-1.5">
              <h3 className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900">
                Article 1 — Objet de la présente convention
              </h3>
              <p>
                Le présent protocole a pour objet d'arrêter de manière ferme et irrévocable les conditions de mise à disposition des fonds ou de reprise de la créance visée dans le dossier ci-dessus référencé, conclue directement entre les parties sans intermédiation bancaire classique.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900">
                Article 2 — Montant principal & Conditions financières
              </h3>
              <p>
                Le montant principal accordé et versé par l'Investisseur s'élève à la somme ferme de{' '}
                <strong className="font-mono tabular-nums">{formatEuro(offer.proposedAmount)}</strong>{' '}
                (Toutes Taxes Comprises ou net de frais).
              </p>
              <ul className="list-disc pl-5 space-y-1 font-sans text-xs mt-2">
                <li>
                  <strong>Taux d'intérêt annuel conventionnel (fixe) :</strong>{' '}
                  <span className="font-mono tabular-nums">{formatPct(offer.proposedInterestRate)}</span>
                </li>
                <li>
                  <strong>Durée totale de remboursement :</strong>{' '}
                  <span className="font-mono tabular-nums">{offer.proposedTermMonths} mois</span> consécutifs
                </li>
                <li>
                  <strong>Mensualité constante d'amortissement :</strong>{' '}
                  <span className="font-mono tabular-nums">{formatEuro(offer.proposedMonthlyPayment)} / mois</span>
                </li>
                {offer.discountPercentage && (
                  <li>
                    <strong>Décote de règlement convenue :</strong> {offer.discountPercentage} % sur le montant nominal
                  </li>
                )}
                <li>
                  <strong>Commission SolvaPact sur la transaction :</strong>{' '}
                  <span className="font-mono tabular-nums text-emerald-800 font-bold">0 % (0 €)</span>{' '}
                  — 100 % du capital accordé est net entre les parties.
                </li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900">
                Article 3 — Sûretés, garanties et conditions suspensives
              </h3>
              <p>
                Les parties conviennent expressément de la mise en place de la garantie suivante :
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-sans text-xs italic">
                « {offer.conditions} »
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900">
                Article 4 — Modalités de règlement & Déchéance du terme
              </h3>
              <p>
                Le versement du capital et les échéances mensuelles s'effectuent directement entre les parties, en dehors de la plateforme SolvaPact (virement bancaire ou moyen convenu entre elles), le 5 de chaque mois civil. En cas de défaut de paiement d'une seule échéance non régularisée dans un délai de quinze (15) jours suivant mise en demeure restée infructueuse, la totalité du solde restant dû deviendra immédiatement et de plein droit exigible.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900">
                Extrait de l'échéancier des 6 premiers mois
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden font-sans text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">Échéance</th>
                      <th className="py-1.5 px-3 text-right">Mensualité</th>
                      <th className="py-1.5 px-3 text-right">Capital</th>
                      <th className="py-1.5 px-3 text-right">Intérêts</th>
                      <th className="py-1.5 px-3 text-right">Solde restant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {schedule.slice(0, 6).map((r) => (
                      <tr key={r.month}>
                        <td className="py-1.5 px-3">Mois {r.month}</td>
                        <td className="py-1.5 px-3 text-right">{formatEuro(r.payment)}</td>
                        <td className="py-1.5 px-3 text-right">{formatEuro(r.principalPaid)}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">{formatEuro(r.interestPaid)}</td>
                        <td className="py-1.5 px-3 text-right">{formatEuro(r.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Signatures Block */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 font-sans">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">
                POUR L'INVESTISSEUR
              </span>
              <p className="font-semibold text-slate-900">{thread.investorName}</p>
              <div className="py-3 text-emerald-700 font-mono text-xs font-semibold">
                [ SIGNATURE ÉLECTRONIQUE HORODATÉE ]
              </div>
              <p className="text-[10px] text-slate-400">Certificat sha256 validé</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">
                POUR LE DEMANDEUR / DÉBITEUR
              </span>
              <p className="font-semibold text-slate-900">{thread.applicantName}</p>
              <div className="py-3 text-emerald-700 font-mono text-xs font-semibold">
                [ SIGNATURE ÉLECTRONIQUE HORODATÉE ]
              </div>
              <p className="text-[10px] text-slate-400">Certificat sha256 validé</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Document juridique opposable conservé au registre d'accords SolvaPact.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Fermer le document
          </button>
        </div>
      </div>
    </div>
  );
};
