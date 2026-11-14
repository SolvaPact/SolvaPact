export type DossierType = 'dette' | 'investissement' | 'autre';

export type InvestmentReturnMode = 'remboursement' | 'parts_sociales' | 'redevance_ca' | 'hybride';

export interface ProjectDetails {
  projectStage?: string;
  legalStructure?: string;
  ownContribution?: number;
  useOfFunds?: string;
  timeline?: string;
  projectedRevenue?: string;
  equityExitNote?: string;
  employmentTenure?: string;
}

export type RiskGrade = 'A' | 'B' | 'C' | 'D';

export type LoyaltyTier = 'none' | 'standard' | 'bronze' | 'silver' | 'gold' | 'diamond';

export interface ApplicantInfo {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  pseudonym: string;
  city: string;
  postalCode?: string;
  profession: string;
  monthlyIncome: number;
  existingCharges: number;
  verifiedIdentity: boolean;
  verifiedIncome: boolean;
  riskGrade: RiskGrade;
  loyaltyTier?: LoyaltyTier;
  loyaltyTitle?: string;
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
  amountRequested: number;
  originalDebtAmount?: number;
  targetInterestRate?: number;
  targetDiscount?: number;
  maxMonthlyPayment: number;
  termMonths: number;
  investmentReturnMode?: InvestmentReturnMode;
  equityPercentage?: number;
  counterpartSummary?: string;
  projectDetails?: ProjectDetails;
  description: string;
  contextStory: string;
  guaranteeType: string;
  applicant: ApplicantInfo;
  documents: DocumentItem[];
  status: 'open' | 'in_negotiation' | 'agreement_reached' | 'funded';
  createdAt: string;
  offersCount: number;
  urgency: 'normale' | 'prioritaire' | 'urgente';
  publicationPaidAmount?: number;
  isDiamondPriority?: boolean;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  email: string;
  role: 'demandeur' | 'investisseur';
  profession?: string;
  city: string;
  postalCode?: string;
  phone?: string;
  reasonForJoining?: string;
  createdAt: string;
  acceptedTermsAt?: string;
  loyaltyActive?: boolean;
  loyaltyExp?: number;
  loyaltyActivatedAt?: string;
  diamondPublicationsCount?: number;
}

export interface Offer {
  id: string;
  dossierId: string;
  investorName: string;
  investorAvatar?: string;
  proposedAmount: number;
  proposedInterestRate: number;
  proposedTermMonths: number;
  discountPercentage?: number;
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

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  itemDescription: string;
  amountHT: number;
  vatRate: number;
  vatAmount: number;
  amountTTC: number;
  paymentMethod: string;
  transactionId?: string;
  type: 'publication' | 'loyalty';
}

export type ActiveTab =
  | 'decouverte'
  | 'explorer'
  | 'dette'
  | 'investissement'
  | 'autre'
  | 'mes_dossiers'
  | 'simulateur'
  | 'aide';

export type AnalyticsEventType =
  | 'dossier_published'
  | 'loyalty_created'
  | 'dossier_accepted'
  | 'satisfaction_review';

export interface SatisfactionReview {
  id: string;
  dossierId?: string;
  dossierTitle?: string;
  rating: number;
  comment: string;
  userName?: string;
  timestamp: string;
}

export interface DailyReportSummary {
  date: string;
  dossiersPosted: number;
  dossierRevenue: number;
  loyaltyAccountsCreated: number;
  loyaltyRevenue: number;
  dossiersAccepted: number;
  averageRating: number | null;
  reviews: SatisfactionReview[];
}
