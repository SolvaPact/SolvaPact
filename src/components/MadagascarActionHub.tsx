import React, { useState } from 'react';
import { EUR_TO_MGA_RATE, formatEuro } from '../utils/finance';
import {
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  FileCheck2,
  HelpCircle,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface MadagascarActionHubProps {
  onOpenSimulateur: () => void;
  onOpenContactInvestors: () => void;
  onOpenHelp: () => void;
  onOpenDepositWithAmount: (amountEuro: number) => void;
}

export const MadagascarActionHub: React.FC<MadagascarActionHubProps> = ({
  onOpenSimulateur,
  onOpenContactInvestors,
  onOpenHelp,
  onOpenDepositWithAmount,
}) => {
  const [euroInput, setEuroInput] = useState<string>('2000');
  const [ariaryInput, setAriaryInput] = useState<string>(String(2000 * EUR_TO_MGA_RATE));

  const parsedEuro = Math.max(0, Number(euroInput.replace(/\s+/g, '').replace(',', '.')) || 0);

  const handleEuroChange = (raw: string) => {
    setEuroInput(raw);
    const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
    if (cleaned === '') {
      setAriaryInput('');
      return;
    }
    const num = Number(cleaned);
    if (!Number.isNaN(num) && num >= 0) {
      setAriaryInput(String(Math.round(num * EUR_TO_MGA_RATE)));
    }
  };

  const handleAriaryChange = (raw: string) => {
    setAriaryInput(raw);
    const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
    if (cleaned === '') {
      setEuroInput('');
      return;
    }
    const num = Number(cleaned);
    if (!Number.isNaN(num) && num >= 0) {
      const eur = Math.round((num / EUR_TO_MGA_RATE) * 100) / 100;
      setEuroInput(eur > 0 ? String(Math.round(eur)) : '0');
    }
  };

  const applyPresetEuro = (amount: number) => {
    setEuroInput(String(amount));
    setAriaryInput(String(Math.round(amount * EUR_TO_MGA_RATE)));
  };

  const formattedAriary = new Intl.NumberFormat('fr-FR').format(
    Math.round(Number(ariaryInput.replace(/\s+/g, '')) || 0)
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Practical Madagascar Workflow & Direct Payment Channels */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 block mb-1">
              Boîte à outils SolvaPact Madagascar
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Passez de l’idée à l’accord direct en toute clarté
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Tout est pensé pour les échanges entre porteurs de projets à Madagascar et investisseurs locaux ou de la diaspora.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">1. Préparation & Vérif</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Rédigez gratuitement avec SolvaSolution IA et appuyez votre sérieux (NIF/STAT ou SIREN).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">2. Accord sous seing privé</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Négociez directement vos échéances ou parts sociales, puis générez votre contrat privé prêt à signer.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-900">3. Transferts directs</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Règlements 100 % nets hors site via MVola, Orange Money, Airtel Money ou virement BNI / BOA / SEPA.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenSimulateur}
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-orange-400" />
              <span>Ouvrir le simulateur</span>
            </button>

            <button
              type="button"
              onClick={onOpenContactInvestors}
              className="px-4 py-2.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              <span>Annuaire des investisseurs</span>
            </button>

            <button
              type="button"
              onClick={onOpenHelp}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              <span>Poser une question à SolvaSolution</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Euro <-> Ariary (MGA) Express Converter */}
        <div className="lg:col-span-5 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 rounded-2xl border border-orange-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 block">
                  Convertisseur Express Madagascar
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Euro (€) ↔ Ariary (Ar)
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="hub-euro-input"
                  className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
                >
                  Montant en Euros (€)
                </label>
                <div className="relative">
                  <input
                    id="hub-euro-input"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={euroInput}
                    onChange={(e) => handleEuroChange(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="hub-ariary-input"
                  className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
                >
                  Équivalent indicatif en Ariary (Ar)
                </label>
                <div className="relative">
                  <input
                    id="hub-ariary-input"
                    type="number"
                    min={0}
                    step="1000"
                    inputMode="numeric"
                    value={ariaryInput}
                    onChange={(e) => handleAriaryChange(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm font-bold text-orange-950 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-600">
                    Ar
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[500, 2000, 10000, 25000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPresetEuro(preset)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-orange-900 bg-white hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {formatEuro(preset)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-orange-200/60 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Taux indicatif : 1 € ≈ {new Intl.NumberFormat('fr-FR').format(EUR_TO_MGA_RATE)} Ar</span>
              <span className="font-bold text-orange-800 tabular-nums">{formattedAriary} Ar</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenDepositWithAmount(parsedEuro >= 500 ? Math.round(parsedEuro) : 2000)}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>
                Déposer un dossier de {formatEuro(parsedEuro >= 500 ? Math.round(parsedEuro) : 2000)}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
