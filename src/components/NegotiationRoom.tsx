import React, { useState, useEffect } from 'react';
import { NegotiationThread, Offer } from '../types';
import {
  formatEuro,
  formatPct,
  calculateMonthlyPayment,
} from '../utils/finance';
import {
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FileSignature,
  RotateCcw,
  Handshake,
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
  onMarkDisbursed?: (threadId: string, method: 'carte_bancaire' | 'virement_sepa') => void;
}

export const NegotiationRoom: React.FC<NegotiationRoomProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onSendMessage,
  onSubmitCounterOffer,
  onAcceptOffer,
  onViewContract,
  onDeleteThread,
  onMarkDisbursed,
}) => {
  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  const [messageInput, setMessageInput] = useState('');
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [confirmDeleteThread, setConfirmDeleteThread] = useState(false);

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
    'Accord sous seing privé · Virements effectués directement entre les parties en dehors de SolvaPact.'
  );

  useEffect(() => {
    setConfirmDeleteThread(false);
    if (activeThread) {
      setCounterAmount(activeThread.currentOffer.proposedAmount);
      setCounterRate(activeThread.currentOffer.proposedInterestRate);
      setCounterTerm(activeThread.currentOffer.proposedTermMonths);
      setCounterConditions(activeThread.currentOffer.conditions);
    }
  }, [activeThread?.id]);

  const currentProposedAmount = activeThread?.currentOffer.proposedAmount || 0;

  const calculatedCounterMonthly = calculateMonthlyPayment(
    counterAmount,
    counterRate,
    counterTerm
  );

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
          Ouvrez un dossier publié et cliquez sur « Négocier avec le créateur » pour démarrer une discussion directe.
        </p>
      </div>
    );
  }

  const isSigned = activeThread.status === 'agreement_signed';
  const isSettledExternally = activeThread.disbursementStatus === 'fonds_liberes';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs my-6 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
      {/* Left Sidebar */}
      <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Discussions sur dossiers
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
                        Accord conclu
                      </span>
                    ) : (
                      <span className="text-slate-500 tabular-nums">
                        {formatPct(thread.currentOffer.proposedInterestRate)} ·{' '}
                        {thread.currentOffer.proposedTermMonths}m
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
            Mise en relation uniquement
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            SolvaPact ne gère aucun virement : vous négociez ici, puis les transferts d'argent s'effectuent directement entre vous en dehors du site.
          </p>
        </div>
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-9 flex flex-col justify-between bg-white">
        {/* Thread Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span className="font-medium text-slate-700">
                {activeThread.applicantPseudonym} (Créateur du dossier)
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">
                {activeThread.investorName} (Financeur)
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
                className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <FileSignature className="w-4 h-4 text-emerald-800" />
                <span>Voir le Protocole d'Accord (PDF)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCounterModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Faire une contre-offre</span>
                </button>

                <button
                  onClick={() => onAcceptOffer(activeThread.id)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accepter l'offre</span>
                </button>
              </div>
            )}

            {onDeleteThread &&
              (confirmDeleteThread ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteThread(activeThread.id);
                      setConfirmDeleteThread(false);
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteThread(false)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteThread(true)}
                  title="Supprimer ce fil de discussion"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ))}
          </div>
        </div>

        {/* Active Offer Banner */}
        <div
          className={`px-6 py-4 border-b ${
            isSigned ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                <span className={isSigned ? 'text-emerald-800' : 'text-slate-800'}>
                  {isSigned ? 'Accord conclu et ratifié' : 'Proposition en cours'}
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
                  <span>
                    ({isInvestor ? 'Investisseur' : msg.senderRole === 'system' ? 'Système' : 'Créateur'})
                  </span>
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
                      <p className="mt-1 opacity-90 italic">« {msg.attachedOffer.conditions} »</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSigned && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 my-3">
              <Handshake className="w-7 h-7 text-emerald-700 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-950">
                Accord validé — Virements à effectuer directement en dehors du site
              </h4>
              <p className="text-xs text-emerald-900 max-w-lg mx-auto leading-relaxed">
                SolvaPact assure uniquement la mise en relation et la génération de votre protocole d'accord ({formatEuro(currentProposedAmount)} · 0 % de commission). Échangez vos coordonnées bancaires et procédez au virement directement entre vous en dehors de la plateforme.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => onViewContract(activeThread)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Ouvrir le Protocole d'Accord</span>
                </button>

                {!isSettledExternally && onMarkDisbursed ? (
                  <button
                    type="button"
                    onClick={() => onMarkDisbursed(activeThread.id, 'virement_sepa')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Marquer le virement externe comme effectué</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Opération finalisée entre les parties</span>
                  </span>
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
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Demander pièces complémentaires
            </button>
            <button
              onClick={() =>
                handleQuickPrompt(
                  'Je propose un rachat comptant de la créance avec 20% de décote pour solder immédiatement.'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Proposer décote comptant
            </button>
            <button
              onClick={() =>
                handleQuickPrompt(
                  'Pour valider, une caution solidaire ou un nantissement de matériel est requis.'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-md border border-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Préciser garantie requise
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
        >
          <input
            type="text"
            disabled={isSigned}
            placeholder={
              isSigned
                ? 'Accord validé · Échangez vos coordonnées hors plateforme pour le virement.'
                : 'Discutez avec le créateur du dossier, ajustez les conditions...'
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isSigned || !messageInput.trim()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
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
                  Ajustez les conditions financières et soumettez-les au créateur du dossier.
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
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Envoyer la contre-proposition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
