export type GeneratedFiles =
  Record<string, string>;

const AI_MODELS = [
  "qwen/qwen3-coder",
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct:free"
];

const MAX_REPAIR_ATTEMPTS = 3;

const LOCKED_EXPO_DEPENDENCIES = {
  expo: "~54.0.0",
  react: "19.1.0",
  "react-native": "0.81.5"
};

// All common nav/UI packages the AI might use — kept in sync with validator.ts
const SAFE_DEFAULT_DEPENDENCIES = {
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/stack": "^7.3.10",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "@react-navigation/drawer": "^7.0.0",
  "react-native-safe-area-context": "5.4.0",
  "react-native-screens": "~4.11.1",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.4",
  "@expo/vector-icons": "^14.0.0"
};

const FORBIDDEN_DEPENDENCIES = [
  "metro",
  "metro-config",
  "metro-core",
  "metro-runtime",
  "metro-resolver",
  "@react-native/babel-plugin-codegen",
  "@react-native/codegen",
  "@react-native/metro-config",
  "@react-native/dev-middleware",
  "react-native-codegen",
  "react-native-web",
  "expo-router",
  "@babel/core",
  "@babel/runtime",
  "babel-preset-expo",
  "@expo/metro-runtime",
  "webpack",
  "vite",
  "native-base",
  "nativewind",
  "tailwindcss",
  "next",
  "vue",
  "angular"
];

const JSON_ONLY_SYSTEM_PROMPT = `
You are an expert React Native developer and Expo application architect.

Return ONLY valid JSON.
Do not include markdown fences or extra text.

Keep output compatible with:
- Expo SDK 54
- React 19.1.0
- React Native 0.81.5

Your task is to generate complete production-quality multi-file React Native Expo applications.

==================================================
CORE RULES
==================================================

1. Return ONLY valid JSON.
2. Do NOT return markdown.
3. Do NOT wrap output in triple \`backticks\`.
4. Do NOT explain anything.
5. Do NOT include comments outside JSON.
6. Output must always follow the exact schema.
7. All file paths must be relative.
8. Every generated project must be Expo-compatible.
9. Use modern React Native patterns and functional components only.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY this structure:

{
  "files": {
    "App.js": "...",
    "package.json": "...",
    "app.json": "...",
    ...
  }
}

==================================================
NAVIGATION RULES
==================================================

IMPORTANT: Always use @react-navigation/stack (NOT native-stack) when creating stack navigators.
Use createStackNavigator from @react-navigation/stack.
Always include @react-navigation/stack in package.json dependencies.
Always include @expo/vector-icons in package.json when using icons.

==================================================
PROJECT ARCHITECTURE REQUIREMENTS
==================================================

Generate scalable folder structures.

Use appropriate folders such as:
- components/
- screens/
- navigation/
- hooks/
- services/
- utils/
- constants/
- context/
- assets/
- types/

Only create folders when needed.

==================================================
CODE QUALITY REQUIREMENTS
==================================================

Code must:
- Be production-quality
- Be modular
- Be reusable
- Be readable
- Be properly formatted
- Avoid unnecessary complexity
- Avoid placeholder logic
- Avoid TODO comments
- Avoid pseudo-code
- Avoid incomplete implementations

==================================================
REACT NATIVE REQUIREMENTS
==================================================

Use:
- Functional components
- React Hooks
- React Navigation when multiple screens exist
- SafeAreaView where appropriate
- Responsive layouts
- Clean styling
- Proper state management

Do NOT:
- Use deprecated APIs
- Use class components
- Use unsupported native modules
- Use browser-only APIs

==================================================
EXPO REQUIREMENTS
==================================================

Always generate:
- package.json
- app.json

Ensure dependencies are valid for:
- Expo SDK 54
- React 19.1.0
- React Native 0.81.5
- expo-managed package versions
- \`sdkVersion\` in app.json
- \`main\` set to \`node_modules/expo/AppEntry.js\`

Do not use unsupported packages.

==================================================
PACKAGE.JSON REQUIREMENTS
==================================================

Generate complete package.json including:
- dependencies
- scripts
- expo configuration
- valid package versions

ALWAYS include in dependencies:
- @react-navigation/stack (when using stack navigation)
- @expo/vector-icons (when using icons)

==================================================
JSON VALIDITY RULES
==================================================

VERY IMPORTANT:

- Output MUST be valid parseable JSON.
- Escape all quotes properly.
- Escape newlines correctly.
- Never include trailing commas.
- Never break JSON formatting.
- ALL files must be inside the "files" key — do NOT add files at the top level.

==================================================
FINAL BEHAVIOR
==================================================

You are generating code for a real AI-powered IDE.

The generated project must:
- run successfully in Expo Snack
- support multi-file structure
- be production-oriented
- be scalable
- be realistic
- not be toy-level

Always prioritize:
- correctness
- modularity
- maintainability
- Expo compatibility
- React Native best practices

Do NOT generate or override core Expo runtime dependencies.

Never generate:
- metro
- metro-config
- react-native-web
- babel-preset-expo
- expo-router
- @react-native/* internals

The preview runtime already manages these dependencies.

Only generate lightweight app-level dependencies.
`;

