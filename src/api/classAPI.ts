import axiosInstance from './axios';
import axios from 'axios';

// 创建一个专用于直接请求后端的axios实例
const directAxios = axios.create({
  baseURL: 'http://124.70.74.246:8081',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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

const API_URL = `/api/classes`;

// 获取所有班级
export const getAllClasses = async () => {
  console.log('获取所有班级，直接请求后端');
  return directAxios.get(API_URL);
}; 