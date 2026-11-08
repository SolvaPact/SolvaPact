import React, { useState } from 'react';
import { NegotiationThread, Offer, ChatMessage } from '../types';
import { formatEuro, formatPct, calculateMonthlyPayment } from '../utils/finance';
import {
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FileSignature,
  ArrowRight,
  RotateCcw,
  Scale,
  Sparkles,
  ChevronRight,
  Clock,
  CreditCard,
  Banknote,
  Lock,
  Trash2,
} from 'lucide-react';

interface NegotiationRoomProps {
  threads: NegotiationThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
  onSubmitCounterOffer: (threadId: string, offer: Partial<Offer>) => void;
  onAcceptOffer: (threadId: string) => void;
  onViewContract: (thread: NegotiationThread) => void;
  currentUserRole: 'investisseur' | 'demandeur';
  onDeleteThread?: (threadId: string) => void;
}

export const NegotiationRoom: React.FC<NegotiationRoomProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onSendMessage,
  onSubmitCounterOffer,
  onAcceptOffer,
  onViewContract,
  currentUserRole,
  onDeleteThread,
}) => {
  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  const [messageInput, setMessageInput] = useState('');
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [disbursementMethod, setDisbursementMethod] = useState<'carte' | 'virement'>('carte');
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disbursedSuccess, setDisbursedSuccess] = useState(
    activeThread?.disbursementStatus === 'fonds_liberes' || false
  );

  const currentProposedAmount = activeThread?.currentOffer.proposedAmount || 0;
  // If > 20000 €, rate is 1.8% as requested by founder; otherwise 2% (or 1.2% if rachat dette)
  const currentCommissionRate =
    activeThread?.dossierType === 'dette'
      ? 0.012
      : currentProposedAmount > 20000
      ? 0.018
      : 0.02;

  const currentPlatformFee = Math.round(currentProposedAmount * currentCommissionRate);
  const currentNetAmount = currentProposedAmount - currentPlatformFee;

  const handleExecuteDisbursement = () => {
    if (!activeThread) return;
    setIsDisbursing(true);
    setTimeout(() => {
      setIsDisbursing(false);
      setDisbursedSuccess(true);

      // Record 2% commission for the founder!
      try {
        const commissionsRaw = localStorage.getItem('solvapact_founder_commissions_v2');
        const list = commissionsRaw ? JSON.parse(commissionsRaw) : [];
        list.unshift({
          id: `com-${Date.now()}`,
          threadId: activeThread.id,
          dossierTitle: activeThread.dossierTitle,
          applicantName: activeThread.applicantName,
          investorName: activeThread.investorName,
          totalAmount: currentProposedAmount,
          commissionRate: `${(currentCommissionRate * 100).toFixed(1)}%`,
          commissionAmount: currentPlatformFee,
          netDisbursed: currentNetAmount,
          date: new Date().toLocaleDateString('fr-FR'),
          method: disbursementMethod === 'carte' ? 'Carte Bancaire' : 'Virement SEPA Direct',
        });
        localStorage.setItem('solvapact_founder_commissions_v2', JSON.stringify(list));

        // Update founder stats balance
        const savedStats = localStorage.getItem('solvapact_subscription_stats_v2');
        const stats = savedStats
          ? JSON.parse(savedStats)
          : { totalSubscribers: 0, monthlyRevenue: 0, totalCollected: 0, totalCommissions: 0 };

        stats.totalCommissions = (stats.totalCommissions || 0) + currentPlatformFee;
        stats.totalCollected = (stats.totalCollected || 0) + currentPlatformFee;
        localStorage.setItem('solvapact_subscription_stats_v2', JSON.stringify(stats));
      } catch (e) {
        console.error(e);
      }
    }, 1200);
  };

  // Counter offer state
  const [counterAmount, setCounterAmount] = useState<number>(
    activeThread?.currentOffer.proposedAmount || 10000
  );
  const [counterRate, setCounterRate] = useState<number>(
    activeThread?.currentOffer.proposedInterestRate || 5.5
  );
  const [counterTerm, setCounterTerm] = useState<number>(
    activeThread?.currentOffer.proposedTermMonths || 36
  );
  const [counterConditions, setCounterConditions] = useState(
    'Remboursement par prélèvement bancaire SEPA avec engagement sous seing privé.'
  );

  const calculatedCounterMonthly = calculateMonthlyPayment(
    counterAmount,
    counterRate,
    counterTerm
  );

  const isDebtThread = activeThread?.dossierType === 'dette';
  const threadCommissionRate = isDebtThread ? 0.012 : 0.02;

  const counterPlatformFee = Math.round(counterAmount * threadCommissionRate);
  const counterNetAmount = counterAmount - counterPlatformFee;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThread) return;
    onSendMessage(activeThread.id, messageInput.trim());
    setMessageInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!activeThread) return;
    onSendMessage(activeThread.id, prompt);
  };

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    onSubmitCounterOffer(activeThread.id, {
      proposedAmount: Number(counterAmount),
      platformFee: counterPlatformFee,
      netAmountToApplicant: counterNetAmount,
      proposedInterestRate: Number(counterRate),
      proposedTermMonths: Number(counterTerm),
      proposedMonthlyPayment: calculatedCounterMonthly,
      conditions: counterConditions,
    });

    setShowCounterModal(false);
  };

  if (!activeThread) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-6">
        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">
          Aucune négociation active pour le moment
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Consultez la liste des dossiers disponibles ou déposez votre demande pour initier des échanges directs et des offres de financement.
        </p>
      </div>
    );
  }

  const isSigned = activeThread.status === 'agreement_signed';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs my-6 grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
      {/* Left Sidebar: Threads List (3 cols) */}
      <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Discussions actives
            </h3>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {threads.length} fil{threads.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {threads.map((thread) => {
              const isSelected = thread.id === activeThread.id;
              const hasAgreement = thread.status === 'agreement_signed';
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-white border-slate-900 shadow-xs'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="truncate font-medium text-slate-600">
                      {thread.applicantPseudonym}
                    </span>
                    <span>{thread.updatedAt}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {thread.dossierTitle}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatEuro(thread.currentOffer.proposedAmount)}
                    </span>
                    {hasAgreement ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Accord signé
                      </span>
                    ) : (
                      <span className="text-slate-500 tabular-nums">
                        {formatPct(thread.currentOffer.proposedInterestRate)} · {thread.currentOffer.proposedTermMonths}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 mt-4">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cadre de négociation
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Les offres échangées constituent des accords de principe. Une fois acceptée par les deux parties, l'accord génère automatiquement un protocole opposable.
          </p>
        </div>
      </div>

      {/* Center & Right: Active Negotiation Feed & Counter-offer hub (9 cols) */}
      <div className="lg:col-span-9 flex flex-col justify-between bg-white">
        {/* Thread Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span className="font-medium text-slate-700">
                {activeThread.applicantPseudonym} (Demandeur)
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">
                {activeThread.investorName} (Investisseur)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {activeThread.dossierTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSigned ? (
              <button
                onClick={() => onViewContract(activeThread)}
                className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FileSignature className="w-4 h-4 text-emerald-800" />
                <span>Voir le Protocole d'Accord (PDF)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCounterModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Faire une contre-offre</span>
                </button>

                <button
                  onClick={() => onAcceptOffer(activeThread.id)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accepter l'offre en cours</span>
                </button>
              </div>
            )}

            {onDeleteThread && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Voulez-vous supprimer ce fil de négociation de test ?')) {
                    onDeleteThread(activeThread.id);
                  }
                }}
                title="Supprimer ce fil de discussion"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Offer Banner */}
        <div className={`px-6 py-4 border-b ${isSigned ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50/90 border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                <span className={isSigned ? 'text-emerald-800' : 'text-slate-800'}>
                  {isSigned ? 'Accord de principe conclu et ratifié' : 'Offre active actuellement soumise'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 font-normal">{activeThread.currentOffer.createdAt}</span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Conditions : {activeThread.currentOffer.conditions}
              </p>
            </div>

            <div className="flex items-center gap-4 text-right shrink-0">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Montant</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(activeThread.currentOffer.proposedAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-amber-700 block uppercase font-medium">
                  Com. SolvaPact ({isDebtThread ? '1,2%' : '2%'})
                </span>
                <span className="text-base font-bold text-amber-900 tabular-nums">
                  {formatEuro(Math.round(activeThread.currentOffer.proposedAmount * threadCommissionRate))}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Taux annuel</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatPct(activeThread.currentOffer.proposedInterestRate)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Mensualité</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(activeThread.currentOffer.proposedMonthlyPayment)} / m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[380px] bg-white">
          {activeThread.messages.map((msg) => {
            const isInvestor = msg.senderRole === 'investisseur';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isInvestor ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700">{msg.senderName}</span>
                  <span>({isInvestor ? 'Investisseur' : 'Demandeur'})</span>
                  <span aria-hidden="true">·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    isInvestor
                      ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      : 'bg-slate-900 text-white rounded-tr-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Attached Offer inside chat */}
                  {msg.attachedOffer && (
                    <div
                      className={`mt-3 pt-2.5 border-t ${
                        isInvestor ? 'border-slate-200' : 'border-slate-700'
                      } text-[11px]`}
                    >
                      <span className="font-semibold uppercase tracking-wider block mb-1">
                        Proposition formelle jointe :
                      </span>
                      <div className="grid grid-cols-3 gap-2 py-1 font-mono tabular-nums">
                        <div>
                          <span>Capital : </span>
                          <strong>{formatEuro(msg.attachedOffer.proposedAmount)}</strong>
                        </div>
                        <div>
                          <span>Taux : </span>
                          <strong>{formatPct(msg.attachedOffer.proposedInterestRate)}</strong>
                        </div>
                        <div>
                          <span>Durée : </span>
                          <strong>{msg.attachedOffer.proposedTermMonths} mois</strong>
                        </div>
                      </div>
                      <p className="mt-1 opacity-90 italic">
                        « {msg.attachedOffer.conditions} »
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSigned && (
            <div className="space-y-4 my-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <h4 className="text-sm font-bold text-emerald-950">
                  Protocole d'accord validé et signé
                </h4>
                <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                  Les deux parties ont formellement validé les conditions financières. L'acte sous seing privé et le tableau d'amortissement sont disponibles au téléchargement.
                </p>
                <button
                  onClick={() => onViewContract(activeThread)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Ouvrir l'acte juridique officiel</span>
                </button>
              </div>

              {/* Module de Déblocage & Règlement des Fonds */}
              <div className="p-5 rounded-2xl bg-white border-2 border-emerald-600/70 shadow-sm text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Règlement & Déblocage des fonds de l'accord
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      Montant total : {formatEuro(currentProposedAmount)}
                    </span>
                  </div>
                </div>

                {/* Ventilation financière 2% / 98% */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Montant total accordé</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{formatEuro(currentProposedAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Déblocage bénéficiaire (98%)</span>
                    <span className="font-bold text-emerald-800 font-mono text-sm">{formatEuro(currentNetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 uppercase block font-semibold">Commission SolvaPact ({(currentCommissionRate * 100).toFixed(1)}%)</span>
                    <span className="font-bold text-amber-900 font-mono text-sm">{formatEuro(currentPlatformFee)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Le protocole d'accord juridique est formellement signé. Procédez au déblocage : la commission de sécurisation de <strong>{(currentCommissionRate * 100).toFixed(1)}% ({formatEuro(currentPlatformFee)})</strong> est automatiquement prélevée et reversée au compte SolvaPact.
                </p>

                {disbursedSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Fonds débloqués & Règlement validé avec succès !</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Le versement de {formatEuro(currentNetAmount)} au bénéficiaire a été confirmé. La commission de service de {formatEuro(currentPlatformFee)} a été transférée au compte SolvaPact. Une quittance libératoire certifiée conforme au Code Civil a été enregistrée au registre d'accords.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Method selector */}
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDisbursementMethod('carte')}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                          disbursementMethod === 'carte'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Régler par Carte Bancaire</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisbursementMethod('virement')}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                          disbursementMethod === 'virement'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Virement Bancaire SEPA Direct</span>
                      </button>
                    </div>

                    {disbursementMethod === 'carte' ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Numéro de carte bancaire
                            </label>
                            <input
                              type="text"
                              placeholder="4970 •••• •••• ••••"
                              defaultValue="4970 8123 9044 5122"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Expiration
                              </label>
                              <input
                                type="text"
                                placeholder="MM/AA"
                                defaultValue="11/28"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                CVC
                              </label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="•••"
                                defaultValue="378"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-center"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleExecuteDisbursement}
                          disabled={isDisbursing}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                        >
                          {isDisbursing ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Validation du règlement en cours...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Débloquer et verser {formatEuro(activeThread.currentOffer.proposedAmount)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div className="space-y-1.5 text-[11px]">
                          <p className="text-slate-500">Coordonnées de virement du bénéficiaire :</p>
                          <p className="font-mono font-bold text-slate-900 bg-white p-2 rounded border border-slate-200">
                            IBAN : FR76 1005 7820 4401 9823 4567 890
                          </p>
                          <p className="text-slate-500">
                            Bénéficiaire : <strong>{activeThread.applicantName}</strong> · Référence obligatoire : <strong>SP-{activeThread.id.toUpperCase()}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleExecuteDisbursement}
                          disabled={isDisbursing}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmer l'émission du virement bancaire</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Canned Prompts */}
        {!isSigned && (
          <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-medium whitespace-nowrap shrink-0">
              Suggestions rapides :
            </span>
            <button
              onClick={() =>
                handleQuickPrompt(
                  "Pouvez-vous me confirmer les justificatifs de revenus ou le dernier avis d'imposition ?"
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors"
            >
              Demander pièces complémentaires
            </button>
            <button
              onClick={() =>
                handleQuickPrompt(
                  "Je propose un rachat comptant de la créance avec 20% de décote pour solder immédiatement."
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors"
            >
              Proposer décote comptant
            </button>
            <button
              onClick={() =>
                handleQuickPrompt(
                  "Pour valider, une caution solidaire ou un nantissement de matériel est requis."
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors"
            >
              Préciser garantie requise
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            disabled={isSigned}
            placeholder={
              isSigned
                ? 'La négociation est close car un accord mutuel a été signé.'
                : 'Posez une question, proposez un ajustement de taux, ou discutez des garanties...'
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isSigned || !messageInput.trim()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <span>Envoyer</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Counter-Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Formuler une contre-proposition
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajustez les conditions financières et soumettez-les formellement.
                </p>
              </div>
              <button
                onClick={() => setShowCounterModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Montant financé ou racheté (€)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Taux d'intérêt annuel (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="15"
                    value={counterRate}
                    onChange={(e) => setCounterRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Durée de remboursement
                  </label>
                  <select
                    value={counterTerm}
                    onChange={(e) => setCounterTerm(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value={12}>12 mois</option>
                    <option value={24}>24 mois</option>
                    <option value={32}>32 mois</option>
                    <option value={36}>36 mois</option>
                    <option value={48}>48 mois</option>
                    <option value={60}>60 mois</option>
                  </select>
                </div>
              </div>

              {/* Monthly calculation preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500">Nouvelle mensualité résultante :</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(calculatedCounterMonthly)} / mois
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Conditions particulières ou sûretés demandées
                </label>
                <textarea
                  rows={3}
                  value={counterConditions}
                  onChange={(e) => setCounterConditions(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
                >
                  Transmettre la contre-offre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
