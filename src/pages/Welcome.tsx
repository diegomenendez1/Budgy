import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, Wallet } from 'lucide-react';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden selection:bg-[#0052FF]/20">
            {/* Background Decorative Shapes */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-[#0052FF]/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-[#4D7CFF]/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-[#0052FF]/[0.06] rounded-full blur-[100px] pointer-events-none animate-pulse" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pt-20">

                {/* Hero Visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex justify-center mb-12 relative"
                >
                    {/* Glass Card Visual */}
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white backdrop-blur-2xl rounded-3xl border border-slate-200/60 shadow-xl shadow-[#0052FF]/10 flex items-center justify-center transform rotate-12 relative z-20">
                        <Wallet className="w-16 h-16 md:w-20 md:h-20 text-[#0052FF] drop-shadow-md" />
                    </div>
                    {/* Decorative Elements */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute top-0 right-10 md:right-32 w-12 h-12 bg-[#4D7CFF]/10 backdrop-blur-md rounded-2xl border border-slate-200/50 -z-10 rotate-[-12deg]"
                    />
                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-0 left-10 md:left-32 w-16 h-16 bg-emerald-500/10 backdrop-blur-md rounded-full border border-slate-200/50 -z-10"
                    />
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    className="text-center space-y-6 max-w-md mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-slate-900">
                        Toma el control <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-[#4D7CFF]">
                            de tu libertad
                        </span>
                    </h1>

                    <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium">
                        Gestiona tus finanzas con calma. Simple, local y diseñado para tu bienestar.
                    </p>
                </motion.div>
            </div>

            {/* Actions Section */}
            <div className="relative z-10 px-6 pb-12 space-y-4 max-w-md mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col gap-4"
                >
                    <Button
                        onClick={() => navigate('/register')}
                        variant="default"
                        size="lg"
                        className="w-full text-lg h-14 rounded-2xl group font-black uppercase tracking-widest glow-blue"
                    >
                        Empezar ahora
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                        onClick={() => navigate('/login')}
                        variant="ghost"
                        className="w-full text-slate-500 hover:text-slate-900"
                    >
                        Ya tengo cuenta
                    </Button>
                </motion.div>

                <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
                    Manejamos tus datos con encriptación de grado bancario local.
                </p>
            </div>
        </div>
    );
};

export default Welcome;
