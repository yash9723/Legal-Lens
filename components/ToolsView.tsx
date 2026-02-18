import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    ChevronDown,
    Check,
    FileText,
    FileCode,
    ImageIcon,
    Download,
    Trash2,
    Upload,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FilePlus,
    FileType,
    Shield,
    Calendar,
    ClipboardCheck,
    BookOpen,
    PenTool,
    Calculator,
    ArrowRightLeft
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { logger } from '../services/loggerService';
import api from '../services/api';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const TOOLS = [
    { id: 'pdf-to-text', label: 'PDF to Text', icon: FileText, desc: 'Extract text from PDFs' },
    { id: 'text-to-pdf', label: 'Text to PDF', icon: FileCode, desc: 'Convert text to PDF' },
    { id: 'image-to-pdf', label: 'Image to PDF', icon: ImageIcon, desc: 'Images to PDF' },
    { id: 'clause-gen', label: 'Clause Generator', icon: FileType, desc: 'Draft legal clauses' },
    { id: 'pii-redactor', label: 'PII Redactor', icon: Shield, desc: 'Redact sensitive info' },
    { id: 'summarizer', label: 'Legal Summarizer', icon: Sparkles, desc: 'AI Contract Summary' },
    { id: 'checklist', label: 'Execution Checklist', icon: ClipboardCheck, desc: 'Signing steps' },
    { id: 'deadlines', label: 'Deadline Extractor', icon: Calendar, desc: 'Find key dates' },
    { id: 'dictionary', label: 'Legal Dictionary', icon: BookOpen, desc: 'Simplify jargon' },
    { id: 'date-calc', label: 'Date Calculator', icon: Calculator, desc: 'Add/sub days' },
    { id: 'signature', label: 'Signature Creator', icon: PenTool, desc: 'Draw & sign' },
    { id: 'converter', label: 'Unit Converter', icon: ArrowRightLeft, desc: 'Currency & Area' },
];

