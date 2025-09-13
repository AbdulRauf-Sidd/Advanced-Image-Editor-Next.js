import { NextResponse } from "next/server";
import { getDefectsByInspection } from "@/lib/defect";

// GET /api/defects/[inspectionId]
export async function GET(
  req: Request,
  { params }: { params: { inspectionId: string } }
) {
  try {
    const { inspectionId } = params;
    const defects = await getDefectsByInspection(inspectionId);
    return NextResponse.json(defects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
