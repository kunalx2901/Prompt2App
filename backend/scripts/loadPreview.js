const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// @babel/parser must be installed: npm install --save-dev @babel/parser
let babelParser;
try {
  babelParser = require("@babel/parser");
} catch {
  console.warn(
    "⚠ @babel/parser not found. Syntax validation will be skipped.\n" +
    "  Run: npm install --save-dev @babel/parser"
  );
}

const PROJECT_ID = process.argv[2];
const TOKEN = process.argv[3];
const BASE_URL = process.argv[4] || "http://localhost:8787";

const PREVIEW_DIR = path.join(__dirname, "../preview-app");
const MANIFEST_PATH = path.join(PREVIEW_DIR, ".prompt2app-preview-manifest.json");
const PACKAGE_LOCK_PATH = path.join(PREVIEW_DIR, "package-lock.json");
const EXPO_DIR = path.join(PREVIEW_DIR, ".expo");
const NODE_MODULES_PATH = path.join(PREVIEW_DIR, "node_modules");

const DEFAULT_PREVIEW_PACKAGE = {
  name: "prompt2app-preview",
  version: "1.0.0",
  private: true,
  main: "node_modules/expo/AppEntry.js",
  scripts: {
    start: "expo start --clear",
    android: "expo start --android --clear",
    ios: "expo start --ios --clear",
    web: "expo start --web --clear"
  },
  dependencies: {
    expo: "~54.0.33",
    react: "19.1.0",
    "react-native": "0.81.5",
    "@react-navigation/native": "7.2.4",
    "@react-navigation/stack": "7.9.2",
    "react-native-screens": "4.25.1",
    "react-native-safe-area-context": "4.14.1",
    "react-native-gesture-handler": "2.21.1"
  },
  devDependencies: {
    "@babel/core": "^7.20.0",
    "@babel/parser": "^7.24.0",
    "@types/react": "~19.1.0"
  }
};

const STABLE_PREVIEW_DEPENDENCIES = {
  "react-native-safe-area-context": "4.14.1",
  "react-native-screens": "4.25.1",
  "react-native-gesture-handler": "2.21.1",
  "@react-navigation/native": "7.2.4",
  "@react-navigation/stack": "7.9.2",
  "@react-navigation/bottom-tabs": "7.16.1",
  "@react-navigation/drawer": "8.1.1"
};

const EXCLUDED_GENERATED_FILES = new Set([
  "package-lock.json",
  "app.json"
]);

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureArgs() {
  if (!PROJECT_ID || !TOKEN) {
    throw new Error(
      "Usage: node scripts/loadPreview.js <projectId> <jwtToken> [baseUrl]"
    );
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function removePreviouslyGeneratedFiles() {
  const previousManifest = readJson(MANIFEST_PATH, { files: [] });

  for (const relativePath of previousManifest.files || []) {
    const fullPath = path.join(PREVIEW_DIR, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { force: true });
      console.log("Removed old preview file:", relativePath);
    }
  }

  return previousManifest.files || [];
}

function cleanupEmptyDirectories(dirPath) {
  if (!fs.existsSync(dirPath) || dirPath === PREVIEW_DIR) {
    return;
  }

  const entries = fs.readdirSync(dirPath);

  if (entries.length === 0) {
    fs.rmdirSync(dirPath);
    cleanupEmptyDirectories(path.dirname(dirPath));
  }
}

// ─── Syntax Validation ────────────────────────────────────────────────────────

/**
 * Uses @babel/parser to validate JS/JSX/TS/TSX syntax.
 * Returns an array of error strings (empty = no errors).
 */
function validateCodeSyntax(filename, code) {
  if (!babelParser) {
    return []; // skip if parser not installed
  }

  try {
    babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      // Allow decorators and other common patterns
      strictMode: false
    });

    return [];
  } catch (err) {
    return [`${filename}: Syntax error — ${err.message}`];
  }
}

// ─── Import Validation ────────────────────────────────────────────────────────

/**
 * Resolves a relative import path from a source file to the key used in `files`.
 * Tries several extensions so bare paths like `./Header` resolve to `Header.js`.
 */
