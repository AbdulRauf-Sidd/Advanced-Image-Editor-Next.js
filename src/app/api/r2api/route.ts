import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert to Buffer for AWS SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique filename (you can also use uuid)
    const key = `uploads/${Date.now()}-${file.name}`;


    const result = await uploadToR2(buffer, key, file.type);
    // const result = await listBuckets();

    return NextResponse.json(
      { success: true, url: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
