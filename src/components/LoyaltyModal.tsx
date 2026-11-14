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
import { CosmicStarfieldCanvas } from './CosmicStarfieldCanvas';
import { FuturisticPaymentOverlay } from './FuturisticPaymentOverlay';

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
  const [paymentPhase, setPaymentPhase] = useState<'verifying' | 'approved' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  const [invoiceToPreview, setInvoiceToPreview] = useState<InvoiceData | null>(null);

  if (!isOpen) return null;

  const loyalty = getLoyaltyStatus(currentUser);
  const progressPct = Math.min(100, Math.round((loyalty.exp / 500) * 100));
  const accountColorDark = getLoyaltyNameColorClass(loyalty.tier, true);

  const modalBorderClass =
    loyalty.tier === 'diamond'
      ? 'border-cyan-400/50 shadow-cyan-500/20'
      : loyalty.tier === 'gold'
      ? 'border-amber-400/50 shadow-amber-500/20'
      : loyalty.tier === 'silver'
      ? 'border-slate-300/45 shadow-slate-300/15'
      : loyalty.tier === 'bronze'
      ? 'border-orange-400/50 shadow-orange-500/20'
      : 'border-blue-400/40 shadow-blue-500/20';

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
    setPaymentPhase('verifying');
    window.setTimeout(() => {
      setPaymentPhase('approved');
      window.setTimeout(() => {
        setPaymentPhase(null);
        setIsProcessing(false);
        setJustActivated(true);
        onActivateLoyalty();
      }, 850);
    }, 950);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
        <div
          className={`relative w-full max-w-3xl bg-gradient-to-br from-[#030b20] via-[#081d4a] to-[#04102b] rounded-2xl shadow-2xl border ${modalBorderClass} overflow-hidden my-6 text-white`}
        >
          {/* Futuristic Animated Starfield & Shooting Stars in Loyalty Tier Color */}
          <CosmicStarfieldCanvas tier={loyalty.tier} />

          {/* Header */}
          <div className="relative z-10 p-6 border-b border-blue-300/15 bg-slate-950/45 backdrop-blur-xs text-white flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                <Award className="w-4 h-4" />
                <span>Compte Fidélité SolvaPact</span>
              </div>
              {loyalty.active && loyalty.badgeTitle && (
                <span className={`${accountColorDark} text-[11px] uppercase tracking-wider block mb-0.5`}>
                  {loyalty.badgeTitle}
                </span>
              )}
              <h2 className="text-xl font-bold text-white">
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
              <p className="text-xs text-blue-100/80 mt-1">
                Paiement unique sans renouvellement · +{EXP_PER_DOSSIER} EXP crédités à chaque dossier publié.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* EXP Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-950/55 backdrop-blur-md border border-blue-300/20 space-y-3">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-bold text-white">
                  {loyalty.active
                    ? loyalty.isDiamond
                      ? `Statut Membre Prestigieux Officiel (Diamond) : -${loyalty.discountPct} % + 1 dossier offert / 5`
                      : `Réduction active sur vos publications : -${loyalty.discountPct} %`
                    : 'Statut actuel : Compte Standard (Non activé)'}
                </span>
                <span className="font-mono font-bold text-cyan-300 shrink-0">
                  {loyalty.exp} / 500 EXP
                </span>
              </div>

              <div className="w-full h-3 bg-blue-950/90 border border-blue-400/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 via-slate-200 via-amber-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] text-blue-200/75 font-medium">
                <span>0 EXP</span>
                <span className={loyalty.exp >= 50 ? 'text-orange-300 font-bold' : ''}>
                  50 · Bronze (-10 %)
                </span>
                <span className={loyalty.exp >= 150 ? 'text-slate-100 font-bold' : ''}>
                  150 · Silver (-17 %)
                </span>
                <span className={loyalty.exp >= 300 ? 'text-amber-300 font-bold' : ''}>
                  300 · Gold (-23 %)
                </span>
                <span className={loyalty.exp >= 500 ? 'text-cyan-300 font-extrabold sm:text-right' : 'sm:text-right'}>
                  500 · Diamond (-45 %)
                </span>
              </div>
            </div>

            {/* 4 Tiers Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-4 rounded-xl backdrop-blur-md border transition-all ${
                  loyalty.tier === 'bronze'
                    ? 'border-orange-400 bg-orange-950/50 ring-1 ring-orange-400/50 shadow-lg shadow-orange-500/15'
                    : 'border-blue-300/20 bg-slate-950/50'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-300">Bronze</span>
                  <span className="font-mono text-[11px] font-bold text-orange-200">50 EXP</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block leading-none">
                    Membre Vérifié
                  </span>
                  <p className="font-bold text-orange-300 mt-0.5">Nom de compte Bronze</p>
                </div>
                <p className="text-[11px] text-blue-100/80">
                  -10 % sur chaque publication ({formatEuro(26.99)} au lieu de {formatEuro(BASE_PUBLICATION_PRICE)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl backdrop-blur-md border transition-all ${
                  loyalty.tier === 'silver'
                    ? 'border-slate-300 bg-slate-800/60 ring-1 ring-slate-300/50 shadow-lg shadow-slate-300/15'
                    : 'border-blue-300/20 bg-slate-950/50'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Silver</span>
                  <span className="font-mono text-[11px] font-bold text-slate-200">150 EXP</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block leading-none">
                    Membre Fidèle
                  </span>
                  <p className="font-bold text-slate-200 mt-0.5">Nom de compte Silver</p>
                </div>
                <p className="text-[11px] text-blue-100/80">
                  -17 % sur chaque publication ({formatEuro(24.89)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl backdrop-blur-md border transition-all ${
                  loyalty.tier === 'gold'
                    ? 'border-amber-400 bg-amber-950/45 ring-1 ring-amber-400/50 shadow-lg shadow-amber-400/15'
                    : 'border-blue-300/20 bg-slate-950/50'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">Gold</span>
                  <span className="font-mono text-[11px] font-bold text-amber-200">300 EXP</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block leading-none">
                    Membre Précieux
                  </span>
                  <p className="font-bold text-amber-300 mt-0.5">Nom de compte Gold</p>
                </div>
                <p className="text-[11px] text-blue-100/80">
                  -23 % permanents sur chaque publication ({formatEuro(23.09)}).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl backdrop-blur-md border transition-all ${
                  loyalty.tier === 'diamond'
                    ? 'border-cyan-400 bg-cyan-950/55 ring-1 ring-cyan-400/60 shadow-lg shadow-cyan-400/20'
                    : 'border-cyan-400/35 bg-slate-950/55'
                } space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-300">Diamond</span>
                  <span className="font-mono text-[11px] font-extrabold text-cyan-200">500 EXP</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 block leading-none">
                    Membre Prestigieux Officiel
                  </span>
                  <p className="font-extrabold text-cyan-300 mt-0.5">Nom de compte Diamond</p>
                </div>
                <p className="text-[11px] text-cyan-50/90 leading-relaxed">
                  <strong>-45 %</strong> ({formatEuro(16.49)}) + <strong>1 dossier offert (0 €)</strong> tous les 5 dossiers · mise en avant &amp; support prioritaires.
                </p>
              </div>
            </div>

            {loyalty.active ? (
              <div
                className={`p-5 rounded-2xl backdrop-blur-md border space-y-3 ${
                  loyalty.isDiamond
                    ? 'bg-cyan-950/55 border-cyan-400/45'
                    : 'bg-blue-950/60 border-emerald-400/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    className={`flex items-center gap-2 font-bold text-sm ${
                      loyalty.isDiamond ? 'text-cyan-200' : 'text-emerald-300'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        loyalty.isDiamond ? 'text-cyan-400' : 'text-emerald-400'
                      }`}
                    />
                    <span>
                      {justActivated
                        ? 'Compte Fidélité activé avec succès !'
                        : loyalty.badgeTitle
                        ? `Statut actif : ${loyalty.badgeTitle} (${loyalty.label})`
                        : 'Votre Compte Fidélité est actif à vie'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      loyalty.isDiamond ? 'text-cyan-200' : 'text-emerald-200'
                    }`}
                  >
                    {loyalty.isFreePublicationNow
                      ? 'Prochain dossier : 0 € (5e dossier Diamond offert !)'
                      : `Tarif publication actuel : ${formatEuro(loyalty.publicationPrice)}`}
                  </span>
                </div>

                {loyalty.isDiamond ? (
                  <div className="text-xs text-cyan-100 space-y-1.5 leading-relaxed">
                    <p>
                      {loyalty.isFreePublicationNow
                        ? 'Votre prochain dossier publié est 100 % OFFERT (0 €, sans carte bancaire requise).'
                        : `Dossiers publiés en Diamond : ${loyalty.diamondPublicationsCount} · Prochain dossier 100 % gratuit dans ${loyalty.dossiersUntilFreePublication} publication(s).`}
                    </p>
                    <p className="text-[11px] text-cyan-200/90">
                      Privilèges spéciaux actifs : -45 % permanents · Mise en avant prioritaire de vos dossiers en tête de liste · Support humain prioritaire.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-blue-100/90 leading-relaxed">
                    {loyalty.nextTierLabel
                      ? `Publiez encore ${Math.ceil(loyalty.expToNextTier / EXP_PER_DOSSIER)} dossier(s) (${loyalty.expToNextTier} EXP restants) pour débloquer le palier ${loyalty.nextTierLabel}.`
                      : 'Votre compte bénéficie de tous les avantages Fidélité.'}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setInvoiceToPreview(buildInvoice())}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-cyan-300/35 text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Voir ma facture ({formatEuro(LOYALTY_ACTIVATION_PRICE)} TTC)</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handlePayLoyalty}
                className="p-5 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-blue-300/25 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Activer mon Compte Fidélité (Paiement unique)</span>
                  </div>
                  <span className="text-base font-black text-cyan-300 font-mono">
                    {formatEuro(LOYALTY_ACTIVATION_PRICE)}
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-100 mb-1">
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
                      className="w-full px-3 py-2 bg-slate-900/90 border border-blue-400/30 text-white placeholder:text-slate-400 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-100 mb-1">
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
                        className="w-full px-3 py-2 bg-slate-900/90 border border-blue-400/30 text-white placeholder:text-slate-400 rounded-lg font-mono text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-100 mb-1">
                        CVC *
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 bg-slate-900/90 border border-blue-400/30 text-white placeholder:text-slate-400 rounded-lg font-mono text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Activation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Régler {formatEuro(LOYALTY_ACTIVATION_PRICE)} et activer mon Compte Fidélité
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-blue-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
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
      <FuturisticPaymentOverlay
        phase={paymentPhase}
        amountLabel={formatEuro(LOYALTY_ACTIVATION_PRICE)}
        subtitle="Activation à vie du Compte Fidélité SolvaPact"
      />
    </>
  );
};
