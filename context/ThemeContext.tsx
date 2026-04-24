import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  accent: string;
  input: string;
  tabBar: string;
  inactive: string;
}

const lightTheme: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  subtext: '#64748b',
  border: '#e2e8f0',
  primary: '#6366f1', // Electric Indigo
  accent: '#10b981', // Cyber Mint
  input: '#f1f5f9',
  tabBar: '#ffffff',
  inactive: '#94a3b8',
};

const darkTheme: ThemeColors = {
  background: '#020617',
  card: '#0f172a',
  text: '#f8fafc',
  subtext: '#94a3b8',
  border: '#1e293b',
  primary: '#818cf8', // Lighter Indigo for Dark
  accent: '#34d399', // Lighter Mint for Dark
  input: '#1e293b',
  tabBar: '#0f172a',
  inactive: '#64748b',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
