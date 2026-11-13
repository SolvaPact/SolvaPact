import React from 'react';
import { InvoiceData } from '../types';
import { formatEuro } from '../utils/finance';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Top bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Facture Officielle SolvaPact · Réf. {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 sm:p-10 space-y-8 bg-white text-slate-900" id="invoice-printable">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                  Solva<span className="text-emerald-600">Pact</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Plateforme P2P
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Service numérique de mise en relation & actes sous seing privé
                <br />
                Site officiel : <strong>solvapact.vercel.app</strong>
                <br />
                Contact : <strong>solvapact.vercel.app@gmail.com</strong>
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                FACTURE ACQUITTÉE
              </span>
              <p className="text-base font-bold font-mono text-slate-900 mt-2">
                N° {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500">Date d'émission : {invoice.date}</p>
              <p className="text-xs text-slate-500">Règlement : {invoice.paymentMethod}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Prestataire / Émetteur
              </p>
              <p className="font-bold text-slate-900 text-sm">SolvaPact</p>
              <p className="text-slate-600">Service de publication & protocoles privés</p>
              <p className="text-slate-500">France · Conforme Articles 1892 & 2044 Code Civil</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Client / Destinataire
              </p>
              <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
              <p className="text-slate-600 font-mono">{invoice.customerEmail}</p>
              <p className="text-slate-500">Compte vérifié sur solvapact.vercel.app</p>
              {invoice.transactionId && (
                <p className="text-[10px] font-mono text-emerald-700 pt-1">
                  ID Transaction : {invoice.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Désignation de la prestation</th>
                  <th className="py-3 px-4 text-center">TVA</th>
                  <th className="py-3 px-4 text-right">Montant HT</th>
                  <th className="py-3 px-4 text-right">Montant TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4 font-medium text-slate-900">
                    <div>{invoice.itemDescription}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {invoice.type === 'loyalty'
                        ? 'Activation à vie du Compte Fidélité (+10 EXP par dossier, paliers -10 %, -17 % et -23 %)'
                        : 'Publication de dossier sur SolvaPact (0 % de commission sur les fonds négociés)'}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-600">
                    {invoice.vatRate}%
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-medium text-slate-700">
                    {formatEuro(invoice.amountHT)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    {formatEuro(invoice.amountTTC)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-mono font-medium">{formatEuro(invoice.amountHT)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>TVA ({invoice.vatRate}%) :</span>
                <span className="font-mono font-medium">{formatEuro(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-extrabold text-slate-900 border-b-2 border-slate-900">
                <span>Total Net Payé (TTC) :</span>
                <span className="font-mono text-emerald-700">{formatEuro(invoice.amountTTC)}</span>
              </div>
            </div>
          </div>

          {/* Legal mentions */}
          <div className="border-t border-slate-200 pt-6 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Mentions légales & Conformité</span>
            </div>
            <p>
              Facture acquittée pour prestation numérique SolvaPact. Aucune commission supplémentaire n'est prélevée sur les montants financés ou rachetés entre utilisateurs. Protocole conforme aux articles 1892 et 2044 du Code Civil.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>
    </div>
  );
};
