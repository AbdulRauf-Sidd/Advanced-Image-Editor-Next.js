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
  headerImageUrl?: string; // URL for the large header background image
  headerText?: string; // Text to display on the header image
  date?: string;
  startNumber?: number; // base section number, defaults to 1
  reportType?: 'full' | 'summary';
};

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

// Color utilities: parse CSS color strings and classify by nearest base color
function parseColorToRgb(input?: string): { r: number; g: number; b: number } | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  const hexMatch = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b };
  }
  const rgbMatch = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return { r, g, b };
  }
  return null;
}

const baseColors: Record<'red' | 'orange' | 'blue' | 'purple', { r: number; g: number; b: number }> = {
  red: { r: 220, g: 38, b: 38 },      // #dc2626
  orange: { r: 245, g: 158, b: 11 },  // #f59e0b
  blue: { r: 59, g: 130, b: 246 },    // #3b82f6
  purple: { r: 124, g: 58, b: 237 },  // #7c3aed
};

function nearestCategory(color?: string): 'red' | 'orange' | 'blue' | 'purple' | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  let bestKey: 'red' | 'orange' | 'blue' | 'purple' | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  (Object.keys(baseColors) as Array<'red' | 'orange' | 'blue' | 'purple'>).forEach((key) => {
    const b = baseColors[key];
    const d = (rgb.r - b.r) ** 2 + (rgb.g - b.g) ** 2 + (rgb.b - b.b) ** 2;
    if (d < bestDist) { bestDist = d; bestKey = key; }
  });
  return bestKey;
}

function colorToImportance(input?: string): 'Immediate Attention' | 'Items for Repair' | 'Maintenance Items' | 'Further Evaluation' {
  const cat = nearestCategory(input);
  switch (cat) {
    case 'red': return 'Immediate Attention';
    case 'orange': return 'Items for Repair';
    case 'blue': return 'Maintenance Items';
    case 'purple': return 'Further Evaluation';
    default: return 'Immediate Attention';
  }
}

type DefectTextParts = {
  title: string;
  body: string;
  paragraphs: string[];
};

function splitDefectText(raw?: string): DefectTextParts {
  const normalized = (raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { title: "", body: "", paragraphs: [] };
  }

  const paragraphBlocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphBlocks.length > 1) {
    const [title, ...rest] = paragraphBlocks;
    return {
      title,
      body: rest.join("\n\n").trim(),
      paragraphs: rest,
    };
  }

  const lineBlocks = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lineBlocks.length > 1) {
    const [title, ...restLines] = lineBlocks;
    const restCombined = restLines.join(" ").trim();
    return {
      title,
      body: restCombined,
      paragraphs: restCombined ? [restCombined] : [],
    };
  }

  const colonMatch = normalized.match(/^([^:]{3,120}):\s*([\s\S]+)$/);
  if (colonMatch) {
    const [, title, remainder] = colonMatch;
    const trimmedRemainder = remainder.trim();
    const paragraphs = trimmedRemainder
      ? trimmedRemainder.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : [];
    return {
      title: title.trim(),
      body: trimmedRemainder,
      paragraphs: paragraphs.length ? paragraphs : trimmedRemainder ? [trimmedRemainder] : [],
    };
  }

  const dashMatch = normalized.match(/^([^–-]{3,120})[–-]\s*([\s\S]+)$/);
  if (dashMatch) {
    const [, title, remainder] = dashMatch;
    const trimmedRemainder = remainder.trim();
    const paragraphs = trimmedRemainder
      ? trimmedRemainder.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : [];
    return {
      title: title.trim(),
      body: trimmedRemainder,
      paragraphs: paragraphs.length ? paragraphs : trimmedRemainder ? [trimmedRemainder] : [],
    };
  }

  const periodIndex = normalized.indexOf(".");
  if (periodIndex > 0 && periodIndex < normalized.length - 1) {
    const title = normalized.slice(0, periodIndex).trim();
    const remainder = normalized.slice(periodIndex + 1).trim();
    const paragraphs = remainder
      ? remainder.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : [];
    return {
      title,
      body: remainder,
      paragraphs: paragraphs.length ? paragraphs : remainder ? [remainder] : [],
    };
  }

  return { title: normalized, body: "", paragraphs: [] };
}

