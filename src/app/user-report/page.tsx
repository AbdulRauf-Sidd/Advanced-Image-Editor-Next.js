"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';
import { CostItem } from '@/types/llm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './user-report.module.css';

interface UserProperty {
  name: string;
}

interface ReportData {
  heading: string;
  description: {
    heading: string;
    defect: string;
    location: string;
    estimatedCosts: {
      materials: string;
      labor: string;
      estimatedTime: string;
      totalLaborCost: string;
      divOption: string;
      recommendation: string;
      totalEstimatedCost: string;
    };
  };
}

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
    divOption: string;
    recommendation: string;
    totalEstimatedCost: string;
  };
}

export default function UserReport() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const { analysisData, clearAnalysisData } = useAnalysisStore();
  
  // User property data (this would come from backend)
  const [userProperty, setUserProperty] = useState<UserProperty>({
    name: "John Doe's Property" // This would be fetched from backend
  });
  
  // Report data (this would come from backend)
  const [reportData, setReportData] = useState<ReportData>({
    heading: "Laundry Room Electrical Safety", // This would come from backend
    description: {
      heading: "Laundry Room Electrical Safety",
      defect: "The receptacles in the laundry area should be GFCI protected. It is a safety hazard and should be corrected, protected by GFCI receptacles.",
      location: "Laundry Room",
      estimatedCosts: {
        materials: "GFCI receptacles: $30",
        labor: "Electrical contractor services",
        estimatedTime: "1 hour(s)",
        totalLaborCost: "$100 per hour",
        divOption: "This repair can be done by a homeowner with basic electrical knowledge. Replace the standard receptacles with GFCI receptacles following the manufacturer's instructions. Ensure power is turned off before starting. If unsure, consult a professional.",
        recommendation: "The receptacles in the laundry area should be GFCI protected. It is a safety hazard and should be corrected, protected by GFCI receptacles.",
        totalEstimatedCost: "$130"
      }
    }
  });

  const [image, setImage] = useState<string | File | null>(null);
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    {
      id: 1,
      heading: "Laundry Room Electrical Safety",
      image: null,
      defect: "The receptacles in the laundry area should be GFCI protected. It is a safety hazard and should be corrected, protected by GFCI receptacles.",
      location: "Laundry Room",
      estimatedCosts: {
        materials: "GFCI receptacles: $30",
        labor: "Electrical contractor services",
        estimatedTime: "1 hour(s)",
        totalLaborCost: "$100 per hour",
        divOption: "This repair can be done by a homeowner with basic electrical knowledge. Replace the standard receptacles with GFCI receptacles following the manufacturer's instructions. Ensure power is turned off before starting. If unsure, consult a professional.",
        recommendation: "The receptacles in the laundry area should be GFCI protected. It is a safety hazard and should be corrected, protected by GFCI receptacles.",
        totalEstimatedCost: "$130"
      }
    }
  ]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

    // Get image from analysis data if available
    if (analysisData?.image) {
      setImage(analysisData.image);
      // Update the first report section with the image
      setReportSections(prev => prev.map((section, index) => 
        index === 0 ? { ...section, image: analysisData.image } : section
      ));
    }

    // In a real application, you would fetch user property and report data from backend here
    // Example:
    // fetchUserProperty().then(setUserProperty);
    // fetchReportSections().then(setReportSections);
  }, [analysisData]);

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
                        {section.defect}, Location: {section.location}.
                      </p>
                    </div>

                    {/* Estimated Costs Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-dollar-sign"></i>
                        Estimated Costs
                      </h4>
                      <div className={styles.sectionContent}>
                        <p><strong>Materials:</strong> {section.estimatedCosts.materials}, <strong>Labor:</strong> {section.estimatedCosts.labor}, <strong>Estimated Time:</strong> {section.estimatedCosts.estimatedTime}, <strong>Total Labor Cost:</strong> {section.estimatedCosts.totalLaborCost}, <strong>DIY Option:</strong> {section.estimatedCosts.divOption}, <strong>Recommendation:</strong> {section.estimatedCosts.recommendation}, <strong>Total Estimated Cost:</strong> {section.estimatedCosts.totalEstimatedCost}.</p>
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
            onClick={generatePDF}
            className={`${styles.actionButton} ${styles.primaryButton}`}
          >
            <i className="fas fa-file-pdf mr-2"></i>
            Generate PDF Report
          </button>
          <button 
            onClick={() => router.push('/')}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Report
          </button>
        </div>
      </main>
    </div>
  );
}
