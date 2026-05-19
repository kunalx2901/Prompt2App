export type GeneratedFiles = {
  files: Record<string, string>;
};

const AI_MODELS = [
  "qwen/qwen3-coder",
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct:free"
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
3. Do NOT wrap output in triple backticks.
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

Do not use unsupported packages.

==================================================
PACKAGE.JSON REQUIREMENTS
==================================================

Generate complete package.json including:
- dependencies
- scripts
- expo configuration
- valid package versions

==================================================
UI/UX REQUIREMENTS
==================================================

Generated applications should:
- Have modern UI
- Use consistent spacing
- Use readable typography
- Use proper layout hierarchy
- Support responsive layouts
- Support dark/light friendly design where appropriate

==================================================
STATE MANAGEMENT
==================================================

For small apps:
- useState
- useContext

For medium/large apps:
- Context API
- custom hooks

Avoid Redux unless explicitly requested.

==================================================
FILE GENERATION RULES
==================================================

Each file must:
- Have complete code
- Include imports
- Include exports
- Be immediately runnable
- Not depend on missing files

Never reference files that do not exist.

==================================================
NAVIGATION RULES
==================================================

If multiple screens exist:
- Configure React Navigation properly
- Include navigation container setup
- Generate navigation files

==================================================
ERROR HANDLING
==================================================

Always include:
- Basic loading states
- Empty states when appropriate
- Error handling where relevant

==================================================
PERFORMANCE REQUIREMENTS
==================================================

Avoid:
- unnecessary re-renders
- deeply nested components
- duplicate logic

Prefer reusable abstractions.

==================================================
JSON VALIDITY RULES
==================================================

VERY IMPORTANT:

- Output MUST be valid parseable JSON.
- Escape all quotes properly.
- Escape newlines correctly.
- Never include trailing commas.
- Never break JSON formatting.

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
`;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) => {
  return [429, 500, 502, 503, 504].includes(status);
};

const makeOpenRouterRequest = async ({
  apiKey,
  body,
  stream = false,
  startModelIndex = 0
}: {
  apiKey: string;
  body: any;
  stream?: boolean;
  // startModelIndex chooses which AI_MODELS index to try first
  startModelIndex?: number;
}): Promise<{ response: Response; model: string }> => {
  let lastError: any;

  const models = AI_MODELS.slice();

  // rotate models so we start from the requested index
  if (startModelIndex && startModelIndex > 0) {
    const head = models.splice(0, startModelIndex % models.length);
    models.push(...head);
  }

  for (const model of models) {
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
          `Retryable AI error (${response.status}) with model ${model}`
        );

        let retryDelay = 2000;

        try {
          const parsed = JSON.parse(errorText);

          const retryAfter = parsed?.error?.metadata?.retry_after_seconds;

          if (retryAfter) {
            retryDelay = retryAfter * 1000;
          }
        } catch {}

        await sleep(retryDelay);

        lastError = new Error(errorText);
      } catch (err) {
        lastError = err;
        await sleep(2000);
      }
    }
  }

  throw lastError || new Error("All AI providers failed");
};

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

const parseGeneratedFilesPayload = (content: string): GeneratedFiles => {
  const cleaned = cleanAiJson(content);
  const candidates = [cleaned, extractJsonObject(cleaned)];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (!parsed.files || typeof parsed.files !== "object") {
        throw new Error("AI response missing 'files' property");
      }

      return parsed as GeneratedFiles;
    } catch {
      continue;
    }
  }

  console.error("JSON PARSE ERROR:", cleaned);
  throw new Error("AI returned invalid or incomplete JSON");
};

const createRepairGenerateMessages = (prompt: string, previousResponse: string) => [
  {
    role: "system",
    content: JSON_ONLY_SYSTEM_PROMPT
  },
  {
    role: "user",
    content: `The previous AI response contained invalid or incomplete JSON. Complete the project response into valid JSON only.

User request:
${prompt}

Previous partial response:
${previousResponse}

Return ONLY valid JSON in this exact shape:
{
  "files": {
    "App.js": "...",
    "package.json": "...",
    "app.json": "..."
  }
}
`
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
    content: `The previous AI response contained invalid or incomplete JSON while editing project files. Use the information below to repair it and return only valid JSON.

Project files:
${JSON.stringify(files)}

User request:
${prompt}

Previous partial response:
${previousResponse}

Return ONLY valid JSON in this exact shape:
{
  "files": {
    "App.js": "...",
    "screens/LoginScreen.js": "..."
  }
}
`
  }
];

const completeGenerateResponse = async (
  prompt: string,
  previousResponse: string,
  apiKey: string,
  startModelIndex = 0
): Promise<GeneratedFiles> => {
  const { response, model } = await makeOpenRouterRequest({
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

  return parseGeneratedFilesPayload(data.choices[0].message.content);
};

const completeEditResponse = async (
  files: Record<string, string>,
  prompt: string,
  previousResponse: string,
  apiKey: string,
  startModelIndex = 0
) => {
  const { response, model } = await makeOpenRouterRequest({
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

  return parseGeneratedFilesPayload(data.choices[0].message.content).files;
};

export const generateProjectFiles = async (
  prompt: string,
  apiKey: string
): Promise<GeneratedFiles> => {
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
          content: `
Generate a complete multi-file React Native Expo application.

Requirements:
- Target Expo SDK 54
- Use React 19.1.0
- Use React Native 0.81.5
- Generate scalable folder structure
- Generate all required files
- Ensure project runs correctly in Expo Snack
- Use production-quality architecture
- Use modern React Native best practices
- Use responsive layouts
- Use reusable components

User Request:
${prompt}

Return ONLY valid JSON.
`
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

  // Debugging output
  console.log("AI RESPONSE:", data);

  if (!data.choices || !data.choices[0]) {
    throw new Error(
      "Invalid AI response from OpenRouter: " + JSON.stringify(data)
    );
  }

  const rawContent = data.choices[0].message.content;

  try {
    return parseGeneratedFilesPayload(rawContent);
  } catch (err) {
    console.error("Initial AI generate response invalid JSON, attempting repair.", err);
    const nextIndex = (AI_MODELS.indexOf(model) + 1) % AI_MODELS.length;
    return completeGenerateResponse(prompt, rawContent, apiKey, nextIndex);
  }
};

// to edit the files from the AI
const createEditMessages = (files: Record<string, string>, prompt: string) => [
  {
    role: "system",
    content: JSON_ONLY_SYSTEM_PROMPT
  },
  {
    role: "user",
    content: `
Project files:
${JSON.stringify(files)}

User request:
${prompt}

Return JSON in this exact shape:

{
  "files": {
    "App.js": "...",
    "screens/LoginScreen.js": "..."
  }
}
`
  }
];

const fetchEditNonStreaming = async (
  files: Record<string, string>,
  prompt: string,
  apiKey: string,
  startModelIndex = 0
) => {
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
      "OpenRouter generate repair response did not contain message content"
    );
  }

  const rawContent = data.choices[0].message.content;

  try {
    return parseGeneratedFilesPayload(rawContent).files;
  } catch (err) {
    console.error("Non-stream edit response invalid JSON, attempting repair.", err);
    const nextIndex = (AI_MODELS.indexOf(model) + 1) % AI_MODELS.length;
    return completeEditResponse(files, prompt, rawContent, apiKey, nextIndex);
  }
};

export const editProjectFilesStream = async (
  files: Record<string, string>,
  prompt: string,
  apiKey: string,
  onToken: (token: string) => Promise<void>
) => {
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

  const stallTimeoutMs = 8000; // if no tokens for 8s, consider stalled

  const handleSseLine = async (line: string) => {
    if (!line.startsWith("data: ")) {
      return;
    }

    const data = line.slice("data: ".length).trim();

    if (!data || data === "[DONE]") {
      return;
    }

    const parsed = JSON.parse(data);
    const token = parsed.choices?.[0]?.delta?.content || "";

    if (!token) {
      return;
    }

    fullContent += token;
    lastTokenAt = Date.now();
    await onToken(token);
  };

  // Watcher to cancel reader if streaming stalls
  const stallChecker = setInterval(() => {
    if (Date.now() - lastTokenAt > stallTimeoutMs) {
      stalled = true;
      try {
        reader.cancel().catch(() => {});
      } catch {}
    }
  }, 1000);

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done || stalled) {
        break;
      }

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
        // Ignore a trailing partial line and rely on the accumulated text.
      }
    }
  } finally {
    clearInterval(stallChecker);
  }

  // If stream stalled, attempt to complete using next model in list
  if (stalled) {
    console.warn("Streaming stalled; attempting non-stream completion with next model");
    const modelIndex = AI_MODELS.indexOf(model);
    const nextIndex = (modelIndex + 1) % AI_MODELS.length;

    try {
      return await fetchEditNonStreaming(files, `${prompt}\n\nPREVIOUS_RESPONSE:\n${fullContent}`, apiKey, nextIndex);
    } catch (err) {
      console.error("Non-stream completion after stall failed:", err);
      // fallthrough to parse attempt below
    }
  }

  try {
    return parseGeneratedFilesPayload(fullContent).files;
  } catch (error) {
    console.error(
      "Streamed edit response was invalid JSON. Falling back to non-stream parse path."
    );

    // try to complete with the next model after the streaming model
    const modelIndex = AI_MODELS.indexOf(model);
    const nextIndex = (modelIndex + 1) % AI_MODELS.length;

    return fetchEditNonStreaming(files, `${prompt}\n\nPREVIOUS_RESPONSE:\n${fullContent}`, apiKey, nextIndex);
  }
};
