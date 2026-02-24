import type { Context } from "hono";
import type { Bindings } from "../types/bindings";

export const healthRoute = (c: Context<{ Bindings: Bindings }>) => {
  return c.text("Backend is healthy 🚀");
};