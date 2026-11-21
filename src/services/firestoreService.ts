import { User as FirebaseAuthUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AttachmentUploadPayload,
  DailyReportSummary,
  DirectSubmission,
  Dossier,
  FirestoreNegotiationMessage,
  FirestoreNegotiationThread,
  InvestorDirectoryEntry,
  LoyaltyTier,
  SatisfactionReview,
  User,
} from '../types';
import { applyOwnerGoldStatus, isOwnerGoldEmail } from '../utils/finance';

function formatTimestampFr(ts: unknown, fallback?: string): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleDateString('fr-FR');
  }
  if (typeof ts === 'string' && ts.trim()) {
    return ts;
  }
  return fallback || new Date().toLocaleDateString('fr-FR');
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

function clampStr(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen) || fallback;
}

export function getParisDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// --- User Profiles ---
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const user: User = {
      id: uid,
      uid,
      name: String(data.name || 'Membre SolvaPact'),
      firstName: typeof data.firstName === 'string' ? data.firstName : undefined,
      lastName: typeof data.lastName === 'string' ? data.lastName : undefined,
      email: String(data.email || ''),
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      profession: typeof data.profession === 'string' ? data.profession : undefined,
      role: data.role === 'investisseur' ? 'investisseur' : 'demandeur',
      city: String(data.city || 'Antananarivo'),
      postalCode: typeof data.postalCode === 'string' ? data.postalCode : undefined,
      reasonForJoining: typeof data.reasonForJoining === 'string' ? data.reasonForJoining : undefined,
      createdAt: formatTimestampFr(data.createdAt),
      acceptedTermsAt: typeof data.acceptedTermsAt === 'string' ? data.acceptedTermsAt : undefined,
      loyaltyActive: Boolean(data.loyaltyActive),
      loyaltyExp: typeof data.loyaltyExp === 'number' ? data.loyaltyExp : 0,
      loyaltyActivatedAt:
        typeof data.loyaltyActivatedAt === 'string' ? data.loyaltyActivatedAt : undefined,
      diamondPublicationsCount:
        typeof data.diamondPublicationsCount === 'number' ? data.diamondPublicationsCount : 0,
      investorDirectoryConsent:
        typeof data.investorDirectoryConsent === 'boolean'
          ? data.investorDirectoryConsent
          : undefined,
      investorContactEmail:
        typeof data.investorContactEmail === 'string' ? data.investorContactEmail : undefined,
      investorFocus: typeof data.investorFocus === 'string' ? data.investorFocus : undefined,
      investorTicketRange:
        typeof data.investorTicketRange === 'string' ? data.investorTicketRange : undefined,
      investorBio: typeof data.investorBio === 'string' ? data.investorBio : undefined,
      investorConsentAt:
        typeof data.investorConsentAt === 'string' ? data.investorConsentAt : undefined,
    };
    return applyOwnerGoldStatus(user);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createOrSyncUserProfile(
  fbUser: FirebaseAuthUser,
  profileData: Partial<User>
): Promise<User> {
  const uid = sanitizeId(fbUser.uid);
  const path = `users/${uid}`;
  const isOwner = isOwnerGoldEmail(fbUser.email);

  const firstName = clampStr(profileData.firstName, 60);
  const lastName = clampStr(profileData.lastName, 60);
  const combinedName =
    clampStr(profileData.name, 120) ||
    `${firstName} ${lastName}`.trim() ||
    clampStr(fbUser.displayName, 120, 'Membre SolvaPact');

  const payload: Record<string, unknown> = {
    uid,
    name: combinedName,
    email: clampStr(fbUser.email, 160),
    role: profileData.role === 'investisseur' ? 'investisseur' : 'demandeur',
    city: clampStr(profileData.city, 80, 'Antananarivo'),
    loyaltyActive: isOwner ? true : false,
    loyaltyExp: isOwner ? 120 : 0,
    diamondPublicationsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (firstName) payload.firstName = firstName;
  if (lastName) payload.lastName = lastName;
  if (profileData.phone) payload.phone = clampStr(profileData.phone, 32);
  if (profileData.profession) payload.profession = clampStr(profileData.profession, 100);
  if (profileData.postalCode) payload.postalCode = clampStr(profileData.postalCode, 16);
  if (profileData.reasonForJoining) {
    payload.reasonForJoining = clampStr(profileData.reasonForJoining, 200);
  }
  if (profileData.acceptedTermsAt) {
    payload.acceptedTermsAt = clampStr(profileData.acceptedTermsAt, 32);
  }
  if (typeof profileData.investorDirectoryConsent === 'boolean') {
    payload.investorDirectoryConsent = profileData.investorDirectoryConsent;
  }
  if (profileData.investorContactEmail) {
    payload.investorContactEmail = clampStr(profileData.investorContactEmail, 160);
  }
  if (profileData.investorFocus) {
    payload.investorFocus = clampStr(profileData.investorFocus, 160);
  }
  if (profileData.investorTicketRange) {
    payload.investorTicketRange = clampStr(profileData.investorTicketRange, 80);
  }
  if (profileData.investorBio) {
    payload.investorBio = clampStr(profileData.investorBio, 600);
  }
  if (profileData.investorConsentAt) {
    payload.investorConsentAt = clampStr(profileData.investorConsentAt, 32);
  }
  if (isOwner) {
    payload.loyaltyActivatedAt = new Date().toLocaleDateString('fr-FR');
  }

  try {
    await setDoc(doc(db, 'users', uid), payload);
    const createdUser = applyOwnerGoldStatus({
      id: uid,
      uid,
      name: combinedName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: String(fbUser.email || ''),
      phone: profileData.phone,
      profession: profileData.profession,
      role: payload.role as 'demandeur' | 'investisseur',
      city: String(payload.city),
      postalCode: profileData.postalCode,
      reasonForJoining: profileData.reasonForJoining,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      acceptedTermsAt: profileData.acceptedTermsAt,
      loyaltyActive: Boolean(payload.loyaltyActive),
      loyaltyExp: Number(payload.loyaltyExp),
      loyaltyActivatedAt: isOwner ? new Date().toLocaleDateString('fr-FR') : undefined,
      diamondPublicationsCount: 0,
      investorDirectoryConsent: profileData.investorDirectoryConsent,
      investorContactEmail: profileData.investorContactEmail,
      investorFocus: profileData.investorFocus,
      investorTicketRange: profileData.investorTicketRange,
      investorBio: profileData.investorBio,
      investorConsentAt: profileData.investorConsentAt,
    });

    if (
      createdUser.role === 'investisseur' &&
      createdUser.investorDirectoryConsent === true
    ) {
      await syncInvestorDirectoryEntry(createdUser);
    }

    return createdUser;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function syncInvestorDirectoryEntry(user: User): Promise<void> {
  const uid = sanitizeId(user.uid || user.id);
  const path = `investor_directory/${uid}`;
  const docRef = doc(db, 'investor_directory', uid);

  if (user.role !== 'investisseur' || user.investorDirectoryConsent !== true) {
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await deleteDoc(docRef);
      }
    } catch {
      // Non-blocking cleanup when investor opted out
    }
    return;
  }

  const contactEmail = clampStr(user.investorContactEmail || user.email, 160);
  if (!contactEmail || !contactEmail.includes('@')) return;

  const loyaltyTier: LoyaltyTier = user.loyaltyActive
    ? (user.loyaltyExp || 0) >= 120
      ? 'diamond'
      : (user.loyaltyExp || 0) >= 60
      ? 'gold'
      : (user.loyaltyExp || 0) >= 30
      ? 'silver'
      : 'bronze'
    : 'none';

  const consentDate = clampStr(
    user.investorConsentAt,
    32,
    new Date().toLocaleDateString('fr-FR')
  );

  try {
    const existing = await getDoc(docRef);
    const payload: Record<string, unknown> = {
      uid,
      displayName: clampStr(user.name, 120, 'Investisseur SolvaPact'),
      city: clampStr(user.city, 80, 'Antananarivo'),
      contactEmail,
      loyaltyTier,
      consentGiven: true,
      consentAcceptedAt: consentDate,
      active: true,
      updatedAt: serverTimestamp(),
    };
    payload.profession = user.profession ? clampStr(user.profession, 100) : '';
    payload.contactPhone = user.phone ? clampStr(user.phone, 32) : '';
    payload.investmentFocus = user.investorFocus ? clampStr(user.investorFocus, 160) : '';
    payload.ticketRange = user.investorTicketRange ? clampStr(user.investorTicketRange, 80) : '';
    payload.bio = user.investorBio ? clampStr(user.investorBio, 600) : '';

    if (existing.exists()) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserInvestorProfileInFirestore(
  user: User,
  updates: {
    role: 'demandeur' | 'investisseur';
    phone?: string;
    city?: string;
    profession?: string;
    investorDirectoryConsent: boolean;
    investorContactEmail?: string;
    investorFocus?: string;
    investorTicketRange?: string;
    investorBio?: string;
  }
): Promise<User> {
  const uid = sanitizeId(user.uid || user.id);
  const path = `users/${uid}`;
  const consentDate = new Date().toLocaleDateString('fr-FR');

  const cleanPhone = updates.phone !== undefined ? clampStr(updates.phone, 32) : user.phone || '';
  const cleanCity = updates.city ? clampStr(updates.city, 80, user.city) : user.city;
  const cleanProfession =
    updates.profession !== undefined ? clampStr(updates.profession, 100) : user.profession || '';
  const cleanContactEmail =
    updates.investorContactEmail !== undefined
      ? clampStr(updates.investorContactEmail, 160)
      : user.investorContactEmail || user.email;
  const cleanFocus = clampStr(updates.investorFocus, 160);
  const cleanTicketRange = clampStr(updates.investorTicketRange, 80);
  const cleanBio = clampStr(updates.investorBio, 600);

  const patch: Record<string, unknown> = {
    role: updates.role,
    city: cleanCity,
    phone: cleanPhone,
    profession: cleanProfession,
    investorDirectoryConsent: updates.investorDirectoryConsent,
    investorContactEmail: cleanContactEmail,
    investorFocus: cleanFocus,
    investorTicketRange: cleanTicketRange,
    investorBio: cleanBio,
    investorConsentAt: consentDate,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'users', uid), patch);
    const updatedUser: User = applyOwnerGoldStatus({
      ...user,
      role: updates.role,
      city: cleanCity,
      phone: cleanPhone || undefined,
      profession: cleanProfession || undefined,
      investorDirectoryConsent: updates.investorDirectoryConsent,
      investorContactEmail: cleanContactEmail || undefined,
      investorFocus: cleanFocus || undefined,
      investorTicketRange: cleanTicketRange || undefined,
      investorBio: cleanBio || undefined,
      investorConsentAt: consentDate,
    });
    await syncInvestorDirectoryEntry(updatedUser);
    return updatedUser;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function activateUserLoyaltyInFirestore(uid: string): Promise<string> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}`;
  const activatedAt = new Date().toLocaleDateString('fr-FR');
  try {
    await updateDoc(doc(db, 'users', cleanUid), {
      loyaltyActive: true,
      loyaltyActivatedAt: activatedAt,
      updatedAt: serverTimestamp(),
    });
    return activatedAt;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function incrementLoyaltyAfterDossierInFirestore(
  uid: string,
  nextExp: number,
  nextDiamondCount: number
): Promise<void> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}`;
  try {
    await updateDoc(doc(db, 'users', cleanUid), {
      loyaltyExp: nextExp,
      diamondPublicationsCount: nextDiamondCount,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Public Marketplace Dossiers ---
export function subscribeToPublicDossiers(
  onData: (dossiers: Dossier[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'dossiers');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Dossier[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
          title: String(data.title || ''),
          type: data.type === 'autre' ? 'autre' : 'investissement',
          category: String(data.category || ''),
          amountRequested: Number(data.amountRequested || 0),
          originalDebtAmount:
            typeof data.originalDebtAmount === 'number' ? data.originalDebtAmount : undefined,
          targetInterestRate:
            typeof data.targetInterestRate === 'number' ? data.targetInterestRate : undefined,
          targetDiscount:
            typeof data.targetDiscount === 'number' ? data.targetDiscount : undefined,
          maxMonthlyPayment: Number(data.maxMonthlyPayment || 0),
          termMonths: Number(data.termMonths || 36),
          investmentReturnMode:
            (data.investmentReturnMode as Dossier['investmentReturnMode']) || undefined,
          equityPercentage:
            typeof data.equityPercentage === 'number' ? data.equityPercentage : undefined,
          counterpartSummary:
            typeof data.counterpartSummary === 'string' ? data.counterpartSummary : undefined,
          projectDetails:
            data.projectDetails && typeof data.projectDetails === 'object'
              ? (data.projectDetails as Dossier['projectDetails'])
              : undefined,
          verifiedCompany:
            data.verifiedCompany && typeof data.verifiedCompany === 'object'
              ? (data.verifiedCompany as Dossier['verifiedCompany'])
              : undefined,
          description: String(data.description || ''),
          contextStory: String(data.contextStory || ''),
          guaranteeType: String(data.guaranteeType || ''),
          applicant: (data.applicant as Dossier['applicant']) || {
            name: 'Membre SolvaPact',
            pseudonym: 'Membre',
            city: 'Antananarivo',
            profession: 'Membre',
            monthlyIncome: 0,
            existingCharges: 0,
            verifiedIdentity: true,
            verifiedIncome: false,
            riskGrade: 'B',
          },
          documents: Array.isArray(data.documents)
            ? (data.documents as Dossier['documents'])
            : [],
          status: (data.status as Dossier['status']) || 'open',
          createdAt: formatTimestampFr(data.createdAt, String(data.createdAtLabel || '')),
          offersCount: Number(data.offersCount || 0),
          urgency: (data.urgency as Dossier['urgency']) || 'normale',
          publicationPaidAmount:
            typeof data.publicationPaidAmount === 'number'
              ? data.publicationPaidAmount
              : undefined,
          paymentVerifiedMode:
            typeof data.paymentVerifiedMode === 'string' ? data.paymentVerifiedMode : undefined,
          isDiamondPriority: Boolean(data.isDiamondPriority),
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'dossiers');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function publishDossierToFirestore(
  ownerUid: string,
  dossier: Dossier,
  privateContact: { fullName: string; email: string; phone?: string },
  attachments: AttachmentUploadPayload[] = []
): Promise<void> {
  const cleanUid = sanitizeId(ownerUid);
  const cleanDossierId = sanitizeId(dossier.id);
  const dossierPath = `dossiers/${cleanDossierId}`;

  // Public non-PII applicant copy (strip email & phone strictly!)
  const publicApplicant = {
    name: clampStr(dossier.applicant.pseudonym || dossier.applicant.name, 80, 'Membre'),
    pseudonym: clampStr(dossier.applicant.pseudonym, 60, 'Membre'),
    city: clampStr(dossier.applicant.city, 80, 'Antananarivo'),
    postalCode: clampStr(dossier.applicant.postalCode, 16),
    profession: clampStr(dossier.applicant.profession, 100, 'Entrepreneur'),
    monthlyIncome: Math.max(0, Number(dossier.applicant.monthlyIncome) || 0),
    existingCharges: Math.max(0, Number(dossier.applicant.existingCharges) || 0),
    verifiedIdentity: Boolean(dossier.applicant.verifiedIdentity),
    verifiedIncome: Boolean(dossier.applicant.verifiedIncome),
    riskGrade: dossier.applicant.riskGrade,
    loyaltyTier: dossier.applicant.loyaltyTier || 'none',
    loyaltyTitle: clampStr(dossier.applicant.loyaltyTitle, 80),
  };

  const dossierDoc: Record<string, unknown> = {
    id: cleanDossierId,
    ownerUid: cleanUid,
    title: clampStr(dossier.title, 180, 'Demande de financement SolvaPact'),
    type: dossier.type,
    category: clampStr(dossier.category, 80, 'Autre domaine'),
    amountRequested: Math.min(1000000, Math.max(500, Number(dossier.amountRequested) || 500)),
    maxMonthlyPayment: Math.max(0, Number(dossier.maxMonthlyPayment) || 0),
    termMonths: Math.min(120, Math.max(6, Number(dossier.termMonths) || 36)),
    description: clampStr(dossier.description, 600, dossier.title.slice(0, 120)),
    contextStory: clampStr(dossier.contextStory, 4000, dossier.description),
    guaranteeType: clampStr(dossier.guaranteeType, 400, 'Engagement sur l’honneur et contrat privé'),
    applicant: publicApplicant,
    documents: (dossier.documents || []).slice(0, 10),
    status: 'open',
    createdAtLabel: clampStr(dossier.createdAt, 32, new Date().toLocaleDateString('fr-FR')),
    offersCount: 0,
    urgency: dossier.urgency || 'normale',
    isDiamondPriority: Boolean(dossier.isDiamondPriority),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (typeof dossier.originalDebtAmount === 'number') {
    dossierDoc.originalDebtAmount = dossier.originalDebtAmount;
  }
  if (typeof dossier.targetInterestRate === 'number') {
    dossierDoc.targetInterestRate = dossier.targetInterestRate;
  }
  if (typeof dossier.targetDiscount === 'number') {
    dossierDoc.targetDiscount = dossier.targetDiscount;
  }
  if (dossier.investmentReturnMode) {
    dossierDoc.investmentReturnMode = dossier.investmentReturnMode;
  }
  if (typeof dossier.equityPercentage === 'number') {
    dossierDoc.equityPercentage = dossier.equityPercentage;
  }
  if (dossier.counterpartSummary) {
    dossierDoc.counterpartSummary = clampStr(dossier.counterpartSummary, 400);
  }
  if (dossier.projectDetails) {
    dossierDoc.projectDetails = dossier.projectDetails;
  }
  if (dossier.verifiedCompany) {
    dossierDoc.verifiedCompany = dossier.verifiedCompany;
  }
  if (typeof dossier.publicationPaidAmount === 'number') {
    dossierDoc.publicationPaidAmount = dossier.publicationPaidAmount;
  }
  if (dossier.paymentVerifiedMode) {
    dossierDoc.paymentVerifiedMode = clampStr(dossier.paymentVerifiedMode, 40);
  }

  try {
    await setDoc(doc(db, 'dossiers', cleanDossierId), dossierDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, dossierPath);
  }

  // Isolated PII contact document (owner + admin only)
  const contactPath = `${dossierPath}/privateContact/info`;
  try {
    const contactPayload: Record<string, unknown> = {
      ownerUid: cleanUid,
      fullName: clampStr(privateContact.fullName, 120, 'Membre'),
      email: clampStr(privateContact.email, 160),
      createdAt: serverTimestamp(),
    };
    if (privateContact.phone) {
      contactPayload.phone = clampStr(privateContact.phone, 32);
    }
    await setDoc(doc(db, 'dossiers', cleanDossierId, 'privateContact', 'info'), contactPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, contactPath);
  }

  // Real PDF / document attachments (bounded <= 700 KB dataUrl)
  for (const att of attachments.slice(0, 5)) {
    if (!att.dataUrl || att.dataUrl.length > 740000) continue;
    const attId = sanitizeId(att.id);
    const attPath = `${dossierPath}/attachments/${attId}`;
    try {
      await setDoc(doc(db, 'dossiers', cleanDossierId, 'attachments', attId), {
        id: attId,
        ownerUid: cleanUid,
        name: clampStr(att.name, 180),
        mimeType: clampStr(att.mimeType, 80, 'application/pdf'),
        sizeLabel: clampStr(att.sizeLabel, 32),
        dataUrl: att.dataUrl,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, attPath);
    }
  }
}

export async function markDossierAcceptedInFirestore(dossierId: string): Promise<void> {
  const cleanId = sanitizeId(dossierId);
  try {
    await updateDoc(doc(db, 'dossiers', cleanId), {
      status: 'agreement_reached',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `dossiers/${cleanId}`);
  }
}

export async function deleteDossierInFirestore(dossierId: string): Promise<void> {
  const cleanId = sanitizeId(dossierId);
  try {
    await deleteDoc(doc(db, 'dossiers', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `dossiers/${cleanId}`);
  }
}

export async function fetchDossierAttachments(
  dossierId: string
): Promise<AttachmentUploadPayload[]> {
  const cleanId = sanitizeId(dossierId);
  const path = `dossiers/${cleanId}/attachments`;
  try {
    const snap = await getDocs(collection(db, 'dossiers', cleanId, 'attachments'));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: String(data.name || 'document.pdf'),
        mimeType: String(data.mimeType || 'application/pdf'),
        sizeLabel: String(data.sizeLabel || ''),
        dataUrl: String(data.dataUrl || ''),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchOwnerPrivateContact(
  dossierId: string
): Promise<{ fullName: string; email: string; phone?: string } | null> {
  const cleanId = sanitizeId(dossierId);
  const path = `dossiers/${cleanId}/privateContact/info`;
  try {
    const snap = await getDoc(doc(db, 'dossiers', cleanId, 'privateContact', 'info'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      fullName: String(data.fullName || ''),
      email: String(data.email || ''),
      phone: typeof data.phone === 'string' ? data.phone : undefined,
    };
  } catch {
    return null;
  }
}

// --- Private 1-to-1 Real-Time Negotiations ---
export async function getOrCreateNegotiationThread(
  dossier: Dossier,
  investorUser: User
): Promise<FirestoreNegotiationThread | null> {
  if (!dossier.ownerUid || !investorUser.uid) return null;
  const cleanInvestorUid = sanitizeId(investorUser.uid);
  const cleanCreatorUid = sanitizeId(dossier.ownerUid);
  const cleanDossierId = sanitizeId(dossier.id);
  const threadId = sanitizeId(`${cleanDossierId}_${cleanInvestorUid}`);
  const threadRef = doc(db, 'negotiations', threadId);

  try {
    const existing = await getDoc(threadRef);
    if (existing.exists()) {
      const data = existing.data() as Record<string, unknown>;
      return {
        id: existing.id,
        dossierId: String(data.dossierId || cleanDossierId),
        dossierTitle: String(data.dossierTitle || dossier.title),
        dossierType: (data.dossierType as Dossier['type']) || dossier.type,
        creatorUid: String(data.creatorUid || cleanCreatorUid),
        creatorPseudonym: String(data.creatorPseudonym || dossier.applicant.pseudonym),
        investorUid: String(data.investorUid || cleanInvestorUid),
        investorName: String(data.investorName || investorUser.name),
        sharedCreatorEmail:
          typeof data.sharedCreatorEmail === 'string' ? data.sharedCreatorEmail : undefined,
        sharedCreatorPhone:
          typeof data.sharedCreatorPhone === 'string' ? data.sharedCreatorPhone : undefined,
        status: (data.status as FirestoreNegotiationThread['status']) || 'active',
        proposedAmount:
          typeof data.proposedAmount === 'number' ? data.proposedAmount : undefined,
        proposedTermMonths:
          typeof data.proposedTermMonths === 'number' ? data.proposedTermMonths : undefined,
        proposedRateOrEquity:
          typeof data.proposedRateOrEquity === 'string' ? data.proposedRateOrEquity : undefined,
      };
    }

    await setDoc(threadRef, {
      id: threadId,
      dossierId: cleanDossierId,
      dossierTitle: clampStr(dossier.title, 180, 'Dossier SolvaPact'),
      dossierType: dossier.type,
      creatorUid: cleanCreatorUid,
      creatorPseudonym: clampStr(dossier.applicant.pseudonym, 80, 'Porteur de projet'),
      investorUid: cleanInvestorUid,
      investorName: clampStr(investorUser.name, 120, 'Investisseur'),
      status: 'active',
      proposedAmount: dossier.amountRequested,
      proposedTermMonths: dossier.termMonths,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Increment offersCount on open/in_negotiation dossier safely
    if (dossier.status === 'open' || dossier.status === 'in_negotiation') {
      try {
        await updateDoc(doc(db, 'dossiers', cleanDossierId), {
          offersCount: (dossier.offersCount || 0) + 1,
          status: 'in_negotiation',
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking if concurrent status transition happened
      }
    }

    return {
      id: threadId,
      dossierId: cleanDossierId,
      dossierTitle: dossier.title,
      dossierType: dossier.type,
      creatorUid: cleanCreatorUid,
      creatorPseudonym: dossier.applicant.pseudonym,
      investorUid: cleanInvestorUid,
      investorName: investorUser.name,
      status: 'active',
      proposedAmount: dossier.amountRequested,
      proposedTermMonths: dossier.termMonths,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `negotiations/${threadId}`);
  }
}

export function subscribeToNegotiationMessages(
  threadId: string,
  onMessages: (msgs: FirestoreNegotiationMessage[]) => void
): Unsubscribe {
  const cleanThreadId = sanitizeId(threadId);
  const q = query(
    collection(db, 'negotiations', cleanThreadId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: FirestoreNegotiationMessage[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        let timeStr = '';
        if (data.createdAt instanceof Timestamp) {
          timeStr = data.createdAt.toDate().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return {
          id: d.id,
          senderUid: String(data.senderUid || ''),
          creatorUid: String(data.creatorUid || ''),
          investorUid: String(data.investorUid || ''),
          senderName: String(data.senderName || ''),
          senderRole:
            (data.senderRole as FirestoreNegotiationMessage['senderRole']) || 'investisseur',
          text: String(data.text || ''),
          createdAtLabel: timeStr,
        };
      });
      onMessages(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `negotiations/${cleanThreadId}/messages`);
    }
  );
}

export async function sendNegotiationMessage(
  thread: FirestoreNegotiationThread,
  senderUid: string,
  senderName: string,
  senderRole: 'demandeur' | 'investisseur',
  text: string
): Promise<void> {
  const cleanThreadId = sanitizeId(thread.id);
  const msgId = sanitizeId(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  try {
    await setDoc(doc(db, 'negotiations', cleanThreadId, 'messages', msgId), {
      id: msgId,
      senderUid: sanitizeId(senderUid),
      creatorUid: sanitizeId(thread.creatorUid),
      investorUid: sanitizeId(thread.investorUid),
      senderName: clampStr(senderName, 120, 'Membre'),
      senderRole,
      text: clampStr(text, 2000),
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'negotiations', cleanThreadId), {
      status: thread.status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `negotiations/${cleanThreadId}/messages/${msgId}`);
  }
}

export async function shareCreatorDirectContactInThread(
  threadId: string,
  email: string,
  phone?: string
): Promise<void> {
  const cleanThreadId = sanitizeId(threadId);
  try {
    const patch: Record<string, unknown> = {
      sharedCreatorEmail: clampStr(email, 160),
      updatedAt: serverTimestamp(),
    };
    if (phone) patch.sharedCreatorPhone = clampStr(phone, 32);
    await updateDoc(doc(db, 'negotiations', cleanThreadId), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `negotiations/${cleanThreadId}`);
  }
}

export function subscribeToCreatorNegotiations(
  creatorUid: string,
  onThreads: (threads: FirestoreNegotiationThread[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(creatorUid);
  const q = query(collection(db, 'negotiations'), where('creatorUid', '==', cleanUid));
  return onSnapshot(
    q,
    (snap) => {
      const threads: FirestoreNegotiationThread[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          dossierId: String(data.dossierId || ''),
          dossierTitle: String(data.dossierTitle || ''),
          dossierType: data.dossierType === 'autre' ? 'autre' : 'investissement',
          creatorUid: String(data.creatorUid || cleanUid),
          creatorPseudonym: String(data.creatorPseudonym || ''),
          investorUid: String(data.investorUid || ''),
          investorName: String(data.investorName || 'Investisseur'),
          sharedCreatorEmail:
            typeof data.sharedCreatorEmail === 'string' ? data.sharedCreatorEmail : undefined,
          sharedCreatorPhone:
            typeof data.sharedCreatorPhone === 'string' ? data.sharedCreatorPhone : undefined,
          status: (data.status as FirestoreNegotiationThread['status']) || 'active',
          proposedAmount:
            typeof data.proposedAmount === 'number' ? data.proposedAmount : undefined,
          proposedTermMonths:
            typeof data.proposedTermMonths === 'number' ? data.proposedTermMonths : undefined,
          updatedAtLabel: formatTimestampFr(data.updatedAt),
        };
      });
      onThreads(threads);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'negotiations');
    }
  );
}

// --- Analytics & Daily Report (Firestore Persistence) ---
export async function recordAnalyticsEventInFirestore(
  userId: string,
  payload: {
    type: 'dossier_published' | 'loyalty_created' | 'dossier_accepted' | 'satisfaction_review';
    dossierId?: string;
    dossierTitle?: string;
    amount?: number;
    rating?: number;
    comment?: string;
    userName?: string;
    userEmail?: string;
  }
): Promise<void> {
  const cleanUid = sanitizeId(userId);
  const evtId = sanitizeId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const docData: Record<string, unknown> = {
    id: evtId,
    userId: cleanUid,
    type: payload.type,
    dateKey: getParisDateKey(),
    createdAt: serverTimestamp(),
  };
  if (payload.dossierId) docData.dossierId = clampStr(payload.dossierId, 128);
  if (payload.dossierTitle) docData.dossierTitle = clampStr(payload.dossierTitle, 180);
  if (typeof payload.amount === 'number') docData.amount = payload.amount;
  if (typeof payload.rating === 'number') {
    docData.rating = Math.min(5, Math.max(1, Math.round(payload.rating)));
  }
  if (payload.comment) docData.comment = clampStr(payload.comment, 1000);
  if (payload.userName) docData.userName = clampStr(payload.userName, 120);
  if (payload.userEmail) docData.userEmail = clampStr(payload.userEmail, 160);

  try {
    await setDoc(doc(db, 'analytics_events', evtId), docData);
  } catch {
    // Analytics failure never interrupts user workflow
  }
}

export async function fetchDailyReportFromFirestore(
  dateKey = getParisDateKey()
): Promise<DailyReportSummary> {
  const q = query(collection(db, 'analytics_events'), where('dateKey', '==', dateKey));
  try {
    const snap = await getDocs(q);
    let dossiersPosted = 0;
    let dossierRevenue = 0;
    let loyaltyAccountsCreated = 0;
    let loyaltyRevenue = 0;
    let dossiersAccepted = 0;
    const reviews: SatisfactionReview[] = [];

    snap.docs.forEach((d) => {
      const e = d.data() as Record<string, unknown>;
      const type = String(e.type || '');
      if (type === 'dossier_published') {
        dossiersPosted += 1;
        dossierRevenue += Number(e.amount || 0);
      } else if (type === 'loyalty_created') {
        loyaltyAccountsCreated += 1;
        loyaltyRevenue += Number(e.amount || 0);
      } else if (type === 'dossier_accepted') {
        dossiersAccepted += 1;
      } else if (type === 'satisfaction_review' && typeof e.rating === 'number') {
        reviews.push({
          id: d.id,
          dossierId: typeof e.dossierId === 'string' ? e.dossierId : undefined,
          dossierTitle: typeof e.dossierTitle === 'string' ? e.dossierTitle : undefined,
          rating: Number(e.rating),
          comment: String(e.comment || ''),
          userName: typeof e.userName === 'string' ? e.userName : undefined,
          timestamp:
            e.createdAt instanceof Timestamp
              ? e.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        });
      }
    });

    const averageRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    return {
      date: dateKey,
      dossiersPosted,
      dossierRevenue: Math.round(dossierRevenue * 100) / 100,
      loyaltyAccountsCreated,
      loyaltyRevenue: Math.round(loyaltyRevenue * 100) / 100,
      dossiersAccepted,
      averageRating,
      reviews,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'analytics_events');
  }
}

// --- Investor Directory & Direct Submissions ---
export function subscribeToInvestorDirectory(
  onData: (investors: InvestorDirectoryEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'investor_directory'),
    where('active', '==', true),
    where('consentGiven', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: InvestorDirectoryEntry[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || 'Investisseur SolvaPact'),
          city: String(data.city || 'Antananarivo'),
          profession: typeof data.profession === 'string' ? data.profession : undefined,
          contactEmail: String(data.contactEmail || ''),
          contactPhone: typeof data.contactPhone === 'string' ? data.contactPhone : undefined,
          investmentFocus:
            typeof data.investmentFocus === 'string' ? data.investmentFocus : undefined,
          ticketRange: typeof data.ticketRange === 'string' ? data.ticketRange : undefined,
          bio: typeof data.bio === 'string' ? data.bio : undefined,
          loyaltyTier: (data.loyaltyTier as LoyaltyTier) || 'none',
          consentGiven: Boolean(data.consentGiven),
          consentAcceptedAt: String(data.consentAcceptedAt || ''),
          active: Boolean(data.active),
          createdAt: formatTimestampFr(data.createdAt),
        };
      });
      onData(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'investor_directory');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function sendDirectDossierToInvestor(
  senderUid: string,
  payload: Omit<DirectSubmission, 'id' | 'senderUid' | 'status' | 'createdAt'>
): Promise<DirectSubmission> {
  const cleanSenderUid = sanitizeId(senderUid);
  const subId = sanitizeId(`sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `direct_submissions/${subId}`;

  const docData: Record<string, unknown> = {
    id: subId,
    senderUid: cleanSenderUid,
    senderName: clampStr(payload.senderName, 120, 'Porteur de projet'),
    senderEmail: clampStr(payload.senderEmail, 160),
    senderCity: clampStr(payload.senderCity, 80, 'Antananarivo'),
    investorUid: sanitizeId(payload.investorUid),
    investorName: clampStr(payload.investorName, 120, 'Investisseur'),
    investorEmail: clampStr(payload.investorEmail, 160),
    dossierTitle: clampStr(payload.dossierTitle, 180, 'Présentation de projet'),
    dossierType: payload.dossierType === 'autre' ? 'autre' : 'investissement',
    category: clampStr(payload.category, 80, 'Autre domaine'),
    amountRequested: Math.min(1000000, Math.max(500, Number(payload.amountRequested) || 500)),
    termMonths: Math.min(120, Math.max(6, Number(payload.termMonths) || 36)),
    dossierSummary: clampStr(payload.dossierSummary, 2000, payload.dossierTitle),
    personalMessage: clampStr(payload.personalMessage, 2000, 'Bonjour, je vous transmets mon dossier.'),
    status: 'envoye',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (payload.senderPhone) docData.senderPhone = clampStr(payload.senderPhone, 32);
  if (payload.dossierId) docData.dossierId = sanitizeId(payload.dossierId);
  if (payload.investmentReturnMode) docData.investmentReturnMode = payload.investmentReturnMode;
  if (typeof payload.equityPercentage === 'number') {
    docData.equityPercentage = Math.min(100, Math.max(0, payload.equityPercentage));
  }

  try {
    await setDoc(doc(db, 'direct_submissions', subId), docData);
    return {
      ...payload,
      id: subId,
      senderUid: cleanSenderUid,
      status: 'envoye',
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeToDirectSubmissionsForUser(
  uid: string,
  onUpdate: (data: { incoming: DirectSubmission[]; sent: DirectSubmission[] }) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  let incomingList: DirectSubmission[] = [];
  let sentList: DirectSubmission[] = [];

  const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): DirectSubmission => {
    const data = d.data();
    return {
      id: d.id,
      senderUid: String(data.senderUid || ''),
      senderName: String(data.senderName || 'Membre'),
      senderEmail: String(data.senderEmail || ''),
      senderPhone: typeof data.senderPhone === 'string' ? data.senderPhone : undefined,
      senderCity: String(data.senderCity || 'Antananarivo'),
      investorUid: String(data.investorUid || ''),
      investorName: String(data.investorName || 'Investisseur'),
      investorEmail: String(data.investorEmail || ''),
      dossierId: typeof data.dossierId === 'string' ? data.dossierId : undefined,
      dossierTitle: String(data.dossierTitle || ''),
      dossierType: data.dossierType === 'autre' ? 'autre' : 'investissement',
      category: String(data.category || ''),
      amountRequested: Number(data.amountRequested || 0),
      termMonths: Number(data.termMonths || 36),
      investmentReturnMode:
        (data.investmentReturnMode as DirectSubmission['investmentReturnMode']) || undefined,
      equityPercentage:
        typeof data.equityPercentage === 'number' ? data.equityPercentage : undefined,
      dossierSummary: String(data.dossierSummary || ''),
      personalMessage: String(data.personalMessage || ''),
      status: (data.status as DirectSubmission['status']) || 'envoye',
      createdAt: formatTimestampFr(data.createdAt),
    };
  };

  const emit = () => {
    onUpdate({ incoming: incomingList, sent: sentList });
  };

  const unsubIncoming = onSnapshot(
    query(collection(db, 'direct_submissions'), where('investorUid', '==', cleanUid)),
    (snap) => {
      incomingList = snap.docs.map((d) => mapDoc(d as any));
      emit();
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'direct_submissions');
    }
  );

  const unsubSent = onSnapshot(
    query(collection(db, 'direct_submissions'), where('senderUid', '==', cleanUid)),
    (snap) => {
      sentList = snap.docs.map((d) => mapDoc(d as any));
      emit();
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'direct_submissions');
    }
  );

  return () => {
    unsubIncoming();
    unsubSent();
  };
}

export async function updateDirectSubmissionStatusInFirestore(
  submissionId: string,
  status: 'consulte' | 'interesse' | 'archive'
): Promise<void> {
  const cleanId = sanitizeId(submissionId);
  try {
    await updateDoc(doc(db, 'direct_submissions', cleanId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `direct_submissions/${cleanId}`);
  }
}
