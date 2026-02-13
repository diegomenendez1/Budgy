import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronRight, Check, DollarSign, Wallet } from 'lucide-react';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createCycle, setCurrency: saveCurrencyInContext } = useFinance();
    const shouldReduceMotion = useReducedMotion();

    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState('USD');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const userName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Viajero';

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

            console.log('Onboarding: Creating initial cycle...', { initialAmount, currency });
            await createCycle(endOfMonth, initialAmount);

            // 3. Redirect
            console.log('Onboarding: Success, navigating to dashboard');
            navigate('/dashboard');
        } catch (error) {
            console.error("Error finishing onboarding:", error);
            setErrorMsg("Hubo un problema al crear tu espacio. Intenta nuevamente.");
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
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
            {/* Background blobs for premium feel */}
            <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[150%] h-[50%] bg-purple-500/5 rounded-full blur-[100px]" />

            <div className="w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 relative z-10 min-h-[550px] flex flex-col">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-10 px-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted'}`} />
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
                            <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight uppercase italic">Hola, {userName} <span className="animate-wave inline-block">👋</span></h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed uppercase tracking-widest text-[10px] font-black">Selecciona tu moneda principal</p>

                            <div className="grid grid-cols-2 gap-4">
                                {['USD', 'MXN', 'EUR', 'COP'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`p-5 rounded-3xl border transition-all text-left relative overflow-hidden group ${currency === c ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' : 'bg-secondary border-border hover:bg-background'}`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className="relative z-10">
                                            <span className="block text-3xl mb-2 filter drop-shadow-lg">
                                                {c === 'USD' ? '🇺🇸' : c === 'MXN' ? '🇲🇽' : c === 'EUR' ? '🇪🇺' : '🇨🇴'}
                                            </span>
                                            <div className="flex justify-between items-center">
                                                <span className={`font-black tracking-widest ${currency === c ? 'text-primary' : 'text-muted-foreground'}`}>{c}</span>
                                                {currency === c && <div className="bg-primary rounded-full p-1"><Check size={12} className="text-white" strokeWidth={3} /></div>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-8">
                                <Button
                                    onClick={handleNext}
                                    className="w-full text-base py-6 shadow-xl shadow-primary/20 bg-primary text-white font-black uppercase tracking-widest rounded-2xl"
                                    icon={<ChevronRight />}
                                    iconPosition="right"
                                >
                                    Continuar
                                </Button>
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
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Presupuesto Inicial</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">¿Con cuánto dinero libre cuentas para cerrar este mes?</p>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="bg-secondary border border-border rounded-[2rem] p-6 focus-within:border-primary focus-within:bg-background transition-all flex items-center relative z-10 shadow-inner">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mr-4">
                                        <DollarSign className="text-primary" size={24} />
                                    </div>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="w-full text-4xl font-black text-foreground outline-none bg-transparent placeholder:text-muted-foreground/20 font-mono tracking-tighter"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 text-sm text-gray-500 bg-white/5 p-4 rounded-xl border border-white/5">
                                <Wallet size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                <p>Este será tu saldo inicial. Podrás ajustarlo o agregar ingresos más tarde.</p>
                            </div>

                            <div className="mt-auto pt-8">
                                <Button
                                    onClick={handleNext}
                                    disabled={!budget}
                                    className="w-full text-lg py-6 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none"
                                    icon={<ChevronRight />}
                                    iconPosition="right"
                                >
                                    Siguiente
                                </Button>
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
                            <div className="mb-8 flex justify-center relative">
                                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-[40px] animate-pulse" />
                                <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-5xl shadow-2xl relative z-10 animate-float">
                                    🚀
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight uppercase italic">¡Listo!</h2>
                            <p className="text-muted-foreground mb-10 text-xs leading-relaxed max-w-[280px] mx-auto uppercase tracking-[0.2em] font-black">Tu espacio financiero ha sido creado</p>

                            <div className="mt-auto pt-6 w-full">
                                <Button
                                    onClick={handleFinish}
                                    disabled={loading}
                                    className="w-full text-lg py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border-0 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                                >
                                    {loading ? 'Creando espacio...' : 'Ir a mi Dashboard'}
                                </Button>
                                {errorMsg && (
                                    <p className="mt-4 text-red-400 text-xs font-medium">{errorMsg}</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Onboarding;
