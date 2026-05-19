import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/app";
import { verifyAuthToken } from "../services/auth";

export const jwtAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await verifyAuthToken(token, c.env);
    c.set("user", user);

    await next();
  } catch (error) {
    return c.json(
      {
        error: "Unauthorized",
        details: error instanceof Error ? error.message : "Invalid token",
      },
      401
    );
  }
};
