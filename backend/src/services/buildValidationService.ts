// buildValidationService.ts
// AI self-healing pipeline backbone.
//
// Correct usage flow:
//
//   AI Output
//       ↓
//   JSON Self-Healing   (handled in ai.ts)
//       ↓
//   validateAndHeal()   (this file)
//       ↓
//   Preview Sync        (loadPreview.js)
//
// This service:
//   - runs static validation (syntax + imports + dependencies)
//   - attempts AI-powered repair when validation fails
//   - caps repair loops via MAX_HEAL_ATTEMPTS
//   - emits status callbacks so the UI can show progress

import { validateProjectFiles, type ValidationResult } from "./validator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeneratedFiles = {
  files: Record<string, string>;
};

export type HealStatus =
  | "validating"
  | "syntax_error"
  | "import_warning"
  | "healing"
  | "healed"
  | "failed"
  | "passed";

export type StatusCallback = (
  status: HealStatus,
  detail?: string
) => void | Promise<void>;

export type HealResult = {
  files: Record<string, string>;
  /** True if the final output passed all hard (syntax) checks. */
  valid: boolean;
  /** Number of AI repair rounds consumed. */
  repairRounds: number;
  syntaxErrors: string[];
  importWarnings: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HEAL_ATTEMPTS = 3;

// ─── AI Repair Prompt Builders ────────────────────────────────────────────────

function buildSyntaxRepairPrompt(
  files: Record<string, string>,
  syntaxErrors: string[]
): string {
  const errorList = syntaxErrors.map((e) => `  - ${e}`).join("\n");
  const fileList = Object.entries(files)
    .map(([name, content]) => `=== ${name} ===\n${content}`)
    .join("\n\n");

  return `
The following React Native Expo project files contain syntax errors.
Fix ONLY the syntax errors listed below. Do not change any logic.
Return the complete corrected project as valid JSON only.

Syntax errors:
${errorList}

Project files:
${fileList}

Return ONLY valid JSON in this exact shape:
{
  "files": {
    "App.js": "...",
    "package.json": "...",
    "app.json": "..."
  }
}
`.trim();
}

function buildImportRepairPrompt(
  files: Record<string, string>,
  importWarnings: string[]
): string {
  const warningList = importWarnings.map((w) => `  - ${w}`).join("\n");
  const fileList = Object.entries(files)
    .map(([name, content]) => `=== ${name} ===\n${content}`)
    .join("\n\n");

  return `
The following React Native Expo project files have unresolved relative imports.
Either create the missing files or fix the import paths so every import resolves correctly.
Return the complete corrected project as valid JSON only.

Unresolved imports:
${warningList}

Project files:
${fileList}

Return ONLY valid JSON in this exact shape:
{
  "files": {
    "App.js": "...",
    "package.json": "...",
    "app.json": "..."
  }
}
`.trim();
}

// ─── AI Round-trip ────────────────────────────────────────────────────────────

/**
 * Sends a repair prompt to the AI and returns the corrected files.
 * Throws if the AI response cannot be parsed.
 *
 * `makeAiRequest` is injected so this service stays decoupled from ai.ts.
 * Pass in `(prompt) => completeGenerateResponse(originalPrompt, prompt, apiKey)`
 * or a similarly shaped wrapper.
 */
async function repairWithAi(
  prompt: string,
  makeAiRequest: (repairPrompt: string) => Promise<GeneratedFiles>
): Promise<GeneratedFiles> {
  const result = await makeAiRequest(prompt);

  if (!result?.files || typeof result.files !== "object") {
    throw new Error("AI repair response did not contain a valid files object");
  }

  return result;
}

// ─── Core Pipeline ────────────────────────────────────────────────────────────

/**
 * Validates AI-generated files and auto-heals using the AI if needed.
 *
 * @param generated     The raw output from the AI (after JSON self-healing).
 * @param makeAiRequest Injected function that sends a repair prompt to the AI.
 * @param onStatus      Optional callback for UI progress updates.
 * @param startAttempt  Internal — used for recursive repair tracking.
 */
export async function validateAndHeal(
  generated: GeneratedFiles,
  makeAiRequest: (repairPrompt: string) => Promise<GeneratedFiles>,
  onStatus?: StatusCallback,
  startAttempt = 0
): Promise<HealResult> {
  const emit = async (status: HealStatus, detail?: string) => {
    if (onStatus) await onStatus(status, detail);
  };

  await emit("validating");

  const result: ValidationResult = validateProjectFiles(generated.files);

  // ── All checks passed ─────────────────────────────────────────────────────
  if (result.valid && result.importWarnings.length === 0) {
    await emit("passed");
    return {
      files: result.files,
      valid: true,
      repairRounds: startAttempt,
      syntaxErrors: [],
      importWarnings: []
    };
  }

  // ── Soft warnings only (imports) — no hard failures ───────────────────────
  if (result.valid && result.importWarnings.length > 0) {
    await emit(
      "import_warning",
      `${result.importWarnings.length} unresolved import(s)`
    );

    if (startAttempt >= MAX_HEAL_ATTEMPTS) {
      // Warn but return — import issues don't block preview
      console.warn(
        "[buildValidationService] Max heal attempts reached for import warnings."
      );
      return {
        files: result.files,
        valid: true,
        repairRounds: startAttempt,
        syntaxErrors: [],
        importWarnings: result.importWarnings
      };
    }

    await emit(
      "healing",
      `Repairing ${result.importWarnings.length} unresolved import(s)…`
    );

    try {
      const prompt = buildImportRepairPrompt(
        result.files,
        result.importWarnings
      );
      const repaired = await repairWithAi(prompt, makeAiRequest);
      return validateAndHeal(repaired, makeAiRequest, onStatus, startAttempt + 1);
    } catch (err) {
      console.error("[buildValidationService] Import repair failed:", err);
      // Non-fatal — return with warnings
      return {
        files: result.files,
        valid: true,
        repairRounds: startAttempt + 1,
        syntaxErrors: [],
        importWarnings: result.importWarnings
      };
    }
  }

  // ── Hard syntax errors ────────────────────────────────────────────────────
  await emit(
    "syntax_error",
    `${result.syntaxErrors.length} syntax error(s) found`
  );

  if (startAttempt >= MAX_HEAL_ATTEMPTS) {
    await emit(
      "failed",
      `Exceeded max repair attempts (${MAX_HEAL_ATTEMPTS})`
    );
    throw new Error(
      `[buildValidationService] Exceeded maximum AI repair attempts. ` +
        `Last syntax errors:\n${result.syntaxErrors.join("\n")}`
    );
  }

  await emit(
    "healing",
    `Repairing ${result.syntaxErrors.length} syntax error(s)… (attempt ${startAttempt + 1}/${MAX_HEAL_ATTEMPTS})`
  );

  try {
    const prompt = buildSyntaxRepairPrompt(result.files, result.syntaxErrors);
    const repaired = await repairWithAi(prompt, makeAiRequest);
    const healResult = await validateAndHeal(
      repaired,
      makeAiRequest,
      onStatus,
      startAttempt + 1
    );

    if (healResult.valid) {
      await emit("healed", `Repaired after ${healResult.repairRounds} round(s)`);
    }

    return healResult;
  } catch (err: any) {
    // If repairWithAi itself throws (e.g. AI unavailable), propagate with context
    throw new Error(
      `[buildValidationService] AI repair round ${startAttempt + 1} failed: ${err.message}`
    );
  }
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

/**
 * Drop-in replacement for the raw `validateProjectFiles` call.
 * Use this anywhere you currently call validateProjectFiles() directly.
 *
 * Returns sanitized files synchronously (no AI repair).
 * For full AI repair use `validateAndHeal` instead.
 */
export function staticValidate(
  files: Record<string, string>
): ValidationResult {
  return validateProjectFiles(files);
}