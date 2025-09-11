"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';
import { CostItem } from '@/types/llm';
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
    }

    // In a real application, you would fetch user property and report data from backend here
    // Example:
    // fetchUserProperty().then(setUserProperty);
    // fetchReportData().then(setReportData);
  }, [analysisData]);

  const generatePDF = () => {
    alert("PDF generation functionality would be implemented here.");
  };

  return (
    <div className={styles.userReportContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={styles.headerContent}>
            <button 
              onClick={() => router.push('/')}
              className={styles.backButton}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              <span>Back to Editor</span>
            </button>
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{userProperty.name}</h1>
              <p className={styles.reportDate}>Report generated on {currentDate}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Heading with arrow color */}
        <div className="mb-8">
          <h1 className={styles.mainHeading}>
            {reportData.heading}
          </h1>
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Left Side - Image */}
          <div className={styles.imageSection}>
            <h2 className={styles.imageTitle}>
              <i className="fas fa-camera"></i>
              Visual Evidence
            </h2>
            <div className={styles.imageContainer}>
              {image ? (
                <img 
                  src={typeof image === 'string' ? image : URL.createObjectURL(image)} 
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
            <h2 className={styles.descriptionTitle}>
              <i className="fas fa-clipboard-list"></i>
              Analysis Details
            </h2>
            
            <div className="space-y-6">
              {/* Defect Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-exclamation-triangle"></i>
                  Defect
                </h3>
                <p className={styles.sectionContent}>{reportData.description.defect}</p>
              </div>

              {/* Location Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-map-marker-alt"></i>
                  Location
                </h3>
                <p className={styles.sectionContent}>{reportData.description.location}</p>
              </div>

              {/* Estimated Costs Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-dollar-sign"></i>
                  Estimated Costs
                </h3>
                <div className={styles.sectionContent}>
                  <p><strong>Materials:</strong> {reportData.description.estimatedCosts.materials}</p>
                  <p><strong>Labor:</strong> {reportData.description.estimatedCosts.labor}</p>
                  <p><strong>Estimated Time:</strong> {reportData.description.estimatedCosts.estimatedTime}</p>
                  <p><strong>Total Labor Cost:</strong> {reportData.description.estimatedCosts.totalLaborCost}</p>
                </div>
              </div>

              {/* DIY Option Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-tools"></i>
                  DIY Option
                </h3>
                <p className={styles.sectionContent}>{reportData.description.estimatedCosts.divOption}</p>
              </div>

              {/* Recommendation Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-lightbulb"></i>
                  Recommendation
                </h3>
                <p className={styles.sectionContent}>{reportData.description.estimatedCosts.recommendation}</p>
              </div>

              {/* Total Cost */}
              <div className={styles.costHighlight}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-calculator"></i>
                  Total Estimated Cost
                </h3>
                <p className={styles.totalCost}>
                  {reportData.description.estimatedCosts.totalEstimatedCost}
                </p>
              </div>
            </div>
          </div>
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

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={styles.footerContent}>
            © 2024 Property Repair Experts | Report generated on {currentDate}
          </p>
        </div>
      </footer>
    </div>
  );
}
