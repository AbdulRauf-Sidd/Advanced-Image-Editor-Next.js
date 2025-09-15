// lib/defect.ts
import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = "agi_inspections_db"; // change this

// 3. Create defect
export async function createDefect(data: {
  inspection_id: string;
  image: string;
  location: string;
  section: string;
  subsection: string;
  defect_description: string;
  material_names: string[];
  material_total_cost: number;
  labor_type: string;
  labor_rate: number;
  hours_required: number;
  recommendation: string;
  selectedArrowColor?: string; // Add selected arrow color field
}) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // ensure inspection_id stored as ObjectId
  const defectData = {
    ...data,
    inspection_id: new ObjectId(data.inspection_id),
  };

  const result = await db.collection("defects").insertOne(defectData);
  return result.insertedId.toString();
}

// 4. Get defects by inspection_id
export async function getDefectsByInspection(inspectionId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return await db
    .collection("defects")
    .find({ inspection_id: new ObjectId(inspectionId) })
    .toArray();
}
