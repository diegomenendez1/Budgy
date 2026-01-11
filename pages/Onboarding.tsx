import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createCycle, setSavingsGoal, setCurrency: saveCurrencyInContext } = useFinance(); // Assuming these exist from types
    const shouldReduceMotion = useReducedMotion();

    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState('USD');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Viajero';

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleFinish = async () => {
        setLoading(true);

        try {
            // 1. Save Currency First
            await saveCurrencyInContext(currency);

            // 2. Create the first cycle
            const now = new Date();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const initialAmount = parseFloat(budget) || 1000;

            await createCycle(endOfMonth, initialAmount);

            // 3. Redirect
            navigate('/dashboard');
        } catch (error) {
            console.error("Error finishing onboarding:", error);
            // Optionally handle error UI here
        } finally {
            setLoading(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: shouldReduceMotion ? 0 : (direction > 0 ? 50 : -50),
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: shouldReduceMotion ? 0 : (direction < 0 ? 50 : -50),
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Background blobs for premium feel */}
            <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[50%] bg-blue-100/50 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[150%] h-[50%] bg-indigo-100/50 rounded-full blur-3xl" />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative z-10 border border-white/50 min-h-[500px] flex flex-col">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={1}>
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex-1 flex flex-col"
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Hola, {userName} 👋</h2>
                            <p className="text-slate-500 mb-8">Hemos seleccionado <b>{currency}</b> por ti. Puedes cambiarlo ahora o más tarde en ajustes.</p>

                            <div className="grid grid-cols-2 gap-4">
                                {['USD', 'MXN', 'EUR', 'COP'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${currency === c ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <span className="block text-2xl mb-1">
                                            {c === 'USD' ? '🇺🇸' : c === 'MXN' ? '🇲🇽' : c === 'EUR' ? '🇪🇺' : '🇨🇴'}
                                        </span>
                                        <span className={`font-semibold ${currency === c ? 'text-blue-700' : 'text-slate-600'}`}>{c}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                                >
                                    Continuar
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex-1 flex flex-col"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Presupuesto Inicial</h2>
                            <p className="text-slate-500 mb-8">¿Con cuánto dinero libre cuentas para cerrar este mes?</p>

                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex items-center">
                                <span className="text-xl pl-4 text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="w-full p-4 text-3xl font-bold text-slate-900 outline-none bg-transparent placeholder:text-slate-200"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-3 ml-1">No te preocupes, puedes ajustarlo luego.</p>

                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleNext}
                                    disabled={!budget}
                                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex-1 flex flex-col text-center justify-center"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
                                    🚀
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Todo listo!</h2>
                            <p className="text-slate-500 mb-8">Tu espacio financiero ha sido creado con éxito.</p>

                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleFinish}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white font-semibold py-4 rounded-2xl hover:bg-green-700 transition-all active:scale-[0.98] shadow-lg shadow-green-500/30"
                                >
                                    {loading ? 'Creando espacio...' : 'Ir a mi Dashboard'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Onboarding;
