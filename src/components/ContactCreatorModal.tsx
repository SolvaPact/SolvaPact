import React, { useEffect, useRef, useState } from 'react';
import {
  Dossier,
  FirestoreNegotiationMessage,
  FirestoreNegotiationThread,
  User,
} from '../types';
import { formatEuro, formatPct, getLoyaltyNameColorClass } from '../utils/finance';
import { useModalEscape } from '../utils/useModalEscape';
import { LoyaltyVerifiedBadge } from './LoyaltyVerifiedBadge';
import {
  fetchOwnerPrivateContact,
  getOrCreateNegotiationThread,
  sendNegotiationMessage,
  shareCreatorDirectContactInThread,
  subscribeToNegotiationMessages,
} from '../services/firestoreService';
import {
  X,
  Mail,
  Phone,
  User as UserIcon,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare,
  Share2,
  Loader2,
} from 'lucide-react';

interface ContactCreatorModalProps {
  dossier: Dossier | null;
  currentUser: User | null;
  initialThread?: FirestoreNegotiationThread | null;
  onClose: () => void;
}

export const ContactCreatorModal: React.FC<ContactCreatorModalProps> = ({
  dossier,
  currentUser,
  initialThread = null,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);
  const [thread, setThread] = useState<FirestoreNegotiationThread | null>(initialThread);
  const [messages, setMessages] = useState<FirestoreNegotiationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sharingContact, setSharingContact] = useState(false);
  const [ownerPrivateInfo, setOwnerPrivateInfo] = useState<{
    fullName: string;
    email: string;
    phone?: string;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useModalEscape(Boolean(dossier), onClose);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isOwner = Boolean(
    currentUser?.uid && dossier?.ownerUid && currentUser.uid === dossier.ownerUid
  );

  useEffect(() => {
    if (!dossier || !currentUser?.uid || !dossier.ownerUid) {
      setThread(null);
      setMessages([]);
      return;
    }

    let unsub: (() => void) | undefined;
    let active = true;

    const init = async () => {
      setLoadingThread(true);
      try {
        if (isOwner) {
          const info = await fetchOwnerPrivateContact(dossier.id);
          if (active && info) setOwnerPrivateInfo(info);
          if (initialThread && active) {
            setThread(initialThread);
            unsub = subscribeToNegotiationMessages(initialThread.id, (msgs) => {
              if (active) setMessages(msgs);
            });
          }
        } else {
          const createdOrExisting =
            initialThread || (await getOrCreateNegotiationThread(dossier, currentUser));
          if (!active || !createdOrExisting) return;
          setThread(createdOrExisting);
          unsub = subscribeToNegotiationMessages(createdOrExisting.id, (msgs) => {
            if (active) setMessages(msgs);
          });
        }
      } catch (err) {
        console.error('Negotiation thread init error:', err);
      } finally {
        if (active) setLoadingThread(false);
      }
    };

    init();

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [dossier?.id, currentUser?.uid, dossier?.ownerUid, isOwner, initialThread?.id]);

  if (!dossier) return null;

  const fullName =
    ownerPrivateInfo?.fullName ||
    (dossier.applicant.firstName && dossier.applicant.lastName
      ? `${dossier.applicant.firstName} ${dossier.applicant.lastName}`
      : dossier.applicant.name || dossier.applicant.pseudonym);

  const contactEmail =
    thread?.sharedCreatorEmail || ownerPrivateInfo?.email || dossier.applicant.email || '';
  const contactPhone =
    thread?.sharedCreatorPhone || ownerPrivateInfo?.phone || dossier.applicant.phone || '';

  const emailSubject = `SolvaPact Madagascar — Négociation dossier : ${dossier.title}`;
  const emailBody = `Bonjour ${fullName},\n\nJe vous contacte suite à la publication de votre dossier « ${dossier.title} » (${formatEuro(
    dossier.amountRequested
  )}) sur SolvaPact Madagascar.\n\nJe souhaite échanger avec vous afin de négocier les modalités de financement ou de partenariat.\n\nCordialement,`;

  const gmailComposeUrl = contactEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        contactEmail
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : '';

  const handleCopy = (field: 'email' | 'phone', value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !currentUser?.uid || !messageText.trim()) return;
    setSendingMsg(true);
    try {
      await sendNegotiationMessage(
        thread,
        currentUser.uid,
        currentUser.name,
        isOwner ? 'demandeur' : 'investisseur',
        messageText.trim()
      );
      setMessageText('');
    } catch (err) {
      console.error('Failed sending message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleShareMyContact = async () => {
    if (!thread || !currentUser?.email) return;
    setSharingContact(true);
    try {
      await shareCreatorDirectContactInThread(thread.id, currentUser.email, currentUser.phone);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              sharedCreatorEmail: currentUser.email,
              sharedCreatorPhone: currentUser.phone,
            }
          : prev
      );
    } catch (err) {
      console.error('Error sharing contact:', err);
    } finally {
      setSharingContact(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block mb-1">
              Messagerie & Négociation directe SolvaPact
            </span>
            <h2 className="text-xl font-extrabold leading-tight">
              Contacter {dossier.applicant.pseudonym}
            </h2>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">
              Dossier : {dossier.title} · {formatEuro(dossier.amountRequested)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Dossier recap */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Montant demandé</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {formatEuro(dossier.amountRequested)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Contrepartie proposée</span>
              <span className="font-bold text-slate-900">
                {dossier.investmentReturnMode === 'parts_sociales' ||
                dossier.investmentReturnMode === 'redevance_ca'
                  ? `${dossier.equityPercentage || 15} % (${
                      dossier.investmentReturnMode === 'parts_sociales' ? 'Parts' : 'CA'
                    })`
                  : dossier.targetInterestRate
                  ? formatPct(dossier.targetInterestRate)
                  : 'Négociable'}{' '}
                · {dossier.termMonths} mois
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Mode d'accord</span>
              <span className="font-bold text-emerald-700">100 % net · Accord direct</span>
            </div>
          </div>

          {/* Identity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block">Porteur de dossier</span>
                <span className="inline-flex items-center gap-1.5 max-w-full">
                  <span className={`text-sm truncate ${getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}`}>
                    {fullName}
                  </span>
                  <LoyaltyVerifiedBadge
                    tier={
                      dossier.applicant.loyaltyTier ||
                      (dossier.isDiamondPriority ? 'diamond' : 'none')
                    }
                    size="xs"
                  />
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block">Profession & Ville</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {dossier.applicant.profession} · {dossier.applicant.city}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Firestore Direct Chat */}
          {thread && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span>Messagerie directe sécurisée SolvaPact</span>
                </div>
                {isOwner && !thread.sharedCreatorEmail && currentUser?.email && (
                  <button
                    type="button"
                    disabled={sharingContact}
                    onClick={handleShareMyContact}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Partager mon Gmail & Tél.</span>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-2.5 max-h-56 overflow-y-auto thin-scrollbar bg-slate-50">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span>Ouverture du canal privé...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Envoyez votre premier message ou proposition à {dossier.applicant.pseudonym}. Vos échanges sont enregistrés en temps réel.
                  </p>
                ) : (
                  <>
                    {messages.map((m) => {
                      const isMine = m.senderUid === currentUser?.uid;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {m.senderName} {m.createdAtLabel ? `· ${m.createdAtLabel}` : ''}
                          </span>
                          <div
                            className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                              isMine
                                ? 'bg-orange-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Proposer un montant, poser une question sur les parts ou la garantie..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !messageText.trim()}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer</span>
                </button>
              </form>
            </div>
          )}

          {/* Direct Contact Channels (Shared Gmail / +261 Phone) */}
          {(contactEmail || contactPhone) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Coordonnées directes partagées (MVola / Orange Money / Gmail / Banque)
              </h3>

              {contactEmail && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Adresse e-mail / Gmail
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-900 break-all">
                          {contactEmail}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('email', contactEmail)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Écrire sur Gmail</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
                        `[SolvaPact] ${dossier.title}`
                      )}`}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-orange-600" />
                      <span>Application mail</span>
                    </a>
                  </div>
                </div>
              )}

              {contactPhone && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Numéro de téléphone
                      </span>
                      <a
                        href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                        className="text-sm font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy('phone', contactPhone)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Safety notice */}
          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2.5 text-xs text-orange-950">
            <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Négociation et transferts hors site :</strong> Aucun montant ne transite par la plateforme : tous les échanges restent 100 % nets entre vous. Convenez librement de vos modalités (MVola, Orange Money, Airtel Money ou virement bancaire BNI / BOA / SEPA) puis signez votre contrat sous seing privé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
