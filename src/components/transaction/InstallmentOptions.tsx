import React from 'react';
import { ArrowRight } from 'lucide-react';

interface InstallmentOptionsProps {
    isManualInstallment: boolean;
    setIsManualInstallment: (val: boolean) => void;
    manualInstallmentsCount: number;
    setManualInstallmentsCount: (val: number) => void;
    amount: string;
}

const InstallmentOptions: React.FC<InstallmentOptionsProps> = ({
    isManualInstallment,
    setIsManualInstallment,
    manualInstallmentsCount,
    setManualInstallmentsCount,
    amount
}) => {
    return (
        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800 mb-3">
            <div
                onClick={() => setIsManualInstallment(!isManualInstallment)}
                className="flex items-center justify-between cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isManualInstallment ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                        <ArrowRight size={18} className={isManualInstallment ? "rotate-45" : ""} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isManualInstallment ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-slate-300'}`}>Compra a Plazos (MSI)</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">Pagar en varias cuotas mensuales</p>
                    </div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${isManualInstallment ? 'bg-purple-600 justify-end' : 'bg-gray-300 dark:bg-slate-700 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
            </div>

            {/* Installment Details (Collapsible) */}
            {isManualInstallment && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 animate-in pl-11">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">¿A cuántos meses?</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="2" max="24" step="1"
                            value={manualInstallmentsCount}
                            onChange={(e) => setManualInstallmentsCount(parseInt(e.target.value))}
                            className="flex-1 accent-purple-600 h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-black text-purple-600 dark:text-purple-400 w-8 text-center">{manualInstallmentsCount}</span>
                    </div>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 font-medium text-right">
                        Pagarás <span className="font-bold">${amount ? (parseFloat(amount) / manualInstallmentsCount).toFixed(0) : '0'} / mes</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default InstallmentOptions;
