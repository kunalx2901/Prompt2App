import { Hono, Context } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import type { AppEnv } from "../types/app";

const projects = new Hono<AppEnv>();

projects.post("/", async (c: Context<AppEnv>) => {
  try {
    const user = c.get("user");
    const { name, description } = await c.req.json();

    if (!name || name.trim().length === 0) {
      return c.json({ error: "Project name is required" }, 400);
    }

    if (name.length > 100) {
      return c.json(
        { error: "Project name must be less than 100 characters" },
        400
      );
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
      },
    });

    return c.json(
      {
        success: true,
        message: "Project created successfully",
        project,
      },
      201
    );
  } catch (error) {
    console.error("Create project error:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

projects.get("/", async (c: Context<AppEnv>) => {
  try {
    const user = c.get("user");

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const userProjects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return c.json({
      success: true,
      count: userProjects.length,
      projects: userProjects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        snackId: project.snackId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error) {
    console.error("List projects error:", error);
    return c.json({ error: "Failed to list projects" }, 500);
  }
});

projects.get("/:id", async (c: Context<AppEnv>) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        snackId: project.snackId,
        userId: project.userId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return c.json({ error: "Failed to get project" }, 500);
  }
});

projects.put("/:id", async (c: Context<AppEnv>) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const { name, description } = await c.req.json();

    if (name && name.length > 100) {
      return c.json(
        { error: "Project name must be less than 100 characters" },
        400
      );
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
      },
    });

    return c.json({
      success: true,
      message: "Project updated successfully",
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        snackId: updatedProject.snackId,
        updatedAt: updatedProject.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update project error:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

projects.delete("/:id", async (c: Context<AppEnv>) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return c.json({
      success: true,
      message: "Project deleted successfully",
      projectId,
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

export { projects };
