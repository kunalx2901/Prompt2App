# Prompt2App Preview App

This folder is the Expo workspace used to run generated projects from the backend preview API.

## How preview sync works

1. Generate or edit a project through the backend.
2. Fetch the generated files through `GET /api/preview/:projectId`.
3. Sync those files into this Expo workspace.
4. Install dependencies in this folder.
5. Start Expo and open the app in Expo Go, Android, iOS, or web.

## Sync a generated project into the preview app

From `backend/` run:

```bash
npm run preview:load -- <projectId> <jwtToken>
```

Example:

```bash
npm run preview:load -- 123e4567-e89b-12d3-a456-426614174000 eyJhbGciOi...
```

Optional third argument:

```bash
npm run preview:load -- <projectId> <jwtToken> http://localhost:8787
```

## Start the preview app

After syncing:

```bash
cd preview-app
npm install
npm start
```

If you see stale content or the old project still appears, restart with a cleared Expo cache:

```bash
npm start -- --clear
```

If you were previously on an Expo 50 preview setup and Expo Go says the project is incompatible, re-run sync and reinstall:

```bash
cd ../
npm run preview:load -- <projectId> <jwtToken>
cd preview-app
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

## Notes

- The sync script writes generated source files like `App.js`, `screens/*`, and similar app files into this folder.
- It also merges generated dependencies into `preview-app/package.json` while keeping the Expo start scripts stable.
- The preview workspace is pinned to Expo SDK 54 compatibility for Expo Go 54.
- The sync script removes stale `package-lock.json` so old Expo SDK lock state does not conflict with the current preview SDK.
- It does not overwrite `app.json` because this workspace keeps one stable Expo app configuration.
- It tracks previously synced generated files and removes them before the next sync, so old files do not leak into the next preview.
- This workspace is intentionally configured as a classic Expo app runner, not an Expo Router app.
