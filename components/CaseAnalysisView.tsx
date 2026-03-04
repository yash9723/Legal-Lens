import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, X, ChevronDown, Loader2,
    Users, Clock, Scale, BookOpen, Shield, Target,
    TrendingUp, AlertTriangle, CheckCircle, ArrowRight,
    Briefcase, Eye, RotateCcw,
    Image as ImageIcon, Siren, ClipboardList, Gavel,
    ScrollText, FileStack, RefreshCw,
    FileQuestion, XCircle, Crosshair, Lightbulb
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import {
    CaseAnalysisResult, CaseAnalyzeParams, CaseType,
    CaseParty, CaseTimelineEvent, LegalIssue, CasePrecedent,
    CaseArgument, CaseStrengthWeakness, CaseStrategy
} from '../types';
import { analyzeCase } from '../services/geminiService';
import { logger } from '../services/loggerService';
import { UserProfile } from '../types';

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface CaseAnalysisViewProps {
    user: UserProfile | null;
    onLoginClick: () => void;
}

// Using Lucide SVG icons instead of emojis (ui-ux-pro-max: no-emoji-icons)
const CASE_TYPES: { value: CaseType; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { value: 'FIR', label: 'FIR (First Information Report)', Icon: Siren },
    { value: 'Petition', label: 'Petition', Icon: ClipboardList },
    { value: 'Judgment', label: 'Judgment / Order', Icon: Gavel },
    { value: 'Affidavit', label: 'Affidavit', Icon: ScrollText },
    { value: 'Charge Sheet', label: 'Charge Sheet', Icon: FileStack },
    { value: 'Appeal', label: 'Appeal', Icon: RefreshCw },
    { value: 'Other', label: 'Other Legal Document', Icon: FileQuestion },
];

