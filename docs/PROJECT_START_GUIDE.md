# Prompt2App Project Start Guide

This guide is meant for someone opening this repo for the first time and trying to understand:

- how to start the project
- which folder to work in first
- which routes are actually wired up
- which version/runtime details matter
- which setup issues may block you early

## 1. What is inside this repo

This project has 3 different app areas:

- `frontend/`
  - A Vite + React web app.
  - Right now this is mostly starter code.
- `backend/`
  - The real core of the project.
  - Uses Cloudflare Workers + Hono + Prisma + JWT auth + R2 + Durable Objects.
- `backend/preview-app/`
  - A separate Expo/React Native preview app.
  - This looks like an experimental or starter mobile preview area, not the main entry point to begin with.

If you are confused about where to start, start with `backend/` first.

## 2. Node version you should use

After checking `package.json`, `package-lock.json`, and the Dockerfiles:

- `frontend/Dockerfile` uses `node:20-alpine`
- `backend/Dockerfile` uses `node:20`
- both frontend and backend lockfiles include packages that require `node >= 18.17.0`

Best recommendation:

- use `Node.js 20.x`
- use `npm` (because the repo contains `package-lock.json`)

This is the safest version across the repo.

## 3. Best order to start the project

Use this order:

1. Understand the backend first.
2. Start the backend locally.
3. Test the public API routes.
4. Register/login first so you have a JWT token.
5. Check the protected API routes with `Authorization: Bearer <token>`.
5. Open the frontend after that.
6. Treat `backend/preview-app` as optional for now.

## 4. Important setup notes before running anything

There are a few gotchas in the current repo state:

- The root `docker-compose.yml` only defines `frontend`, but it has `depends_on: backend`.
  - That means the compose file is incomplete and is not enough to start the full stack by itself.
- The backend expects Cloudflare-style bindings and secrets, not just plain Node environment variables.
- `backend/prisma/schema.prisma` requires both:
  - `DATABASE_URL`
  - `DIRECT_DATABASE_URL`
- The repo now includes `backend/.env` and `backend/.env.example` with placeholders and setup notes.
- `backend/wrangler.jsonc` now expects secrets from `.env` or Cloudflare secret storage instead of hardcoded values.

## 5. Backend first: how to start it

Open a terminal:

```bash
cd Prompt2App/backend
npm install
```

Then review these files before running:

- `wrangler.jsonc`
- `.env`
- `src/types/bindings.ts`
- `prisma/schema.prisma`

### Ready-to-start checklist

Before you start the backend, confirm all of these are true:

- `backend/.env` has real values for:
  - `DATABASE_URL`
  - `DIRECT_DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `JWT_ISSUER`
  - `JWT_EXPIRES_IN`
  - `OPENROUTER_API_KEY`
- `JWT_SECRET_KEY` is a strong random secret, not a simple word or placeholder
- the Cloudflare R2 bucket named `prompt2app` already exists in the Cloudflare account you will use
- you are logged into Wrangler or otherwise have Cloudflare access configured
- you have run `npm install` inside `backend/`
- if this is a fresh database, you have run Prisma migration before testing auth or project routes

If any one of these is missing, the project may start partially but important routes will fail.

### Required backend runtime pieces

The backend code expects these values/bindings:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL` for Prisma migrations
- `JWT_SECRET_KEY`
- `JWT_ISSUER`
- `JWT_EXPIRES_IN`
- `OPENROUTER_API_KEY`
  - This repo uses OpenRouter's chat completions endpoint at `https://openrouter.ai/api/v1/chat/completions`.
  - The backend is configured to try models such as `qwen/qwen3-coder`, `deepseek/deepseek-chat`, and `meta-llama/llama-3.3-70b-instruct:free`.
  - If edits do not appear, confirm your API key is valid and not rate-limited.
- `PROMPT2APP_STORAGE` as an R2 bucket binding
- `MY_DURABLE_OBJECT` as a Durable Object binding

### Start backend dev server

```bash
npm run dev
```

This runs:

```bash
wrangler dev --host 0.0.0.0
```

The backend Dockerfile exposes port `8787`, so that is the main backend port to expect in development.

### If you need database migrations

Only do this if you are setting up a fresh database:

```bash
npx prisma migrate dev
```

For this to work, your Prisma config needs a valid direct database connection through `DIRECT_DATABASE_URL`.

Important note:

- because this project uses `prisma.config.ts`, Prisma does not auto-load `.env` by default
- the repo config has been updated to load `backend/.env` before migrations
- this repo is on Prisma `6.6.0`, so the config uses `process.env` instead of the newer `env()` helper shown in newer Prisma docs
- if you still see `Environment variable not found`, re-check the exact variable name in `.env`
- if you use Neon, `DIRECT_DATABASE_URL` should be the direct database hostname, not the pooled `-pooler` hostname

If the database already exists and you only want to inspect routes, you may be able to skip migrations at first.

### If Prisma shows `P1001: Can't reach database server`

This means Prisma successfully read your config and env values, but could not open a TCP connection to the database host.

