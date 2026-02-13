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
                <h2 className="text-xl font-bold text-foreground">Inicia sesión</h2>
                <p className="text-gray-400 mt-2">Necesitas una cuenta para hablar con el Coach.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] relative overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),transparent)] transition-opacity duration-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] contrast-100" />
            </div>

            {/* Header - Zen Minimal */}
            <header className="backdrop-blur-xl bg-white/50 py-6 px-6 flex items-center justify-between z-20 shrink-0 border-b border-border/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Bot size={18} className="text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-black italic text-foreground text-[10px] tracking-[0.2em] uppercase opacity-40">Budgy Coach</h1>
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.span
                                    key="thinking"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[8px] text-primary/60 font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                    Pensando...
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="ready"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-wider"
                                >
                                    Listo
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-9 px-4 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"
                    >
                        <Clock size={12} className="opacity-60" />
                        <span>{range === 'current_cycle' ? 'Ciclo' : range === 'last_30_days' ? '30 D' : 'Mes'}</span>
                        <ChevronDown size={12} className={cn("transition-transform opacity-20", isDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-44 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-30 backdrop-blur-3xl"
                            >
                                {[
                                    { id: 'current_cycle', label: 'Ciclo Actual' },
                                    { id: 'last_30_days', label: 'Últimos 30 Días' },
                                    { id: 'current_month', label: 'Mes Actual' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setRange(opt.id as AnalysisRange); setIsDropdownOpen(false); }}
                                        className={cn(
                                            "w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-colors border-b border-border/50 last:border-0",
                                            range === opt.id ? "text-primary" : "text-white/60"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-6 space-y-8 z-10 no-scrollbar pb-32">
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-20">
                        <BrainCircuit size={40} className="text-primary mb-3" />
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Estrategia Activa</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={cn(
                            "max-w-[85%] rounded-[1.5rem] px-5 py-4 relative",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-card text-foreground border border-border/50 rounded-tl-none shadow-sm"
                        )}>
                            <div className="prose prose-sm max-w-none text-inherit leading-relaxed text-[13px]">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <div className="mt-2 text-[8px] opacity-30 text-right uppercase font-medium tracking-tighter">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            {/* Zen Footer */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-20 pointer-events-none">
                <div className="max-w-xl mx-auto pointer-events-auto">
                    {/* Suggestions */}
                    {messages.length === 1 && !isFocused && !inputText && (
                        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar justify-center">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(action.text)}
                                    className="whitespace-nowrap bg-white/10 backdrop-blur-md text-white/80 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl border border-white/5 shadow-sm active:scale-95"
                                >
                                    {action.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className={cn(
                        "flex items-center gap-2 p-1.5 rounded-2xl border transition-all duration-300",
                        isFocused
                            ? "bg-background border-primary/30 shadow-lg shadow-primary/5"
                            : "bg-white/60 backdrop-blur-2xl border-white/20 shadow-xl"
                    )}>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Pregunta..."
                                className="w-full bg-transparent px-4 py-2.5 outline-none text-sm font-medium placeholder:text-muted-foreground/30"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                                className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                    isRecording ? "bg-destructive text-white" : "text-muted-foreground hover:bg-secondary"
                                )}
                            >
                                {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
                            </button>

                            <button
                                onClick={() => handleSend(inputText)}
                                disabled={(!inputText.trim() && !isRecording) || isLoading}
                                className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                    inputText.trim() || isLoading ? "bg-primary text-primary-foreground" : "opacity-10 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Links */}
                    <div className="mt-4 flex items-center justify-center gap-6 opacity-30">
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em]"
                        >
                            <Shield size={10} className={cn(privacyMode && "text-emerald-400 opacity-100")} />
                            {privacyMode ? "Blindado" : "Abierto"}
                        </button>
                        <button
                            onClick={handleClearChat}
                            className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em]"
                        >
                            <Trash2 size={10} />
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