const JSON_REPAIR_SYSTEM_PROMPT = `
You are a JSON repair engine.

Your task is to repair incomplete or malformed JSON.

Rules:
- Return ONLY valid JSON.
- Do NOT explain anything.
- Do NOT wrap output in markdown.
- Preserve all existing content.
- Complete truncated JSON structures.
- Ensure all brackets and quotes are properly closed.
- Ensure final JSON is parseable.
- ALL file content must remain inside the "files" key.

The JSON structure should remain exactly as provided.
`;

// ─── Utilities ───────────────────────────────────────────────────────────────

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) =>
  [429, 500, 502, 503, 504].includes(status);

const cleanAiJson = (content: string) =>
  content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const extractJsonObject = (content: string) => {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return content;
  }

  return content.slice(firstBrace, lastBrace + 1);
};

/**
 * The AI sometimes returns extra keys at the root level alongside "files",
 * e.g. { "files": {...}, "App.js": "fallback", "package.json": "fallback" }.
 * This strips everything except the "files" key so the caller always gets
 * a clean { files: Record<string,string> } shape.
 */
const extractFilesOnly = (
  parsed: any
): GeneratedFiles => {

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "Parsed value is not an object"
    );
  }

  // =====================================
  // STANDARD AI FORMAT
  // { files: { ... } }
  // =====================================

  if (
    parsed.files &&
    typeof parsed.files === "object" &&
    !Array.isArray(parsed.files)
  ) {

    const cleaned:
      Record<string, string> = {};

    for (const [
      key,
      value
    ] of Object.entries(parsed.files)) {

      if (
        typeof value === "string"
      ) {
        cleaned[key] = value;
      }

    }

    if (
      Object.keys(cleaned).length > 0
    ) {
      return cleaned;
    }
  }

  // =====================================
  // ROOT FILE FORMAT
  // { "App.js": "...", ... }
  // =====================================

  const cleaned:
    Record<string, string> = {};

  for (const [
    key,
    value
  ] of Object.entries(parsed)) {

    if (
      typeof value === "string"
    ) {
      cleaned[key] = value;
    }

  }

  if (
    Object.keys(cleaned).length === 0
  ) {

    console.error(
      "[AI PARSE FAILURE]",
      parsed
    );

    throw new Error(
      "No valid files found"
    );
  }

  return cleaned;
};

// ─── Core HTTP ───────────────────────────────────────────────────────────────

const makeOpenRouterRequest = async ({
  apiKey,
  body,
  stream = false,
  startModelIndex = 0
}: {
  apiKey: string;
  body: any;
  stream?: boolean;
  startModelIndex?: number;
}): Promise<{ response: Response; model: string }> => {
  let lastError: any;

  for (let i = startModelIndex; i < AI_MODELS.length; i++) {
    const model = AI_MODELS[i];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:8787",
              "X-Title": "Prompt2App"
            },
            body: JSON.stringify({
              model,
              ...body,
              stream
            })
          }
        );

        if (response.ok) {
          return { response, model };
        }

        const errorText = await response.text();

        if (!isRetryableStatus(response.status)) {
          throw new Error(errorText);
        }

        console.warn(
          `Retryable AI error (${response.status}) with model ${model}, attempt ${attempt + 1}`
        );

        let retryDelay = 2000;

        try {
          const parsed = JSON.parse(errorText);
          const retryAfter = parsed?.error?.metadata?.retry_after_seconds;
          if (retryAfter) {
            retryDelay = retryAfter * 1000;
          }
        } catch {
          // ignore parse error on error body
        }

        await sleep(retryDelay);
        lastError = new Error(errorText);
      } catch (err) {
        lastError = err;
        await sleep(2000);
      }
    }
  }

  throw lastError ?? new Error("All AI providers failed");
};

// ─── JSON Repair ─────────────────────────────────────────────────────────────

