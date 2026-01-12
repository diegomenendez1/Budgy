import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Shield, Clock, ChevronDown, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { coachService, ChatMessage } from '../services/coachService';

import ReactMarkdown from 'react-markdown';

type AnalysisRange = 'current_cycle' | 'last_30_days' | 'current_month';

const QUICK_ACTIONS = [
    "Analiza mis gastos recientes",
    "¿Cómo puedo ahorrar más?",
    "¿En qué categoría gasto más?",
    "Proyecta mi fin de mes"
];

export const CoachPage: React.FC = () => {
    const { user } = useAuth();
    const { generateDataPacket } = useFinance();

    // State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<AnalysisRange>('current_cycle');
    const [privacyMode, setPrivacyMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Session & History
    // Initialize Session & History (Local Only)
    useEffect(() => {
        // Start with a fresh session ID each time the component mounts (Auto-clear on reload)
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy Budgy Coach. Puedo analizar tus finanzas y darte consejos personalizados. ¿En qué te ayudo hoy?',
            timestamp: new Date()
        }]);
    }, []); // Run once on mount

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);

    // Clear Chat
    const handleClearChat = () => {
        if (confirm('¿Quieres borrar el historial de esta conversación?')) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: '¡Listo! He olvidado lo anterior. ¿De qué quieres hablar ahora?',
                timestamp: new Date()
            }]);
            // Generate new session ID to clear context in the backend/LLM if applicable
            setSessionId(crypto.randomUUID());
        }
    };

    // Handlers
    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading || !user || !sessionId) return;

        setError(null);
        const context = generateDataPacket(range);

        // Privacy Mode: Mask descriptions
        if (privacyMode && context.significantExpenses) {
            context.significantExpenses = context.significantExpenses.map((e: any) => ({
                ...e,
                desc: 'HIDDEN_PRIVACY_MODE'
            }));
        }

        // 1. Optimistic Update (User Msg)
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
            // 2. Send to N8N (Service handles logic)
            const responseText = await coachService.sendMessage(user.id, sessionId, text, context, privacyMode);

            // 3. Add AI Response
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

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Bot size={48} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Inicia sesión</h2>
                <p className="text-gray-700 mt-2">Necesitas una cuenta para hablar con el Coach.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F2F2F7]"> {/* Adjusted height for TabBar */}

            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center border border-purple-200">
                        <Sparkles size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">Budgy Coach</h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-purple-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span className="text-xs text-gray-700 font-medium">{isLoading ? 'Pensando...' : error ? 'Error' : 'En línea'}</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={handleClearChat}
                        aria-label="Borrar historial de conversación"
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Limpiar conversación"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        aria-label={privacyMode ? "Desactivar modo privacidad" : "Activar modo privacidad"}
                        className={`p-2 rounded-full transition-colors ${privacyMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        title="Modo Privacidad"
                    >
                        <Shield size={18} />
                    </button>
                    <div className="relative group">
                        <button
                            aria-label={`Rango de análisis: ${range === 'current_cycle' ? 'Ciclo Actual' : range === 'last_30_days' ? '30 Días' : 'Este Mes'}`}
                            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <Clock size={14} />
                            <span>{range === 'current_cycle' ? 'Ciclo Actual' : range === 'last_30_days' ? '30 Días' : 'Este Mes'}</span>
                            <ChevronDown size={14} />
                        </button>
                        {/* Dropdown (Simple implementation) */}
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-20">
                            <button onClick={() => setRange('current_cycle')} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50">Ciclo Actual</button>
                            <button onClick={() => setRange('last_30_days')} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50">Últimos 30 Días</button>
                            <button onClick={() => setRange('current_month')} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50">Mes Calendario</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 p-2 text-center text-xs text-red-600 font-medium flex items-center justify-center gap-2">
                    <AlertTriangle size={12} />
                    {error}
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed whitespace-pre-line
                    ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100/50 opacity-70">
                                    <Bot size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Coach</span>
                                </div>
                            )}
                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1">
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 border border-gray-100 shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area logic */}
            <div className="p-4 bg-white border-t border-gray-200">
                {/* Quick Actions */}
                {messages.length === 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action}
                                onClick={() => handleSend(action)}
                                className="whitespace-nowrap bg-purple-50 text-purple-700 text-xs font-bold px-4 py-2 rounded-full border border-purple-100 hover:bg-purple-100 active:scale-95 transition-all"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
                        placeholder="Pregunta sobre tus finanzas..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-100 text-gray-900 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend(inputText)}
                        aria-label="Enviar mensaje"
                        disabled={!inputText.trim() || isLoading}
                        className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none hover:bg-purple-700 active:scale-90 transition-all"
                    >
                        {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                    </button>
                </div>

                {/* Footer info */}
                <p className="text-[10px] text-center text-gray-600 mt-2 flex items-center justify-center gap-1">
                    <Shield size={10} />
                    {privacyMode ? 'Modo Privado activado: Descripciones ocultas.' : 'Tus datos se envían de forma segura para el análisis.'}
                </p>
            </div>
        </div>
    );
};

export default CoachPage;
