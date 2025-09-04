"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';
import { CostItem } from '@/types/llm';


export default function PropertyReport() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const { analysisData, clearAnalysisData } = useAnalysisStore();

  const [title, setTitle] = useState<string>('');
  const [description1, setDescription1] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [recommendedAction, setRecommendedAction] = useState<string>('');
  const [diyOption, setDiyOption] = useState<string>('');
  const [defect, setDefect] = useState<string>('');
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [hasCosts, setHasCosts] = useState<boolean>(false);
  const [image2, setImage2] = useState<string | File | null>(null)


  
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    
    // console.log(description, location, analysisResult);
    if (analysisData) {
      console.log("analysis", analysisData);
      const { image, description, location, analysisResult } = analysisData;
      setDescription(description);
      setImage2(image);
      if (analysisResult) {
        setTitle(analysisResult.title || '');
        setDescription1(analysisResult.description || '');
        setRecommendedAction(analysisResult.recommendation || '');
        setDiyOption(analysisResult.diy_option || '');
        setDefect(analysisResult.defect || '');
        setAnalysis(analysisResult.analysis || '');

        // Handle costs array - use estimated_costs from backend
        if (analysisResult.estimated_costs && Array.isArray(analysisResult.estimated_costs)) {
          setCosts(analysisResult.estimated_costs);
          setHasCosts(analysisResult.estimated_costs.length > 0);
        } else {
          setCosts([]);
          setHasCosts(false);
        }
      }
  }

    console.log(costs);
  }, []);

  // if (!analysisData) {
  //   return (
  //     <div className="property-report-container">
  //       <div className="container">
  //         <header>
  //           <div className="header-content">
  //             <button className="back-btn" onClick={() => router.push('/')}>
  //               <i className="fas fa-arrow-left"></i>
  //               <span>Back to Editor</span>
  //             </button>
  //             <div className="header-main">
  //               <h1><i className="fas fa-home icon"></i>Property Repair Report</h1>
  //               <p className="subtitle">Professional Assessment & Cost Estimation</p>
  //             </div>
  //           </div>
  //         </header>
          
  //         <div className="content">
  //           <div className="issue-section">
  //             <h2><i className="fas fa-info-circle icon"></i>No Analysis Data</h2>
  //             <div className="description">
  //               <h3>No property analysis has been completed yet.</h3>
  //               <p>To generate a property repair report, please:</p>
  //               <ol style={{ marginTop: '15px', paddingLeft: '20px' }}>
  //                 <li>Upload an image of the property issue</li>
  //                 <li>Add a description of the problem</li>
  //                 <li>Select a location</li>
  //                 <li>Submit the image for analysis</li>
  //               </ol>
  //               <div style={{ marginTop: '20px', textAlign: 'center' }}>
  //                 <button 
  //                   className="submit-btn" 
  //                   onClick={() => router.push('/')}
  //                   style={{ 
  //                     background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
  //                     color: 'white',
  //                     border: 'none',
  //                     padding: '12px 24px',
  //                     borderRadius: '8px',
  //                     fontSize: '16px',
  //                     fontWeight: '600',
  //                     cursor: 'pointer',
  //                     transition: 'all 0.3s ease'
  //                   }}
  //                 >
  //                   <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
  //                   Go to Image Editor
  //                 </button>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
          
  //         <footer>
  //           <p>© 2023 Property Repair Experts | Report generated on {currentDate}</p>
  //         </footer>
  //       </div>
  //     </div>
  //   );
  // }

  const getCostIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      materials: 'fas fa-paint-roller',
      labor: 'fas fa-user-hard-hat',
      equipment: 'fas fa-tools',
      permit: 'fas fa-file-alt',
      disposal: 'fas fa-trash-alt',
      transportation: 'fas fa-truck',
      // Add more mappings as needed
    };
    
    return iconMap[type] || 'fas fa-dollar-sign'; // default icon
  };
  
  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  // Helper function to get total cost
  const getTotalCost = (): string => {
    let total = 0;
    
    costs.forEach(cost => {
      if (cost.total_cost && typeof cost.total_cost === 'number') {
        total += cost.total_cost;
      }
    });
    
    return `$${total.toFixed(2)}`;
  };

  // const { image, location, analysisResult } = analysisData;
  // const { image, location } = analysisData;

  const generatePDF = () => {
    alert("PDF generation functionality would be implemented here. This might connect to a PDF generation service or use a library like jsPDF.");
  };

  return (
    <div className="property-report-container">
      <div className="container">
        <header>
          <div className="header-content">
            <button className="back-btn" onClick={() => router.push('/')}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Editor</span>
            </button>
            <div className="header-main">
              <h1><i className="fas fa-home icon"></i>Property Repair Report</h1>
              <p className="subtitle">Professional Assessment & Cost Estimation</p>
            </div>
          </div>
        </header>
        
        <div className="content">
          <div className="issue-section">
             <h2><i className="fas fa-exclamation-triangle icon"></i>Defect (Issue Identified)</h2>
            <div className="description">
              <h3>{defect || 'No defect information available'}</h3>
            </div>
          </div>
          
          <div className="image-section">
          <h2><i className="fas fa-camera icon"></i>Visual Evidence</h2>
          <div className="image-container">
            {/* Replace the placeholder with actual image */}
            {image2 ? (
              <img 
                src={typeof image2 === 'string' ? image2 : URL.createObjectURL(image2)} 
                alt="Damage analysis" 
                className="uploaded-image"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div className="image-placeholder">
                <i className="fas fa-image fa-3x" style={{marginRight: '10px'}}></i>
                <span>Image of damaged exterior door trim</span>
              </div>
            )}
          </div>
          <p className="image-caption">Figure 1: {description}</p>
        </div>
          
          <div className="action-section">
            <h2><i className="fas fa-tools icon"></i>Recommended Action</h2>
            <p>{recommendedAction || 'No recommendation available'}</p>
          </div>
          
          <div className="diy-section">
            <h2><i className="fas fa-hammer icon"></i>DIY Option (Extra Info)</h2>
            <p>{diyOption || 'No DIY option information available'}</p>
          </div>
          
          <div className="costs-section">
            <h2><i className="fas fa-dollar-sign icon"></i>Estimated Costs</h2>
            
             {costs.length > 0 ? (
               costs.map((cost, index) => (
                <div key={index} className="cost-item">
                  <div className="cost-type">
                    <i className={getCostIcon(cost.type)}></i>
                     {cost.item}
                     <div className="cost-desc">
                       {cost.type} - ${cost.unit_cost} × {cost.quantity}
                     </div>
                   </div>
                   <div className="cost-amount">${cost.total_cost}</div>
                 </div>
               ))
             ) : (
               // Show 3 default placeholder items
               [1, 2, 3].map((itemIndex) => (
                 <div key={itemIndex} className="cost-item default-cost-item">
                   <div className="cost-type">
                     <div className="default-cost-details">
                       <div className="cost-row">
                         <span className="cost-label"><strong>Item:</strong></span>
                         <span className="cost-value">Not specified</span>
                       </div>
                       <div className="cost-row">
                         <span className="cost-label"><strong>Type:</strong></span>
                         <span className="cost-value">Not specified</span>
                       </div>
                       <div className="cost-row">
                         <span className="cost-label"><strong>Unit Cost:</strong></span>
                         <span className="cost-value">$0</span>
                       </div>
                       <div className="cost-row">
                         <span className="cost-label"><strong>Quantity:</strong></span>
                         <span className="cost-value">0</span>
                       </div>
                       <div className="cost-row">
                         <span className="cost-label"><strong>Total Cost:</strong></span>
                         <span className="cost-value">$0</span>
                       </div>
                     </div>
                  </div>
                </div>
              ))
             )}
            
            <div className="total-cost">
               Total Estimated Cost: {costs.length > 0 ? getTotalCost() : '$0.00'}
            </div>
          </div>
          
          <button className="pdf-button" onClick={generatePDF}>
            <i className="fas fa-file-pdf"></i> Generate PDF Report
          </button>
        </div>
        
        <footer>
          <p>© 2023 Property Repair Experts | Report generated on {currentDate}</p>
        </footer>
      </div>
    </div>
  );
}
