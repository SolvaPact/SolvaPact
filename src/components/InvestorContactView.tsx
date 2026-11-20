import React, { useState } from 'react';
import {
  DirectSubmission,
  Dossier,
  InvestorDirectoryEntry,
  User,
} from '../types';
import { updateDirectSubmissionStatusInFirestore } from '../services/firestoreService';
import {
  formatAriaryApprox,
  formatEuro,
  getLoyaltyNameColorClass,
} from '../utils/finance';
import { InvestorProfileSettingsModal } from './InvestorProfileSettingsModal';
import {
  Search,
  MapPin,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  FileSignature,
  Inbox,
  CheckCircle2,
  Eye,
  HeartHandshake,
  Archive,
  Copy,
  Check,
  UserCheck,
  Users,
  PlusCircle,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

interface InvestorContactViewProps {
  currentUser: User | null;
  investors: InvestorDirectoryEntry[];
  incomingSubmissions: DirectSubmission[];
  sentSubmissions: DirectSubmission[];
  dossiers: Dossier[];
  onOpenAuth: () => void;
  onUserUpdated: (user: User) => void;
  onSendDossierToInvestor: (investor: InvestorDirectoryEntry) => void;
  onSelectDossier: (dossier: Dossier) => void;
  onOpenDeposit: () => void;
}

const STATUS_BADGES: Record<
  DirectSubmission['status'],
  { label: string; className: string }
> = {
  envoye: {
    label: 'Envoyé',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  consulte: {
    label: 'Consulté',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  interesse: {
    label: 'Investisseur intéressé',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  archive: {
    label: 'Archivé',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export const InvestorContactView: React.FC<InvestorContactViewProps> = ({
  currentUser,
  investors,
  incomingSubmissions,
  sentSubmissions,
  dossiers,
  onOpenAuth,
  onUserUpdated,
  onSendDossierToInvestor,
  onSelectDossier,
  onOpenDeposit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'envoye' | 'interesse' | 'archive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  const filteredIncoming = incomingSubmissions.filter((sub) => {
    if (inboxFilter === 'envoye') return sub.status === 'envoye' || sub.status === 'consulte';
    if (inboxFilter === 'interesse') return sub.status === 'interesse';
    if (inboxFilter === 'archive') return sub.status === 'archive';
    return true;
  });

  const uniqueCities = Array.from(
    new Set(investors.map((inv) => inv.city).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  const filteredInvestors = investors.filter((inv) => {
    if (cityFilter !== 'all' && inv.city !== cityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.displayName.toLowerCase().includes(q) ||
        inv.city.toLowerCase().includes(q) ||
        (inv.investmentFocus || '').toLowerCase().includes(q) ||
        (inv.profession || '').toLowerCase().includes(q) ||
        (inv.bio || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyEmail = (uid: string, email: string) => {
    navigator.clipboard?.writeText(email).catch(() => {});
    setCopiedId(uid);
    setTimeout(() => setCopiedId((prev) => (prev === uid ? null : prev)), 2000);
  };

  const handleStatusChange = async (
    submissionId: string,
    nextStatus: 'consulte' | 'interesse' | 'archive'
  ) => {
    setUpdatingSubId(submissionId);
    try {
      await updateDirectSubmissionStatusInFirestore(submissionId, nextStatus);
    } catch (err) {
      console.error('Error updating submission status:', err);
    } finally {
      setUpdatingSubId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Madagascar */}
      <section className="rounded-3xl overflow-hidden bg-slate-950 text-white border border-orange-500/20 shadow-lg">
        <div className="h-1.5 w-full flex">
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-[#FC3D32]" />
          <span className="w-1/3 bg-[#007E3A]" />
        </div>
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Prendre contact · Annuaire direct des investisseurs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Envoyez directement votre dossier aux investisseurs inscrits
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Retrouvez ici la liste des investisseurs qui ont coché le statut <strong>Investisseur</strong>, signé la <strong>lettre de consentement</strong> et confirmé être <strong>OK pour recevoir des dossiers venant de demandeurs</strong>. Choisissez votre investisseur, transmettez-lui votre dossier en 1 clic ou écrivez-lui directement — en <strong>accord direct entre vous</strong>, sans intermédiaire bancaire.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>
                  {currentUser.investorDirectoryConsent
                    ? 'Ma fiche Investisseur (Visible)'
                    : 'Devenir investisseur visible / Consentement'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Se connecter (Demandeur ou Investisseur)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Logged-out Gate */}
      {!currentUser ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Connectez-vous pour consulter les coordonnées et envoyer votre dossier
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pour protéger l&apos;e-mail et le téléphone de nos investisseurs contre le spam, l&apos;annuaire est réservé aux membres connectés gratuitement. Lors de la connexion, cochez simplement <strong>Demandeur</strong> ou <strong>Investisseur</strong> (avec option de refuser ou d&apos;accepter la lettre de consentement).
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-orange-400" />
            <span>Connexion gratuite avec Google</span>
          </button>
        </div>
      ) : (
        <>
          {/* Investor Incoming Dossiers Inbox */}
          {(currentUser.role === 'investisseur' || incomingSubmissions.length > 0) && (
            <section className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Dossiers reçus directement ({incomingSubmissions.length})
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Les demandeurs qui vous ont ciblé depuis l&apos;onglet Prendre contact apparaissent ici en temps réel.
                    </p>
                  </div>
                </div>
                {currentUser.investorDirectoryConsent ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 self-start">
                    <FileSignature className="w-3.5 h-3.5" />
                    OK pour recevoir des dossiers · Consentement accepté
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg self-start cursor-pointer"
                  >
                    Apparaître dans la liste ? Signer le consentement
                  </button>
                )}
              </div>

              {incomingSubmissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Aucun dossier direct reçu pour le moment. Dès qu&apos;un porteur de projet vous enverra son dossier, il s&apos;affichera ici avec ses coordonnées complètes.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {[
                      { id: 'all', label: `Tous (${incomingSubmissions.length})` },
                      {
                        id: 'envoye',
                        label: `À traiter (${
                          incomingSubmissions.filter(
                            (s) => s.status === 'envoye' || s.status === 'consulte'
                          ).length
                        })`,
                      },
                      {
                        id: 'interesse',
                        label: `Intéressé (${
                          incomingSubmissions.filter((s) => s.status === 'interesse').length
                        })`,
                      },
                      {
                        id: 'archive',
                        label: `Archivés (${
                          incomingSubmissions.filter((s) => s.status === 'archive').length
                        })`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setInboxFilter(tab.id as 'all' | 'envoye' | 'interesse' | 'archive')
                        }
                        className={`px-3 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                          inboxFilter === tab.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {filteredIncoming.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">
                      Aucun dossier dans ce filtre.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredIncoming.map((sub) => {
                        const badge = STATUS_BADGES[sub.status] || STATUS_BADGES.envoye;
                        const linkedDossier = sub.dossierId
                          ? dossiers.find((d) => d.id === sub.dossierId)
                          : undefined;

                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">
                              {sub.dossierTitle}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              De <strong>{sub.senderName}</strong> · {sub.senderCity}
                              {sub.createdAt ? ` · le ${sub.createdAt}` : ''}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatEuro(sub.amountRequested)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">
                              ({formatAriaryApprox(sub.amountRequested)})
                            </span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">{sub.termMonths} mois</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">{sub.category}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          {sub.dossierSummary}
                        </p>

                        <div className="p-2.5 rounded-lg bg-orange-50/70 border border-orange-100 text-xs text-slate-700 italic">
                          &laquo; {sub.personalMessage} &raquo;
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                          <a
                            href={`mailto:${encodeURIComponent(sub.senderEmail)}?subject=${encodeURIComponent(
                              `Re: ${sub.dossierTitle} (SolvaPact Madagascar)`
                            )}`}
                            className="inline-flex items-center gap-1 font-semibold text-orange-700 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{sub.senderEmail}</span>
                          </a>
                          {sub.senderPhone && (
                            <a
                              href={`tel:${sub.senderPhone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{sub.senderPhone}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                          {sub.status !== 'archive' && (
                            <>
                              {sub.status === 'envoye' && (
                                <button
                                  type="button"
                                  disabled={updatingSubId === sub.id}
                                  onClick={() => handleStatusChange(sub.id, 'consulte')}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-300 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-blue-600" />
                                  <span>Marquer consulté</span>
                                </button>
                              )}
                              {sub.status !== 'interesse' && (
                                <button
                                  type="button"
                                  disabled={updatingSubId === sub.id}
                                  onClick={() => handleStatusChange(sub.id, 'interesse')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Je suis intéressé</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={updatingSubId === sub.id}
                                onClick={() => handleStatusChange(sub.id, 'archive')}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-500 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Archiver</span>
                              </button>
                            </>
                          )}
                          {linkedDossier && (
                            <button
                              type="button"
                              onClick={() => onSelectDossier(linkedDossier)}
                              className="ml-auto px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Voir dossier</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Investor Directory Filter + Cards */}
          <section className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, secteur (agriculture, commerce...), ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-slate-500 font-medium">
                  <strong className="text-slate-900">{filteredInvestors.length}</strong>{' '}
                  investisseur{filteredInvestors.length > 1 ? 's' : ''} visible
                  {filteredInvestors.length > 1 ? 's' : ''}
                </span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">Toutes les villes</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredInvestors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredInvestors.map((inv) => {
                  const nameColor = getLoyaltyNameColorClass(inv.loyaltyTier || 'none', false);
                  const isMe = currentUser.uid === inv.uid || currentUser.id === inv.uid;

                  return (
                    <div
                      key={inv.uid}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-orange-300 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`text-base font-bold ${nameColor}`}>
                              {inv.displayName}
                              {isMe && (
                                <span className="ml-1.5 text-[10px] font-semibold text-slate-500">
                                  (Vous)
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>{inv.city}</span>
                              {inv.profession && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{inv.profession}</span>
                                </>
                              )}
                            </p>
                          </div>

                          <span
                            title={`Lettre de consentement signée le ${inv.consentAcceptedAt} : OK pour recevoir des dossiers venant de demandeurs`}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 inline-flex items-center gap-1"
                          >
                            <FileSignature className="w-3 h-3" />
                            <span>OK Dossiers</span>
                          </span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-emerald-50/75 border border-emerald-200/80 text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>OK pour recevoir des dossiers venant de demandeurs</span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                              Secteurs recherchés
                            </span>
                            <span className="font-semibold text-slate-800">
                              {inv.investmentFocus || 'Tous projets sérieux & rentables'}
                            </span>
                          </div>
                          {inv.ticketRange && (
                            <div className="pt-1 border-t border-slate-200/70">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                                Enveloppe indicative
                              </span>
                              <span className="font-bold text-emerald-700">{inv.ticketRange}</span>
                            </div>
                          )}
                        </div>

                        {inv.bio && (
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {inv.bio}
                          </p>
                        )}

                        <div className="space-y-1.5 pt-1 text-xs">
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                            <a
                              href={`mailto:${encodeURIComponent(inv.contactEmail)}`}
                              className="flex items-center gap-1.5 text-slate-800 font-semibold truncate hover:text-orange-600"
                            >
                              <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span className="truncate">{inv.contactEmail}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(inv.uid, inv.contactEmail)}
                              title="Copier l'adresse e-mail"
                              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer shrink-0"
                            >
                              {copiedId === inv.uid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {inv.contactPhone && (
                            <a
                              href={`tel:${inv.contactPhone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-2 text-slate-600 hover:text-emerald-700 font-medium transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{inv.contactPhone}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSendDossierToInvestor(inv)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer mon dossier</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {investors.length === 0
                    ? "Aucun investisseur n'a encore accepté la publication dans l'annuaire"
                    : 'Aucun investisseur ne correspond à votre filtre'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {investors.length === 0
                    ? "Les investisseurs qui acceptent la lettre de consentement lors de leur connexion apparaissent automatiquement ici. Vous pouvez aussi publier votre dossier dans l'onglet Investissements."
                    : 'Modifiez votre recherche ou affichez toutes les villes pour voir tous les investisseurs disponibles.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>M&apos;inscrire comme investisseur</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDeposit}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Déposer un dossier public</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sent Submissions Tracker */}
          {sentSubmissions.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Send className="w-4 h-4 text-orange-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Dossiers que j&apos;ai envoyés directement ({sentSubmissions.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sentSubmissions.map((sub) => {
                  const badge = STATUS_BADGES[sub.status] || STATUS_BADGES.envoye;
                  return (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {sub.dossierTitle}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Envoyé à <strong>{sub.investorName}</strong> ({sub.investorEmail}) ·{' '}
                          {formatEuro(sub.amountRequested)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <InvestorProfileSettingsModal
            isOpen={isSettingsOpen}
            currentUser={currentUser}
            onClose={() => setIsSettingsOpen(false)}
            onUpdated={onUserUpdated}
          />
        </>
      )}
    </div>
  );
};
