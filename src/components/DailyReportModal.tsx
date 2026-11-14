import React, { useEffect, useState } from 'react';
import { DailyReportSummary, User } from '../types';
import { formatEuro, canViewDailyReport } from '../utils/finance';
import {
  X,
  BarChart3,
  FileText,
  Euro,
  Award,
  CheckCircle2,
  Mail,
  Copy,
  Check,
  Star,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

function getTodayParisDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayParisDate());
  const [report, setReport] = useState<DailyReportSummary | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('solvapact.vercel.app@gmail.com');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dispatchInfo, setDispatchInfo] = useState<{
    mode: string;
    mailtoUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = canViewDailyReport(currentUser);

  const fetchReport = async (dateKey: string) => {
    if (!currentUser?.name || !isOwner) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/daily?date=${encodeURIComponent(dateKey)}&ownerEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&ownerName=${encodeURIComponent(currentUser.name)}`
      );
      if (res.ok) {
        const data = (await res.json()) as {
          report: DailyReportSummary;
          emailSubject: string;
          emailBody: string;
          recipientEmail: string;
        };
        setReport(data.report);
        setEmailSubject(data.emailSubject);
        setEmailBody(data.emailBody);
        setRecipientEmail(data.recipientEmail);
      }
    } catch (err) {
      console.error('Error loading daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isOwner) {
      setDispatchInfo(null);
      fetchReport(selectedDate);
    }
  }, [isOpen, selectedDate, isOwner]);

  if (!isOpen || !isOwner) return null;

  const handleSendReport = async () => {
    if (!currentUser?.name || !isOwner) return;
    setSending(true);
    try {
      const res = await fetch('/api/analytics/send-daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: currentUser.email || '',
          ownerName: currentUser.name,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          deliveryMode: string;
          mailtoUrl: string;
        };
        setDispatchInfo({
          mode: data.deliveryMode,
          mailtoUrl: data.mailtoUrl,
        });
      }
    } catch (err) {
      console.error('Error dispatching daily report:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCopySummary = () => {
    if (!emailBody) return;
    navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gmailComposeUrl = emailBody
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        recipientEmail
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Accès Privé Propriétaire · Non visible par les clients</span>
            </div>
            <h2 className="text-xl font-extrabold">
              Rendu de fin de journée — {recipientEmail}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Suivi quotidien automatique des publications, du chiffre d'affaires, des comptes fidélité et des dossiers acceptés.
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

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Date Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-700">Journée analysée :</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
              />
            </div>

            <span className="text-[11px] text-slate-500">
              Envoi programmé chaque jour à <strong>23h55 (heure de Paris)</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Chargement du bilan journalier...
            </div>
          ) : report ? (
            <>
              {/* 4 Core KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Dossiers postés</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                    {report.dossiersPosted}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                    <Euro className="w-3.5 h-3.5 text-emerald-700" />
                    <span>CA dossiers publiés</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-900 font-mono tabular-nums">
                    {formatEuro(report.dossierRevenue)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>Comptes fidélité créés</span>
                  </div>
                  <p className="text-2xl font-black text-amber-900 font-mono tabular-nums">
                    {report.loyaltyAccountsCreated}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Dossiers acceptés</span>
                  </div>
                  <p className="text-2xl font-black text-indigo-900 font-mono tabular-nums">
                    {report.dossiersAccepted}
                  </p>
                </div>
              </div>

              {/* Client Satisfaction Reviews Collected */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Avis clients reçus ce jour ({report.reviews.length})
                  </h3>
                  {report.averageRating !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Moyenne : {report.averageRating}/5</span>
                    </span>
                  )}
                </div>

                {report.reviews.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {report.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {rev.userName || 'Client'}{' '}
                            {rev.dossierTitle ? `· ${rev.dossierTitle}` : ''}
                          </span>
                          <span className="font-mono font-bold text-amber-600">
                            {rev.rating}/5 ★
                          </span>
                        </div>
                        {rev.comment && (
                          <p className="text-slate-600 italic">« {rev.comment} »</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                    Aucun avis client déposé sur cette journée.
                  </p>
                )}
              </div>

              {/* Dispatch to Owner Gmail */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Envoyer le rendu complet vers {recipientEmail}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Inclut les 4 indicateurs du jour et les notes/commentaires clients.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié' : 'Copier le rendu'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={handleSendReport}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      {sending
                        ? 'Préparation...'
                        : 'Générer & Envoyer le rendu maintenant'}
                    </span>
                  </button>

                  {gmailComposeUrl && (
                    <a
                      href={gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <span>Ouvrir dans Gmail</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {dispatchInfo && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-bold">
                      {dispatchInfo.mode === 'resend_api'
                        ? `✓ E-mail envoyé automatiquement à ${recipientEmail} !`
                        : `✓ Rendu généré et prêt pour ${recipientEmail}.`}
                    </p>
                    {dispatchInfo.mode !== 'resend_api' && (
                      <p className="text-[11px] text-emerald-800">
                        Astuce : cliquez sur « Ouvrir dans Gmail » ci-dessus pour l'envoyer en 1 clic, ou configurez la clé <code>RESEND_API_KEY</code> dans les Secrets pour un envoi automatique chaque soir sans intervention.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
