import React from 'react';
import { LayoutDashboard, Wallet, CalendarRange, Sparkles, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface TabBarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, setTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'budget', label: 'Presupuesto', icon: Wallet },
    { id: 'planning', label: 'Plan', icon: CalendarRange },
    { id: 'coach', label: 'Coach', icon: Bot },
    { id: 'insights', label: 'Insights', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Inner container to center the tab bar and apply constraints */}
      <div className="mx-auto max-w-lg pointer-events-auto">
        <div className={cn(
          "border-t border-border pb-safe pt-2 px-2 transition-all duration-300",
          "bg-background/90 backdrop-blur-xl"
        )}>
          <div className="flex justify-around items-center">
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
                    "group relative flex flex-col items-center justify-center w-16 h-[3.25rem]",
                    "active:scale-95 transition-transform duration-100 ease-in-out"
                  )}
                >
                  {/* Active Indicator Background (Optional subtle glow) */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -top-2 w-8 h-1 bg-primary rounded-full shadow-[0_2px_10px] shadow-primary/50"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <div className={cn(
                    "relative p-1 rounded-xl transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
                  </div>

                  <span className={cn(
                    "text-[10px] font-medium tracking-tight mt-0.5 transition-colors duration-300",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {tab.label}
                  </span>
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