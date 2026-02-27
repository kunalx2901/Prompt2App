import { verifyToken } from "@clerk/backend";
import type { MiddlewareHandler } from "hono";
import type { Bindings } from "../types/bindings";

export const clerkAuth: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    // Attach user info to context
    c.set("user", {
      id: payload.sub, // Clerk user ID
    });

    await next();
  } catch (error: any) {
    return c.json(
      { error: "Unauthorized", details: error.message },
      401
    );
  }
};