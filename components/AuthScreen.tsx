import React, { useState } from 'react';
// import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { User, LogOut, Download, Trash2, AlertCircle } from 'lucide-react';
import { exportTransactionsToCSV } from '../services/exportService';

export const AuthScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const { resetData, transactions, wipeAllUserData } = useFinance();
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);

    // In local mode, we are always "authorized" if the context says so.
    // If somehow user is null, we show a simple enter button or loading.

    if (user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-neutral-900 text-white p-4 rounded-xl">
                <div className="w-full max-w-md bg-neutral-800 p-8 rounded-xl shadow-lg border border-neutral-700 text-center">
                    <div className="w-20 h-20 bg-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-teal-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-white">Modo Local</h2>
                    <p className="text-neutral-400 mb-6 font-mono text-sm">Datos guardados en este dispositivo</p>

                    <div className="bg-neutral-700/50 p-4 rounded-lg mb-4 text-left">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Offline Ready (DexieDB)
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
                                Borrar Datos Locales
                            </button>
                        ) : (
                            <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 animate-in fade-in zoom-in duration-200">
                                <p className="text-xs text-red-200 mb-3 flex items-center gap-1.5 justify-center">
                                    <AlertCircle size={14} />
                                    Se borrarán todos los datos de este navegador.
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
                                            await wipeAllUserData(); // This needs to be updated in FinanceContext too!
                                            window.location.reload();
                                        }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        Sí, Borrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
            <p>Cargando modo local...</p>
        </div>
    );
};
