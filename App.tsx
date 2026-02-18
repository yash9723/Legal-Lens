
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import AnalysisView from './components/AnalysisView';
import PricingView from './components/PricingView';
import ComparisonView from './components/ComparisonView';
import LoginModal from './components/LoginModal';
import LogViewer from './components/LogViewer';
import SettingsModal from './components/SettingsModal';
import ToolsView from './components/ToolsView';
import { analyzeContract } from './services/geminiService';
import { logger } from './services/loggerService';
import { StorageService } from './services/storageService';
import { AnalysisResult, UserProfile, AnalyzeParams, SavedAnalysis } from './types';
import { AlertCircle, Bug, X, Sparkles } from 'lucide-react';
import { AuthService } from './services/authService';
import WelcomePage from './components/WelcomePage';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'analyze' | 'pricing' | 'compare' | 'tools'>('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the last analyze params for the Chat Widget
  const [lastAnalyzeParams, setLastAnalyzeParams] = useState<AnalyzeParams | null>(null);

  // Image Source State for Visual Insights
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  // Auth & UI state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset token in URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/reset-password/')[1];
      if (token) {
        setResetToken(token);
        setIsLoginModalOpen(true);
        // Clean URL without refresh (optional, but good for UX)
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  // Dark mode state with persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // --- SYSTEM MONITORING & GLOBAL LOGGING ---
  useEffect(() => {
    // 1. Log System Information on Startup
    logger.info('system', 'LegalLens AI Application Initialized', {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine,
      darkMode: darkMode
    });

    // 2. Network Status Monitoring
    const handleOnline = () => logger.success('network', 'Network connection restored');
    const handleOffline = () => logger.warn('network', 'Network connection lost - Offline mode');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Global Error Handling (Catch-all)
    const handleGlobalError = (event: ErrorEvent) => {
      logger.error('system', `Uncaught Exception: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('system', 'Unhandled Promise Rejection', {
        reason: event.reason
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 4. Local Auth Check (Replaces Firebase)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        logger.debug('auth', 'Restored session from local storage', { uid: parsedUser.id });
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []); // Run once on mount

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    logger.info('ui', `User toggled dark mode to ${!darkMode ? 'Dark' : 'Light'}`);
    setDarkMode(!darkMode);
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    // Basic local update since backend profile update isn't fully robust yet
    if (!user) return;
    try {
      await AuthService.updateUserProfile(user, {
        displayName: updated.name,
        photoURL: updated.avatarUrl
      });
      // State update handled by onAuthStateChanged, but immediate local feedback is nice
      setUser(prev => prev ? ({ ...prev, ...updated }) : null);
    } catch (e) {
      // Error logged in service
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsSettingsOpen(false);
  };

  const handleAnalyze = async (params: AnalyzeParams) => {
    if (!user) {
      logger.info('ui', 'Anonymous user attempted analysis - prompting login');
      setIsLoginModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setLastAnalyzeParams(params); // Save for chat
    logger.info('ui', 'Analysis requested by user', { type: params.type });

    // Set the image source if it's an image analysis
    if (params.type === 'image' && params.content && params.mimeType) {
      setCurrentImageSrc(`data:${params.mimeType};base64,${params.content}`);
    } else {
      setCurrentImageSrc(null);
    }

    try {
      const result = await analyzeContract(params);
      setAnalysisResult(result);

      // Save to history
      const userId = user?.id || null;
      StorageService.saveAnalysis(
        result,
        params.type,
        params.fileName || 'Contract Analysis',
        userId
      );

      // Update mock stats (In real app, update Firestore)
      if (user) {
        setUser({ ...user, documentsAnalyzed: user.documentsAnalyzed + 1 });
      }

      logger.success('ui', 'Analysis displayed to user');

      // Log detection of visual insights
      if (result.visualInsights && result.visualInsights.length > 0) {
        logger.visual(`Detected ${result.visualInsights.length} visual insights`, {
          insights: result.visualInsights.map(i => ({
            type: i.type,
            description: i.description,
            boundingBox: i.boundingBox
          }))
        });
      }

    } catch (err: any) {
      console.error(err);

      // Handle Usage Limit (403)
      if (err.response?.status === 403) {
        logger.info('ui', 'User hit usage limit', { plan: user?.plan });
        alert(err.response.data?.message || "Usage limit reached. Please upgrade your plan.");
        setCurrentTab('pricing');
        return;
      }

      setError(err.message || "An unexpected error occurred.");
      // The service already logs the error, but we log the UI state update here
      logger.debug('ui', 'Displayed error message to user', { error: err.message });
      setCurrentImageSrc(null); // Clear image on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadAnalysis = (saved: SavedAnalysis) => {
    logger.info('ui', 'Loading analysis from history', { id: saved.id });
    setAnalysisResult(saved.result);
    // Note: We don't have the original full image content/base64 stored in the history object
    // to save space, so we clear the current image. 
    // In a real app, you would fetch the image from cloud storage here.
    setCurrentImageSrc(null);

    // Set dummy params for Chat Widget context
    setLastAnalyzeParams({
      type: saved.type,
      content: "Loaded from history", // Chat might be limited without full context re-upload
      fileName: saved.fileName
    });

    setIsSettingsOpen(false);
    setCurrentTab('analyze');
  };

  const handleReset = () => {
    logger.info('ui', 'User clicked "Analyze Another Document"');
    setAnalysisResult(null);
    setCurrentImageSrc(null);
    setError(null);
    setLastAnalyzeParams(null);
  };

  // Keyboard shortcut to open logs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        logger.debug('ui', 'Log viewer opened via shortcut (Ctrl+L)');
        setIsLogViewerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlanUpgrade = async (plan: string) => {
    try {
      const updatedUser = await AuthService.upgradePlan(plan);
      setUser(updatedUser);
      logger.info('ui', 'Plan upgrade reflected in app state', { plan });
    } catch (e) {
      throw e;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-500 ease-in-out ${darkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>



      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onTabChange={(tab) => {
            logger.info('ui', `Navigation: Tab changed to ${tab}`);
            setCurrentTab(tab);
          }}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          user={user}
          onLoginClick={() => {
            logger.info('ui', 'User clicked Login button');
            setIsLoginModalOpen(true);
          }}
          onLogoutClick={handleLogout}
          onSettingsClick={() => {
            logger.info('ui', 'User clicked Settings button');
            setIsSettingsOpen(true);
          }}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={(userData) => {
            setUser(userData);
            setIsLoginModalOpen(false);
            setResetToken(null);
            logger.info('auth', 'User logged in via modal');
          }}
          resetToken={resetToken}
        />

        {user && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            onUpdateUser={handleUpdateProfile}
            onLogout={handleLogout}
            onLoadAnalysis={handleLoadAnalysis}
            onNavigateToPricing={() => {
              setCurrentTab('pricing');
              setIsSettingsOpen(false);
            }}
          />
        )}

        <LogViewer
          isOpen={isLogViewerOpen}
          onClose={() => setIsLogViewerOpen(false)}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col pb-12">

          <div className="flex-1">
            {currentTab === 'pricing' && (
              <PricingView
                user={user}
                onUpgrade={handlePlanUpgrade}
              />
            )}

            {currentTab === 'compare' && (
              <div className="max-w-6xl mx-auto">
                <ComparisonView />
              </div>
            )}

            {currentTab === 'tools' && (
              <div className="max-w-6xl mx-auto">
                <ToolsView
                  user={user}
                  onLoginClick={() => setIsLoginModalOpen(true)}
                />
              </div>
            )}


            {currentTab === 'analyze' && (
              <>
                {currentTab === 'analyze' && (
                  <>
                    {showWelcome ? (
                      <WelcomePage onStart={() => setShowWelcome(false)} />
                    ) : (
                      <>
                        {/* Header for Analysis View (Hidden when result is shown to avoid duplication) */}
                        {!analysisResult && (
                          <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                              Upload Contract
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                              Upload a PDF, Image, or paste text. We'll handle the rest.
                            </p>
                          </div>
                        )}

                        {error && (
                          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm backdrop-blur-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold block mb-1">Analysis Failed</span>
                              <span className="opacity-90">{error}</span>
                            </div>
                            <button
                              onClick={() => {
                                logger.info('ui', 'User dismissed error message');
                                setError(null);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {!analysisResult ? (
                          <>
                            <InputArea onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                            <div className="mt-12 text-center">
                              <button
                                onClick={() => setShowWelcome(true)}
                                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-4"
                              >
                                &larr; Back to Home
                              </button>
                            </div>
                          </>
                        ) : (
                          <AnalysisView
                            data={analysisResult}
                            onReset={handleReset}
                            imageUrl={currentImageSrc}
                            analyzeParams={lastAnalyzeParams!}
                            userPlan={user?.plan}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Persistent Footer with Logs Access */}
          <div className="py-8 mt-12 flex justify-center border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => {
                logger.debug('ui', 'Log viewer opened via footer button');
                setIsLogViewerOpen(true);
              }}
              className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
              <Bug className="w-3 h-3" />
              System Diagnostics
            </button>
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
