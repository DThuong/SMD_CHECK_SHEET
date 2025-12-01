import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
// Định nghĩa types
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

// Tạo context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook để sử dụng theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Provider component
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Lấy theme từ localStorage hoặc mặc định là 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('admin-theme') as Theme;
    return savedTheme || 'light';
  });

  // Cập nhật class trên html element khi theme thay đổi
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove cả 2 class trước
    root.classList.remove('light', 'dark');
    
    // Thêm class theme hiện tại
    root.classList.add(theme);
    
    // Lưu vào localStorage
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};