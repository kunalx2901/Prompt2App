import { Hono } from 'hono';                                                                                                                                                          
  import { clerkAuth } from '../middleware/clerkAuth';                                                                                                                                  
                                                                                                                                                                                        
  const protectedRoutes = new Hono();                                                                                                                                                   
                                                                                                                                                                                        
  // Apply auth middleware to all routes in this file                                                                                                                                   
  protectedRoutes.use('*', clerkAuth);                                                                                                                                                  
                                                                                                                                                                                        
  // Get current user profile                                                                                                                                                           
  protectedRoutes.get('/me', (c) => {                                                                                                                                                   
    const user = c.get('user');                                                                                                                                                         
    return c.json({                                                                                                                                                                     
      success: true,                                                                                                                                                                    
      user,                                                                                                                                                                             
    });                                                                                                                                                                                 
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Create a project (protected)                                                                                                                                                       
  protectedRoutes.post('/projects', async (c) => {                                                                                                                                      
    const user = c.get('user');                                                                                                                                                         
    const body = await c.req.json();                                                                                                                                                    
                                                                                                                                                                                        
    // Now you have user.id, user.email, etc.                                                                                                                                           
    // Create project in database with user.id                                                                                                                                          
                                                                                                                                                                                        
    return c.json({                                                                                                                                                                     
      success: true,                                                                                                                                                                    
      message: 'Project created',                                                                                                                                                       
      userId: user.id,                                                                                                                                                                  
    });                                                                                                                                                                                 
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  export { protectedRoutes };                                                                                                                                                           