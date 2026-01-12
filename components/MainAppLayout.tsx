import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TabBar from './TabBar';
import FloatingAddButton from './FloatingAddButton';
import Dashboard from '../pages/Dashboard';
import Budget from '../pages/Budget';
import Planning from '../pages/Planning';
import Insights from '../pages/Insights';
import CoachPage from '../pages/Coach';

const MainAppLayout: React.FC = () => {
    const [currentTab, setCurrentTab] = useState('dashboard');
    const shouldReduceMotion = useReducedMotion();

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

    const showFloatingButton = ['dashboard', 'budget', 'planning', 'insights', 'coach'].includes(currentTab);

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans selection:bg-blue-200/50 transition-colors duration-300">
            <main className="max-w-md mx-auto min-h-screen relative">
                <div className="pt-safe pb-safe-nav px-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {showFloatingButton && <FloatingAddButton />}
            <TabBar currentTab={currentTab} setTab={setCurrentTab} />
        </div>
    );
};

export default MainAppLayout;
