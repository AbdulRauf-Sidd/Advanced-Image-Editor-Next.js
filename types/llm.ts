// types/analysis.ts (create this file)
export interface CostItem {
    type: string;
    description: string;
    amount: string;
  }
  
  export interface AnalysisResult {
    title?: string;
    description?: string;
    recommended_action?: string;
    costs?: CostItem[];
    analysis?: string;
  }