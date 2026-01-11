import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { User, LogOut, Download, Trash2, AlertCircle } from 'lucide-react';
import { exportTransactionsToCSV } from '../services/exportService';

export const AuthScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const { resetData, transactions, wipeAllUserData } = useFinance();
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Success implies user state will update via Context
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Registro exitoso. ¡Bienvenido!' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ocurrió un error' });
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-neutral-900 text-white p-4 rounded-xl">
                <div className="w-full max-w-md bg-neutral-800 p-8 rounded-xl shadow-lg border border-neutral-700 text-center">
                    <div className="w-20 h-20 bg-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-teal-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-white">¡Hola!</h2>
                    <p className="text-neutral-400 mb-6">{user.email}</p>

                    <div className="bg-neutral-700/50 p-4 rounded-lg mb-4 text-left">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Estado de Sincronización</h3>
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Activa y funcionando
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <button
                            onClick={() => exportTransactionsToCSV(transactions)}
                            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Exportar mis datos (CSV)
                        </button>

                        {!showWipeConfirm ? (
                            <button
                                onClick={() => setShowWipeConfirm(true)}
                                className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500/80 text-sm font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Eliminar mi cuenta y datos
                            </button>
                        ) : (
                            <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 animate-in fade-in zoom-in duration-200">
                                <p className="text-xs text-red-200 mb-3 flex items-center gap-1.5 justify-center">
                                    <AlertCircle size={14} />
                                    Esta acción es permanente y no se puede deshacer.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowWipeConfirm(false)}
                                        className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await wipeAllUserData();
                                            signOut();
                                        }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        Sí, borrar todo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            resetData();
                            signOut();
                        }}
                        className="w-full bg-neutral-700/30 hover:bg-neutral-700/50 text-neutral-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
            <div className="w-full max-w-md bg-neutral-800 p-8 rounded-xl shadow-lg border border-neutral-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>

                {message && (
                    <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 focus:outline-none focus:border-teal-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 focus:outline-none focus:border-teal-500 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors"
                    >
                        {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-neutral-400 hover:text-white underline"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};
