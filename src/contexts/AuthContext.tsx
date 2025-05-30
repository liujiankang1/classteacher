import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';

// 定义用户类型
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  classId?: number;
  gender?: string;
  phone?: string;
}

// 定义认证上下文类型
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  clearError: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化 - 从本地存储加载用户信息和令牌
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        // 验证token是否有效
        if (storedToken && storedToken !== 'undefined' && storedToken !== 'null' && storedUser) {
          try {
            // 尝试解析用户信息
            const userObj = JSON.parse(storedUser);
            if (userObj && userObj.id) {
              setToken(storedToken);
              setUser(userObj);
            } else {
              // 用户信息无效，清除存储
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // 尝试自动登录
              tryAutoLogin();
            }
          } catch (e) {
            // JSON解析错误，清除存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 尝试自动登录
            tryAutoLogin();
          }
        } else {
          // token无效，清除存储
          if (storedToken === 'undefined' || storedToken === 'null') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          // 尝试自动登录
          tryAutoLogin();
        }
      } catch (err) {
        console.error('加载用户信息失败:', err);
        // 清除可能损坏的数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // 尝试自动登录
  const tryAutoLogin = async () => {
    // 获取当前路径
    const currentPath = window.location.pathname;
    
    // 检查是否在登录、注册或其他不需要自动登录的页面
    const skipAutoLoginPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const shouldSkipAutoLogin = skipAutoLoginPaths.some(path => 
      currentPath === path || currentPath === path + '/'
    );
    
    if (shouldSkipAutoLogin) {
      console.log('当前在登录/注册页面，跳过自动登录');
      setLoading(false);
      return;
    }
    
    // 不再支持记住密码自动登录
    console.log('不支持自动登录，需要手动登录');
    setLoading(false);
  };

  // 登录处理函数
  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始登录流程:', username);
      const response = await apiLogin({ username, password });
      console.log('登录API返回:', { 
        hasToken: !!response.token, 
        tokenLength: response.token ? response.token.length : 0,
        userId: response.user.id,
        role: response.user.role,
        gender: response.user.gender,  // 打印性别信息
        phone: response.user.phone  // 打印手机号信息
      });
      
      // 确保token有效
      if (!response.token || response.token === 'undefined' || response.token === 'null') {
        console.error('登录失败: 获取到的认证令牌无效');
        throw new Error('获取到的认证令牌无效');
      }
      
      // 保存令牌和用户信息到本地存储
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // 更新状态
      setToken(response.token);
      setUser(response.user);
      
      console.log('登录成功，令牌和用户信息已保存');
      
      // 设置登录成功标志，页面会自动重定向
      return Promise.resolve();
    } catch (err: any) {
      console.error('登录失败详情:', err);
      setError(err.response?.data?.message || err.message || '登录失败，请检查用户名和密码');
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  };

  // 注册处理函数
  const handleRegister = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRegister(userData);
      console.log('注册成功:', response.data);
      
      // 注册成功，但不自动登录
      return Promise.resolve(response);
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.response?.data?.message || '注册失败，请稍后重试');
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录处理函数
  const handleLogout = async () => {
    console.log('执行退出登录');
    
    try {
      // 调用登出API
      await apiLogout();
      console.log('登出API调用成功');
    } catch (error) {
      console.error('登出API调用失败:', error);
    } finally {
      // 清除状态，避免页面刷新时还能获取到有效状态
      setToken(null);
      setUser(null);
      
      // 立即清除本地存储的认证数据
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 清除记住密码相关的存储
      localStorage.removeItem('rememberedUsername');
      localStorage.removeItem('rememberedPassword');
      
      console.log('退出登录完成，等待组件重定向');
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 提供的上下文值
  const contextValue = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 