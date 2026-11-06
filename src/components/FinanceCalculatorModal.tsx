import React, { useState } from 'react';
import {
  calculateMonthlyPayment,
  calculateTotalInterest,
  calculateTotalRepayment,
  formatEuro,
  formatPct,
  generateAmortizationSchedule,
} from '../utils/finance';
import { Calculator, ArrowRight, ShieldCheck, TrendingUp, HandCoins } from 'lucide-react';

interface FinanceCalculatorProps {
  onOpenDepositWithParams?: (type: 'financement' | 'dette', amount: number, term: number) => void;
}

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({
  onOpenDepositWithParams,
}) => {
  const [calcMode, setCalcMode] = useState<'financement' | 'dette'>('financement');

  // Financing state
  const [principal, setPrincipal] = useState<number>(15000);
  const [rate, setRate] = useState<number>(5.8);
  const [termMonths, setTermMonths] = useState<number>(36);

  // Debt settlement state
  const [debtAmount, setDebtAmount] = useState<number>(20000);
  const [discountPct, setDiscountPct] = useState<number>(25);
  const [debtRepayTerm, setDebtRepayTerm] = useState<number>(36);
  const [debtInterestRate, setDebtInterestRate] = useState<number>(5.0);

  // Math for loan
  const loanMonthly = calculateMonthlyPayment(principal, rate, termMonths);
  const loanTotalInterest = calculateTotalInterest(principal, loanMonthly, termMonths);
  const loanTotalCost = calculateTotalRepayment(loanMonthly, termMonths);
  const schedule = generateAmortizationSchedule(principal, rate, termMonths);

  // Math for debt settlement
  const cashSettlementAmount = Math.round(debtAmount * (1 - discountPct / 100));
  const debtorSavings = debtAmount - cashSettlementAmount;
  const debtNewMonthly = calculateMonthlyPayment(
    cashSettlementAmount,
    debtInterestRate,
    debtRepayTerm
  );
  const debtTotalRepaid = calculateTotalRepayment(debtNewMonthly, debtRepayTerm);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs my-6 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4 text-slate-700" />
            <span>Simulateur & Analyse Financière SolvaPact</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Estimez vos mensualités, économies de dette et gains investisseur
          </h2>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setCalcMode('financement')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              calcMode === 'financement'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Besoin de Financement
          </button>
          <button
            onClick={() => setCalcMode('dette')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              calcMode === 'dette'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rachat de Dette avec Décote
          </button>
        </div>
      </div>

      {calcMode === 'financement' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Principal slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Montant emprunté (Capital)
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

            {/* Duration slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Durée d'amortissement
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
                <span>6 mois (Rapide)</span>
                <span>48 mois (Moyen)</span>
                <span>120 mois (10 ans - Petite mensualité)</span>
              </div>
              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 p-2 rounded-lg mt-2">
                💡 <strong>Astuce mensualité :</strong> Plus vous allongez la durée (ex. 60 ou 84 mois), plus votre mensualité diminue pour s'adapter à votre budget.
              </p>
            </div>

            {/* Interest Rate slider */}
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
                className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Déposer un dossier avec ces paramètres</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Card (5 cols) */}
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

            {/* 2% Commission details */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <div className="flex items-center justify-between font-semibold text-amber-950">
                <span>Commission plateforme (2%) :</span>
                <span className="tabular-nums font-bold">
                  {formatEuro(Math.round(principal * 0.02))}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Frais prélevés à la signature de l'accord pour la sécurisation juridique et le séquestre. Net déboursé : {formatEuro(principal - Math.round(principal * 0.02))}.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Perspective de l'Investisseur
              </p>
              <p className="text-[11px] leading-relaxed">
                Rendement brut annuel de <strong className="tabular-nums">{formatPct(rate)}</strong>. Flux de trésorerie mensuel garanti par les sûretés conventionnelles et protocoles sous seing privé.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Debt controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Montant initial de la dette réclamée
                </label>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatEuro(debtAmount)}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="150000"
                step="1000"
                value={debtAmount}
                onChange={(e) => setDebtAmount(Number(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>2 000 €</span>
                <span>75 000 €</span>
                <span>150 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Décote négociée pour paiement comptant
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
                <span>5 % (Léger rabais)</span>
                <span>25 % (Standard contentieux)</span>
                <span>50 % (Créance décotée)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Durée de remboursement au financeur
                </label>
                <select
                  value={debtRepayTerm}
                  onChange={(e) => setDebtRepayTerm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value={12}>12 mois (1 an)</option>
                  <option value={24}>24 mois (2 ans)</option>
                  <option value={36}>36 mois (3 ans)</option>
                  <option value={48}>48 mois (4 ans)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Taux rémunération financeur
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={debtInterestRate}
                  onChange={(e) => setDebtInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
            </div>

            {onOpenDepositWithParams && (
              <button
                onClick={() =>
                  onOpenDepositWithParams('dette', cashSettlementAmount, debtRepayTerm)
                }
                className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Déposer ce dossier de rachat de dette</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Debt Results (5 cols) */}
          <div className="lg:col-span-5 bg-amber-50/50 border border-amber-200/70 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold text-amber-900 uppercase block mb-1">
                Économie nette immédiate pour le débiteur
              </span>
              <p className="text-3xl font-extrabold text-emerald-800 tabular-nums">
                -{formatEuro(debtorSavings)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                La dette initiale de {formatEuro(debtAmount)} est soldée pour {formatEuro(cashSettlementAmount)}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-amber-200/60 text-xs">
              <div>
                <span className="text-slate-500 block">Fonds versés comptant</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(cashSettlementAmount)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Nouvelle mensualité</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(debtNewMonthly)} / m
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <HandCoins className="w-4 h-4 text-emerald-600" />
                Gagnant - Gagnant
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Le créancier initial récupère ses liquidités tout de suite. Le débiteur réduit son passif de <strong className="tabular-nums">{formatEuro(debtorSavings)}</strong> et rééchelonne à un rythme serein. L'investisseur est rémunéré à {formatPct(debtInterestRate)}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
