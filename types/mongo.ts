export interface Inspection {
  _id?: string;
  id?: string;
  name: string;
  status: string;
  date: Date | string;
}

export interface Defect {
  _id?: string;
  id?: string;
  inspection_id: string;
  image_url: string;
  location: string;
  section: string;
  subsection: string;
  defect_description: string;
  material_names: string[];
  material_total_cost: number;
  labor_type: string;
  labor_rate: number;
  hours_required: number;
  recommendation: string;
}