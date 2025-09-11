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
    },
    {
      id: 2,
      heading: "Kitchen Electrical Outlet Inspection",
      image: null,
      defect: "The kitchen outlets require GFCI protection for safety compliance. This is a critical safety issue that needs immediate attention.",
      location: "Kitchen",
      estimatedCosts: {
        materials: "GFCI outlets: $45",
        labor: "Licensed electrician services",
        estimatedTime: "2 hour(s)",
        totalLaborCost: "$120 per hour",
        divOption: "This repair requires intermediate electrical knowledge. Install GFCI outlets following local electrical codes and manufacturer guidelines. Always turn off power at the breaker before starting.",
        recommendation: "All kitchen outlets should be GFCI protected to prevent electrical hazards. This is required by electrical code and essential for safety.",
        totalEstimatedCost: "$285"
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
      <main className="py-8">
        {/* Heading with arrow color */}
        <div className="text-center mb-12">
          <h1 className={styles.mainHeading}>
            {reportData.heading}
          </h1>
        </div>

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