export function generateInspectionReportHTML(defects: DefectItem[], meta: ReportMeta = {}): string {
  const {
    title = "Inspection Report",
    subtitle = "Defect Summary and Details",
    company = "",
    logoUrl,
    date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    startNumber = 1,
    reportType = 'full',
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
    .map((d, index) => {
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
      const defectParts = splitDefectText(d.defect_description || "");
      const defectTitle = defectParts.title;
      const defectParagraphs = defectParts.paragraphs.length
        ? defectParts.paragraphs
        : defectParts.body && defectParts.body !== defectTitle
          ? [defectParts.body]
          : [];
      const defectBodyHtml = defectParagraphs.length
        ? defectParagraphs.map((p) => `<p class="defect-body">${escapeHtml(p)}</p>`).join("")
        : (d.defect_description ? `<p class="defect-body">${escapeHtml(d.defect_description)}</p>` : "");
      
      // Determine the importance label based on nearest color category
      const importanceLabel = colorToImportance(selectedColor);

      // Add page break after every 2 sections (except the last one)
      const pageBreak = (index + 1) % 2 === 0 && index < sorted.length - 1 ? '<div class="page-break"></div>' : '';

      return `
        <section class="report-section" style="--selected-color: ${selectedColor};">
          <div class="section-heading">
            <h2 class="section-heading-text">
              ${escapeHtml(number)} ${escapeHtml(d.section)}
              <span class="importance-badge" style="background-color: ${selectedColor};">${importanceLabel}</span>
            </h2>
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
                  ${defectTitle ? `<p class="defect-title" style="color:${selectedColor};">${escapeHtml(defectTitle)}</p>` : ""}
                  ${defectBodyHtml}
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
        ${pageBreak}
      `;
    })
    .join("\n");

  // Build cost summary rows with numbering matching detail sections
  const costSummaryRows = sorted.reduce<{
    html: string;
    current: number;
    last: string | null;
    sub: number;
  }>((acc, d) => {
    if (d.section !== acc.last) {
      acc.current += 1;
      acc.sub = 1;
      acc.last = d.section;
    } else {
      acc.sub += 1;
    }
    const numbering = `${acc.current}.${acc.sub}`;
  const parts = splitDefectText(d.defect_description || "");
  const defFirstSentence = parts.title || (d.defect_description || "").split(".")[0];
    const costValue = (d.material_total_cost || 0) + (d.labor_rate || 0) * (d.hours_required || 0);
    acc.html += `
      <tr>
        <td>${escapeHtml(numbering)}</td>
        <td>${escapeHtml(defFirstSentence)}</td>
        <td style="text-align:right;">${currency(costValue)}</td>
      </tr>
    `;
    return acc;
  }, { html: "", current: startNumber - 1, last: null, sub: 0 }).html;

  const totalAll = sorted.reduce((sum, d) => sum + (d.material_total_cost || 0) + (d.labor_rate || 0) * (d.hours_required || 0), 0);

  // Build non-priced summary rows (No., Section, Defect) to place after Section 2
  const summaryRowsSimple = sorted.reduce<{
    html: string;
    current: number;
    last: string | null;
    sub: number;
  }>((acc, d) => {
    if (d.section !== acc.last) {
      acc.current += 1;
      acc.sub = 1;
      acc.last = d.section;
    } else {
      acc.sub += 1;
    }
    const numbering = `${acc.current}.${acc.sub}`;
  const parts = splitDefectText(d.defect_description || "");
  const defFirstSentence = parts.title || (d.defect_description || "").split(".")[0];
    acc.html += `
      <tr>
        <td>${escapeHtml(numbering)}</td>
        <td>${escapeHtml(d.section)} - ${escapeHtml(d.subsection)}</td>
        <td>${escapeHtml(defFirstSentence)}</td>
      </tr>`;
    return acc;
  }, { html: "", current: startNumber - 1, last: null, sub: 0 }).html;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #111827; background: #ffffff; }
    h1, h2, h3, h4 { margin: 0 0 8px 0; }
    p { margin: 0 0 8px 0; }
    
    /* Header with image and content below */
    .header-container { 
      width: 100%;
      margin-bottom: 40px;
      text-align: center;
    }
    
    .logo-container {
      text-align: left;
      margin-bottom: 20px;
      padding: 20px 0;
    }
    
    .logo { 
      height: 60px;
    }
    
    .image-container {
      width: 100%;
      height: auto;
      margin-bottom: 30px;
      max-height: 500px;
      overflow: hidden;
    }
    
    .header-image {
      width: 100%;
      max-height: 500px;
      object-fit: cover;
      object-position: center;
    }
    
    .report-header-content {
      text-align: center;
      padding: 20px 0;
    }
    
    .header-text {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      margin-top: 0;
      margin-bottom: 20px;
    }
    
    .report-title {
      font-size: 28px;
      font-weight: 600;
      color: #444;
      margin: 0 0 10px 0;
      text-transform: uppercase;
    }
    
    .meta-info {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    
    /* Traditional header fallback */
    .header-traditional { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 12px; 
    }
    
    .header-traditional .title { 
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      text-shadow: none;
    }
    
    .header-traditional .meta { 
      color: #6b7280;
      font-size: 12px;
      text-shadow: none;
    }
    
    .header-traditional .logo {
      position: static;
      height: 40px;
      filter: none;
    }
    
    /* Content padding */
    .content-wrapper {
      padding: 0 24px;
    }

    .cover { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px; background: #f8fafc; }
    .cover h2 { font-size: 18px; color: #1f2937; page-break-after: avoid; break-after: avoid; }
    .cover p { color: #374151; }
  .cover h3 { font-size: 16px; color: #111827; margin: 12px 0 8px; }
  .cover h4 { font-size: 14px; color: #111827; margin: 10px 0 6px; }
  .cover ul { margin: 8px 0 12px 18px; padding: 0; }
  .cover li { margin: 4px 0; }
  .cover hr { border: 0; border-top: 1px solid #e5e7eb; margin: 12px 0; }

  /* Utility to keep a block together on one page */
  .keep-together { page-break-inside: avoid; break-inside: avoid; }

  /* Slight offset for the non-priced summary after Section 2 */
  .cover--summary { margin-top: 24px; }

  /* Section 2: consistent formatting with tight spacing */
  .cover--section2 { padding: 20px; margin: 0; }
  .cover--section2 h2 { font-size: 18px; margin: 0 0 12px 0; }
  .cover--section2 h3 { font-size: 16px; margin: 16px 0 8px; }
  .cover--section2 h4 { font-size: 14px; margin: 12px 0 6px; }
  .cover--section2 p, .cover--section2 li { font-size: 13px; line-height: 1.5; margin: 0 0 10px 0; hyphens: manual; -webkit-hyphens: manual; }
  .cover--section2 .category-immediate { color: #c00; }
  .cover--section2 .category-repair { color: #e69500; }
  .cover--section2 .category-maintenance { color: #2d6cdf; }
  .cover--section2 .category-evaluation { color: #800080; }
  
  /* Importance badge styling */
  .importance-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
    margin-left: 8px;
  }
  .cover--section2 ul { margin: 10px 0 14px 18px; }
  .cover--section2 hr { margin: 14px 0; }

  /* Section 1: consistent formatting with tight spacing */
  .cover--section1 { padding: 20px; margin: 0; }
  .cover--section1 h2 { font-size: 18px; margin: 0 0 12px 0; }
  .cover--section1 h3 { font-size: 16px; margin: 16px 0 8px; }
  .cover--section1 h4 { font-size: 14px; margin: 12px 0 6px; }
  .cover--section1 p, .cover--section1 li { font-size: 13px; line-height: 1.5; margin: 0 0 10px 0; hyphens: manual; -webkit-hyphens: manual; }
  .cover--section1 ul { margin: 10px 0 14px 18px; }
  .cover--section1 hr { margin: 14px 0; }

    .section-heading { margin: 16px 0 8px; padding-bottom: 6px; border-bottom: 2px solid var(--selected-color, #d63636); }
    .section-heading-text { font-size: 16px; color: var(--selected-color, #d63636); font-weight: 700; }

    .content-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }
    .image-section, .description-section { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .image-title, .description-title { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
    .image-container { border-radius: 6px; overflow: hidden; min-height: 160px; background: #fff; display: flex; align-items: center; justify-content: center; }
    .property-image { width: 100%; height: auto; display: block; }
    .image-placeholder { color: #6b7280; border: 2px dashed #cbd5e1; background: #fff; width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; }

    .location-section { margin-top: 8px; background: #fff; border-left: 3px solid var(--selected-color, #d63636); padding: 8px; border-radius: 4px; }
    .section { background: #fff; border-left: 3px solid var(--selected-color, #d63636); padding: 8px; border-radius: 4px; margin-bottom: 8px; }
    .section-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #1f2937; }
    .section-content { font-size: 13px; color: #374151; line-height: 1.5; }
  .defect-title { font-weight: 700; font-size: 14px; margin: 0 0 6px 0; color: var(--selected-color, #d63636); }
  .defect-body { font-size: 13px; color: #374151; line-height: 1.6; margin: 0 0 8px 0; }

    .cost-highlight { background: #f8fafc; border: 1px solid var(--selected-color, #d63636); padding: 8px; border-radius: 6px; margin-top: 8px; }
    .total-cost { text-align: center; font-weight: 700; color: var(--selected-color, #d63636); }

    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
    .table thead th { background: #f3f4f6; }

    .footer { margin-top: 16px; font-size: 11px; color: #6b7280; }

    /* Prevent splitting a single defect across pages */
    .report-section {   
      /* Further increased space between defects for optimal separation while keeping 2 per page */
      margin: 24px 0;
      page-break-inside: avoid; 
      break-inside: avoid; 
      -webkit-region-break-inside: avoid;
    }
    .content-grid,
    .image-section,
    .description-section,
    .section,
    .location-section,
    .image-container,
    .property-image { 
      page-break-inside: avoid; 
      break-inside: avoid; 
    }
    /* Keep table rows together */
    .table tr,
    .table thead,
    .table tbody,
    .table th,
    .table td { 
      page-break-inside: avoid; 
      break-inside: avoid; 
    }
    /* Keep headings attached to the content that follows */
    .section-heading { page-break-after: avoid; break-after: avoid; }

    .page-break { 
      page-break-before: always; 
      break-before: page; 
      margin: 0; 
      padding: 0; 
      height: 0; 
    }
    @media print { 
      .page-break { page-break-before: always; } 
    }
  </style>
</head>
<body>
  ${meta.headerImageUrl ? `
  <!-- New header with image -->
  <div class="header-container">
    ${logoUrl ? `<div class="logo-container"><img src="${escapeHtml(logoUrl)}" alt="Logo" class="logo" /></div>` : ""}
    <div class="image-container">
      <img src="${escapeHtml(meta.headerImageUrl)}" alt="Property Image" class="header-image" />
    </div>
    
    <!-- Header text appears below the image -->
    <div class="report-header-content">
      ${meta.headerText ? `<h1 class="header-text">${escapeHtml(meta.headerText)}</h1>` : ''}
      <h2 class="report-title">HOME INSPECTION REPORT</h2>
      <div class="meta-info">${escapeHtml(company)} • ${escapeHtml(date)}</div>
    </div>
  </div>
  ` : `
  <!-- Traditional header as fallback -->
  <header class="header-traditional">
    <div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="meta">${escapeHtml(subtitle)}${company ? " • " + escapeHtml(company) : ""} • ${escapeHtml(date)}</div>
    </div>
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="logo" />` : ""}
  </header>
  `}
  
  <div class="content-wrapper">

  ${reportType === 'summary' ? `
  <!-- Summary report: include Inspection Sections table beneath header -->
  <section class="cover cover--summary keep-together" style="margin-top:16px;">
    <h2 style="margin:0 0 12px 0;">Inspection Sections</h2>
    <table class="table" style="font-size:12px;">
      <thead>
        <tr>
          <th style="width:8%;">No.</th>
          <th style="width:32%;">Section</th>
          <th style="width:30%;">Defect</th>
          <th style="width:30%;">Defects summary</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.reduce((acc, d) => {
          if (d.section !== acc.last) { acc.current += 1; acc.sub = 1; acc.last = d.section; } else { acc.sub += 1; }
          const numbering = `${acc.current}.${acc.sub}`;
          const raw = d.defect_description || '';
          const parts = splitDefectText(raw);
          const defectTitle = parts.title || raw.split('.').shift() || '';
          // Summary body = first paragraph after title, or body text if different, fallback to empty
          let summaryBody = '';
          if (parts.paragraphs && parts.paragraphs.length) {
            summaryBody = parts.paragraphs[0];
          } else if (parts.body && parts.body !== parts.title) {
            summaryBody = parts.body;
          }
          // Final fallback: if no separate body, leave summary blank (do NOT duplicate title)
          acc.rows.push(`<tr><td>${escapeHtml(numbering)}</td><td>${escapeHtml(d.section)} - ${escapeHtml(d.subsection)}</td><td>${escapeHtml(defectTitle)}</td><td>${escapeHtml(summaryBody)}</td></tr>`);
          return acc;
        }, { rows: [] as string[], current: startNumber - 1, last: null as string | null, sub: 0 }).rows.join('\n')}
      </tbody>
    </table>
  </section>
  <div class="page-break"></div>
  ` : ''}

  ${reportType === 'full' ? `<section class="cover cover--section1 keep-together">
    <h2>Section 1 - Inspection Scope, Client Responsibilities, and Repair Estimates</h2>
    <hr style="margin: 8px 0 16px 0; border: none; height: 1px; background-color: #000000;">
    <p>This is a visual inspection only. The scope of this inspection is to verify the proper performance of the home's major systems. We do not verify proper design.</p>
    <p>The following items reflect the condition of the home and its systems <strong>at the time and date the inspection was performed</strong>. Conditions of an occupied home can change after the inspection (e.g., leaks may occur beneath sinks, water may run at toilets, walls or flooring may be damaged during moving, appliances may fail, etc.).</p>
    <p>Furnishings, personal items, and/or systems of the home are not dismantled or moved. A 3–4 hour inspection is not equal to "live-in exposure" and will not discover all concerns. Unless otherwise stated, we will only inspect/comment on the following systems: <em>Electrical, Heating/Cooling, Appliances, Plumbing, Roof and Attic, Exterior, Grounds, and the Foundation</em>.</p>
  <p>This inspection is not a warranty or insurance policy. The limit of liability of AGI Property Inspections and its employees does not extend beyond the day the inspection was performed.</p>
    <p>Cosmetic items (e.g., peeling wallpaper, wall scuffs, nail holes, normal wear and tear, etc.) are not part of this inspection. We also do not inspect for fungi, rodents, or insects. If such issues are noted, it is only to bring them to your attention so you can have the proper contractor evaluate further.</p>
    <p>Although every effort is made to inspect all systems, not every defect can be identified. Some areas may be inaccessible or hazardous. The home should be carefully reviewed during your final walk-through to ensure no new concerns have occurred and that requested repairs have been completed.</p>
  <p>Please contact our office immediately at <a href="tel:3379051428">337-905-1428</a> if you suspect or discover any concerns during the final walk-through.</p>
    <p>Repair recommendations and cost estimates included in this report are approximate, generated from typical labor and material rates in our region. They are not formal quotes and must always be verified by licensed contractors. AGI Property Inspections does not guarantee their accuracy.</p>
    <p>We do not provide guaranteed repair methods. Any corrections should be performed by qualified, licensed contractors. Consult your Real Estate Professional, Attorney, or Contractor for further advice regarding responsibility for these repairs.</p>
    <p>While this report may identify products involved in recalls or lawsuits, it is not comprehensive. Identifying all recalled products is not a requirement for Louisiana licensed Home Inspectors.</p>
    <p>This inspection complies with the standards of practice of the State of Louisiana Home Inspectors Licensing Board. Home inspectors are generalists and recommend further review by licensed specialists when needed.</p>
    <p><em>This inspection report and all information contained within is the sole property of AGI Property Inspections and is leased to the clients named in this report. It may not be shared or passed on without AGI’s consent. Doing so may result in legal action.</em></p>
  </section>

  <div class="page-break"></div>

  <section class="cover cover--section2 keep-together">
    <h2>Section 2 - Inspection Scope &amp; Limitations</h2>
    <hr style="margin: 8px 0 16px 0; border: none; height: 1px; background-color: #000000;">
    <h3>Inspection Categories &amp; Summary</h3>
    <h4 class="category-immediate">Immediate Attention</h4>
    <p class="category-immediate"><strong>Major Defects:</strong> Issues that compromise the home’s structural integrity, may result in additional damage if not repaired, or are considered a safety hazard. These items are color-coded red in the report and should be corrected as soon as possible.</p>
    <h4 class="category-repair">Items for Repair</h4>
    <p class="category-repair"><strong>Defects:</strong> Items in need of repair or correction, such as plumbing or electrical concerns, damaged or improperly installed components, etc. These are color-coded orange in the report and have no strict repair timeline.</p>
    <h4 class="category-maintenance">Maintenance Items</h4>
    <p class="category-maintenance">Small DIY-type repairs and maintenance recommendations provided to increase knowledge of long-term care. While not urgent, addressing these will reduce future repair needs and costs.</p>
  <h4 class="category-evaluation">Further Evaluation</h4>
  <p class="category-evaluation">In some cases, a defect falls outside the scope of a general home inspection or requires a more extensive level of knowledge to determine the full extent of the issue. These items should be further evaluated by a specialist.</p>
    <hr />
    <h3>Important Information &amp; Limitations</h3>
    <p>AGI Property Inspections performs all inspections in compliance with the Louisiana Standards of Practice. We inspect readily accessible, visually observable, permanently installed systems and components of the home. This inspection is not technically exhaustive or quantitative.</p>
    <p>Some comments may go beyond the minimum Standards as a courtesy to provide additional detail. Any item noted for repair, replacement, maintenance, or further evaluation should be reviewed by qualified, licensed tradespeople.</p>
    <p>This inspection cannot predict future conditions or reveal hidden or latent defects. The report reflects the home’s condition only at the time of inspection. Weather, occupancy, or use may reveal issues not present at the time.</p>
    <p>This report should be considered alongside the seller’s disclosure, pest inspection report, and contractor evaluations for a complete picture of the home’s condition.</p>
    <hr />
    <h3>Repair Estimates Disclaimer</h3>
    <p>This report may include repair recommendations and estimated costs. These are based on typical labor and material rates in our region, generated from AI image review. They are approximate and not formal quotes.</p>
    <ul>
      <li>Estimates are not formal quotes.</li>
      <li>They do not account for unique site conditions and may vary depending on contractor, materials, and methods.</li>
      <li>Final pricing must always be obtained through qualified, licensed contractors with on-site evaluation.</li>
      <li>AGI Property Inspections does not guarantee the accuracy of estimates or assume responsibility for work performed by outside contractors.</li>
    </ul>
    <hr />
    <h3>Recommendations</h3>
    <ul>
      <li>Contractors / Further Evaluation: Repairs noted should be performed by licensed professionals. Keep receipts for warranty and documentation purposes.</li>
      <li>Causes of Damage / Methods of Repair: Suggested repair methods are based on inspector experience and opinion. Final determination should always be made by licensed contractors.</li>
    </ul>
    <hr />
    <h3>Excluded Items</h3>
    <p>The following are not included in this inspection: septic systems, security systems, irrigation systems, pools, hot tubs, wells, sheds, playgrounds, saunas, outdoor lighting, central vacuums, water filters, water softeners, sound or intercom systems, generators, sport courts, sea walls, outbuildings, operating skylights, awnings, exterior BBQ grills, and firepits.</p>
    <hr />
    <h3>Occupied Home Disclaimer</h3>
    <p>If the home was occupied at the time of inspection, some areas may not have been accessible (furniture, personal belongings, etc.). Every effort was made to inspect all accessible areas; however, some issues may not have been visible.</p>
    <p>We recommend using your final walkthrough to verify that no issues were missed and that the property remains in the same condition as at the time of inspection.</p>
  </section>` : ''}

  ${reportType === 'full' ? `<!-- Non-priced defects summary placed after Section 2 -->
  <section class="cover cover--summary keep-together">
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
        ${summaryRowsSimple}
      </tbody>
    </table>
  </section>` : ''}

  ${reportType === 'full' ? '<div class="page-break"></div>' : ''}

  ${sectionsHtml}

  <div class="page-break"></div>

  ${reportType === 'full' ? `<section class="cover">
    <h2>Total Estimated Cost</h2>
    <table class="table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Defect</th>
          <th style="text-align:right;">Cost ($)</th>
        </tr>
      </thead>
      <tbody>
        ${costSummaryRows}
        <tr>
          <td colspan="2" style="font-weight:700;background:#f3f4f6;">Total Estimated Cost</td>
          <td style="font-weight:700;background:#f3f4f6; text-align:right;">${currency(totalAll)}</td>
        </tr>
      </tbody>
    </table>
  </section>` : ''}

  </div><!-- End of content-wrapper -->
  
  <footer class="footer">
    Generated by Advanced Image Editor • ${escapeHtml(company || "")}
  </footer>
</body>
</html>
  `;
}
