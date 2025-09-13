import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { inspect } from 'util';


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

export async function POST(request: NextRequest) {
  try {
    // 👇 Detect whether the request is JSON or FormData
    let inspetctionId: string | undefined;
    let imageUrl: string | undefined;
    let description: string | undefined;
    let location: string | undefined;
    let file: File | null = null;
    let section: string | undefined;
    let subSection: string | undefined;


    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Case 1: Hosted image URL
      const body = await request.json();
      inspetctionId = body.inspection_id
      imageUrl = body.imageUrl;
      description = body.description;
      location = body.location;
      section = body.section
      subSection = body.sub_section
    } else if (contentType.includes('multipart/form-data')) {
      // Case 2: Uploaded image file
      const form = await request.formData();
      file = form.get('image') as File | null;
      inspetctionId = form.get('inspection_id') as string | undefined
      description = form.get('description') as string | undefined;
      location = form.get('location') as string | undefined;
      section = form.get('section') as string | undefined;
      subSection = form.get('sub_section') as string | undefined;
    } else {
      return NextResponse.json<ErrorResponse>({
        error: 'Unsupported content type',
        message: 'Use application/json or multipart/form-data',
      }, { status: 400 });
    }

    // Validate params
    if ((!imageUrl && !file) || !description) {
      return NextResponse.json<ErrorResponse>({
        error: 'Missing required parameter',
        message: 'Provide either an imageUrl or an uploaded file, plus a description',
      }, { status: 400 });
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json<ErrorResponse>({
        error: 'Server configuration error',
        message: 'OpenAI API key not configured',
      }, { status: 500 });
    }
    if (!process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json<ErrorResponse>({
        error: 'Server configuration error',
        message: 'OpenAI Assistant ID not configured',
      }, { status: 500 });
    }
    
    // ✅ Create a thread
    let assistant_ids: string | undefined;
    
    // let assistant_id = process.env.OPENAI_ASSISTANT_ID;
    
    assistant_ids = process.env.OPENAI_ASSISTANT_ID; // Default to version 1
    
    const thread = await openai.beta.threads.create();
    // ✅ Build message content
    const content: any[] = [{ type: "text", text: description }];
    
    if (file) {
      // Upload the file to OpenAI first
      const uploaded = await openai.files.create({
        file,
        purpose: "vision",
      });

      content.push({
        type: "image_file",
        image_file: { file_id: uploaded.id },
      });

      content.push({
        type: "text",
        text: description 
      });
    } else if (imageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
      content.push({
        type: "text",
        text: "Description: " + description + (location ? ", Location: " + location : "")
      });
    }

    // Send message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content,
    });

    // ✅ Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant_ids!
    });

    console.log('RUN', run.id);
    console.log('THREAD', thread.id);

    // ✅ Poll until complete
    let runStatus = run.status;
    let timeout = 0;
    const maxTimeout = 30000; // 30s

    while (!['completed', 'failed', 'cancelled'].includes(runStatus) && timeout < maxTimeout) {
      await new Promise(r => setTimeout(r, 1000));
      timeout += 1000;

      const currentRun = await openai.beta.threads.runs.retrieve(
        run.id,                  // runID
        { thread_id: thread.id } // params
      );
      runStatus = currentRun.status;

      if (runStatus === 'failed') {
        return NextResponse.json<ErrorResponse>({
          error: 'OpenAI processing failed',
          message: 'The image analysis failed to complete',
          details: currentRun.last_error?.message || 'Unknown error',
        }, { status: 500 });
      }
    }

    if (timeout >= maxTimeout) {
      return NextResponse.json<ErrorResponse>({
        error: 'Processing timeout',
        message: 'The image analysis took too long to complete',
      }, { status: 504 });
    }

    // ✅ Fetch messages
    const messages = await openai.beta.threads.messages.list(thread.id);

    let assistantResponse = '';
    for (const msg of messages.data) {
      if (msg.role === 'assistant') {
        for (const c of msg.content) {
          if (c.type === 'text') {
            assistantResponse = c.text.value;
            break;
          }
        }
        if (assistantResponse) break;
      }
    }

    if (!assistantResponse) {
      return NextResponse.json<ErrorResponse>({
        error: 'No response from assistant',
        message: 'The assistant did not return a valid response',
      }, { status: 500 });
    }

    // ✅ Parse JSON response if possible
    try {
      const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: AnalysisResult = JSON.parse(jsonMatch[0]);
        
        // Calculate total cost if materials and labor costs are provided
        let totalCost = 0;
        if (parsed.materials_total_cost) {
          totalCost += parsed.materials_total_cost;
        }
        if (parsed.labor_rate && parsed.hours_required) {
          totalCost += parsed.labor_rate * parsed.hours_required;
        }
        
        // Add total cost to the response
        const responseWithTotal = {
          ...parsed,
          total_estimated_cost: totalCost
        };
        
        return NextResponse.json(responseWithTotal);
      }
      return NextResponse.json<AnalysisResult>({ analysis: assistantResponse });
    } catch {
      return NextResponse.json<AnalysisResult>({ analysis: assistantResponse });
    }

  } catch (error: any) {
    console.error('Error in analyze-image API:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json<ErrorResponse>({
          error: 'Authentication failed',
          message: 'Invalid OpenAI API key',
        }, { status: 401 });
      } else if (error.status === 429) {
        return NextResponse.json<ErrorResponse>({
          error: 'Rate limit exceeded',
          message: 'Too many requests to OpenAI API',
        }, { status: 429 });
      } else if (error.status && error.status >= 500) {
        return NextResponse.json<ErrorResponse>({
          error: 'OpenAI service unavailable',
          message: 'The OpenAI service is currently experiencing issues',
        }, { status: 502 });
      }
    }

    return NextResponse.json<ErrorResponse>({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing the image',
    }, { status: 500 });
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