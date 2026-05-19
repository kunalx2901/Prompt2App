const fs = require("fs");
const path = require("path");

const PROJECT_ID = process.argv[2];
const TOKEN = process.argv[3];
const BASE_URL = process.argv[4] || "http://localhost:8787";

const PREVIEW_DIR = path.join(__dirname, "../preview-app");
const MANIFEST_PATH = path.join(PREVIEW_DIR, ".prompt2app-preview-manifest.json");
const PACKAGE_LOCK_PATH = path.join(PREVIEW_DIR, "package-lock.json");
const EXPO_DIR = path.join(PREVIEW_DIR, ".expo");

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
    "react-native": "0.81.5"
  },
  devDependencies: {
    "@babel/core": "^7.20.0",
    "@types/react": "~19.1.0"
  }
};

const STABLE_PREVIEW_DEPENDENCIES = {
  "react-native-safe-area-context": "4.14.1"
};

const EXCLUDED_GENERATED_FILES = new Set([
  "package-lock.json",
  "app.json"
]);

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

  // Force the preview workspace itself to stay on the Expo SDK 54 stack
  // so it remains compatible with Expo Go 54 even if generated package.json
  // contains older Expo versions.
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

async function loadPreview() {
  ensureArgs();

  console.log("Fetching project files...");

  const res = await fetch(`${BASE_URL}/api/preview/${PROJECT_ID}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  if (!res.ok) {
    throw new Error(`Preview fetch failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const files = data.files || {};
  let generatedPackageJson = null;
  const writtenFiles = [];

  const previousFiles = removePreviouslyGeneratedFiles();

  for (const relativePath of previousFiles) {
    cleanupEmptyDirectories(path.dirname(path.join(PREVIEW_DIR, relativePath)));
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
        console.warn("Generated package.json was invalid JSON. Using preview defaults.");
      }
      continue;
    }

    const fullPath = path.join(PREVIEW_DIR, filePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, files[filePath]);

    writtenFiles.push(filePath);
    console.log("Saved:", filePath);
  }

  const previewPackageJson = normalizePreviewPackageJson(generatedPackageJson || {});
  fs.writeFileSync(
    path.join(PREVIEW_DIR, "package.json"),
    JSON.stringify(previewPackageJson, null, 2) + "\n"
  );

  if (fs.existsSync(PACKAGE_LOCK_PATH)) {
    fs.rmSync(PACKAGE_LOCK_PATH, { force: true });
    console.log("Removed stale preview package-lock.json");
  }

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

  console.log("Preview ready 🚀");
  console.log("Next steps:");
  console.log("1. cd backend/preview-app");
  console.log("2. npm install");
  console.log("3. npm start");
}


loadPreview().catch((error) => {
  console.error("Preview sync failed:", error.message);
  process.exit(1);
});
