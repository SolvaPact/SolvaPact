import React, { useState } from 'react';
import { InvoiceData, User } from '../types';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  formatEuro,
  getLoyaltyNameColorClass,
  getLoyaltyStatus,
} from '../utils/finance';
import {
  Award,
  CheckCircle2,
  CreditCard,
  Lock,
  Receipt,
  ShieldCheck,
  X,
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onActivateLoyalty: () => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onActivateLoyalty,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  const [invoiceToPreview, setInvoiceToPreview] = useState<InvoiceData | null>(null);

  if (!isOpen) return null;

  const loyalty = getLoyaltyStatus(currentUser);
  const progressPct = Math.min(100, Math.round((loyalty.exp / 500) * 100));
  const accountColorDark = getLoyaltyNameColorClass(loyalty.tier, true);

  const buildInvoice = (): InvoiceData => {
    const vatRate = 20;
    const amountHT = Math.round((LOYALTY_ACTIVATION_PRICE / (1 + vatRate / 100)) * 100) / 100;
    const vatAmount = Math.round((LOYALTY_ACTIVATION_PRICE - amountHT) * 100) / 100;
    return {
      invoiceNumber: `SP-FID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: currentUser?.loyaltyActivatedAt || new Date().toLocaleDateString('fr-FR'),
      customerName: currentUser?.name || 'Membre SolvaPact',
      customerEmail: currentUser?.email || 'membre@solvapact.vercel.app',
      itemDescription: 'Activation à vie du Compte Fidélité SolvaPact (Paliers Bronze, Silver, Gold & Diamond)',
      amountHT,
      vatRate,
      vatAmount,
      amountTTC: LOYALTY_ACTIVATION_PRICE,
      paymentMethod: 'Carte Bancaire · Paiement unique',
      transactionId: `FID-${Date.now()}`,
      type: 'loyalty',
    };
  };

  const handlePayLoyalty = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      cardNumber.replace(/\s/g, '').length < 16 ||
      expiry.length < 5 ||
      cvc.length < 3
    ) {
      setErrorMsg('Veuillez saisir une carte bancaire valide (16 chiffres, MM/AA et CVC).');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setJustActivated(true);
      onActivateLoyalty();
    }, 900);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-950 text-white flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Award className="w-4 h-4" />
                <span>
                  {loyalty.isDiamond
                    ? 'Membre Officiel Fidèle Diamond · Compte Fidélité'
                    : 'Compte Fidélité SolvaPact'}
                </span>
              </div>
              <h2 className="text-xl font-bold">
                {loyalty.active ? (
                  <>
                    Compte de{' '}
                    <span className={accountColorDark}>
                      {currentUser?.name || 'Membre SolvaPact'}
                    </span>{' '}
                    ({loyalty.exp} EXP)
                  </>
                ) : (
                  `Activez votre Compte Fidélité à vie pour ${formatEuro(LOYALTY_ACTIVATION_PRICE)}`
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Paiement unique sans renouvellement · +{EXP_PER_DOSSIER} EXP crédités à chaque dossier publié.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* EXP Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  {loyalty.active
                    ? loyalty.isDiamond
                      ? `Statut Membre Officiel Fidèle Diamond : -${loyalty.discountPct} % + 1 dossier offert / 5`
                      : `Réduction active sur vos publications : -${loyalty.discountPct} %`
                    : 'Statut actuel : Compte Standard (Non activé)'}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {loyalty.exp} / 500 EXP
                </span>
              </div>

              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-slate-500 via-amber-400 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] text-slate-500 font-medium">
                <span>0 EXP</span>
                <span className={loyalty.exp >= 50 ? 'text-amber-800 font-bold' : ''}>
                  50 · Bronze (-10 %)
                </span>
                <span className={loyalty.exp >= 150 ? 'text-slate-700 font-bold' : ''}>
                  150 · Silver (-17 %)
                </span>
                <span className={loyalty.exp >= 300 ? 'text-amber-600 font-bold' : ''}>
                  300 · Gold (-23 %)
                </span>
                <span className={loyalty.exp >= 500 ? 'text-cyan-700 font-extrabold sm:text-right' : 'sm:text-right'}>
                  500 · Diamond (-45 %)
                </span>
              </div>
            </div>

            {/* 4 Tiers Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  loyalty.tier === 'bronze'
                    ? 'border-amber-600 bg-orange-50'
                    : 'border-slate-200 bg-white'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800">Bronze</span>
                  <span className="font-mono text-[11px] font-bold text-amber-900">50 EXP</span>
                </div>
                <p className="font-bold text-amber-800">Nom de compte Bronze</p>
                <p className="text-[11px] text-slate-600">
                  -10 % sur chaque publication ({formatEuro(26.99)} au lieu de {formatEuro(BASE_PUBLICATION_PRICE)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  loyalty.tier === 'silver'
                    ? 'border-slate-500 bg-slate-100'
                    : 'border-slate-200 bg-white'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Silver</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">150 EXP</span>
                </div>
                <p className="font-bold text-slate-500">Nom de compte Silver</p>
                <p className="text-[11px] text-slate-600">
                  -17 % sur chaque publication ({formatEuro(24.89)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  loyalty.tier === 'gold'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 bg-white'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600">Gold</span>
                  <span className="font-mono text-[11px] font-bold text-amber-700">300 EXP</span>
                </div>
                <p className="font-bold text-amber-500">Nom de compte Gold</p>
                <p className="text-[11px] text-slate-600">
                  -23 % permanents sur chaque publication ({formatEuro(23.09)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  loyalty.tier === 'diamond'
                    ? 'border-cyan-500 bg-cyan-50/80 ring-1 ring-cyan-300'
                    : 'border-cyan-200 bg-gradient-to-b from-cyan-50/40 to-white'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-700">Diamond</span>
                  <span className="font-mono text-[11px] font-extrabold text-cyan-800">500 EXP</span>
                </div>
                <p className="font-extrabold text-cyan-600">Membre Officiel Fidèle Diamond</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>-45 %</strong> ({formatEuro(16.49)}) + <strong>1 dossier offert (0 €)</strong> tous les 5 dossiers · mise en avant & support prioritaires.
                </p>
              </div>
            </div>

            {loyalty.active ? (
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  loyalty.isDiamond
                    ? 'bg-cyan-50/70 border-cyan-300'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    className={`flex items-center gap-2 font-bold text-sm ${
                      loyalty.isDiamond ? 'text-cyan-950' : 'text-emerald-900'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        loyalty.isDiamond ? 'text-cyan-600' : 'text-emerald-600'
                      }`}
                    />
                    <span>
                      {justActivated
                        ? 'Compte Fidélité activé avec succès !'
                        : loyalty.isDiamond
                        ? 'Statut actif : Membre Officiel Fidèle Diamond'
                        : 'Votre Compte Fidélité est actif à vie'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      loyalty.isDiamond ? 'text-cyan-900' : 'text-emerald-800'
                    }`}
                  >
                    {loyalty.isFreePublicationNow
                      ? 'Prochain dossier : 0 € (5e dossier Diamond offert !)'
                      : `Tarif publication actuel : ${formatEuro(loyalty.publicationPrice)}`}
                  </span>
                </div>

                {loyalty.isDiamond ? (
                  <div className="text-xs text-cyan-950 space-y-1.5 leading-relaxed">
                    <p>
                      {loyalty.isFreePublicationNow
                        ? 'Votre prochain dossier publié est 100 % OFFERT (0 €, sans carte bancaire requise).'
                        : `Dossiers publiés en Diamond : ${loyalty.diamondPublicationsCount} · Prochain dossier 100 % gratuit dans ${loyalty.dossiersUntilFreePublication} publication(s).`}
                    </p>
                    <p className="text-[11px] text-cyan-900">
                      Privilèges spéciaux actifs : -45 % permanents · Mise en avant prioritaire de vos dossiers en tête de liste · Support humain prioritaire.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {loyalty.nextTierLabel
                      ? `Publiez encore ${Math.ceil(loyalty.expToNextTier / EXP_PER_DOSSIER)} dossier(s) (${loyalty.expToNextTier} EXP restants) pour débloquer le palier ${loyalty.nextTierLabel}.`
                      : 'Votre compte bénéficie de tous les avantages Fidélité.'}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setInvoiceToPreview(buildInvoice())}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Voir ma facture ({formatEuro(LOYALTY_ACTIVATION_PRICE)} TTC)</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handlePayLoyalty}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Activer mon Compte Fidélité (Paiement unique)</span>
                  </div>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatEuro(LOYALTY_ACTIVATION_PRICE)}
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Numéro de carte bancaire *
                    </label>
                    <input
                      type="text"
                      placeholder="4970 •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCardNumber(raw.match(/.{1,4}/g)?.join(' ') || raw);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Expiration *
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setExpiry(raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CVC *
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-center"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Activation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        Régler {formatEuro(LOYALTY_ACTIVATION_PRICE)} et activer mon Compte Fidélité
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Paiement unique sans prélèvement mensuel · Cumulez +{EXP_PER_DOSSIER} EXP par dossier
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <InvoiceModal invoice={invoiceToPreview} onClose={() => setInvoiceToPreview(null)} />
    </>
  );
};
