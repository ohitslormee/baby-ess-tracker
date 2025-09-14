import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to baby-blue
    return localStorage.getItem('caelestis-theme') || 'baby-blue';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('caelestis-theme', theme);
    
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'baby-blue' ? 'baby-pink' : 'baby-blue');
  };

  const getThemeColors = () => {
    if (theme === 'baby-pink') {
      return {
        primary: 'from-pink-400 to-rose-500',
        primaryHover: 'from-pink-500 to-rose-600',
        primaryBg: 'bg-pink-500',
        primaryText: 'text-pink-600',
        primaryLight: 'bg-pink-50',
        primaryBorder: 'border-pink-200',
        accent: 'bg-pink-100 text-pink-800',
        card: 'bg-pink-50',
        button: 'bg-pink-500 hover:bg-pink-600',
        nav: 'from-pink-500 to-rose-500'
      };
    }
    // Default baby-blue theme
    return {
      primary: 'from-blue-400 to-cyan-500',
      primaryHover: 'from-blue-500 to-cyan-600',
      primaryBg: 'bg-blue-500',
      primaryText: 'text-blue-600',
      primaryLight: 'bg-blue-50',
      primaryBorder: 'border-blue-200',
      accent: 'bg-blue-100 text-blue-800',
      card: 'bg-blue-50',
      button: 'bg-blue-500 hover:bg-blue-600',
      nav: 'from-blue-500 to-cyan-500'
    };
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    getThemeColors,
    colors: getThemeColors()
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};