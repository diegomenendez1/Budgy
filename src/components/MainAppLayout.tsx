import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TabBar from './TabBar';
import FloatingAddButton from './FloatingAddButton';
import TabHint from './TabHint';
import Dashboard from '../pages/Dashboard';
import Budget from '../pages/Budget';
import Planning from '../pages/Planning';
import Insights from '../pages/Insights';
import CoachPage from '../pages/Coach';
import { cn } from '../lib/utils';

const HINTS: Record<string, string> = {
    budget: "¡Configura tu primer ciclo aquí para empezar a trackear!",
    planning: "Diseña tu mes ideal: define tus ingresos y gastos fijos.",
    coach: "Tu AI Coach está listo para darte consejos personalizados.",
    insights: "Analiza tus hábitos una vez que tengas transacciones."
};

const MainAppLayout: React.FC = () => {
    const [currentTab, setCurrentTab] = useState('dashboard');
    const [showHint, setShowHint] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        // Check if hint for current tab was already seen
        const seenHints = JSON.parse(localStorage.getItem('seenHints') || '[]');
        if (HINTS[currentTab] && !seenHints.includes(currentTab)) {
            const timer = setTimeout(() => setShowHint(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setShowHint(false);
        }
    }, [currentTab]);

    const handleCloseHint = () => {
        const seenHints = JSON.parse(localStorage.getItem('seenHints') || '[]');
        localStorage.setItem('seenHints', JSON.stringify([...seenHints, currentTab]));
        setShowHint(false);
    };

    const renderPage = () => {
        switch (currentTab) {
            case 'dashboard': return <Dashboard onNavigate={setCurrentTab} />;
            case 'budget': return <Budget />;
            case 'planning': return <Planning />;
            case 'insights': return <Insights />;
            case 'coach': return <CoachPage />;
            default: return <Dashboard onNavigate={setCurrentTab} />;
        }
    };

    const showFloatingButton = ['dashboard', 'budget', 'planning', 'insights'].includes(currentTab);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 overflow-x-hidden">
            <main className={cn(
                "mx-auto w-full max-w-lg min-h-screen relative bg-background",
                "shadow-2xl shadow-primary/5"
            )}>
                <div className="pt-safe pb-safe-nav px-4 sm:px-6 min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} // Updated to match Apple human interface guidelines ease
                            className="h-full"
                        >
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <TabHint
                    tabId={currentTab}
                    message={HINTS[currentTab] || ""}
                    show={showHint}
                    onClose={handleCloseHint}
                />

                {showFloatingButton && <FloatingAddButton currentTab={currentTab} />}
                <TabBar currentTab={currentTab} setTab={setCurrentTab} />
            </main>
        </div>
    );
};

export default MainAppLayout;
