export const selectRelevantFiles = (
  files: string[],
  prompt: string
) => {

  const lowerPrompt = prompt.toLowerCase()

  const relevant: string[] = []

  for (const file of files) {

    const name = file.toLowerCase()

    // Always include main entry
    if (name.includes("app.js")) {
      relevant.push(file)
    }

    // Login related
    if (lowerPrompt.includes("login") && name.includes("screen")) {
      relevant.push(file)
    }

    // Profile related
    if (lowerPrompt.includes("profile") && name.includes("profile")) {
      relevant.push(file)
    }

    // Navigation updates
    if (lowerPrompt.includes("navigation") && name.includes("navigation")) {
      relevant.push(file)
    }

    // Theme / dark mode
    if (lowerPrompt.includes("dark") && name.includes("theme")) {
      relevant.push(file)
    }

  }

  return [...new Set(relevant)]
}