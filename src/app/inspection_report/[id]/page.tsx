"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../../user-report/user-report.module.css";
// import html2pdf from "html2pdf.js";
import { useRef } from "react";

export default function InspectionReportPage() {
  const params = useParams();
  const { id } = params; // this is inspection_id
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    console.log("start conversion");
    if (!reportRef.current) {
        console.log('error')
        return;
    }

    const element = reportRef.current;

    const options = {
      margin:       0.5,
      filename:     "inspection-report.pdf",
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: "in", format: "a4", orientation: "portrait" }
    };

    // html2pdf().set(options).from(element).save();
  };

  useEffect(() => {
    async function fetchDefects() {
      try {
        setLoading(true);
        const res = await fetch(`/api/defects/${id}`);
        if (!res.ok) throw new Error("Failed to fetch defects");
        const data = await res.json();
        console.log(data);
        setDefects(data);
      } catch (err) {
        console.error("Error fetching defects:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDefects();
    }
  }, [id]);

  const [reportSections, setReportSections] = useState<any[]>([]);

  useEffect(() => {
    if (defects?.length) {
      const mapped = defects.map((defect) => {
        const totalEstimatedCost =
          defect.material_total_cost + defect.labor_rate * defect.hours_required;

        return {
          id: defect._id,
          heading: `${defect.section} - ${defect.subsection}`,
          image: defect.image,
          defect: defect.defect_description,
          location: defect.location,
          estimatedCosts: {
            materials: "General materials",
            materialsCost: defect.material_total_cost,
            labor: defect.labor_type,
            laborRate: defect.labor_rate,
            hoursRequired: defect.hours_required,
            recommendation: defect.recommendation,
            totalEstimatedCost,
          },
        };
      });

      setReportSections(mapped);
    }
  }, [defects]);

  return (
    <div className={styles.userReportContainer}>
      <main className="py-8">
        {/* <div className="flex justify-center py-6">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Download PDF
            </button>
        </div> */}
        <div ref={reportRef} className={styles.reportSectionsContainer}>
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
                    </div>

                    {/* Details */}
                    <div className={styles.descriptionSection}>
                      <h3 className={styles.descriptionTitle}>Analysis Details</h3>
                      <div className="space-y-6">
                        {/* Defect */}
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Defect</h4>
                            <p className={styles.sectionContent}>{section.defect}</p>
                        </div>

                        {/* Location */}
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Location</h4>
                            <p className={styles.sectionContent}>{section.location}</p>
                        </div>

                        {/* Estimated Costs */}
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Estimated Costs</h4>
                          <div className={styles.sectionContent}>
                              <p>
                                <strong>Materials:</strong> {section.estimatedCosts.materials} ($
                                {section.estimatedCosts.materialsCost}),{" "}
                                <strong>Labor:</strong> {section.estimatedCosts.labor} at $
                                {section.estimatedCosts.laborRate}/hr, <strong>Hours:</strong>{" "}
                                {section.estimatedCosts.hoursRequired}, <strong>Recommendation:</strong>{" "}
                                {section.estimatedCosts.recommendation}, <strong>Total Estimated Cost:</strong> $
                                {section.estimatedCosts.totalEstimatedCost}.
                              </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
            </div>
        </div>
      </main>
      </div>

  );
}
