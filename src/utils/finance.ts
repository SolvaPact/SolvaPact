import { DossierType } from '../types';

export const DEBT_COMMISSION_RATE = 0.012; // 1,2% sur les règlements de dettes
export const INVEST_COMMISSION_RATE = 0.02; // 2,0% sur les investissements et projets

export function getCommissionRate(type: DossierType = 'dette'): number {
  return type === 'dette' ? DEBT_COMMISSION_RATE : INVEST_COMMISSION_RATE;
}

export function calculatePlatformFee(principal: number, type: DossierType = 'dette'): number {
  if (principal <= 0) return 0;
  return Math.round(principal * getCommissionRate(type));
}

export function calculateNetReceived(principal: number, type: DossierType = 'dette'): number {
  return principal - calculatePlatformFee(principal, type);
}

export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(principal / termMonths);

  const monthlyRate = annualRatePct / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment);
}

export function calculateTotalRepayment(
  monthlyPayment: number,
  termMonths: number
): number {
  return monthlyPayment * termMonths;
}

export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number
): number {
  const total = calculateTotalRepayment(monthlyPayment, termMonths);
  return Math.max(0, total - principal);
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  if (principal <= 0 || termMonths <= 0) return schedule;

  const monthlyRate = annualRatePct / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePct, termMonths);
  let balance = principal;

  for (let m = 1; m <= termMonths; m++) {
    const interest = monthlyRate > 0 ? balance * monthlyRate : 0;
    let principalPart = monthlyPayment - interest;

    if (m === termMonths || principalPart > balance) {
      principalPart = balance;
    }
    balance = Math.max(0, balance - principalPart);

    schedule.push({
      month: m,
      payment: Math.round(principalPart + interest),
      principalPaid: Math.round(principalPart),
      interestPaid: Math.round(interest),
      remainingBalance: Math.round(balance),
    });

    if (balance <= 0) break;
  }

  return schedule;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(rate: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(rate) + ' %';
}
