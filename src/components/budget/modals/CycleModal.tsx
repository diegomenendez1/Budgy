import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCycle: (endDate: Date, budget: number) => void;
    initialBudgetGuess: number;
}

const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onCreateCycle, initialBudgetGuess }) => {
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe pointer-events-auto shadow-2xl transform transition-transform animate-in m-0 sm:m-4 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Nuevo Ciclo</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="bg-gray-100 p-2 rounded-full text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-700 text-sm mb-6">
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
                                    className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedMonth === i ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}
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
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${selectedYear === y ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-bold">$</span>
                            <input
                                type="number"
                                value={initialBudgetInput}
                                onChange={(e) => setInitialBudgetInput(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-gray-50 rounded-2xl p-4 pl-8 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="0"
                                inputMode="decimal"
                            />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 ml-1">
                            Sugerido según tu Planificación (${initialBudgetGuess.toLocaleString()}). Puedes editarlo si tienes saldo anterior.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleCreateCycle}
                    className="w-full bg-ios-blue text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all text-lg"
                >
                    Confirmar e Iniciar
                </button>
            </div>
        </div>
    );
};

export default CycleModal;
