import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { updateUserInvestorProfileInFirestore } from '../services/firestoreService';
import { useModalEscape } from '../utils/useModalEscape';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileSignature,
  CheckSquare,
  Square,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface InvestorProfileSettingsModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
}

const MADAGASCAR_CITIES = [
  'Antananarivo',
  'Toamasina',
  'Antsirabe',
  'Mahajanga',
  'Fianarantsoa',
  'Toliara',
  'Antsiranana',
  'Nosy Be',
  'Diaspora / Autre',
];

export const InvestorProfileSettingsModal: React.FC<InvestorProfileSettingsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const [role, setRole] = useState<'demandeur' | 'investisseur'>(currentUser.role);
  const [contactEmail, setContactEmail] = useState(
    currentUser.investorContactEmail || currentUser.email || ''
  );
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [city, setCity] = useState(currentUser.city || 'Antananarivo');
  const [profession, setProfession] = useState(
    currentUser.profession || 'Investisseur / Prêteur privé'
  );
  const [focus, setFocus] = useState(currentUser.investorFocus || '');
  const [ticketRange, setTicketRange] = useState(
    currentUser.investorTicketRange || '1 000 € - 25 000 €'
  );
  const [bio, setBio] = useState(currentUser.investorBio || '');
  const [consentGiven, setConsentGiven] = useState<boolean>(
    Boolean(currentUser.investorDirectoryConsent)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRole(currentUser.role);
    setContactEmail(currentUser.investorContactEmail || currentUser.email || '');
    setPhone(currentUser.phone || '');
    setCity(currentUser.city || 'Antananarivo');
    setProfession(currentUser.profession || 'Investisseur / Prêteur privé');
    setFocus(currentUser.investorFocus || '');
    setTicketRange(currentUser.investorTicketRange || '1 000 € - 25 000 €');
    setBio(currentUser.investorBio || '');
    setConsentGiven(Boolean(currentUser.investorDirectoryConsent));
    setError(null);
  }, [isOpen, currentUser]);

  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveConsent = role === 'investisseur' ? consentGiven : false;
    if (
      role === 'investisseur' &&
      effectiveConsent &&
      (!contactEmail.trim() || !contactEmail.includes('@'))
    ) {
      setError(
        "Veuillez indiquer une adresse e-mail de contact valide pour figurer dans l'annuaire investisseurs."
      );
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUserInvestorProfileInFirestore(currentUser, {
        role,
        phone: phone.trim() || undefined,
        city: city.trim() || 'Antananarivo',
        profession: profession.trim() || undefined,
        investorDirectoryConsent: effectiveConsent,
        investorContactEmail: contactEmail.trim() || currentUser.email,
        investorFocus: focus.trim() || undefined,
        investorTicketRange: ticketRange.trim() || undefined,
        investorBio: bio.trim() || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Error updating investor settings:', err);
      setError("Impossible d'enregistrer vos préférences pour le moment. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Annuaire « Prendre contact »</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Statut Investisseur &amp; Lettre de consentement
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1 w-full flex">
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-[#FC3D32]" />
          <span className="w-1/3 bg-[#007E3A]" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Role checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Votre statut sur SolvaPact Madagascar
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole('demandeur');
                  setConsentGiven(false);
                }}
                className={`p-3 rounded-xl border text-left text-xs flex items-start gap-2 transition-all cursor-pointer ${
                  role === 'demandeur'
                    ? 'border-orange-600 bg-orange-50/70 ring-1 ring-orange-600'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                {role === 'demandeur' ? (
                  <CheckSquare className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-slate-900 block">Demandeur</span>
                  <span className="text-[11px] text-slate-500">Porteur de projet</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('investisseur')}
                className={`p-3 rounded-xl border text-left text-xs flex items-start gap-2 transition-all cursor-pointer ${
                  role === 'investisseur'
                    ? 'border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                {role === 'investisseur' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-slate-900 block">Investisseur</span>
                  <span className="text-[11px] text-slate-500">Financeur / Partenaire</span>
                </div>
              </button>
            </div>
          </div>

          {role === 'investisseur' && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Informations de contact Investisseur</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  E-mail de contact pour les demandeurs {consentGiven ? '*' : '(optionnel si refus)'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="investisseur@exemple.com"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+261 34 12 345 67"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ville / Province
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={MADAGASCAR_CITIES.includes(city) ? city : 'Diaspora / Autre'}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {MADAGASCAR_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Profession / Activité
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Enveloppe indicative
                  </label>
                  <input
                    type="text"
                    value={ticketRange}
                    onChange={(e) => setTicketRange(e.target.value)}
                    placeholder="Ex: 1 000 € - 25 000 €"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Secteurs recherchés
                </label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Ex: Agriculture, Immobilier, Commerce, Éducation..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Présentation courte pour les porteurs de projets
                </label>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: Investisseur basé à Antananarivo, ouvert aux prises de parts sociales et prêts directs."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Lettre de consentement */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileSignature className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Lettre de consentement — Visibilité dans « Prendre contact »</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  En acceptant cette lettre, vous confirmez être <strong>OK pour recevoir directement des dossiers venant des demandeurs</strong> et autorisez l&apos;affichage de votre fiche (Nom, Ville, Secteurs, Enveloppe, E-mail et Téléphone de contact) dans l&apos;onglet <strong>Prendre contact</strong>. Si vous refusez, aucun souci : votre compte reste actif normalement mais n&apos;apparaît pas dans la liste.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsentGiven(true)}
                    className={`p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                      consentGiven
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {consentGiven ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span>
                      Oui, j&apos;accepte la lettre de consentement : je suis OK pour recevoir des dossiers venant de demandeurs et figurer dans la liste.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsentGiven(false)}
                    className={`p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                      !consentGiven
                        ? 'border-slate-900 bg-slate-100 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {!consentGiven ? (
                      <CheckSquare className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span>
                      Non, je refuse : rester membre normalement sans apparaître dans la liste.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {role === 'demandeur' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              En tant que <strong>Demandeur</strong>, votre fiche n&apos;apparaît pas dans l&apos;annuaire des investisseurs, mais vous pouvez consulter librement la liste des investisseurs consentants et leur envoyer directement vos dossiers.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer mes choix</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
