import { Hono } from "hono";
import { createPrisma } from "../db/prisma";
import { generateProjectFiles } from "../services/ai";
import { putFile } from "../storage/r2";
import { stream } from "hono/streaming";
import { validateProjectFiles } from "../services/validator";
import type { AppEnv } from "../types/app";

type GeneratedFiles = Record<string, string>;


const generate = new Hono<AppEnv>();

function validateGeneratedFiles(files: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required files
  if (!files["App.js"]) errors.push("Missing App.js");
  if (!files["package.json"]) errors.push("Missing package.json");

  // Validate App.js exports default
  if (files["App.js"]) {
    const appJs = files["App.js"];
    if (!appJs.includes("export default") && !appJs.includes("export default function")) {
      errors.push("App.js must export a default component");
    }
    if (!appJs.includes("from 'react") && !appJs.includes('from "react')) {
      errors.push("App.js must import from React");
    }
  }

  // Validate package.json
  if (files["package.json"]) {
    try {
      const pkg = JSON.parse(files["package.json"]);
      
      if (!pkg.dependencies?.expo) errors.push("Missing expo dependency");
      if (!pkg.dependencies?.react) errors.push("Missing react dependency");
      if (!pkg.dependencies?.["react-native"]) errors.push("Missing react-native dependency");
      
      if (!pkg.main) errors.push("Missing main entry point in package.json");
      if (!pkg.name) errors.push("Missing name in package.json");
    } catch (e) {
      errors.push("Invalid package.json: " + (e as Error).message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function generateWithRetry(
  prompt: string,
  apiKey: string,
  maxRetries: number = 2
): Promise<GeneratedFiles> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result =
        await generateProjectFiles(
          prompt,
          apiKey
        );  
      const validation = validateGeneratedFiles(result);
      console.log(validation);
      if (validation.valid) {
        return result;
      }

      // If validation failed and we have retries, try again
      if (attempt < maxRetries) {
        console.log(`Generation attempt ${attempt + 1} failed validation, retrying...`);
        console.log("Errors:", validation.errors);

        

        // Continue to next attempt
        continue;
      }

      // Final attempt failed
      throw new Error(`Validation failed after ${maxRetries} retries: ${validation.errors.join("; ")}`);
    } catch (e) {
      if (attempt === maxRetries) {
        throw e;
      }
      console.log(`Generation attempt ${attempt + 1} failed, retrying...`);
    }
  }

  throw new Error("Generation failed after max retries");
}

generate.post("/", async (c) => {
  const user = c.get("user");
  const prisma = createPrisma(c.env.DATABASE_URL);

  const { prompt } = await c.req.json();

  return stream(c, async (s) => {
    try {
      // Tell frontend generation started
      await s.write(`event: start\ndata: Generating project...\n\n`);

      // Call AI with retry logic
      let aiResult: GeneratedFiles;
      try {
        aiResult = await generateWithRetry(
          prompt,
          c.env.OPENROUTER_API_KEY,
          2
        );
      } catch (e) {
        await s.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed: " + (e as Error).message })}\n\n`);
        return;
      }

      const files = aiResult;

      const validationResult =
  validateProjectFiles(files);

const validatedFiles =
  validationResult.files;

if (!validationResult.valid) {
  await s.write(
    `event: warning\ndata: ${JSON.stringify({
      syntaxErrors:
        validationResult.syntaxErrors,
      importWarnings:
        validationResult.importWarnings
    })}\n\n`
  );
}

// Final validation before upload
const finalValidation =
  validateGeneratedFiles(validatedFiles);

if (!finalValidation.valid) {
  await s.write(
    `event: error\ndata: ${JSON.stringify({
      message:
        "Final validation failed: " +
        finalValidation.errors.join("; ")
    })}\n\n`
  );

  return;
}
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

      // Upload files in parallel (only after all validations pass)
      await Promise.all(
        Object.entries(validatedFiles).map(([path, content]) => {
          const key = `${user.id}/${project.id}/files/${path}`;
          return putFile(bucket, key, content);
        })
      );

      // Send completion event
      await s.write(
        `event: done\ndata: ${JSON.stringify({
          projectId: project.id,
          filesGenerated: Object.keys(validatedFiles).length
        })}\n\n`
      );
    } catch (e) {
      await s.write(`event: error\ndata: ${JSON.stringify({ message: (e as Error).message })}\n\n`);
    }
  });
});

export default generate;
