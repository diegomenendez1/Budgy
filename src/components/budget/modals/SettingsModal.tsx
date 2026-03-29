import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../../context/FinanceContext';
import { Key, Lock, Check } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { apiKey, setApiKey, currency, setCurrency } = useFinance();
    const [tempKey, setTempKey] = useState(apiKey || '');
    const [saved, setSaved] = useState(false);


    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(tempKey);
        // Currency is saved immediately via context but we show the feedback
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    return createPortal(
        <div className="fixed inset-0 bg-background/80 z-[100] flex items-center justify-center backdrop-blur-md p-4 animate-in">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 border border-border">

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-secondary p-3 rounded-full">
                        <Key size={24} className="text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-widest italic leading-none">Configuración</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Garantiza tu privacidad local</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            OpenAI API Key (GPT-5 Mini)
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Tu clave se guarda **solo en tu dispositivo**. No la compartimos con nadie.
                        </p>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">
                            Moneda Principal
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {['USD', 'MXN', 'EUR', 'COP'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`py-3 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all border tap-transparent ${currency === c ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary border-transparent text-muted-foreground hover:bg-muted'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>


                    <button
                        onClick={handleSave}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-foreground text-background shadow-lg shadow-foreground/10 hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {saved ? <><Check size={20} /> Guardado</> : 'Guardar Configuración'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:bg-secondary rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;
