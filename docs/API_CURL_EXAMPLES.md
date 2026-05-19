# Prompt2App API Step-By-Step Curl Testing Guide

This guide is written in the exact order you should test the backend.

Use these variables first:

```bash
BASE_URL="http://localhost:8787"
JWT_TOKEN=""
PROJECT_ID=""
SESSION_ID=""
FILE_PATH="App.js"
```

If you already have a JWT token or project id, you can fill them in and skip the earlier steps.

## Step 1: Check if the backend is running

Route:

- `GET /health`

```bash
curl "$BASE_URL/health"
```

Expected result:

- plain text response similar to `Backend is healthy`

## Step 2: Check if auth routes are mounted

Route:

- `GET /auth/test`

```bash
curl "$BASE_URL/auth/test"
```

Expected result:

- JSON success message

## Step 3: Register a user

Route:

- `POST /auth/register`

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

What to do next:

- copy the `token` from the response
- copy the `user.id` only if you want it for reference
- set your shell variable:

```bash
JWT_TOKEN="paste_token_here"
```

If the user already exists, go to Step 4 instead.

## Step 4: Login if register is not needed

Route:

- `POST /auth/login`

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

What to do next:

- copy the `token`
- set:

```bash
JWT_TOKEN="paste_token_here"
```

## Step 5: Verify your JWT token

Route:

- `GET /auth/me`

```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected result:

- JSON with your authenticated user

If this fails with `Unauthorized`, stop here and fix auth before continuing.

## Step 6: Test database connection

Route:

- `GET /test-db`

```bash
curl "$BASE_URL/test-db"
```

Expected result:

- JSON array from the database

## Step 7: Test Durable Object session creation

Route:

- `POST /session`

```bash
curl -X POST "$BASE_URL/session" \
  -H "Content-Type: application/json" \
  -d '{}'
```

What to do next:

- copy the `sessionId`
- set:

```bash
SESSION_ID="paste_session_id_here"
```

## Step 8: Send a message to the Durable Object

Route:

- `POST /message`

```bash
curl -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "message": "hello from curl"
  }'
```

Expected result:

- JSON containing stored messages

## Step 9: Test the basic Durable Object route

Route:

- `GET /do`

```bash
curl "$BASE_URL/do"
```

## Step 10: Create a project

Route:

- `POST /api/projects`

```bash
curl -X POST "$BASE_URL/api/projects" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Created from curl"
  }'
```

What to do next:

- copy `project.id` from the response
- set:

```bash
PROJECT_ID="paste_project_id_here"
```

## Step 11: List your projects

Route:

- `GET /api/projects`

```bash
curl "$BASE_URL/api/projects" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Step 12: Get one project by id

Route:

- `GET /api/projects/:id`

```bash
curl "$BASE_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Step 13: Update that project

Route:

- `PUT /api/projects/:id`

```bash
curl -X PUT "$BASE_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project",
    "description": "Updated from curl"
  }'
```

## Step 14: Upload files into the project

Route:

- `POST /api/files/bulk/:projectId`

```bash
curl -X POST "$BASE_URL/api/files/bulk/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "App.js": "export default function App() { return null; }",
    "package.json": "{\"name\":\"demo\"}"
  }'
```

## Step 15: List files in the project

Route:

- `GET /api/files/:projectId`

```bash
curl "$BASE_URL/api/files/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Step 16: Get file as plain text

Route:

- `GET /api/files/:projectId/file/*`

```bash
curl "$BASE_URL/api/files/$PROJECT_ID/file/$FILE_PATH" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

For nested files:

```bash
FILE_PATH="screens/HomeScreen.js"
```

## Step 17: Get file as JSON

Route:

- `GET /api/files/:projectId/:path`

```bash
curl "$BASE_URL/api/files/$PROJECT_ID/$FILE_PATH" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Step 18: Update a file using filename in request body

Route:

- `PUT /api/files/:projectId`

```bash
curl -X PUT "$BASE_URL/api/files/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "'"$FILE_PATH"'",
    "content": "console.log(\"updated by body route\");"
  }'
```

## Step 19: Update a file using the path in the URL

Route:

- `PUT /api/files/:projectId/*`

```bash
curl -X PUT "$BASE_URL/api/files/$PROJECT_ID/$FILE_PATH" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "console.log(\"updated by path route\");"
  }'
```

## Step 20: View project tree

Route:

- `GET /api/projects/:projectId/tree`

```bash
curl "$BASE_URL/api/projects/$PROJECT_ID/tree" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Step 21: Preview all project files together

Route:

- `GET /api/preview/:projectId`

```bash
curl "$BASE_URL/api/preview/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

If you want to open that generated project in the Expo preview app, run:

```bash
cd ~/endsem-project/Prompt2App/backend
npm run preview:load -- "$PROJECT_ID" "$JWT_TOKEN"
cd preview-app
npm install
npm start
```

This syncs the generated project into the Expo workspace before launching it.

If you previously installed Expo 50 dependencies in `preview-app`, refresh them first:

```bash
cd ~/endsem-project/Prompt2App/backend
npm run preview:load -- "$PROJECT_ID" "$JWT_TOKEN"
cd preview-app
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

## Step 22: Test AI project generation

Route:

- `POST /api/generate`

This is a streaming endpoint, so use `-N`.

```bash
curl -N -X POST "$BASE_URL/api/generate" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "prompt": "Build a simple todo app with login screen"
  }'
```

Expected result:

- SSE output with events like `start`, `file`, and `done`

Important note:

- this route creates a new project automatically
- if you want to inspect that new generated project later, copy the `projectId` from the final `done` event

## Step 23: Test AI edit on an existing project

Route:

- `POST /api/edit`

This is a streaming endpoint, so use `-N`.

```bash
curl -N -X POST "$BASE_URL/api/edit" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "projectId": "'"$PROJECT_ID"'",
    "prompt": "Add dark mode and improve the home screen"
  }'
```

Expected result:

- SSE output with events like `status`, `file`, `AI`, and `done`

## Step 24: Delete one file by wildcard route

Route:

- `DELETE /api/files/:projectId/file/*`

```bash
curl -X DELETE "$BASE_URL/api/files/$PROJECT_ID/file/$FILE_PATH" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Use this only when you are done testing that file.

## Step 25: Delete one file by path route

Route:

- `DELETE /api/files/:projectId/:path`

```bash
curl -X DELETE "$BASE_URL/api/files/$PROJECT_ID/$FILE_PATH" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

This overlaps with the wildcard delete route, so usually testing one of them is enough.

## Step 26: Delete the project

Route:

- `DELETE /api/projects/:id`

```bash
curl -X DELETE "$BASE_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Use this last, after all project/file tests are complete.

# to start the expo project 
# do this
cd ~/endsem-project/Prompt2App/backend
npm run preview:load -- "$PROJECT_ID" "$JWT_TOKEN"

cd preview-app
rm -rf node_modules
npm install
npm start -- --clear