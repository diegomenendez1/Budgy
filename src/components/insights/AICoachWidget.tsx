import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { analyzeFinances } from '../../services/aiService';
import { Card } from '../ui/Card';
import { Sparkles, RefreshCw, Lock, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CACHE_DURATION = 4 * 60 * 60 * 1000;
const CACHE_KEY = 'budgy_ai_coach_verdict';
const CACHE_TIME_KEY = 'budgy_ai_coach_timestamp';

export const AICoachWidget: React.FC = () => {
    const { transactions, recurringItems, totalDisposableIncome, apiKey } = useFinance();

    const [loading, setLoading] = useState(false);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);
        if (cached && timestamp) {
            const age = Date.now() - parseInt(timestamp, 10);
            if (age < CACHE_DURATION) {
                setVerdict(cached);
                setLastUpdated(new Date(parseInt(timestamp, 10)));
            }
        }
    }, []);

    const handleAnalyze = async (force = false) => {
        if (!apiKey) { setError("Falta API Key"); return; }
        if (!force && verdict) return;
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeFinances(transactions, recurringItems, totalDisposableIncome, apiKey);
            setVerdict(result);
            setLastUpdated(new Date());
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
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-200">
                        <Lock className="text-amber-700" size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800 mb-1">Estratega IA Bloqueado</h3>
                        <p className="text-xs text-amber-700 mb-3">
                            Configura tu API Key en Ajustes para activar el analisis financiero.
                        </p>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-medium rounded-lg text-[11px] border border-amber-300">
                            Requiere Configuracion
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                            <BrainCircuit className="text-blue-600" size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">CFO Virtual</h3>
                            <p className="text-[10px] text-blue-600 font-medium">Estrategia en Tiempo Real</p>
                        </div>
                    </div>
                    <button onClick={() => handleAnalyze(true)} disabled={loading}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {!verdict && !loading && (
                    <div className="text-center py-6">
                        <p className="text-slate-500 mb-3 text-sm">Tu estratega esta listo.</p>
                        <button onClick={() => handleAnalyze(true)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all active:scale-[0.97] flex items-center gap-2 mx-auto text-sm shadow-sm shadow-blue-600/20">
                            <Sparkles size={14} /> Generar Analisis
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 relative">
                            <div className="absolute inset-0 border-2 border-blue-200 rounded-full" />
                            <div className="absolute inset-0 border-2 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                        <p className="text-blue-500 text-xs font-medium">Procesando datos...</p>
                    </div>
                )}

                {verdict && !loading && (
                    <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown components={{
                            h2: ({ node, ...props }) => <h2 className="text-base font-semibold text-slate-900 mt-4 mb-2" {...props} />,
                            strong: ({ node, ...props }) => <span className="text-blue-600 font-semibold" {...props} />,
                            ul: ({ node, ...props }) => <ul className="space-y-1.5 my-3" {...props} />,
                            li: ({ node, ...props }) => <li className="text-slate-600 text-sm" {...props} />,
                            p: ({ node, ...props }) => <p className="text-slate-600 leading-relaxed mb-3 text-sm" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-blue-500 pl-3 py-1.5 bg-blue-50 rounded-r-lg my-4 text-slate-700 italic text-sm" {...props} />
                        }}>
                            {verdict}
                        </ReactMarkdown>
                        {lastUpdated && (
                            <p className="text-[10px] text-slate-400 mt-4 text-right tabular-nums">
                                Actualizado: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
