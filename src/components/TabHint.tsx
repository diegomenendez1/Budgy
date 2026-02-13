import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface TabHintProps {
    tabId: string;
    message: string;
    show: boolean;
    onClose: () => void;
}

const TabHint: React.FC<TabHintProps> = ({ tabId, message, show, onClose }) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-20 left-4 right-4 z-[60]"
                >
                    <div className="bg-primary/90 backdrop-blur-xl text-primary-foreground p-4 rounded-2xl shadow-2xl border border-primary/20 flex items-start gap-3">
                        <div className="bg-white/20 p-2 rounded-xl mt-0.5">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold leading-tight">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 opacity-60" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TabHint;
