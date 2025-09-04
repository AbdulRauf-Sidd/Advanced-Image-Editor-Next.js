// types/analysis.ts (create this file)
export interface CostItem {
  item: string;
  type: 'material' | 'labor' | string;
  unit_cost: string | number;
  quantity: number;
  total_cost: string | number;
}

export interface AnalysisResult {
  defect?: string;
  estimated_costs?: CostItem[];
  diy_option?: string;
  diy_cost?: string | number;
  recommendation?: string;
  total_estimated_cost?: string | number;
  analysis?: string;
}