function resolveImportPath(sourceFile, importPath) {
  const sourceDir = path.dirname(sourceFile);
  // Normalise to forward-slashes (files keys always use forward-slash)
  const base = path
    .join(sourceDir, importPath)
    .replace(/\\/g, "/")
    // Remove leading "./" that path.join sometimes keeps
    .replace(/^\.\//, "");

  const candidates = [
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

  return candidates; // caller checks which one exists
}

/**
 * Validates that every relative import in every JS/TS file resolves to an
 * existing file in the `files` map.
 * Returns an array of warning strings (empty = no issues).
 */
function validateImports(files) {
  const warnings = [];
  // Match: from './foo'  from "../bar/baz"  (relative paths only)
  const importRegex = /from\s+['"](\.\.[/\\][^'"]+|\.\/[^'"]+)['"]/g;

  for (const [filename, content] of Object.entries(files)) {
    if (!/\.(js|jsx|ts|tsx)$/.test(filename)) {
      continue;
    }

    let match;
    importRegex.lastIndex = 0;

    while ((match = importRegex.exec(content)) !== null) {
      const relativePath = match[1];
      const candidates = resolveImportPath(filename, relativePath);
      const exists = candidates.some((c) => Object.prototype.hasOwnProperty.call(files, c));

      if (!exists) {
        warnings.push(
          `${filename}: Unresolved import '${relativePath}'`
        );
      }
    }
  }

  return warnings;
}

// ─── Package.json Normalization ───────────────────────────────────────────────

function normalizePreviewPackageJson(generatedPackageJson) {
  const merged = {
    ...DEFAULT_PREVIEW_PACKAGE,
    ...generatedPackageJson,
    name: DEFAULT_PREVIEW_PACKAGE.name,
    version: DEFAULT_PREVIEW_PACKAGE.version,
    private: true,
    main: "node_modules/expo/AppEntry.js",
    scripts: {
      ...DEFAULT_PREVIEW_PACKAGE.scripts,
      ...(generatedPackageJson.scripts || {})
    },
    dependencies: {
      ...DEFAULT_PREVIEW_PACKAGE.dependencies,
      ...(generatedPackageJson.dependencies || {})
    },
    devDependencies: {
      ...DEFAULT_PREVIEW_PACKAGE.devDependencies,
      ...(generatedPackageJson.devDependencies || {})
    }
  };

  // Force Expo SDK 54 stack regardless of what was generated
  merged.dependencies = {
    ...merged.dependencies,
    expo: DEFAULT_PREVIEW_PACKAGE.dependencies.expo,
    react: DEFAULT_PREVIEW_PACKAGE.dependencies.react,
    "react-native": DEFAULT_PREVIEW_PACKAGE.dependencies["react-native"]
  };

  merged.devDependencies = {
    ...merged.devDependencies,
    "@types/react": DEFAULT_PREVIEW_PACKAGE.devDependencies["@types/react"]
  };

  merged.dependencies = {
    ...merged.dependencies,
    ...STABLE_PREVIEW_DEPENDENCIES
  };

  delete merged.packageManager;
  return merged;
}

function validateDependencies(packageJson) {
  const SAFE_DEPS = {
  "@react-navigation/native": "^7.2.4",
  "@react-navigation/native-stack": "^7.3.25",
  "@react-navigation/stack": "^7.9.2",
  "@react-navigation/bottom-tabs": "^7.4.7",
  "@react-navigation/drawer": "^7.5.7",

  "react-native-screens": "~4.11.1",
  "react-native-safe-area-context": "5.4.0",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.4",

  "expo-font": "~13.3.1",

  axios: "^1.8.4",
  lodash: "^4.17.21"
};

  const deps = packageJson.dependencies || {};
  const FORBIDDEN = [
    "native-base",
    "nativewind",
    "tailwindcss",
    "next",
    "vue",
    "angular"
  ];

  // Remove forbidden packages
  for (const pkg of FORBIDDEN) {
    delete deps[pkg];
  }

  // Replace with safe versions where the AI chose a different version
  for (const [pkg, version] of Object.entries(SAFE_DEPS)) {
    if (deps[pkg]) {
      deps[pkg] = version;
    }
  }

  packageJson.dependencies = deps;
  return packageJson;
}

// ─── Static Validation ────────────────────────────────────────────────────────

/**
 * Runs all static checks against the in-memory `files` map.
 * This runs BEFORE writing to disk so errors are caught early.
 *
 * Returns { syntaxErrors, importWarnings }.
 */
function validateProjectFiles(files) {
  const syntaxErrors = [];
  const importWarnings = [];

  // 1. Syntax validation
  for (const [filename, content] of Object.entries(files)) {
    if (/\.(js|jsx|ts|tsx)$/.test(filename)) {
      const errs = validateCodeSyntax(filename, content);
      syntaxErrors.push(...errs);
    }
  }

  // 2. Import existence validation
  const importIssues = validateImports(files);
  importWarnings.push(...importIssues);

  return { syntaxErrors, importWarnings };
}

// ─── App Structure Validation (disk) ─────────────────────────────────────────

function validateAppStructure() {
  console.log("Validating app structure...");

  const appJsPath = path.join(PREVIEW_DIR, "App.js");
  const packageJsonPath = path.join(PREVIEW_DIR, "package.json");
  const appJsonPath = path.join(PREVIEW_DIR, "app.json");

  if (!fs.existsSync(appJsPath)) {
    throw new Error("Missing App.js");
  }

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("Missing package.json");
  }

  if (!fs.existsSync(appJsonPath)) {
    throw new Error("Missing app.json");
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (!pkg.dependencies.expo) {
      throw new Error("Missing expo dependency");
    }
    if (!pkg.dependencies.react) {
      throw new Error("Missing react dependency");
    }
    if (!pkg.dependencies["react-native"]) {
      throw new Error("Missing react-native dependency");
    }
  } catch (e) {
    throw new Error(`Invalid package.json: ${e.message}`);
  }

  console.log("✓ App structure valid");
}

// ─── Build Test (disk) ────────────────────────────────────────────────────────

function testBuild() {
  console.log("Testing app build...");

  try {
    // Test 1: App.js must export a default component
    const appJs = fs.readFileSync(path.join(PREVIEW_DIR, "App.js"), "utf8");

    if (!appJs.includes("export default")) {
      throw new Error("App.js must export a default component");
    }

    // Test 2: JSON files must be valid
    try {
      JSON.parse(
        fs.readFileSync(path.join(PREVIEW_DIR, "package.json"), "utf8")
      );
    } catch {
      throw new Error("Invalid package.json JSON");
    }

    try {
      JSON.parse(
        fs.readFileSync(path.join(PREVIEW_DIR, "app.json"), "utf8")
      );
    } catch {
      throw new Error("Invalid app.json JSON");
    }

    // Test 3: Check for missing top-level package dependencies in App.js imports
    const importMatches =
      appJs.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PREVIEW_DIR, "package.json"), "utf8")
    );
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    for (const importStatement of importMatches) {
      const match = importStatement.match(/from\s+['"](@?[\w\-/]+)['"]/);
      if (match) {
        let packageName = match[1];

        if (packageName.includes("/")) {
          packageName = packageName
            .split("/")
            .slice(0, packageName.startsWith("@") ? 2 : 1)
            .join("/");
        }

        // Skip relative imports and built-in React/React Native modules
        if (
          !packageName.startsWith(".") &&
          !packageName.startsWith("react") &&
          !allDeps[packageName]
        ) {
          console.warn(
            `⚠ Warning: Package "${packageName}" not found in dependencies`
          );
        }
      }
    }

    console.log("✓ Build test passed");
    return true;
  } catch (e) {
    console.error(`✗ Build test failed: ${e.message}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function loadPreview() {
  ensureArgs();

  console.log("Fetching project files...");

  const res = await fetch(`${BASE_URL}/api/preview/${PROJECT_ID}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  if (!res.ok) {
    throw new Error(
      `Preview fetch failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  let files = data.files || data;

// Defensive validator unwrap
if (
  files.files &&
  typeof files.files === "object"
) {
  files = files.files;
}

console.log(
  "[PREVIEW FILES]",
  Object.keys(files)
);

if (
  !files["App.js"] &&
  !files["App.tsx"]
) {
  console.error(
    "Preview sync failed: Missing App.js"
  );

  console.log(
    "Received structure:",
    files
  );

  throw new Error(
    "Invalid project structure: Missing App.js"
  );
}

  // ── Static validation BEFORE writing to disk ──────────────────────────────
  console.log("Running static validation...");

  const { syntaxErrors, importWarnings } = validateProjectFiles(files);

  if (syntaxErrors.length > 0) {
    console.error("✗ Syntax errors found:");
    for (const err of syntaxErrors) {
      console.error("  •", err);
    }
    throw new Error(
      `Static validation failed: ${syntaxErrors.length} syntax error(s). Preview aborted.`
    );
  } else {
    console.log("✓ Syntax validation passed");
  }

  if (importWarnings.length > 0) {
    console.warn("⚠ Unresolved imports detected (may cause runtime errors):");
    for (const w of importWarnings) {
      console.warn("  •", w);
    }
    // Warn but do not abort — some imports may be aliases or auto-resolved
  } else {
    console.log("✓ Import validation passed");
  }

  // ── File writing ──────────────────────────────────────────────────────────
  let generatedPackageJson = null;
  const writtenFiles = [];

  const previousFiles = removePreviouslyGeneratedFiles();

  for (const relativePath of previousFiles) {
    cleanupEmptyDirectories(
      path.dirname(path.join(PREVIEW_DIR, relativePath))
    );
  }

  console.log("Writing files to preview-app...");

  for (const filePath in files) {
    if (EXCLUDED_GENERATED_FILES.has(filePath)) {
      continue;
    }

    if (filePath === "package.json") {
      try {
        generatedPackageJson = JSON.parse(files[filePath]);
      } catch {
        console.warn(
          "Generated package.json was invalid JSON. Using preview defaults."
        );
      }
      continue;
    }

    const fullPath = path.join(PREVIEW_DIR, filePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, files[filePath]);

    writtenFiles.push(filePath);
    console.log("Saved:", filePath);
  }

  // ── Package.json normalization ────────────────────────────────────────────
  let previewPackageJson = normalizePreviewPackageJson(
    generatedPackageJson || {}
  );
  previewPackageJson = validateDependencies(previewPackageJson);

  fs.writeFileSync(
    path.join(PREVIEW_DIR, "package.json"),
    JSON.stringify(previewPackageJson, null, 2) + "\n"
  );

  // ── Cleanup stale artifacts ───────────────────────────────────────────────
  if (fs.existsSync(PACKAGE_LOCK_PATH)) {
    fs.rmSync(PACKAGE_LOCK_PATH, { force: true });
    console.log("Removed stale preview package-lock.json");
  }

  if (fs.existsSync(NODE_MODULES_PATH)) {
    fs.rmSync(NODE_MODULES_PATH, { recursive: true, force: true });
    console.log("Cleaned old node_modules");
  }

  // ── Disk-level validation and build test ──────────────────────────────────
  validateAppStructure();

  if (!testBuild()) {
    throw new Error(
      "Build test failed. App may not work correctly. Please review the generated files."
    );
  }

  // ── Write manifest ────────────────────────────────────────────────────────
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        projectId: PROJECT_ID,
        syncedAt: new Date().toISOString(),
        files: writtenFiles
      },
      null,
      2
    ) + "\n"
  );

  if (fs.existsSync(EXPO_DIR)) {
    fs.rmSync(EXPO_DIR, { recursive: true, force: true });
    console.log("Removed stale Expo state: .expo");
  }

  console.log("✅ Preview ready 🚀");
  console.log("Next steps:");
  console.log("1. cd backend/preview-app");
  console.log("2. npm install");
  console.log("3. npm start");
}

loadPreview().catch((error) => {
  console.error("Preview sync failed:", error.message);
  process.exit(1);
});