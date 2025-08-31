import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalysisData {
  image: File | string | null;
  description: string;
  location: string;
  analysisResult: any | null;
  timestamp: number;
}

interface AnalysisState {
  analysisData: AnalysisData | null;
  setAnalysisData: (data: Omit<AnalysisData, 'timestamp'>) => void;
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
      clearAnalysisData: () => set({ analysisData: null }),
    }),
    {
      name: 'analysis-storage',
    }
  )
);