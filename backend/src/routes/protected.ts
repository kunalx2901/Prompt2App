import { Hono } from 'hono';
import {clerkAuth} from '../middleware/clerkAuth';

import { projects } from './project';
import files from './files';
import { Bindings } from '../types/bindings';

const protectedRoutes = new Hono<{ Bindings: Bindings }>();

// 🔐 Apply Clerk authentication to ALL routes inside this router
protectedRoutes.use('*', clerkAuth);

// 📦 Project routes
protectedRoutes.route('/projects', projects);

// 📁 File routes
protectedRoutes.route('/files', files);

export { protectedRoutes };