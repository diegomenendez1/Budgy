import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface MagicInputProps {
    magicInput: string;
    setMagicInput: (val: string) => void;
    handleMagicAnalyze: () => void;
    isAnalyzing: boolean;
}

const MagicInput: React.FC<MagicInputProps> = ({
    magicInput,
    setMagicInput,
    handleMagicAnalyze,
    isAnalyzing
}) => {
    return (
        <div className="space-y-4 animate-in">
            <div className="relative">
                <textarea
                    value={magicInput}
                    onChange={(e) => setMagicInput(e.target.value)}
                    placeholder="Ej: Compré zapatos en Zara por $2000 a 3 meses sin intereses..."
                    className="w-full p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg font-medium resize-none h-32 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-800"
                    autoFocus
                />
                <div className="absolute bottom-3 right-3">
                    <Sparkles size={16} className="text-indigo-300" />
                </div>
            </div>
            <button
                onClick={handleMagicAnalyze}
                disabled={isAnalyzing || !magicInput.trim()}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isAnalyzing ? 'Analizando...' : 'Procesar con IA'}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-slate-500">
                Detecta automáticamente plazos (MSI), categorías y montos.
            </p>
        </div>
    );
};

export default MagicInput;