const repairJsonWithAi = async (
  brokenContent: string,
  apiKey: string
): Promise<string> => {
  const { response } = await makeOpenRouterRequest({
    apiKey,
    body: {
      temperature: 0,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: JSON_REPAIR_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Repair this incomplete or malformed JSON.\n\nReturn ONLY valid JSON.\n\nBroken JSON:\n${brokenContent}`
        }
      ]
    }
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? brokenContent;
};

// ─── Parse + Sanitize ────────────────────────────────────────────────────────

const parseGeneratedFilesPayload = async (
  content: string,
  apiKey: string
): Promise<Record<string, string>> => {
  const cleaned = cleanAiJson(content);

  const candidates = [cleaned, extractJsonObject(cleaned)];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      // extractFilesOnly handles nested/polluted structures safely
      return extractFilesOnly(parsed);
    } catch {
      continue;
    }
  }

  console.error("JSON PARSE ERROR — attempting AI repair:", cleaned);

  try {
    const repaired = await repairJsonWithAi(cleaned, apiKey);
    const repairedParsed = JSON.parse(
      extractJsonObject(cleanAiJson(repaired))
    );
    return extractFilesOnly(repairedParsed);
  } catch (repairError) {
    console.error("AI JSON repair failed", repairError);
    throw new Error(
      "AI returned invalid or incomplete JSON after repair attempt"
    );
  }
};

const sanitizeGeneratedFiles = (
  generated: GeneratedFiles
): GeneratedFiles => {
  const files = {
    ...generated
  };

  if (!files["package.json"]) {
    return files;
  }

  try {
    const packageJson = JSON.parse(
      files["package.json"]
    );

    packageJson.dependencies = {
      ...(packageJson.dependencies ?? {})
    };

    packageJson.devDependencies = {
      ...(packageJson.devDependencies ?? {})
    };

    // Remove forbidden packages
    for (const dep of FORBIDDEN_DEPENDENCIES) {
      delete packageJson.dependencies[
        dep
      ];

      delete packageJson.devDependencies[
        dep
      ];
    }

    // Inject safe dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...SAFE_DEFAULT_DEPENDENCIES,
      ...LOCKED_EXPO_DEPENDENCIES
    };

    packageJson.scripts = {
      start: "expo start",
      android:
        "expo start --android",
      ios: "expo start --ios",
      web: "expo start --web"
    };

    packageJson.name ??=
      "prompt2app-project";

    packageJson.version ??=
      "1.0.0";

    packageJson.private = true;

    packageJson.main =
      "node_modules/expo/AppEntry.js";

    files["package.json"] =
      JSON.stringify(
        packageJson,
        null,
        2
      );

    return files;
  } catch (err) {
    console.error(
      "Failed to sanitize package.json",
      err
    );

    return files;
  }
};

// ─── Message Builders ────────────────────────────────────────────────────────

const createEditMessages = (
  files: Record<string, string>,
  prompt: string
) => [
  {
    role: "system",
    content: `
You are an expert React Native Expo engineer.

You are editing an EXISTING project.

IMPORTANT RULES:

- Modify ONLY the files necessary for the user's request.
- Do NOT regenerate the entire project.
- Do NOT replace unrelated files.
- Preserve existing architecture.
- Preserve navigation structure.
- Preserve component hierarchy.
- Preserve existing working logic unless modification is required.
- NEVER replace App.js unless explicitly necessary.
- NEVER simplify the app into placeholder content.
- NEVER generate fallback screens.
- NEVER remove existing files unless explicitly requested.
- Return ONLY modified files.
- Unmodified files must NOT be returned.
- Keep all code Expo SDK 54 compatible.
- Keep React Native 0.81.5 compatible.
- Keep React 19.1.0 compatible.
- Use ONLY Expo-compatible libraries.
- Maintain valid imports.
- Maintain valid JSX syntax.
- Maintain working navigation.

Return ONLY valid JSON.

Response format:

{
  "files": {
    "screens/HomeScreen.js": "...",
    "components/Button.js": "..."
  }
}

Do not include markdown.
Do not include explanations.
Do not include unchanged files.
`
  },
  {
    role: "user",
    content: `
Existing project files:

${JSON.stringify(files, null, 2)}

User edit request:

${prompt}

Modify ONLY the required files.
`
  }
];

const createRepairGenerateMessages = (
  prompt: string,
  previousResponse: string
) => [
  {
    role: "system",
    content: JSON_ONLY_SYSTEM_PROMPT
  },
  {
    role: "user",
    content: `The previous AI response contained invalid or incomplete JSON. Complete the project response into valid JSON only.\n\nUser request:\n${prompt}\n\nPrevious partial response:\n${previousResponse}\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "files": {\n    "App.js": "...",\n    "package.json": "...",\n    "app.json": "..."\n  }\n}\n\nIMPORTANT: ALL files must be inside the "files" key. Do not add any keys at the root level.`
  }
];

const createRepairEditMessages = (
  files: Record<string, string>,
  prompt: string,
  previousResponse: string
) => [
  {
    role: "system",
    content: JSON_ONLY_SYSTEM_PROMPT
  },
  {
    role: "user",
    content: `The previous AI response contained invalid or incomplete JSON while editing project files. Use the information below to repair it and return only valid JSON.\n\nProject files:\n${JSON.stringify(files)}\n\nUser request:\n${prompt}\n\nPrevious partial response:\n${previousResponse}\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "files": {\n    "App.js": "...",\n    "screens/LoginScreen.js": "..."\n  }\n}\n\nIMPORTANT: ALL files must be inside the "files" key. Do not add any keys at the root level.`
  }
];

// ─── Repair / Completion Helpers ─────────────────────────────────────────────

const completeGenerateResponse = async (
  prompt: string,
  previousResponse: string,
  apiKey: string,
  startModelIndex = 0,
  repairAttempt = 0
): Promise<Record<string, string>> => {
  if (repairAttempt >= MAX_REPAIR_ATTEMPTS) {
    throw new Error("Exceeded maximum AI repair attempts");
  }

  const { response } = await makeOpenRouterRequest({
    apiKey,
    startModelIndex,
    body: {
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: createRepairGenerateMessages(prompt, previousResponse)
    }
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter generate repair request failed (${response.status}): ${await response.text()}`
    );
  }

  const data: any = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(
      "OpenRouter generate repair response did not contain message content"
    );
  }

  const parsed = await parseGeneratedFilesPayload(
    data.choices[0].message.content,
    apiKey
  );

  return sanitizeGeneratedFiles(parsed);
};

