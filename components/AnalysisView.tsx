
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, Verdict, VisualInsight, AnalyzeParams } from '../types';
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  ShieldCheck,
  FileText,
  Clock,
  DollarSign,
  Info,
  ScanEye,
  PenTool,
  Stamp,
  X,
  Maximize2,
  Strikethrough,
  Highlighter,
  Bold,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  MapPin,
  Download,
  Handshake,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Gauge,
  List,
  Mail,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { logger } from '../services/loggerService';
import ChatWidget from './ChatWidget';
import ComparisonView from './ComparisonView';
import { generateWordDoc } from '../utils/docGenerator';
import { generateICS } from '../utils/calendarGenerator';

interface AnalysisViewProps {
  data: AnalysisResult;
  onReset: () => void;
  imageUrl?: string | null;
  analyzeParams: AnalyzeParams;
  userPlan?: string;
}

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const styles = {
    High: "bg-red-500 text-white border-red-600",
    Medium: "bg-orange-500 text-white border-orange-600",
    Low: "bg-green-500 text-white border-green-600"
  };
  const styleClass = styles[level as keyof typeof styles] || styles.Low;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm uppercase tracking-wide ${styleClass}`}>
      {level}
    </span>
  );
};

const VerdictCard: React.FC<{ verdict: Verdict }> = ({ verdict }) => {
  let gradient = "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900";
  let border = "border-slate-200 dark:border-slate-700";
  let icon = <CheckCircle className="w-12 h-12 text-slate-500 dark:text-slate-400" />;
  let titleColor = "text-slate-800 dark:text-slate-100";

  if (verdict.status === 'Safe') {
    gradient = "from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30";
    border = "border-emerald-200 dark:border-emerald-800";
    icon = <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />;
    titleColor = "text-emerald-900 dark:text-emerald-200";
  } else if (verdict.status === 'Negotiate') {
    gradient = "from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30";
    border = "border-amber-200 dark:border-amber-800";
    icon = <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400" />;
    titleColor = "text-amber-900 dark:text-amber-200";
  } else {
    gradient = "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30";
    border = "border-red-200 dark:border-red-800";
    icon = <AlertOctagon className="w-12 h-12 text-red-600 dark:text-red-400" />;
    titleColor = "text-red-900 dark:text-red-200";
  }

  return (
    <div className={`p-8 rounded-2xl border ${border} bg-gradient-to-br ${gradient} flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm animate-fade-up duration-slow ease-smooth fill-mode-both`}>
      <div className="flex-shrink-0 bg-white/50 dark:bg-black/20 p-4 rounded-full shadow-inner backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-center sm:text-left">
        <h3 className={`text-2xl font-extrabold ${titleColor} mb-2 tracking-tight`}>{verdict.status} to Sign</h3>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-medium opacity-90">{verdict.explanation}</p>
      </div>
    </div>
  );
};

const InsightIcon: React.FC<{ type?: string }> = ({ type }) => {
  const t = (type || '').toLowerCase();
  if (t.includes('stamp')) return <Stamp className="w-4 h-4 text-indigo-400" />;
  if (t.includes('strike')) return <Strikethrough className="w-4 h-4 text-red-400" />;
  if (t.includes('highlight')) return <Highlighter className="w-4 h-4 text-amber-500" />;
  if (t.includes('bold')) return <Bold className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
  return <PenTool className="w-4 h-4 text-purple-400" />;
};

const RiskTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-200 dark:border-slate-700 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: data.payload.color }}></span>
          <span className="font-bold">{data.name}:</span>
          <span className="font-mono">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, onReset, imageUrl, analyzeParams, userPlan = 'Free' }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'compare'>('report');

  // Simplifier State
  const [simplifiedClauses, setSimplifiedClauses] = useState<{ [key: string]: string }>({});
  const [simplifyingClause, setSimplifyingClause] = useState<{ [key: string]: boolean }>({});
  const [simplificationErrors, setSimplificationErrors] = useState<{ [key: string]: string }>({});

  const handleSimplify = async (text: string, language: 'en' | 'hinglish' | 'tenglish', index: number) => {
    const key = `${index}-${language}`;
    if (simplifiedClauses[key]) return; // Already fetched

    setSimplifyingClause(prev => ({ ...prev, [key]: true }));
    try {
      const response = await api.post('/simplify', { text, language });
      setSimplifiedClauses(prev => ({ ...prev, [key]: response.data.simplifiedText }));

      // Log usage
      logger.info('ui', `User simplified clause to ${language}`);
    } catch (error: any) {
      console.error("Simplification error", error);
      let errMsg = "Failed to simplify.";
      if (error.response && error.response.status === 401) {
        errMsg = "Session expired.";
      }
      setSimplificationErrors(prev => ({ ...prev, [key]: errMsg }));
    } finally {
      setSimplifyingClause(prev => ({ ...prev, [key]: false }));
    }
  };

  // Negotiation Coach State
  const [negotiationEmail, setNegotiationEmail] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNegotiate = async () => {
    setIsNegotiating(true);
    try {
      const response = await api.post('/negotiate', {
        risks: data.risks,
        summary: data.oneLineOverview,
        counterpartyName: 'Counterparty'
      });
      setNegotiationEmail(response.data.emailDraft);
      setShowNegotiationModal(true);
    } catch (error) {
      console.error("Negotiation error", error);
      alert("Failed to generate email. Please try again.");
    } finally {
      setIsNegotiating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(negotiationEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [selectedInsight, setSelectedInsight] = useState<VisualInsight | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Image Viewer State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Auto-focus logic: Calculates zoom and pan to center the bounding box
  const focusOnInsight = (insight: VisualInsight) => {
    if (insight?.boundingBox && insight.boundingBox.length === 4 && imgRef.current) {
      const width = imgRef.current.width;
      const height = imgRef.current.height;

      // Prevent calculation if image hasn't rendered dimensions yet
      if (width === 0 || height === 0) return;

      const [ymin, xmin, ymax, xmax] = insight.boundingBox;

      // Calculate center of the bounding box (in percentages)
      const cx = (xmin + xmax) / 2;
      const cy = (ymin + ymax) / 2;

      // Target magnification
      const targetZoom = 2.5;

      // Calculate offset to move the box center (cx, cy) to the viewport center (50, 50)
      // Note: We use a simplified pan logic compatible with our transform order (translate -> scale) or (scale -> translate)
      // Here we use transform: scale(z) translate(x/z, y/z) which means panning is in 'screen' pixels essentially.
      // We want (cx, cy) which is currently at (width*cx/100, height*cy/100) relative to image center (0,0 if transform origin is center)
      // Wait, default transform origin is 50% 50%.
      // The point is at (cx-50)% of width, (cy-50)% of height from center.
      // We need to translate by opposite amount.

      const offsetX = ((50 - cx) / 100) * width;
      const offsetY = ((50 - cy) / 100) * height;

      // Apply zoom first, so we effectively translate 'through' the zoom? 
      // With `scale(z) translate(tx, ty)`, the effective translation is `z * tx`.
      // We want effective translation to be `offsetX * z`.
      // So `z * tx = offsetX * z` => `tx = offsetX`.
      // Our render logic uses `translate(${pan.x / zoom}px, ${pan.y / zoom}px)`.
      // So `tx = pan.x / z`.
      // We need `pan.x / z = offsetX` => `pan.x = offsetX * z`.

      setZoom(targetZoom);
      setPan({ x: offsetX * targetZoom, y: offsetY * targetZoom });
    } else {
      // Reset if no specific focus area
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (selectedInsight) {
      // Small timeout to allow modal to render and image to size
      setTimeout(() => focusOnInsight(selectedInsight), 100);
    }
  }, [selectedInsight]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedInsight) return;

      if (e.key === 'ArrowRight') {
        handleNextInsight();
      } else if (e.key === 'ArrowLeft') {
        handlePrevInsight();
      } else if (e.key === 'Escape') {
        closeImageViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInsight, selectedIndex, data.visualInsights]);

  const riskCounts = data.risks.reduce((acc, risk) => {
    acc[risk.level] = (acc[risk.level] || 0) + 1;
    return acc;
  }, { High: 0, Medium: 0, Low: 0 } as Record<string, number>);

  const chartData = [
    { name: 'High Risk', value: riskCounts.High, color: '#ef4444' },    // Red-500
    { name: 'Medium Risk', value: riskCounts.Medium, color: '#f97316' }, // Orange-500
    { name: 'Low Risk', value: riskCounts.Low, color: '#22c55e' },       // Green-500
  ].filter(d => d.value > 0);

  const isLowQuality = data.scanQuality
    ? data.scanQuality.toLowerCase().match(/poor|blur|partial|unreadable|low|fair/)
    : null;

  const hasVisuals = data.visualInsights && data.visualInsights.length > 0;
  const hasNegotiationPoints = data.negotiationPoints && data.negotiationPoints.length > 0;

  const handleInsightClick = (insight: VisualInsight, index: number) => {
    if (imageUrl) {
      setSelectedInsight(insight);
      setSelectedIndex(index);

      // Use the new visual logger method
      logger.visual('User clicked visual insight to highlight/zoom', {
        type: insight.type,
        description: insight.description,
        coords: insight.boundingBox
      });
    }
  };

  const handleNextInsight = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (data.visualInsights && selectedIndex < data.visualInsights.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedInsight(data.visualInsights[newIndex]);

      // Log navigation
      logger.visual('User navigated to next visual insight', {
        index: newIndex,
        type: data.visualInsights[newIndex].type
      });
    }
  };

  const handlePrevInsight = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (data.visualInsights && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedInsight(data.visualInsights[newIndex]);

      // Log navigation
      logger.visual('User navigated to previous visual insight', {
        index: newIndex,
        type: data.visualInsights[newIndex].type
      });
    }
  };

  const closeImageViewer = () => {
    setSelectedInsight(null);
    setSelectedIndex(-1);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Pan/Zoom Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
  const handleZoomOut = () => {
    setZoom(z => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 }); // Reset pan on zoom reset
      return newZoom;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleExportPDF = () => {
    logger.info('ui', 'User exported analysis to PDF');
    // ... (Existing export logic preserved, abbreviated for brevity)
    const printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LegalLens Analysis - ${data.oneLineOverview.substring(0, 30)}...</title>
            <style>
                body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                .logo { font-size: 24px; font-weight: 800; color: #0f172a; }
                .logo span { color: #2563eb; }
                .meta { text-align: right; font-size: 12px; color: #64748b; }
                .verdict { font-size: 18px; font-weight: bold; padding: 8px 16px; border-radius: 9999px; display: inline-block; margin-top: 10px; }
                .verdict-Safe { background: #dcfce7; color: #166534; }
                .verdict-Negotiate { background: #ffedd5; color: #9a3412; }
                .verdict-High { background: #fee2e2; color: #991b1b; } 
                h1 { font-size: 20px; font-weight: 700; margin-top: 0; }
                h2 { font-size: 16px; font-weight: 700; color: #334155; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
                h3 { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
                .value { font-size: 14px; font-weight: 600; color: #0f172a; }
                .risk { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1; }
                .risk:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .badge-High { background: #fee2e2; color: #991b1b; }
                .badge-Medium { background: #ffedd5; color: #9a3412; }
                .badge-Low { background: #dcfce7; color: #166534; }
                .doc-img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px; }
                .neg-point { background: #fffbeb; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">LegalLens<span>AI</span></div>
                    <div style="margin-top: 5px; font-size: 14px; color: #475569;">Analysis Report</div>
                </div>
                <div class="meta">
                    <div>Generated: ${new Date().toLocaleDateString()}</div>
                    <div>Time: ${new Date().toLocaleTimeString()}</div>
                    <div class="verdict verdict-${data.verdict.status.split(' ')[0]}">${data.verdict.status}</div>
                </div>
            </div>
            <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
                <span class="label" style="color: #2563eb;">One-Line Overview</span>
                <p style="margin: 0; font-weight: 500; color: #1e3a8a;">${data.oneLineOverview}</p>
            </div>
            <div class="card">
                <span class="label">Verdict Explanation</span>
                <p style="margin: 0;">${data.verdict.explanation}</p>
            </div>
            <h2>Contract Snapshot</h2>
            <div class="grid-2">
                ${data.contractSnapshot.map(item => `
                    <div class="card" style="margin-bottom: 0;">
                        <span class="label">${item.label}</span>
                        <span class="value">${item.value}</span>
                    </div>
                `).join('')}
            </div>
            <h2>Risk Assessment</h2>
            <div class="card">
                ${data.risks.length === 0 ? '<p>No significant risks identified.</p>' : ''}
                ${data.risks.map(risk => `
                    <div class="risk">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span class="badge badge-${risk.level}">${risk.level} Risk</span>
                            <span style="font-size: 11px; color: #64748b;">Favors: ${risk.favors}</span>
                        </div>
                        <div style="font-weight: 600; margin-bottom: 4px;">${risk.description}</div>
                        <div style="font-size: 13px; color: #475569; font-style: italic;">Consequence: ${risk.consequence}</div>
                    </div>
                `).join('')}
            </div>
            ${data.negotiationPoints && data.negotiationPoints.length > 0 ? `
              <h2>Negotiation Strategy</h2>
              <div class="card" style="background: #fff7ed;">
                  ${data.negotiationPoints.map(p => `
                      <div class="neg-point">
                          <div style="font-weight: 700; color: #9a3412; font-size: 12px; text-transform: uppercase;">Clause: ${p.clause}</div>
                          <div style="font-weight: 600; margin-top: 4px; margin-bottom: 4px;">Issue: ${p.issue}</div>
                          <div style="font-style: italic; color: #431407; font-size: 14px;">"Suggestion: ${p.suggestion}"</div>
                          <div style="font-size: 11px; color: #78350f; margin-top: 4px; background: #fff7ed; padding: 4px 8px; border-radius: 4px; border: 1px solid #fed7aa;">
                            <strong>Rationale:</strong> ${p.rationale}
                          </div>
                      </div>
                  `).join('')}
              </div>
            ` : ''}
            <h2>Key Clauses</h2>
            <div style="display: grid; gap: 16px;">
                ${data.keyClauses.map((clause, idx) => `
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
                        <h3>${clause.title}</h3>
                        <p style="margin: 0; font-size: 14px; color: #475569;">${clause.explanation}</p>
                    </div>
                `).join('')}
            </div>
            {/* ... rest of the export content ... */

            {data.missingClauses && data.missingClauses.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  Missing Clauses
                </h2>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2 font-medium">
                    The following standard clauses appear to be missing from this contract:
                  </p>
                  <ul className="space-y-1">
                     {data.missingClauses.map((clause, idx) => (
                       <li key={idx} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                         <X className="w-4 h-4" /> {clause}
                       </li>
                     ))}
                  </ul>
                </div>
              </div>
            )}
            <h2>Obligations</h2>
            <div class="card">
                ${data.obligations.map(ob => `
                    <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                        <div style="font-weight: 600;">${ob.task}</div>
                        <div style="font-size: 12px; margin-top: 4px; display: flex; gap: 10px;">
                            <span style="color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">By: ${ob.deadline}</span>
                            ${ob.penalty !== 'None' ? `<span style="color: #dc2626; background: #fef2f2; padding: 2px 6px; border-radius: 4px;">Penalty: ${ob.penalty}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
                ${data.obligations.length === 0 ? '<p>No specific obligations extracted.</p>' : ''}
            </div>
            ${data.moneyAndExit ? `
                <h2>Money & Exit</h2>
                <div class="card">
                    <p style="margin: 0; white-space: pre-wrap;">${data.moneyAndExit}</p>
                </div>
            ` : ''}
            ${data.visualInsights && data.visualInsights.length > 0 ? `
                <h2>Visual Insights</h2>
                <div class="card">
                    ${data.visualInsights.map(v => `
                        <div style="margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 700; color: #7e22ce; font-size: 12px; text-transform: uppercase;">${v.type}</span>
                                <span style="font-size: 11px; color: #64748b;">Relevance: ${v.relevance}</span>
                            </div>
                            <div style="margin-top: 2px;">${v.description}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p>Generated by LegalLens AI. This report uses artificial intelligence and does not constitute professional legal advice.</p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up duration-slow ease-smooth pb-20">

      {/* 1. Header & Verdict */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-colors duration-slow ease-smooth">

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Report</span>
              {data.scanQuality && data.scanQuality !== 'N/A' && (
                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${isLowQuality
                  ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'}`}>
                  <ScanEye className="w-3 h-3" />
                  Quality: {data.scanQuality}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Contract Analysis</h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* COMPARISON TOOL TOGGLE (Pro+) */}
            {(userPlan === 'Professional' || userPlan === 'Team' || userPlan === 'admin') && (
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center mr-2">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'report' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Report
                </button>
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'compare' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Compare
                </button>
              </div>
            )}

            {userPlan === 'Free' ? (
              <button
                onClick={() => alert("Upgrade to Starter to export PDF reports!")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-sm font-bold rounded-xl cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Unlock Export</span>
              </button>
            ) : (
              <button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            )}
            {/* Negotiation Coach Button */}
            {(userPlan === 'Professional' || userPlan === 'Team' || userPlan === 'admin') && (
              <button
                onClick={handleNegotiate}
                disabled={isNegotiating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isNegotiating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                {isNegotiating ? 'Drafting...' : 'Coach Me'}
              </button>
            )}

            <button
              onClick={onReset}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            >
              New Scan
            </button>
          </div>
        </div>

        {/* Low Quality Warning */}
        {isLowQuality && (
          <div className="mb-8 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl p-4 flex items-start gap-4 shadow-sm animate-fade-up">
            <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-orange-800 dark:text-orange-200 text-sm uppercase tracking-wide mb-1">
                Scan Quality Alert
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed opacity-90">
                The image quality is {data.scanQuality}. Some text might be misread. Please manually verify dates and amounts.
              </p>
            </div>
          </div>
        )}

        <VerdictCard verdict={data.verdict} />

        <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Executive Summary
            </h3>
            <p className="text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              "{data.oneLineOverview}"
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'compare' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in zoom-in-95 min-h-[500px]">
          <ComparisonView />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Details */}
          <div className="space-y-8">

            {/* Contract Snapshot Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Contract Snapshot</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {data.contractSnapshot.map((item, idx) => (
                  <div key={idx} className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/30">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 line-clamp-1" title={item.label}>{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Money & Exit */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Financials & Exit</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{data.moneyAndExit}</p>
              </div>
            </div>

            {/* Visual Analysis (Interactive) */}
            {hasVisuals && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-500" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Visual Insights</h3>
                  </div>
                  <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">
                    {data.visualInsights?.length} Found
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {data.visualInsights?.map((insight, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleInsightClick(insight, idx)}
                      className={`flex gap-3 p-3 rounded-xl border transition-all duration-300 group cursor-pointer ${imageUrl
                        ? 'border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 dark:border-slate-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/10'
                        : 'border-transparent bg-slate-50 dark:bg-slate-900/30'
                        }`}
                    >
                      <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                        <InsightIcon type={insight.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 truncate pr-2">{insight.type || 'Insight'}</p>
                          {imageUrl && insight.boundingBox && (
                            <Maximize2 className="w-3 h-3 text-slate-300 group-hover:text-purple-500 transition-colors" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1 line-clamp-2">{insight.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Relevance: {insight.relevance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center/Right Columns: Risks & Clauses */}
          <div className="lg:col-span-2 space-y-8">

            {/* Risk Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Risk Assessment</h3>
                </div>

                {/* Mini Chart */}
                <div className="h-10 w-32 hidden sm:block">
                  {chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={10}
                          outerRadius={18}
                          paddingAngle={4}
                          stroke="none"
                          cornerRadius={4}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<RiskTooltip />} cursor={{ fill: 'transparent' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {data.risks.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
                    <p className="text-lg font-medium">No significant risks detected.</p>
                  </div>
                ) : (
                  data.risks.map((risk, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <RiskBadge level={risk.level.includes('Hidden') ? 'Low' : risk.level} />
                            {risk.level.includes('Hidden') && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Premium</span>}
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Favors: {risk.favors}</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{risk.description}</p>
                        </div>
                      </div>
                      <div className={`flex items-start gap-3 p-4 rounded-xl border ${risk.level.includes('Hidden') ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100/50 dark:border-red-900/20'}`}>
                        {risk.level.includes('Hidden') ? <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> : <AlertOctagon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${risk.level.includes('Hidden') ? 'text-slate-500' : 'text-red-600 dark:text-red-400'}`}>Potential Consequence</span>
                          <span className={`text-sm leading-relaxed ${risk.level.includes('Hidden') ? 'text-slate-400 blur-sm select-none' : 'text-slate-700 dark:text-slate-300'}`}>
                            {risk.consequence}
                          </span>
                          {risk.level.includes('Hidden') && (
                            <div className="mt-2">
                              <button className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                                Upgrade to Unlock <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Negotiation Strategy */}
            {hasNegotiationPoints && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10">
                  <Handshake className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Negotiation Playbook</h3>
                </div>
                <div className="divide-y divide-amber-50 dark:divide-slate-700/50">
                  {data.negotiationPoints.map((point, idx) => (
                    <div key={idx} className="p-6 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                          Clause: {point.clause}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider mb-1 block">The Issue</span>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                            {point.issue}
                          </p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 relative group">
                          <div className="absolute -top-3 -right-3 bg-amber-500 text-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                            <MessageCircle className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-500 block mb-1">Counter Proposal</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white italic">"{point.suggestion}"</p>

                          {point.rationale && (
                            <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
                              <div className="flex gap-1.5 items-start">
                                <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5" />
                                <p className="text-xs text-amber-800 dark:text-amber-300">{point.rationale}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Obligations */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Deadlines & Tasks</h3>
                </div>
                <div className="p-6 flex-1">
                  <ul className="space-y-6">
                    {data.obligations.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 relative">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 flex-shrink-0" />
                        {idx !== data.obligations.length - 1 && (
                          <div className="absolute left-[3px] top-4 bottom-[-18px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold mb-1">{item.task}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
                              Due: {item.deadline}
                            </span>
                            {item.penalty !== "None" && (
                              <span className="text-[10px] text-red-700 dark:text-red-300 font-semibold bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/50">
                                Penalty: {item.penalty}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Clauses */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                  <List className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Clause Explainer</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
                  {data.keyClauses.map((clause, idx) => (
                    <div key={idx} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{clause.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{clause.explanation}</p>

                      {/* Simplifier Controls */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSimplify(`${clause.title}: ${clause.explanation}`, 'en', idx)}
                          className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
                        >
                          🇬🇧 Simpler
                        </button>
                        <button
                          onClick={() => handleSimplify(`${clause.title}: ${clause.explanation}`, 'hinglish', idx)}
                          className="text-[10px] font-bold px-2 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded text-orange-700 dark:text-orange-300 transition-colors flex items-center gap-1"
                        >
                          🇮🇳 Hinglish
                        </button>
                        <button
                          onClick={() => handleSimplify(`${clause.title}: ${clause.explanation}`, 'tenglish', idx)}
                          className="text-[10px] font-bold px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 rounded text-emerald-700 dark:text-emerald-300 transition-colors flex items-center gap-1"
                        >
                          🇮🇳 Tenglish
                        </button>
                      </div>

                      {/* Simplified Result Display */}
                      {['en', 'hinglish', 'tenglish'].map(lang => {
                        const key = `${idx}-${lang}`;
                        const text = simplifiedClauses[key];
                        const isLoading = simplifyingClause[key];
                        const error = simplificationErrors[key];

                        if (!text && !isLoading && !error) return null;

                        return (
                          <div key={lang} className="mt-3 relative group animate-in fade-in slide-in-from-top-1">
                            <div className="absolute top-0 left-4 w-3 h-3 bg-slate-100 dark:bg-slate-800 transform rotate-45 -translate-y-1/2 border-l border-t border-slate-200 dark:border-slate-700"></div>
                            <div className={`p-4 rounded-xl rounded-tl-none border shadow-sm ${error
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}>
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {lang === 'en' ? '🇬🇧 Plain English' : lang === 'hinglish' ? '🇮🇳 Hinglish' : '🇮🇳 Tenglish'}
                                </span>
                                {!isLoading && !error && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(text);
                                      const btn = document.getElementById(`copy-btn-${key}`);
                                      if (btn) {
                                        const original = btn.innerHTML;
                                        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>';
                                        setTimeout(() => btn.innerHTML = original, 2000);
                                      }
                                    }}
                                    id={`copy-btn-${key}`}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    title="Copy"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {isLoading ? (
                                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                                  <span className="animate-pulse">Simplifying for you...</span>
                                </div>
                              ) : error ? (
                                <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4" /> {error}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                  {text}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* Obligations & Deadlines (With Calendar Export) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Obligations & Key Deadlines</h3>
                  </div>
                  {data.obligations && data.obligations.length > 0 && (
                    <button
                      onClick={() => generateICS(data.obligations, 'Contract')}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition-colors font-bold border border-blue-100 dark:border-blue-800"
                    >
                      <Clock className="w-3 h-3" /> Add to Calendar
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {/* Missing Clauses Alert */}
                  {data.missingClauses && data.missingClauses.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-xl">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4" /> Missing Standard Clauses
                      </h4>
                      <ul className="space-y-1">
                        {data.missingClauses.map((clause, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> {clause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Image Viewer Modal */}
      {selectedInsight && imageUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500 ease-smooth"
            onClick={closeImageViewer}
          />
          <div className="relative w-full max-w-6xl h-[90vh] bg-slate-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in duration-300 ease-out border border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur border-b border-slate-800 z-10 absolute top-0 left-0 right-0">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                  <InsightIcon type={selectedInsight.type} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-3">
                    {selectedInsight.type || 'Insight'}
                    <span className="text-slate-500 text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                      {selectedIndex + 1} / {data.visualInsights?.length}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {zoom > 1 ? `Magnification: ${Math.round(zoom * 100)}%` : 'Interactive Zoom Enabled'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Navigation Buttons */}
                {data.visualInsights && data.visualInsights.length > 1 && (
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
                    <button
                      onClick={handlePrevInsight}
                      disabled={selectedIndex <= 0}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md disabled:opacity-30 transition-colors"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-px h-5 bg-slate-800 mx-0.5"></div>
                    <button
                      onClick={handleNextInsight}
                      disabled={selectedIndex >= (data.visualInsights?.length || 0) - 1}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md disabled:opacity-30 transition-colors"
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={closeImageViewer}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div
              className="flex-1 relative overflow-hidden bg-black flex items-center justify-center p-8 cursor-move select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={imageContainerRef}
            >
              <div
                className="relative inline-block transition-transform duration-300 ease-out origin-center will-change-transform"
                style={{
                  transform: `translate(${pan.x / zoom}px, ${pan.y / zoom}px) scale(${zoom})`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Original Document"
                  onLoad={() => focusOnInsight(selectedInsight)}
                  className="max-w-full max-h-[75vh] object-contain shadow-2xl"
                />
                {/* Bounding Box Overlay */}
                {selectedInsight.boundingBox && selectedInsight.boundingBox.length === 4 && (
                  <div
                    className="absolute border-2 border-purple-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-20 animate-pulse"
                    style={{
                      top: `${selectedInsight.boundingBox[0]}%`,
                      left: `${selectedInsight.boundingBox[1]}%`,
                      height: `${selectedInsight.boundingBox[2] - selectedInsight.boundingBox[0]}%`,
                      width: `${selectedInsight.boundingBox[3] - selectedInsight.boundingBox[1]}%`
                    }}
                  >
                    <div className="absolute -top-3 left-0 -translate-y-full">
                      <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-3 h-3" />
                        {selectedInsight.type || 'Insight Focus'}
                      </div>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-purple-600 ml-3"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hint Overlay when not zoomed */}
              {zoom === 1 && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-slate-900/80 text-slate-300 text-xs px-4 py-2 rounded-full pointer-events-none backdrop-blur border border-slate-700/50 flex items-center gap-2">
                  <Move className="w-3 h-3" />
                  <span>Drag to pan, use controls to zoom</span>
                </div>
              )}
            </div>

            {/* Footer & Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-end justify-between gap-8">
              <div className="flex-1 max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Analysis Finding</span>
                  <div className="h-px flex-1 bg-slate-800"></div>
                </div>
                <p className="text-white text-sm font-medium leading-relaxed">{selectedInsight.description}</p>
                <p className="text-slate-500 text-xs mt-1 font-mono">Relevance: {selectedInsight.relevance}</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-lg">
                  <button onClick={handleZoomOut} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={handleZoomIn} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={handleResetZoom} className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 text-xs font-medium transition-colors">
                  Reset View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Widget */}
      <ChatWidget analyzeParams={analyzeParams} analysisResult={data} />

      {/* Negotiation Modal */}
      {showNegotiationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                AI Negotiation Draft
              </h3>
              <button onClick={() => setShowNegotiationModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {negotiationEmail}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowNegotiationModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
              >
                Close
              </button>
              <button
                onClick={copyToClipboard}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisView;
