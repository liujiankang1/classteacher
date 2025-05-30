import axios from './axios';
import { Subject, SubjectResponse, ApiError } from '../types/subject';

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

// 获取所有科目（不分页）
export const getAllSubjects = async () => {
  console.log('获取所有科目，直接请求后端');
  return directAxios.get<Subject[]>(`/api/subjects`);
};

// 获取分页科目列表
export const getSubjectsPaged = async (page: number, size: number) => {
  return directAxios.get<SubjectResponse>(`/api/subjects/paged`, {
    params: {
      page,
      size,
      sortBy: 'id',
      direction: 'asc'
    }
  });
};

// 创建科目
export const createSubject = async (subject: Omit<Subject, 'id'>) => {
  return directAxios.post<Subject>(`/api/subjects`, subject);
};

// 更新科目
export const updateSubject = async (id: string | number, subject: Subject) => {
  return directAxios.put<Subject>(`/api/subjects/${id}`, subject);
};

// 删除科目
export const deleteSubject = async (id: string | number) => {
  return directAxios.delete(`/api/subjects/${id}`);
}; 