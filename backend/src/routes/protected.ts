import { Hono } from "hono";
import { jwtAuth } from "../middleware/jwtAuth";

import { projects } from "./project";
import files from "./files";
import generate from "./generate";
import projectTree from "./projectTree";
import fileContent from "./fileContent";
import edit from "./edit";
import preview from "./preview";
import type { AppEnv } from "../types/app";

const protectedRoutes = new Hono<AppEnv>();

// Apply JWT authentication to all protected routes.
protectedRoutes.use("*", jwtAuth);

// 📦 Project routes
protectedRoutes.route("/projects", projects);

// 📁 File routes
protectedRoutes.route("/files", files);

// 🤖 AI generation route
protectedRoutes.route("/generate", generate);

// for project tree
protectedRoutes.route("/projects", projectTree);

// for viewing the file content
protectedRoutes.route("/files", fileContent);

// for editing the the files 
protectedRoutes.route("/edit", edit);

// for previewing the project 
protectedRoutes.route("/preview", preview);

export { protectedRoutes };
