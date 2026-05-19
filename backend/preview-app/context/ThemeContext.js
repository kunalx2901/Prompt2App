import React, { createContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    background: '#f5f5f5',
    cardBackground: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    tagBackground: '#e0e0e0',
    tagText: '#333333',
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
