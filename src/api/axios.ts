import axios from 'axios';

// 不设置baseURL，使用相对路径以便代理可以正常工作
const axiosInstance = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // 确保所有请求URL都有正确的前缀
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    // 添加详细请求日志
    console.log(`发送请求: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`请求头:`, config.headers);
    if (config.data) {
      console.log(`请求数据:`, typeof config.data === 'object' ? { ...config.data, password: config.data.password ? '***' : undefined, newPassword: config.data.newPassword ? '***' : undefined } : config.data);
    }
    
    // 添加认证头
    if (token) {
      console.log('添加认证头: Bearer Token');
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
axiosInstance.interceptors.response.use(
  (response) => {
    // 添加响应日志
    console.log(`响应: ${response.status} ${response.config.url}`);
    console.log('响应数据:', response.data);
    
    // 返回完整的响应对象
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' && error.message && error.message.includes('timeout')) {
      console.error('请求超时:', error.config.url);
      // 可以在这里添加重试逻辑
    } 
    else if (error.response) {
      console.error('响应错误:', error.response.status, error.response.data);
      
      // 处理401未授权错误或403权限不足错误
      if ((error.response.status === 401 || error.response.status === 403)) {
        // 检查是否是修改密码的请求
        const isChangePasswordRequest = error.config.url && 
          (error.config.url.includes('/auth/change-password') || 
           error.config.url.includes('/api/auth/change-password') ||
           error.config.url.includes('/auth/reset-password-with-code') ||
           error.config.url.includes('/api/auth/reset-password-with-code'));
        
        if (isChangePasswordRequest) {
          console.log('密码相关请求失败，但不重定向');
          // 对于密码相关的请求，不进行重定向，让组件自己处理错误
          return Promise.reject(error);
        }
        
        console.error('认证错误:', error.response.data);
        
        // 清除令牌并重定向到登录页面
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 避免在登录页面再次触发重定向
        if (!window.location.pathname.includes('/login')) {
          // 跳转到登录页
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
      }
    } 
    else {
      console.error('网络错误:', error.message);
    }
    
    // 处理其他错误
    return Promise.reject(error);
  }
);

export default axiosInstance; 