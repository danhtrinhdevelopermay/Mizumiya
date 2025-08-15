import { db } from "./db";
import { stories, storyComments, storyReactions } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function cleanupExpiredStories() {
  try {
    console.log("Starting cleanup of expired stories...");
    
    // Delete expired stories (this will cascade delete comments and reactions)
    const result = await db
      .delete(stories)
      .where(sql`${stories.expiresAt} <= now()`);

    const deletedCount = result.rowCount || 0;
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} expired stories and their data`);
    } else {
      console.log("ℹ️ No expired stories found to clean up");
    }
    
    return deletedCount;
  } catch (error) {
    console.error("❌ Error cleaning up expired stories:", error);
    return 0;
  }
}

// Run cleanup every hour
export function startStoryCleanupScheduler() {
  // Run immediately on startup
  cleanupExpiredStories();
  
  // Then run every hour (3600000 ms)
  setInterval(cleanupExpiredStories, 3600000);
  
  console.log("📅 Story cleanup scheduler started - running every hour");
}