import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TabBar from './components/TabBar';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Planning from './pages/Planning';
import Insights from './pages/Insights';
import FloatingAddButton from './components/FloatingAddButton';
import { FinanceProvider } from './context/FinanceContext';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderPage = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentTab} />;
      case 'budget': return <Budget />;
      case 'planning': return <Planning />;
      case 'insights': return <Insights />;
      default: return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  // Mostrar el botón flotante solo en Inicio y Presupuesto
  const showFloatingButton = ['dashboard', 'budget'].includes(currentTab);

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans selection:bg-blue-200/50">
        <main className="max-w-md mx-auto min-h-screen relative overflow-hidden">
          {/* Content Wrapper with Safe Area logic */}
          <div className="pt-safe pb-safe-nav px-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
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
    </FinanceProvider>
  );
};

export default App;