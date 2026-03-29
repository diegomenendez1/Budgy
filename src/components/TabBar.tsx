import React from 'react';
import { LayoutDashboard, Wallet, CalendarRange, Sparkles, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface TabBarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'planning', label: 'Plan', icon: CalendarRange },
  { id: 'coach', label: 'Coach', icon: Bot },
  { id: 'insights', label: 'Insights', icon: Sparkles },
];

const TabBar: React.FC<TabBarProps> = ({ currentTab, setTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <div className="mx-2 mb-1.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-black/[0.06]"
             style={{ paddingBottom: 'var(--sab, 0px)' }}>
          <div className="flex justify-around items-center py-1.5 px-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-2 rounded-xl tap-transparent",
                    "active:scale-90 transition-all duration-150 ease-out",
                    isActive && "bg-[#0052FF]/[0.06]"
                  )}
                >
                  <div className={cn(
                    "relative transition-colors duration-200",
                    isActive ? "text-[#0052FF]" : "text-slate-400"
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                  </div>

                  <span className={cn(
                    "text-[11px] font-medium mt-0.5 transition-colors duration-200 leading-tight",
                    isActive ? "text-[#0052FF] font-semibold" : "text-slate-400"
                  )}>
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-0.5 w-5 h-[3px] rounded-full bg-gradient-to-r from-[#0052FF] to-[#4D7CFF]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TabBar;
