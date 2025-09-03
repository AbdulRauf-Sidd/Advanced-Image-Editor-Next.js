// types/analysis.ts (create this file)
export interface CostItem {
    item: string;
    type: string;
    unit_cost: number;
    quantity: number;
    total_cost: number;
  }
  
  export interface AnalysisResult {
    title?: string;
    description?: string;
    recommended_action?: string;
    costs?: CostItem[];
    analysis?: string;
  }