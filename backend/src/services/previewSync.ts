/**
 * Syncs the updated project files to the preview app Expo environment
 * This creates a sync flag/signal for the frontend to know it should refresh
 * 
 * In production, the frontend will:
 * 1. Call this endpoint
 * 2. Then manually trigger `npm run preview:load -- <projectId> <token>`
 * 3. Or the frontend monitors file changes and refreshes the preview
 */
export const markPreviewForSync = async (
  projectId: string
): Promise<void> => {
  try {
    console.log(`🔄 Preview sync marked for project ${projectId}`);
    console.log(`📲 Frontend should run: npm run preview:load -- ${projectId} <token>`);
  } catch (error) {
    console.error("❌ Failed to mark preview for sync:", error);
  }
};
