import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Shield, Clock, ChevronDown, RefreshCw, Trash2, Mic, Square, Zap, BrainCircuit } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { coachService, ChatMessage } from '../services/coachService';
import { Button } from '../components/ui/Button';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

type AnalysisRange = 'current_cycle' | 'last_30_days' | 'current_month';

const QUICK_ACTIONS = [
    { text: "Analiza gastos", icon: <Zap size={12} /> },
    { text: "Como ahorrar?", icon: <Sparkles size={12} /> },
    { text: "Categoria top", icon: <BrainCircuit size={12} /> },
    { text: "Proyectar mes", icon: <Clock size={12} /> }
];

export const CoachPage: React.FC = () => {
    const { user } = useAuth();
    const { generateDataPacket, apiKey } = useFinance();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<AnalysisRange>('current_cycle');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [shouldSendVoice, setShouldSendVoice] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const recognitionRef = useRef<any>(null);
    const userReleasedRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        setMessages([{
            id: 'welcome', role: 'assistant',
            content: 'Hola! Soy Budgy Coach. Tu estratega financiero personal. Que objetivo conquistaremos hoy?',
            timestamp: new Date()
        }]);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'es-ES';
                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                    }
                    if (finalTranscript) setInputText(prev => (prev + ' ' + finalTranscript).trim());
                };
                recognitionRef.current.onerror = () => setIsRecording(false);
                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                    if (userReleasedRef.current) { setShouldSendVoice(true); userReleasedRef.current = false; }
                };
            }
        }
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) return;
        userReleasedRef.current = false;
        try { recognitionRef.current.start(); setIsRecording(true); } catch (e) { console.error("Error:", e); }
    };
    const stopRecording = () => {
        if (!isRecording) return;
        userReleasedRef.current = true;
        recognitionRef.current?.stop();
        setIsRecording(false);
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const handleClearChat = () => {
        if (confirm('Quieres borrar el historial?')) {
            setMessages([{ id: 'welcome', role: 'assistant', content: 'Listo! Contexto reseteado. En que nos enfocaremos?', timestamp: new Date() }]);
            setSessionId(crypto.randomUUID());
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading || !user || !sessionId) return;
        setError(null);
        const context = generateDataPacket(range);
        if (privacyMode && context.significantExpenses) {
            context.significantExpenses = context.significantExpenses.map((e: any) => ({ ...e, desc: 'HIDDEN_PRIVACY_MODE' }));
        }
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);
        try {
            const responseText = await coachService.sendMessage(user.id, sessionId, text, context, privacyMode, apiKey);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, timestamp: new Date() }]);
        } catch (err: any) {
            console.error('Chat Error:', err);
            setError(err.message || 'No pude conectar con el cerebro de IA.');
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (shouldSendVoice && inputText.trim()) { handleSend(inputText); setShouldSendVoice(false); }
    }, [shouldSendVoice, inputText]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center pt-32">
                <Bot size={40} className="text-slate-400 mb-4" />
                <h2 className="text-lg font-sans font-bold text-slate-900">Inicia sesion</h2>
                <p className="text-slate-500 mt-2 text-sm">Necesitas una cuenta para hablar con el Coach.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-80px-var(--sab,0px))] relative overflow-hidden">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl py-4 px-4 flex items-center justify-between z-20 shrink-0 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                        <Bot size={16} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-sans font-semibold text-slate-900 text-xs">Budgy Coach</h1>
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.span key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-[10px] text-blue-500 font-medium flex items-center gap-1">
                                    Pensando...
                                </motion.span>
                            ) : (
                                <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-[10px] text-emerald-600 font-medium">
                                    Listo
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-8 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400" />
                        <span>{range === 'current_cycle' ? 'Ciclo' : range === 'last_30_days' ? '30 D' : 'Mes'}</span>
                        <ChevronDown size={11} className={cn("text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-30">
                                {[
                                    { id: 'current_cycle', label: 'Ciclo Actual' },
                                    { id: 'last_30_days', label: 'Ultimos 30 Dias' },
                                    { id: 'current_month', label: 'Mes Actual' }
                                ].map((opt) => (
                                    <button key={opt.id} onClick={() => { setRange(opt.id as AnalysisRange); setIsDropdownOpen(false); }}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5 text-[11px] font-medium hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0",
                                            range === opt.id ? "text-blue-600" : "text-slate-500"
                                        )}>
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 z-10 no-scrollbar pb-32">
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                        <BrainCircuit size={32} className="text-blue-300 mb-2" />
                        <p className="text-[10px] font-medium tracking-wider text-slate-400">ESTRATEGIA ACTIVA</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 relative",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-md"
                        )}>
                            <div className={cn(
                                "prose prose-sm max-w-none text-inherit leading-relaxed text-[13px]",
                                msg.role === 'user' ? "prose-invert" : "prose-slate"
                            )}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <div className="mt-1.5 text-[9px] opacity-30 text-right tabular-nums">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                        {error}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full p-4 z-20 pointer-events-none">
                <div className="max-w-xl mx-auto pointer-events-auto">
                    {/* Suggestions */}
                    {messages.length === 1 && !isFocused && !inputText && (
                        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar justify-center">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button key={i} onClick={() => handleSend(action.text)}
                                    className="whitespace-nowrap bg-white border border-slate-200 text-slate-700 text-[10px] font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:bg-slate-50">
                                    {action.icon} {action.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className={cn(
                        "flex items-center gap-2 p-1.5 rounded-xl border transition-all duration-200",
                        isFocused
                            ? "bg-white border-blue-400 shadow-lg shadow-blue-500/5"
                            : "bg-white border-slate-200 shadow-lg shadow-black/[0.04]"
                    )}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Pregunta..."
                            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm font-medium placeholder:text-slate-300 text-slate-900"
                            disabled={isLoading}
                        />

                        <div className="flex items-center gap-1">
                            <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
                                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                                className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                    isRecording ? "bg-red-500 text-white" : "text-slate-400 hover:bg-slate-100"
                                )}>
                                {isRecording ? <Square size={12} fill="currentColor" /> : <Mic size={15} />}
                            </button>
                            <button onClick={() => handleSend(inputText)}
                                disabled={(!inputText.trim() && !isRecording) || isLoading}
                                className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                    inputText.trim() || isLoading ? "bg-blue-600 text-white" : "opacity-20"
                                )}>
                                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-3 flex items-center justify-center gap-6">
                        <button onClick={() => setPrivacyMode(!privacyMode)}
                            className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                            <Shield size={10} className={cn(privacyMode && "text-emerald-600")} />
                            {privacyMode ? "Blindado" : "Abierto"}
                        </button>
                        <button onClick={handleClearChat}
                            className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                            <Trash2 size={10} /> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
