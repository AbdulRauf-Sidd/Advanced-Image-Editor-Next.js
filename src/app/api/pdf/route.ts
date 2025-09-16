import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Puppeteer returns a Node.js Buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    await browser.close();

    // ✅ Ensure we pass a pure ArrayBuffer
    const arrayBuffer = new Uint8Array(pdfBuffer).buffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=export.pdf",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
