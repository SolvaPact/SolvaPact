import React, { useState } from 'react';
import { Dossier } from '../types';
import { formatEuro } from '../utils/finance';
import { CheckCircle2, Star, Send, MessageSquareQuote } from 'lucide-react';

interface SatisfactionSurveyModalProps {
  dossier: Dossier | null;
  paidAmount: number;
  onSubmitReview: (rating: number, comment: string) => void;
  onSkip: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: '1/5 · Très insatisfait',
  2: '2/5 · Insatisfait',
  3: '3/5 · Correct',
  4: '4/5 · Satisfait',
  5: '5/5 · Très satisfait !',
};

export const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = ({
  dossier,
  paidAmount,
  onSubmitReview,
  onSkip,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!dossier) return null;

  const displayedStar = hoveredRating || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (rating < 1 || rating > 5) {
      setErrorMsg('Veuillez sélectionner entre 1 et 5 étoiles avant de valider.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      onSubmitReview(rating, comment.trim());
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setSubmitted(false);
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Confirmation Banner */}
        <div className="p-6 sm:p-8 bg-slate-950 text-white text-center space-y-2 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            Paiement confirmé ({formatEuro(paidAmount)}) · Dossier en ligne
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Votre dossier « {dossier.title} » est publié !
          </h2>
          <p className="text-xs text-slate-300">
            Avant de retourner sur la plateforme, dites-nous ce que vous pensez de votre expérience.
          </p>
        </div>

        {/* Survey Form */}
        {submitted ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Merci beaucoup pour votre avis !
            </h3>
            <p className="text-xs text-slate-600">
              Votre note ({rating}/5 étoiles) et votre commentaire ont bien été enregistrés.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Comment évaluez-vous la création et la publication de votre dossier sur SolvaPact ?
              </h3>

              {/* 5 Clickable Stars */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isActive = starValue <= displayedStar;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => {
                        setRating(starValue);
                        setErrorMsg(null);
                      }}
                      aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}`}
                      className={`p-2 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 scale-110'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          isActive
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-slate-700 min-h-[18px]">
                {displayedStar > 0
                  ? RATING_LABELS[displayedStar]
                  : 'Cliquez sur les étoiles pour noter votre satisfaction'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Comment Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-slate-500" />
                <span>Votre commentaire ou suggestion d'amélioration (optionnel)</span>
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Écrivez librement votre ressenti, une remarque ou un conseil pour améliorer SolvaPact..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
              />
            </div>

            <div className="space-y-2.5">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer ma note et voir mon dossier</span>
              </button>

              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Passer pour l'instant
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
