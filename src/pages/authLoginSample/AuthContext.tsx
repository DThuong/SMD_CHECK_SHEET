
// import { useState, createContext, useContext } from 'react';
// import type { ReactNode } from 'react'; 

// type UserRole = 'PQC' | 'ENG' | 'SUPERVISOR' | 'MANAGER' | 'MANAGER_KOREA';

// interface User {
//   username: string;
//   password: string;
//   phone: string;
//   email: string;
//   address: string;
//   role: UserRole;
//   fullName: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (username: string, password: string) => boolean;
//   logout: () => void;
// }

// //SAMPLE DATA USER ACCOUNT
// const USERS: User[] = [
//   { username: 'pqc1', password: '123', role: 'PQC', fullName: 'Nguyễn Văn A', phone: '0123456789', email: 'nguyenvana@company.com', address: '123 Main St, Anytown, USA' },
//   { username: 'pqc2', password: '123', role: 'PQC', fullName: 'Trần Văn B', phone: '0123456789', email: 'tranvanb@company.com', address: '123 Main St, Anytown, USA' },
//   { username: 'eng1', password: '123', role: 'ENG', fullName: 'Lê Văn B', phone: '0987654321', email: 'levanb@company.com', address: '456 Elm St, Anytown, USA' },
//   { username: 'sup1', password: '123', role: 'SUPERVISOR', fullName: 'Trần Văn C', phone: '0123456789', email: 'tranhic@company.com', address: '789 Oak St, Anytown, USA' },
//   { username: 'mgr1', password: '123', role: 'MANAGER', fullName: 'Phạm Văn D', phone: '0987654321', email: 'phamvan@company.com', address: '321 Pine St, Anytown, USA' },
//   { username: 'kmgr1', password: '123', role: 'MANAGER_KOREA', fullName: 'Sếp LEE', phone: '0123456789', email: 'kimminjun@company.com', address: '654 Maple St, Anytown, USA' },
// ];

// // TẠO AUTH CONTEXT
// const AuthContext = createContext<AuthContextType | null>(null);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
//   return context;
// };

// const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);

//   // Hàm login: Check username/password
//   const login = (username: string, password: string): boolean => {
//     const foundUser = USERS.find(
//       u => u.username === username && u.password === password
//     );
    
//     if (foundUser) {
//       setUser(foundUser);
//       return true; // Đăng nhập thành công
//     }
    
//     return false; // Đăng nhập thất bại
//   };

//   // Hàm logout
//   const logout = () => {
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;