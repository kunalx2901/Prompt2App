# Prompt2App Frontend

This frontend is a responsive React + Vite UI for managing Prompt2App projects and previewing generated files.

## Start the frontend

```bash
cd Prompt2App/frontend
npm install
npm run dev
```

Open the app in your browser at:

- `http://localhost:5173`

## Backend requirements

The frontend is configured to proxy API calls to the backend at `http://localhost:8787`.

Make sure the backend is running before using the frontend:

```bash
cd Prompt2App/backend
npm install
npm run dev
```

## What this frontend includes

- login and registration pages
- project dashboard with create and refresh controls
- preview page for generated files from `/api/preview/:projectId`
- direct file content loading from the backend
- responsive layout and modern styling

## Available routes

- `/auth` - login / register
- `/` - project dashboard
- `/project/:projectId` - preview project files

## Notes

If you are editing project files through the backend API, the Expo preview shell will only reflect the latest files after you run:

```bash
cd Prompt2App/backend
npm run preview:load -- <projectId> <jwtToken>
```
