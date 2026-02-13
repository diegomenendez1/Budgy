import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { analyzeFinances } from '../../services/aiService';
import { Card } from '../ui/Card';
import { Sparkles, RefreshCw, AlertTriangle, Lock, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Cache duration in milliseconds (e.g., 4 hours)
const CACHE_DURATION = 4 * 60 * 60 * 1000;
const CACHE_KEY = 'budgy_ai_coach_verdict';
const CACHE_TIME_KEY = 'budgy_ai_coach_timestamp';

export const AICoachWidget: React.FC = () => {
    const { transactions, recurringItems, totalDisposableIncome, apiKey } = useFinance();

    const [loading, setLoading] = useState(false);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load from cache on mount
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);

        if (cached && timestamp) {
            const age = Date.now() - parseInt(timestamp, 10);
            if (age < CACHE_DURATION) {
                setVerdict(cached);
                setLastUpdated(new Date(parseInt(timestamp, 10)));
                return;
            }
        }
    }, []);

    const handleAnalyze = async (force = false) => {
        // Check API Key from context
        if (!apiKey) {
            setError("Falta API Key");
            return;
        }

        if (!force && verdict) return;

        setLoading(true);
        setError(null);

        try {
            const result = await analyzeFinances(transactions, recurringItems, totalDisposableIncome, apiKey);

            setVerdict(result);
            setLastUpdated(new Date());

            // Save to cache
            localStorage.setItem(CACHE_KEY, result);
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

        } catch (err) {
            setError("Error al contactar al estratega.");
        } finally {
            setLoading(false);
        }
    };

    if (error === "Falta API Key" || (!apiKey && !verdict && !loading)) {
        return (
            <Card className="p-6 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 p-3 rounded-xl">
                        <Lock className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-amber-500 mb-2">Estratega IA Bloqueado</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Para recibir análisis financiero de élite, necesitas configurar tu llave de acceso en Ajustes.
                        </p>
                        <div className="px-4 py-2 bg-amber-500/20 text-amber-500 font-bold rounded-lg text-xs inline-block">
                            Requiere Configuración
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-950/10 to-indigo-900/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                            <BrainCircuit className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white leading-none">CFO Virtual</h3>
                            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mt-1">Estrategia en Tiempo Real</p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleAnalyze(true)}
                        disabled={loading}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Forzar nuevo análisis"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {!verdict && !loading && (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4 text-sm">Tu estratega está listo para auditar tus finanzas.</p>
                        <button
                            onClick={() => handleAnalyze(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center gap-2 mx-auto"
                        >
                            <Sparkles size={18} />
                            Generar Análisis
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
                        <div className="w-16 h-16 relative">
                            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-indigo-300 font-medium text-sm animate-pulse">Procesando millones de datos...</p>
                    </div>
                )}

                {verdict && !loading && (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <ReactMarkdown
                                components={{
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-6 mb-3 flex items-center gap-2" {...props} />,
                                    strong: ({ node, ...props }) => <span className="text-indigo-300 font-black" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="space-y-2 my-4" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                                    // Use blockquote element to avoid 'cite' prop issue on div, but keep style
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-500/5 rounded-r-lg my-6 text-indigo-200 italic" {...props} />
                                }}
                            >
                                {verdict}
                            </ReactMarkdown>
                        </div>

                        {lastUpdated && (
                            <p className="text-[10px] text-gray-600 mt-6 text-right">
                                Actualizado: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
