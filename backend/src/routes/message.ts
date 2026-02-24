import type { Context } from "hono";
import type { Bindings } from "../types/bindings";

export const sendMessage = async (
  c: Context<{ Bindings: Bindings }>
) => {
  const { sessionId, message } = await c.req.json();

  if (!sessionId || !message) {
    return c.json({ error: "sessionId and message required" }, 400);
  }

  const id = c.env.MY_DURABLE_OBJECT.idFromString(sessionId);
  const obj = c.env.MY_DURABLE_OBJECT.get(id);

  return obj.fetch(
    new Request("http://internal/message", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" },
    })
  );
};