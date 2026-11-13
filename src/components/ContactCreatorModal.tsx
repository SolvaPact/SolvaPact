import React, { useState } from 'react';
import { Dossier } from '../types';
import { formatEuro, formatPct, getLoyaltyNameColorClass } from '../utils/finance';
import {
  X,
  Mail,
  Phone,
  User as UserIcon,
  MapPin,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ContactCreatorModalProps {
  dossier: Dossier | null;
  onClose: () => void;
}

export const ContactCreatorModal: React.FC<ContactCreatorModalProps> = ({
  dossier,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  if (!dossier) return null;

  const fullName =
    dossier.applicant.firstName && dossier.applicant.lastName
      ? `${dossier.applicant.firstName} ${dossier.applicant.lastName}`
      : dossier.applicant.name || dossier.applicant.pseudonym;

  const firstName =
    dossier.applicant.firstName || fullName.split(' ')[0] || 'Non précisé';
  const lastName =
    dossier.applicant.lastName ||
    fullName.split(' ').slice(1).join(' ') ||
    'Non précisé';

  const contactEmail = dossier.applicant.email || '';
  const contactPhone = dossier.applicant.phone || '';

  const emailSubject = `SolvaPact — Négociation dossier : ${dossier.title}`;
  const emailBody = `Bonjour ${fullName},\n\nJe vous contacte suite à la publication de votre dossier « ${dossier.title} » (${formatEuro(
    dossier.amountRequested
  )}) sur SolvaPact.\n\nJe souhaite échanger directement avec vous afin de négocier les modalités de financement ou de règlement.\n\nCordialement,`;

  const gmailComposeUrl = contactEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        contactEmail
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : '';

  const mailtoUrl = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`
    : '';

  const handleCopy = (field: 'email' | 'phone', value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Négociation directe en dehors du site
            </span>
            <h2 className="text-xl font-extrabold leading-tight">
              Contacter le créateur du dossier
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
              <span className="text-slate-500 block text-[11px]">Conditions ciblées</span>
              <span className="font-bold text-slate-900">
                {dossier.type === 'dette' && dossier.targetDiscount
                  ? `-${dossier.targetDiscount} % décote`
                  : dossier.targetInterestRate
                  ? formatPct(dossier.targetInterestRate)
                  : 'Négociable'}{' '}
                · {dossier.termMonths} mois
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Commission SolvaPact</span>
              <span className="font-bold text-emerald-700">0 % · Accord direct</span>
            </div>
          </div>

          {/* Identity & Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Identité & Profil du porteur de dossier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 block">Prénom & Nom</span>
                  <span className={`text-sm truncate block ${getLoyaltyNameColorClass(dossier.applicant.loyaltyTier, false)}`}>
                    {firstName} {lastName !== 'Non précisé' ? lastName : ''}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 block">Profession & Ville</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {dossier.applicant.profession} · {dossier.applicant.city}
                    {dossier.applicant.postalCode ? ` (${dossier.applicant.postalCode})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Contact Channels (Gmail / Email + Phone) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Coordonnées pour négocier directement
            </h3>

            {/* Email / Gmail Card */}
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
                      {contactEmail || 'E-mail non renseigné sur ce dossier'}
                    </span>
                  </div>
                </div>

                {contactEmail && (
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
                )}
              </div>

              {contactEmail && (
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
                    href={mailtoUrl}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Ouvrir ma messagerie</span>
                  </a>
                </div>
              )}
            </div>

            {/* Phone Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Numéro de téléphone
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {contactPhone || 'Numéro non renseigné sur ce dossier'}
                  </span>
                </div>
              </div>

              {contactPhone && (
                <div className="flex items-center gap-2">
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
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </a>
                </div>
              )}
            </div>

            {/* City / Localisation Info */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Secteur géographique déclaré :{' '}
                <strong className="text-slate-900">
                  {dossier.applicant.city}
                  {dossier.applicant.postalCode ? ` (${dossier.applicant.postalCode})` : ''}
                </strong>
              </span>
            </div>
          </div>

          {/* Transparency notice */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Les négociations se font directement par Gmail, e-mail ou téléphone entre vous et{' '}
              <strong>{fullName}</strong>. Une fois votre accord conclu, les virements d'argent s'effectuent directement entre les parties en dehors du site SolvaPact, avec 0 % de commission.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
