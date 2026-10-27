import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { loginUser } from '../api';

interface AuthContextType {
  user: User;
  role: Role;
  switchRole: (role: Role) => Promise<void>;
  loading: boolean;
}

const DEFAULT_USERS: Record<Role, User> = {
  reviewer: {
    id: 'usr-reviewer-1',
    name: 'Smt. Anita Deshmukh',
    email: 'reviewer@aicte.gov.in',
    role: 'reviewer',
    designation: 'Senior AICTE Evaluation Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  applicant: {
    id: 'usr-applicant-1',
    name: 'Dr. Rajesh Sharma',
    email: 'applicant@demo.aicte.gov.in',
    role: 'applicant',
    institution_id: 'INST-MH-2024-001',
    institution_name: 'Apex Institute of Technology & Research',
    current_pid: '1-348911029',
    designation: 'Registrar & Head of Compliance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Dr. Vikramaditya Sen',
    email: 'admin@aicte.gov.in',
    role: 'admin',
    designation: 'Chief Regulatory Administrator (AICTE HQ)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('aurexa_role') as Role) || 'reviewer';
  });
  const [user, setUser] = useState<User>(DEFAULT_USERS[role]);
  const [loading, setLoading] = useState<boolean>(false);

  const switchRole = async (newRole: Role) => {
    setLoading(true);
    try {
      const res = await loginUser({ role: newRole });
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(DEFAULT_USERS[newRole]);
      }
      setRole(newRole);
      localStorage.setItem('aurexa_role', newRole);
    } catch (err) {
      console.warn('Fallback to local default role user:', err);
      setUser(DEFAULT_USERS[newRole]);
      setRole(newRole);
      localStorage.setItem('aurexa_role', newRole);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    switchRole(role);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
