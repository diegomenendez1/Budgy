import React, { useState } from 'react';
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-background text-foreground p-4 rounded-xl">
                <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">Modo Local</h2>
                    <p className="text-muted-foreground mb-6 font-medium text-sm">Datos guardados en este dispositivo</p>

                    <div className="bg-secondary p-4 rounded-xl mb-4 text-left border border-border/50">
                        <div className="flex items-center gap-2 text-primary text-sm font-bold">
                            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
                            Offline Ready (DexieDB)
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <button
                            onClick={() => exportTransactionsToCSV(transactions)}
                            className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-border"
                        >
                            <Download size={18} />
                            Exportar mis datos (CSV)
                        </button>

                        {!showWipeConfirm ? (
                            <button
                                onClick={() => setShowWipeConfirm(true)}
                                className="w-full bg-destructive/5 hover:bg-destructive/10 text-destructive text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Borrar Datos Locales
                            </button>
                        ) : (
                            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 animate-in fade-in zoom-in duration-200">
                                <p className="text-xs text-destructive mb-3 flex items-center gap-1.5 justify-center font-bold">
                                    <AlertCircle size={14} />
                                    Se borrarán todos los datos de este navegador.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowWipeConfirm(false)}
                                        className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await wipeAllUserData();
                                            window.location.reload();
                                        }}
                                        className="flex-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg shadow-destructive/20"
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <p className="font-medium animate-pulse">Cargando modo local...</p>
        </div>
    );
};
