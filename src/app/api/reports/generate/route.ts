import { NextRequest } from "next/server";
import { generateInspectionReportHTML, type DefectItem, type ReportMeta } from "../../../../../lib/pdfTemplate";

export const runtime = "nodejs"; // ensure Node runtime for puppeteer
export const dynamic = "force-dynamic"; // avoid caching
export const maxDuration = 60; // allow enough time on Vercel

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

    // Launch headless browser using puppeteer-core + @sparticuz/chromium (serverless-compatible)
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    const isServerless = !!process.env.AWS_REGION || !!process.env.VERCEL;

    // Resolve executable path differently for serverless vs local
    let executablePath: string | undefined = undefined;
    if (isServerless) {
      executablePath = (await chromium.executablePath()) || undefined;
    } else {
      // For local dev, prefer env variable or common install paths
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || undefined;
    }

    // Validate existence and try known OS-specific fallbacks when local
    const { existsSync } = await import("fs");
    const pathExists = (p?: string) => (p ? existsSync(p) : false);
    if (!isServerless) {
      const isWin = process.platform === "win32";
      const isMac = process.platform === "darwin";
      const candidates: string[] = [];
      if (isWin) {
        candidates.push(
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA?.replace(/\\$/,'')}\\Google\\Chrome\\Application\\chrome.exe`
        );
      } else if (isMac) {
        candidates.push(
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium"
        );
      } else {
        candidates.push(
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser"
        );
      }

      // If the provided path doesn't exist, try candidates
      if (!pathExists(executablePath)) {
        executablePath = candidates.find((p) => pathExists(p));
      }

      // Final guard with guidance for developers
      if (!executablePath) {
        throw new Error(
          "Chrome executable not found on this machine. Set PUPPETEER_EXECUTABLE_PATH to your Chrome/Chromium binary or install Chrome."
        );
      }
    }

    const browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless ?? true,
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
