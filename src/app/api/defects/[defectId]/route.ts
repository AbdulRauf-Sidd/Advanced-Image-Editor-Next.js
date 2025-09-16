import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = "agi_inspections_db";

// DELETE /api/defects/[defectId]
export async function DELETE(
  req: Request,
  { params }: { params: { defectId: string } }
) {
  try {
    const { defectId } = params;
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection("defects").deleteOne({
      _id: new ObjectId(defectId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
