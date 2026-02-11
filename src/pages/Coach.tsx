import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Shield, Clock, ChevronDown, RefreshCw, AlertTriangle, Trash2, Mic, Square, Zap, BrainCircuit, MessageSquare, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { coachService, ChatMessage } from '../services/coachService';
import { Button } from '../components/ui/Button';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

type AnalysisRange = 'current_cycle' | 'last_30_days' | 'current_month';

const QUICK_ACTIONS = [
    { text: "Analiza gastos", icon: <Zap size={14} /> },
    { text: "¿Cómo ahorrar?", icon: <Sparkles size={14} /> },
    { text: "Categoría top", icon: <BrainCircuit size={14} /> },
    { text: "Proyectar mes", icon: <Clock size={14} /> }
];

export const CoachPage: React.FC = () => {
    const { user } = useAuth();
    const { generateDataPacket, apiKey } = useFinance();

    // State
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

    // Initialize Session & History
    useEffect(() => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy Budgy Coach. Tu estratega financiero personal. ¿Qué objetivo conquistaremos hoy?',
            timestamp: new Date()
        }]);
    }, []);

    // Voice Recognition Setup
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
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setInputText(prev => (prev + ' ' + finalTranscript).trim());
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsRecording(false);
                };

                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                    if (userReleasedRef.current) {
                        setShouldSendVoice(true);
                        userReleasedRef.current = false;
                    }
                };
            }
        }
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) return;
        userReleasedRef.current = false;
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Error starting recognition:", e);
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;
        userReleasedRef.current = true;
        recognitionRef.current?.stop();
        setIsRecording(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);

    const handleClearChat = () => {
        if (confirm('¿Quieres borrar el historial de esta conversación?')) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: '¡Listo! He reseteado mi contexto. ¿En qué nos enfocaremos ahora?',
                timestamp: new Date()
            }]);
            setSessionId(crypto.randomUUID());
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading || !user || !sessionId) return;

        setError(null);
        const context = generateDataPacket(range);

        if (privacyMode && context.significantExpenses) {
            context.significantExpenses = context.significantExpenses.map((e: any) => ({
                ...e,
                desc: 'HIDDEN_PRIVACY_MODE'
            }));
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const responseText = await coachService.sendMessage(user.id, sessionId, text, context, privacyMode, apiKey);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            console.error('Chat Error:', err);
            setError(err.message || 'No pude conectar con el cerebro de IA.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (shouldSendVoice && inputText.trim()) {
            handleSend(inputText);
            setShouldSendVoice(false);
        }
    }, [shouldSendVoice, inputText]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center pt-32">
                <Bot size={48} className="text-gray-500 mb-4 animate-pulse" />
                <h2 className="text-xl font-bold text-white">Inicia sesión</h2>
                <p className="text-gray-400 mt-2">Necesitas una cuenta para hablar con el Coach.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] relative overflow-hidden bg-[#0a0a0c]">
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-fuchsia-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[40%] right-[15%] w-[25%] h-[25%] bg-emerald-500/5 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
            </div>

            {/* Header */}
            <header className="backdrop-blur-2xl bg-black/40 border-b border-white/5 p-4 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3 transition-transform hover:rotate-0">
                            <Bot size={24} className="text-white -rotate-3" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0c] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                        <h1 className="font-black text-white text-lg tracking-tight uppercase italic">Coach AI</h1>
                        <div className="flex items-center gap-1.5 overflow-hidden h-4">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.span
                                        key="thinking"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        className="text-xs text-indigo-400 font-bold tracking-widest uppercase flex items-center gap-1"
                                    >
                                        <RefreshCw size={10} className="animate-spin" /> Procesando
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="ready"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        className="text-xs text-emerald-400 font-bold tracking-widest uppercase"
                                    >
                                        Listo para analizar
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleClearChat}
                        className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 flex items-center justify-center group"
                    >
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <Clock size={14} className="text-indigo-400" />
                            <span className="hidden sm:inline">{range === 'current_cycle' ? 'Ciclo' : range === 'last_30_days' ? '30 D' : 'Mes'}</span>
                            <ChevronDown size={14} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#121214] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30 backdrop-blur-3xl"
                                >
                                    {[
                                        { id: 'current_cycle', label: 'Ciclo Actual' },
                                        { id: 'last_30_days', label: 'Últimos 30 Días' },
                                        { id: 'current_month', label: 'Mes Calendario' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setRange(opt.id as AnalysisRange); setIsDropdownOpen(false); }}
                                            className={cn(
                                                "w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/10 transition-colors border-b border-white/5 last:border-0",
                                                range === opt.id ? "text-indigo-400" : "text-gray-400"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 z-10 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 transition-colors">
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <BrainCircuit size={48} className="text-indigo-500 mb-4 animate-float" />
                        <p className="text-sm font-bold tracking-[0.2em] text-white uppercase italic">IA Cuántica Activa</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={cn(
                            "max-w-[90%] sm:max-w-[80%] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden",
                            msg.role === 'user'
                                ? "bg-gradient-to-br from-indigo-600/20 to-violet-900/40 text-white rounded-tr-none border border-indigo-500/20"
                                : "bg-white/5 backdrop-blur-xl text-gray-100 border border-white/10 rounded-tl-none shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
                        )}>
                            {msg.role === 'assistant' && (
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
                            )}

                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                        <Bot size={16} className="text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Budgy Intelligence</span>
                                </div>
                            )}

                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-indigo-300 prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-300 prose-li:my-1">
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>

                            <div className="mt-3 text-[8px] text-gray-500 font-black uppercase tracking-widest text-right opacity-30 flex items-center justify-end gap-1">
                                <Clock size={8} />
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-none px-6 py-4 flex gap-2 items-center">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(99,102,241,1)]" />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(168,85,247,1)]" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(236,72,153,1)]" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Overlay Section - Now handles its own background correctly */}
            <div className="shrink-0 z-20 pb-4 sm:pb-8 px-4 sm:px-8 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent pt-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Error Banner inside flow */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="bg-red-500/20 backdrop-blur-xl border border-red-500/50 p-4 rounded-2xl text-xs text-red-400 font-black tracking-widest uppercase flex items-center gap-3 shadow-[0_10px_40px_rgba(239,68,68,0.2)] mb-4"
                            >
                                <AlertTriangle size={20} />
                                <span className="flex-1">{error}</span>
                                <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg"><Plus className="rotate-45" size={16} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floating Quick Actions - Scroll fixed */}
                    <AnimatePresence>
                        {messages.length < 3 && !isFocused && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="flex gap-2 overflow-x-auto pb-2 px-2 no-scrollbar"
                            >
                                {QUICK_ACTIONS.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(action.text)}
                                        className="whitespace-nowrap bg-white/5 hover:bg-indigo-500/20 text-gray-300 text-[10px] font-black tracking-widest uppercase px-6 py-4 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all flex items-center gap-3 group backdrop-blur-2xl shadow-xl hover:shadow-indigo-500/10 active:scale-95"
                                    >
                                        <span className="text-indigo-400 group-hover:scale-125 transition-transform">{action.icon}</span>
                                        {action.text}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* The Command Bar */}
                    <div className={cn(
                        "relative flex items-center gap-4 transition-all duration-700 p-2.5 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl",
                        isFocused
                            ? "bg-white/10 border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.15)] ring-4 ring-indigo-500/5"
                            : "bg-white/[0.03] border-white/[0.08]"
                    )}>
                        <div className="flex-1 relative flex items-center">
                            <div className={cn(
                                "pl-5 pr-2 transition-colors duration-500",
                                isFocused ? "text-indigo-400" : "text-gray-600"
                            )}>
                                <MessageSquare size={20} />
                            </div>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Escribe un comando o pregunta..."
                                disabled={isLoading}
                                className="w-full bg-transparent text-white rounded-full py-4 outline-none font-medium placeholder:text-gray-600 text-sm tracking-wide"
                            />

                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                                disabled={isLoading}
                                title="Mantén presionado para hablar"
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all relative group mr-1",
                                    isRecording
                                        ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                                        : "bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {isRecording && <div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-50" />}
                                {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
                            </button>
                        </div>

                        <button
                            onClick={() => handleSend(inputText)}
                            disabled={(!inputText.trim() && !isRecording) || isLoading}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center transition-all group overflow-hidden relative",
                                inputText.trim() || isLoading
                                    ? "bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/30 opacity-100 scale-100"
                                    : "bg-white/5 text-gray-700 opacity-30 scale-95"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isLoading ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} className="ml-1 -rotate-12 group-hover:rotate-0 transition-transform relative z-10" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-8">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                privacyMode ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-gray-700"
                            )} />
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", privacyMode ? "text-emerald-500/80" : "text-gray-700")}>
                                {privacyMode ? "Escudo de Privacidad Activo" : "Protocolo de Seguridad Estándar"}
                            </span>
                        </div>
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group font-sans"
                        >
                            <Shield size={10} className={cn("transition-colors", privacyMode ? "text-indigo-400" : "text-gray-500")} />
                            {privacyMode ? "Desactivar" : "Blindar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
