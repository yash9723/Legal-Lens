import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2, FileText, Scale, AlertTriangle, Upload, Search, FileUp, MousePointerClick, Lock } from 'lucide-react';

interface WelcomePageProps {
    onStart: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
    const [activeScanLine, setActiveScanLine] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveScanLine((prev) => (prev + 1) % 4);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center relative overflow-hidden transition-colors duration-500">

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>

            {/* Ambient Glow Orbs */}
            <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob pointer-events-none"></div>
            <div className="absolute bottom-40 right-[5%] w-80 h-80 bg-violet-500/5 dark:bg-violet-500/8 rounded-full blur-3xl animate-blob [animation-delay:3s] pointer-events-none"></div>

            {/* --- HERO SECTION --- */}
            <div className="w-full max-w-7xl mx-auto px-6 relative z-10 pt-20 pb-20 lg:pb-32">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Column: Copy */}
                    <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-full backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Legal Intelligence v2.0</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-discovery font-extrabold tracking-tight leading-[1.1]">
                            <span className="text-slate-900 dark:text-white">Contracts,</span> <br />
                            <span className="shimmer-text">Clarified.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                            Instantly analyze agreements for risks, hidden clauses, and Indian legal compliance. No jargon, just answers.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                            <button
                                onClick={onStart}
                                className="group btn-gradient px-8 py-4 text-lg font-semibold rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Start Analysis</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                            <div className="text-sm text-slate-500 font-medium px-4 flex items-center gap-2">
                                Free for 1st document • No signup required
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Hero Card */}
                    <div className="flex-1 w-full max-w-lg relative animate-fade-up [animation-delay:200ms]">
                        <div className="relative aspect-[4/5] md:aspect-square group animate-float">

                            {/* Main Card Container */}
                            <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]">

                                {/* Interactive Scan Beam */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm animate-[scan_3s_ease-in-out_infinite] z-20 pointer-events-none"></div>

                                {/* Card Header */}
                                <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center px-6 justify-between bg-slate-50/80 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-mono text-slate-500">commercial_lease_v1.pdf</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="flex-1 p-8 space-y-6 relative font-mono text-[10px] sm:text-xs">

                                    {/* Clause 1 - Safe */}
                                    <div className="space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default">
                                        <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full mb-3"></div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full"></div>
                                        <div className="h-1.5 w-5/6 bg-slate-100 dark:bg-slate-700/50 rounded-full"></div>
                                        <div className="h-1.5 w-4/5 bg-slate-100 dark:bg-slate-700/50 rounded-full"></div>
                                    </div>

                                    {/* Clause 2 - RISK */}
                                    <div className="relative group/risk cursor-help">
                                        <div className="absolute -inset-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg opacity-0 group-hover/risk:opacity-100 transition-opacity duration-300 border border-amber-100 dark:border-amber-800/30"></div>
                                        <div className="relative space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-2 w-1/4 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover/risk:opacity-100 transition-opacity duration-300">
                                                    Warning
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-600 rounded-full group-hover/risk:bg-amber-200 dark:group-hover/risk:bg-amber-800/50 transition-colors"></div>
                                            <div className="h-1.5 w-11/12 bg-slate-200 dark:bg-slate-600 rounded-full group-hover/risk:bg-amber-200 dark:group-hover/risk:bg-amber-800/50 transition-colors"></div>

                                            {/* Tooltip */}
                                            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-30 opacity-0 group-hover/risk:opacity-100 translate-y-2 group-hover/risk:translate-y-0 transition-all duration-300 pointer-events-none">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Jurisdiction Risk</p>
                                                        <p className="text-slate-500 dark:text-slate-400 leading-tight">Governing law is "New York". This may be unenforceable in India.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clause 3 - Good */}
                                    <div className="relative group/good cursor-help pt-2">
                                        <div className="absolute -inset-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg opacity-0 group-hover/good:opacity-100 transition-opacity duration-300 border border-emerald-100 dark:border-emerald-800/30"></div>
                                        <div className="relative space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-2 w-1/3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover/good:opacity-100 transition-opacity duration-300">
                                                    Verified
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-600 rounded-full group-hover/good:bg-emerald-200 dark:group-hover/good:bg-emerald-900/50 transition-colors"></div>
                                            <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-600 rounded-full group-hover/good:bg-emerald-200 dark:group-hover/good:bg-emerald-900/50 transition-colors"></div>

                                            {/* Tooltip */}
                                            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-30 opacity-0 group-hover/good:opacity-100 translate-y-2 group-hover/good:translate-y-0 transition-all duration-300 pointer-events-none">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Stamp Duty</p>
                                                        <p className="text-slate-500 dark:text-slate-400 leading-tight">Calculated at ~0.25%.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Bar */}
                                    <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-[9px]">AI Analysis Active</span>
                                        </div>
                                        <span className="text-slate-400 font-mono">84%</span>
                                    </div>

                                </div>
                            </div>

                            {/* Decorative Element */}
                            <div className="absolute -top-6 -right-6 w-3/4 h-3/4 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] -z-10 bg-gradient-to-br from-slate-50 to-transparent dark:from-slate-800/30 dark:to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- HOW IT WORKS SECTION --- */}
            <div className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-100 dark:border-slate-800/50 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Three Steps to Clarity</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Our process is simple, secure, and incredibly fast.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative stagger-children">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent z-0"></div>

                        <StepItem
                            icon={<FileUp className="w-6 h-6 text-blue-500" />}
                            step="01"
                            title="Upload Document"
                            desc="Drag & drop your PDF, Word doc, or image. We also support plain text."
                        />
                        <StepItem
                            icon={<Zap className="w-6 h-6 text-amber-500" />}
                            step="02"
                            title="AI Analysis"
                            desc="Our model scans 50+ pages in seconds, identifying risks and extracting terms."
                        />
                        <StepItem
                            icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
                            step="03"
                            title="Secure Result"
                            desc="Get a summary, risk report, and actionable advice instantly."
                        />
                    </div>
                </div>
            </div>

            {/* --- TRUST BANNER --- */}
            <div className="w-full py-12 border-b border-slate-100 dark:border-slate-800/50">
                <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="font-medium">End-to-End Encrypted</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="font-medium">No Data Stored</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">India Legal Stack</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">50+ Pages in Seconds</span>
                    </div>
                </div>
            </div>

            {/* --- USE CASES GRID --- */}
            <div className="w-full py-24 max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Who is LegalLens for?</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">Designed for modern professionals who need legal protection without the hourly rate.</p>
                    </div>
                    <button onClick={onStart} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 group">
                        Try it yourself <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
                    <UseCaseCard
                        title="Freelancers"
                        desc="Review consulting agreements and NDAs before you sign."
                        badge="Popular"
                    />
                    <UseCaseCard
                        title="Startups"
                        desc="Check vendor contracts and employment letters quickly."
                        badge="Essential"
                    />
                    <UseCaseCard
                        title="Tenants"
                        desc="Verify rent agreements for hidden clauses and stamp duty."
                    />
                    <UseCaseCard
                        title="Students"
                        desc="Understand internship offers and bond agreements."
                    />
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="w-full py-12 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/80 dark:bg-[#0B1120]/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 rounded-sm"></div>
                        <span className="font-semibold text-slate-900 dark:text-white">LegalLens AI</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200">Contact</a>
                    </div>
                    <div className="flex gap-4">
                        <span>© 2026 LegalLens Inc.</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

const StepItem = ({ icon, step, title, desc }: { icon: React.ReactNode, step: string, title: string, desc: string }) => (
    <div className="relative z-10 flex flex-col items-center text-center space-y-4 hover-lift cursor-default">
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-center mb-2 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
            {icon}
        </div>
        <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step}</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
        </div>
    </div>
);

const UseCaseCard = ({ title, desc, badge }: { title: string, desc: string, badge?: string }) => (
    <div className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl hover:border-blue-400/50 dark:hover:border-blue-500/30 transition-all duration-300 group hover-lift cursor-default backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
            {badge && (
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                    {badge}
                </span>
            )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default WelcomePage;
