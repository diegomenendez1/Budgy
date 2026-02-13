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
        <div className="bg-secondary p-3 rounded-xl border border-border mb-3">
            <div
                onClick={() => setIsManualInstallment(!isManualInstallment)}
                className="flex items-center justify-between cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isManualInstallment ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <ArrowRight size={18} className={isManualInstallment ? "rotate-45" : ""} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isManualInstallment ? 'text-foreground' : 'text-muted-foreground'}`}>Compra a Plazos (MSI)</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pagar en varias cuotas</p>
                    </div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${isManualInstallment ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
            </div>

            {/* Installment Details (Collapsible) */}
            {isManualInstallment && (
                <div className="mt-3 pt-3 border-t border-border animate-in pl-11">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Cuotas mensuales</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="2" max="24" step="1"
                            value={manualInstallmentsCount}
                            onChange={(e) => setManualInstallmentsCount(parseInt(e.target.value))}
                            className="flex-1 accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-black text-primary w-8 text-center">{manualInstallmentsCount}</span>
                    </div>
                    <p className="text-[10px] text-primary mt-2 font-black uppercase tracking-widest text-right">
                        Pagarás <span className="text-xs font-black">${amount ? (parseFloat(amount.replace(',', '.')) / manualInstallmentsCount).toFixed(0) : '0'} / MES</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default InstallmentOptions;
