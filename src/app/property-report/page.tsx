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
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [hasCosts, setHasCosts] = useState<boolean>(false);
  const [image2, setImage2] = useState<string | File | null>(null)

  const [totalCosts, setTotalCosts] = useState(0);
  const [diyCost, setDiyCost] = useState<string>('');


  
  useEffect(() => {
    const now = new Date();
    if (!analysisData) {
      router.push('/');
    }

    console.log(analysisData);
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

      // setCosts(analysisData.estimated_costs)
      // setCosts([])
              if (analysisResult) {
        setDescription1(analysisResult.defect || '');
        setRecommendedAction(analysisResult.recommendation || '');
        setAnalysis(analysisResult.diy_option || '');

        console.log(analysisResult.estimated_costs)
        setTotalCosts((analysisResult.total_estimated_cost || 0));
        setDiyCost(String(analysisResult.diy_cost || ''));
        
        // Handle costs array
        if (analysisResult.estimated_costs && Array.isArray(analysisResult.estimated_costs)) {
          setCosts(analysisResult.estimated_costs);
          setHasCosts(analysisResult.estimated_costs.length > 0);
        } else {
          setCosts([]);
          setHasCosts(false);
        }
      }
  } else {
    // const [description, setDescription] = null;
  }

    console.log(costs);
  }, []);

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>No analysis data found. Redirecting...</div>
      </div>
    );
  }

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
  // const getTotalCost = (): string => {
  //   const totalCost = costs.find(cost => cost.type === 'total');
  //   return totalCost ? totalCost.amount : calculateTotal(); // fallback if no total provided
  // };

  // const calculateTotal = (): string => {
  //   const nonTotalCosts = costs.filter(cost => cost.type !== 'total');
  //   let total = 0;
    
  //   nonTotalCosts.forEach(cost => {
  //     const amount = parseFloat(cost.amount.replace(/[^\d.]/g, ''));
  //     if (!isNaN(amount)) {
  //       total += amount;
  //     }
  //   });
    
  //   return `$${total.toFixed(2)}`;
  // };

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
            <button className="back-btn" onClick={() => window.location.href = "/"}>
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
            <h2><i className="fas fa-exclamation-triangle icon"></i>Issue Identified</h2>
            <div className="description">
              <h3>{description}</h3>
              <p>{description1}</p>
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
                onError={(e) => {
                  console.error('Image failed to load');
                  // (e.target as HTMLImageElement).style.display = 'none';
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
            <p>{recommendedAction}.</p>
          </div>

          {/* <div className="diy-section">
            <h2><i className="fas fa-dollar-sign icon"></i>DIY Cost</h2>
            {diyCost && (
              <p><strong> ${diyCost}</strong></p>
            )}
            <br></br>
          </div> */}
          
          <div className="costs-section">
            <h2><i className="fas fa-dollar-sign icon"></i>Estimated Costs</h2>
            
            {costs
  .filter(cost => cost.type !== 'total')
  .map((cost, index) => (
    <div key={index} className="cost-item">
      <div className="cost-type">
        {cost.type === 'labor' ? (
          <>
            <strong>Labor Type:</strong> {capitalizeFirstLetter(cost.item)}
            <br />
            <strong>Hourly Rate:</strong> ${cost.unit_cost}
            <br />
            <strong>Hours Required:</strong> {cost.quantity}
            <br />
            <strong>Total Labor Cost:</strong> ${cost.total_cost}
          </>
        ) : (
          <>
            <strong>Material Item:</strong> {capitalizeFirstLetter(cost.item)}
            <br />
            <strong>Material Type:</strong> {cost.type}
            <br />
            <strong>Unit Cost:</strong> ${cost.unit_cost}
            <br />
            <strong>Quantity:</strong> {cost.quantity}
            <br />
            <strong>Total Material Cost:</strong> ${cost.total_cost}
          </>
        )}
      </div>
    </div>
  ))
}

            
            <div className="total-cost">
              Total Estimated Cost: ${totalCosts}
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