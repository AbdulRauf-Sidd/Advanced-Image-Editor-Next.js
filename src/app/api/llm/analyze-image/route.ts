import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { uploadToR2 } from "@/lib/r2";
import { createDefect } from "@/lib/defect";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

interface AnalysisResult {
  defect?: string;
  materials_names?: string;
  materials_total_cost?: number;
  labor_type?: string;
  labor_rate?: number;
  hours_required?: number;
  recommendation?: string;
  analysis?: string;
}

export async function POST(request: Request) {
  try {
    let imageUrl: string | undefined;
    let description: string | undefined;
    let file: File | null = null;
    let location: string | undefined;
    let inspectionId: string | undefined;
    let section: string | undefined;
    let subSection: string | undefined;
    let selectedColor: string | undefined;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageUrl = body.imageUrl;
      description = body.description;
      location = body.location;
      inspectionId = body.inspectionId;
      section = body.section;
      subSection = body.subSection;
      selectedColor = body.selectedColor;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      file = form.get("image") as File | null;
      description = form.get("description") as string | undefined;
      imageUrl = form.get("imageUrl") as string | undefined;
      location = form.get("location") as string | undefined;
      inspectionId = form.get("inspectionId") as string | undefined;
      section = form.get('section') as string | undefined;
      subSection = form.get('subSection') as string | undefined;
      selectedColor = form.get('selectedColor') as string | undefined;
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    if ((!imageUrl && !file) || !description || !inspectionId) {
      return NextResponse.json(
        { error: "Missing required params: image/description/inspectionId" },
        { status: 400 }
      );
    }

    // Generate a unique ID for this analysis
    const analysisId = `${inspectionId}-${Date.now()}`;
    
    // Return response immediately
    const response = NextResponse.json(
      {
        message: "Analysis started. Defect will be saved when ready.",
        analysisId,
        statusUrl: `/api/analysis-status/${analysisId}`, // Optional: endpoint to check status
      },
      { status: 202 }
    );

    // Start background processing after sending response
    setTimeout(async () => {
      try {
        // ✅ If file provided, upload to R2 first
        let finalImageUrl = imageUrl;
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const key = `inspections/${inspectionId}/${Date.now()}-${file.name}`;
          finalImageUrl = await uploadToR2(buffer, key, file.type);
        }

        // ✅ Create a thread
        const thread = await openai.beta.threads.create();

        // ✅ Build assistant input
        const content: any[] = [
          { type: "text", text: `Description: ${description} || Location: ${location}` },
        ];

        if (file) {
          // Upload the file to OpenAI first 
          const uploaded = await openai.files.create({ file, purpose: "vision" });
          content.push({ type: "image_file", image_file: { file_id: uploaded.id } });
        } else if (imageUrl) { 
          content.push({ type: "image_url", image_url: { url: imageUrl } });
        }

        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content,
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID!,
        });

        let runStatus = run.status;
        while (!["completed", "failed", "cancelled"].includes(runStatus)) {
          await new Promise((r) => setTimeout(r, 2000));
          const currentRun = await openai.beta.threads.runs.retrieve(run.id, {
            thread_id: thread.id,
          });
          runStatus = currentRun.status;
        }

        if (runStatus !== "completed") {
          console.error("Run failed:", runStatus);
          // You might want to store the error status in a DB for the frontend to check
          return;
        }

        const messages = await openai.beta.threads.messages.list(thread.id);

        let assistantResponse = "";
        for (const msg of messages.data) {
          if (msg.role === "assistant") {
            for (const c of msg.content) {
              if (c.type === "text") {
                assistantResponse = c.text.value;
                break;
              }
            }
          }
          if (assistantResponse) break;
        }

        if (!assistantResponse) {
          console.error("No assistant response to save defect");
          return;
        }

        const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Assistant response not JSON:", assistantResponse);
          return;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // ✅ Save defect with uploaded R2 URL
        const defectData = {
          inspection_id: inspectionId,
          image: finalImageUrl!,
          location: location || "",
          section: section || "",
          subsection: subSection || "",
          defect_description: parsed.defect || description || "",
          defect_short_description: parsed.short_description || "",
          materials: parsed.materials_names || "",
          material_total_cost: parsed.materials_total_cost || 0,
          labor_type: parsed.labor_type || "",
          labor_rate: parsed.labor_rate || 0,
          hours_required: parsed.hours_required || 0,
          recommendation: parsed.recommendation || "",
          color: selectedColor || undefined,
        };

        console.log(defectData);

        await createDefect(defectData);
        console.log("✅ Defect saved for inspection", inspectionId);
        
        // You could update a status in your database here to mark this analysis as complete
      } catch (err) {
        console.error("Background processing error:", err);
        // You might want to store the error status in a DB for the frontend to check
      }
    }, 0); // setTimeout with 0ms delay runs after the current execution context

    return response;
  } catch (error: any) {
    console.error("Error in analyze-image API:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}



// Optional: Add GET method for testing or documentation
export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to analyze images',
    endpoint: '/api/llm/analyze-image',
    required_fields: ['imageUrl', 'description']
  });
}

// Optional: Add other HTTP methods if needed
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Only POST requests are accepted' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Only POST requests are accepted' },
    { status: 405 }
  );
}