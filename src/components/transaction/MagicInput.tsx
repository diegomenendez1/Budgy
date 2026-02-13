import React from 'react';
import { Sparkles, Loader2, Coffee, ShoppingCart, Tv, Utensils } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MagicInputProps {
    magicInput: string;
    setMagicInput: (val: string) => void;
    handleMagicAnalyze: () => void;
    isAnalyzing: boolean;
}

const SUGGESTIONS = [
    { label: 'Café', icon: <Coffee size={14} />, text: 'Café en Starbucks $80' },
    { label: 'Súper', icon: <ShoppingCart size={14} />, text: 'Supermercado semanal $1200' },
    { label: 'Ocio', icon: <Tv size={14} />, text: 'Suscripción Netflix $200' },
    { label: 'Cena', icon: <Utensils size={14} />, text: 'Cena con amigos $500' },
];

const MagicInput: React.FC<MagicInputProps> = ({
    magicInput,
    setMagicInput,
    handleMagicAnalyze,
    isAnalyzing
}) => {
    const handleAddSuggestion = (text: string) => {
        setMagicInput(text);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative group">
                <textarea
                    value={magicInput}
                    onChange={(e) => setMagicInput(e.target.value)}
                    placeholder="Ej: Compré zapatos en Zara por $2000 a 3 meses sin intereses..."
                    className="w-full p-6 bg-secondary/50 backdrop-blur-xl rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/30 text-lg font-medium resize-none h-40 text-foreground placeholder:text-muted-foreground/30 border border-white/5 transition-all shadow-inner"
                    autoFocus
                />
                <div className="absolute bottom-4 right-4 group-focus-within:scale-110 transition-transform">
                    <Sparkles size={18} className="text-primary/40 animate-pulse" />
                </div>
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2 px-1">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s.label}
                        onClick={() => handleAddSuggestion(s.text)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-95 shadow-sm",
                            magicInput === s.text && "border-primary/30 bg-primary/10 text-primary"
                        )}
                    >
                        {s.icon}
                        {s.label}
                    </button>
                ))}
            </div>

            <button
                onClick={handleMagicAnalyze}
                disabled={isAnalyzing || !magicInput.trim()}
                className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isAnalyzing ? 'Analizando...' : 'Procesar con IA'}
            </button>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                IA Detecta: plazos, categorías y montos.
            </p>
        </div>
    );
};

export default MagicInput;
