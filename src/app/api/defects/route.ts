import { NextResponse } from "next/server";
import { createDefect } from "@/lib/defect";

// POST /api/defects → create defect
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = await createDefect(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
