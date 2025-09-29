export type DefectItem = {
  section: string;
  subsection: string;
  defect_description: string;
  image?: string; // URL or data URI
  location?: string;
  material_total_cost?: number;
  labor_type?: string;
  labor_rate?: number;
  hours_required?: number;
  recommendation?: string;
  color?: string;
};

export type ReportMeta = {
  title?: string;
  subtitle?: string;
  company?: string;
  logoUrl?: string;
  date?: string;
  startNumber?: number; // base section number, defaults to 1
};

function splitDefectText(defectText: string) {
  if (!defectText) {
    return { title: "", paragraphs: [] as string[] };
  }

  const trimmed = defectText.trim();

  const doubleNewlineIndex = trimmed.search(/\n\s*\n/);
  if (doubleNewlineIndex !== -1) {
    const title = trimmed.slice(0, doubleNewlineIndex).trim();
    const rest = trimmed.slice(doubleNewlineIndex).trim();
    const paragraphs = rest
      ? rest
          .split(/\n\s*\n/g)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
    return { title, paragraphs };
  }

  const [firstLine, ...restLines] = trimmed.split(/\r?\n/);
  const rest = restLines.join("\n").trim();
  if (rest) {
    return {
      title: firstLine.trim(),
      paragraphs: rest
        .split(/\n\s*\n/g)
        .map((p) => p.trim())
        .filter(Boolean),
    };
  }

  const sentenceMatch = trimmed.match(/(.*?[.?!])(\s|$)/);
  if (sentenceMatch) {
    const [, firstSentence] = sentenceMatch;
    const remaining = trimmed.slice(firstSentence.length).trim();
    const paragraphs = remaining
      ? remaining
          .split(/\n\s*\n/g)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
    return {
      title: firstSentence.trim(),
      paragraphs,
    };
  }

  return { title: trimmed, paragraphs: [] as string[] };
}

