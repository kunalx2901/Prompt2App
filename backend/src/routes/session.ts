import type { Context } from "hono";
import type { Bindings } from "../types/bindings";

export const createSession = async (
  c: Context<{ Bindings: Bindings }>
) => {
  const id = c.env.MY_DURABLE_OBJECT.newUniqueId();
  return c.json({ sessionId: id.toString() });
};