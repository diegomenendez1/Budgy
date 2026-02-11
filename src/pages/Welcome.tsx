import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, Wallet } from 'lucide-react';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pt-20">

                {/* Hero Visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="flex justify-center mb-12 relative"
                >
                    {/* Glass Card Visual */}
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-indigo-500/20 flex items-center justify-center transform rotate-12 relative z-20">
                        <Wallet className="w-16 h-16 md:w-20 md:h-20 text-indigo-400 drop-shadow-lg" />
                    </div>
                    {/* Decorative Elements */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute top-0 right-10 md:right-32 w-12 h-12 bg-purple-500/20 backdrop-blur-md rounded-2xl border border-white/10 -z-10 rotate-[-12deg]"
                    />
                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-0 left-10 md:left-32 w-16 h-16 bg-blue-500/20 backdrop-blur-md rounded-full border border-white/10 -z-10"
                    />
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="text-center space-y-6 max-w-md mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                        Toma el control <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
                            de tu dinero
                        </span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                        Gestiona tus finanzas con inteligencia. Simple, seguro y diseñado para crecer contigo.
                    </p>
                </motion.div>
            </div>

            {/* Actions Section */}
            <div className="relative z-10 px-6 pb-12 space-y-4 max-w-md mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col gap-4"
                >
                    <Button
                        onClick={() => navigate('/onboarding')}
                        variant="premium"
                        size="lg"
                        className="w-full text-lg h-14 rounded-2xl group shadow-indigo-500/25"
                    >
                        Empezar ahora
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                        onClick={() => navigate('/login')}
                        variant="ghost"
                        className="w-full text-gray-400 hover:text-white"
                    >
                        Ya tengo cuenta
                    </Button>
                </motion.div>

                <p className="text-center text-[10px] text-gray-600 mt-6">
                    Manejamos tus datos con encriptación de grado bancario.
                </p>
            </div>
        </div>
    );
};

export default Welcome;
