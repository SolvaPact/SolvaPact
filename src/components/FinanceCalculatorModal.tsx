import React, { useState } from 'react';
import {
  calculateMonthlyPayment,
  calculateTotalInterest,
  calculateTotalRepayment,
  formatEuro,
  formatPct,
  generateAmortizationSchedule,
} from '../utils/finance';
import {
  Calculator,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  HandCoins,
  PiggyBank,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';

interface FinanceCalculatorProps {
  onOpenDepositWithParams?: (type: 'financement' | 'dette', amount: number, term: number) => void;
}

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({
  onOpenDepositWithParams,
}) => {
  const [calcMode, setCalcMode] = useState<'dette' | 'financement' | 'investisseur'>('dette');

  // 1. Debt restructuring state
  const [debtAmount, setDebtAmount] = useState<number>(18000);
  const [currentMonthlyPaid, setCurrentMonthlyPaid] = useState<number>(520);
  const [discountPct, setDiscountPct] = useState<number>(25);
  const [debtRepayTerm, setDebtRepayTerm] = useState<number>(48);
  const [debtInterestRate, setDebtInterestRate] = useState<number>(5.5);

  // 2. Financing state
  const [principal, setPrincipal] = useState<number>(12000);
  const [rate, setRate] = useState<number>(6.0);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // 3. Investor ROI state
  const [investAmount, setInvestAmount] = useState<number>(10000);
  const [investRate, setInvestRate] = useState<number>(7.0);
  const [investTerm, setInvestTerm] = useState<number>(24);

  // Math for debt settlement
  const cashSettlementAmount = Math.round(debtAmount * (1 - discountPct / 100));
  const debtorSavingsCapital = debtAmount - cashSettlementAmount;
  const debtNewMonthly = calculateMonthlyPayment(
    cashSettlementAmount,
    debtInterestRate,
    debtRepayTerm
  );
  const monthlySavings = Math.max(0, currentMonthlyPaid - debtNewMonthly);
  const totalDebtPaidNew = calculateTotalRepayment(debtNewMonthly, debtRepayTerm);

  // Math for loan
  const loanMonthly = calculateMonthlyPayment(principal, rate, termMonths);
  const loanTotalInterest = calculateTotalInterest(principal, loanMonthly, termMonths);
  const loanTotalCost = calculateTotalRepayment(loanMonthly, termMonths);
  const schedule = generateAmortizationSchedule(principal, rate, termMonths);

  // Math for investor (0 % commission SolvaPact)
  const investMonthly = calculateMonthlyPayment(investAmount, investRate, investTerm);
  const investTotalInterestGross = calculateTotalInterest(investAmount, investMonthly, investTerm);
  const investNetProfit = investTotalInterestGross;
  const investTotalCashBack = investAmount + investNetProfit;
  const investNetROI = ((investNetProfit / investAmount) * 100).toFixed(1);

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
            Évaluez vos mensualités, économies de dettes et rendements investisseurs
          </h2>
        </div>

        {/* 3-Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0 gap-1 overflow-x-auto">
          <button
            onClick={() => setCalcMode('dette')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'dette'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-amber-600" />
            <span>Restructuration Dette</span>
          </button>
          <button
            onClick={() => setCalcMode('financement')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'investisseur'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rendement Investisseur</span>
          </button>
        </div>
      </div>

      {/* MODE 1: RESTRUCTURATION DE DETTE (AVANT / APRÈS) */}
      {calcMode === 'dette' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Montant total de vos dettes actuelles
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    max="200000"
                    step="500"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Mensualités actuelles cumulées (estimées)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    step="10"
                    value={currentMonthlyPaid}
                    onChange={(e) => setCurrentMonthlyPaid(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    € / mois
                  </span>
                </div>
              </div>
            </div>

            {/* Décote slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Décote visée pour règlement comptant sous seing privé
                </label>
                <span className="text-lg font-bold text-amber-700 tabular-nums">
                  -{discountPct} % de décote
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>5 % (Accord classique)</span>
                <span>25 % (Standard contentieux)</span>
                <span>50 % (Créance décotée)</span>
              </div>
            </div>

            {/* Durée & Taux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Durée de remboursement au financeur
                </label>
                <select
                  value={debtRepayTerm}
                  onChange={(e) => setDebtRepayTerm(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value={12}>12 mois (1 an)</option>
                  <option value={24}>24 mois (2 ans)</option>
                  <option value={36}>36 mois (3 ans)</option>
                  <option value={48}>48 mois (4 ans)</option>
                  <option value={60}>60 mois (5 ans)</option>
                  <option value={84}>84 mois (7 ans)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Taux proposé au financeur (% annuel)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="15"
                  value={debtInterestRate}
                  onChange={(e) => setDebtInterestRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>
            </div>

            {onOpenDepositWithParams && (
              <button
                onClick={() =>
                  onOpenDepositWithParams('dette', cashSettlementAmount, debtRepayTerm)
                }
                className="w-full py-3.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Déposer ce dossier de rachat ({formatEuro(cashSettlementAmount)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Comparison Column (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/70 via-slate-50 to-emerald-50/70 border border-amber-200/80 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                Bilan de restructuration SolvaPact
              </span>
              <p className="text-3xl font-extrabold text-emerald-800 tabular-nums">
                +{formatEuro(monthlySavings)}{' '}
                <span className="text-xs font-normal text-slate-600">/ mois économisés</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Gain direct de pouvoir d'achat dans votre budget mensuel.
              </p>
            </div>

            {/* Comparatif Avant / Après */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Avant SolvaPact
                  </span>
                  <span className="text-sm font-bold text-slate-700">Dettes dispersées</span>
                </div>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatEuro(currentMonthlyPaid)} / mois
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Après accord SolvaPact
                  </span>
                  <span className="text-sm font-bold text-emerald-950">1 Mensualité unique</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-700">
                  {formatEuro(debtNewMonthly)} / mois
                </span>
              </div>
            </div>

            {/* Capital effacé */}
            <div className="p-4 rounded-xl bg-white border border-amber-200/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Capital initial effacé :</span>
                <span className="font-mono font-bold text-emerald-700">
                  -{formatEuro(debtorSavingsCapital)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">Montant net racheté :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatEuro(cashSettlementAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">Commission sur l'accord :</span>
                <span className="font-mono font-bold text-emerald-700">0 % (0 €)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: BESOIN D'EMPRUNT & FINANCEMENT */}
      {calcMode === 'financement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Montant recherché (Capital)
                </label>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatEuro(principal)}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 000 €</span>
                <span>50 000 €</span>
                <span>100 000 €</span>
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
                onClick={() => onOpenDepositWithParams('financement', principal, termMonths)}
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
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 pt-2"
            >
              {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showSchedule ? 'Masquer' : 'Afficher'} l'échéancier d'amortissement détaillé</span>
            </button>

            {showSchedule && (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                <table className="w-full text-left">
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
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Intérêts totaux reversés</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">
                  +{formatEuro(loanTotalInterest)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Coût total remboursé</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(loanTotalCost)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-950">
                <span>Commission sur le capital :</span>
                <span className="tabular-nums font-bold">0 % (0 €)</span>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Montant à placer / financer
                </label>
                <span className="text-lg font-bold text-indigo-900 tabular-nums">
                  {formatEuro(investAmount)}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 000 €</span>
                <span>25 000 €</span>
                <span>50 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Taux d'intérêt annuel brut souhaité
                </label>
                <span className="text-lg font-bold text-indigo-900 tabular-nums">
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
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
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
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>6 mois</span>
                <span>24 mois</span>
                <span>60 mois (5 ans)</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200/80 text-xs text-indigo-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Garanties et Sûretés Réelles
              </p>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Chaque engagement donne lieu à une reconnaissance de dette signée sous seing privé (Article 1892 du Code Civil) assortie le cas échéant de sûretés (caution solidaire, nantissement ou engagement de cession sur salaire).
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-200/80 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                Rentrée mensuelle d'argent
              </span>
              <p className="text-3xl font-extrabold text-indigo-950 tabular-nums">
                +{formatEuro(investMonthly)}{' '}
                <span className="text-xs font-normal text-slate-500">/ mois</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Versé directement sur votre compte bancaire chaque mois.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-indigo-200/70 text-xs">
              <div>
                <span className="text-slate-500 block">Intérêts bruts totaux</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">
                  +{formatEuro(investTotalInterestGross)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Gain net (0 % commission)</span>
                <span className="text-base font-bold text-indigo-900 tabular-nums">
                  +{formatEuro(investNetProfit)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-indigo-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Capital initial remboursé :</span>
                <span className="font-mono font-bold text-slate-900">{formatEuro(investAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">Total net récupéré :</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
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
