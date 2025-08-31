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
      setAnalysisData: (data) => set({
        analysisData: {
          ...data,
          timestamp: Date.now()
        }
      }),
      clearAnalysisData: () => set({ analysisData: null }),
    }),
    {
      name: 'analysis-storage',
      // Convert File objects to string for storage
      serialize: (state) => {
        if (state.analysisData?.image instanceof File) {
          // Convert File to object that can be serialized
          const file = state.analysisData.image;
          return JSON.stringify({
            ...state,
            analysisData: {
              ...state.analysisData,
              image: {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                // We'll store as data URL in the component instead
              }
            }
          });
        }
        return JSON.stringify(state);
      }
    }
  )
);