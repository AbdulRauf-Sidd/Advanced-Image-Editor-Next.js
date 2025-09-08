"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';

export default function PropertyReportBasic() {
  const router = useRouter();
  const { analysisData, clearAnalysisData } = useAnalysisStore();

  useEffect(() => {
    if (!analysisData) {
      router.push('/');
    }
  }, [analysisData, router]);

  if (!analysisData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>No analysis data found. Redirecting...</div>
      </div>
    );
  }

  const { image, description, location, analysisResult } = analysisData;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        PROPERTY REPORT - RAW DATA
      </h1>
      
      <button 
        onClick={() => router.push('/')}
        style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer' }}
      >
        ← Back to Home
      </button>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>IMAGE INFO:</h2>
        {image ? (
          <div>
            <img 
              src={typeof image === 'string' ? image : URL.createObjectURL(image)} 
              alt="Analysis" 
              style={{ maxWidth: '300px', border: '1px solid #ccc' }}
            />
          </div>
        ) : (
          <p>No image available</p>
        )}
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>DESCRIPTION:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          border: '1px solid #ddd',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {description || 'No description provided'}
        </pre>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>LOCATION:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          border: '1px solid #ddd' 
        }}>
          {location || 'No location specified'}
        </pre>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>ANALYSIS RESULT (RAW JSON):</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          border: '1px solid #ddd',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          {JSON.stringify(analysisResult, null, 2)}
        </pre>
      </div>
      
      {analysisResult && (
        <div style={{ marginBottom: '30px' }}>
          <h2>EXTRACTED VALUES:</h2>
          <div style={{ background: '#f0f8ff', padding: '15px', border: '1px solid #b3d9ff' }}>
            <h3>Defect:</h3>
            <p>{analysisResult.defect || 'Not specified'}</p>
            
            <h3>Recommendation:</h3>
            <p>{analysisResult.recommendation || 'Not specified'}</p>
            
            <h3>Materials:</h3>
            <p>{analysisResult.materials_names || 'Not specified'}</p>
            <p>Cost: ${analysisResult.materials_total_cost || '0'}</p>
            
            <h3>Labor:</h3>
            <p>Type: {analysisResult.labor_type || 'Not specified'}</p>
            <p>Rate: ${analysisResult.labor_rate || '0'}/hour</p>
            <p>Hours: {analysisResult.hours_required || '0'}</p>
            <p>Labor Cost: ${(analysisResult.labor_rate || 0) * (analysisResult.hours_required || 0)}</p>
            
            <h3>Total Estimated Cost:</h3>
            <p>${analysisResult.total_estimated_cost || '0'}</p>
        
          </div>
        </div>
      )}
      
      <button 
        onClick={clearAnalysisData}
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#ffcccc', 
          border: '1px solid #ff0000',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Clear Data
      </button>
    </div>
  );
}