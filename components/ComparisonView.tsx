import React, { useState } from 'react';
import * as Diff from 'diff';
import { Split, X, ArrowLeftRight, FileText, ArrowRight } from 'lucide-react';

const ComparisonView: React.FC = () => {
    const [original, setOriginal] = useState('');
    const [revised, setRevised] = useState('');
    const [diffResult, setDiffResult] = useState<Diff.Change[] | null>(null);

    const handleCompare = () => {
        if (!original || !revised) return;
        const diff = Diff.diffWords(original, revised);
        setDiffResult(diff);
    };

    const handleClear = () => {
        setOriginal('');
        setRevised('');
        setDiffResult(null);
    };

    const isEmpty = !original && !revised && !diffResult;

    return (
        <div className="flex flex-col space-y-8 page-enter">

            <div className="text-center space-y-3">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Clause Comparator</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Compare original and revised text side-by-side to detect hidden changes.</p>
            </div>

            {/* Empty State Guide */}
            {isEmpty && (
                <div className="flex flex-col items-center py-8 space-y-6 animate-fade-up">
                    <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Paste original</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Paste revised</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl text-blue-600 dark:text-blue-400">
                            <Split className="w-4 h-4" />
                            <span className="font-semibold">Compare</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original */}
                <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                        Original Version
                    </label>
                    <textarea
                        className="flex-1 min-h-[300px] w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus-glow outline-none resize-none transition-all shadow-sm backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="Paste the original legal text here..."
                        value={original}
                        onChange={(e) => setOriginal(e.target.value)}
                    />
                </div>

                {/* Revised */}
                <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                        Revised Version
                    </label>
                    <textarea
                        className="flex-1 min-h-[300px] w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus-glow outline-none resize-none transition-all shadow-sm backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="Paste the modified text here..."
                        value={revised}
                        onChange={(e) => setRevised(e.target.value)}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-8">
                <button
                    onClick={handleClear}
                    className="px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Clear All
                </button>
                <button
                    onClick={handleCompare}
                    disabled={!original || !revised}
                    className="btn-gradient px-8 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span><Split className="w-4 h-4" /></span>
                    <span>Compare Versions</span>
                </button>
            </div>

            {/* Results Section */}
            {diffResult && (
                <div className="page-enter pt-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Analysis Result</h3>
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm text-sm leading-7 text-slate-700 dark:text-slate-300 font-serif backdrop-blur-sm">
                        {diffResult.map((part, index) => {
                            const color = part.added
                                ? 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 px-1 py-0.5 rounded mx-0.5 font-medium border-b-2 border-emerald-300 dark:border-emerald-700'
                                : part.removed
                                    ? 'bg-red-100/80 text-red-900 line-through decoration-red-500 dark:bg-red-900/40 dark:text-red-300 px-1 py-0.5 rounded mx-0.5 opacity-70'
                                    : '';

                            return (
                                <span key={index} className={color}>
                                    {part.value}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex gap-6 mt-6 justify-end text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/40 dark:border-red-800"></span>
                            Removed
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800"></span>
                            Added
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
