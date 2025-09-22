"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../../user-report/user-report.module.css";
import { useRef } from "react";
import Button from "@/components/Button";


export default function InspectionReportPage() {
  const params = useParams();
  const { id } = params; // this is inspection_id
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(null)
  const [currentNumber, setCurrentNumber] = useState(3)
  const [currentSubNumber, setCurrentSubNumber] = useState(1)

  const reportRef = useRef<HTMLDivElement>(null);

  // Get the selected arrow color for dynamic styling (for individual sections)
  const getSelectedColor = (section: any) => {
    console.log(section);
    const color = section?.color || '#d63636';
    console.log('Selected arrow color for section:', section?.heading, color);
    return color;
  };

  

  // Get a lighter shade of the selected color for gradients
  const getLightColor = (section: any) => {
    const color = getSelectedColor(section);
    // Convert hex to RGB and lighten it
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
  };

  const handleDownloadPDF = async () => {
    try {
      // Transform reportSections into defects payload compatible with API
      const defectsPayload = reportSections.map((r: any) => ({
        section: r.heading2?.split(' - ')[0] || '',
        subsection: r.heading2?.split(' - ')[1] || '',
        defect_description: r.defect || '',
        image: r.image,
        location: r.location,
        material_total_cost: r.estimatedCosts?.materialsCost ?? 0,
        labor_type: r.estimatedCosts?.labor ?? '',
        labor_rate: r.estimatedCosts?.laborRate ?? 0,
        hours_required: r.estimatedCosts?.hoursRequired ?? 0,
        recommendation: r.estimatedCosts?.recommendation ?? '',
        color: r.color || '#d63636',
      }));

      const meta = {
        title: `inspection-${id}-report`,
        subtitle: 'Generated Inspection Report',
        company: 'AGI Property Inspections',
      };

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defects: defectsPayload, meta }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to generate PDF: ${res.status} ${text}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('Failed to generate PDF. See console for details.');
    }
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
      const sortedDefects = [...defects].sort((a, b) => {
      if (a.section < b.section) return -1;
      if (a.section > b.section) return 1;
      // Optional: also sort by subsection if section is the same
      if (a.subsection < b.subsection) return -1;
      if (a.subsection > b.subsection) return 1;
      return 0;
    });

    let currentMain = currentNumber; // start from your state (e.g., 3)
    let lastSection = null;
    let subCounter = 0;

    const mapped = sortedDefects.map((defect) => {
      // If we hit a new section, increment main number and reset subCounter
      if (defect.section !== lastSection!) {
        currentMain++;
        subCounter = 1;
        lastSection = defect.section;
      } else {
        subCounter++;
      }
      console.log('DEFECTS', defect);

      const def = defect.defect_description.split(".")[0] || "";


      const numbering = `${currentMain}.${subCounter}`;

      const totalEstimatedCost =
        defect.material_total_cost +
        defect.labor_rate * defect.hours_required;

      return {
        id: defect._id,
        numbering,
        heading2: `${defect.section} - ${defect.subsection}`,
        heading: `${numbering} ${defect.section} - ${defect.subsection}`,
        image: defect.image,
        defect: def,
        defect_description: defect.defect_description,
        location: defect.location,
        color: defect.color || defect.selectedArrowColor || '#d63636', // Add individual color for each section
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
    setCurrentNumber(currentMain);
    }
  }, [defects]);

  return (
    <div className={styles.userReportContainer}>
      <main className="py-8">
        <div className="flex justify-center py-6">
          <Button type="success" className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleDownloadPDF}>
            Download PDF
          </Button>
        </div>
        <div ref={reportRef} className={styles.reportSectionsContainer}>
            <div className={styles.reportSectionsContainer}>
              <br></br><br></br>
              <div className={styles.sectionHeadingStart}>
                    <h2 className={styles.sectionHeadingTextStart}>Section 1 - Inspection Scope, Client Responsibilities, and Repair Estimates</h2>
                  </div>
                      <div className={styles.descriptionSectionStart}>
                        <p>
                          This is a <strong>visual inspection only</strong>. The scope of this
                          inspection is to verify the proper performance of the home's major
                          systems. We do not verify proper design.
                        </p>

                        <p>
                          The following items reflect the condition of the home and its systems
                          <strong> at the time and date the inspection was performed</strong>.
                          Conditions of an occupied home can change after the inspection (e.g.,
                          leaks may occur beneath sinks, water may run at toilets, walls or flooring
                          may be damaged during moving, appliances may fail, etc.).
                        </p>
                          
                        <p>
                          Furnishings, personal items, and/or systems of the home are not dismantled
                          or moved. A 3–4 hour inspection is not equal to "live-in exposure" and
                          will not discover all concerns. Unless otherwise stated, we will only
                          inspect/comment on the following systems:
                          <em>
                            Electrical, Heating/Cooling, Appliances, Plumbing, Roof and Attic,
                            Exterior, Grounds, and the Foundation
                          </em>
                          .
                        </p>
                          
                        <p className={styles.note}>
                          <strong>NOTE:</strong> This inspection is not a warranty or insurance
                          policy. The limit of liability of AGI Property Inspections and its
                          employees does not extend beyond the day the inspection was performed.
                        </p>
                          
                        <p>
                          Cosmetic items (e.g., peeling wallpaper, wall scuffs, nail holes, normal
                          wear and tear, etc.) are not part of this inspection. We also do not
                          inspect for fungi, rodents, or insects. If such issues are noted, it is
                          only to bring them to your attention so you can have the proper contractor
                          evaluate further.
                        </p>
                          
                        <p>
                          Although every effort is made to inspect all systems, not every defect can
                          be identified. Some areas may be inaccessible or hazardous. The home
                          should be carefully reviewed during your final walk-through to ensure no
                          new concerns have occurred and that requested repairs have been completed.
                        </p>
                          
                        <p className={styles.note}>
                          <strong>IMPORTANT:</strong> Please contact our office immediately at{" "}
                          <a href="tel:3379051428">337-905-1428</a> if you suspect or discover any
                          concerns during the final walk-through.
                        </p>
                          
                        <p>
                          Repair recommendations and cost estimates included in this report are{" "}
                          <strong>approximate</strong>, generated from typical labor and material
                          rates in our region. They are not formal quotes and must always be
                          verified by licensed contractors. AGI Property Inspections does not
                          guarantee their accuracy.
                        </p>
                          
                        <p>
                          We do not provide guaranteed repair methods. Any corrections should be
                          performed by qualified, licensed contractors. Consult your Real Estate
                          Professional, Attorney, or Contractor for further advice regarding
                          responsibility for these repairs.
                        </p>
                          
                        <p>
                          While this report may identify products involved in recalls or lawsuits,
                          it is not comprehensive. Identifying all recalled products is not a
                          requirement for Louisiana licensed Home Inspectors.
                        </p>
                          
                        <p>
                          This inspection complies with the standards of practice of the{" "}
                          <strong>
                            State of Louisiana Home Inspectors Licensing Board
                          </strong>
                          . Home inspectors are generalists and recommend further review by licensed
                          specialists when needed.
                        </p>
                          
                        <p className={styles.disclaimer}>
                          This inspection report and all information contained within is the sole
                          property of AGI Property Inspections and is leased to the clients named in
                          this report. It may not be shared or passed on without AGI’s consent.{" "}
                          <em>Doing so may result in legal action.</em>
                        </p>
                      </div>

                  <br></br><br></br>

                <div className={styles.sectionHeadingStart}>
                    <h2 className={styles.sectionHeadingTextStart}>Section 2 - Inspection Scope & Limitations</h2>
                  </div>
                  <div className={styles.contentGridStart}>
                    <div className={styles.descriptionSectionStart}>
                      {/* Categories */}
                      <h3>Inspection Categories & Summary</h3>

                      <h4 className={styles.immediateAttention}>Immediate Attention</h4>
                      <div className={styles.immediateAttention}>
                      {/* <p> */}
                        Major Defects: Issues that compromise the home’s structural
                        integrity, may result in additional damage if not repaired, or are
                        considered a safety hazard. These items are color-coded{" "}
                        red in the report and should be corrected
                        as soon as possible.
                      {/* </p> */}
                      </div>

                      <h4 className={styles.itemsForRepair}>Items for Repair</h4>
                      <div className={styles.itemsForRepair}>
                      {/* <p className={styles.orange}> */}
                        Defects: Items in need of repair or correction, such as
                        plumbing or electrical concerns, damaged or improperly installed components,
                        etc. These are color-coded orange in
                        the report and have no strict repair timeline.
                      {/* </p> */}
                      </div>

                      <h4 className={styles.maintenanceItems}>Maintenance Items Description</h4>
                      <div className={styles.maintenanceItems}>
                      {/* <p> */}
                        Small DIY-type repairs and maintenance recommendations provided to increase
                        knowledge of long-term care. While not urgent, addressing these will reduce
                        future repair needs and costs.
                      {/* </p> */}
                      </div>

                      <h4 className={styles.recomended}>Further Evaluation</h4>
                      <div className={styles.recomended}>
                      {/* <p> */}
                        Small DIY-type repairs and maintenance recommendations provided to increase
                        knowledge of long-term care. While not urgent, addressing these will reduce
                        future repair needs and costs.
                      {/* </p> */}
                      </div>
                      <br></br>

                      <hr />

                      {/* Limitations */}
                      <h3>Important Information & Limitations</h3>
                      <p>
                        AGI Property Inspections performs all inspections in compliance with the{" "}
                        <strong>Louisiana Standards of Practice</strong>. We inspect readily
                        accessible, visually observable, permanently installed systems and
                        components of the home. This inspection is not technically exhaustive or
                        quantitative.
                      </p>
                      <p>
                        Some comments may go beyond the minimum Standards as a courtesy to provide
                        additional detail. Any item noted for repair, replacement, maintenance, or
                        further evaluation should be reviewed by qualified, licensed tradespeople.
                      </p>
                      <p>
                        This inspection cannot predict future conditions or reveal hidden or latent
                        defects. The report reflects the home’s condition only at the time of
                        inspection. Weather, occupancy, or use may reveal issues not present at the
                        time.
                      </p>
                      <p>
                        This report should be considered alongside the{" "}
                        <strong>seller’s disclosure, pest inspection report, and contractor
                        evaluations</strong> for a complete picture of the home’s condition.
                      </p>

                      <hr />

                      {/* Repair Disclaimer */}
                      <h3>Repair Estimates Disclaimer</h3>
                      <p>
                        This report may include repair recommendations and estimated costs. These
                        are based on typical labor and material rates in our region, generated from
                        AI image review. They are approximate and not formal quotes.
                      </p>
                      <ul>
                        <li>Estimates are <strong>not formal quotes</strong>.</li>
                        <li>
                          They do not account for unique site conditions and may vary depending on
                          contractor, materials, and methods.
                        </li>
                        <li>
                          Final pricing must always be obtained through qualified, licensed
                          contractors with on-site evaluation.
                        </li>
                        <li>
                          AGI Property Inspections does not guarantee the accuracy of estimates or
                          assume responsibility for work performed by outside contractors.
                        </li>
                      </ul>

                      <hr />

                      {/* Recommendations */}
                      <h3>Recommendations</h3>
                      <ul>
                        <li>
                          <strong>Contractors / Further Evaluation:</strong> Repairs noted should be
                          performed by licensed professionals. Keep receipts for warranty and
                          documentation purposes.
                        </li>
                        <li>
                          <strong>Causes of Damage / Methods of Repair:</strong> Suggested repair
                          methods are based on inspector experience and opinion. Final determination
                          should always be made by licensed contractors.
                        </li>
                      </ul>

                      <hr />

                      {/* Exclusions */}
                      <h3>Excluded Items</h3>
                      <p>
                        The following are not included in this inspection: septic systems, security
                        systems, irrigation systems, pools, hot tubs, wells, sheds, playgrounds,
                        saunas, outdoor lighting, central vacuums, water filters, water softeners,
                        sound or intercom systems, generators, sport courts, sea walls, outbuildings,
                        operating skylights, awnings, exterior BBQ grills, and firepits.
                      </p>

                      <hr />

                      {/* Occupied Home Disclaimer */}
                      <h3>Occupied Home Disclaimer</h3>
                      <p>
                        If the home was occupied at the time of inspection, some areas may not have
                        been accessible (furniture, personal belongings, etc.). Every effort was
                        made to inspect all accessible areas; however, some issues may not have been
                        visible.
                      </p>
                      <p>
                        We recommend using your final walkthrough to verify that no issues were
                        missed and that the property remains in the same condition as at the time of
                        inspection.
                      </p>
                    </div>


                  </div>

                  <br></br><br></br>

                  <div className={styles.sectionHeadingStart}>
                    <h2 className={styles.sectionHeadingTextStart}>Defects Summary</h2>
                  </div>
                  <div className={styles.contentGridStart}>
                    <div className={styles.descriptionSectionStart}>
                      <table className={styles.defectsTable}>
                          <thead>
                            <tr>
                              <th>No.</th>
                              <th>Section</th>
                              <th>Defect</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportSections.map((section) => (
                              <tr key={section.id}>
                                <td>{section.numbering}</td>
                                <td>{section.heading2}</td>
                                <td>{section.defect}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>

                  </div>
                  <br></br>
                {reportSections.map((section) => (
                <div 
                  key={section.id} 
                  className={styles.reportSection}
                  style={{
                    '--selected-color': getSelectedColor(section),
                    '--light-color': getLightColor(section),
                  } as React.CSSProperties}
                >
                  {/* Heading */}
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionHeadingText}>{section.heading}</h2>
                  </div>

                  <div className={styles.contentGrid}>
                    {/* Image */}
                    <div className={styles.imageSection}>
                      {/* <h3 className={styles.imageTitle}>Visual Evidence</h3> */}
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
                      <div className={styles.locationSection}style={{
                          // boxShadow: getSelectedColor(section),
                          "--shadow-color": getLightColor(section),
                          // '--light-color': getLightColor(section)
                        } as React.CSSProperties }>
                        <h4 className={styles.sectionTitle}>Location</h4>
                        <p className={styles.sectionContent}>{section.location}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className={styles.descriptionSection}>
                      {/* <h3 className={styles.descriptionTitle}>Analysis Details</h3> */}
                      <div className="space-y-6">
                        {/* Defect */}
                        <div className={styles.section} style={{
                          // boxShadow: getSelectedColor(section),
                          "--shadow-color": getLightColor(section),
                          // '--light-color': getLightColor(section)
                        } as React.CSSProperties }>
                          <h4 className={styles.sectionTitle}>Defect Description</h4>
                            <p className={styles.sectionContent}>{section.defect_description}</p>
                        </div>

                        {/* Estimated Costs */}
                        <div className={styles.section} style={{
                          // boxShadow: getSelectedColor(section),
                          "--shadow-color": getLightColor(section),
                          // '--light-color': getLightColor(section)
                        } as React.CSSProperties }>
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
            <div className={styles.contentGridStart}>
                    <div className={styles.descriptionSectionStart}>
                      <table className={styles.defectsTable}>
                          <thead>
                            <tr>
                              <th>No.</th>
                              <th>Defect</th>
                              <th>Cost</th>
                            </tr>
                          </thead>
                           <tbody>
                             {reportSections.map((section) => (
                               <tr key={section.id}>
                                 <td>{section.numbering}</td>
                                 <td>{section.defect}</td>
                                 <td>${section.estimatedCosts.totalEstimatedCost}</td>
                               </tr>
                             ))}
                             <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                               <td colSpan={2}>Total Cost</td>
                               <td>${reportSections.reduce((total, section) => total + section.estimatedCosts.totalEstimatedCost, 0)}</td>
                             </tr>
                           </tbody>
                        </table>
                    </div>

                  </div>
            </div>
        </div>
      </main>
      </div>

  );
}
