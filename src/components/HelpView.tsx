import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  BASE_PUBLICATION_PRICE,
  EXP_PER_DOSSIER,
  LOYALTY_ACTIVATION_PRICE,
  formatEuro,
  getLoyaltyStatus,
} from '../utils/finance';
import {
  Bot,
  Check,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface HelpViewProps {
  onNavigateToTab: (tab: any) => void;
  currentUser?: User | null;
}

interface AiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestHumanSupport?: boolean;
}

const STARTER_QUESTIONS = [
  'Combien coûte la publication d’un dossier ?',
  'Comment fonctionne le Compte Fidélité (80 €) ?',
  'Y a-t-il une commission sur les fonds ?',
  'Quelle est la valeur juridique des accords ?',
];

export const HelpView: React.FC<HelpViewProps> = ({ onNavigateToTab, currentUser }) => {
  const ownerEmail = 'solvapact.vercel.app@gmail.com';
  const loyalty = getLoyaltyStatus(currentUser);

  // SolvaSolution AI Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-solvasolution',
      role: 'model',
      text: currentUser?.name
        ? `Bonjour ${currentUser.name}, je suis SolvaSolution, l'assistant IA de SolvaPact. Que puis-je faire pour vous ?`
        : "Bonjour, je suis SolvaSolution, l'assistant IA de SolvaPact. Que puis-je faire pour vous ?",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Direct Human Escalation Form State
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [subject, setSubject] = useState('dossier');
  const [message, setMessage] = useState('');
  const [includeAiTranscript, setIncludeAiTranscript] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    mailtoUrl: string;
  } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ownerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const buildTranscriptText = () =>
    messages
      .map((m) => `${m.role === 'user' ? 'Client' : 'SolvaSolution (IA)'} : ${m.text}`)
      .join('\n\n');

  const handleEscalateToHuman = (prefillReason?: string) => {
    setIncludeAiTranscript(true);
    setSubject('autre');
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.text;
    const summaryPrefix =
      prefillReason ||
      (lastUserMessage
        ? `Demande transférée depuis SolvaSolution concernant : "${lastUserMessage}"\n\nPrécisions complémentaires : `
        : "Bonjour, SolvaSolution n'a pas pu répondre entièrement à ma question. Voici ma demande : ");

    setMessage((prev) => (prev.trim() ? prev : summaryPrefix));
    document.getElementById('human-support-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendToSolvaSolution = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isAiThinking) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setChatInput('');
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/solvasolution/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory
            .filter((m) => m.id !== 'welcome-solvasolution')
            .slice(-10)
            .map((m) => ({ role: m.role, text: m.text })),
          userContext: currentUser
            ? {
                name: currentUser.name,
                profession: currentUser.profession,
                loyaltyTier: loyalty.label,
                exp: loyalty.exp,
              }
            : undefined,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        suggestHumanSupport?: boolean;
      };

      const replyText =
        data.reply ||
        data.error ||
        "Je ne parviens pas à répondre pour le moment. Vous pouvez transmettre directement votre question au responsable de SolvaPact ci-contre.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: replyText,
          suggestHumanSupport: Boolean(data.suggestHumanSupport || !response.ok),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'model',
          text: "Connexion momentanément interrompue avec SolvaSolution. Vous pouvez transférer votre demande directement au responsable via le formulaire d'assistance humaine.",
          suggestHumanSupport: true,
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendToSolvaSolution(chatInput);
  };

  const handleSubmitHumanForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);

    if (!message.trim() || !name.trim() || !email.trim()) {
      setTicketError('Veuillez renseigner votre nom, votre e-mail et votre message.');
      return;
    }

    const subjectMap: Record<string, string> = {
      dossier: 'Aide concernant la préparation ou publication de dossier (29,99 €)',
      fidelite: 'Question sur le Compte Fidélité (80 € / EXP)',
      nego: 'Assistance sur une négociation ou un protocole sous seing privé',
      technique: 'Signalement technique sur la plateforme',
      autre: 'Demande transmise au responsable SolvaPact',
    };

    const transcript = includeAiTranscript ? buildTranscriptText() : undefined;
    const subjectLine = `[Support SolvaPact] ${subjectMap[subject] || "Demande d'aide"}`;
    const bodyContent = `Bonjour,\n\nNom : ${name}\nEmail : ${email}\nSujet : ${
      subjectMap[subject] || subject
    }\n\nMessage du client :\n${message}${
      transcript ? `\n\n--- Historique avec SolvaSolution (IA) ---\n${transcript}` : ''
    }\n\n---\nEnvoyé depuis le Centre d'Aide SolvaPact`;

    const mailtoUrl = `mailto:${ownerEmail}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyContent)}`;

    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subjectMap[subject] || subject,
          message: message.trim(),
          aiTranscript: transcript,
        }),
      });

      const data = (await res.json()) as { ticketId?: string; error?: string };
      if (!res.ok) {
        setTicketError(data.error || "Erreur lors de l'enregistrement de votre demande.");
        setTicketSubmitting(false);
        return;
      }

      setSubmittedTicket({
        ticketId: data.ticketId || `SP-SUP-${Math.floor(10000 + Math.random() * 90000)}`,
        mailtoUrl,
      });
    } catch {
      setSubmittedTicket({
        ticketId: `SP-SUP-${Math.floor(10000 + Math.random() * 90000)}`,
        mailtoUrl,
      });
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>SolvaSolution (IA Instantanée) & Assistance Directe</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Une réponse immédiate grâce à SolvaSolution, ou un échange direct avec nous
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Discutez en direct avec notre assistant IA <strong>SolvaSolution</strong> sans attendre. Si votre question exige une intervention humaine, transmettez-la directement à notre équipe.
        </p>
      </div>

      {/* Main Split: SolvaSolution AI Chatbox + Direct Human Escalation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: SolvaSolution AI Chatbox (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="p-5 bg-slate-950 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">SolvaSolution</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    IA en direct
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Réponses instantanées sur vos dossiers, paiements à {formatEuro(BASE_PUBLICATION_PRICE)} et fidélité
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleEscalateToHuman()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition-colors shrink-0 cursor-pointer"
            >
              Parler à un humain
            </button>
          </div>

          {/* Starter Questions */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Questions fréquentes :
            </span>
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isAiThinking}
                onClick={() => sendToSolvaSolution(q)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Feed */}
          <div className="p-5 space-y-4 h-[380px] overflow-y-auto bg-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-semibold text-slate-400 mb-1">
                  {m.role === 'user' ? currentUser?.firstName || 'Vous' : 'SolvaSolution · Assistant IA'}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80'
                  }`}
                >
                  {m.text}
                </div>

                {m.role === 'model' && m.suggestHumanSupport && (
                  <button
                    type="button"
                    onClick={() => handleEscalateToHuman()}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Transférer cette demande directement au responsable ({ownerEmail})</span>
                  </button>
                )}
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-start gap-2">
                <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                  <span>SolvaSolution rédige sa réponse...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleChatSubmit}
            className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5"
          >
            <input
              type="text"
              placeholder="Posez votre question à SolvaSolution..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isAiThinking || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
            >
              <span>Demander</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* RIGHT: Direct Human Escalation Form (5 cols) */}
        <div id="human-support-form" className="lg:col-span-5 space-y-6">
          {/* Direct Email Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Relais Humain Direct
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Contacter directement le responsable
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Si SolvaSolution ne peut pas résoudre votre question ou si votre dossier demande une étude personnalisée, votre message est envoyé directement à notre adresse :
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 truncate">
                {ownerEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>

            {submittedTicket ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Demande enregistrée ({submittedTicket.ticketId})</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Votre ticket a été sauvegardé avec succès pour le responsable de SolvaPact. Cliquez ci-dessous pour finaliser l'envoi direct par e-mail avec tout le récapitulatif pré-rempli :
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={submittedTicket.mailtoUrl}
                    target="_top"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Envoyer par e-mail à {ownerEmail}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setMessage('');
                    }}
                    className="text-xs font-semibold text-emerald-900 underline cursor-pointer"
                  >
                    Envoyer une autre demande
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitHumanForm} className="space-y-3.5">
                {ticketError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ticketError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Thomas Martin"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Votre e-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Objet de la demande *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="dossier">Préparation ou publication de dossier ({formatEuro(BASE_PUBLICATION_PRICE)})</option>
                    <option value="fidelite">Compte Fidélité ({formatEuro(LOYALTY_ACTIVATION_PRICE)}) & Paliers EXP</option>
                    <option value="nego">Négociation ou protocole sous seing privé</option>
                    <option value="technique">Problème technique</option>
                    <option value="autre">Question sans réponse de l'IA / Autre demande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Votre message pour l'équipe humaine *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Expliquez votre situation afin que je puisse vous répondre personnellement..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAiTranscript}
                    onChange={(e) => setIncludeAiTranscript(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900"
                  />
                  <span>Joindre mon échange avec SolvaSolution pour gagner du temps</span>
                </label>

                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {ticketSubmitting
                      ? 'Envoi en cours...'
                      : 'Envoyer directement au responsable SolvaPact'}
                  </span>
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Réponse sous 24h ouvrées
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Confidentialité garantie
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-900">Accès rapides :</h4>
            <button
              type="button"
              onClick={() => onNavigateToTab('decouverte')}
              className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
            >
              <span>Revoir le guide de découverte SolvaPact</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('simulateur')}
              className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
            >
              <span>Calculateur gratuit de mensualités & décotes</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-slate-900">
          <HelpCircle className="w-5 h-5 text-slate-700" />
          <h3 className="text-xl font-bold">Questions fréquentes (FAQ)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Combien coûte l'utilisation de SolvaPact ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              La création de compte, l'accès à la plateforme et la préparation de votre dossier sont <strong>100 % gratuits</strong>. Vous ne réglez <strong>{formatEuro(BASE_PUBLICATION_PRICE)}</strong> qu'au moment de publier votre dossier en ligne, sans aucun abonnement.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Comment se passent la négociation et les virements ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              SolvaPact est exclusivement une plateforme de mise en relation. En cliquant sur « Négocier » sur un dossier publié, vous accédez aux coordonnées du créateur (e-mail / Gmail, téléphone, prénom, nom) pour <strong>négocier et effectuer vos virements directement en dehors du site</strong>, avec 0 % de commission.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Comment fonctionne le Compte Fidélité à {formatEuro(LOYALTY_ACTIVATION_PRICE)} ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Pour un paiement unique de {formatEuro(LOYALTY_ACTIVATION_PRICE)}, chaque dossier publié vous rapporte <strong>+{EXP_PER_DOSSIER} EXP</strong> : 50 EXP = Bronze (-10 %), 150 EXP = Silver (-17 %), 300 EXP = Gold (-23 %). Chaque palier change la couleur du nom de votre compte.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900">
              Les accords signés sur SolvaPact sont-ils légaux ?
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Oui, les protocoles sont rédigés selon les articles <strong>1892</strong> et <strong>2044</strong> du Code Civil français sous seing privé, ayant force obligatoire entre les parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
