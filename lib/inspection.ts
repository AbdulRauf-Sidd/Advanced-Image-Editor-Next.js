// lib/inspection.ts
import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = "agi_inspections_db"; // change this

// 1. Create inspection
export async function createInspection(data: {
  name: string;
  status: string;
  date: string; // or Date
}) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const result = await db.collection("inspections").insertOne(data);
  return result.insertedId.toString();
}

// 2. Get all inspections
export async function getAllInspections() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return await db.collection("inspections").find({}).toArray();
}


export async function deleteInspection(inspectionId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Validate if inspectionId is a valid ObjectId
  if (!ObjectId.isValid(inspectionId)) {
    throw new Error('Invalid inspection ID format');
  }

  const result = await db.collection("inspections").deleteOne({
    _id: new ObjectId(inspectionId)
  });

  return result;
}