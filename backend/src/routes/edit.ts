import { Hono } from "hono";
import { stream } from "hono/streaming";

import { createPrisma } from "../db/prisma";

import {
  listFiles,
  getFile,
  putFile
} from "../storage/r2";

import {
  editProjectFilesStream
} from "../services/ai";

import {
  selectRelevantFiles
} from "../services/fileSelector";

import {
  validateProjectFiles
} from "../services/validator";

import {
  markPreviewForSync
} from "../services/previewSync";

import type { AppEnv } from "../types/app";

const edit = new Hono<AppEnv>();

edit.post("/", async (c) => {
  const user = c.get("user");

  const prisma = createPrisma(
    c.env.DATABASE_URL
  );

  const {
    projectId,
    prompt
  } = await c.req.json();

  return stream(c, async (stream) => {
    const send = async (
      event: string,
      data: string
    ) => {
      await stream.write(
        `event: ${event}\n`
      );

      await stream.write(
        `data: ${data}\n\n`
      );
    };

    try {
      await send(
        "status",
        "Validating project..."
      );

      const project =
        await prisma.project.findUnique({
          where: {
            id: projectId
          }
        });

      if (!project) {
        await send(
          "error",
          "Project not found"
        );

        return;
      }

      const bucket =
        c.env.PROMPT2APP_STORAGE;

      const prefix =
        `${user.id}/${projectId}/files/`;

      await send(
        "status",
        "Fetching project files from R2..."
      );

      const keys = await listFiles(
        bucket,
        prefix
      );

      const paths = keys.map((k) =>
        k.replace(prefix, "")
      );

      // =========================
      // LOAD FULL PROJECT
      // =========================

      const allFiles: Record<
        string,
        string
      > = {};

      for (const key of keys) {
        const path = key.replace(
          prefix,
          ""
        );

        const content =
          await getFile(
            bucket,
            key
          );

        allFiles[path] =
          content || "";
      }

      // =========================
      // SELECT RELEVANT FILES
      // =========================

      await send(
        "status",
        "Selecting relevant files..."
      );

      const relevantFiles =
        selectRelevantFiles(
          paths,
          prompt
        );

      for (const file of relevantFiles) {
        await send(
          "file",
          `Selected ${file}`
        );
      }

      // =========================
      // ONLY SEND SUBSET TO AI
      // =========================

      const aiFiles: Record<
        string,
        string
      > = {};

      for (const path of relevantFiles) {
        aiFiles[path] =
          allFiles[path];
      }

      await send(
        "status",
        "Sending files to AI..."
      );

      // =========================
      // AI EDITS SUBSET
      // =========================

      const updatedSubset =
        await editProjectFilesStream(
          aiFiles,
          prompt,
          c.env.OPENROUTER_API_KEY,
          async (token) => {
            await send(
              "AI",
              token
            );
          }
        );

        const lowerPrompt =
        prompt.toLowerCase();

      const shouldAllowAppJsEdit =
        lowerPrompt.includes("navigation") ||
        lowerPrompt.includes("app.js") ||
        lowerPrompt.includes("root") ||
        lowerPrompt.includes("provider") ||
        lowerPrompt.includes("theme");

      if (
        updatedSubset["App.js"] &&
        !shouldAllowAppJsEdit
      ) {
        console.warn(
          "Prevented unnecessary App.js overwrite"
        );

        delete updatedSubset["App.js"];
      }

      // =========================
      // MERGE INTO FULL PROJECT
      // =========================

      const mergedFiles = {
        ...allFiles,
        ...updatedSubset
      };

      // =========================
      // VALIDATE FULL PROJECT
      // =========================

      await send(
        "status",
        "Validating updated project..."
      );

      const validationResult =
        validateProjectFiles(
          mergedFiles
        );

      const validatedFiles =
        validationResult.files;

      if (
        !validationResult.valid
      ) {
        await send(
          "status",
          "⚠ Validation warnings detected"
        );

        for (const error of [
          ...validationResult.syntaxErrors,
          ...validationResult.importWarnings
        ]) {
          await send(
            "warning",
            error
          );
        }
      }

      // =========================
      // SAVE FULL PROJECT
      // =========================

      await send(
        "status",
        "Saving updated project..."
      );

      for (const [
        path,
        content
      ] of Object.entries(
        validatedFiles
      )) {
        const key =
          `${user.id}/${projectId}/files/${path}`;

        await putFile(
          bucket,
          key,
          content
        );

        await send(
          "file",
          `Saved ${path}`
        );
      }

      // =========================
      // MARK PREVIEW SYNC
      // =========================

      markPreviewForSync(
        projectId
      );

      await send(
        "status",
        "✅ Project updated successfully"
      );

      await send(
        "preview-sync",
        `npm run preview:load -- ${projectId} <your-jwt-token>`
      );

      await send(
        "done",
        "Edit completed"
      );
    } catch (err: any) {
      console.error(
        "[EDIT ROUTE ERROR]",
        err
      );

      await send(
        "error",
        err.message ||
          "Unknown error"
      );
    }
  });
});

export default edit;