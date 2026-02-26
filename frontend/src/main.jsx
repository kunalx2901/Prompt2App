  import { ClerkProvider } from '@clerk/clerk-react';                                                                                                                                   
                                                                                                                                                                                        
  const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;                                                                                                             
                                                                                                                                                                                        
  ReactDOM.createRoot(document.getElementById('root')).render(                                                                                                                          
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>                                                                                                                              
      <App />                                                                                                                                                                           
    </ClerkProvider>                                                                                                                                                                    
  ); 