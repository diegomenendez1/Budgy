import React from 'react';

type SyncChoice = 'UPLOAD' | 'DOWNLOAD' | 'MERGE';

interface SyncConflictModalProps {
    isOpen: boolean;
    onResolve: (choice: SyncChoice) => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({ isOpen, onResolve }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-800 rounded-xl p-6 max-w-lg w-full border border-neutral-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Conflictos de Sincronización</h3>
                <p className="text-neutral-300 mb-6">
                    Hemos detectado datos tanto en este dispositivo como en la nube. ¿Qué te gustaría hacer?
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => onResolve('UPLOAD')}
                        className="w-full p-4 bg-neutral-900 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-left transition-colors group"
                    >
                        <div className="font-semibold text-teal-400 group-hover:text-teal-300">⬆️ Subir mis datos locales</div>
                        <div className="text-sm text-neutral-400">Sobreescribe la nube con lo que tengo aquí.</div>
                    </button>

                    <button
                        onClick={() => onResolve('DOWNLOAD')}
                        className="w-full p-4 bg-neutral-900 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-left transition-colors group"
                    >
                        <div className="font-semibold text-blue-400 group-hover:text-blue-300">⬇️ Descargar de la nube</div>
                        <div className="text-sm text-neutral-400">Borra mis datos locales y usa los de la nube.</div>
                    </button>

                    <button
                        onClick={() => onResolve('MERGE')}
                        className="w-full p-4 bg-neutral-900 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-left transition-colors group"
                    >
                        <div className="font-semibold text-purple-400 group-hover:text-purple-300">🔀 Combinar ambos</div>
                        <div className="text-sm text-neutral-400">Intenta juntar todo (puede haber duplicados si no son idénticos).</div>
                    </button>
                </div>
            </div>
        </div>
    );
};
