import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TabBar from './TabBar';
import FloatingAddButton from './FloatingAddButton';
import Dashboard from '../pages/Dashboard';
import Budget from '../pages/Budget';
import Planning from '../pages/Planning';
import Insights from '../pages/Insights';
import CoachPage from '../pages/Coach';
import { cn } from '../lib/utils';

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
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 overflow-x-hidden">
            <main className={cn(
                "mx-auto w-full max-w-lg min-h-screen relative bg-background",
                "shadow-2xl shadow-black/5 dark:shadow-black/20"
            )}>
                <div className="pt-safe pb-safe-nav px-4 sm:px-6">
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

                {showFloatingButton && <FloatingAddButton />}
                <TabBar currentTab={currentTab} setTab={setCurrentTab} />
            </main>
        </div>
    );
};

export default MainAppLayout;
