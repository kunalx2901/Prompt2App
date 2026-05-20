export const selectRelevantFiles = (
  files: string[],
  prompt: string
) => {
  const lowerPrompt =
    prompt.toLowerCase();

  const relevant =
    new Set<string>();

  // =====================================
  // APP-LEVEL CHANGES
  // =====================================

  const needsAppJs =
    lowerPrompt.includes("navigation") ||
    lowerPrompt.includes("route") ||
    lowerPrompt.includes("routing") ||
    lowerPrompt.includes("theme") ||
    lowerPrompt.includes("provider") ||
    lowerPrompt.includes("redux") ||
    lowerPrompt.includes("context") ||
    lowerPrompt.includes("authentication") ||
    lowerPrompt.includes("auth") ||
    lowerPrompt.includes("stack") ||
    lowerPrompt.includes("tab") ||
    lowerPrompt.includes("drawer");

  // =====================================
  // FILE MATCHING
  // =====================================

  for (const file of files) {
    const name =
      file.toLowerCase();

    // -------------------------
    // ONLY include App.js when needed
    // -------------------------

    if (
      needsAppJs &&
      (
        name === "app.js" ||
        name === "app.tsx"
      )
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Login related
    // -------------------------

    if (
      lowerPrompt.includes("login") &&
      (
        name.includes("login") ||
        name.includes("auth")
      )
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Profile related
    // -------------------------

    if (
      lowerPrompt.includes("profile") &&
      name.includes("profile")
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Game related
    // -------------------------

    if (
      (
        lowerPrompt.includes("game") ||
        lowerPrompt.includes("tic tac toe") ||
        lowerPrompt.includes("board")
      ) &&
      (
        name.includes("game") ||
        name.includes("board")
      )
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Home screen
    // -------------------------

    if (
      lowerPrompt.includes("home") &&
      name.includes("home")
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Theme / dark mode
    // -------------------------

    if (
      (
        lowerPrompt.includes("dark") ||
        lowerPrompt.includes("theme")
      ) &&
      (
        name.includes("theme") ||
        name.includes("style")
      )
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Component updates
    // -------------------------

    if (
      lowerPrompt.includes("button") &&
      name.includes("button")
    ) {
      relevant.add(file);
    }

    // -------------------------
    // Screen edits
    // -------------------------

    if (
      lowerPrompt.includes("screen") &&
      name.includes("screen")
    ) {
      relevant.add(file);
    }
  }

  // =====================================
  // SAFETY FALLBACK
  // =====================================

  if (relevant.size === 0) {
    for (const file of files.slice(0, 3)) {
      relevant.add(file);
    }
  }

  return [...relevant];
};