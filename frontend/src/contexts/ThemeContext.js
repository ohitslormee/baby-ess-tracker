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
    // Get theme from localStorage or default to baby-girl
    return localStorage.getItem('caelestis-theme') || 'baby-girl';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('caelestis-theme', theme);
    
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'baby-blue' ? 'baby-girl' : 'baby-blue');
  };

  const getThemeColors = () => {
    if (theme === 'baby-girl') {
      return {
        primary: 'from-pink-300 to-pink-400',
        primaryHover: 'from-pink-400 to-pink-500',
        primaryBg: 'bg-pink-400',
        primaryText: 'text-pink-600',
        primaryLight: 'bg-pink-50',
        primaryBorder: 'border-pink-200',
        accent: 'bg-pink-100 text-pink-800',
        card: 'bg-pink-50',
        button: 'bg-pink-400 hover:bg-pink-500',
        nav: 'from-pink-300 to-pink-400',
        navHex: '#FDD5DF'
      };
    }
    // Baby blue theme
    return {
      primary: 'from-blue-300 to-blue-400',
      primaryHover: 'from-blue-400 to-blue-500',
      primaryBg: 'bg-blue-400',
      primaryText: 'text-blue-600',
      primaryLight: 'bg-blue-50',
      primaryBorder: 'border-blue-200',
      accent: 'bg-blue-100 text-blue-800',
      card: 'bg-blue-50',
      button: 'bg-blue-400 hover:bg-blue-500',
      nav: 'from-blue-300 to-blue-400',
      navHex: '#89CFF0'
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