import { Hono } from 'hono';
import {clerkAuth} from '../middleware/clerkAuth';

import { projects } from './project';
import files from './files';
import { Bindings } from '../types/bindings';
import generate from "./generate"
import projectTree from './projectTree';
import fileContent from './fileContent';
import edit from './edit'
import preview from './preview';

const protectedRoutes = new Hono<{ Bindings: Bindings }>();

// 🔐 Apply Clerk authentication to ALL routes inside this router
protectedRoutes.use('*', clerkAuth);

// 📦 Project routes
protectedRoutes.route('/projects', projects);

// 📁 File routes
protectedRoutes.route('/files', files);

// 🤖 AI generation route
protectedRoutes.route("/generate", generate);

// for project tree
protectedRoutes.route('/projects', projectTree);

// for viewing the file content
protectedRoutes.route('/files', fileContent);

// for editing the the files 
protectedRoutes.route('/edit', edit);

// for previewing the project 
protectedRoutes.route('/preview', preview);

export { protectedRoutes };