import React from 'react';
import { Scale, Shield, Sun, Moon, User, LogOut, Settings, Split } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: 'analyze' | 'pricing' | 'compare' | 'tools';
  onTabChange: (tab: 'analyze' | 'pricing' | 'compare' | 'tools') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  darkMode,
  toggleDarkMode,
  user,
  onLoginClick,
  onLogoutClick,
  onSettingsClick
}) => {
  const tabs = [
    { id: 'analyze', label: 'Analyzer', icon: Scale },
    { id: 'compare', label: 'Compare', icon: Split },
    { id: 'tools', label: 'Tools', icon: Settings }, // Using Settings icon for now, will find a better one
    { id: 'pricing', label: 'Pricing', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0B1120]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo - Enterprise Clean */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onTabChange('analyze')}>
          <div className="bg-slate-900 dark:bg-white p-2 rounded-lg shadow-sm group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors duration-300">
            <Scale className="w-5 h-5 text-white dark:text-slate-900" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            LegalLens<span className="text-blue-600 dark:text-blue-400">.ai</span>
          </span>
        </div>

        {/* Centered Navigation Tabs (Segmented Control) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${currentTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:text-amber-500 dark:hover:text-yellow-300 active:scale-95"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onSettingsClick}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate ml-1">{user.name}</span>
                  <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
