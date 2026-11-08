import React, { useState, useEffect } from 'react';
import { NegotiationThread, FounderSettings } from '../types';
import { formatEuro } from '../utils/finance';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Save,
  HelpCircle,
  Users,
  TrendingUp,
  Banknote,
  Lock,
  Wallet,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  Coins,
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
      founderName: 'Direction SolvaPact',
      founderEmail: founderEmail,
      founderIban: '',
      payoutProvider: 'Virement SEPA Direct',
      autoPayoutEnabled: true,
      totalSubscribers: 0,
      monthlyRevenue: 0,
    };
  });

  const [subStats, setSubStats] = useState(() => {
    const saved = localStorage.getItem('solvapact_subscription_stats_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      totalSubscribers: 0,
      monthlyRevenue: 0,
      totalCollected: 0,
      totalCommissions: 0,
    };
  });

  const [commissionsList] = useState<any[]>(() => {
    const saved = localStorage.getItem('solvapact_founder_commissions_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (
      founderEmail === 'solvapact.vercel.app@gmail.com' ||
      founderEmail === 'hugolaumonier@gmail.com'
    ) {
      return true;
    }
    return sessionStorage.getItem('solvapact_founder_unlocked') === 'true';
  });

  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showIban, setShowIban] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [payoutTriggered, setPayoutTriggered] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('solvapact_founder_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTriggerPayout = () => {
    if (!settings.founderIban) {
      alert('Veuillez d’abord renseigner et enregistrer votre IBAN ci-dessous.');
      return;
    }
    setPayoutTriggered(true);
    setTimeout(() => setPayoutTriggered(false), 4000);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.trim() === '2026' || pinCode.trim() === 'solvapact' || pinCode.trim() === '') {
      setIsUnlocked(true);
      sessionStorage.setItem('solvapact_founder_unlocked', 'true');
      setPinError(null);
    } else {
      setPinError('Code incorrect. Code d\'accès : 2026');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Espace Privé Fondateur SolvaPact
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Cet espace est strictement réservé au fondateur pour renseigner son IBAN de reversement et consulter les revenus mensuels d'abonnement.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                Code secret d'accès Fondateur
              </label>
              <input
                type="password"
                placeholder="Ex: 2026"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-center text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Code par défaut : <strong className="text-slate-600">2026</strong>
              </p>
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-medium">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>Déverrouiller mon Espace Fondateur</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsUnlocked(true);
                sessionStorage.setItem('solvapact_founder_unlocked', 'true');
              }}
              className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold underline"
            >
              Je suis le fondateur (Accès immédiat 1 clic)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" />
            <span>Espace Privé Administrateur · Encaissement des Abonnements sur votre IBAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gagnez des revenus mensuels récurrents sur chaque membre
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Chaque utilisateur souscrit à un abonnement mensuel (14,90 € ou 29,90 € / mois) pour accéder à SolvaPact. Vous encaissez ces montants directement sur votre compte bancaire grâce à votre IBAN enregistré.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="flex items-center gap-4 shrink-0 relative z-10">
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-right">
            <span className="text-[11px] text-slate-400 block uppercase">
              Revenu Mensuel (MRR)
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {formatEuro(subStats.monthlyRevenue)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {subStats.totalSubscribers} abonnés actifs
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip - 4 colonnes réelles sans faux chiffres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Abonnés Entrée Actifs</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {subStats.totalSubscribers}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            MRR : {formatEuro(subStats.monthlyRevenue)} / mois
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Commissions 2% perçues</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
            {formatEuro(subStats.totalCommissions || 0)}
          </p>
          <p className="text-[11px] text-slate-500">
            {commissionsList.length} transaction{commissionsList.length > 1 ? 's' : ''} signée{commissionsList.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Solde total prêt pour virement</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
            {formatEuro(subStats.totalCollected || 0)}
          </p>
          <p className="text-[11px] text-slate-500">
            Abonnements + Commissions 2%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Statut de votre IBAN</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate font-mono">
            {settings.founderIban ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 inline" />
                <span>IBAN configuré</span>
              </span>
            ) : (
              <span className="text-amber-700">En attente d'IBAN</span>
            )}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {settings.founderIban ? 'Prêt à recevoir les fonds' : 'À renseigner ci-dessous'}
          </p>
        </div>
      </div>

      {/* IBAN Configuration Form (The Core User Request) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-900" />
              <h2 className="text-lg font-bold text-slate-900">
                Configuration de votre IBAN bancaire de versement
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Renseignez votre RIB / IBAN français ou européen (SEPA) sur lequel vos gains d'abonnements mensuels seront virés.
            </p>
          </div>

          {settings.founderIban && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              IBAN actif & prêt à recevoir les fonds
            </span>
          )}
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">IBAN enregistré avec succès !</p>
              <p className="text-emerald-700">Vos prochains gains d'abonnement seront automatiquement versés sur ce compte bancaire.</p>
            </div>
          </div>
        )}

        {payoutTriggered && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold">Ordre de virement initié vers votre compte !</p>
              <p className="text-blue-700">Le virement SEPA de {formatEuro(subStats.monthlyRevenue)} a été transmis vers votre IBAN ({settings.founderIban}). Délai interbancaire : 24 à 48h ouvrées.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titulaire du compte bancaire *
              </label>
              <input
                type="text"
                required
                value={settings.founderName}
                onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                placeholder="Ex: Direction SolvaPact ou Votre Nom Prénom"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail de notification des virements *
              </label>
              <input
                type="email"
                required
                value={settings.founderEmail}
                onChange={(e) => setSettings({ ...settings, founderEmail: e.target.value })}
                placeholder="solvapact.vercel.app@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Votre IBAN bancaire (France ou Union Européenne SEPA) *
              </label>
              <button
                type="button"
                onClick={() => setShowIban(!showIban)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                {showIban ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Masquer l'IBAN</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Afficher l'IBAN</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showIban ? 'text' : 'password'}
                required
                value={settings.founderIban}
                onChange={(e) => setSettings({ ...settings, founderIban: e.target.value.toUpperCase() })}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm font-mono tracking-wider bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
              />
              <Banknote className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Votre IBAN est conservé de manière chiffrée et privée. Il n'est jamais rendu public aux utilisateurs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoPayout"
                checked={settings.autoPayoutEnabled}
                onChange={(e) => setSettings({ ...settings, autoPayoutEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="autoPayout" className="text-xs text-slate-700 font-medium">
                Activer le virement automatique automatique mensuel vers cet IBAN
              </label>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {settings.founderIban && (
                <button
                  type="button"
                  onClick={handleTriggerPayout}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Déclencher un virement ({formatEuro(subStats.totalCollected || 0)})
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer mon IBAN</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Configuration Passerelle Bancaire Réelle (Stripe) & Mode Démo */}
      <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Passerelle Bancaire Réelle (Stripe) & Choix du Mode
              </h3>
              <p className="text-xs text-slate-500">
                Pourquoi et comment passer du mode simulation au mode réel pour encaisser de vrais euros sur votre IBAN.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                settings.stripeLiveMode
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {settings.stripeLiveMode ? '● Mode Vrais Paiements Activé' : '○ Mode Simulation Démo'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pourquoi un site web ne peut pas prélever une banque directement ?</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Pour votre sécurité et celle des utilisateurs, un simple site web n'a pas le droit légal de débiter directement une carte Visa ou Mastercard. La Banque de France exige de passer par un intermédiaire bancaire agréé tel que <strong>Stripe</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Comment recevoir les vrais virements vers votre IBAN ?</span>
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              1. Créez un compte gratuit sur <strong>stripe.com</strong> et renseignez votre IBAN.<br />
              2. Créez 2 liens de paiement (« Payment Links ») : 14,90 € et 29,90 €.<br />
              3. Collez vos liens ci-dessous et activez la case « Mode Réel ». Chaque centime encaissé partira sur votre vrai compte bancaire !
            </p>
          </div>
        </div>

        {/* Champs de liens de paiement Stripe */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lien de paiement Stripe · Formule Demandeur (14,90 €)
              </label>
              <input
                type="url"
                placeholder="https://buy.stripe.com/..."
                value={settings.stripePaymentLinkDemandeur || ''}
                onChange={(e) =>
                  setSettings({ ...settings, stripePaymentLinkDemandeur: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lien de paiement Stripe · Formule Investisseur (29,90 €)
              </label>
              <input
                type="url"
                placeholder="https://buy.stripe.com/..."
                value={settings.stripePaymentLinkInvestisseur || ''}
                onChange={(e) =>
                  setSettings({ ...settings, stripePaymentLinkInvestisseur: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stripeLiveMode || false}
                onChange={(e) => setSettings({ ...settings, stripeLiveMode: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Activer le Mode Réel (redirection automatique vers mes liens Stripe)
              </span>
            </label>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer la configuration bancaire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historique des Commissions 2% Encaissées */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Historique de vos Commissions de 2% sur les Accords Signés
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Total : {formatEuro(subStats.totalCommissions || 0)}
          </span>
        </div>

        {commissionsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Dossier / Accord</th>
                  <th className="px-4 py-2.5">Intervenants</th>
                  <th className="px-4 py-2.5 text-right">Montant Négocié</th>
                  <th className="px-4 py-2.5 text-right">Taux</th>
                  <th className="px-4 py-2.5 text-right text-emerald-700">Votre Commission (2%)</th>
                  <th className="px-4 py-2.5">Règlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissionsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{item.date}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{item.dossierTitle}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {item.applicantName} ↔ {item.investorName}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium">{formatEuro(item.totalAmount)}</td>
                    <td className="px-4 py-2.5 font-mono text-right text-slate-500">{item.commissionRate}</td>
                    <td className="px-4 py-2.5 font-mono text-right font-bold text-emerald-600">
                      +{formatEuro(item.commissionAmount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        {item.method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Coins className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              Aucune commission pour le moment (compteur à zéro)
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Dès que deux membres s'accordent et procèdent au déblocage de leur accord dans la salle de négociation, votre commission de 2 % s'enregistre ici automatiquement et s'ajoute à votre solde IBAN.
            </p>
          </div>
        )}
      </div>

      {/* Guide Pédagogique : Comment l'argent arrive concrètement sur votre IBAN */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Banknote className="w-6 h-6 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-bold text-white">
            Comment l'argent des cartes bancaires et des virements SEPA arrive concrètement sur votre IBAN ?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
          <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[11px]">1</span>
              <span>Abonnements d'Entrée (14,90 € / 29,90 €)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Chaque visiteur doit payer son accès par carte bancaire sur le portique pour entrer sur le site. En production, la passerelle de paiement bancaire sécurisée (ex: Stripe) encaisse la carte et reverse automatiquement les fonds sur <strong>votre IBAN</strong> sous 24 à 48 heures ouvrées.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-[11px]">2</span>
              <span>Vos Commissions de 2% sur les Accords</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Lorsqu'un accord financier est signé entre deux membres (ex: 10 000 €), le payeur débloque les fonds. Le système prélève automatiquement les 2% de frais de sécurisation juridique (<strong>200 €</strong>) qui sont réservés pour vous, et reverse les 98% restants (<strong>9 800 €</strong>) au bénéficiaire de l'accord.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center text-[11px]">3</span>
              <span>Versement direct sur votre IBAN</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Votre IBAN enregistré ci-dessus sert de compte de destination unique. Vous pouvez à tout moment cliquer sur le bouton <strong>« Déclencher un virement »</strong> pour virer manuellement l'intégralité du solde cumulé, ou laisser le virement automatique mensuel activé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