const completeEditResponse = async (
  files: Record<string, string>,
  prompt: string,
  previousResponse: string,
  apiKey: string,
  startModelIndex = 0,
  repairAttempt = 0
): Promise<Record<string, string>> => {
  if (repairAttempt >= MAX_REPAIR_ATTEMPTS) {
    throw new Error("Exceeded maximum AI repair attempts");
  }

  const { response } = await makeOpenRouterRequest({
    apiKey,
    startModelIndex,
    body: {
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: createRepairEditMessages(files, prompt, previousResponse)
    }
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter edit repair request failed (${response.status}): ${await response.text()}`
    );
  }

  const data: any = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(
      "OpenRouter edit repair response did not contain message content"
    );
  }

  const parsed = await parseGeneratedFilesPayload(
    data.choices[0].message.content,
    apiKey
  );

  return sanitizeGeneratedFiles(parsed);
};

// ─── Non-Streaming Edit ──────────────────────────────────────────────────────

const fetchEditNonStreaming = async (
  files: Record<string, string>,
  prompt: string,
  apiKey: string,
  startModelIndex = 0,
  repairAttempt = 0
): Promise<Record<string, string>> => {
  if (repairAttempt >= MAX_REPAIR_ATTEMPTS) {
    throw new Error("Exceeded maximum AI repair attempts");
  }

  const { response, model } = await makeOpenRouterRequest({
    apiKey,
    startModelIndex,
    body: {
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: createEditMessages(files, prompt)
    }
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter non-stream edit request failed (${response.status}): ${await response.text()}`
    );
  }

  const data: any = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(
      "OpenRouter non-stream edit response did not contain message content"
    );
  }

  const rawContent: string = data.choices[0].message.content;

  try {
    const parsed = await parseGeneratedFilesPayload(rawContent, apiKey);
    return sanitizeGeneratedFiles(parsed);
  } catch (err) {
    console.error(
      "Non-stream edit response invalid JSON, attempting repair.",
      err
    );

    const currentIndex = AI_MODELS.indexOf(model);
    const nextIndex = (currentIndex + 1) % AI_MODELS.length;

    return completeEditResponse(
      files,
      prompt,
      rawContent,
      apiKey,
      nextIndex,
      repairAttempt + 1
    );
  }
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const generateProjectFiles = async (
  prompt: string,
  apiKey: string
): Promise<Record<string, string>> => {
  const { response, model } = await makeOpenRouterRequest({
    apiKey,
    body: {
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: JSON_ONLY_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Generate a complete multi-file React Native Expo application.\n\nRequirements:\n- Target Expo SDK 54\n- Use React 19.1.0\n- Use React Native 0.81.5\n- Generate scalable folder structure\n- Generate all required files\n- Ensure project runs correctly in Expo Snack\n- Use production-quality architecture\n- Use modern React Native best practices\n- Use responsive layouts\n- Use reusable components\n- Use @react-navigation/stack for stack navigation\n- Include @expo/vector-icons if using icons\n\nUser Request:\n${prompt}\n\nReturn ONLY valid JSON. ALL files must be inside the "files" key. Do not add any keys at the root level.`
        }
      ]
    }
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter generate request failed (${response.status}): ${await response.text()}`
    );
  }

  const data: any = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(
      "OpenRouter generate response did not contain message content"
    );
  }

  const rawContent: string = data.choices[0].message.content;

  try {
    const parsed = await parseGeneratedFilesPayload(rawContent, apiKey);
    return sanitizeGeneratedFiles(parsed);
  } catch (err) {
    console.error("Generate response invalid JSON, attempting repair.", err);

    const currentIndex = AI_MODELS.indexOf(model);
    const nextIndex = (currentIndex + 1) % AI_MODELS.length;

    return completeGenerateResponse(prompt, rawContent, apiKey, nextIndex, 0);
  }
};

