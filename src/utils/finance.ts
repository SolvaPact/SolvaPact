import { LoyaltyTier, User } from '../types';

export const BASE_PUBLICATION_PRICE = 29.99;
export const LOYALTY_ACTIVATION_PRICE = 39.99;
export const EXP_PER_DOSSIER = 10;
export const PROMO_PERIOD_ACTIVE =
  String(import.meta.env.VITE_PROMO_PERIOD_ACTIVE || '').toLowerCase() === 'true';
export const DIAMOND_PROMO_DISCOUNT_PCT = 50;

const OWNER_GOLD_EMAILS = ['solvapact.vercel.app@gmail.com', 'hugolaumonier@gmail.com'];

export function isOwnerGoldEmail(email?: string | null): boolean {
  if (!email) return false;
  return OWNER_GOLD_EMAILS.includes(email.trim().toLowerCase());
}

export function canViewDailyReport(user?: User | null): boolean {
  if (!user) return false;
  if (isOwnerGoldEmail(user.email)) return true;
  const fullName = (user.name || `${user.firstName || ''} ${user.lastName || ''}`)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return fullName === 'hugo laumonier' && isOwnerGoldEmail(user.email);
}

export function applyOwnerGoldStatus(user: User): User {
  if (isOwnerGoldEmail(user.email)) {
    return {
      ...user,
      loyaltyActive: true,
      loyaltyExp: Math.max(120, user.loyaltyExp || 0),
      loyaltyActivatedAt: user.loyaltyActivatedAt || new Date().toLocaleDateString('fr-FR'),
    };
  }
  return user;
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
  isDiamond: boolean;
  diamondPublicationsCount: number;
  isPromoPeriod: boolean;
  isFreePublicationNow: boolean;
  dossiersUntilFreePublication: number | null;
}

export function getLoyaltyStatus(user?: User | null): LoyaltyStatus {
  const active = Boolean(user?.loyaltyActive);
  const exp = user?.loyaltyExp || 0;
  const diamondCount = Math.max(0, user?.diamondPublicationsCount || 0);

  if (!active) {
    return {
      active: false,
      exp: 0,
      tier: 'none',
      label: 'Standard',
      badgeTitle: '',
      discountPct: 0,
      publicationPrice: BASE_PUBLICATION_PRICE,
      nextTierLabel: 'Compte Fidélité (39,99 € · Bronze inclus)',
      nextTierExp: 0,
      expToNextTier: 0,
      isDiamond: false,
      diamondPublicationsCount: 0,
      isPromoPeriod: PROMO_PERIOD_ACTIVE,
      isFreePublicationNow: false,
      dossiersUntilFreePublication: null,
    };
  }

  let tier: LoyaltyTier = 'bronze';
  let label = 'Bronze';
  let badgeTitle = 'Membre Vérifié';
  let discountPct = PROMO_PERIOD_ACTIVE ? 15 : 10;
  let nextTierLabel: string | null = 'Silver (-17 %)';
  let nextTierExp: number | null = 30;

  if (exp >= 120) {
    tier = 'diamond';
    label = 'Diamond';
    badgeTitle = 'Membre Prestigieux Officiel';
    discountPct = PROMO_PERIOD_ACTIVE ? DIAMOND_PROMO_DISCOUNT_PCT : 35;
    nextTierLabel = null;
    nextTierExp = null;
  } else if (exp >= 60) {
    tier = 'gold';
    label = 'Gold';
    badgeTitle = 'Membre Précieux';
    discountPct = PROMO_PERIOD_ACTIVE ? 30 : 23;
    nextTierLabel = 'Diamond (-35 % permanents + promos jusqu’à -50 %)';
    nextTierExp = 120;
  } else if (exp >= 30) {
    tier = 'silver';
    label = 'Silver';
    badgeTitle = 'Membre Fidèle';
    discountPct = PROMO_PERIOD_ACTIVE ? 22 : 17;
    nextTierLabel = 'Gold (-23 %)';
    nextTierExp = 60;
  }

  const isDiamond = tier === 'diamond';
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
    isDiamond,
    diamondPublicationsCount: diamondCount,
    isPromoPeriod: PROMO_PERIOD_ACTIVE,
    isFreePublicationNow: false,
    dossiersUntilFreePublication: null,
  };
}

export function getLoyaltyNameColorClass(_tier?: LoyaltyTier, darkBackground = false): string {
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

export const EUR_TO_MGA_RATE = 4950;

export function formatAriaryApprox(euroAmount: number): string {
  const mga = Math.round((euroAmount * EUR_TO_MGA_RATE) / 1000) * 1000;
  return `~${new Intl.NumberFormat('fr-FR').format(mga)} Ar`;
}

export function formatPct(rate: number): string {
  return (
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(rate) + ' %'
  );
}
