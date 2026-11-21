import React, { useState } from 'react';
import {
  calculateMonthlyPayment,
  calculateTotalInterest,
  calculateTotalRepayment,
  formatAriaryApprox,
  formatEuro,
  formatPct,
  generateAmortizationSchedule,
} from '../utils/finance';
import {
  Calculator,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FinanceCalculatorProps {
  onOpenDepositWithParams?: (type: 'investissement' | 'autre', amount: number, term: number) => void;
}

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({
  onOpenDepositWithParams,
}) => {
  const [calcMode, setCalcMode] = useState<'financement' | 'investisseur'>('financement');

  // 2. Financing state
  const [principal, setPrincipal] = useState<number>(12000);
  const [principalInput, setPrincipalInput] = useState<string>('12000');
  const [rate, setRate] = useState<number>(6.0);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // 3. Investor ROI state
  const [investAmount, setInvestAmount] = useState<number>(10000);
  const [investAmountInput, setInvestAmountInput] = useState<string>('10000');
  const [investRate, setInvestRate] = useState<number>(7.0);
  const [investTerm, setInvestTerm] = useState<number>(24);

  const clampAmount = (val: number) => Math.min(1000000, Math.max(100, Math.round(val)));

  const handlePrincipalInputChange = (raw: string) => {
    setPrincipalInput(raw);
    const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
    if (cleaned === '') return;
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPrincipal(Math.min(1000000, Math.round(parsed)));
    }
  };

  const handlePrincipalInputBlur = () => {
    const cleaned = principalInput.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(cleaned);
    const safe = !Number.isNaN(parsed) && parsed > 0 ? clampAmount(parsed) : principal;
    setPrincipal(safe);
    setPrincipalInput(String(safe));
  };

  const handlePrincipalSliderChange = (val: number) => {
    setPrincipal(val);
    setPrincipalInput(String(val));
  };

  const handleInvestInputChange = (raw: string) => {
    setInvestAmountInput(raw);
    const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
    if (cleaned === '') return;
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setInvestAmount(Math.min(1000000, Math.round(parsed)));
    }
  };

  const handleInvestInputBlur = () => {
    const cleaned = investAmountInput.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(cleaned);
    const safe = !Number.isNaN(parsed) && parsed > 0 ? clampAmount(parsed) : investAmount;
    setInvestAmount(safe);
    setInvestAmountInput(String(safe));
  };

  const handleInvestSliderChange = (val: number) => {
    setInvestAmount(val);
    setInvestAmountInput(String(val));
  };

  // Math for loan
  const loanMonthly = calculateMonthlyPayment(principal, rate, termMonths);
  const loanTotalInterest = calculateTotalInterest(principal, loanMonthly, termMonths);
  const loanTotalCost = calculateTotalRepayment(loanMonthly, termMonths);
  const schedule = generateAmortizationSchedule(principal, rate, termMonths);

  // Math for investor (100 % direct between parties)
  const investMonthly = calculateMonthlyPayment(investAmount, investRate, investTerm);
  const investTotalInterestGross = calculateTotalInterest(investAmount, investMonthly, investTerm);
  const investNetProfit = investTotalInterestGross;
  const investTotalCashBack = investAmount + investNetProfit;
  const investNetROI = investAmount > 0 ? ((investNetProfit / investAmount) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs my-6 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4 text-slate-700" />
            <span>Simulateur & Analyse Financière SolvaPact</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Évaluez vos mensualités de projet et vos rendements investisseurs
          </h2>
        </div>

        {/* 2-Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0 gap-1 overflow-x-auto">
          <button
            onClick={() => setCalcMode('financement')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'financement'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
            <span>Emprunt / Projet</span>
          </button>
          <button
            onClick={() => setCalcMode('investisseur')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'investisseur'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>Rendement Investisseur</span>
          </button>
        </div>
      </div>

      {/* MODE 1: BESOIN D'EMPRUNT & FINANCEMENT */}
      {calcMode === 'financement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <label
                  htmlFor="sim-principal-exact"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Montant recherché (Capital)
                </label>
                <div className="flex items-center gap-3 ml-auto">
                  <div className="relative">
                    <input
                      id="sim-principal-exact"
                      type="number"
                      min={100}
                      max={1000000}
                      step="1"
                      inputMode="numeric"
                      aria-label="Montant exact recherché en euros"
                      value={principalInput}
                      onChange={(e) => handlePrincipalInputChange(e.target.value)}
                      onBlur={handlePrincipalInputBlur}
                      className="w-32 sm:w-36 pl-3 pr-7 py-1.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-right tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      €
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums block leading-tight">
                      {formatEuro(principal)}
                    </span>
                    <span className="text-[11px] font-medium text-orange-700 tabular-nums">
                      {formatAriaryApprox(principal)}
                    </span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={Math.min(100000, Math.max(1000, principal))}
                onChange={(e) => handlePrincipalSliderChange(Number(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 000 €</span>
                <span>50 000 €</span>
                <span>100 000 € (ou saisie libre jusqu'à 1 M€)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Durée de remboursement
                </label>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {termMonths} mois ({(termMonths / 12).toFixed(1)} ans)
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="120"
                step="6"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>6 mois</span>
                <span>48 mois</span>
                <span>120 mois (10 ans)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Taux d'intérêt annuel négocié
                </label>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPct(rate)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1.0 % (Solidaire)</span>
                <span>6.0 % (Moyen P2P)</span>
                <span>15.0 % (Haut risque)</span>
              </div>
            </div>

            {onOpenDepositWithParams && (
              <button
                onClick={() => onOpenDepositWithParams('investissement', principal, termMonths)}
                className="w-full py-3.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Déposer un dossier avec ces paramètres</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Échéancier */}
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 pt-2 cursor-pointer"
            >
              {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showSchedule ? 'Masquer' : 'Afficher'} l'échéancier d'amortissement détaillé</span>
            </button>

            {showSchedule && (
              <div className="max-h-60 overflow-auto thin-scrollbar border border-slate-200 rounded-xl text-xs">
                <table className="w-full min-w-[480px] text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Mois</th>
                      <th className="py-2 px-3 text-right">Mensualité</th>
                      <th className="py-2 px-3 text-right">Part Capital</th>
                      <th className="py-2 px-3 text-right">Part Intérêts</th>
                      <th className="py-2 px-3 text-right">Restant Dû</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {schedule.slice(0, 12).map((item) => (
                      <tr key={item.month}>
                        <td className="py-1.5 px-3 font-semibold text-slate-700">Mois {item.month}</td>
                        <td className="py-1.5 px-3 text-right">{formatEuro(item.payment)}</td>
                        <td className="py-1.5 px-3 text-right text-slate-600">{formatEuro(item.principalPaid)}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">+{formatEuro(item.interestPaid)}</td>
                        <td className="py-1.5 px-3 text-right text-slate-500">{formatEuro(item.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Mensualité constante
              </span>
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {formatEuro(loanMonthly)} <span className="text-sm font-normal text-slate-500">/ mois</span>
              </p>
              <p className="text-xs font-semibold text-orange-700 tabular-nums mt-0.5">
                {formatAriaryApprox(loanMonthly)} / mois
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Intérêts totaux reversés</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums block">
                  +{formatEuro(loanTotalInterest)}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  +{formatAriaryApprox(loanTotalInterest)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Coût total remboursé</span>
                <span className="text-base font-bold text-slate-900 tabular-nums block">
                  {formatEuro(loanTotalCost)}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {formatAriaryApprox(loanTotalCost)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-950">
                <span>Mode d'accord entre membres :</span>
                <span className="font-bold">100 % net · Accord direct</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                100 % net perçu par l'emprunteur ({formatEuro(principal)}). Seuls 29,99 € sont réglés à la publication du dossier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SIMULATEUR DE RENDEMENT INVESTISSEUR */}
      {calcMode === 'investisseur' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <label
                  htmlFor="sim-invest-exact"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Montant à placer / financer
                </label>
                <div className="flex items-center gap-3 ml-auto">
                  <div className="relative">
                    <input
                      id="sim-invest-exact"
                      type="number"
                      min={100}
                      max={1000000}
                      step="1"
                      inputMode="numeric"
                      aria-label="Montant exact à placer en euros"
                      value={investAmountInput}
                      onChange={(e) => handleInvestInputChange(e.target.value)}
                      onBlur={handleInvestInputBlur}
                      className="w-32 sm:w-36 pl-3 pr-7 py-1.5 text-sm font-bold text-orange-950 bg-orange-50/40 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 text-right tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-600">
                      €
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-bold text-orange-900 tabular-nums block leading-tight">
                      {formatEuro(investAmount)}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 tabular-nums">
                      {formatAriaryApprox(investAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={Math.min(50000, Math.max(1000, investAmount))}
                onChange={(e) => handleInvestSliderChange(Number(e.target.value))}
                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 000 €</span>
                <span>25 000 €</span>
                <span>50 000 € (ou saisie libre jusqu'à 1 M€)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Taux d'intérêt annuel brut souhaité
                </label>
                <span className="text-lg font-bold text-orange-900 tabular-nums">
                  {formatPct(investRate)}
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="14"
                step="0.5"
                value={investRate}
                onChange={(e) => setInvestRate(Number(e.target.value))}
                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>3.0 % (Faible risque)</span>
                <span>7.0 % (Moyenne SolvaPact)</span>
                <span>14.0 % (Rendement élevé)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Durée du placement (Horizon)
                </label>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {investTerm} mois ({(investTerm / 12).toFixed(1)} ans)
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                step="6"
                value={investTerm}
                onChange={(e) => setInvestTerm(Number(e.target.value))}
                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>6 mois</span>
                <span>24 mois</span>
                <span>60 mois (5 ans)</span>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200/80 text-xs text-orange-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                Garanties et Sûretés Réelles
              </p>
              <p className="text-[11px] text-orange-900 leading-relaxed">
                Chaque engagement donne lieu à un contrat de prêt ou pacte d'associés signé sous seing privé (Articles 1892 et 2044 du Code Civil) assorti le cas échéant de sûretés (caution solidaire, nantissement ou engagement de cession sur salaire).
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-orange-50/70 to-amber-50/40 border border-orange-200/80 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block mb-1">
                Rentrée mensuelle d'argent
              </span>
              <p className="text-3xl font-extrabold text-orange-950 tabular-nums">
                +{formatEuro(investMonthly)}{' '}
                <span className="text-xs font-normal text-slate-500">/ mois</span>
              </p>
              <p className="text-xs font-semibold text-emerald-700 tabular-nums mt-0.5">
                +{formatAriaryApprox(investMonthly)} / mois
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Versé directement entre membres (MVola, Orange Money, virement).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-orange-200/70 text-xs">
              <div>
                <span className="text-slate-500 block">Intérêts bruts totaux</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums block">
                  +{formatEuro(investTotalInterestGross)}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  +{formatAriaryApprox(investTotalInterestGross)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Gain net (100 % direct)</span>
                <span className="text-base font-bold text-orange-900 tabular-nums block">
                  +{formatEuro(investNetProfit)}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  +{formatAriaryApprox(investNetProfit)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-orange-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Capital initial remboursé :</span>
                <span className="font-mono font-bold text-slate-900">{formatEuro(investAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">Total net récupéré :</span>
                <span className="font-mono font-bold text-orange-700 text-sm">
                  {formatEuro(investTotalCashBack)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">Rendement net global :</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">+{investNetROI} %</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
