import { Hono, Context } from 'hono';
import type { Bindings } from "./types/bindings";

import { errorHandler } from './middleware/errorHandler';
import { healthRoute } from "./routes/health";
import { createSession } from "./routes/session";
import { sendMessage } from "./routes/message";
import { testRoute } from "./routes/test-db";
import { clerkTest } from './routes/clerk-test';

import { protectedRoutes } from "./routes/protected";

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler
app.use("*", errorHandler);

// ---------------- PUBLIC ROUTES ----------------
app.get("/health", healthRoute);
app.post("/session", createSession);
app.post("/message", sendMessage);
app.route('/', testRoute);

// TEMPORARY: Clerk test routes (REMOVE IN PRODUCTION)
app.route('/clerk', clerkTest);

// ---------------- PROTECTED ROUTES ----------------
// Everything inside protectedRoutes will be under /api
app.route('/api', protectedRoutes);

// Durable Object test route
app.get("/do", async (c: Context<{ Bindings: Bindings }>) => {
  const id = c.env.MY_DURABLE_OBJECT.idFromName("test-id");
  const obj = c.env.MY_DURABLE_OBJECT.get(id);
  return obj.fetch(new Request("http://internal"));
});

export default app;