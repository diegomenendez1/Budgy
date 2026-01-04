import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[60%] bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pt-20">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6"
                >
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl flex items-center justify-center">
                            <span className="text-4xl">💸</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                        Toma el control <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            de tu dinero.
                        </span>
                    </h1>

                    <p className="text-slate-500 text-lg max-w-xs mx-auto leading-relaxed">
                        Gestiona tus finanzas sin estrés. Simple, potente y diseñado para ti.
                    </p>
                </motion.div>
            </div>

            {/* Actions Section */}
            <div className="relative z-10 px-8 pb-12 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="space-y-4"
                >
                    <Link
                        to="/register"
                        className="block w-full bg-slate-900 text-white text-center font-semibold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all transform active:scale-[0.98]"
                    >
                        Empezar ahora
                    </Link>

                    <Link
                        to="/login"
                        className="block w-full bg-white text-slate-700 text-center font-semibold py-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all transform active:scale-[0.98]"
                    >
                        Ya tengo cuenta
                    </Link>
                </motion.div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Al continuar, aceptas nuestros Términos y Política de Privacidad.
                </p>
            </div>
        </div>
    );
};

export default Welcome;