function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function currency(n?: number): string {
  if (typeof n !== "number" || isNaN(n)) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function generateInspectionReportHTML(defects: DefectItem[], meta: ReportMeta = {}): string {
  const {
    title = "Inspection Report",
    subtitle = "Defect Summary and Details",
    company = "",
    logoUrl,
    date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    startNumber = 1,
  } = meta;

  // Sort by section then subsection for stable ordering
  const sorted = [...defects].sort((a, b) => {
    if (a.section < b.section) return -1;
    if (a.section > b.section) return 1;
    if (a.subsection < b.subsection) return -1;
    if (a.subsection > b.subsection) return 1;
    return 0;
  });

  let currentMain = startNumber - 1; // will increment on first new section
  let lastSection: string | null = null;
  let subCounter = 0;

  const sectionsHtml = sorted
    .map((d) => {
      if (d.section !== lastSection) {
        currentMain += 1;
        subCounter = 1;
        lastSection = d.section;
      } else {
        subCounter += 1;
      }

      const number = `${currentMain}.${subCounter}`;
      const totalCost = (d.material_total_cost || 0) + (d.labor_rate || 0) * (d.hours_required || 0);
      const selectedColor = d.color || "#d63636";
      const { title: defectTitle, paragraphs: defectParagraphs } = splitDefectText(d.defect_description || "");
      const defectBodyHtml = defectParagraphs.length
        ? `<div class="defect-body">${defectParagraphs
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")}</div>`
        : "";
      const fallbackDefectHtml = !defectTitle && defectParagraphs.length === 0 && d.defect_description
        ? `<div class="defect-body"><p>${escapeHtml(d.defect_description)}</p></div>`
        : "";

      return `
        <section class="report-section" style="--selected-color: ${selectedColor};">
          <div class="section-heading">
            <h2 class="section-heading-text">${escapeHtml(number)} ${escapeHtml(d.section)} - ${escapeHtml(d.subsection)}</h2>
          </div>

          <div class="content-grid">
            <div class="image-section">
              <h3 class="image-title">Visual Evidence</h3>
              <div class="image-container">
                ${d.image
                  ? `<img src="${escapeHtml(d.image)}" alt="Defect image" class="property-image" />`
                  : `<div class="image-placeholder"><p>No image available</p></div>`}
              </div>
              <div class="location-section">
                <h4 class="section-title">Location</h4>
                <p class="section-content">${escapeHtml(d.location || "Not specified")}</p>
              </div>
            </div>

            <div class="description-section">
              <h3 class="description-title">Analysis Details</h3>
              <div class="section">
                <h4 class="section-title">Defect</h4>
                <div class="section-content">
                  ${defectTitle ? `<p class="defect-title">${escapeHtml(defectTitle)}</p>` : ""}
                  ${defectBodyHtml}
                  ${fallbackDefectHtml}
                </div>
              </div>
              <div class="section">
                <h4 class="section-title">Estimated Costs</h4>
                <div class="section-content">
                  <p>
                    <strong>Materials:</strong> ${currency(d.material_total_cost)}<br/>
                    <strong>Labor:</strong> ${escapeHtml(d.labor_type || "N/A")} at ${currency(d.labor_rate || 0)}/hr<br/>
                    <strong>Hours:</strong> ${Number(d.hours_required || 0)}<br/>
                    <strong>Recommendation:</strong> ${escapeHtml(d.recommendation || "N/A")}<br/>
                    <strong>Total Estimated Cost:</strong> ${currency(totalCost)}
                  </p>
                </div>
              </div>
              <div class="cost-highlight">
                <div class="total-cost">Total Estimated Cost: ${currency(totalCost)}</div>
              </div>
            </div>
          </div>
        </section>
      `;
    })
    .join("\n");

  const summaryRows = sorted
    .map((d, idx) => {
      // recompute numbering in same order
      // we repeat logic to ensure consistency
      // A simpler way is to compute beforehand, but this is fine for small arrays
      return d;
    })
    .reduce<{ html: string; current: number; last: string | null; sub: number }>(
      (acc, d) => {
        if (d.section !== acc.last) {
          acc.current += 1;
          acc.sub = 1;
          acc.last = d.section;
        } else {
          acc.sub += 1;
        }
        const numbering = `${acc.current}.${acc.sub}`;
  const { title: summaryTitle } = splitDefectText(d.defect_description || "");
  const fallbackSentence = (d.defect_description || "").trim().split(/[.?!]/)[0] || "";
        const summaryText = summaryTitle || fallbackSentence;
        acc.html += `
          <tr>
            <td>${escapeHtml(numbering)}</td>
            <td>${escapeHtml(d.section)} - ${escapeHtml(d.subsection)}</td>
            <td>${escapeHtml(summaryText)}</td>
          </tr>
        `;
        return acc;
      },
      { html: "", current: startNumber - 1, last: null, sub: 0 }
    ).html;

  const totalAll = sorted.reduce((sum, d) => sum + (d.material_total_cost || 0) + (d.labor_rate || 0) * (d.hours_required || 0), 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* Minimal reset */
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #111827; background: #ffffff; }
    h1, h2, h3, h4 { margin: 0 0 8px 0; }
    p { margin: 0 0 8px 0; }
    .header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
      border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;
    }
    .header .title { font-size: 24px; font-weight: 700; }
    .header .meta { color: #6b7280; font-size: 12px; }
    .logo { height: 40px; }

    .cover {
      border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px; background: #f8fafc;
    }
    .cover h2 { font-size: 18px; color: #1f2937; }
    .cover p { color: #374151; }

  .category-immediate { color: #c00; }
  .category-repair { color: #e69500; }
  .category-maintenance { color: #2d6cdf; }
  .category-evaluation { color: #800080; }

    .section-heading { margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid var(--selected-color, #d63636); }
    .section-heading-text { font-size: 18px; color: var(--selected-color, #d63636); font-weight: 700; }

    .content-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
    .image-section, .description-section { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
    .image-title, .description-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 12px; }
    .image-container { border-radius: 8px; overflow: hidden; min-height: 220px; background: #fff; display: flex; align-items: center; justify-content: center; }
    .property-image { width: 100%; height: auto; display: block; }
    .image-placeholder { color: #6b7280; border: 2px dashed #cbd5e1; background: #fff; width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; }

    .location-section { margin-top: 12px; background: #fff; border-left: 3px solid var(--selected-color, #d63636); padding: 12px; border-radius: 6px; }
    .section { background: #fff; border-left: 3px solid var(--selected-color, #d63636); padding: 12px; border-radius: 6px; margin-bottom: 10px; }
    .section-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #1f2937; }
    .section-content { font-size: 13px; color: #374151; line-height: 1.5; }

    .cost-highlight { background: #f8fafc; border: 1px solid var(--selected-color, #d63636); padding: 10px; border-radius: 8px; margin-top: 10px; }
    .total-cost { text-align: center; font-weight: 700; color: var(--selected-color, #d63636); }

    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
    .table thead th { background: #f3f4f6; }

  .defect-title { font-weight: 700; font-size: 14px; color: var(--selected-color, #d63636); margin-bottom: 6px; }
  .defect-body { font-size: 13px; color: #374151; line-height: 1.5; display: flex; flex-direction: column; gap: 8px; }
  .defect-body p { margin: 0; }

    .footer { margin-top: 16px; font-size: 11px; color: #6b7280; }

    /* Page breaks for PDF */
    @media print {
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="meta">${escapeHtml(subtitle)}${company ? " • " + escapeHtml(company) : ""} • ${escapeHtml(date)}</div>
    </div>
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="logo" />` : ""}
  </header>

  <section class="cover">
    <h2>Inspection Scope & Limitations</h2>
    <p>This report provides a visual inspection summary of the home's major systems at the time of inspection. It includes defects identified along with estimated costs and recommendations. Estimates are approximate and should be verified by licensed contractors.</p>
  </section>

  <section class="cover">
    <h2>Defects Summary</h2>
    <table class="table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Section</th>
          <th>Defect</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
        <tr>
          <td colspan="2" style="font-weight:700;background:#f3f4f6;">Total Estimated Cost</td>
          <td style="font-weight:700;background:#f3f4f6;">${currency(totalAll)}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <div class="page-break"></div>

  ${sectionsHtml}

  <footer class="footer">
    Generated by Advanced Image Editor • ${escapeHtml(company || "")}
  </footer>
</body>
</html>
  `;
}
