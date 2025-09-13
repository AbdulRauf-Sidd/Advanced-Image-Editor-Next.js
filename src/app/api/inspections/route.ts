import { NextResponse } from "next/server";
import { createInspection, getAllInspections } from "@/lib/inspection";

// POST /api/inspections → create inspection
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = await createInspection(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.log('error', error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/inspections → list all
export async function GET() {
  try {
    const inspections = await getAllInspections();
    return NextResponse.json(inspections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
