import React, { useState } from 'react';
import { Scale, Shield, Sun, Moon, User, LogOut, Settings, Split, Briefcase, Menu, X } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: 'analyze' | 'pricing' | 'compare' | 'tools' | 'case-analysis';
  onTabChange: (tab: 'analyze' | 'pricing' | 'compare' | 'tools' | 'case-analysis') => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'analyze', label: 'Analyzer', icon: Scale },
    { id: 'case-analysis', label: 'Case Analysis', icon: Briefcase },
    { id: 'compare', label: 'Compare', icon: Split },
    { id: 'tools', label: 'Tools', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: Shield },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId as any);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleTabChange('analyze')}>
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 p-2 rounded-xl shadow-sm group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300 group-hover:scale-105">
              <Scale className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
              LegalLens<span className="text-blue-600 dark:text-blue-400">.ai</span>
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${currentTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:text-amber-500 dark:hover:text-yellow-300 active:scale-95 hover:shadow-sm"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Desktop Auth */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user ? (
                <button
                  onClick={onSettingsClick}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate ml-1">{user.name}</span>
                  <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors group-hover:rotate-45 duration-300" />
                </button>
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
                    className="px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 hover:scale-[1.02]"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute top-16 right-0 w-72 max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl mobile-menu-enter overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${currentTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Auth Section */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name}</span>
                  </div>
                  <button
                    onClick={() => { onSettingsClick(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button
                    onClick={() => { onLogoutClick(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl transition-all"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
