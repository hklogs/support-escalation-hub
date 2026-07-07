export interface Ticket {
  id: string;
  customerName: string;
  customerEmail: string;
  company: string;
  tier: 'Free' | 'SME' | 'Enterprise';
  subject: string;
  description: string;
  createdAt: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  sentiment: 'Frustrated' | 'Neutral' | 'Anxious' | 'Calm';
  logs: string[];
  environment: string;
  assignedTier?: 1 | 2 | 3;
  agentNotes?: string;
  agentResponse?: string;
  handoverSummary?: HandoverSummary;
}

export interface HandoverSummary {
  ticketId: string;
  customerImpact: string;
  defectSummary: string;
  troubleshootingPerformed: string[];
  rootCauseHypothesis: string;
  environmentSpecs: string;
  nextSteps: string;
}

export interface KBArticle {
  id: string;
  title: string;
  category: 'General' | 'Technical' | 'Known Error';
  content: string;
  steps?: string[];
}

export interface AgentAnalysisResponse {
  assignedTier: 1 | 2 | 3;
  sentiment: 'Frustrated' | 'Neutral' | 'Anxious' | 'Calm';
  agentNotes: string;
  agentResponse?: string;
  handoverSummary?: HandoverSummary;
}

export type NavTab = 'inbox' | 'queue' | 'kedb' | 'ingress' | 'settings';
