import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: number;
  createdAt: any;
  role: 'superadmin' | 'contentadmin' | 'trainer' | 'student' | 'centeradmin';
  center?: any;
  studentDetails?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set up axios defaults
axios.defaults.baseURL = '/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // ✅ Restore user from localStorage
    }
  }
  setLoading(false); // ✅ Always stop loading
}, []);




const login = async (email: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:7071/api/loginUser', { email, password });

    const { accessToken, refreshToken, user } = response.data;

    setToken(accessToken);
    setUser(user);

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    toast.success('Login successful!');
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed';
    toast.error(message);
    throw error;
  }
};



  const register = async (userData: any) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};