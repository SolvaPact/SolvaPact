import React, { useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  Send,
  HelpCircle,
  ShieldCheck,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  UserCheck,
} from 'lucide-react';

interface HelpViewProps {
  onNavigateToTab: (tab: any) => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onNavigateToTab }) => {
  const founderEmail = 'solvapact.vercel.app@gmail.com';
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('dossier');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(founderEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim() || !email.trim()) return;

    // Build mailto link with encoded content
    const subjectMap: Record<string, string> = {
      dossier: 'Assistance concernant un dossier (dette / investissement)',
      nego: 'Question sur une négociation ou un accord amiable',
      commission: 'Question sur la commission et les règlements',
      technique: 'Signalement de problème technique sur la plateforme',
      autre: 'Demande générale SolvaPact',
    };

    const subjectLine = `[Support SolvaPact] ${subjectMap[subject] || 'Demande d’aide'}`;
    const bodyContent = `Bonjour l'équipe SolvaPact,\n\nNom: ${name}\nEmail: ${email}\nSujet: ${subjectMap[subject] || subject}\n\nMessage:\n${message}\n\n---\nEnvoyé depuis le centre d'aide SolvaPact`;

    const mailtoUrl = `mailto:${founderEmail}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyContent)}`;
    window.location.href = mailtoUrl;

    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-slate-900" />
          <span>Centre d'Aide & Assistance Directe</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Besoin d'aide ou d'assistance sur SolvaPact ?
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Une question sur un dossier, un accord sous seing privé ou un blocage technique ? Contactez directement l'équipe de la plateforme pour une prise en charge rapide.
        </p>
      </div>

      {/* Main Contact Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Direct Contact Information */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-emerald-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                  Support & Contact
                </p>
                <h3 className="text-lg font-bold text-white">Équipe SolvaPact</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Notre équipe répond à toutes vos demandes pour vous assister dans vos démarches, l'apurement de vos dettes ou vos négociations.
            </p>

            {/* Email Box */}
            <div className="bg-white/10 border border-white/15 rounded-xl p-3.5 backdrop-blur-sm space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Adresse e-mail directe</span>
                {copied && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copié !
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-white truncate selection:bg-emerald-500">
                  {founderEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copier l'adresse e-mail"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Mailto Button */}
            <a
              href={`mailto:${founderEmail}?subject=Demande%20d%27assistance%20SolvaPact`}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>M'envoyer un e-mail maintenant</span>
            </a>

            {/* Engagements */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Réponse garantie sous 24h ouvrées</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confidentialité stricte de vos informations</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interlocuteur unique et direct sans robot</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Accès rapides :</h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigateToTab('simulateur')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700 font-medium"
              >
                <span>Calculateur de mensualités & commission 2%</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigateToTab('dette')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700 font-medium"
              >
                <span>Consulter les dossiers de rachat de dettes</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Formulaire de contact</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Remplissez les informations ci-dessous pour ouvrir directement votre client e-mail pré-rempli.
              </p>
            </div>
            <MessageSquare className="w-6 h-6 text-slate-400" />
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">
                Message préparé avec succès !
              </h4>
              <p className="text-xs sm:text-sm text-emerald-800">
                Votre logiciel de messagerie a été sollicité avec votre message adressé à <strong>{founderEmail}</strong>. Si votre application e-mail ne s'est pas ouverte automatiquement, vous pouvez lui écrire directement à cette adresse.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs font-semibold text-emerald-900 underline hover:text-emerald-700"
              >
                Rédiger un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Votre Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Thomas Martin"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Votre Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nature de votre demande *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="dossier">Question ou aide sur un dossier déposé</option>
                  <option value="nego">Assistance sur une négociation ou un accord</option>
                  <option value="commission">Questions sur la commission (1,2% dette / 2% invest)</option>
                  <option value="technique">Signaler un bug ou un problème technique</option>
                  <option value="autre">Autre question / Partenariat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre message détaillé *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre situation ou votre question avec le maximum de précision..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Transmettre mon message à l'équipe SolvaPact</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Foire aux questions (FAQ) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-slate-900">
          <HelpCircle className="w-5 h-5 text-slate-700" />
          <h3 className="text-xl font-bold">Questions fréquentes (FAQ)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Comment fonctionne le rachat de dette entre particuliers ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Le demandeur dépose le montant initial de sa dette. Un investisseur ou racheteur propose de solder la créance en échange d'une décote ou d'un rééchelonnement mensuel direct sans intermédiaire bancaire.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Quelle est la commission prélevée par la plateforme ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              La commission est strictement transparente : <strong>1,2 %</strong> pour les opérations d'apurement de dette et <strong>2,0 %</strong> sur les financements de projets d'investissement, payable uniquement lors de la signature définitive de l'accord.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Les accords signés sur SolvaPact sont-ils légaux ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Oui, les protocoles sont rédigés selon les articles <strong>1892</strong> (prêt de consommation) et <strong>2044</strong> (transaction sous seing privé) du Code Civil français, ayant force obligatoire entre les parties.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Que faire en cas de difficulté ou de litige ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Vous pouvez à tout moment contacter l'assistance à <strong>{founderEmail}</strong> pour demander une médiation amiable ou obtenir un duplicata certifié de votre protocole d'accord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
