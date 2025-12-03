
import React, { useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react'; 

type UserRole = 'PQC' | 'ENG' | 'SUPERVISOR' | 'MANAGER' | 'MANAGER_KOREA';

interface User {
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

//SAMPLE DATA USER ACCOUNT
const USERS: User[] = [
  { username: 'pqc1', password: '123456', role: 'PQC', fullName: 'Nguyễn Văn A' },
  { username: 'eng1', password: '123456', role: 'ENG', fullName: 'Lê Văn B' },
  { username: 'sup1', password: '123456', role: 'SUPERVISOR', fullName: 'Trần Văn C' },
  { username: 'mgr1', password: '123456', role: 'MANAGER', fullName: 'Phạm Văn D' },
  { username: 'kmgr1', password: '123456', role: 'MANAGER_KOREA', fullName: 'Kim Min-Jun' }
];

// TẠO AUTH CONTEXT
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
  return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Hàm login: Check username/password
  const login = (username: string, password: string): boolean => {
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      setUser(foundUser);
      return true; // Đăng nhập thành công
    }
    
    return false; // Đăng nhập thất bại
  };

  // Hàm logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;