"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysisStore } from '@/lib/store';
import { CostItem } from '@/types/llm';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    defect: '',
    location: '',
    materials: '',
    labor: '',
    estimatedTime: '',
    totalLaborCost: '',
    recommendation: '',
    totalEstimatedCost: ''
  });
  const { analysisData, updateAnalysisData } = useAnalysisStore();

  useEffect(() => {
    if (!analysisData) {
      router.push('/');
    } else {
      // Initialize edited data with current analysis data
      const { analysisResult } = analysisData;
      setEditedData({
        defect: analysisResult?.defect || '',
        location: analysisData.location || '',
        materials: analysisResult?.materials_names ? `${analysisResult.materials_names}: $${analysisResult.materials_total_cost || '0'}` : '',
        labor: analysisResult?.labor_type || '',
        estimatedTime: analysisResult?.hours_required ? `${analysisResult.hours_required} hour(s)` : '',
        totalLaborCost: analysisResult?.labor_rate ? `$${analysisResult.labor_rate} per hour` : '',
        recommendation: analysisResult?.recommendation || '',
        totalEstimatedCost: analysisResult?.total_estimated_cost ? `$${analysisResult.total_estimated_cost}` : ''
      });
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Update the analysis data with edited values
    if (analysisData) {
      const updatedAnalysisData = {
        ...analysisData,
        location: editedData.location,
        analysisResult: {
          ...analysisData.analysisResult,
          defect: editedData.defect,
          recommendation: editedData.recommendation,
          materials_names: editedData.materials.split(':')[0] || '',
          materials_total_cost: editedData.materials.split('$')[1] || '0',
          labor_type: editedData.labor,
          hours_required: editedData.estimatedTime.split(' ')[0] || '0',
          labor_rate: editedData.totalLaborCost.split('$')[1]?.split(' ')[0] || '0',
          total_estimated_cost: editedData.totalEstimatedCost.split('$')[1] || '0'
        }
      };
      updateAnalysisData(updatedAnalysisData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset edited data to original values
    if (analysisData) {
      const { analysisResult } = analysisData;
      setEditedData({
        defect: analysisResult?.defect || '',
        location: analysisData.location || '',
        materials: analysisResult?.materials_names ? `${analysisResult.materials_names}: $${analysisResult.materials_total_cost || '0'}` : '',
        labor: analysisResult?.labor_type || '',
        estimatedTime: analysisResult?.hours_required ? `${analysisResult.hours_required} hour(s)` : '',
        totalLaborCost: analysisResult?.labor_rate ? `$${analysisResult.labor_rate} per hour` : '',
        recommendation: analysisResult?.recommendation || '',
        totalEstimatedCost: analysisResult?.total_estimated_cost ? `$${analysisResult.total_estimated_cost}` : ''
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveReport = () => {
    console.log('Save Report clicked!');
    console.log('Current analysis data:', analysisData);
    console.log('Edited data:', editedData);
    console.log('Report saved successfully!');
  };

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
      heading: isEditing ? editedData.defect || "Property Analysis" : (analysisResult?.defect || "Property Analysis"),
      image: image,
      defect: isEditing ? editedData.defect : (analysisResult?.defect || description || "No defect information available"),
      location: isEditing ? editedData.location : (location || "Location not specified"),
      estimatedCosts: {
        materials: isEditing ? editedData.materials : (analysisResult?.materials_names ? `${analysisResult.materials_names}: $${analysisResult.materials_total_cost || '0'}` : "Materials not specified"),
        labor: isEditing ? editedData.labor : (analysisResult?.labor_type || "Labor services not specified"),
        estimatedTime: isEditing ? editedData.estimatedTime : (analysisResult?.hours_required ? `${analysisResult.hours_required} hour(s)` : "Time not specified"),
        totalLaborCost: isEditing ? editedData.totalLaborCost : (analysisResult?.labor_rate ? `$${analysisResult.labor_rate} per hour` : "Rate not specified"),
        recommendation: isEditing ? editedData.recommendation : (analysisResult?.recommendation || "No specific recommendations available"),
        totalEstimatedCost: isEditing ? editedData.totalEstimatedCost : (analysisResult?.total_estimated_cost ? `$${analysisResult.total_estimated_cost}` : "Cost not calculated")
      }
    }
  ];


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
                      {isEditing ? (
                        <textarea
                          className={styles.editableText}
                          value={editedData.defect}
                          onChange={(e) => handleInputChange('defect', e.target.value)}
                          placeholder="Enter defect description..."
                        />
                      ) : (
                      <p className={styles.sectionContent}>
                        {section.defect}
                      </p>
                      )}
                    </div>

                    {/* Location Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-map-marker-alt"></i>
                        Location
                      </h4>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editableInput}
                          value={editedData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Enter location..."
                        />
                      ) : (
                      <p className={styles.sectionContent}>
                        {section.location}
                      </p>
                      )}
                    </div>

                    {/* Estimated Costs Section */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>
                        <i className="fas fa-dollar-sign"></i>
                        Estimated Costs
                      </h4>
                      <div className={styles.sectionContent}>
                        {isEditing ? (
                          <div className={styles.editableCosts}>
                            <div className={styles.costEditRow}>
                              <label>Materials:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.materials}
                                onChange={(e) => handleInputChange('materials', e.target.value)}
                                placeholder="e.g., Wood trim, finishing nails: $45"
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Labor:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.labor}
                                onChange={(e) => handleInputChange('labor', e.target.value)}
                                placeholder="e.g., Carpentry"
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Estimated Time:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.estimatedTime}
                                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                                placeholder="e.g., 1 hour(s)"
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Total Labor Cost:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.totalLaborCost}
                                onChange={(e) => handleInputChange('totalLaborCost', e.target.value)}
                                placeholder="e.g., $60 per hour"
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Recommendation:</label>
                              <textarea
                                className={styles.editableText}
                                value={editedData.recommendation}
                                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                                placeholder="Enter recommendation..."
                                rows={3}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Total Estimated Cost:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.totalEstimatedCost}
                                onChange={(e) => handleInputChange('totalEstimatedCost', e.target.value)}
                                placeholder="e.g., $105"
                              />
                            </div>
                          </div>
                        ) : (
                        <p><strong>Materials:</strong> {section.estimatedCosts.materials}, <strong>Labor:</strong> {section.estimatedCosts.labor}, <strong>Estimated Time:</strong> {section.estimatedCosts.estimatedTime}, <strong>Total Labor Cost:</strong> {section.estimatedCosts.totalLaborCost}, <strong>Recommendation:</strong> {section.estimatedCosts.recommendation}, <strong>Total Estimated Cost:</strong> {section.estimatedCosts.totalEstimatedCost}.</p>
                        )}
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
          
          {!isEditing ? (
            <button 
              onClick={handleEdit}
              className={`${styles.actionButton} ${styles.editButton}`}
            >
              <i className="fas fa-edit mr-2"></i>
              Edit
            </button>
          ) : (
            <>
              <button 
                onClick={handleCancel}
                className={`${styles.actionButton} ${styles.cancelButton}`}
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className={`${styles.actionButton} ${styles.saveButton}`}
              >
                <i className="fas fa-save mr-2"></i>
                Save
              </button>
            </>
          )}
          
          <button 
            onClick={handleSaveReport}
            className={`${styles.actionButton} ${styles.saveReportButton}`}
          >
            <i className="fas fa-save mr-2"></i>
            Save Report
          </button>
        </div>
      </main>
    </div>
  );
}
