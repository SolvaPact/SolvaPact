import { LoyaltyTier, User } from '../types';

export const BASE_PUBLICATION_PRICE = 29.99;
export const LOYALTY_ACTIVATION_PRICE = 80;
export const EXP_PER_DOSSIER = 10;

const OWNER_GOLD_EMAILS = ['solvapact.vercel.app@gmail.com', 'hugolaumonier@gmail.com'];

export function isOwnerGoldEmail(email?: string | null): boolean {
  if (!email) return false;
  return OWNER_GOLD_EMAILS.includes(email.trim().toLowerCase());
}

export function applyOwnerGoldStatus(user: User): User {
  if (!isOwnerGoldEmail(user.email)) return user;
  return {
    ...user,
    loyaltyActive: true,
    loyaltyExp: Math.max(user.loyaltyExp || 0, 300),
    loyaltyActivatedAt: user.loyaltyActivatedAt || new Date().toLocaleDateString('fr-FR'),
  };
}

export interface LoyaltyStatus {
  active: boolean;
  exp: number;
  tier: LoyaltyTier;
  label: string;
  badgeTitle: string;
  discountPct: number;
  publicationPrice: number;
  nextTierLabel: string | null;
  nextTierExp: number | null;
  expToNextTier: number;
}

export function getLoyaltyStatus(user?: User | null): LoyaltyStatus {
  const isOwner = isOwnerGoldEmail(user?.email);
  const active = Boolean(user?.loyaltyActive) || isOwner;
  const exp = isOwner ? Math.max(user?.loyaltyExp || 0, 300) : user?.loyaltyExp || 0;

  if (!active) {
    return {
      active: false,
      exp: 0,
      tier: 'none',
      label: 'Standard',
      badgeTitle: '',
      discountPct: 0,
      publicationPrice: BASE_PUBLICATION_PRICE,
      nextTierLabel: 'Compte Fidélité (80 €)',
      nextTierExp: 50,
      expToNextTier: 50,
    };
  }

  let tier: LoyaltyTier = 'standard';
  let label = 'Actif';
  let badgeTitle = 'Membre Fidélité';
  let discountPct = 0;
  let nextTierLabel: string | null = 'Bronze (-10 %)';
  let nextTierExp: number | null = 50;

  if (exp >= 300) {
    tier = 'gold';
    label = 'Gold';
    badgeTitle = 'Membre Certifié Gold';
    discountPct = 23;
    nextTierLabel = null;
    nextTierExp = null;
  } else if (exp >= 150) {
    tier = 'silver';
    label = 'Silver';
    badgeTitle = 'Membre Fidèle Silver';
    discountPct = 17;
    nextTierLabel = 'Gold (-23 %)';
    nextTierExp = 300;
  } else if (exp >= 50) {
    tier = 'bronze';
    label = 'Bronze';
    badgeTitle = 'Membre Fidèle';
    discountPct = 10;
    nextTierLabel = 'Silver (-17 %)';
    nextTierExp = 150;
  }

  const publicationPrice =
    Math.round(BASE_PUBLICATION_PRICE * (1 - discountPct / 100) * 100) / 100;

  return {
    active: true,
    exp,
    tier,
    label,
    badgeTitle,
    discountPct,
    publicationPrice,
    nextTierLabel,
    nextTierExp,
    expToNextTier: nextTierExp ? Math.max(0, nextTierExp - exp) : 0,
  };
}

export function getLoyaltyNameColorClass(tier?: LoyaltyTier, darkBackground = false): string {
  if (tier === 'gold') {
    return darkBackground ? 'text-amber-300 font-bold' : 'text-amber-500 font-bold';
  }
  if (tier === 'silver') {
    return darkBackground ? 'text-slate-300 font-bold' : 'text-slate-500 font-bold';
  }
  if (tier === 'bronze') {
    return darkBackground ? 'text-orange-400 font-bold' : 'text-amber-800 font-bold';
  }
  return darkBackground ? 'text-white font-semibold' : 'text-slate-900 font-semibold';
}

export function calculateEffortRate(
  monthlyIncome: number,
  existingCharges: number,
  newMonthlyPayment: number
): number {
  if (!monthlyIncome || monthlyIncome <= 0) return 100;
  return Math.round(((existingCharges + newMonthlyPayment) / monthlyIncome) * 100);
}

export function computeRiskGrade(effortRate: number): 'A' | 'B' | 'C' | 'D' {
  if (effortRate <= 33) return 'A';
  if (effortRate <= 42) return 'B';
  if (effortRate <= 55) return 'C';
  return 'D';
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
  const hasCents = Math.abs(amount - Math.round(amount)) > 0.001;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(rate: number): string {
  return (
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(rate) + ' %'
  );
}
