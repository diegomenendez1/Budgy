import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';


interface CycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCycle: (endDate: Date, budget: number) => void;
    initialBudgetGuess: number;
    currency?: string;
}


const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onCreateCycle, initialBudgetGuess, currency = 'USD' }) => {

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [initialBudgetInput, setInitialBudgetInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initialValue = initialBudgetGuess > 0 ? initialBudgetGuess.toString() : '';
            setInitialBudgetInput(initialValue);
        }
    }, [isOpen, initialBudgetGuess]);

    const handleCreateCycle = () => {
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);

        if (endDate < new Date()) {
            alert("La fecha de fin no puede ser anterior a hoy.");
            return;
        }

        let budgetAmount = parseFloat(initialBudgetInput);
        if (initialBudgetInput.trim() === '') {
            budgetAmount = 0;
        }

        if (isNaN(budgetAmount)) {
            alert("Por favor ingresa un monto válido.");
            return;
        }

        onCreateCycle(endDate, budgetAmount);
        onClose();
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const years = [new Date().getFullYear(), new Date().getFullYear() + 1];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="bg-card w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-safe pointer-events-auto shadow-2xl transform transition-transform animate-in m-0 sm:m-4 relative z-10 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic leading-none">Nuevo Ciclo</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="bg-secondary p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-8 leading-relaxed">
                    El ciclo comenzará hoy. Configura cuándo termina y tu presupuesto inicial.
                </p>

                <div className="space-y-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Mes de Cierre</label>
                        <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMonth(i)}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === i ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
                                >
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Año</label>
                        <div className="flex gap-2">
                            {years.map(y => (
                                <button
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === y ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Initial Budget Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Presupuesto Inicial</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-black">{currency === 'EUR' ? '€' : '$'}</span>

                            <input
                                type="number"
                                value={initialBudgetInput}
                                onChange={(e) => setInitialBudgetInput(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-secondary border border-border rounded-2xl p-5 pl-10 text-xl font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-muted-foreground/10"
                                placeholder="0"
                                inputMode="decimal"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-3 ml-1 font-medium leading-relaxed italic">
                            Sugerencia según Planificación ({formatCurrency(initialBudgetGuess, currency)}).
                        </p>

                    </div>
                </div>

                <button
                    onClick={handleCreateCycle}
                    className="w-full bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                    Confirmar e Iniciar
                </button>
            </div>
        </div>
    );
};

export default CycleModal;
