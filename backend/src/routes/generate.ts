import { Hono } from "hono";
import { createPrisma } from "../db/prisma";
import { generateProjectFiles } from "../services/ai";
import { putFile } from "../storage/r2";
import { Bindings } from "../types/bindings";
import { stream } from "hono/streaming";
import { validateProjectFiles } from "../services/validator"

type GeneratedFiles = {
  files: Record<string, string>;
};

const generate = new Hono<{ Bindings: Bindings }>();

generate.post("/", async (c) => {

  const user = c.get("user");
  const prisma = createPrisma(c.env.DATABASE_URL);

  const { prompt } = await c.req.json();

  return stream(c, async (s) => {

    // Tell frontend generation started
    await s.write(`event: start\ndata: Generating project...\n\n`);

    // Call AI
    const aiResult = await generateProjectFiles(
      prompt,
      c.env.OPENROUTER_API_KEY
    ) as GeneratedFiles;

    const files = aiResult.files;
    const validatedFiles = validateProjectFiles(files)

    // Stream file names as they appear
    for (const path of Object.keys(validatedFiles)) {
      await s.write(`event: file\ndata: ${path}\n\n`);
    }

    // Create project in DB
    const project = await prisma.project.create({
      data: {
        name: prompt.slice(0, 50),
        userId: user.id,
      },
    });

    const bucket = c.env.PROMPT2APP_STORAGE;

    // Upload files in parallel (important for performance)
    await Promise.all(
      Object.entries(files).map(([path, content]) => {
        const key = `${user.id}/${project.id}/files/${path}`;
        return putFile(bucket, key, content);
      })
    );

    // Send completion event
    await s.write(
      `event: done\ndata: ${JSON.stringify({
        projectId: project.id,
        filesGenerated: Object.keys(files).length
      })}\n\n`
    );

  });
});

export default generate;