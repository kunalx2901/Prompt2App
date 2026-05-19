import { Hono } from "hono";
import type { AppEnv } from "../types/app";
import { putFile, getFile, listFiles, deleteFile } from "../storage/r2";

const files = new Hono<AppEnv>();

// 🧠 Utility: sanitize path
const validatePath = (path: string) => {
  if (!path || path.includes("..") || path.startsWith("/")) {
    throw new Error("Invalid file path");
  }
};

// 🔹 Bulk upload (AI generation)
files.post('/bulk/:projectId', async (c) => {
  const user = c.get('user');
  const { projectId } = c.req.param();
  const fileMap = await c.req.json();

  // console.log("ENV OBJECT:", c.env);
  // console.log("R2 VALUE:", c.env.PROMPT2APP_STORAGE);
  // console.log("TYPE:", typeof c.env.PROMPT2APP_STORAGE);
  const bucket = c.env.PROMPT2APP_STORAGE;

  for (const [path, content] of Object.entries(fileMap)) {
    validatePath(path);
    const key = `${user.id}/${projectId}/files/${path}`;
    await putFile(bucket, key, content as string);
  }

  return c.json({ success: true, filesStored: Object.keys(fileMap).length });
});

// 🔹 List files
files.get('/:projectId', async (c) => {
  const user = c.get('user');
  const { projectId } = c.req.param();

  const prefix = `${user.id}/${projectId}/files/`;
  const keys = await listFiles(c.env.PROMPT2APP_STORAGE, prefix);

  const files = keys.map(k => k.replace(prefix, ''));

  return c.json({ files });
});

// 🔹 Get single file
files.get('/:projectId/file/*', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');
  const path = c.req.param('*');

  if (!path) {
    return c.json({ error: 'Missing file path' }, 400);
  }

  validatePath(path);

  const key = `${user.id}/${projectId}/files/${path}`;
  const content = await getFile(c.env.PROMPT2APP_STORAGE, key);

  if (!content) return c.json({ error: 'File not found' }, 404);

  return c.text(content);
});

// 🔹 Update single file
files.put('/:projectId', async (c) => {
  const user = c.get('user');
  const { projectId } = c.req.param();
  const { filename, content } = await c.req.json();

  validatePath(filename);

  const key = `${user.id}/${projectId}/files/${filename}`;
  await putFile(c.env.PROMPT2APP_STORAGE, key, content);

  return c.json({ success: true });
});

// 🔹 Delete file
files.delete('/:projectId/file/*', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');
  const path = c.req.param('*');

  if (!path) {
    return c.json({ error: 'Missing file path' }, 400);
  }

  validatePath(path);

  const key = `${user.id}/${projectId}/files/${path}`;
  await deleteFile(c.env.PROMPT2APP_STORAGE, key);

  return c.json({ success: true });
});

export default files;
