import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import { generateInspectionReportHTML, type DefectItem, type ReportMeta } from "../../../../../lib/pdfTemplate";

export const runtime = "nodejs"; // ensure Node runtime for puppeteer

type Payload = {
  defects: DefectItem[];
  meta?: ReportMeta;
};

export async function POST(req: NextRequest) {
  try {
    const { defects, meta } = (await req.json()) as Payload;

    if (!Array.isArray(defects) || defects.length === 0) {
      return new Response(JSON.stringify({ error: "defects array is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const html = generateInspectionReportHTML(defects, meta);

    // Launch headless browser
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Ensure images are loaded
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve(true);
          return new Promise((resolve) => {
            img.addEventListener("load", () => resolve(true));
            img.addEventListener("error", () => resolve(true));
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });

    await browser.close();

    const filename = (meta?.title || "inspection-report").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".pdf";

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename=${filename}`,
        "cache-control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to generate PDF" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
