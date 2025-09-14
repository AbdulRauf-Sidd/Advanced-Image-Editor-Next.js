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
  const [currentSection, setCurrentSection] = useState(null)
  const [currentNumber, setCurrentNumber] = useState(3)
  const [currentSubNumber, setCurrentSubNumber] = useState(1)

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

      const numbering = `${currentMain}.${subCounter}`;

      const totalEstimatedCost =
        defect.material_total_cost +
        defect.labor_rate * defect.hours_required;

      return {
        id: defect._id,
        numbering,
        heading: `${numbering} ${defect.section} - ${defect.subsection}`,
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
    setCurrentNumber(currentMain);
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
              <br></br><br></br>
              <div className={styles.sectionHeadingStart}>
                    <h2 className={styles.sectionHeadingTextStart}>Section 1 - Inspection Scope, Client Responsibilities, and Repair Estimates</h2>
                  </div>
                  <div className={styles.contentGridStart}>
                    <div className={styles.descriptionSectionStart}>
                      This is a "VISUAL" inspection only. In addition, the scope of this inspection is to verify the proper performance of the home's major systems. We do not verify proper design. The following items reflect the condition of the home and its systems at the time and date the inspection was performed. Conditions of an occupied home (and its systems) can and do change after the inspection is performed (ex: leaks can occur beneath sinks, the water may run at toilets, the walls, doors, and flooring may be damaged during moving, the kitchen sink disposal may get jammed, the dishwasher may leak, etc.).
                      The furnishings, personal items, and/or systems of the home are not dismantled or moved. A 3-4 hour inspection is not equal to "live-in exposure" and will not discover all concerns with the home. Unless stated in writing, we will only inspect/comment on the following systems: Electrical, Heating/cooling, Appliances, Plumbing, Roof and Attic, Exterior, Grounds, and the Foundation. NOTE: This inspection is not a warranty or insurance policy. The limit of liability of AGI Property Inspections and its employees, officers, etc., does not extend beyond the day the inspection was performed.
                      Cosmetic items (i.e. peeling/falling wallpaper, scuffs on the walls, floor coverings, nail holes, normal wear and tear that is common in an occupied home, etc.) are not a part of this inspection. In addition, we do not inspect for fungi, rodents, or insects of any type. If we note any of these items in the report, it is done so to bring attention to the issue so you can have the proper contractor evaluate those things further. 
                      Although every effort is made to inspect/access all systems, it is not possible to describe every defect within the home. Various areas of the home may be inaccessible or not visible due to design, present a hazard to the inspector, furniture and/or storage. As a result, the home should be carefully reviewed during your final walk-thru, as the home should be vacant and clear of obstruction. This is your opportunity to ensure that no new concerns have occurred since the date of this inspection, that all requested repairs have been completed, and to verify that all systems are in proper, working condition (i.e. the plumbing system, appliances, electrical system, heating/cooling systems, etc.). NOTE: Please contact the office immediately if you suspect or discover any concerns during the final walk-thru (337-905-1428). Finally, since the report is digital, sometimes things can get unchecked or left off of the report. The inspector reserves the right to add or alter and update this report for you to include things that should be in the report after its initial delivery to the client.
                      This report may also include repair recommendations and estimated costs provided as an additional tool to help clients understand potential expenses and assist with negotiations. These estimates are based on typical labor and material rates in our region but are generated from a two-dimensional image review using AI. They are for reference purposes only and should be considered approximate. They are not formal quotes, do not account for unique site conditions, and may vary depending on the contractor, materials, and methods chosen. Final repair pricing must always be obtained through qualified, licensed contractors who perform an on-site evaluation. AGI Property Inspections does not guarantee the accuracy of estimates or assume responsibility for the quality, scope, or cost of work performed by outside contractors.
                      It is not our position to provide methods of correction for any of the noted items. Should a repair method be provided, correction of the condition is not guaranteed. We recommend methods of correction, estimates, and repairs are performed by qualified, licensed contractors or specialty tradespeople that you personally contact to ensure the concerns you have negotiated are properly reviewed and corrected. Please note that in listing a possible method of correction, the inspector is not offering any opinion as to who, among the parties to your transaction, should take responsibility for addressing any of these concerns. It is recommended that you consult with your Real Estate Professional, Attorney, and/or Contractor for further advice with regard to any of the items/concerns listed in this report.
                      Although this report may identify products involved in class action lawsuits and/or recalled by the product’s manufacturer, this report will/may not identify ALL products. NOTE: There are numerous products involved in manufacturer recalls and/or class action lawsuits. Identifying products involved in manufacturer recalls or a class action lawsuit is NOT a requirement for Louisiana licensed Home Inspectors. You should seek the service of a qualified consulting company experienced in identifying manufacturer recalls and/or products involved in class action lawsuits.
                      This inspection complies with the code of ethics and standards of practice as required by The State of Louisiana Home Inspectors Licensing Board. Home inspectors are generalists who report on readily visible issues/concerns with a home. Inspectors do not provide methods or estimates of repairs and because inspectors are generalists, it is their duty to recommend further review by a licensed specialist, contractors, etc., to allow you the opportunity to get a detailed review of any item(s) noted in this report that you deem to be a concern.
                      This inspection report and all information contained within is the sole property of AGI Property Inspections and leased to the clients named in this report and is not to be shared/passed on without the AGI’s consent. Doing so may result in legal action.

                    </div>

                  </div>
                  <br></br><br></br>

                <div className={styles.sectionHeadingStart}>
                    <h2 className={styles.sectionHeadingTextStart}>Section 2 - Inspection Scope & Limitations</h2>
                  </div>
                  <div className={styles.contentGridStart}>
                    <div className={styles.descriptionSectionStart}>
                      <strong>Inspection Categories & Summary</strong>
                      <strong>Immediate Attention</strong>
                      Major Defects: Issues that compromise the home’s structural integrity, may result in additional damage if not repaired, or is considered a safety hazard. These items are color-coded red in the report and should be corrected as soon as possible.
                      Items for Repair
                      Defects: Items in need of repair or correction, such as plumbing or electrical concerns, items that are damaged, inoperable, or improperly installed. These are color-coded orange in the report and have no real timeline on when they should be repaired.
                      Maintenance Items
                      Small DIY-type repairs and maintenance recommendations that are provided to knowledge about the long-term care and maintenance of the home. While not urgent, keeping up with these items will significantly reduce your future repair needs and costs.

                      Important Information & Limitations
                      AGI Property Inspections performs all inspections in compliance with the Louisiana Standards of Practice. We inspect readily accessible, visually observable, permanently installed systems and components of the home as outlined by these Standards. This inspection is not technically exhaustive or quantitative.
                      Some comments in this report may go beyond what the Standards require, as those standards are the minimum set requirements. Going beyond them for our clients are done so as a courtesy to provide you with as much information as possible. Any item noted for repair, replacement, maintenance, or further evaluation, should be reviewed by qualified, licensed tradespeople.
                      This inspection cannot predict future conditions or reveal hidden or latent defects. The report reflects the home’s condition at the time of inspection only. Weather changes, occupancy, or use may reveal issues not present during the inspection. Refer to the Louisiana Standards of Practice and your Inspection Agreement for full details on scope and limitations.
                      This report should be considered alongside the seller’s disclosure, pest inspection report, and evaluations by licensed contractors to gain a complete picture of the home’s condition. All real estate purchases involve some level of risk, and unexpected repairs should be anticipated as part of homeownership.

                      Repair Estimates Disclaimer
                      This report may also include repair recommendations and estimated costs to assist our clients with budgeting and negotiations. These estimates are based on typical labor and material rates in our region, but are generated from a two-dimensional image review, using AI. They are for general reference purposes only and should be considered approximate.
                      Estimates are not formal quotes.
                      They do not account for unique site conditions and may vary depending on the contractor, materials, and methods chosen.
                      Final pricing must always be obtained through qualified, licensed contractors who perform an on-site evaluation.
                      AGI Property Inspections does not guarantee the accuracy of estimates or assume responsibility for the quality, scope, or cost of work performed by outside contractors.

                      Recommendations
                      Contractors / Further Evaluation: Repairs noted in this report should be performed by licensed professionals. Keep receipts for warranty and documentation purposes. “Qualified Contractor” refers to an individual or company who is licensed or certified in the relevant field.
                      Causes of Damage / Methods of Repair: Any causes or repair methods suggested in this report are based on the inspector’s experience and opinion. Final determination of cause and repair approach should always be made by licensed contractors, who specialize in the relevant field, whose evaluation supersedes the information provided here.

                      Excluded Items
                      The following are not included in this inspection: septic systems, security systems, irrigation systems, pools, hot tubs, wells, sheds, playgrounds, saunas, outdoor lighting, central vacuums, water filters, water softeners, sound or intercom systems, generators, sport courts, sea walls, outbuildings, operating skylights, operating awnings, exterior BBQ grills, and firepits.

                      Occupied Home Disclaimer
                      If this home was occupied at the time of inspection; furniture, personal belongings, limited visibility and access to certain areas, including receptacles, windows, walls, floors, countertops, and more are not moved. Every effort was made to inspect all accessible areas; however, some conditions may not have been visible.
                      We recommend using your final walkthrough to verify that no issues were missed due to inaccessibility and that the property remains in the same condition as at the time of inspection.

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
                                <td>{section.heading}</td>
                                <td>{section.defect}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>

                  </div>
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
                                <td>{section.heading}</td>
                                <td>{section.defect}</td>
                              </tr>
                            ))}
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
