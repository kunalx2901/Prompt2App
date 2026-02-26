 import { Hono } from 'hono';                                                                                                                                                          
  import { createClerkClient } from '@clerk/backend';                                                                                                                                   
  import type { Bindings } from '../types/bindings';                                                                                                                                    
                                                                                                                                                                                        
  const clerkTest = new Hono<{ Bindings: Bindings }>();                                                                                                                                 
                                                                                                                                                                                        
  // Test if Clerk connection works                                                                                                                                                     
  clerkTest.get('/test', async (c) => {                                                                                                                                                 
    try {                                                                                                                                                                               
      const clerkClient = createClerkClient({                                                                                                                                           
        secretKey: c.env.CLERK_SECRET_KEY,                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      const response = await clerkClient.users.getUserList({ limit: 1 });                                                                                                               
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Clerk is connected!',                                                                                                                                                 
        userCount: response.totalCount || 0,                                                                                                                                            
      });                                                                                                                                                                               
    } catch (error) {                                                                                                                                                                   
      return c.json({                                                                                                                                                                   
        success: false,                                                                                                                                                                 
        error: error instanceof Error ? error.message : 'Unknown error',                                                                                                                
      }, 500);                                                                                                                                                                          
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // Mock authenticated request (for testing without frontend)                                                                                                                          
  clerkTest.post('/mock-auth', async (c) => {                                                                                                                                           
    const { userId } = await c.req.json();                                                                                                                                              
                                                                                                                                                                                        
    if (!userId) {                                                                                                                                                                      
      return c.json({ error: 'userId required' }, 400);                                                                                                                                 
    }                                                                                                                                                                                   
                                                                                                                                                                                        
    try {                                                                                                                                                                               
      const clerkClient = createClerkClient({                                                                                                                                           
        secretKey: c.env.CLERK_SECRET_KEY,                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      // Get user details                                                                                                                                                               
      const user = await clerkClient.users.getUser(userId);                                                                                                                             
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        message: 'Auth would succeed with this user',                                                                                                                                   
        user: {                                                                                                                                                                         
          id: user.id,                                                                                                                                                                  
          email: user.emailAddresses[0]?.emailAddress,                                                                                                                                  
          firstName: user.firstName,                                                                                                                                                    
          lastName: user.lastName,                                                                                                                                                      
        },                                                                                                                                                                              
      });                                                                                                                                                                               
    } catch (error) {                                                                                                                                                                   
      return c.json({                                                                                                                                                                   
        error: error instanceof Error ? error.message : 'Unknown',                                                                                                                      
      }, 500);                                                                                                                                                                          
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  // List users                                                                                                                                                                         
  clerkTest.get('/users', async (c) => {                                                                                                                                                
    try {                                                                                                                                                                               
      const clerkClient = createClerkClient({                                                                                                                                           
        secretKey: c.env.CLERK_SECRET_KEY,                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      const response = await clerkClient.users.getUserList();                                                                                                                           
      const users = response.data || response;                                                                                                                                          
                                                                                                                                                                                        
      return c.json({                                                                                                                                                                   
        success: true,                                                                                                                                                                  
        users: Array.isArray(users) ? users.map(u => ({                                                                                                                                 
          id: u.id,                                                                                                                                                                     
          email: u.emailAddresses[0]?.emailAddress,                                                                                                                                     
          firstName: u.firstName,                                                                                                                                                       
          lastName: u.lastName,                                                                                                                                                         
        })) : [],                                                                                                                                                                       
      });                                                                                                                                                                               
    } catch (error) {                                                                                                                                                                   
      return c.json({                                                                                                                                                                   
        error: error instanceof Error ? error.message : 'Unknown'                                                                                                                       
      }, 500);                                                                                                                                                                          
    }                                                                                                                                                                                   
  });                                                                                                                                                                                   
                                                                                                                                                                                        
  export { clerkTest };  