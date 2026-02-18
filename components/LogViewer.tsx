
import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry, LogLevel, LogCategory } from '../services/loggerService';
import { X, Trash2, Terminal, Eye, Shield, Cpu, Wifi, User, Info, AlertCircle, CheckCircle2, Bug, AlertTriangle, Layers, Filter } from 'lucide-react';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVELS: (LogLevel | 'all')[] = ['all', 'error', 'warn', 'success', 'info', 'debug'];
const CATEGORIES: (LogCategory | 'all')[] = ['all', 'auth', 'ai', 'ui', 'system', 'network', 'visual'];

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, [isOpen]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    const matchesLevel = levelFilter === 'all' || l.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesLevel && matchesCategory;
  });

  const getLogStyle = (log: LogEntry) => {
    if (log.category === 'visual') return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    
    switch (log.level) {
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warn': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'debug': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case 'visual': return <Eye className="w-3 h-3" />;
      case 'auth': return <User className="w-3 h-3" />;
      case 'system': return <Cpu className="w-3 h-3" />;
      case 'network': return <Wifi className="w-3 h-3" />;
      case 'ai': return <Terminal className="w-3 h-3" />;
      case 'ui': return <Layers className="w-3 h-3" />;
      default: return <Terminal className="w-3 h-3" />;
    }
  };

  const getLevelIcon = (level: LogLevel) => {
      switch (level) {
          case 'error': return <AlertCircle className="w-3 h-3" />;
          case 'warn': return <AlertTriangle className="w-3 h-3" />;
          case 'success': return <CheckCircle2 className="w-3 h-3" />;
          case 'debug': return <Bug className="w-3 h-3" />;
          default: return <Info className="w-3 h-3" />;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="pointer-events-auto w-full max-w-6xl h-[90vh] sm:h-[85vh] bg-slate-950 text-slate-300 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-slate-800 animate-in slide-in-from-bottom-10 duration-300 overflow-hidden ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 leading-none text-sm sm:text-base">System Diagnostics</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE
                </span>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-[10px] text-slate-400">{logs.length} events</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
             <button 
                onClick={() => {
                    setLevelFilter('all');
                    setCategoryFilter('all');
                }}
                className="text-[10px] text-slate-500 hover:text-blue-400 mr-2 underline decoration-dotted"
             >
                Reset Filters
             </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button 
              onClick={() => logger.clear()}
              className="p-2 hover:bg-red-900/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors group flex items-center gap-2"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Clear</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row border-b border-slate-800 bg-slate-900/50">
            {/* Level Filters */}
            <div className="flex-1 flex items-center overflow-x-auto px-4 py-2 gap-2 border-b sm:border-b-0 sm:border-r border-slate-800 scrollbar-none">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mr-2 shrink-0">
                    <Filter className="w-3 h-3" /> Level
                </div>
                {LEVELS.map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            levelFilter === lvl 
                            ? 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/50' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        {lvl !== 'all' && getLevelIcon(lvl)}
                        {lvl}
                    </button>
                ))}
            </div>

            {/* Category Filters */}
            <div className="flex-1 flex items-center overflow-x-auto px-4 py-2 gap-2 scrollbar-none">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mr-2 shrink-0">
                    <Layers className="w-3 h-3" /> Category
                </div>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            categoryFilter === cat 
                            ? 'bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/50' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        {cat !== 'all' && getCategoryIcon(cat)}
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-[#0B1120] relative">
          {filteredLogs.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                <Shield className="w-8 h-8 opacity-50" />
              </div>
              <p>No system events match your filters.</p>
              {(levelFilter !== 'all' || categoryFilter !== 'all') && (
                  <button 
                    onClick={() => { setLevelFilter('all'); setCategoryFilter('all'); }}
                    className="text-blue-400 hover:underline"
                  >
                    Clear Filters
                  </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`group flex items-start gap-3 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-800 hover:bg-slate-900/50 ${getLogStyle(log)}`}
              >
                {/* Timestamp */}
                <div className="flex flex-col items-end min-w-[64px] pt-0.5 opacity-40 group-hover:opacity-100 transition-opacity select-none">
                   <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>

                {/* Category Badge */}
                <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider min-w-[70px] justify-center select-none bg-black/20 shrink-0`}>
                  {getCategoryIcon(log.category)}
                  {log.category}
                </div>

                {/* Message & Data */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                     <span className="opacity-70 mt-0.5">{getLevelIcon(log.level)}</span>
                     <p className="font-medium leading-relaxed break-words text-sm">{log.message}</p>
                  </div>
                  
                  {log.data && (
                    <div className="mt-2 pl-6">
                       <details className="group/details">
                          <summary className="cursor-pointer list-none text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 select-none w-fit">
                             <span className="group-open/details:rotate-90 transition-transform">▶</span>
                             <span>Payload</span>
                             <span className="opacity-0 group-open/details:opacity-100 transition-opacity text-xs text-slate-600">JSON</span>
                          </summary>
                          <pre className="mt-2 text-[10px] text-slate-400 bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/5 font-mono leading-normal shadow-inner max-h-60">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                       </details>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} className="h-1" />
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
