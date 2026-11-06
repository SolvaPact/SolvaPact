import React, { useState } from 'react';
import { NegotiationThread, FounderSettings } from '../types';
import { formatEuro } from '../utils/finance';
import {
  Coins,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Save,
  HelpCircle,
} from 'lucide-react';

interface FounderPayoutViewProps {
  signedThreads: NegotiationThread[];
  founderEmail?: string;
}

export const FounderPayoutView: React.FC<FounderPayoutViewProps> = ({
  signedThreads,
  founderEmail = 'solvapact.vercel.app@gmail.com',
}) => {
  const [settings, setSettings] = useState<FounderSettings>(() => {
    const saved = localStorage.getItem('solvapact_founder_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      founderName: 'Hugo Laumonier',
      founderEmail: founderEmail,
      founderIban: 'FR76 3000 4000 5000 6000 7000 123',
      payoutProvider: 'Stripe Connect',
      autoPayoutEnabled: true,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('solvapact_founder_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const totalCommissionsEarned = signedThreads.reduce(
    (sum, t) =>
      sum + Math.round(t.currentOffer.proposedAmount * (t.dossierType === 'dette' ? 0.012 : 0.02)),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>Espace Fondateur · Gestion de vos Commissions (1,2 % Dettes / 2,0 % Investissements)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Comment vous encaissez vos commissions à 100 % automatiquement
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Vous n'avez <strong>aucune gestion manuelle</strong> à faire. Les utilisateurs déposent et négocient leurs dossiers en totale autonomie. Dès qu'un accord est conclu, la technologie de séquestre bancaire prélève automatiquement vos 2 % et les verse sur votre compte.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-right shrink-0">
          <span className="text-[11px] text-slate-400 block uppercase">
            Total commissions encaissées
          </span>
          <span className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
            {formatEuro(totalCommissionsEarned)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Sur {signedThreads.length} accord{signedThreads.length > 1 ? 's' : ''} ratifié{signedThreads.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Explanatory Step Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Le circuit de paiement automatique sans aucune intervention de votre part</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center font-mono">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Accord mutuel conclu</h4>
            <p className="text-slate-600 leading-relaxed">
              Le demandeur et l'investisseur négocient directement sur le site et cliquent sur *Accepter l'offre*. Le protocole est signé.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center font-mono">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dépôt sur compte séquestre</h4>
            <p className="text-slate-600 leading-relaxed">
              L'investisseur verse la somme (ex: 10 000 €) sur un compte de séquestre sécurisé géré par l'API de paiement (Stripe Connect ou Lemonway).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center font-mono">
              3
            </div>
            <h4 className="font-bold text-amber-950 text-sm">Découpage instantané (Split)</h4>
            <p className="text-amber-900 leading-relaxed">
              L'algorithme sépare automatiquement l'argent : vos <strong>2 % (200 €)</strong> partent vers votre RIB, et les <strong>98 % (9 800 €)</strong> vont au demandeur.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center font-mono">
              4
            </div>
            <h4 className="font-bold text-emerald-950 text-sm">Virement sur votre compte</h4>
            <p className="text-emerald-900 leading-relaxed">
              L'argent arrive directement sur votre compte bancaire. La facture de commission est émise automatiquement pour votre comptabilité.
            </p>
          </div>
        </div>
      </div>

      {/* IBAN & Payout Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <span>Paramètres de versement de vos 2 %</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Renseignez votre RIB / IBAN bancaire où seront versées automatiquement vos commissions sur chaque dossier finalisé.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bénéficiaire / Titulaire du compte bancaire
              </label>
              <input
                type="text"
                required
                value={settings.founderName}
                onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email de notification de versement
              </label>
              <input
                type="email"
                required
                value={settings.founderEmail}
                onChange={(e) => setSettings({ ...settings, founderEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                IBAN pour le versement automatique de vos 2 %
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="FR76 3000 4000 5000 6000 7000 123"
                  value={settings.founderIban}
                  onChange={(e) => setSettings({ ...settings, founderIban: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono tracking-wider tabular-nums"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Compatible tout compte bancaire français ou européen (SEPA).
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Passerelle de paiement automatique (Split Payment)
              </label>
              <select
                value={settings.payoutProvider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payoutProvider: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              >
                <option value="Stripe Connect">
                  Stripe Connect Marketplace (Standard international avec virements automatiques)
                </option>
                <option value="Lemonway">
                  Lemonway (Spécialiste agréé ACPR / Banque de France pour le crowdfunding)
                </option>
                <option value="Mangopay">
                  Mangopay (Leader européen de séquestre pour places de marché P2P)
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPayout"
                checked={settings.autoPayoutEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, autoPayoutEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-slate-900 rounded"
              />
              <label htmlFor="autoPayout" className="text-xs text-slate-700 font-medium">
                Activer le virement automatique immédiat dès ratification du protocole
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Paramètres de versement enregistrés !
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer mon IBAN de versement</span>
              </button>
            </div>
          </form>
        </div>

        {/* Legal & Regulatory Guarantees */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-xs text-slate-700 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Conformité juridique & Rôle de pure mise en relation</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              En tant qu'éditeur de la plateforme SolvaPact, vous agissez en qualité de <strong>tiers technique de mise en relation</strong> :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Zéro gestion de créance :</strong> Vous ne portez pas le risque de crédit. Le contrat est conclu directement entre l'investisseur et le demandeur (sous seing privé).
              </li>
              <li>
                <strong>Fonds cantonnés :</strong> Vous ne touchez jamais aux fonds des tiers sur votre propre compte ; c'est le prestataire de paiement agréé (Stripe/Lemonway) qui séquestre et distribue.
              </li>
              <li>
                <strong>Rémunération pure :</strong> Vos 2 % constituent des honoraires de mise en relation et d'accès aux outils techniques (rédaction d'accord, messagerie, calculatrice).
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Exemple concret de versement</h4>
            <div className="space-y-1 text-slate-600 font-mono text-[11px] pt-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Dossier financé :</span>
                <span className="font-bold text-slate-900">20 000 €</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Commission 2% :</span>
                <span className="font-bold text-emerald-700">+ 400 € (pour vous)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Net versé au bénéficiaire :</span>
                <span className="font-bold text-slate-700">19 600 €</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Sur 10 dossiers par mois à 15 000 € en moyenne = 3 000 € / mois de commissions 100 % passives.
            </p>
          </div>
        </div>
      </div>

      {/* History of transactions and payouts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Journal des commissions générées sur le site
            </h3>
            <p className="text-xs text-slate-500">
              Historique des transactions conclues et des versements vers votre compte.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Taux fixe : 2,00 %
          </span>
        </div>

        {signedThreads.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {signedThreads.map((thread) => {
              const amount = thread.currentOffer.proposedAmount;
              const rate = thread.dossierType === 'dette' ? 0.012 : 0.02;
              const fee = Math.round(amount * rate);
              return (
                <div key={thread.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div>
                    <span className="font-semibold text-slate-900 block">{thread.dossierTitle}</span>
                    <span className="text-[11px] text-slate-500">
                      Accord entre {thread.investorName} et {thread.applicantPseudonym} · Réf: SP-{thread.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Opération</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">{formatEuro(amount)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Vos {thread.dossierType === 'dette' ? '1,2 %' : '2,0 %'}
                      </span>
                      <span className="font-bold text-emerald-700 font-mono tabular-nums text-sm">+{formatEuro(fee)}</span>
                    </div>

                    <div className="text-left">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Viré sur IBAN
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">Aucune transaction finalisée pour le moment</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dès qu'un investisseur et un demandeur acceptent une offre sur le site, vos 2 % apparaîtront immédiatement ici avec l'ordre de virement automatique.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
