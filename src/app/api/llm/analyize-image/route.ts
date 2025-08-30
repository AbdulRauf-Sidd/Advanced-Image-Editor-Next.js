import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define TypeScript interfaces for better type safety
interface AnalysisRequest {
  imageUrl: string;
  description: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

interface AnalysisResult {
  title?: string;
  description?: string;
  recommended_action?: string;
  costs?: Array<{
    type: string;
    description: string;
    amount: string;
  }>;
  analysis?: string;
}

// Initialize OpenAI client with TypeScript type
const openai: OpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { imageUrl, description } = body;

    // Validate required parameters with proper TypeScript types
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({
        error: 'Missing required parameter',
        message: 'Valid imageUrl string is required',
      }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({
        error: 'Missing required parameter',
        message: 'Valid description string is required',
      }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'Server configuration error',
        message: 'OpenAI API key not configured',
      }, { status: 500 });
    }

    // Check if Assistant ID is configured
    if (!process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json({
        error: 'Server configuration error',
        message: 'OpenAI Assistant ID not configured',
      }, { status: 500 });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // For hosted images, we can use image_url instead of uploading a file
    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: description 
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      }
    );

    // Run the assistant
    const run = await openai.beta.threads.runs.create(
      thread.id,
      { 
        assistant_id: process.env.OPENAI_ASSISTANT_ID
      }
    );

    // Wait for completion with timeout
    let runStatus = run.status;
    let timeout = 0;
    const maxTimeout = 30000; // 30 seconds timeout

    while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled' && timeout < maxTimeout) {
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      timeout += 1000;
      
      const currentRun = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      
      runStatus = currentRun.status;
      
      if (runStatus === 'failed') {
        return NextResponse.json({
          error: 'OpenAI processing failed',
          message: 'The image analysis failed to complete',
          details: currentRun.last_error?.message || 'Unknown error'
        }, { status: 500 });
      }
    }

    // Check if we timed out
    if (timeout >= maxTimeout) {
      return NextResponse.json({
        error: 'Processing timeout',
        message: 'The image analysis took too long to complete',
      }, { status: 504 });
    }

    // Get the response messages
    const messages = await openai.beta.threads.messages.list(thread.id);

    // Extract assistant's response
    let assistantResponse = '';
    for (const msg of messages.data) {
      if (msg.role === 'assistant') {
        for (const content of msg.content) {
          if (content.type === 'text') {
            assistantResponse = content.text.value;
            break;
          }
        }
        if (assistantResponse) break;
      }
    }

    // If no response was found
    if (!assistantResponse) {
      return NextResponse.json({
        error: 'No response from assistant',
        message: 'The assistant did not return a valid response',
      }, { status: 500 });
    }

    // Try to parse the response as JSON
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse: AnalysisResult = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsedResponse);
      } else {
        // If it's not JSON, return as text
        return NextResponse.json({
          analysis: assistantResponse
        });
      }
    } catch (parseError) {
      // If JSON parsing fails, return the text response
      return NextResponse.json({
        analysis: assistantResponse
      });
    }

  } catch (error) {
    console.error('Error in analyze-image API:', error);
    
    // Handle specific OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json({
          error: 'Authentication failed',
          message: 'Invalid OpenAI API key',
        }, { status: 401 });
      } else if (error.status === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: 'Too many requests to OpenAI API',
        }, { status: 429 });
      } else if (error.status && error.status >= 500) {
        return NextResponse.json({
          error: 'OpenAI service unavailable',
          message: 'The OpenAI service is currently experiencing issues',
        }, { status: 502 });
      }
    }

    // Generic error response
    return NextResponse.json({
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