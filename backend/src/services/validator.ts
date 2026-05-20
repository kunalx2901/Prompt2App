// validator.ts
// Static validation for AI-generated project files.
// Runs in-memory BEFORE any files are written to disk or sent to preview.
//
// Install peer dependency for syntax validation:
//   npm install --save-dev @babel/parser

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidationResult = {
  /** Files after sanitization + fallback injection. Always safe to use. */
  files: Record<string, string>;
  /** Hard errors that mean the output is broken (syntax failures). */
  syntaxErrors: string[];
  /** Soft warnings that may cause runtime issues (unresolved imports). */
  importWarnings: string[];
  /** Whether the output passed all hard checks. */
  valid: boolean;
};

// ─── Constants — kept in sync with ai.ts ─────────────────────────────────────

const LOCKED_EXPO_DEPENDENCIES: Record<string, string> = {
  expo: "~54.0.0",
  react: "19.1.0",
  "react-native": "0.81.5"
};

const SAFE_DEFAULT_DEPENDENCIES: Record<string, string> = {
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/native-stack": "^7.3.25",
  "@react-navigation/stack": "^7.3.10",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "@react-navigation/drawer": "^7.0.0",
  "react-native-safe-area-context": "5.4.0",
  "react-native-screens": "~4.11.1",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.4",
  "@expo/vector-icons": "^14.0.0"
};

const FORBIDDEN_DEPENDENCIES: string[] = [
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

const FALLBACK_APP_JS = `import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello from Prompt2App 🚀</Text>
    </View>
  );
}
`;

const FALLBACK_PACKAGE_JSON = {
  name: "prompt2app-project",
  version: "1.0.0",
  private: true,
  main: "node_modules/expo/AppEntry.js",
  scripts: {
    start: "expo start",
    android: "expo start --android",
    ios: "expo start --ios",
    web: "expo start --web"
  },
  dependencies: {
    ...SAFE_DEFAULT_DEPENDENCIES,
    ...LOCKED_EXPO_DEPENDENCIES
  },
  devDependencies: {
    "@types/react": "~19.1.0"
  }
};

// ─── Babel parser (optional — graceful degradation) ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let babelParser: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  babelParser = require("@babel/parser");
} catch {
  // Syntax validation will be skipped; import + dependency checks still run.
}

// ─── Syntax Validation ────────────────────────────────────────────────────────

function validateCodeSyntax(filename: string, code: string): string[] {
  if (!babelParser) return [];

  try {
    babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      strictMode: false
    });
    return [];
  } catch (err: any) {
    return [`${filename}: Syntax error — ${err.message}`];
  }
}

// ─── Import Validation ────────────────────────────────────────────────────────

/**
 * Resolves a relative import specifier to candidate file paths.
 * All paths use forward-slashes to match the keys in the `files` map.
 */
