
"use server";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";
import type { ActivityAction, EntityType } from "./types";

interface LogActivityParams {
  userId: string;
  userName: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  details: string;
}

export async function logActivity(params: LogActivityParams) {
  if (!firestore) {
    console.error("Firestore is not initialized. Cannot log activity.");
    return;
  }

  try {
    const activityLogRef = collection(firestore, "activityLogs");
    await addDoc(activityLogRef, {
      ...params,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Depending on requirements, you might want to handle this more gracefully
  }
}
