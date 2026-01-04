import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Assuming that if successful, we can send them to onboarding or login
            navigate('/onboarding');

        } catch (err: any) {
            let message = "No se pudo crear la cuenta.";
            if (err.message.includes("User already registered")) {
                message = "Este correo ya está registrado.";
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 pt-12 pb-6 flex flex-col">
            {/* Header */}
            <div className="mb-8">
                <Link to="/welcome" className="text-slate-400 text-sm mb-4 inline-block hover:text-slate-600 transition-colors">
                    ← Volver
                </Link>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-bold text-slate-900">Crear cuenta</h1>
                    <p className="text-slate-500 mt-2">Empieza a controlar tu dinero hoy.</p>
                </motion.div>
            </div>

            {/* Form */}
            <motion.form
                onSubmit={handleRegister}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Tu nombre"
                        />
                    </div>

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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
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
                        className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-500/30 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarme'}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Inicia Sesión</Link>
                        </p>
                    </div>
                </div>
            </motion.form>
        </div>
    );
};

export default Register;
