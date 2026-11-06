import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon, MapPin, Phone, ArrowRight, ShieldCheck, HelpCircle, Calendar } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultRole?: 'demandeur' | 'investisseur';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'demandeur',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Form fields as requested by user
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'demandeur' | 'investisseur'>(defaultRole);
  const [reasonForJoining, setReasonForJoining] = useState(
    'Régler ou faire racheter une dette'
  );

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez renseigner votre email et un mot de passe.');
      return;
    }

    if (mode === 'register') {
      if (!firstName || !lastName) {
        setError('Veuillez renseigner votre nom et votre prénom.');
        return;
      }
      if (!city || !postalCode) {
        setError('Veuillez renseigner votre ville et votre code postal.');
        return;
      }
    }

    const fullName = mode === 'register' ? `${firstName} ${lastName}`.trim() : email.split('@')[0];

    const userData: User = {
      id: `usr-${Date.now()}`,
      name: fullName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      age: age ? Number(age) : undefined,
      email,
      role,
      city: city || 'France',
      postalCode: postalCode || undefined,
      phone: phone || undefined,
      reasonForJoining: reasonForJoining,
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };

    onSuccess(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Accès Membre SolvaPact</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {mode === 'register' ? 'Formulaire d\'inscription complet' : 'Se connecter'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Nouvelle Inscription (Profil complet)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connexion rapide
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          {mode === 'register' ? (
            <>
              {/* "Pourquoi êtes-vous là ?" */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pourquoi êtes-vous ici ? (Votre objectif)</span>
                </label>
                <select
                  value={reasonForJoining}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReasonForJoining(val);
                    if (val.includes('Investir')) {
                      setRole('investisseur');
                    } else {
                      setRole('demandeur');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                >
                  <option value="Régler ou faire racheter une dette">
                    J'ai une dette à solder ou à faire racheter avec un accord amiable
                  </option>
                  <option value="Trouver un investissement pour mon projet">
                    Je recherche un investissement / financement pour développer un projet
                  </option>
                  <option value="Investir des capitaux et financer des dossiers">
                    Je suis investisseur / prêteur et je veux financer des dossiers (gain net)
                  </option>
                  <option value="Autre sujet (solidarité, litige, trésorerie diverse)">
                    Autre sujet (solidarité, restructuration, médiation amiable)
                  </option>
                </select>
              </div>

              {/* Nom & Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hugo"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Laumonier"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Âge & Téléphone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Âge
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="18"
                      max="105"
                      placeholder="Ex: 34"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Ville & Code Postal */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ville *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bordeaux, Paris, Lyon"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Code Postal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 33000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </>
          ) : null}

          {/* Email & Mot de passe */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Adresse email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{mode === 'register' ? 'Valider mon inscription et continuer' : 'Se connecter'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center">
            Commission claire de 2 % prélevée uniquement lors de la signature d'un accord financier validé.
          </div>
        </form>
      </div>
    </div>
  );
};
