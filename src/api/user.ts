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

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  roles?: string[];
  gender?: string;
  phone?: string;
}

/**
 * 获取所有用户
 * @returns Promise
 */
export const getAllUsers = async () => {
  console.log('获取所有用户，直接请求后端');
  return await directAxios.get('/api/users');
};

/**
 * 获取所有教师
 * @returns Promise
 */
export const getAllTeachers = async () => {
  return await directAxios.get('/api/users/teachers');
};

/**
 * 获取所有班主任
 * @returns Promise
 */
export const getAllHeadTeachers = async () => {
  return await directAxios.get('/api/users/headteachers');
};

/**
 * 根据ID获取用户
 * @param id 用户ID
 * @returns Promise
 */
export const getUserById = async (id: number) => {
  return await directAxios.get(`/api/users/${id}`);
};

/**
 * 更新用户信息
 * @param id 用户ID
 * @param user 用户信息
 * @returns Promise
 */
export const updateUser = async (id: number, user: Partial<User>) => {
  return await directAxios.put(`/api/users/${id}`, user);
};

/**
 * 删除用户
 * @param id 用户ID
 * @returns Promise
 */
export const deleteUser = async (id: number) => {
  return await directAxios.delete(`/api/users/${id}`);
};

/**
 * 更新用户角色
 * @param id 用户ID
 * @param roles 角色列表
 * @returns Promise
 */
export const updateUserRoles = async (id: number, roles: string[]) => {
  return await directAxios.put(`/api/users/${id}/roles`, roles);
}; 