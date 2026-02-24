import { Hono, Context } from 'hono';
import type { Bindings } from "./types/bindings";
import { errorHandler } from './middleware/errorHandler';
import { healthRoute } from "./routes/health";
import { createSession } from "./routes/session";
import { sendMessage } from "./routes/message";

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", errorHandler);

app.get("/health", healthRoute);
app.post("/session", createSession);
app.post("/message", sendMessage);

// test route to check if durable object is working
app.get("/do", async (c: Context<{ Bindings: Bindings }>) => {
  const id = c.env.MY_DURABLE_OBJECT.idFromName("test-id");
  const obj = c.env.MY_DURABLE_OBJECT.get(id);

  return obj.fetch(new Request("http://internal"));
});

export default app;