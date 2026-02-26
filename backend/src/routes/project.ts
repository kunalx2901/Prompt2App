import { Hono } from 'hono';                                                                                                                                                          
  import { PrismaClient } from '@prisma/client/edge';                                                                                                                                   
  import { withAccelerate } from '@prisma/extension-accelerate';                                                                                                                        
  import { clerkAuth } from '../middleware/clerkAuth';                                                                                                                                  
  import type { Bindings } from '../types/bindings';                                                                                                                                    
                                                                                                                                                                                        
  const projects = new Hono<{ Bindings: Bindings }>(); 
  
//   test route to verify auth and DB connection
projects.post('/test-create', async (c) => {                                                                                                                                          
    try {                                                                                                                                                                               
      const { name, description, userId } = await c.req.json();                                                                                                                         
                                                                                                                                                                                        
      if (!name || !userId) {                                                                                                                                                           
        return c.json({ error: 'name and userId required' }, 400);                                                                                                                      
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      const project = await prisma.project.create({                                                                                                                                     
        data: {                                                                                                                                                                         
          name: name.trim(),                                                                                                                                                            
          description: description?.trim() || null,                                                                                                                                     
          userId: userId,                                                                                                                                                               
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Test project created',                                                                                                                                                
        project: {                                                                                                                                                                      
          id: project.id,                                                                                                                                                               
          name: project.name,                                                                                                                                                           
          description: project.description,                                                                                                                                             
          userId: project.userId,                                                                                                                                                       
        },                                                                                                                                                                              
      }, 201);                                                                                                                                                                          
                                                                                                                                                                                        
    } catch (error) {                                                                                                                                                                   
      console.error('Test create error:', error);                                                                                                                                       
      return c.json({ error: 'Failed to create test project' }, 500);                                                                                                                   
    }                                                                                                                                                                                   
  });                  
                                                                                                                                                                                        
  // Apply Clerk auth to all project routes                                                                                                                                             
  projects.use('*', clerkAuth);                                                                                                                                                         
                                                                                                                                                                                        
  // Create a new project                                                                                                                                                               
  projects.post('/', async (c) => {                                                                                                                                                     
    try {                                                                                                                                                                               
      const user = c.get('user');                                                                                                                                                       
      const { name, description } = await c.req.json();                                                                                                                                 
                                                                                                                                                                                        
      // Validation                                                                                                                                                                     
      if (!name || name.trim().length === 0) {                                                                                                                                          
        return c.json({ error: 'Project name is required' }, 400);                                                                                                                      
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      if (name.length > 100) {                                                                                                                                                          
        return c.json({ error: 'Project name must be less than 100 characters' }, 400);                                                                                                 
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      // Initialize Prisma                                                                                                                                                              
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      // Create project                                                                                                                                                                 
      const project = await prisma.project.create({                                                                                                                                     
        data: {                                                                                                                                                                         
          name: name.trim(),                                                                                                                                                            
          description: description?.trim() || null,                                                                                                                                     
          userId: user.id,                                                                                                                                                              
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Project created successfully',                                                                                                                                        
        project: {                                                                                                                                                                      
          id: project.id,                                                                                                                                                               
          name: project.name,                                                                                                                                                           
          description: project.description,                                                                                                                                             
          userId: project.userId,                                                                                                                                                       
          createdAt: project.createdAt,                                                                                                                                                 
          updatedAt: project.updatedAt,                                                                                                                                                 
        },                                                                                                                                                                              
      }, 201);                                                                                                                                                                          
                                                                                                                                                                                        
    } catch (error) {                                                                                                                                                                   
      console.error('Create project error:', error);                                                                                                                                    
      return c.json({ error: 'Failed to create project' }, 500);                                                                                                                        
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Get all projects for the authenticated user                                                                                                                                        
  projects.get('/', async (c) => {                                                                                                                                                      
    try {                                                                                                                                                                               
      const user = c.get('user');                                                                                                                                                       
                                                                                                                                                                                        
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      const userProjects = await prisma.project.findMany({                                                                                                                              
        where: {                                                                                                                                                                        
          userId: user.id,                                                                                                                                                              
        },                                                                                                                                                                              
        orderBy: {                                                                                                                                                                      
          updatedAt: 'desc',                                                                                                                                                            
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        count: userProjects.length,                                                                                                                                                     
        projects: userProjects.map(p => ({                                                                                                                                              
          id: p.id,                                                                                                                                                                     
          name: p.name,                                                                                                                                                                 
          description: p.description,                                                                                                                                                   
          snackId: p.snackId,                                                                                                                                                           
          createdAt: p.createdAt,                                                                                                                                                       
          updatedAt: p.updatedAt,                                                                                                                                                       
        })),                                                                                                                                                                            
      });                                                                                                                                                                               
                                                                                                                                                                                        
    } catch (error) {                                                                                                                                                                   
      console.error('List projects error:', error);                                                                                                                                     
      return c.json({ error: 'Failed to list projects' }, 500);                                                                                                                         
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Get a single project by ID                                                                                                                                                         
  projects.get('/:id', async (c) => {                                                                                                                                                   
    try {                                                                                                                                                                               
      const user = c.get('user');                                                                                                                                                       
      const projectId = c.req.param('id');                                                                                                                                              
                                                                                                                                                                                        
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      const project = await prisma.project.findFirst({                                                                                                                                  
        where: {                                                                                                                                                                        
          id: projectId,                                                                                                                                                                
          userId: user.id, // Ensure user owns this project                                                                                                                             
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      if (!project) {                                                                                                                                                                   
        return c.json({ error: 'Project not found' }, 404);                                                                                                                             
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
      console.error('Get project error:', error);                                                                                                                                       
      return c.json({ error: 'Failed to get project' }, 500);                                                                                                                           
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Update a project                                                                                                                                                                   
  projects.put('/:id', async (c) => {                                                                                                                                                   
    try {                                                                                                                                                                               
      const user = c.get('user');                                                                                                                                                       
      const projectId = c.req.param('id');                                                                                                                                              
      const { name, description } = await c.req.json();                                                                                                                                 
                                                                                                                                                                                        
      // Validation                                                                                                                                                                     
      if (name && name.length > 100) {                                                                                                                                                  
        return c.json({ error: 'Project name must be less than 100 characters' }, 400);                                                                                                 
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      // Check if project exists and user owns it                                                                                                                                       
      const existingProject = await prisma.project.findFirst({                                                                                                                          
        where: {                                                                                                                                                                        
          id: projectId,                                                                                                                                                                
          userId: user.id,                                                                                                                                                              
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      if (!existingProject) {                                                                                                                                                           
        return c.json({ error: 'Project not found' }, 404);                                                                                                                             
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      // Update project                                                                                                                                                                 
      const updatedProject = await prisma.project.update({                                                                                                                              
        where: { id: projectId },                                                                                                                                                       
        data: {                                                                                                                                                                         
          ...(name && { name: name.trim() }),                                                                                                                                           
          ...(description !== undefined && { description: description?.trim() || null }),                                                                                               
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Project updated successfully',                                                                                                                                        
        project: {                                                                                                                                                                      
          id: updatedProject.id,                                                                                                                                                        
          name: updatedProject.name,                                                                                                                                                    
          description: updatedProject.description,                                                                                                                                      
          snackId: updatedProject.snackId,                                                                                                                                              
          updatedAt: updatedProject.updatedAt,                                                                                                                                          
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
    } catch (error) {                                                                                                                                                                   
      console.error('Update project error:', error);                                                                                                                                    
      return c.json({ error: 'Failed to update project' }, 500);                                                                                                                        
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Delete a project                                                                                                                                                                   
  projects.delete('/:id', async (c) => {                                                                                                                                                
    try {                                                                                                                                                                               
      const user = c.get('user');                                                                                                                                                       
      const projectId = c.req.param('id');                                                                                                                                              
                                                                                                                                                                                        
      const prisma = new PrismaClient({                                                                                                                                                 
        datasourceUrl: c.env.DATABASE_URL,                                                                                                                                              
      }).$extends(withAccelerate());                                                                                                                                                    
                                                                                                                                                                                        
      // Check if project exists and user owns it                                                                                                                                       
      const project = await prisma.project.findFirst({                                                                                                                                  
        where: {                                                                                                                                                                        
          id: projectId,                                                                                                                                                                
          userId: user.id,                                                                                                                                                              
        },                                                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      if (!project) {                                                                                                                                                                   
        return c.json({ error: 'Project not found' }, 404);                                                                                                                             
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      // Delete project                                                                                                                                                                 
      await prisma.project.delete({                                                                                                                                                     
        where: { id: projectId },                                                                                                                                                       
      });                                                                                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Project deleted successfully',                                                                                                                                        
        projectId: projectId,                                                                                                                                                           
      });                                                                                                                                                                               
                                                                                                                                                                                        
    } catch (error) {                                                                                                                                                                   
      console.error('Delete project error:', error);                                                                                                                                    
      return c.json({ error: 'Failed to delete project' }, 500);                                                                                                                        
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  export { projects };                                                                                                                                                                  
