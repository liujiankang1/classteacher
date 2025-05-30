import axiosInstance from './axios';
import axios from 'axios';

// 创建一个专用于直接请求后端的axios实例
const directAxios = axios.create({
  baseURL: 'http://124.70.74.246:8081',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许跨域请求携带凭证
});

// 请求拦截器 - 添加认证令牌
directAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  name: string;
  gender?: string;
  role?: string;
}

interface ForgotPasswordData {
  email: string;
}

interface SendVerificationCodeData {
  email: string;
}

interface VerifyUsernameEmailData {
  username: string;
  email: string;
}

interface ResetPasswordWithCodeData {
  username: string;
  email: string;
  code: string;
  newPassword: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    gender?: string;
    phone?: string;
  };
}

// 后端返回的登录响应格式
interface LoginResponse {
  token?: string;
  type?: string;
  id: number;
  username: string;
  name: string;
  email: string;
  gender: string;
  phone: string;
  roles: string[];
}

/**
 * 用户登录
 * @param data 登录数据
 * @returns Promise
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('开始登录请求:', data.username);
    // 直接请求后端API
    const response = await directAxios.post('/api/auth/signin', data);
    console.log('登录原始响应:', response);
    
    // 从响应中提取数据
    const responseData = response.data;
    
    // 创建一个临时token，如果后端没有返回token
    // 在生产环境中，这种情况应该让用户重新登录，但为了开发测试，我们暂时使用一个假token
    const tempToken = 'temp_token_' + Math.random().toString(36).substring(2);
    
    // 构建统一的响应格式
    const authResponse: AuthResponse = {
      token: responseData.token || tempToken, // 使用后端返回的token或临时token
      user: {
        id: responseData.id,
        username: responseData.username,
        name: responseData.name || responseData.username,
        email: responseData.email || '',
        role: Array.isArray(responseData.roles) && responseData.roles.length > 0 
              ? responseData.roles[0] 
              : 'ROLE_USER',
        gender: responseData.gender,
        phone: responseData.phone
      }
    };
    
    console.log('处理后的认证响应:', authResponse);
    return authResponse;
  } catch (error) {
    console.error('登录请求失败:', error);
    throw error;
  }
};

/**
 * 用户注册
 * @param data 注册数据
 * @returns Promise
 */
export const register = async (data: RegisterData) => {
  try {
    // 进行注册
    const response = await directAxios.post('/api/auth/signup', data);
    console.log('注册成功响应:', response.data);
    return response;
  } catch (error) {
    // 捕获并重新抛出错误，以便在组件中处理
    console.error('注册失败:', error);
    throw error;
  }
};

/**
 * 忘记密码
 * @param data 包含邮箱的数据
 * @returns Promise
 */
export const forgotPassword = async (data: ForgotPasswordData) => {
  return await directAxios.post('/api/auth/forgot-password', data);
};

/**
 * 发送邮箱验证码
 * @param data 包含邮箱的数据
 * @returns Promise
 */
export const sendVerificationCode = async (data: SendVerificationCodeData) => {
  return await directAxios.post('/api/auth/send-verification-code', data);
};

/**
 * 通过验证码重置密码
 * @param data 包含用户名、邮箱、验证码和新密码的数据
 * @returns Promise
 */
export const resetPasswordWithCode = async (data: ResetPasswordWithCodeData) => {
  console.log('开始重置密码请求:', { 
    username: data.username, 
    email: data.email, 
    code: data.code, 
    newPassword: '***' 
  });
  
  try {
    // 使用directAxios直接请求后端
    const response = await directAxios.post('/api/auth/reset-password-with-code', data);
    console.log('重置密码成功响应:', response.data);
    return response;
  } catch (error: any) {
    console.error('重置密码失败:', error);
    
    if (error.response) {
      console.error('错误响应数据:', error.response.data);
      console.error('错误状态码:', error.response.status);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
    } else {
      console.error('请求设置时出错:', error.message);
    }
    
    throw error;
  }
};

/**
 * 验证重置密码令牌
 * @param token 重置密码令牌
 * @returns Promise
 */
export const validateResetToken = async (token: string) => {
  return await directAxios.get(`/api/auth/reset-password/validate?token=${token}`);
};

/**
 * 重置密码
 * @param data 包含token和新密码的数据
 * @returns Promise
 */
export const resetPassword = async (data: ResetPasswordData) => {
  return await directAxios.post('/api/auth/reset-password', data);
};

/**
 * 获取当前用户信息
 * @returns Promise
 */
export const getCurrentUser = async () => {
  return await directAxios.get('/api/auth/me');
};

/**
 * 退出登录
 * @returns Promise
 */
export const logout = async () => {
  console.log('执行API退出登录');
  try {
    // 尝试调用后端登出接口
    try {
      console.log('开始调用后端登出接口: /api/auth/signout');
      const response = await directAxios.post('/api/auth/signout');
      console.log('后端登出接口调用成功:', response.data);
    } catch (e) {
      console.error('后端登出接口调用失败:', e);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('退出登录错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 更新用户资料
 * @param data 用户资料数据
 * @returns Promise
 */
export const updateProfile = async (data: any) => {
  // 确保从当前登录用户获取ID
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id || data.id;
  
  // 构建请求体，确保包含gender字段
  const requestData = {
    ...data,
    id: userId,
  };
  
  console.log('更新用户资料请求数据:', requestData);
  
  return await directAxios.put(`/api/users/${userId}`, requestData);
};

/**
 * 更改密码
 * @param data 包含当前密码和新密码的数据
 * @returns Promise
 */
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  console.log('开始更改密码请求');
  try {
    const response = await directAxios.post('/api/auth/change-password', data);
    console.log('更改密码成功响应:', response.data);
    return response;
  } catch (error) {
    console.error('更改密码失败:', error);
    throw error;
  }
};

/**
 * 验证用户名和邮箱是否匹配
 * @param data 包含用户名和邮箱的数据
 * @returns Promise
 */
export const verifyUsernameEmail = async (data: VerifyUsernameEmailData) => {
  try {
    const response = await directAxios.post('/api/auth/verify-username-email', data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('验证用户名和邮箱失败:', error);
    return { success: false, error };
  }
};