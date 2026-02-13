import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="bg-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-in transform scale-100 border border-border">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-destructive/10 p-5 rounded-full mb-6 text-destructive">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight italic leading-none">¿Eliminar?</h3>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.15em] mb-8 px-4 leading-relaxed">
                        Esta acción no se puede deshacer y afectará tus cálculos.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-secondary text-muted-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-4 bg-destructive text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-destructive/20 active:scale-95 transition-all"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
