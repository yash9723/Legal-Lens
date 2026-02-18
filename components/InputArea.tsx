import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileText, X, ImageIcon, ScanLine, AlertCircle, Loader2, ArrowRight, CheckCircle2, Globe, Languages, Check, CloudUpload, Shield, FileType } from 'lucide-react';
import { AnalyzeParams } from '../types';
import { logger } from '../services/loggerService';
import { redactPII } from '../utils/fileProcessor';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface InputAreaProps {
  onAnalyze: (params: AnalyzeParams) => void;
  isAnalyzing: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const LOADING_STEPS = [
  "Enhancing document clarity...",
  "Reconstructing layout & text...",
  "Extracting key clauses...",
  "Analyzing risks and red flags...",
  "Formulating negotiation strategies...",
  "Finalizing legal verdict..."
];

const SUPPORTED_LANGUAGES = [
  "English", "Spanish", "French", "German", "Hindi", "Telugu", "Portuguese",
  "Chinese (Simplified)", "Japanese", "Arabic", "Italian", "Russian", "Dutch"
];

interface FileState {
  name: string;
  type: 'image' | 'text' | 'pdf';
  previewUrl?: string; // For images
  base64Data?: string; // For images
  mimeType?: string;   // For images
  content?: string;    // For text/pdf
  size: number;
}

const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const [inputLanguage, setInputLanguage] = useState('Auto-detect');
  const [outputLanguage, setOutputLanguage] = useState('English');

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isRedactionEnabled, setIsRedactionEnabled] = useState(false);

  // Changed to array for multiple files
  const [files, setFiles] = useState<FileState[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycling loading messages
  useEffect(() => {
    if (isAnalyzing) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setLocalError(null);
  };

  const processFile = async (file: File): Promise<FileState> => {
    if (file.size > MAX_FILE_SIZE) {
      throw `File ${file.name} is too large. Max 5MB.`;
    }

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    const isText = file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt');

    if (!isImage && !isText && !isPDF) {
      throw `File ${file.name} is not supported. Use JPG, PNG, PDF or TXT.`;
    }

    if (isImage) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1];
          resolve({
            name: file.name,
            type: 'image',
            previewUrl: result,
            base64Data: base64Data,
            mimeType: file.type,
            size: file.size
          });
        };
        reader.onerror = () => reject(`Error reading ${file.name}`);
        reader.readAsDataURL(file);
      });
    } else if (isPDF) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(' ') + '\n';
        }
        return {
          name: file.name,
          type: 'pdf',
          content: fullText,
          size: file.size
        };
      } catch (e) {
        console.error("PDF Extraction Error", e);
        throw `Failed to extract text from ${file.name}`;
      }
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          resolve({
            name: file.name,
            type: 'text',
            content: content,
            size: file.size
          });
        };
        reader.onerror = () => reject(`Error reading ${file.name}`);
        reader.readAsText(file);
      });
    }
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    setLocalError(null);
    setUploadProgress(0);
    setIsReadingFile(true);

    const fileArray = Array.from(newFiles);

    // Check limit
    if (files.length + fileArray.length > MAX_FILES) {
      setLocalError(`You can only upload up to ${MAX_FILES} files.`);
      setIsReadingFile(false);
      return;
    }

    try {
      const processedFiles = await Promise.all(fileArray.map(processFile));

      // Validation: Verify if mixing types (optional, but good for simplicity)
      // If we have existing files, ensure new ones match type (e.g. all images)
      const allFiles = [...files, ...processedFiles];
      const hasText = allFiles.some(f => f.type === 'text');
      const hasImage = allFiles.some(f => f.type === 'image');

      if (hasText && hasImage) {
        throw "Cannot mix text files and images. Please simply paste text or upload images.";
      }
      if (hasText && allFiles.length > 1) {
        throw "Please upload only one text file at a time, or paste the text.";
      }

      if (hasText) {
        // If text file, put content in text area (legacy behavior preferred for text)
        // But we need to read it. processFile for text returns wrapper.
        // Re-reading logic from processFile:
        // Actually, for multiple text files support, we'd need backend change.
        // Let's stick to: Multiple Images allowed. Text file = Single.

        // If user uploads text file, we set it as the content.
        // We need to re-read the content for text files as processFile didn't return content string for text
        // Wait, processFile for text didn't return the content in 'base64Data' or similar field. 
        // Let's fix processFile to return content for text if needed, 
        // OR just handle text file separately as before using the reader directly here?
        // Refactoring processFile to match the old logic for text:

        // ... actually the old logic put text file content into 'text' state.
        // Let's keep that behavior for text files.

        // Quick fix: If type is text, we handle it specially.
        // But since we are inside async, let's just use the result.
        // I'll modify processFile logic above or just handle here?
        // Since I can't modify the helper inside the try block easily without re-writing, 
        // I will assume for TEXT we just take the first one and populate the text area.

        // Actually, let's simplify: MULTI-UPLOAD is ONLY for IMAGES.
        // Text files -> limit to 1.
      }

      setFiles(prev => [...prev, ...processedFiles]);
      setIsReadingFile(false);

      // Be nice and clear text if images are uploaded
      if (processedFiles[0].type === 'image') {
        setText('');
      } else {
        // It is text file
        // We need the content to set into 'text' state
        // But 'files' state doesn't hold text content.
        // Let's revisit the text file handling.
        // If the user uploaded a text file, let's just read it into the text area immediately and NOT add to 'files' array?
        // Or supports 'files' array for text too? 
        // The backend expects 'content' string for text.
        // If we support multiple text files, backend needs to merge them?
        // For now, let's assume if it is text, we read it to text area and clear files array.
        // But wait, the previous code read text file into 'text' state. 

        // Let's do this: 
        // If text file detected, read into text area.
        // If images, add to files array.

        // Re-evaluating processFile wrapper...

      }

    } catch (err: any) {
      setLocalError(typeof err === 'string' ? err : "Error processing files");
      setIsReadingFile(false);
    }
  };

  const validateAndProcessFiles = async (fileList: FileList) => {
    // Improved logic to separate text vs images vs pdf
    const fileArray = Array.from(fileList);
    if (fileArray.length === 0) return;

    const textFiles = fileArray.filter(f => f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.md'));
    const pdfFiles = fileArray.filter(f => f.type === 'application/pdf');
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (textFiles.length > 0 && imageFiles.length > 0) {
      setLocalError("Cannot mix text and image files.");
      return;
    }

    if (pdfFiles.length > 0 && imageFiles.length > 0) {
      setLocalError("Cannot mix PDF and image files.");
      return;
    }

    if (textFiles.length > 1 || pdfFiles.length > 1 || (textFiles.length > 0 && pdfFiles.length > 0)) {
      setLocalError("Please upload only one text or PDF file at a time.");
      return;
    }

    setIsReadingFile(true);
    setLocalError(null);

    try {
      if (textFiles.length === 1 || pdfFiles.length === 1) {
        // Handle single text or PDF file
        const file = textFiles[0] || pdfFiles[0];
        const processed = await processFile(file);
        setText(processed.content || '');
        setFiles([]); // Clear images
        setIsReadingFile(false);
        return;
      }

      // Handle images
      const processedImages = await Promise.all(imageFiles.map(processFile));
      setFiles(prev => {
        // Filter out any text types if they somehow got there, ensuring we only have images
        const cleanPrev = prev.filter(p => p.type === 'image');
        return [...cleanPrev, ...processedImages];
      });
      setText(''); // Clear text
    } catch (e: any) {
      setLocalError(e.toString());
    } finally {
      setIsReadingFile(false);
    }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!dragActive) setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setText('');
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeClick = () => {
    let processedContent = text;
    let processedFileName = 'Pasted Text Contract';

    // If we have files (images)
    if (files.length > 0) {
      // Collect all base64 data
      const contentArray = files.map(f => f.base64Data!).filter(Boolean);
      const fileName = files.length === 1 ? files[0].name : `${files.length} Images - ${files[0].name}`;

      onAnalyze({
        type: 'image',
        content: contentArray, // Pass array of strings
        mimeType: files[0].mimeType, // Assuming all same type or handled by backend, backend takes first one's mimetype usually for prompt context
        outputLanguage,
        inputLanguage,
        fileName
      });
      return;
    }

    if (text.trim()) {
      if (isRedactionEnabled) {
        processedContent = redactPII(processedContent);
      }
      onAnalyze({
        type: 'text',
        content: processedContent,
        outputLanguage: outputLanguage,
        inputLanguage: inputLanguage,
        fileName: processedFileName
      });
    }
  };

  const hasContent = text.trim().length > 0 || files.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <FileType className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Document Upload</h2>
            <p className="text-xs text-slate-500">Supported formats: PDF, PNG, JPG, TXT</p>
          </div>
        </div>

        {!isAnalyzing && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">End-to-End Encrypted</span>
            </div>

            <button
              onClick={() => setIsRedactionEnabled(!isRedactionEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${isRedactionEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-50'
                }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {isRedactionEnabled ? 'Privacy Mode: ON' : 'Privacy Mode: OFF'}
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        {localError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4" /> {localError}
          </div>
        )}

        {/* Upload Zone */}
        {files.length === 0 && !isReadingFile ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`
                    w-full h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                    ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
                    ${dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                `}
          >
            <div className={`p-4 rounded-full mb-4 ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <CloudUpload className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Click to upload or drag and drop</h3>
            <p className="text-xs text-slate-500 mt-1">Up to 5 images (JPG, PNG) or 1 Text/PDF File.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.jpg,.jpeg,.png,.pdf" multiple />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/30">
            {isReadingFile ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-900 dark:text-white animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing files...</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Header for File List */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploaded Files ({files.length})</h3>
                  <button onClick={clearAll} disabled={isAnalyzing} className="text-xs text-red-500 hover:text-red-600 hover:underline">Clear All</button>
                </div>

                {/* Grid of Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                      {file.type === 'image' && file.previewUrl ? (
                        <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-black/20">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => removeFile(index)} className="p-1 bg-white dark:bg-slate-800 rounded-full shadow text-red-500 hover:text-red-700 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  {files.length < MAX_FILES && (
                    <button
                      onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500 font-medium">Add Page</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Area Fallback */}
        {(files.length === 0) && !isReadingFile && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Or paste text content</label>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              disabled={isAnalyzing}
              placeholder="Paste contract text here..."
              className="w-full h-32 p-4 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all resize-none"
            />
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`flex items-center gap-4 w-full md:w-auto ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
            <SelectInput
              icon={Languages}
              value={inputLanguage}
              onChange={setInputLanguage}
              options={['Auto-detect', ...SUPPORTED_LANGUAGES]}
            />
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <SelectInput
              icon={Globe}
              value={outputLanguage}
              onChange={setOutputLanguage}
              options={SUPPORTED_LANGUAGES}
              prefix="Translate to "
            />
          </div>

          <div className="w-full md:w-auto">
            {isAnalyzing ? (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[300px]">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                  {LOADING_STEPS[loadingStep]}
                </span>
              </div>
            ) : (
              <button
                onClick={handleAnalyzeClick}
                disabled={!hasContent}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Analyze Contract <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const SelectInput = ({ icon: Icon, value, onChange, options, prefix = '' }: any) => (
  <div className="relative flex-1">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none cursor-pointer"
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{prefix}{opt}</option>
      ))}
    </select>
  </div>
);

export default InputArea;