const ToolsView: React.FC<{ user: any; onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    const [activeTool, setActiveTool] = useState(TOOLS[0].id);
    const [isOpen, setIsOpen] = useState(false);

    const currentTool = TOOLS.find(t => t.id === activeTool) || TOOLS[0];
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Document Tools</h2>
                <p className="text-slate-500 dark:text-slate-400">Utility tools to simplify your document workflow.</p>
            </div>

            {/* Custom Tool Dropdown */}
            <div className="flex justify-center mb-8 relative z-50">
                <div className="w-full max-w-md relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-left shadow-lg hover:border-blue-500 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <currentTool.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">{currentTool.label}</span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">{currentTool.desc}</span>
                            </div>
                        </div>
                        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto no-scrollbar"
                            >
                                <div className="p-2 space-y-1">
                                    {TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => { setActiveTool(tool.id); setIsOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                                activeTool === tool.id
                                                    ? "bg-blue-50 dark:bg-blue-900/20"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                activeTool === tool.id ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                                            )}>
                                                <tool.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className={cn(
                                                    "block text-sm font-bold",
                                                    activeTool === tool.id ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"
                                                )}>
                                                    {tool.label}
                                                </span>
                                                <span className="block text-xs text-slate-500 dark:text-slate-400">{tool.desc}</span>
                                            </div>
                                            {activeTool === tool.id && (
                                                <Check className="w-4 h-4 text-blue-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
                {activeTool === 'pdf-to-text' && <PdfToTextConverter />}
                {activeTool === 'text-to-pdf' && <TextToPdfConverter />}
                {activeTool === 'image-to-pdf' && <ImageToPdfConverter />}
                {activeTool === 'clause-gen' && <ClauseGenerator />}
                {activeTool === 'pii-redactor' && <PiiRedactor />}
                {activeTool === 'summarizer' && <LegalSummarizer user={user} onLoginClick={onLoginClick} />}
                {activeTool === 'checklist' && <ExecutionChecklist user={user} onLoginClick={onLoginClick} />}
                {activeTool === 'deadlines' && <DeadlineExtractor user={user} onLoginClick={onLoginClick} />}
                {activeTool === 'dictionary' && <LegalDictionary user={user} onLoginClick={onLoginClick} />}
                {activeTool === 'date-calc' && <DateCalculator />}
                {activeTool === 'signature' && <SignatureCreator />}
                {activeTool === 'converter' && <UnitConverter />}
            </div>
        </div >
    );
};

const ToolTab = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${active
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        {label}
    </button>
);

// --- CONVERTER COMPONENTS ---

const PdfToTextConverter = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map((item: any) => item.str);
                fullText += strings.join(' ') + '\n\n';
            }
            setExtractedText(fullText);
            logger.info('tools', 'Successfully extracted text from PDF', { fileName: file.name });
        } catch (err) {
            console.error(err);
            setError('Failed to extract text from PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(extractedText);
        alert('Text copied to clipboard!');
    };

    const handleDownload = () => {
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.pdf', '.txt');
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        PDF to Plain Text
                    </h3>
                    <p className="text-sm text-slate-500">Extract readable text for use in legal drafts or analysis.</p>
                </div>
                {(extractedText || isProcessing) && (
                    <button
                        onClick={() => { setExtractedText(''); setFileName(''); }}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            {!extractedText && !isProcessing ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all p-12"
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500 mb-4">
                        <Upload className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">Click to upload a PDF</p>
                    <p className="text-xs text-slate-500 mt-2">Document text is extracted directly in your browser.</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </div>
            ) : isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">Extracting text...</p>
                    <p className="text-sm text-slate-500">Scanning pages and reconstructing layout.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                        >
                            Copy to Clipboard
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Download className="w-4 h-4" /> Download .txt
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={extractedText}
                        className="flex-1 w-full p-6 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none resize-none"
                    />
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
        </div>
    );
};

const TextToPdfConverter = () => {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('Legal document');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePdf = () => {
        if (!text.trim()) return;
        setIsGenerating(true);

        try {
            const doc = new jsPDF();

            // Page styling
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxLineWidth = pageWidth - (margin * 2);

            // Title
            doc.setFontSize(18);
            doc.text(title || 'Legal Document', margin, 20);

            // Content
            doc.setFontSize(11);
            const lines = doc.splitTextToSize(text, maxLineWidth);
            doc.text(lines, margin, 35);

            doc.save(`${(title || 'document').replace(/\s+/g, '_')}.pdf`);
            logger.info('tools', 'Successfully generated PDF from text');
        } catch (err) {
            console.error(err);
            alert('Failed to generate PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-500" />
                    Text to PDF
                </h3>
                <p className="text-sm text-slate-500">Paste legal text to generate a formatted PDF document.</p>
            </div>

            <div className="space-y-4 flex-1 flex flex-col font-sans">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., NDA Agreement"
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Content</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your legal text here..."
                        className="flex-1 w-full p-6 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[300px]"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleGeneratePdf}
                        disabled={!text.trim() || isGenerating}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-500" />}
                        Generate PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageToPdfConverter = () => {
    const [images, setImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImages(prev => [...prev, event.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGeneratePdf = () => {
        if (images.length === 0) return;
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            images.forEach((img, index) => {
                if (index > 0) doc.addPage();

                const imgProps = doc.getImageProperties(img);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            });
            doc.save('scanned_document.pdf');
            logger.info('tools', 'Successfully generated PDF from images', { count: images.length });
        } catch (err) {
            console.error(err);
            alert('Failed to generate PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    Image to PDF
                </h3>
                <p className="text-sm text-slate-500">Combine contract photos into a single PDF document.</p>
            </div>

            <div className="flex-1 flex flex-col">
                {images.length === 0 ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all p-12"
                    >
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-500 mb-4">
                            <FilePlus className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">Upload contract images</p>
                        <p className="text-xs text-slate-500 mt-2">JPG, PNG supported. We will preserve resolution.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 aspect-[3/4]">
                                    <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => removeImage(idx)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                        Page {idx + 1}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors aspect-[3/4]"
                            >
                                <FilePlus className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Add Page</span>
                            </button>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                            <button
                                onClick={() => setImages([])}
                                className="px-6 py-2.5 text-slate-500 font-bold hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download PDF ({images.length} Pages)
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
        </div>
    );
};

const ClauseGenerator = () => {
    const [selectedType, setSelectedType] = useState('NDA');
    const [generatedClause, setGeneratedClause] = useState('');

    const CLAUSE_TEMPLATES: { [key: string]: string } = {
        'NDA': 'Confidentiality: The Receiving Party agrees to keep all "Confidential Information" strictly secret. This includes any data marked as private or which should reasonably be understood to be private. This obligation lasts for 3 years after the agreement ends.',
        'Termination': 'Termination for Convenience: Either party may terminate this Agreement by providing at least thirty (30) days prior written notice to the other party. All outstanding payments for services rendered shall become due immediately upon termination.',
        'Indemnity': 'Indemnification: Provider shall indemnify and hold Client harmless from any third-party claims arising from Provider\'s gross negligence or willful misconduct in the performance of Services under this Agreement.',
        'Governing Law': 'Governing Law: This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra.'
    };

    const generate = () => {
        setGeneratedClause(CLAUSE_TEMPLATES[selectedType]);
        logger.info('tools', 'Generated clause template', { type: selectedType });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <FileType className="w-5 h-5 text-indigo-500" />
                    Legal Clause Generator
                </h3>
                <p className="text-sm text-slate-500">Quick templates for common legal provisions.</p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {Object.keys(CLAUSE_TEMPLATES).map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${selectedType === type
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400'
                                : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="flex-1 min-h-[300px] mt-6 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                    <textarea
                        className="w-full h-full bg-transparent outline-none text-slate-700 dark:text-slate-300 resize-none font-serif leading-relaxed"
                        value={generatedClause}
                        onChange={(e) => setGeneratedClause(e.target.value)}
                        placeholder="Selected clause template will appear here..."
                    />
                    {!generatedClause && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <button onClick={generate} className="pointer-events-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Generate {selectedType} Template
                            </button>
                        </div>
                    )}
                </div>

                {generatedClause && (
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => { navigator.clipboard.writeText(generatedClause); alert('Copied!'); }}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                        >
                            Copy Clause
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PiiRedactor = () => {
    const [text, setText] = useState('');
    const [redactedText, setRedactedText] = useState('');
    const [isRedacting, setIsRedacting] = useState(false);

    const redact = () => {
        setIsRedacting(true);
        // Mimic processing time
        setTimeout(() => {
            let result = text;
            // Simple regex-based redaction
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

            result = result.replace(emailRegex, '[EMAIL REDACTED]');
            result = result.replace(phoneRegex, '[PHONE REDACTED]');

            setRedactedText(result);
            setIsRedacting(false);
            logger.info('tools', 'Redacted PII from text');
        }, 800);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    PII Redactor
                </h3>
                <p className="text-sm text-slate-500">Quickly hide sensitive information from legal drafts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-2">Original Text</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="flex-1 w-full p-4 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                        placeholder="Paste contract text with contact info..."
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-2">Redacted Result</label>
                    <div className="flex-1 relative">
                        <textarea
                            value={redactedText}
                            readOnly
                            className="w-full h-full p-4 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 outline-none resize-none text-slate-600 dark:text-slate-400"
                            placeholder="Redacted text will appear here..."
                        />
                        {isRedacting && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-6">
                <button
                    onClick={redact}
                    disabled={!text.trim() || isRedacting}
                    className="px-10 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
                >
                    Redact Sensitive Info
                </button>
            </div>
        </div>
    );
};

const LegalSummarizer: React.FC<{ user: any, onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSummarize = async () => {
        if (!user) {
            onLoginClick();
            return;
        }
        if (!text.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            const response = await api.post('/summarize', { text });
            setSummary(response.data.summary);
            logger.info('tools', 'AI summary generated successfully');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate summary. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    AI Legal Summarizer
                </h3>
                <p className="text-sm text-slate-500">Get an executive briefing of complex contracts.</p>
            </div>

            <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-40 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        placeholder="Paste long contract text here..."
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleSummarize}
                        disabled={!text.trim() || isProcessing}
                        className="px-12 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {user ? "Summarize Now" : "Login to Summarize"}
                    </button>
                </div>

                {summary && (
                    <div className="mt-4 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 overflow-y-auto max-h-[400px]">
                        <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Executive Summary</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-serif leading-relaxed">
                            {summary}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

const ExecutionChecklist: React.FC<{ user: any, onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    const [text, setText] = useState('');
    const [checklist, setChecklist] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!user) {
            onLoginClick();
            return;
        }
        if (!text.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            const response = await api.post('/checklist', { text });
            setChecklist(response.data.checklist);
            logger.info('tools', 'Execution checklist generated');
        } catch (err: any) {
            console.error(err);
            setError('Failed to generate checklist.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                    Execution Checklist
                </h3>
                <p className="text-sm text-slate-500">Step-by-step guide to signing and stamping this document.</p>
            </div>

            <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-40 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                        placeholder="Paste document content to see execution requirements..."
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleGenerate}
                        disabled={!text.trim() || isProcessing}
                        className="px-12 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                        Generate Checklist
                    </button>
                </div>

                {checklist && (
                    <div className="mt-4 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 overflow-y-auto max-h-[400px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-serif">
                            {checklist}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface Deadline {
    title: string;
    date: string;
    originalText: string;
    type: string;
}

const DeadlineExtractor: React.FC<{ user: any, onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    const [text, setText] = useState('');
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExtract = async () => {
        if (!user) {
            onLoginClick();
            return;
        }
        if (!text.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            const response = await api.post('/deadline', { text });
            setDeadlines(response.data.deadlines);
            logger.info('tools', `Extracted ${response.data.deadlines.length} deadlines`);
        } catch (err: any) {
            console.error(err);
            setError('Failed to extract deadlines.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadICS = (deadline: Deadline) => {
        const date = new Date(deadline.date).toISOString().replace(/-|:|\.\d+/g, '');
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${date}`,
            `DTEND:${date}`,
            `SUMMARY:${deadline.title}`,
            `DESCRIPTION:${deadline.originalText.replace(/\n/g, ' ')}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deadline.title.replace(/\s+/g, '_')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Deadline Extractor
                </h3>
                <p className="text-sm text-slate-500">Find all dates and export them to your calendar.</p>
            </div>

            <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-40 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        placeholder="Paste contract text to find important dates..."
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleExtract}
                        disabled={!text.trim() || isProcessing}
                        className="px-12 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-4 h-4" />}
                        Extract Deadlines
                    </button>
                </div>

                {deadlines.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] mt-4">
                        {deadlines.map((d, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${d.type === 'Payment' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            d.type === 'Termination' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {d.type}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{d.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300">{d.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 italic">"{d.originalText.substring(0, 100)}..."</p>
                                </div>
                                <button
                                    onClick={() => downloadICS(d)}
                                    className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                                    title="Add to Calendar"
                                >
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const LegalDictionary: React.FC<{ user: any, onLoginClick: () => void }> = ({ user, onLoginClick }) => {
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDefine = async () => {
        if (!user) {
            onLoginClick();
            return;
        }
        if (!term.trim()) return;
        setIsProcessing(true);
        try {
            // Reusing the simplify route for definitions
            const response = await api.post('/simplify', {
                text: term,
                language: 'english'
            });
            setDefinition(response.data.simplifiedText);
            logger.info('tools', `Defined term: ${term}`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const COMMON_TERMS = ['Indemnification', 'Force Majeure', 'Arbitration', 'Severability', 'Recitals', 'Lien'];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    Legal Dictionary
                </h3>
                <p className="text-sm text-slate-500">Simplify complex legal jargon and archaic terms.</p>
            </div>

            <div className="space-y-6 flex-1">
                <div className="flex gap-2 flex-wrap">
                    <label className="w-full text-[10px] font-bold uppercase text-slate-400">Quick Search</label>
                    {COMMON_TERMS.map(t => (
                        <button
                            key={t}
                            onClick={() => { setTerm(t); }}
                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400 hover:border-amber-500 transition-colors"
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Type a legal term (e.g., 'Estoppel')..."
                    />
                    <button
                        onClick={handleDefine}
                        disabled={!term.trim() || isProcessing}
                        className="px-6 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Explain It"}
                    </button>
                </div>

                {definition && (
                    <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl animate-in fade-in zoom-in-95">
                        <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">Meaning:</h4>
                        <p className="text-slate-700 dark:text-slate-300 font-serif leading-relaxed italic">
                            {definition}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

import { addBusinessDays, addDays, format, differenceInDays } from 'date-fns';

const DateCalculator = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [daysToAdd, setDaysToAdd] = useState(30);
    const [businessDays, setBusinessDays] = useState(false);
    const [resultDate, setResultDate] = useState('');

    useEffect(() => {
        if (!startDate) return;
        const date = new Date(startDate);
        const result = businessDays
            ? addBusinessDays(date, daysToAdd)
            : addDays(date, daysToAdd);
        setResultDate(format(result, 'dd MMM yyyy, EEEE'));
    }, [startDate, daysToAdd, businessDays]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Date Calculator
                </h3>
                <p className="text-sm text-slate-500">Calculate deadlines and business days accurately.</p>
            </div>

            <div className="space-y-6 max-w-lg mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Duration (Days)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            value={daysToAdd}
                            onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 0)}
                            className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={businessDays}
                                onChange={(e) => setBusinessDays(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Business Days Only</span>
                        </label>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center border border-blue-100 dark:border-blue-800">
                    <span className="block text-xs uppercase font-bold text-blue-500 mb-1">Resulting Date</span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white block">{resultDate}</span>
                </div>
            </div>
        </div>
    );
};

const SignatureCreator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas context for smooth lines
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000'; // Default black ink on light mode

        // Handle dark mode ink color? Usually signatures are black or blue. Keep black for formal usage.
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setHasContent(true);
        const rect = canvas.getBoundingClientRect();

        // Handle both mouse and touch events
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a download link
        const link = document.createElement('a');
        link.download = 'signature.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-purple-500" />
                        Signature Creator
                    </h3>
                    <p className="text-sm text-slate-500">Draw and download your digital signature.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const ctx = canvasRef.current?.getContext('2d');
                            if (ctx) ctx.strokeStyle = '#000000';
                        }}
                        className="w-6 h-6 rounded-full bg-black border border-slate-200" title="Black Ink"
                    />
                    <button
                        onClick={() => {
                            const ctx = canvasRef.current?.getContext('2d');
                            if (ctx) ctx.strokeStyle = '#0000FF';
                        }}
                        className="w-6 h-6 rounded-full bg-blue-600 border border-slate-200" title="Blue Ink"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    className="bg-white rounded-xl shadow-sm cursor-crosshair touch-none max-w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <p className="text-xs text-slate-400 mt-2">Sign in the box above</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={clearCanvas}
                    className="px-6 py-2 text-slate-500 hover:text-red-500 font-bold transition-colors"
                >
                    Clear
                </button>
                <button
                    onClick={saveSignature}
                    disabled={!hasContent}
                    className="px-8 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
            </div>
        </div>
    );
};

const UnitConverter = () => {
    const [amount, setAmount] = useState<number>(1);
    const [category, setCategory] = useState<'currency' | 'area'>('currency');
    const [fromUnit, setFromUnit] = useState('USD');
    const [toUnit, setToUnit] = useState('INR');

    // Simple hardcoded rates for demo purpose. Real app would fetch live rates.
    const RATES: any = {
        currency: { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79 }, // Base USD
        area: { 'sq.ft': 1, 'sq.m': 0.092903, 'acre': 0.0000229568, 'hectare': 0.0000092903 } // Base sq.ft
    };

    const result = (() => {
        const base = amount / RATES[category][fromUnit];
        const converted = base * RATES[category][toUnit];
        return converted.toLocaleString(undefined, { maximumFractionDigits: 4 });
    })();

    const units = Object.keys(RATES[category]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-orange-500" />
                    Unit Converter
                </h3>
                <p className="text-sm text-slate-500">Quickly convert currencies and property measurements.</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => { setCategory('currency'); setFromUnit('USD'); setToUnit('INR'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${category === 'currency' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Currency
                    </button>
                    <button
                        onClick={() => { setCategory('area'); setFromUnit('sq.ft'); setToUnit('sq.m'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${category === 'area' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Area (Land)
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto w-full space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">From</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono"
                        />
                    </div>
                    <div className="w-32 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                        <select
                            value={fromUnit}
                            onChange={(e) => setFromUnit(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                        >
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                    </div>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">To</label>
                        <div className="w-full p-3 rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 text-lg font-mono font-bold text-orange-700 dark:text-orange-400">
                            {result}
                        </div>
                    </div>
                    <div className="w-32 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                        <select
                            value={toUnit}
                            onChange={(e) => setToUnit(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                        >
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                {category === 'currency' && (
                    <p className="text-center text-xs text-slate-400 mt-4">
                        *Rates are indicative. Ensure to check live market rates for financial transactions.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ToolsView;
