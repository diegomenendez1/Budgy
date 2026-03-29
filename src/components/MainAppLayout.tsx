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

    const showFloatingButton = ['dashboard', 'budget', 'planning', 'insights'].includes(currentTab);

    return (
        <div className="min-h-dvh bg-background font-sans overflow-x-hidden">
            <main className="mx-auto w-full max-w-lg min-h-dvh relative">
                <div className="pt-safe pb-28 px-5 min-h-dvh">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        >
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {showFloatingButton && <FloatingAddButton currentTab={currentTab} />}
                <TabBar currentTab={currentTab} setTab={setCurrentTab} />
            </main>
        </div>
    );
};

export default MainAppLayout;
