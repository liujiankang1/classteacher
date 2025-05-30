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

const API_URL = `/api/statistics/leaves`;

// 获取请假统计概览数据
export const getLeaveStatistics = async (params: {
  classId?: string | null;
  leaveType?: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, leaveType, period, startDate, endDate } = params;
  
  let url = `${API_URL}?period=${period || 'MONTH'}`;
  
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  if (leaveType) {
    url += `&leaveType=${leaveType}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  return directAxios.get(url);
};

// 获取班级请假统计数据
export const getClassLeaveStatistics = async (params: {
  classId?: string | null;
  leaveType?: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, leaveType, period, startDate, endDate } = params;
  
  let url = `${API_URL}/classes?period=${period || 'MONTH'}`;
  
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  if (leaveType) {
    url += `&leaveType=${leaveType}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  return directAxios.get(url);
};

// 获取学生请假排名数据
export const getStudentLeaveRanking = async (params: {
  classId?: string | null;
  leaveType?: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) => {
  const { classId, leaveType, period, startDate, endDate, page = 0, size = 10 } = params;
  
  let url = `${API_URL}/students/ranking?period=${period || 'MONTH'}&page=${page}&size=${size}`;
  
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  if (leaveType) {
    url += `&leaveType=${leaveType}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  return directAxios.get(url);
};

// 获取请假趋势数据
export const getLeaveTrendData = async (params: {
  classId?: string | null;
  leaveType?: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, leaveType, period, startDate, endDate } = params;
  
  let url = `${API_URL}/trend?period=${period || 'MONTH'}`;
  
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  if (leaveType) {
    url += `&leaveType=${leaveType}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  return directAxios.get(url);
};

// 导出请假统计数据
export const exportLeaveStatistics = async (params: {
  classId?: string | null;
  leaveType?: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, leaveType, period, startDate, endDate } = params;
  
  let url = `${API_URL}/export?period=${period || 'MONTH'}`;
  
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  if (leaveType) {
    url += `&leaveType=${leaveType}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  return directAxios.get(url, { responseType: 'blob' });
};

// 获取学生请假记录
export const getStudentLeaves = async (
  studentId: string,
  page: number = 0,
  size: number = 10
) => {
  const url = `/api/leaves/student/${studentId}?page=${page}&size=${size}`;
  return directAxios.get(url);
}; 