import { NextResponse } from "next/server";
import { deleteInspection } from "@/lib/inspection";

export async function DELETE(
  req: Request,
  { params }: { params: { inspectionId: string } }
) {
  try {
    const { inspectionId } = params;
    
    console.log('Deleting inspection ID:', inspectionId);
    
    if (!inspectionId) {
      return NextResponse.json(
        { error: "Inspection ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteInspection(inspectionId);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "Inspection deleted successfully",
        deletedCount: result.deletedCount 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting inspection:", error);
    
    if (error.message.includes("Invalid inspection ID format")) {
      return NextResponse.json(
        { error: "Invalid inspection ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to delete inspection" },
      { status: 500 }
    );
  }
}