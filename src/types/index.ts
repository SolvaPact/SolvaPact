export type DossierType = 'dette' | 'investissement' | 'autre';

export type RiskGrade = 'A' | 'B' | 'C' | 'D';

export interface ApplicantInfo {
  name: string;
  pseudonym: string;
  city: string;
  postalCode?: string;
  profession: string;
  monthlyIncome: number;
  existingCharges: number;
  verifiedIdentity: boolean;
  verifiedIncome: boolean;
  riskGrade: RiskGrade;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'identite' | 'revenus' | 'justificatif_dette' | 'garantie';
  size: string;
  verified: boolean;
  date: string;
}

export interface Dossier {
  id: string;
  title: string;
  type: DossierType;
  category: string;
  amountRequested: number; // Montant souhaité ou montant restant dû
  originalDebtAmount?: number; // Pour les dettes: montant initial avant négociation
  targetInterestRate?: number; // Pour investissement ou prêt: ex 5.5%
  targetDiscount?: number; // Pour rachat de dette: ex 20%
  maxMonthlyPayment: number; // Capacité mensuelle
  termMonths: number; // Durée en mois
  description: string;
  contextStory: string;
  guaranteeType: string;
  applicant: ApplicantInfo;
  documents: DocumentItem[];
  status: 'open' | 'in_negotiation' | 'agreement_reached' | 'funded';
  createdAt: string;
  offersCount: number;
  urgency: 'normale' | 'prioritaire' | 'urgente';
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  email: string;
  role: 'demandeur' | 'investisseur';
  city: string;
  postalCode?: string;
  phone?: string;
  reasonForJoining?: string;
  createdAt: string;
  isSubscribed?: boolean;
  subscriptionPlan?: 'demandeur' | 'investisseur';
  subscriptionPrice?: number;
  subscriptionNextBilling?: string;
}

export interface Offer {
  id: string;
  dossierId: string;
  investorName: string;
  investorAvatar?: string;
  proposedAmount: number;
  platformFee: number; // 2% de commission plateforme
  netAmountToApplicant: number; // Montant net perçu
  proposedInterestRate: number; // % annuel
  proposedTermMonths: number;
  discountPercentage?: number; // % de décote pour rachat de dette
  proposedMonthlyPayment: number;
  conditions: string;
  status: 'pending' | 'countered' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderRole: 'demandeur' | 'investisseur' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  attachedOffer?: Offer;
}

export interface NegotiationThread {
  id: string;
  dossierId: string;
  dossierTitle: string;
  dossierType: DossierType;
  applicantName: string;
  applicantPseudonym: string;
  investorName: string;
  currentOffer: Offer;
  offerHistory: Offer[];
  messages: ChatMessage[];
  status: 'active' | 'agreement_signed' | 'closed';
  updatedAt: string;
  disbursementStatus?: 'en_attente_reglement' | 'fonds_liberes' | 'quittance_validee';
  disbursementMethod?: 'carte_bancaire' | 'virement_sepa';
  disbursementDate?: string;
}

export interface PayoutTransaction {
  id: string;
  dossierId: string;
  dossierTitle: string;
  totalTransactionAmount: number;
  commissionFee2Pct: number;
  status: 'en_attente_signature' | 'sequestre_actif' | 'vire_vers_votre_compte';
  date: string;
  payoutReference: string;
}

export interface FounderSettings {
  founderName: string;
  founderEmail: string;
  founderIban: string;
  payoutProvider: 'Stripe Connect' | 'Lemonway' | 'Mangopay' | 'Virement SEPA Direct';
  autoPayoutEnabled: boolean;
  totalSubscribers?: number;
  monthlyRevenue?: number;
  stripeLiveMode?: boolean;
  stripePaymentLinkDemandeur?: string;
  stripePaymentLinkInvestisseur?: string;
}

export type ActiveTab =
  | 'explorer'
  | 'dette'
  | 'investissement'
  | 'autre'
  | 'mes_dossiers'
  | 'negociations'
  | 'simulateur'
  | 'fondateur'
  | 'aide';
