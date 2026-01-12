import { LayoutDashboard, Wallet, CalendarRange, Sparkles, Bot } from 'lucide-react';

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
    { id: 'insights', label: 'Insight', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 pb-safe pt-2 px-6 z-50 transition-colors duration-300">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center gap-1 w-16 py-2 transition-colors duration-200 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium" aria-hidden="true">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;