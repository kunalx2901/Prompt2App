import type { Context, Next } from "hono";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error("🔥 Global Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return c.json(
      {
        success: false,
        error: message,
      },
      500
    );
  }
};