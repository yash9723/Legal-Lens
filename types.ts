
export interface ContractSnapshotItem {
  label: string;
  value: string;
}

export interface KeyClause {
  title: string;
  explanation: string;
}

export interface Risk {
  level: 'High' | 'Medium' | 'Low';
  description: string;
  consequence: string;
  favors: string;
}

export interface NegotiationPoint {
  clause: string;
  issue: string;
  suggestion: string; // The specific language or change to ask for
  rationale: string; // The "Why" behind the suggestion
}

export interface Obligation {
  task: string;
  deadline: string;
  penalty: string;
}

export interface Verdict {
  status: 'Safe' | 'Negotiate' | 'High Risk';
  explanation: string;
}

export interface VisualInsight {
  type: string; // e.g., "Signature", "Handwritten Note", "Stamp", "Strikethrough", "Highlight"
  description: string;
  relevance: string;
  boundingBox?: number[];
}

export interface AnalysisResult {
  oneLineOverview: string;
  contractSnapshot: ContractSnapshotItem[];
  keyClauses: KeyClause[];
  risks: Risk[];
  negotiationPoints: NegotiationPoint[];
  obligations: Obligation[];
  missingClauses: string[]; // New field for missing standard clauses
  governingLaw?: string; // New field for Jurisdiction Intelligence
  disputeResolution?: string; // New field for Jurisdiction Intelligence
  transactionValue?: string; // New: For Stamp Duty Calculation
  indianLegalCompliance?: { // New: For Act 1872 checks
    stampDutyApplicable: boolean;
    statutoryWarnings: string[];
  };
  moneyAndExit: string;
  verdict: Verdict;
  scanQuality?: string;
  visualInsights?: VisualInsight[];
}

export interface SavedAnalysis {
  id: string;
  userId: string | null; // null for guest
  fileName: string;
  date: string;
  timestamp: number;
  result: AnalysisResult;
  type: 'text' | 'image';
  previewText?: string; // Short snippet for list view
}

export interface PricingTier {
  name: string;
  price: string;
  target: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  color: string;
  details: string; // New field for robust pricing details
}

export interface UserProfile {
  id: string; // Added to support backend ID
  name: string;
  email: string;
  plan: 'Free' | 'Starter' | 'Professional' | 'Team';
  joinedDate: string;
  documentsAnalyzed: number;
  avatarUrl?: string;
  isTwoFactorEnabled?: boolean;
}

export interface AnalyzeParams {
  type: 'text' | 'image';
  content: string | string[]; // Text string or Base64 string (or array of Base64 strings)
  mimeType?: string;
  outputLanguage?: string;
  inputLanguage?: string;
  fileName?: string; // Optional filename for history tracking
}

// --- Case Analysis Types ---

export type CaseType = 'FIR' | 'Petition' | 'Judgment' | 'Affidavit' | 'Charge Sheet' | 'Appeal' | 'Other';

export interface CaseParty {
  name: string;
  role: string; // e.g., "Complainant", "Defendant", "Witness", "Judge", "Advocate"
  details: string;
}

export interface CaseTimelineEvent {
  date: string;
  event: string;
  significance: string;
}

export interface LegalIssue {
  issue: string;
  relevantLaw: string;
  analysis: string;
}

export interface CasePrecedent {
  caseName: string;
  citation: string;
  relevance: string;
  favorsSide: string; // "Prosecution/Petitioner" | "Defense/Respondent" | "Neutral"
}

export interface CaseArgument {
  point: string;
  strength: 'Strong' | 'Moderate' | 'Weak';
  explanation: string;
}

export interface CaseStrengthWeakness {
  type: 'strength' | 'weakness';
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface CaseStrategy {
  action: string;
  priority: 'Immediate' | 'Short-term' | 'Long-term';
  details: string;
}

export interface CaseOutcomePrediction {
  likelihood: string; // e.g., "Favorable", "Unfavorable", "Uncertain"
  confidence: number; // 0-100
  reasoning: string;
}

export interface CaseAnalysisResult {
  caseSummary: string;
  caseType: string;
  caseNumber?: string;
  courtName?: string;
  filingDate?: string;
  parties: CaseParty[];
  timeline: CaseTimelineEvent[];
  legalIssues: LegalIssue[];
  prosecutionArguments: CaseArgument[];
  defenseArguments: CaseArgument[];
  citedPrecedents: CasePrecedent[];
  prosecutionStrengths: CaseStrengthWeakness[];
  prosecutionWeaknesses: CaseStrengthWeakness[];
  defenseStrengths: CaseStrengthWeakness[];
  defenseWeaknesses: CaseStrengthWeakness[];
  recommendedStrategy: CaseStrategy[];
  outcomePrediction: CaseOutcomePrediction;
}

export interface CaseAnalyzeParams {
  type: 'text' | 'image';
  content: string | string[];
  mimeType?: string;
  caseType: CaseType;
  fileName?: string;
}
