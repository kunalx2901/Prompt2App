import { createClerkClient } from '@clerk/backend';                                                                                                                                   
  import type { Context, Next } from 'hono';                                                                                                                                            
  import type { Bindings } from '../types/bindings';                                                                                                                                    
                                                                                                                                                                                        
  export async function clerkAuth(c: Context<{ Bindings: Bindings }>, next: Next) {                                                                                                     
    try {                                                                                                                                                                               
      const clerkClient = createClerkClient({                                                                                                                                           
        secretKey: c.env.CLERK_SECRET_KEY,                                                                                                                                              
      });                                                                                                                                                                               
                                                                                                                                                                                        
      // Get Authorization header                                                                                                                                                       
      const authHeader = c.req.header('Authorization');                                                                                                                                 
                                                                                                                                                                                        
      if (!authHeader) {                                                                                                                                                                
        return c.json({                                                                                                                                                                 
          error: 'Unauthorized - No Authorization header',                                                                                                                              
          hint: 'Add: Authorization: Bearer <token>'                                                                                                                                    
        }, 401);                                                                                                                                                                        
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      if (!authHeader.startsWith('Bearer ')) {                                                                                                                                          
        return c.json({                                                                                                                                                                 
          error: 'Unauthorized - Invalid Authorization format',                                                                                                                         
          hint: 'Should be: Bearer <token>'                                                                                                                                             
        }, 401);                                                                                                                                                                        
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      const token = authHeader.replace('Bearer ', '');                                                                                                                                  
                                                                                                                                                                                        
      // Verify the token using Clerk                                                                                                                                                   
      const verified = await clerkClient.verifyToken(token);                                                                                                                            
                                                                                                                                                                                        
      if (!verified || !verified.sub) {                                                                                                                                                 
        return c.json({ error: 'Unauthorized - Invalid token' }, 401);                                                                                                                  
      }                                                                                                                                                                                 
                                                                                                                                                                                        
      // Get user info                                                                                                                                                                  
      const user = await clerkClient.users.getUser(verified.sub);                                                                                                                       
                                                                                                                                                                                        
      // Attach user to context                                                                                                                                                         
      c.set('user', {                                                                                                                                                                   
        id: user.id,                                                                                                                                                                    
        email: user.emailAddresses[0]?.emailAddress || '',                                                                                                                              
        firstName: user.firstName || '',                                                                                                                                                
        lastName: user.lastName || '',                                                                                                                                                  
      });                                                                                                                                                                               
                                                                                                                                                                                        
      await next();                                                                                                                                                                     
    } catch (error) {                                                                                                                                                                   
      console.error('Clerk auth error:', error);                                                                                                                                        
      return c.json({                                                                                                                                                                   
        error: 'Unauthorized',                                                                                                                                                          
        details: error instanceof Error ? error.message : 'Unknown error'                                                                                                               
      }, 401);                                                                                                                                                                          
    }                                                                                                                                                                                   
  }                                                                                                                                                                                     

//   user_3ACN0mEGtmltxUT4bNuLQnbZBdW