// Reduced motion preference hook (ui-ux-pro-max: reduced-motion)
const usePrefersReducedMotion = () => {
    const [prefersReduced, setPrefersReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReduced(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return prefersReduced;
};

const CaseAnalysisView: React.FC<CaseAnalysisViewProps> = ({ user, onLoginClick }) => {
    const [inputMode, setInputMode] = useState<'text' | 'pdf' | 'image'>('text');
    const [textInput, setTextInput] = useState('');
    const [caseType, setCaseType] = useState<CaseType>('Other');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<CaseAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const [uploadedContent, setUploadedContent] = useState<string | null>(null);
    const [uploadedMimeType, setUploadedMimeType] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    // Close dropdown on outside click (ux: click-outside)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on Escape key (ux: keyboard-nav)
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsDropdownOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);

        if (file.type === 'application/pdf') {
            setInputMode('pdf');
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                setTextInput(fullText.trim());
                setUploadedContent(null);
                logger.info('ai', `PDF extracted: ${pdf.numPages} pages`);
            } catch (err) {
                setError('Failed to extract text from PDF. Try pasting the text directly.');
                logger.error('ai', 'PDF extraction failed', err);
            }
        } else if (file.type.startsWith('image/')) {
            setInputMode('image');
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setUploadedContent(base64);
                setUploadedMimeType(file.type);
                setTextInput('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!user) {
            onLoginClick();
            return;
        }

        const contentToSend = inputMode === 'image' ? uploadedContent : textInput;
        if (!contentToSend || contentToSend.trim().length === 0) {
            setError('Please provide case content to analyze.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        logger.info('ai', 'Case analysis requested', { caseType, inputMode });

        try {
            const params: CaseAnalyzeParams = {
                type: inputMode === 'image' ? 'image' : 'text',
                content: contentToSend,
                mimeType: inputMode === 'image' ? uploadedMimeType : undefined,
                caseType,
                fileName: fileName || undefined,
            };

            const analysisResult = await analyzeCase(params);
            setResult(analysisResult);
            logger.success('ai', 'Case analysis complete');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError(err.response.data?.message || 'Usage limit reached. Please upgrade your plan.');
            } else {
                setError(err.message || 'An unexpected error occurred during case analysis.');
            }
            logger.error('ai', 'Case analysis failed', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setTextInput('');
        setUploadedContent(null);
        setFileName(null);
        setError(null);
        setInputMode('text');
        setActiveSection(null);
        logger.info('ai', 'User reset case analysis');
    };

    // Animation variants respecting prefers-reduced-motion
    const fadeInUp = prefersReducedMotion
        ? {}
        : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

    // Strength badge classes
    const getStrengthClasses = (strength: string) => {
        switch (strength) {
            case 'Strong': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
            case 'Moderate': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400';
            case 'Weak': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
            default: return 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300';
        }
    };

    // Impact badge classes
    const getImpactClasses = (impact: string, isStrength: boolean) => {
        if (impact === 'High') return isStrength ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
        if (impact === 'Medium') return 'text-amber-600 dark:text-amber-400';
        return 'text-slate-400 dark:text-slate-500';
    };

    // --- Section Card Component ---
    const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; gradient?: string; id?: string }> = ({ title, icon, children, className = '', gradient = 'from-blue-500/10 to-indigo-500/10', id }) => (
        <motion.section
            {...fadeInUp}
            id={id}
            aria-label={title}
            className={`rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-200 ${className}`}
        >
            <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r ${gradient} rounded-t-2xl`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm" aria-hidden="true">
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>
            </div>
            <div className="p-6">{children}</div>
        </motion.section>
    );

    // --- Content-shaped Skeleton Loader (react-ui-patterns: skeleton vs spinner) ---
    const AnalysisSkeleton = () => (
        <div className="max-w-6xl mx-auto space-y-6 mt-8" aria-busy="true" aria-label="Loading case analysis">
            {/* Summary skeleton */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse" />
                <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6 animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-4/6 animate-pulse" />
                </div>
            </div>
            {/* Parties skeleton */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-violet-500/10 to-purple-500/10 animate-pulse" />
                <div className="p-6 grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3 animate-pulse" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Timeline skeleton */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-amber-500/10 to-orange-500/10 animate-pulse" />
                <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse mt-1.5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/4 animate-pulse" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Side-by-side skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
                {[1, 2].map(i => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden">
                        <div className="h-14 bg-slate-100 dark:bg-slate-700/40 animate-pulse" />
                        <div className="p-6 space-y-3">
                            <div className="h-16 bg-slate-100 dark:bg-slate-700/40 rounded-xl animate-pulse" />
                            <div className="h-16 bg-slate-100 dark:bg-slate-700/40 rounded-xl animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- RENDER: Input View ---
    if (!result) {
        const selectedType = CASE_TYPES.find(c => c.value === caseType);
        const SelectedIcon = selectedType?.Icon || FileQuestion;

        return (
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 space-y-4 pt-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-2">
                        <Briefcase className="w-4 h-4" aria-hidden="true" />
                        For Advocates & Legal Officials
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Case Analysis
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Upload FIRs, petitions, judgments, or any case document for AI-powered deep analysis — parties, timeline, arguments, precedents & strategy.
                    </p>
                </div>

                {/* Case Type Selector */}
                <div className="mb-6 relative" ref={dropdownRef}>
                    <label id="case-type-label" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Document Type
                    </label>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="listbox"
                        aria-labelledby="case-type-label"
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                    >
                        <span className="flex items-center gap-3">
                            <SelectedIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-slate-800 dark:text-white font-medium">
                                {selectedType?.label}
                            </span>
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                role="listbox"
                                aria-labelledby="case-type-label"
                                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden"
                            >
                                {CASE_TYPES.map((ct) => {
                                    const TypeIcon = ct.Icon;
                                    return (
                                        <button
                                            key={ct.value}
                                            role="option"
                                            aria-selected={caseType === ct.value}
                                            onClick={() => { setCaseType(ct.value); setIsDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors duration-150 ${caseType === ct.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                                        >
                                            <TypeIcon className="w-5 h-5" aria-hidden="true" />
                                            <span className="font-medium">{ct.label}</span>
                                            {caseType === ct.value && <CheckCircle className="w-4 h-4 ml-auto text-indigo-600 dark:text-indigo-400" />}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Mode Tabs */}
                <div className="flex gap-2 mb-4" role="tablist" aria-label="Input method">
                    {[
                        { mode: 'text' as const, label: 'Paste Text', icon: FileText },
                        { mode: 'pdf' as const, label: 'Upload PDF', icon: Upload },
                        { mode: 'image' as const, label: 'Upload Image', icon: ImageIcon },
                    ].map(({ mode, label, icon: Icon }) => (
                        <button
                            key={mode}
                            role="tab"
                            aria-selected={inputMode === mode}
                            aria-label={label}
                            onClick={() => { setInputMode(mode); if (mode !== 'text') fileInputRef.current?.click(); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${inputMode === mode
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,image/*"
                    className="hidden"
                    aria-label="Upload case document file"
                />

                {/* Text Area / Upload Display */}
                <div className="mb-6" role="tabpanel">
                    {inputMode === 'image' && uploadedContent ? (
                        <div className="relative rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/5 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <img src={uploadedContent} alt={`Uploaded case document: ${fileName}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-white">{fileName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Image uploaded — ready for analysis</p>
                                </div>
                                <button
                                    onClick={() => { setUploadedContent(null); setFileName(null); setInputMode('text'); }}
                                    aria-label="Remove uploaded image"
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                >
                                    <X className="w-5 h-5 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {fileName && inputMode === 'pdf' && (
                                <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-sm text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                                    <FileText className="w-4 h-4" aria-hidden="true" />
                                    <span className="font-medium">{fileName}</span>
                                    <button
                                        onClick={() => { setFileName(null); setTextInput(''); setInputMode('text'); }}
                                        aria-label="Remove uploaded PDF"
                                        className="ml-auto p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Paste the full text of your case document here — FIR, petition, judgment, affidavit, charge sheet..."
                                rows={12}
                                aria-label="Case document text content"
                                className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
                                style={{ minHeight: '280px' }}
                            />
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                {textInput.length > 0 ? `${textInput.length.toLocaleString()} characters` : 'Supports plain text, extracted PDF text, or scanned document images'}
                            </p>
                        </>
                    )}
                </div>

                {/* Error State (react-ui-patterns: error feedback with retry) */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
                            role="alert"
                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3"
                        >
                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="flex-1">
                                <span className="font-bold block mb-1">Analysis Failed</span>
                                <span className="opacity-90 text-sm">{error}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={handleAnalyze}
                                    className="px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                    aria-label="Retry analysis"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                                    Retry
                                </button>
                                <button
                                    onClick={() => setError(null)}
                                    aria-label="Dismiss error"
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Analyze Button (react-ui-patterns: disable during operations, loading-buttons) */}
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (!textInput.trim() && !uploadedContent)}
                    aria-label={isAnalyzing ? 'Analyzing case document' : 'Analyze case'}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-[0.99]"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                            Analyzing Case Document...
                        </>
                    ) : (
                        <>
                            Analyze Case
                        </>
                    )}
                </button>

                {/* Loading State (react-ui-patterns: content-shaped skeletons, not generic spinners) */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={prefersReducedMotion ? {} : { opacity: 0 }}
                        >
                            <div className="mt-8 flex flex-col items-center gap-4 mb-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                                    <Scale className="w-6 h-6 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Analyzing your case document...</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">This may take a minute for large documents</p>
                                </div>
                            </div>
                            <AnalysisSkeleton />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- Helper: get icon for case type ---
    const resultType = CASE_TYPES.find(c => c.value === (result.caseType as CaseType));
    const ResultIcon = resultType?.Icon || FileQuestion;

    // --- RENDER: Results View ---
    return (
        <div className="max-w-6xl mx-auto space-y-6" role="main" aria-label="Case analysis results">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <ResultIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Case Analysis Report</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        {result.caseNumber && <span>Case No: <strong className="text-slate-800 dark:text-slate-200">{result.caseNumber}</strong></span>}
                        {result.courtName && <span className="hidden sm:inline">•</span>}
                        {result.courtName && <span>{result.courtName}</span>}
                        {result.filingDate && <span className="hidden sm:inline">•</span>}
                        {result.filingDate && <span>Filed: {result.filingDate}</span>}
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    aria-label="Analyze another case"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors duration-200 border border-indigo-200 dark:border-indigo-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98]"
                >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Analyze Another Case
                </button>
            </div>

            {/* Case Summary */}
            <SectionCard title="Case Summary" icon={<Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />} gradient="from-blue-500/10 to-cyan-500/10" id="summary">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line" style={{ maxWidth: '75ch' }}>
                    {result.caseSummary}
                </p>
            </SectionCard>

            {/* Parties Involved */}
            {result.parties && result.parties.length > 0 && (
                <SectionCard title="Parties Involved" icon={<Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />} gradient="from-violet-500/10 to-purple-500/10" id="parties">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {result.parties.map((party: CaseParty, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600/40 hover:border-violet-200 dark:hover:border-violet-700 transition-colors duration-150">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">
                                    {party.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-white truncate">{party.name}</p>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 mt-0.5">
                                        {party.role}
                                    </span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{party.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Timeline of Events */}
            {result.timeline && result.timeline.length > 0 && (
                <SectionCard title="Timeline of Events" icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />} gradient="from-amber-500/10 to-orange-500/10" id="timeline">
                    <div className="relative pl-8">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-400 via-orange-400 to-red-400 rounded-full" aria-hidden="true" />
                        <div className="space-y-5">
                            {result.timeline.map((event: CaseTimelineEvent, i: number) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-800 shadow-sm" aria-hidden="true" />
                                    <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-800/30 hover:border-amber-200 dark:hover:border-amber-700 transition-colors duration-150">
                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{event.date}</span>
                                        <p className="font-semibold text-slate-800 dark:text-white mt-1">{event.event}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.significance}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Legal Issues */}
            {result.legalIssues && result.legalIssues.length > 0 && (
                <SectionCard title="Legal Issues Identified" icon={<Scale className="w-5 h-5 text-red-600 dark:text-red-400" />} gradient="from-red-500/10 to-rose-500/10" id="legal-issues">
                    <div className="space-y-3">
                        {result.legalIssues.map((issue: LegalIssue, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600/40 hover:border-red-200 dark:hover:border-red-800 transition-colors duration-150">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-sm" aria-hidden="true">{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 dark:text-white">{issue.issue}</p>
                                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 mt-1">
                                            {issue.relevantLaw}
                                        </span>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{issue.analysis}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Arguments Assessment — Side by Side */}
            {((result.prosecutionArguments && result.prosecutionArguments.length > 0) ||
                (result.defenseArguments && result.defenseArguments.length > 0)) && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <SectionCard title="Prosecution / Petitioner" icon={<Crosshair className="w-5 h-5 text-blue-600 dark:text-blue-400" />} gradient="from-blue-500/10 to-sky-500/10" id="prosecution-args">
                            <div className="space-y-3">
                                {(result.prosecutionArguments || []).map((arg: CaseArgument, i: number) => (
                                    <div key={i} className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-800/30 hover:border-blue-200 dark:hover:border-blue-700 transition-colors duration-150">
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{arg.point}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${getStrengthClasses(arg.strength)}`}>
                                                {arg.strength}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{arg.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Defense / Respondent" icon={<Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" id="defense-args">
                            <div className="space-y-3">
                                {(result.defenseArguments || []).map((arg: CaseArgument, i: number) => (
                                    <div key={i} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors duration-150">
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{arg.point}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${getStrengthClasses(arg.strength)}`}>
                                                {arg.strength}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{arg.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                )}

            {/* Cited Precedents */}
            {result.citedPrecedents && result.citedPrecedents.length > 0 && (
                <SectionCard title="Cited Precedents & Case Laws" icon={<BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} gradient="from-indigo-500/10 to-violet-500/10" id="precedents">
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm" role="table">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th scope="col" className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Case Name</th>
                                    <th scope="col" className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Citation</th>
                                    <th scope="col" className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Relevance</th>
                                    <th scope="col" className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Favors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.citedPrecedents.map((p: CasePrecedent, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-white">{p.caseName}</td>
                                        <td className="py-3 px-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{p.citation}</td>
                                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{p.relevance}</td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.favorsSide.includes('Prosecution') || p.favorsSide.includes('Petitioner') ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : p.favorsSide.includes('Defense') || p.favorsSide.includes('Respondent') ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}>
                                                {p.favorsSide}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            )}

            {/* Strengths & Weaknesses */}
            {((result.prosecutionStrengths && result.prosecutionStrengths.length > 0) ||
                (result.defenseStrengths && result.defenseStrengths.length > 0) ||
                (result.prosecutionWeaknesses && result.prosecutionWeaknesses.length > 0) ||
                (result.defenseWeaknesses && result.defenseWeaknesses.length > 0)) && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <SectionCard title="Prosecution Analysis" icon={<TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />} gradient="from-blue-500/10 to-cyan-500/10" id="prosecution-sw">
                            <div className="space-y-2">
                                {(result.prosecutionStrengths || []).map((sw: CaseStrengthWeakness, i: number) => (
                                    <div key={`ps-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-800/30">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-label="Strength" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{sw.description}</p>
                                            <span className={`text-xs font-bold ${getImpactClasses(sw.impact, true)}`}>
                                                {sw.impact} Impact
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(result.prosecutionWeaknesses || []).map((sw: CaseStrengthWeakness, i: number) => (
                                    <div key={`pw-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-800/30">
                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-label="Weakness" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{sw.description}</p>
                                            <span className={`text-xs font-bold ${getImpactClasses(sw.impact, false)}`}>
                                                {sw.impact} Impact
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Defense Analysis" icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" id="defense-sw">
                            <div className="space-y-2">
                                {(result.defenseStrengths || []).map((sw: CaseStrengthWeakness, i: number) => (
                                    <div key={`ds-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-800/30">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-label="Strength" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{sw.description}</p>
                                            <span className={`text-xs font-bold ${getImpactClasses(sw.impact, true)}`}>
                                                {sw.impact} Impact
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(result.defenseWeaknesses || []).map((sw: CaseStrengthWeakness, i: number) => (
                                    <div key={`dw-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-800/30">
                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-label="Weakness" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{sw.description}</p>
                                            <span className={`text-xs font-bold ${getImpactClasses(sw.impact, false)}`}>
                                                {sw.impact} Impact
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                )}

            {/* Recommended Strategy */}
            {result.recommendedStrategy && result.recommendedStrategy.length > 0 && (
                <SectionCard title="Recommended Strategy" icon={<Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />} gradient="from-purple-500/10 to-fuchsia-500/10" id="strategy">
                    <div className="space-y-3">
                        {result.recommendedStrategy.map((strat: CaseStrategy, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50/50 to-fuchsia-50/50 dark:from-purple-500/5 dark:to-fuchsia-500/5 border border-purple-100 dark:border-purple-800/30 hover:border-purple-200 dark:hover:border-purple-700 transition-colors duration-150">
                                <div className="flex-shrink-0">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${strat.priority === 'Immediate' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : strat.priority === 'Short-term' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'}`}>
                                        <Target className="w-3 h-3" aria-hidden="true" />
                                        {strat.priority}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-white">{strat.action}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{strat.details}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" aria-hidden="true" />
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Case Outcome Prediction */}
            {result.outcomePrediction && (
                <SectionCard title="Case Outcome Prediction" icon={<TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />} gradient="from-cyan-500/10 to-blue-500/10" id="prediction">
                    <div className="flex flex-col items-center text-center p-4">
                        {/* Confidence Gauge */}
                        <div className="relative w-40 h-20 mb-4" role="meter" aria-valuenow={result.outcomePrediction.confidence} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${result.outcomePrediction.confidence}%`}>
                            <svg viewBox="0 0 200 100" className="w-full h-full" aria-hidden="true">
                                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-slate-700" strokeLinecap="round" />
                                <path
                                    d="M 20 90 A 80 80 0 0 1 180 90"
                                    fill="none"
                                    stroke="url(#gauge-gradient)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(result.outcomePrediction.confidence / 100) * 251} 251`}
                                />
                                <defs>
                                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                                <text x="100" y="85" textAnchor="middle" className="fill-slate-800 dark:fill-white" style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {result.outcomePrediction.confidence}%
                                </text>
                            </svg>
                        </div>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${result.outcomePrediction.likelihood === 'Favorable' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : result.outcomePrediction.likelihood === 'Unfavorable' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                            {result.outcomePrediction.likelihood}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                            {result.outcomePrediction.reasoning}
                        </p>
                    </div>
                </SectionCard>
            )}

            {/* Disclaimer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pb-4 pt-2 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                <span>This AI-generated analysis is for informational purposes only and does not constitute legal advice. Always consult a qualified advocate.</span>
            </div>
        </div>
    );
};

export default CaseAnalysisView;
