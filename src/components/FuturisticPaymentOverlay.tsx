import React from 'react';
import { Check, Lock, ShieldCheck, Sparkles } from 'lucide-react';

interface FuturisticPaymentOverlayProps {
  phase: 'verifying' | 'approved' | null;
  amountLabel: string;
  subtitle: string;
}

export const FuturisticPaymentOverlay: React.FC<FuturisticPaymentOverlayProps> = ({
  phase,
  amountLabel,
  subtitle,
}) => {
  if (!phase) return null;

  const isApproved = phase === 'approved';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl overflow-hidden border p-7 text-center shadow-2xl transition-all duration-300 ${
          isApproved
            ? 'bg-gradient-to-b from-[#041d2e] via-[#06293d] to-[#041428] border-emerald-400/60 shadow-emerald-500/25'
            : 'bg-gradient-to-b from-[#050d26] via-[#0a1d4d] to-[#040c22] border-cyan-400/45 shadow-cyan-500/25'
        }`}
      >
        {/* Subtle cyber grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none"
        />

        {/* Animated holographic scanner beam while verifying */}
        {!isApproved && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse pointer-events-none"
          />
        )}

        <div className="relative z-10 flex flex-col items-center space-y-4">
          {/* Core Emblem */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {!isApproved ? (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/25 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border border-blue-400/30 border-b-emerald-400 animate-spin [animation-direction:reverse]" />
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/45 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                  <Lock className="w-5 h-5" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                <div className="absolute inset-1 rounded-full border-2 border-emerald-400/70 shadow-lg shadow-emerald-400/35" />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-400/40">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
              </>
            )}
          </div>

          {/* Text Readout */}
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] ${
                isApproved ? 'text-emerald-300' : 'text-cyan-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{isApproved ? 'Protocole Validé' : 'Terminal SolvaPact'}</span>
            </span>

            <h3 className="text-lg font-black text-white tracking-tight">
              {isApproved ? 'Transaction approuvée' : 'Vérification sécurisée...'}
            </h3>

            <p className="text-xs text-blue-100/80">{subtitle}</p>
          </div>

          {/* Amount Pill */}
          <div
            className={`px-4 py-2 rounded-xl border font-mono text-base font-black tracking-tight ${
              isApproved
                ? 'bg-emerald-950/60 border-emerald-400/45 text-emerald-300'
                : 'bg-slate-950/65 border-cyan-400/35 text-cyan-300'
            }`}
          >
            {amountLabel}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-blue-200/75 pt-1">
            <ShieldCheck
              className={`w-3.5 h-3.5 ${isApproved ? 'text-emerald-400' : 'text-cyan-400'}`}
            />
            <span>
              {isApproved ? 'Activation instantanée en cours...' : 'Chiffrement de session actif'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
