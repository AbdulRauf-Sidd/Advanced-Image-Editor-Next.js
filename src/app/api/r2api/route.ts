import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_R2_BUCKET",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_PUBLIC_URL"
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error(`Missing environment variables: ${missingVars.join(', ')}`);
      return NextResponse.json(
        { error: "Server configuration error: Missing R2 storage credentials" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (limit to 5MB for example)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, GIF, and WebP images are supported" },
        { status: 400 }
      );
    }

    // Convert to Buffer for AWS SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique filename with sanitized name
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitizedName}`;

    console.log("Starting R2 upload process...");
    const result = await uploadToR2(buffer, key, file.type);

    return NextResponse.json(
      { success: true, url: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
