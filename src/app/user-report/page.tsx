"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';
import { CostItem } from '@/types/llm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './user-report.module.css';


interface ReportSection {
  id: number;
  heading: string;
  image: string | File | null;
  defect: string;
  location: string;
  estimatedCosts: {
    materials: string;
    labor: string;
    estimatedTime: string;
    totalLaborCost: string;
    recommendation: string;
    totalEstimatedCost: string;
  };
}

export default function UserReport() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const { analysisData } = useAnalysisStore();

  useEffect(() => {
    if (!analysisData) {
      router.push('/');
    }
  }, [analysisData, router]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  if (!analysisData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>No analysis data found. Redirecting...</div>
      </div>
    );
  }

  const { image, description, location, analysisResult } = analysisData;

  // Create report sections from analysis data
  const reportSections: ReportSection[] = [
    {
      id: 1,
      heading: analysisResult?.defect || "Property Analysis",
      image: image,
      defect: analysisResult?.defect || description || "No defect information available",
      location: location || "Location not specified",
      estimatedCosts: {
        materials: analysisResult?.materials_names ? `${analysisResult.materials_names}: $${analysisResult.materials_total_cost || '0'}` : "Materials not specified",
        labor: analysisResult?.labor_type || "Labor services not specified",
        estimatedTime: analysisResult?.hours_required ? `${analysisResult.hours_required} hour(s)` : "Time not specified",
        totalLaborCost: analysisResult?.labor_rate ? `$${analysisResult.labor_rate} per hour` : "Rate not specified",
        recommendation: analysisResult?.recommendation || "No specific recommendations available",
        totalEstimatedCost: analysisResult?.total_estimated_cost ? `$${analysisResult.total_estimated_cost}` : "Cost not calculated"
      }
    }
  ];

  const generatePDF = async () => {
    try {
      // Get the report section element
      const reportElement = document.querySelector(`.${styles.reportSection}`);
      
      if (!reportElement) {
        alert("Report content not found. Please try again.");
        return;
      }

      // Show loading state
      const button = document.querySelector(`.${styles.primaryButton}`) as HTMLButtonElement;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating PDF...';
      button.disabled = true;

      // Create canvas from the report element
      const canvas = await html2canvas(reportElement as HTMLElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit the content
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }


      // Save the PDF
      const fileName = `Property_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Reset button state
      button.innerHTML = originalText;
      button.disabled = false;

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert("Error generating PDF. Please try again.");
      
      // Reset button state
      const button = document.querySelector(`.${styles.primaryButton}`) as HTMLButtonElement;
      button.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>Generate PDF Report';
      button.disabled = false;
    }
  };

  return (
    <div className={styles.userReportContainer}>
      {/* Main Content */}
      <main className="py-8">
        {/* Report Sections Container */}
        <div className={styles.reportSectionsContainer}>
          {reportSections.map((section, index) => (
            <div key={section.id} className={styles.reportSection}>
              {/* Section Heading */}
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionHeadingText}>
                  {section.heading}
                </h2>
              </div>
              
              <div className={styles.contentGrid}>
                {/* Left Side - Image */}
                <div className={styles.imageSection}>
                  <h3 className={styles.imageTitle}>
                    <i className="fas fa-camera"></i>
                    Visual Evidence
                  </h3>
                  <div className={styles.imageContainer}>
                    {section.image ? (
                      <img 
                        src={typeof section.image === 'string' ? section.image : URL.createObjectURL(section.image)} 
                        alt="Property analysis" 
                        className={styles.propertyImage}
                        onError={(e) => {
                          console.error('Image failed to load');
                        }}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <i className="fas fa-image fa-3x mb-4"></i>
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Description */}
                <div className={styles.descriptionSection}>
                  <h3 className={styles.descriptionTitle}>
                    <i className="fas fa-clipboard-list"></i>
                    Analysis Details
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Defect Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-exclamation-triangle"></i>
                        Defect
                      </h4>
                      <p className={styles.sectionContent}>
                        {section.defect}
                      </p>
                    </div>

                    {/* Location Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-map-marker-alt"></i>
                        Location
                      </h4>
                      <p className={styles.sectionContent}>
                        {section.location}
                      </p>
                    </div>

                    {/* Estimated Costs Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-dollar-sign"></i>
                        Estimated Costs
                      </h4>
                      <div className={styles.sectionContent}>
                        <p><strong>Materials:</strong> {section.estimatedCosts.materials}, <strong>Labor:</strong> {section.estimatedCosts.labor}, <strong>Estimated Time:</strong> {section.estimatedCosts.estimatedTime}, <strong>Total Labor Cost:</strong> {section.estimatedCosts.totalLaborCost}, <strong>Recommendation:</strong> {section.estimatedCosts.recommendation}, <strong>Total Estimated Cost:</strong> {section.estimatedCosts.totalEstimatedCost}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button 
            onClick={() => router.push('/')}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <button 
            onClick={generatePDF}
            className={`${styles.actionButton} ${styles.primaryButton}`}
          >
            <i className="fas fa-file-pdf mr-2"></i>
            Generate PDF Report
          </button>
        </div>
      </main>
    </div>
  );
}