export const editProjectFilesStream = async (
  files: Record<string, string>,
  prompt: string,
  apiKey: string,
  onToken: (token: string) => Promise<void>
): Promise<Record<string, string>> => {
  const { response, model } = await makeOpenRouterRequest({
    apiKey,
    stream: true,
    body: {
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: createEditMessages(files, prompt)
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter edit request failed (${response.status}): ${errorText}`
    );
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("OpenRouter returned no response body for streaming edit");
  }

  const decoder = new TextDecoder();

  let fullContent = "";
  let pendingLine = "";
  let lastTokenAt = Date.now();
  let stalled = false;

  const stallTimeoutMs = 8000;

  const handleSseLine = async (line: string) => {
    if (!line.startsWith("data: ")) return;

    const data = line.slice("data: ".length).trim();

    if (!data || data === "[DONE]") return;

    const parsed: any = JSON.parse(data as string);
    const token: string = parsed.choices?.[0]?.delta?.content ?? "";

    if (!token) return;

    fullContent += token;
    lastTokenAt = Date.now();
    await onToken(token);
  };

  const stallChecker = setInterval(() => {
    if (Date.now() - lastTokenAt > stallTimeoutMs) {
      stalled = true;
      try {
        reader.cancel().catch(() => {});
      } catch {
        // ignore
      }
    }
  }, 1000);

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done || stalled) break;

      pendingLine += decoder.decode(value, { stream: true });
      const lines = pendingLine.split("\n");
      pendingLine = lines.pop() ?? "";

      for (const line of lines) {
        try {
          await handleSseLine(line.trim());
        } catch {
          continue;
        }
      }
    }

    pendingLine += decoder.decode();

    if (pendingLine.trim()) {
      try {
        await handleSseLine(pendingLine.trim());
      } catch {
        // ignore trailing partial line
      }
    }
  } finally {
    clearInterval(stallChecker);
  }

  const currentModelIndex = AI_MODELS.indexOf(model);
  const nextIndex = (currentModelIndex + 1) % AI_MODELS.length;

  if (stalled) {
    console.warn(
      "Streaming stalled; attempting non-stream completion with next model"
    );

    await onToken("\n\n⚡ Repairing incomplete AI response...\n\n");

    try {
      return await fetchEditNonStreaming(
        files,
        `${prompt}\n\nPREVIOUS_RESPONSE:\n${fullContent}`,
        apiKey,
        nextIndex,
        0
      );
    } catch (err) {
      console.error("Non-stream completion after stall failed:", err);
      // fall through to final parse attempt
    }
  }

  try {
    const parsed =
      await parseGeneratedFilesPayload(
        fullContent,
        apiKey
      );

    const sanitized =
      sanitizeGeneratedFiles(parsed);

    const changedFiles =
      sanitized;

    console.log(
      "[AI EDIT RESPONSE FILES]",
      Object.keys(changedFiles)
    );

    return changedFiles;
  } catch (error) {
    console.error(
      "Streamed edit response was invalid JSON. Falling back to non-stream repair."
    );

    return fetchEditNonStreaming(
      files,
      `${prompt}\n\nPREVIOUS_RESPONSE:\n${fullContent}`,
      apiKey,
      nextIndex,
      0
    );
  }
};