"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/lib/store";
import styles from "./user-report.module.css";

interface ReportSection {
  id: number;
  heading: string;
  image: string | File | null;
  defect: string;
  location: string;
  section: string;
  subSection: string;
  estimatedCosts: {
    materials: string;
    materialsCost: number;
    labor: string;
    laborRate: number;
    hoursRequired: number;
    recommendation: string;
    totalEstimatedCost: number;
  };
}

export default function UserReport() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    defect: "",
    location: "",
    materials: "",
    materialsCost: 0,
    labor: "",
    laborRate: 0,
    hoursRequired: 0,
    recommendation: "",
    totalEstimatedCost: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { analysisData, updateAnalysisData } = useAnalysisStore();

  // Initialize from store
  useEffect(() => {
    if (!analysisData) {
      router.push("/");
    } else {
      const { analysisResult } = analysisData;
      setEditedData({
        defect: analysisResult?.defect || "",
        location: analysisData.location || "",
        materials: analysisResult?.materials_names || "",
        materialsCost: Number(analysisResult?.materials_total_cost) || 0,
        labor: analysisResult?.labor_type || "",
        laborRate: Number(analysisResult?.labor_rate) || 0,
        hoursRequired: Number(analysisResult?.hours_required) || 0,
        recommendation: analysisResult?.recommendation || "",
        totalEstimatedCost: Number(analysisResult?.total_estimated_cost) || 0,
      });
    }
  }, [analysisData, router]);

  // Set current date
  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Auto-calc total cost
  useEffect(() => {
    const totalLaborCost = editedData.hoursRequired * editedData.laborRate;
    const total = editedData.materialsCost + totalLaborCost;
    setEditedData((prev) => ({
      ...prev,
      totalEstimatedCost: total,
    }));
  }, [editedData.materialsCost, editedData.hoursRequired, editedData.laborRate]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    if (analysisData) {
      const updatedAnalysisData = {
        ...analysisData,
        location: editedData.location,
        analysisResult: {
          ...analysisData.analysisResult,
          defect: editedData.defect,
          recommendation: editedData.recommendation,
          materials_names: editedData.materials,
          materials_total_cost: editedData.materialsCost,
          labor_type: editedData.labor,
          hours_required: editedData.hoursRequired,
          labor_rate: editedData.laborRate,
          total_estimated_cost: editedData.totalEstimatedCost,
        },
      };
      updateAnalysisData(updatedAnalysisData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (analysisData) {
      const { analysisResult } = analysisData;
      setEditedData({
        defect: analysisResult?.defect || "",
        location: analysisData.location || "",
        materials: analysisResult?.materials_names || "",
        materialsCost: Number(analysisResult?.materials_total_cost) || 0,
        labor: analysisResult?.labor_type || "",
        laborRate: Number(analysisResult?.labor_rate) || 0,
        hoursRequired: Number(analysisResult?.hours_required) || 0,
        recommendation: analysisResult?.recommendation || "",
        totalEstimatedCost: Number(analysisResult?.total_estimated_cost) || 0,
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveReport = async () => {
    if (isSubmitting) {
      return
    } else {
      setIsSubmitting(true)
    }
    console.log("Save Report clicked!");
    console.log("Current analysis data:", analysisData);
    console.log("Edited data:", editedData);
    console.log("Report saved successfully!");

    let imageurl = ''
    //CLOUDLFARE TO GEN URL
    try {
      const formData = new FormData();
      // const ress = await fetch(analysisData?.imageFile!);
      // const blob = await ress.blob();
      // const file = new File([blob], "upload.jpg", { type: blob.type });
      formData.append("file", analysisData?.imageFile!);   
      
        const res = await fetch("/api/r2api", {
          method: "POST",
          body: formData,
        });
      
        const data = await res.json();
        if (res.ok) {
          imageurl = data.url
          console.log("Uploaded to R2:", imageurl);
        } else {
          console.log("Error: " + data.error);
        }
      }
    catch (error) {
      console.log('IMAGE NOT UPLOADED: ', error)
    }
  
    try {
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: analysisData?.inspectionId,   // pass inspection reference if needed
          image: imageurl,
          location: analysisData?.location,
          section: analysisData?.section,
          subsection: analysisData?.subSection,
          defect_description: analysisResult?.defect,
          material_names: analysisResult?.materials,
          material_total_cost: analysisResult?.materials_total_cost,
          labor_type: analysisResult?.labor_type,
          labor_rate: analysisResult?.labor_rate,
          hours_required: analysisResult?.hours_required,
          recommendation: analysisResult?.recommendation
        }),
      });

      if (!res.ok) {
          // If the response status is not OK (e.g., 400, 500), log the status and response text
          const errorText = await res.text();
          console.error(
            "Failed to create inspection. Status:",
            res.status,
            "Response:",
            errorText
          );
          alert("Failed to create inspection. Check the console for details.");
          return;
        }
      
        const data = await res.json();
        console.log("Defect created successfully:", data);
        console.log("Defect created with id: " + data.id);
        window.location.href = '/';
      } catch (error) {
        // Log any network or unexpected errors
        setIsSubmitting(false)
        console.error("Error creating inspection:", error);
        alert("An error occurred. Check the console for details.");

      }
  };

  if (!analysisData) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>No analysis data found. Redirecting...</div>
      </div>
    );
  }

  const { image, description, location, analysisResult } = analysisData;

  const reportSections: ReportSection[] = [
    {
      id: 1,
      heading: `${analysisData.section} - ${analysisData.subSection}`,
      image: image,
      defect: isEditing
        ? editedData.defect
        : analysisResult?.defect || description || "No defect information",
      location: isEditing ? editedData.location : location || "Not specified",
      section: analysisData.section,
      subSection: analysisData.subSection,
      estimatedCosts: {
        materials: isEditing ? editedData.materials : analysisResult?.materials_names || "N/A",
        materialsCost: isEditing
          ? editedData.materialsCost
          : Number(analysisResult?.materials_total_cost) || 0,
        labor: isEditing ? editedData.labor : analysisResult?.labor_type || "N/A",
        laborRate: isEditing ? editedData.laborRate : Number(analysisResult?.labor_rate) || 0,
        hoursRequired: isEditing ? editedData.hoursRequired : Number(analysisResult?.hours_required) || 0,
        recommendation: isEditing ? editedData.recommendation : analysisResult?.recommendation || "N/A",
        totalEstimatedCost: isEditing
          ? editedData.totalEstimatedCost
          : Number(analysisResult?.total_estimated_cost) || 0,
      },
    },
  ];

  return (
    <div className={styles.userReportContainer}>
      <main className="py-8">
        <div className={styles.reportSectionsContainer}>
          {reportSections.map((section) => (
            <div key={section.id} className={styles.reportSection}>
              {/* Heading */}
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionHeadingText}>{section.heading}</h2>
              </div>

              <div className={styles.contentGrid}>
                {/* Image */}
                <div className={styles.imageSection}>
                  <h3 className={styles.imageTitle}>Visual Evidence</h3>
                  <div className={styles.imageContainer}>
                    {section.image ? (
                      <img
                        src={
                          typeof section.image === "string"
                            ? section.image
                            : URL.createObjectURL(section.image)
                        }
                        alt="Property analysis"
                        className={styles.propertyImage}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Location moved here */}
                  <div className={styles.locationSection}>
                    <h4 className={styles.sectionTitle}>Location</h4>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.editableInput}
                        value={editedData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    ) : (
                      <p className={styles.sectionContent}>{section.location}</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className={styles.descriptionSection}>
                  <h3 className={styles.descriptionTitle}>Analysis Details</h3>
                  <div className="space-y-6">
                    {/* Defect */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Defect</h4>
                      {isEditing ? (
                        <textarea
                          className={styles.editableText}
                          value={editedData.defect}
                          onChange={(e) => handleInputChange("defect", e.target.value)}
                        />
                      ) : (
                        <p className={styles.sectionContent}>{section.defect}</p>
                      )}
                    </div>

                    {/* Estimated Costs */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Estimated Costs</h4>
                      <div className={styles.sectionContent}>
                        {isEditing ? (
                          <div className={styles.editableCosts}>
                            <div className={styles.costEditRow}>
                              <label>Materials:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.materials}
                                onChange={(e) => handleInputChange("materials", e.target.value)}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Materials Cost ($):</label>
                              <input
                                type="number"
                                className={styles.costInput}
                                value={editedData.materialsCost}
                                onChange={(e) => handleInputChange("materialsCost", Number(e.target.value))}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Labor:</label>
                              <input
                                type="text"
                                className={styles.costInput}
                                value={editedData.labor}
                                onChange={(e) => handleInputChange("labor", e.target.value)}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Labor Rate ($/hr):</label>
                              <input
                                type="number"
                                className={styles.costInput}
                                value={editedData.laborRate}
                                onChange={(e) => handleInputChange("laborRate", Number(e.target.value))}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Hours Required:</label>
                              <input
                                type="number"
                                className={styles.costInput}
                                value={editedData.hoursRequired}
                                onChange={(e) => handleInputChange("hoursRequired", Number(e.target.value))}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Recommendation:</label>
                              <textarea
                                className={styles.editableText}
                                value={editedData.recommendation}
                                onChange={(e) => handleInputChange("recommendation", e.target.value)}
                              />
                            </div>
                            <div className={styles.costEditRow}>
                              <label>Total Estimated Cost ($):</label>
                              <input
                                type="number"
                                className={styles.costInput}
                                value={editedData.totalEstimatedCost}
                                readOnly
                              />
                            </div>
                          </div>
                        ) : (
                          <p>
                            <strong>Materials:</strong> {section.estimatedCosts.materials} ($
                            {section.estimatedCosts.materialsCost}),{" "}
                            <strong>Labor:</strong> {section.estimatedCosts.labor} at $
                            {section.estimatedCosts.laborRate}/hr, <strong>Hours:</strong>{" "}
                            {section.estimatedCosts.hoursRequired}, <strong>Recommendation:</strong>{" "}
                            {section.estimatedCosts.recommendation}, <strong>Total Estimated Cost:</strong> $
                            {section.estimatedCosts.totalEstimatedCost}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className={styles.actionButtons}>
          <button onClick={() => router.push("/")} className={`${styles.actionButton} ${styles.secondaryButton}`}>
            Back
          </button>

          {!isEditing ? (
            <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
              Edit
            </button>
          ) : (
            <>
              <button onClick={handleCancel} className={`${styles.actionButton} ${styles.cancelButton}`}>
                Cancel
              </button>
              <button onClick={handleSave} className={`${styles.actionButton} ${styles.saveButton}`}>
                Save
              </button>
            </>
          )}

          <button
  onClick={handleSaveReport}
  className={`${styles.actionButton} ${styles.saveReportButton}`}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <span className={styles.spinner}></span>
      Saving...
    </>
  ) : (
    "Save Report"
  )}
</button>
        </div>
      </main>
    </div>
  );
}