Common cause for this repo:

- `DIRECT_DATABASE_URL` is pointing to the wrong Neon endpoint

If you are using Neon:

- keep `DATABASE_URL` as your Prisma Accelerate URL
- set `DIRECT_DATABASE_URL` to Neon's direct Postgres connection string
- do not use a hostname containing `-pooler` for `DIRECT_DATABASE_URL`

Example shape:

```env
DIRECT_DATABASE_URL="postgresql://user:password@ep-xxxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

If the host is already direct and you still get `P1001`, then the next likely causes are:

- temporary network/firewall/DNS issue on your machine
- Neon project or branch is paused/unavailable
- copied connection string is outdated

### Suggested first-run order

Use this order after filling `.env`:

1. `cd Prompt2App/backend`
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run dev`
5. test `GET /health`
6. test `GET /auth/test`
7. call `POST /auth/register`
8. copy the returned JWT token
9. test protected routes with `Authorization: Bearer <token>`

## 6. Frontend: how to start it

Open another terminal and start the React web UI:

```bash
cd Prompt2App/frontend
npm install
npm run dev
```

This is a Vite app, usually available on:

- `http://localhost:5173`

The frontend now supports a simple project workspace with:

- authentication via `/auth/login` and `/auth/register`
- project listing and creation under `/`
- previewing generated files for a project at `/project/:projectId`
- a backend proxy configured for `/api` and `/auth`

> Note: The frontend needs the backend running on `http://localhost:8787` to call protected routes.

## 7. Preview mobile app

There is also a separate Expo app in:

```bash
Prompt2App/backend/preview-app
```

Its `package.json` is the preview workspace package and may be updated when you sync a generated project into it.

The preview workspace defaults to a classic Expo app setup based around:

- `expo`
- `react`
- `react-native`

To try it:

```bash
cd Prompt2App/backend/preview-app
npm install
npm start
```

This preview app is now intended to be the runtime workspace for generated mobile projects.

### How to load a generated project into the preview app

After you have a valid JWT token and a project id:

```bash
cd Prompt2App/backend
npm run preview:load -- <projectId> <jwtToken>
```

Example:

```bash
npm run preview:load -- 123e4567-e89b-12d3-a456-426614174000 eyJhbGciOi...
```

Then start Expo:

```bash
cd preview-app
npm install
npm start
```

What this does:

- fetches generated files from `/api/preview/:projectId`
- syncs them into `backend/preview-app`

> Important: editing project files through the `/api/edit` route updates R2 storage, but the Expo preview shell only sees those changes after you rerun `npm run preview:load -- <projectId> <jwtToken>`.
- merges generated dependencies into the preview app package
- removes previously synced generated files so stale preview files do not remain
- keeps the preview workspace on an Expo SDK 54-compatible dependency stack

Important:

- the preview app is a classic Expo runner now, not an Expo Router-based preview shell
- generated `App.js` projects are expected to run through this workspace
- if Expo Go on your phone is SDK 54, remove old preview install state and run `npm install` again inside `preview-app` after syncing so the local workspace updates to the Expo 54 dependency set

## 8. Backend route map

The backend route registration happens in `backend/src/app.ts`.

There are 2 main groups:

- public routes
- protected routes under `/api`

## 9. Public backend routes

These routes do not go through the protected `/api` router.

### `GET /health`

Purpose:

- quick health check

Response:

- plain text: `Backend is healthy`

Use this first to confirm the worker is running.

### `POST /session`

Purpose:

- creates a Durable Object session id

Response:

- JSON containing `sessionId`

This is used before sending chat/session messages.

Example body:

```json
{}
```

### `POST /message`

Purpose:

- sends a message into the Durable Object session

Expected JSON body:

```json
{
  "sessionId": "your-session-id",
  "message": "hello"
}
```

Behavior:

- validates `sessionId` and `message`
- forwards the request to the Durable Object
- stores messages in Durable Object storage

### `GET /test-db`

Purpose:

- simple database test route

Behavior:

- connects through Prisma
- returns `user.findMany()`

Use this to verify DB connectivity.

### `GET /auth/test`

Purpose:

- quick check that the auth routes are mounted

Behavior:

- returns a success message

### `POST /auth/register`

Purpose:

- create a local user and return a JWT token

Expected body:

```json
{
  "email": "user@example.com",
  "password": "strongpassword",
  "name": "Optional Name"
}
```

Behavior:

- hashes the password
- creates the user in Prisma
- returns a signed JWT token

### `POST /auth/login`

Purpose:

- log in a local user and return a JWT token

Expected body:

