import React, { useState } from 'react';
import { User } from '../types';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  Zap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  FileCheck,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubscriptionSuccess: (plan: 'demandeur' | 'investisseur', price: number) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubscriptionSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'demandeur' | 'investisseur'>('investisseur');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const planPrices = {
    demandeur: 14.9,
    investisseur: 29.9,
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format 4 groups of 4 digits
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMsg('Veuillez saisir un numéro de carte bancaire valide à 16 chiffres.');
      return;
    }

    if (expiry.length < 5) {
      setErrorMsg('Veuillez saisir une date d’expiration valide (MM/AA).');
      return;
    }

    if (cvc.length < 3) {
      setErrorMsg('Veuillez saisir les 3 chiffres de sécurité au dos de votre carte.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Record subscription in founder's accumulated earnings
      try {
        const savedStats = localStorage.getItem('solvapact_subscription_stats_v2');
        const stats = savedStats
          ? JSON.parse(savedStats)
          : { totalSubscribers: 0, monthlyRevenue: 0, totalCollected: 0, totalCommissions: 0 };

        stats.totalSubscribers = (stats.totalSubscribers || 0) + 1;
        stats.monthlyRevenue = (stats.monthlyRevenue || 0) + planPrices[selectedPlan];
        stats.totalCollected = (stats.totalCollected || 0) + planPrices[selectedPlan];

        localStorage.setItem('solvapact_subscription_stats_v2', JSON.stringify(stats));
      } catch (err) {
        console.error('Error recording subscription stats', err);
      }

      setTimeout(() => {
        onSubscriptionSuccess(selectedPlan, planPrices[selectedPlan]);
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Accès Plateforme SolvaPact · Abonnement Mensuel Sans Engagement
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presentation explanation: Ne pas payer dans le vide */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Activez votre Pass SolvaPact
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pour garantir la fiabilité des échanges et l'authenticité des dossiers sans prélever de commission bancaire cachée sur vos transferts, l'accès à SolvaPact s'effectue via un <strong>abonnement mensuel transparent, résiliable en 1 clic</strong>.
            </p>
          </div>

          {/* Value Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Mise en relation directe</p>
                <p className="text-slate-500 text-[11px]">Échangez sans intermédiaire bancaire</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Actes conformes Code Civil</p>
                <p className="text-slate-500 text-[11px]">Articles 1892 & 2044 sous seing privé</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Paiements 100 % directs</p>
                <p className="text-slate-500 text-[11px]">Règlement direct de compte à compte</p>
              </div>
            </div>
          </div>

          {/* Plan Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan 1: Demandeur */}
            <div
              onClick={() => setSelectedPlan('demandeur')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPlan === 'demandeur'
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pass Demandeur
                </span>
                <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  Sans engagement
                </span>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">14,90 €</span>
                <span className="text-xs text-slate-500"> / mois</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dépôt illimité de dossiers (Dette, Investissement)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Messagerie de négociation avec financeurs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Signature du protocole d'accord officiel</span>
                </li>
              </ul>
            </div>

            {/* Plan 2: Investisseur */}
            <div
              onClick={() => setSelectedPlan('investisseur')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                selectedPlan === 'investisseur'
                  ? 'border-emerald-700 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recommandé
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Pass Investisseur
                </span>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">29,90 €</span>
                <span className="text-xs text-slate-500"> / mois</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Accès prioritaire à tous les dossiers déposés</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simulateur de rentabilité & décote de rachat</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Accords sous seing privé & quittances certifiées</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Form (Card) */}
          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">
                Paiement validé avec succès !
              </h3>
              <p className="text-xs text-emerald-800">
                Votre abonnement <strong>{selectedPlan === 'demandeur' ? 'Pass Demandeur (14,90 €)' : 'Pass Investisseur (29,90 €)'}</strong> est désormais actif. Votre compte est débloqué pour toutes vos négociations et accords.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <span>Paiement sécurisé par Carte Bancaire</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SSL 256-bit · 3D Secure</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom sur la carte *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Thomas Martin"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de carte bancaire *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4970 •••• •••• ••••"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full pl-3.5 pr-10 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiration (MM/AA) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cryptogramme (CVC) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={cvc}
                    onChange={handleCvcChange}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 mt-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sécurisation et prélèvement de {planPrices[selectedPlan].toFixed(2)} €...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Activer mon Pass SolvaPact ({planPrices[selectedPlan].toFixed(2)} € / mois)
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500">
                Paiement mensuel récurrent sans engagement. Vous pouvez interrompre l'abonnement à tout moment en 1 clic dans vos paramètres.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
