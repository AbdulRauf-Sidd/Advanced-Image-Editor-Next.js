import { create } from 'zustand';
import { persist } from 'zustand/middleware';

  interface AnalysisData {
    inspectionId: string;
    imageFile: File;
    image: File | string | null;
    description: string;
    location: string;
    section: string;
    subSection: string;
    analysisResult: any;
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