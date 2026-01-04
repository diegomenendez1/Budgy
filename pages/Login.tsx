import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Success handled by AuthContext listener in App.tsx which should redirect
            // But we can also force it:
            navigate('/dashboard');

        } catch (err: any) {
            console.error("Login try failed:", err);
            let message = "Ocurrió un error al iniciar sesión: " + (err.message || "");
            if (err.message && err.message.includes("Invalid login credentials")) {
                message = "El correo o la contraseña no son correctos.";
            } else if (err.message && err.message.includes("Email not confirmed")) {
                message = "Tu correo no ha sido confirmado aún.";
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 pt-12 pb-6 flex flex-col">
            {/* Header */}
            <div className="mb-10">
                <Link to="/welcome" className="text-slate-400 text-sm mb-4 inline-block hover:text-slate-600 transition-colors">
                    ← Volver
                </Link>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-bold text-slate-900">Bienvenido de nuevo</h1>
                    <p className="text-slate-500 mt-2">Ingresa para ver tus finanzas.</p>
                </motion.div>
            </div>

            {/* Form */}
            <motion.form
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1"
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="hola@ejemplo.com"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                            <button type="button" className="text-xs text-blue-600 font-medium">¿Olvidaste tu contraseña?</button>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
                    >
                        {loading ? 'Entrando...' : 'Iniciar Sesión'}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            ¿No tienes cuenta? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Regístrate</Link>
                        </p>
                    </div>
                </div>
            </motion.form>
        </div>
    );
};

export default Login;
