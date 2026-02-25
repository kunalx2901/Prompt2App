import { Hono } from "hono";
import { createPrisma } from "../db/prisma";

export const testRoute = new Hono();

testRoute.get("/test-db", async (c) => {
  const prisma = createPrisma(c.env.DATABASE_URL);
  const users = await prisma.user.findMany();
  return c.json(users);
});