function resolveImportCandidates(
  sourceFile: string,
  importSpecifier: string
): string[] {
  const sourceDir = sourceFile.includes("/")
    ? sourceFile.slice(0, sourceFile.lastIndexOf("/"))
    : ".";

  const parts = `${sourceDir}/${importSpecifier}`.split("/");
  const stack: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      stack.pop();
    } else if (part !== ".") {
      stack.push(part);
    }
  }

  const base = stack.join("/");

  return [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`
  ];
}

function validateImports(files: Record<string, string>): string[] {
  const warnings: string[] = [];
  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

  for (const [filename, content] of Object.entries(files)) {
    if (!/\.(js|jsx|ts|tsx)$/.test(filename)) continue;

    importRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      const specifier = match[1];
      const candidates = resolveImportCandidates(filename, specifier);
      const exists = candidates.some((c) =>
        Object.prototype.hasOwnProperty.call(files, c)
      );

      if (!exists) {
        warnings.push(`${filename}: Unresolved import '${specifier}'`);
      }
    }
  }

  return warnings;
}

// ─── Dependency Sanitization ──────────────────────────────────────────────────

function sanitizePackageJson(raw: string): string {
  let pkg: Record<string, any>;

  try {
    pkg = JSON.parse(raw);
  } catch {
    return JSON.stringify(FALLBACK_PACKAGE_JSON, null, 2);
  }

  pkg.dependencies = { ...(pkg.dependencies ?? {}) };
  pkg.devDependencies = { ...(pkg.devDependencies ?? {}) };

  for (const dep of FORBIDDEN_DEPENDENCIES) {
    delete pkg.dependencies[dep];
    delete pkg.devDependencies[dep];
  }

  // Inject safe defaults, lock Expo versions on top
  pkg.dependencies = {
    ...pkg.dependencies,
    ...SAFE_DEFAULT_DEPENDENCIES,
    ...LOCKED_EXPO_DEPENDENCIES
  };

  pkg.scripts = {
    start: "expo start",
    android: "expo start --android",
    ios: "expo start --ios",
    web: "expo start --web"
  };

  pkg.name = pkg.name ?? "prompt2app-project";
  pkg.version = pkg.version ?? "1.0.0";
  pkg.private = true;
  pkg.main = "node_modules/expo/AppEntry.js";

  return JSON.stringify(pkg, null, 2);
}

// ─── Dependency Auto-Detection ────────────────────────────────────────────────

// Packages the auto-detector knows about — kept in sync with SAFE_DEFAULT_DEPENDENCIES
const KNOWN_PACKAGE_PREFIXES: Record<string, string> = {
  "@react-navigation/native-stack": "^7.3.25",
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/stack": "^7.3.10",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "@react-navigation/drawer": "^7.0.0",
  "react-native-safe-area-context": "5.4.0",
  "react-native-screens": "~4.11.1",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.4",
  "@expo/vector-icons": "^14.0.0",
  "react-native-vector-icons": "^10.0.0",
  "expo-linear-gradient": "~14.0.0",
  "expo-image": "~2.0.0",
  "expo-font": "~13.0.0",
  "expo-status-bar": "~2.0.0",
  "expo-constants": "~17.0.0",
  axios: "^1.7.4",
  lodash: "^4.17.21",
  "date-fns": "^3.0.0",
  uuid: "^10.0.0"
};

function detectAndInjectMissingDependencies(
  files: Record<string, string>
): Record<string, string> {
  const updatedFiles = { ...files };

  if (!updatedFiles["package.json"]) return updatedFiles;

  let pkg: Record<string, any>;
  try {
    pkg = JSON.parse(updatedFiles["package.json"]);
  } catch {
    return updatedFiles;
  }

  const deps: Record<string, string> = { ...(pkg.dependencies ?? {}) };
  const importRegex = /from\s+['"](@?[a-zA-Z][a-zA-Z0-9\-_@/]*)['"]/g;

  for (const [filename, content] of Object.entries(files)) {
    if (!/\.(js|jsx|ts|tsx)$/.test(filename)) continue;

    importRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      const raw = match[1];
      if (raw.startsWith(".")) continue;

      const pkgName = raw.startsWith("@")
        ? raw.split("/").slice(0, 2).join("/")
        : raw.split("/")[0];

      if (
        !deps[pkgName] &&
        !FORBIDDEN_DEPENDENCIES.includes(pkgName) &&
        KNOWN_PACKAGE_PREFIXES[pkgName]
      ) {
        deps[pkgName] = KNOWN_PACKAGE_PREFIXES[pkgName];
      }
    }
  }

  pkg.dependencies = deps;
  updatedFiles["package.json"] = JSON.stringify(pkg, null, 2);
  return updatedFiles;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Validates and sanitizes AI-generated project files.
 *
 * Receives a flat Record<string, string> — the already-extracted files map
 * from parseGeneratedFilesPayload/sanitizeGeneratedFiles in ai.ts.
 *
 * Pipeline:
 *  1. Inject fallback App.js / package.json if missing
 *  2. Auto-detect and inject missing dependencies
 *  3. Sanitize package.json (remove forbidden, lock versions)
 *  4. Syntax-check all JS/TS files (requires @babel/parser)
 *  5. Validate relative imports
 */
export const validateProjectFiles = (
  files: Record<string, string>
): ValidationResult => {
  let validated = { ...files };

  // ── Step 1: Inject required fallbacks ────────────────────────────────────
  if (!validated["App.js"]) {
    console.warn("[validator] App.js missing — injecting fallback");
    validated["App.js"] = FALLBACK_APP_JS;
  }

  if (!validated["package.json"]) {
    console.warn("[validator] package.json missing — injecting fallback");
    validated["package.json"] = JSON.stringify(FALLBACK_PACKAGE_JSON, null, 2);
  }

  // ── Step 2: Auto-detect missing dependencies ──────────────────────────────
  validated = detectAndInjectMissingDependencies(validated);

  // ── Step 3: Sanitize package.json ─────────────────────────────────────────
  validated["package.json"] = sanitizePackageJson(validated["package.json"]);

  // ── Step 4: Syntax validation ─────────────────────────────────────────────
  const syntaxErrors: string[] = [];

  for (const [filename, content] of Object.entries(validated)) {
    if (/\.(js|jsx|ts|tsx)$/.test(filename)) {
      syntaxErrors.push(...validateCodeSyntax(filename, content));
    }
  }

  // ── Step 5: Import validation ─────────────────────────────────────────────
  const importWarnings = validateImports(validated);

  if (syntaxErrors.length > 0) {
    console.error("[validator] Syntax errors:");
    syntaxErrors.forEach((e) => console.error("  •", e));
  }

  if (importWarnings.length > 0) {
    console.warn("[validator] Import warnings:");
    importWarnings.forEach((w) => console.warn("  •", w));
  }

  if (syntaxErrors.length === 0 && importWarnings.length === 0) {
    console.log("[validator] ✓ All checks passed");
  }

  return {
    files: validated,
    syntaxErrors,
    importWarnings,
    valid: syntaxErrors.length === 0
  };
};