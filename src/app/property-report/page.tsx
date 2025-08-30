"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PropertyReport() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set current date
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  // PDF generation function (placeholder)
  const generatePDF = () => {
    alert("PDF generation functionality would be implemented here. This might connect to a PDF generation service or use a library like jsPDF.");
    // In a real implementation, this would:
    // 1. Use a library like jsPDF or pdfmake to generate PDF
    // 2. Or send a request to a server-side PDF generation service
    // 3. Format the content for print and download the PDF
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
            <h2><i className="fas fa-exclamation-triangle icon"></i>Issue Identified</h2>
            <div className="description">
              <h3>Trim Rot at Exterior Door</h3>
              <p>There is visible rot on the trim at the exterior door, indicating moisture damage.</p>
            </div>
          </div>
          
          <div className="image-section">
            <h2><i className="fas fa-camera icon"></i>Visual Evidence</h2>
            <div className="image-container">
              <div className="image-placeholder">
                <i className="fas fa-image fa-3x" style={{marginRight: '10px'}}></i>
                <span>Image of damaged exterior door trim</span>
              </div>
            </div>
            <p className="image-caption">Figure 1: Visible rot and moisture damage on the exterior door trim</p>
          </div>
          
          <div className="action-section">
            <h2><i className="fas fa-tools icon"></i>Recommended Action</h2>
            <p>Remove and replace the affected trim section. Ensure proper sealing and painting to prevent future moisture intrusion.</p>
          </div>
          
          <div className="costs-section">
            <h2><i className="fas fa-dollar-sign icon"></i>Estimated Costs</h2>
            
            <div className="cost-item">
              <div className="cost-type">
                <i className="fas fa-paint-roller"></i> Materials
                <div className="cost-desc">Replacement trim and sealant</div>
              </div>
              <div className="cost-amount">$50.00</div>
            </div>
            
            <div className="cost-item">
              <div className="cost-type">
                <i className="fas fa-user-hard-hat"></i> Labor
                <div className="cost-desc">Approximately 2 hours at $50/hour</div>
              </div>
              <div className="cost-amount">$100.00</div>
            </div>
            
            <div className="cost-item">
              <div className="cost-type">
                <i className="fas fa-calculator"></i> Total
                <div className="cost-desc">Sum of materials and labor</div>
              </div>
              <div className="cost-amount">$150.00</div>
            </div>
            
            <div className="total-cost">
              Total Estimated Cost: $150.00
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
