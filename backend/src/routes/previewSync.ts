import { Hono } from "hono";
import type { AppEnv } from "../types/app";
import { listFiles, getFile } from "../storage/r2";

const previewSync = new Hono<AppEnv>();

// Note: Running the local preview loader (`node scripts/loadPreview.js`) requires
// filesystem access and spawning child processes which is not supported in the
// Cloudflare Workers environment. This endpoint therefore returns the files
// found in R2 and a suggested set of local commands to run the preview locally.

previewSync.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const projectId = body.projectId || body.project || "";

  if (!projectId) {
    return c.json({ ok: false, error: "Missing projectId in request body" }, 400);
  }

  const bucket = c.env.PROMPT2APP_STORAGE;
  const prefix = `${user.id}/${projectId}/files/`;

  try {
    const keys = await listFiles(bucket, prefix);
    const files: Record<string, string> = {};

    for (const key of keys) {
      const path = key.replace(prefix, "");
      const content = await getFile(bucket, key);
      files[path] = content || "";
    }

    const commands = [
      'node scripts/loadPreview.js <projectId> <jwtToken>',
      'cd backend/preview-app',
      'npm install',
      'npm start'
    ];

    return c.json({ ok: true, files, commands, message: 'Preview files returned. To generate the local Expo preview run the listed commands on your machine.' });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message || String(e) }, 500);
  }
});

export default previewSync;