```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

### `GET /auth/me`

Purpose:

- return the currently authenticated JWT user

Requires:

- `Authorization: Bearer <jwt_token>`

### `GET /do`

Purpose:

- simple Durable Object test route

Behavior:

- fetches a durable object named `test-id`

## 10. Protected backend routes

All routes below are mounted under:

```text
/api
```

They require:

- `Authorization: Bearer <jwt_token>`

Authentication is handled by `backend/src/middleware/jwtAuth.ts`.

## 11. Project routes

Mounted from:

- `src/routes/project.ts`
- `src/routes/projectTree.ts`

### `POST /api/projects`

Purpose:

- create a project

Expected JSON body:

```json
{
  "name": "My Project",
  "description": "optional"
}
```

Behavior:

- validates project name
- creates a project row

### `GET /api/projects`

Purpose:

- list all projects for the logged-in user

### `GET /api/projects/:id`

Purpose:

- fetch a single project

### `PUT /api/projects/:id`

Purpose:

- update project name and/or description

Expected JSON body:

```json
{
  "name": "Updated name",
  "description": "Updated description"
}
```

### `DELETE /api/projects/:id`

Purpose:

- delete a project

### `GET /api/projects/:projectId/tree`

Purpose:

- list project files from R2 as paths

Response shape:

```json
{
  "projectId": "uuid",
  "files": [
    "App.js",
    "screens/HomeScreen.js"
  ]
}
```

## 12. File routes

Mounted from:

- `src/routes/files.ts`
- `src/routes/fileContent.ts`

These routes work with file content stored in R2 under a key structure like:

```text
<userId>/<projectId>/files/<path>
```

### `POST /api/files/bulk/:projectId`

Purpose:

- upload many files at once

Expected JSON body:

```json
{
  "App.js": "file content",
  "screens/HomeScreen.js": "file content"
}
```

### `GET /api/files/:projectId`

Purpose:

- list files for a project

Response shape:

```json
{
  "files": [
    "App.js",
    "package.json"
  ]
}
```

### `GET /api/files/:projectId/file/*`

Purpose:

- fetch one file as plain text

Example:

```text
/api/files/123/file/App.js
```

### `PUT /api/files/:projectId`

Purpose:

- update one file using `filename` + `content`

Expected JSON body:

```json
{
  "filename": "App.js",
  "content": "new content"
}
```

### `DELETE /api/files/:projectId/file/*`

Purpose:

- delete one file

### `GET /api/files/:projectId/:path`

Purpose:

- fetch one file as JSON

Response shape:

```json
{
  "path": "App.js",
  "content": "..."
}
```

### `PUT /api/files/:projectId/*`

Purpose:

- update one file using the path in the URL

Expected JSON body:

```json
{
  "content": "new content"
}
```

### `DELETE /api/files/:projectId/:path`

Purpose:

- delete one file using the path in the URL

## 13. AI generation routes

### `POST /api/generate`

Purpose:

- generate a project from a prompt using OpenRouter AI

Expected JSON body:

```json
{
  "prompt": "Build a todo app with login"
}
```

Important behavior:

- this is a streaming response
- sends server-sent events such as:
  - `start`
  - `file`
  - `done`
- creates a new project in Prisma
- stores generated files in R2

### `POST /api/edit`

Purpose:

- edit an existing generated project using AI

Expected JSON body:

```json
{
  "projectId": "project-uuid",
  "prompt": "Add a login screen and dark mode"
}
```

Important behavior:

- this is also a streaming response
- sends events such as:
  - `status`
  - `file`
  - `AI`
  - `done`
- loads project files from R2
- selects relevant files
- sends them to AI
- writes updated files back to R2

## 14. Preview route

### `GET /api/preview/:projectId`

Purpose:

- returns all project files as a single JSON object

Response shape:

```json
{
  "files": {
    "App.js": "...",
    "package.json": "..."
  }
}
```

This is useful if you want to inspect the generated project payload in one request.

## 15. Frontend and mobile routes

### Web frontend routes

Currently the web frontend has no router setup.

Working route:

- `/`

### Expo preview-app routes

Inside `backend/preview-app/app/`, the file-based Expo Router routes are:

- `/`
  - from `app/(tabs)/index.tsx`
- `/explore`
  - from `app/(tabs)/explore.tsx`
- `/modal`
  - from `app/modal.tsx`

These belong to the mobile preview app, not the main web frontend.

## 16. Fastest way to explore the project as a beginner

If your goal is simply to understand the project quickly, do this:

1. Read `backend/src/app.ts` to see the full route map.
2. Read `backend/src/routes/project.ts` and `backend/src/routes/files.ts`.
3. Start the backend with `npm run dev`.
4. Test `GET /health`.
5. Test `GET /test-db`.
6. Only after that, look at protected `/api/...` routes.
7. Open `frontend/src/App.jsx` and `frontend/src/main.jsx` to understand the current web UI state.

## 17. Best place to work first

If you want to contribute without getting overwhelmed:

- start in `backend/src/app.ts`
- then `backend/src/routes/`
- then `backend/src/services/`

Why:

- that is where the actual business logic exists
- the frontend is still mostly starter code
- the preview mobile app looks secondary and partially experimental

## 18. Current reality of the repo

This is the practical summary:

- backend is the most real and most important part
- frontend is not fully connected yet
- docker-compose is incomplete
- auth, DB, R2, and AI keys are required for the full experience
- the most useful first milestone is getting the backend health route and DB test route working

Once those two routes work, the project becomes much easier to understand.
