import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CostItem } from '@/types/llm';

interface AnalysisData {
  image: File | string | null;
  description: string;
  location: string;
  analysisResult: any | null;
  timestamp: number;
  // estimated_costs: CostItem[];
}

interface AnalysisState {
  analysisData: AnalysisData | null;
  setAnalysisData: (data: Omit<AnalysisData, 'timestamp'>) => void;
  updateAnalysisData: (data: AnalysisData) => void;
  clearAnalysisData: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      analysisData: null,
      setAnalysisData: (data) => {
        // Convert File to data URL before storing
        const processedData = { ...data };
        if (data.image instanceof File) {
          const reader = new FileReader();
          reader.onload = () => {
            set({
              analysisData: {
                ...processedData,
                image: reader.result as string,
                timestamp: Date.now()
              }
            });
          };
          reader.readAsDataURL(data.image);
        } else {
          set({
            analysisData: {
              ...processedData,
              timestamp: Date.now()
            }
          });
        }
      },
      updateAnalysisData: (data) => set({ analysisData: data }),
      clearAnalysisData: () => set({ analysisData: null }),
    }),
    {
      name: 'analysis-storage',
    }
  )
);