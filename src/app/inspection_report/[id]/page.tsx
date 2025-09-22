"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
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

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const translateStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const baseSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Navigation state
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'full' | 'summary' | 'hazard'>('full');

  // Smooth scroll to anchors from summary table
  const scrollToAnchor = useCallback((anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Optional: focus heading for accessibility
      const h = el.querySelector('h2, h3');
      if (h && (h as HTMLElement).focus) {
        (h as HTMLElement).setAttribute('tabindex', '-1');
        (h as HTMLElement).focus({ preventScroll: true });
      }
    }
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setLightboxSrc(null);
        setZoomScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    };
    document.addEventListewner('keydown', onKey);
    // Prevent background scroll while lightbox is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  // Handle panning while zoomed in
  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const next = { x: translateStart.current.x + dx, y: translateStart.current.y + dy };
      // Clamp within container bounds
      const container = overlayRef.current?.getBoundingClientRect();
      const baseW = baseSizeRef.current.w || imageRef.current?.getBoundingClientRect().width || 0;
      const baseH = baseSizeRef.current.h || imageRef.current?.getBoundingClientRect().height || 0;
      const scaledW = baseW * zoomScale;
      const scaledH = baseH * zoomScale;
      const containerW = container?.width || window.innerWidth;
      const containerH = container?.height || window.innerHeight;
      const maxX = Math.max(0, (scaledW - containerW) / 2);
      const maxY = Math.max(0, (scaledH - containerH) / 2);
      setTranslate({
        x: Math.min(Math.max(next.x, -maxX), maxX),
        y: Math.min(Math.max(next.y, -maxY), maxY),
      });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setZoomScale(1);
    setTranslate({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomScale === 1) {
      setZoomScale(2.5);
      setTranslate({ x: 0, y: 0 });
    } else {
      setZoomScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const startPanHandler = (e: React.MouseEvent) => {
    if (zoomScale === 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  };

  const onImageLoad = () => {
    // Capture the displayed size at scale=1 to compute bounds reliably
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      baseSizeRef.current = { w: rect.width, h: rect.height };
    }
  };

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

  const handleDownloadHTML = async () => {
    // Build a minimal standalone HTML using current reportSections
    try {
      const title = `inspection-${id}-report`;
      const escapeHtml = (s: any) =>
        String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      // Build summary table rows and totals
      const summaryRows = reportSections
        .map((s) => {
          const cost = s.estimatedCosts?.totalEstimatedCost ?? 0;
          const def = s.defect || (s.defect_description ? String(s.defect_description).split('.') [0] : '');
          return `
            <tr>
              <td>${escapeHtml(s.numbering ?? '')}</td>
              <td>${escapeHtml(s.sectionName ?? '')} - ${escapeHtml(s.heading2?.split(' - ')[1] ?? '')}</td>
              <td>${escapeHtml(def)}</td>
              <td style="text-align:right;">$${cost}</td>
            </tr>
          `;
        })
        .join('');
      const totalAll = reportSections.reduce((sum: number, s: any) => sum + (s.estimatedCosts?.totalEstimatedCost ?? 0), 0);

      // Intro sections (Section 1 & 2) content
      const introHtml = `
        <section class="rpt-section">
          <h2 class="rpt-h2">Section 1 - Inspection Scope, Client Responsibilities, and Repair Estimates</h2>
          <div class="rpt-card">
            <p>This is a <strong>visual inspection only</strong>. The scope of this inspection is to verify the proper performance of the home's major systems. We do not verify proper design.</p>
            <p>The following items reflect the condition of the home and its systems<strong> at the time and date the inspection was performed</strong>. Conditions of an occupied home can change after the inspection (e.g., leaks may occur beneath sinks, water may run at toilets, walls or flooring may be damaged during moving, appliances may fail, etc.).</p>
            <p>Furnishings, personal items, and/or systems of the home are not dismantled or moved. A 3–4 hour inspection is not equal to "live-in exposure" and will not discover all concerns. Unless otherwise stated, we will only inspect/comment on the following systems: <em>Electrical, Heating/Cooling, Appliances, Plumbing, Roof and Attic, Exterior, Grounds, and the Foundation</em>.</p>
            <p class="note"><strong>NOTE:</strong> This inspection is not a warranty or insurance policy. The limit of liability of AGI Property Inspections and its employees does not extend beyond the day the inspection was performed.</p>
            <p>Cosmetic items (e.g., peeling wallpaper, wall scuffs, nail holes, normal wear and tear, etc.) are not part of this inspection. We also do not inspect for fungi, rodents, or insects. If such issues are noted, it is only to bring them to your attention so you can have the proper contractor evaluate further.</p>
            <p>Although every effort is made to inspect all systems, not every defect can be identified. Some areas may be inaccessible or hazardous. The home should be carefully reviewed during your final walk-through to ensure no new concerns have occurred and that requested repairs have been completed.</p>
            <p class="note"><strong>IMPORTANT:</strong> Please contact our office immediately at <a href="tel:3379051428">337-905-1428</a> if you suspect or discover any concerns during the final walk-through.</p>
            <p>Repair recommendations and cost estimates included in this report are <strong>approximate</strong>, generated from typical labor and material rates in our region. They are not formal quotes and must always be verified by licensed contractors. AGI Property Inspections does not guarantee their accuracy.</p>
            <p>We do not provide guaranteed repair methods. Any corrections should be performed by qualified, licensed contractors. Consult your Real Estate Professional, Attorney, or Contractor for further advice regarding responsibility for these repairs.</p>
            <p>While this report may identify products involved in recalls or lawsuits, it is not comprehensive. Identifying all recalled products is not a requirement for Louisiana licensed Home Inspectors.</p>
            <p>This inspection complies with the standards of practice of the <strong>State of Louisiana Home Inspectors Licensing Board</strong>. Home inspectors are generalists and recommend further review by licensed specialists when needed.</p>
            <p class="disclaimer">This inspection report and all information contained within is the sole property of AGI Property Inspections and is leased to the clients named in this report. It may not be shared or passed on without AGI’s consent. <em>Doing so may result in legal action.</em></p>
          </div>
        </section>

        <section class="rpt-section">
          <h2 class="rpt-h2">Section 2 - Inspection Scope & Limitations</h2>
          <div class="rpt-card">
            <h3>Inspection Categories & Summary</h3>
            <h4 class="cat-red">Immediate Attention</h4>
            <p class="cat-red">Major Defects: Issues that compromise the home’s structural integrity, may result in additional damage if not repaired, or are considered a safety hazard. These items are color-coded red in the report and should be corrected as soon as possible.</p>

            <h4 class="cat-orange">Items for Repair</h4>
            <p class="cat-orange">Defects: Items in need of repair or correction, such as plumbing or electrical concerns, damaged or improperly installed components, etc. These are color-coded orange in the report and have no strict repair timeline.</p>

            <h4 class="cat-blue">Maintenance Items</h4>
            <p class="cat-blue">Small DIY-type repairs and maintenance recommendations provided to increase knowledge of long-term care. While not urgent, addressing these will reduce future repair needs and costs.</p>

            <h4 class="cat-purple">Recommend Further Evaluation</h4>
            <p class="cat-purple">Items that would benefit from evaluation by a specialist or licensed professional for a more in-depth assessment.</p>

            <hr class="rpt-hr" />
            <h3>Important Information & Limitations</h3>
            <p>AGI Property Inspections performs all inspections in compliance with the <strong>Louisiana Standards of Practice</strong>. We inspect readily accessible, visually observable, permanently installed systems and components of the home. This inspection is not technically exhaustive or quantitative.</p>
            <p>Some comments may go beyond the minimum Standards as a courtesy to provide additional detail. Any item noted for repair, replacement, maintenance, or further evaluation should be reviewed by qualified, licensed tradespeople.</p>
            <p>This inspection cannot predict future conditions or reveal hidden or latent defects. The report reflects the home’s condition only at the time of inspection. Weather, occupancy, or use may reveal issues not present at the time.</p>
            <p>This report should be considered alongside the <strong>seller’s disclosure, pest inspection report, and contractor evaluations</strong> for a complete picture of the home’s condition.</p>

            <hr class="rpt-hr" />
            <h3>Repair Estimates Disclaimer</h3>
            <ul>
              <li>Estimates are <strong>not formal quotes</strong>.</li>
              <li>They do not account for unique site conditions and may vary depending on contractor, materials, and methods.</li>
              <li>Final pricing must always be obtained through qualified, licensed contractors with on-site evaluation.</li>
              <li>AGI Property Inspections does not guarantee the accuracy of estimates or assume responsibility for work performed by outside contractors.</li>
            </ul>

            <hr class="rpt-hr" />
            <h3>Excluded Items</h3>
            <p>The following are not included in this inspection: septic systems, security systems, irrigation systems, pools, hot tubs, wells, sheds, playgrounds, saunas, outdoor lighting, central vacuums, water filters, water softeners, sound or intercom systems, generators, sport courts, sea walls, outbuildings, operating skylights, awnings, exterior BBQ grills, and firepits.</p>

            <hr class="rpt-hr" />
            <h3>Occupied Home Disclaimer</h3>
            <p>If the home was occupied at the time of inspection, some areas may not have been accessible (furniture, personal belongings, etc.). Every effort was made to inspect all accessible areas; however, some issues may not have been visible.</p>
            <p>We recommend using your final walkthrough to verify that no issues were missed and that the property remains in the same condition as at the time of inspection.</p>
          </div>
        </section>
      `;

      const sectionHtml = reportSections
        .map((s) => {
          const imgSrc = typeof s.image === 'string' ? s.image : '';
          const cost = s.estimatedCosts?.totalEstimatedCost ?? 0;
          return `
            <section id="${s.anchorId}" class="rpt-section">
              <h2 class="rpt-h2" style="color:${s.color || '#dc2626'}">
                ${escapeHtml(s.heading)}
                <span class="rpt-badge" style="background:${s.color || '#dc2626'}">${(function(){
                  const c=(s.color||'').toLowerCase();
                  if(c.includes('d63636')||c.includes('dc2626')||c.includes('ef4444')||c.includes('ff0000')) return 'Immediate Attention';
                  if(c.includes('e69500')||c.includes('f59e0b')||c.includes('ffa500')||c.includes('fb923c')) return 'Items for Repair';
                  if(c.includes('2d6cdf')||c.includes('3b82f6')||c.includes('60a5fa')||c.includes('1d4ed8')) return 'Maintenance Items';
                  if(c.includes('7c3aed')||c.includes('8b5cf6')||c.includes('6d28d9')||c.includes('9333ea')) return 'Further Evaluation';
                  return 'Immediate Attention';
                })()}</span>
              </h2>
              <div class="rpt-grid">
                <div class="rpt-col">
                  ${imgSrc ? `<img class="rpt-img" src="${imgSrc}" alt="Defect image"/>` : ''}
                  <div class="rpt-card"><h4>Location</h4><p>${escapeHtml(s.location)}</p></div>
                </div>
                <div class="rpt-col">
                  <div class="rpt-card">
                    <h4>Defect Description</h4>
                    <p>${escapeHtml(s.defect_description)}</p>
                  </div>
                  <div class="rpt-card">
                    <h4>Estimated Costs</h4>
                    <p>
                      <strong>Materials:</strong> ${escapeHtml(s.estimatedCosts?.materials)} ($${s.estimatedCosts?.materialsCost ?? 0}),
                      <strong>Labor:</strong> ${escapeHtml(s.estimatedCosts?.labor)} at $${s.estimatedCosts?.laborRate ?? 0}/hr,
                      <strong>Hours:</strong> ${s.estimatedCosts?.hoursRequired ?? 0},
                      <strong>Recommendation:</strong> ${escapeHtml(s.estimatedCosts?.recommendation)},
                      <strong>Total Estimated Cost:</strong> $${cost}
                    </p>
                  </div>
                </div>
              </div>
            </section>`;
        })
        .join('\n');

      const doc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:24px}
    .rpt-wrap{max-width:1100px;margin:0 auto}
    .rpt-h1{font-size:28px;margin:0 0 16px 0}
    .rpt-toc{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.06);margin:12px 0}
    .toc-h{font-weight:800;margin:0;padding:14px 16px;border-bottom:1px solid #f1f5f9}
    .toc-ul{list-style:none;margin:0;padding:8px 12px 12px}
    .toc-li{display:flex;align-items:center}
    .toc-li+.toc-li{border-top:1px dashed #e5e7eb}
    .toc-a{display:grid;grid-template-columns:auto 1fr auto;gap:10px;width:100%;padding:10px 8px;color:#0f172a;text-decoration:none}
    .toc-a:hover{background:#f8fafc}
    .toc-text{font-weight:600}
    .toc-dots{height:1px;background-image:linear-gradient(to right,#d1d5db 33%,rgba(255,255,255,0) 0);background-size:8px 1px;background-repeat:repeat-x}
    .toc-badge{font-weight:700;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:9999px;padding:2px 10px;min-width:28px;text-align:center}
    .rpt-section{background:#fff;border:1px solid #e7eaf3;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);padding:24px;margin:24px 0}
    .rpt-h2{margin:0 0 16px 0}
    .rpt-grid{display:grid;grid-template-columns:1fr 2fr;gap:16px}
    .rpt-col{}
    .rpt-img{width:100%;height:auto;border-radius:12px;display:block}
  /* Make images clickable in export */
  .rpt-img{cursor: zoom-in}
  /* Lightbox overlay */
  .lb-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:none;align-items:center;justify-content:center;z-index:9999}
  .lb-overlay.open{display:flex}
  .lb-img{max-width:95vw;max-height:92vh;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:transform 80ms linear;will-change:transform;cursor: zoom-in}
    .rpt-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0}
    .rpt-badge{display:inline-block;margin-left:8px;padding:2px 10px;border-radius:9999px;font-weight:700;color:#fff;font-size:12px}
    .rpt-hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0}
    .cat-red{color:#dc2626}
    .cat-orange{color:#f59e0b}
    .cat-blue{color:#3b82f6}
    .cat-purple{color:#7c3aed}
    .rpt-table{width:100%;border-collapse:collapse;margin-top:12px}
    .rpt-table th,.rpt-table td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:14px}
    .rpt-table thead th{background:#f3f4f6}
    .rpt-table tfoot td{font-weight:700;background:#f3f4f6}
    .note{background:#fff8e1;border-left:4px solid #ff9800;padding:8px;margin:8px 0}
    .disclaimer{font-size:12px;color:#6b7280;font-style:italic;border-top:1px solid #e5e7eb;padding-top:8px}
    @media(max-width:768px){.rpt-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="rpt-wrap">
    <h1 class="rpt-h1">Inspection Report</h1>
    <div class="rpt-toc">
      <div class="toc-h">Inspection Sections</div>
      <ul class="toc-ul">
        ${Object.entries(groupedBySection)
          .map(([name, data]) => {
            const txt = escapeHtml(name);
            return `<li class="toc-li"><a class="toc-a" href="#${data.firstAnchor ?? ''}"><span class="toc-text">${txt}</span><span class="toc-dots"></span><span class="toc-badge">${data.count}</span></a></li>`;
          })
          .join('')}
      </ul>
    </div>
    ${introHtml}
    ${sectionHtml}
    <!-- Lightbox overlay for image zoom/pan -->
    <div id="lb-overlay" class="lb-overlay" role="dialog" aria-modal="true" aria-label="Image preview">
      <img id="lb-img" class="lb-img" alt="Zoomed defect" />
    </div>
    <script>
      (function(){
        var overlay = document.getElementById('lb-overlay');
        var img = document.getElementById('lb-img');
        var isPanning = false;
        var startX = 0, startY = 0;
        var tx = 0, ty = 0;
        var startTx = 0, startTy = 0;
        var scale = 1;
        var baseW = 0, baseH = 0;

        function updateTransform(){
          img.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
          if (scale > 1) {
            img.style.cursor = isPanning ? 'grabbing' : 'grab';
          } else {
            img.style.cursor = 'zoom-in';
          }
        }

        function openLightbox(src){
          img.src = src;
          scale = 1; tx = 0; ty = 0;
          updateTransform();
          overlay.classList.add('open');
          document.body.style.overflow = 'hidden';
          // measure base size after next frame
          setTimeout(function(){
            var rect = img.getBoundingClientRect();
            baseW = rect.width; baseH = rect.height;
          }, 0);
        }

        function closeLightbox(){
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }

        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLightbox(); });
        overlay.addEventListener('click', function(){ closeLightbox(); });
        img.addEventListener('click', function(e){ e.stopPropagation(); });

        // Double-click to toggle zoom
        img.addEventListener('dblclick', function(e){
          e.preventDefault();
          if (scale === 1) { scale = 2.5; } else { scale = 1; tx = 0; ty = 0; }
          updateTransform();
        });

        // Pan when zoomed
        img.addEventListener('mousedown', function(e){
          if (scale === 1) return;
          isPanning = true;
          startX = e.clientX; startY = e.clientY;
          startTx = tx; startTy = ty;
          e.preventDefault();
        });
        document.addEventListener('mousemove', function(e){
          if (!isPanning) return;
          var dx = e.clientX - startX;
          var dy = e.clientY - startY;
          var nextX = startTx + dx;
          var nextY = startTy + dy;
          // Clamp within overlay bounds
          var container = overlay.getBoundingClientRect();
          var scaledW = baseW * scale;
          var scaledH = baseH * scale;
          var maxX = Math.max(0, (scaledW - container.width) / 2);
          var maxY = Math.max(0, (scaledH - container.height) / 2);
          tx = Math.min(Math.max(nextX, -maxX), maxX);
          ty = Math.min(Math.max(nextY, -maxY), maxY);
          updateTransform();
        });
        document.addEventListener('mouseup', function(){ isPanning = false; });

        // Attach click handlers to exported images
        Array.prototype.forEach.call(document.querySelectorAll('.rpt-img'), function(el){
          el.addEventListener('click', function(){ openLightbox(el.getAttribute('src')); });
        });
      })();
    </script>
    <section class="rpt-section">
      <h2 class="rpt-h2">Defects Summary & Total Estimated Cost</h2>
      <table class="rpt-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Section</th>
            <th>Defect</th>
            <th style="text-align:right;">Cost</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td style="text-align:right;">$${totalAll}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  </div>
</body>
</html>`;

      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('HTML export failed', e);
      alert('Failed to export HTML. See console for details.');
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
  const anchorId = `defect-${defect._id || numbering.replace(/\./g, '-')}`;

      const totalEstimatedCost =
        defect.material_total_cost +
        defect.labor_rate * defect.hours_required;

      return {
        id: defect._id,
        anchorId,
        numbering,
        sectionName: defect.section,
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

  const isHazardColor = (hex?: string) => {
    if (!hex) return false;
    const c = hex.toLowerCase();
    return c.includes('d63636') || c.includes('ff0000') || c.includes('dc2626') || c.includes('ef4444');
  };

  const visibleSections = useMemo(() => {
    if (filterMode === 'hazard') {
      return reportSections.filter((r) => isHazardColor(r.color));
    }
    // For 'full' and 'summary', show all defects; the difference is intro sections visibility
    return reportSections;
  }, [reportSections, filterMode]);

  // Group by section for sidebar
  const groupedBySection = useMemo(() => {
    const groups: Record<string, { count: number; firstAnchor: string | null; items: Array<{ title: string; numbering: string; anchorId: string }> }> = {};
    for (const r of reportSections) {
      const key = r.sectionName || 'Other';
      if (!groups[key]) {
        groups[key] = { count: 0, firstAnchor: null, items: [] };
      }
      groups[key].count += 1;
      if (!groups[key].firstAnchor) groups[key].firstAnchor = r.anchorId;
      groups[key].items.push({ title: r.heading2?.split(' - ')[1] || r.defect || '', numbering: r.numbering, anchorId: r.anchorId });
    }
    return groups;
  }, [reportSections]);

  // Scrollspy with IntersectionObserver
  useEffect(() => {
    if (!reportSections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveAnchor(visible.target.id);
        }
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    reportSections.forEach((r) => {
      const el = document.getElementById(r.anchorId);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [reportSections]);

  const colorToImportance = useCallback((hex?: string) => {
    if (!hex) return 'Immediate Attention';
    const c = hex.toLowerCase();
    if (c.includes('d63636') || c.includes('dc2626') || c.includes('ef4444') || c.includes('ff0000')) return 'Immediate Attention';
    if (c.includes('e69500') || c.includes('f59e0b') || c.includes('ffa500') || c.includes('fb923c')) return 'Items for Repair';
    if (c.includes('2d6cdf') || c.includes('3b82f6') || c.includes('60a5fa') || c.includes('1d4ed8')) return 'Maintenance Items';
    if (c.includes('7c3aed') || c.includes('8b5cf6') || c.includes('6d28d9') || c.includes('9333ea')) return 'Further Evaluation';
    return 'Immediate Attention';
  }, []);

  return (
    <div className={styles.userReportContainer}>
      <main className="py-8">
        {/* Removed top Download PDF button for clarity; use Export PDF in toolbar */}
        <div className={`${styles.reportLayout} ${styles.noSidebar}`}>
          <div ref={reportRef} className={styles.mainContent}>
            <div className={styles.reportSectionsContainer}>
              <div className={styles.reportToolbar} role="tablist" aria-label="Report view">
                <div className={styles.toolbarGroup}>
                <button
                  role="tab"
                  aria-selected={filterMode === 'full'}
                  className={`${styles.toolbarBtn} ${filterMode === 'full' ? styles.toolbarBtnActive : ''}`}
                  onClick={() => { setFilterMode('full'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Full Report
                </button>
                <button
                  role="tab"
                  aria-selected={filterMode === 'summary'}
                  className={`${styles.toolbarBtn} ${filterMode === 'summary' ? styles.toolbarBtnActive : ''}`}
                  onClick={() => { setFilterMode('summary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Summary
                </button>
                <button
                  role="tab"
                  aria-selected={filterMode === 'hazard'}
                  className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger} ${filterMode === 'hazard' ? styles.toolbarBtnActive : ''}`}
                  onClick={() => { setFilterMode('hazard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Safety Hazard / Repair Now
                </button>
                </div>
                <div className={styles.toolbarRightGroup}>
                  <button className={styles.toolbarBtn} onClick={handleDownloadHTML} title="Export HTML">
                    Export HTML
                  </button>
                  <button className={styles.toolbarBtn} onClick={handleDownloadPDF} title="Export PDF">
                    Export PDF
                  </button>
                </div>
              </div>
              {/* Inspection Sections - TOC */}
              <nav className={styles.tocContainer} aria-label="Inspection Sections">
                <div className={styles.tocHeader}>
                  <h2 className={styles.tocTitle}>Inspection Sections</h2>
                </div>
                <ul className={styles.tocList}>
                  {Object.entries(groupedBySection).map(([sectionName, data]) => {
                    const sectionIsActive = data.items.some(i => i.anchorId === activeAnchor);
                    return (
                      <li key={sectionName} className={`${styles.tocItem} ${sectionIsActive ? styles.tocItemActive : ''}`}>
                        <button
                          className={styles.tocLink}
                          onClick={() => { if (data.firstAnchor) scrollToAnchor(data.firstAnchor); }}
                          aria-current={sectionIsActive ? 'page' : undefined}
                          title={`${sectionName} (${data.count})`}
                        >
                          <span className={styles.tocText}>{sectionName}</span>
                          <span className={styles.tocDots} aria-hidden="true" />
                          <span className={styles.tocCount}>{data.count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <br></br><br></br>
              {filterMode === 'full' && <>
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

                      <h4 className={styles.maintenanceItems}>Maintenance Items</h4>
                      <div className={styles.maintenanceItems}>
                      {/* <p> */}
                        Small DIY-type repairs and maintenance recommendations provided to increase
                        knowledge of long-term care. While not urgent, addressing these will reduce
                        future repair needs and costs.
                      {/* </p> */}
                      </div>

                      <h4 className={styles.recomended}>Recommend Further Evaluation</h4>
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

                  <br></br>
              </>}
                {visibleSections.map((section) => (
                <div 
                  key={section.id} 
                  className={styles.reportSection}
                  id={section.anchorId}
                  style={{
                    '--selected-color': getSelectedColor(section),
                    '--light-color': getLightColor(section),
                  } as React.CSSProperties}
                >
                  {/* Heading */}
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionHeadingText}>
                      {section.heading}
                      <span className={styles.importanceBadge} style={{ background: getSelectedColor(section) }}>
                        {colorToImportance(section.color)}
                      </span>
                    </h2>
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
                            role="button"
                            onClick={() => { openLightbox(typeof section.image === 'string' ? section.image : URL.createObjectURL(section.image)); }}
                            style={{ cursor: 'zoom-in' }}
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
            {filterMode === 'full' && (
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
            )}

            {filterMode === 'hazard' && visibleSections.length === 0 && (
              <div className={styles.descriptionSectionStart} style={{ marginTop: '1rem' }}>
                <p><strong>No safety hazards found.</strong></p>
              </div>
            )}
              {/* Lightbox Overlay */}
              {lightboxOpen && lightboxSrc && (
                <div
                  ref={overlayRef}
                  className={styles.lightboxOverlay}
                  onClick={() => { setLightboxOpen(false); setLightboxSrc(null); setZoomScale(1); setTranslate({ x: 0, y: 0 }); }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Image preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={lightboxSrc}
                    alt="Zoomed defect"
                    className={styles.lightboxImage}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={toggleZoom}
                    onMouseDown={startPanHandler}
                    onLoad={onImageLoad}
                    style={{
                      transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${zoomScale})`,
                      cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                      transition: isPanning ? 'none' : 'transform 80ms linear',
                      willChange: 'transform',
                    }}
                  />
                </div>
              )}
            </div>
            </div>
        </div>
      </main>
      </div>

  );
}
