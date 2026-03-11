export type GeneratedFiles = {
  files: Record<string, string>;
};

export const generateProjectFiles = async (
  prompt: string,
  apiKey: string
): Promise<GeneratedFiles> => {

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
        model: "stepfun/step-3.5-flash:free",
        messages: [
          {
            role: "system",
            content:
              "You are an expert React Native developer. Always return ONLY valid JSON."
          },
          {
            role: "user",
            content: `
Generate a React Native Expo project.

Return ONLY JSON in this format:

{
  "files": {
    "App.js": "...",
    "package.json": "...",
    "screens/HomeScreen.js": "..."
  }
}

User request:
${prompt}
`
          }
        ]
      })
    }
  );

  const data = await response.json();

  // Debugging output
  console.log("AI RESPONSE:", data);

  if (!data.choices || !data.choices[0]) {
    throw new Error(
      "Invalid AI response from OpenRouter: " + JSON.stringify(data)
    );
  }

  let content: string = data.choices[0].message.content;

  // Remove markdown formatting if the AI returns ```json blocks
  content = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(content);

    if (!parsed.files) {
      throw new Error("AI response missing 'files' property");
    }

    return parsed as GeneratedFiles;

  } catch (err) {

    console.error("JSON PARSE ERROR:", content);

    throw new Error("AI returned invalid JSON");
  }
};

// to edit the files from the AI

export const editProjectFilesStream = async (
  files: Record<string, string>,
  prompt: string,
  apiKey: string,
  onToken: (token: string) => Promise<void>
) => {

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
        model: "stepfun/step-3.5-flash:free",
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are an expert React Native developer. Always return ONLY valid JSON."
          },
          {
            role: "user",
            content: `
Project files:
${JSON.stringify(files)}

User request:
${prompt}

Return JSON format:

{
  "files": {
    "App.js": "...",
    "screens/LoginScreen.js": "..."
  }
}
`
          }
        ]
      })
    }
  )

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  let fullContent = ""

  while (true) {

    const { done, value } = await reader!.read()

    if (done) break

    const chunk = decoder.decode(value)

    const lines = chunk.split("\n")

    for (const line of lines) {

      if (line.startsWith("data: ")) {

        const data = line.replace("data: ", "").trim()

        if (data === "[DONE]") continue

        try {

          const parsed = JSON.parse(data)

          const token =
            parsed.choices?.[0]?.delta?.content || ""

          if (token) {

            fullContent += token

            await onToken(token)

          }

        } catch (e) {
          continue
        }
      }
    }
  }

  const cleaned = fullContent
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  const parsed = JSON.parse(cleaned)

  return parsed.files
}