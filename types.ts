
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
