import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { Key, Lock, Check } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { apiKey, setApiKey } = useFinance();
    const [tempKey, setTempKey] = useState(apiKey || '');
    const [saved, setSaved] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(tempKey);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10">

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full">
                        <Key size={24} className="text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuración</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Garantiza tu privacidad en local</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                            OpenAI API Key (GPT-5 Mini)
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Tu clave se guarda **solo en tu dispositivo**. No la compartimos con nadie.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${saved ? 'bg-green-500' : 'bg-black dark:bg-white dark:text-black'}`}
                    >
                        {saved ? <><Check size={20} /> Guardado</> : 'Guardar Configuración'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
