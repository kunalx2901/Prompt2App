import { Hono } from "hono";
import { createPrisma } from "../db/prisma";
import type { AppEnv } from "../types/app";
import {
  createAuthToken,
  hashPassword,
  verifyPassword,
} from "../services/auth";
import { jwtAuth } from "../middleware/jwtAuth";

const auth = new Hono<AppEnv>();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

auth.post("/register", async (c) => {
  const prisma = createPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (!isValidEmail(email)) {
    return c.json({ error: "A valid email is required" }, 400);
  }

  if (password.length < 8) {
    return c.json(
      { error: "Password must be at least 8 characters long" },
      400
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return c.json({ error: "User already exists" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name: name || null,
      passwordHash,
    },
  });

  const token = await createAuthToken(user, c.env);

  return c.json(
    {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
    201
  );
});

auth.post("/login", async (c) => {
  const prisma = createPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.passwordHash) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await createAuthToken(user, c.env);

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

auth.get("/me", jwtAuth, (c) => {
  return c.json({
    success: true,
    user: c.get("user"),
  });
});

auth.get("/test", (c) => {
  return c.json({
    success: true,
    message: "JWT authentication routes are ready",
  });
});

export { auth };
