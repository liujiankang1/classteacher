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

/**
 * 获取请假统计数据
 * @param params 筛选参数
 * @returns Promise
 */
export const getLeaveStatistics = async (params: any) => {
  return await directAxios.get('/api/statistics/leaves', { params });
};

/**
 * 获取班级请假统计数据
 * @param params 筛选参数
 * @returns Promise
 */
export const getClassLeaveStatistics = async (params: any) => {
  return await directAxios.get('/api/statistics/leaves/classes', { params });
};

/**
 * 获取学生请假排名
 * @param params 筛选参数
 * @returns Promise
 */
export const getStudentLeaveRanking = async (params: any) => {
  return await directAxios.get('/api/statistics/leaves/students/ranking', { params });
};

/**
 * 获取请假趋势数据
 * @param params 筛选参数
 * @returns Promise
 */
export const getLeaveTrendData = async (params: any) => {
  return await directAxios.get('/api/statistics/leaves/trend', { params });
};

/**
 * 获取学生请假记录
 * @param studentId 学生ID
 * @param page 页码
 * @param size 每页大小
 * @returns Promise
 */
export const getStudentLeaves = async (studentId: number, page: number, size: number) => {
  return await directAxios.get(`/api/leaves/student/${studentId}`, { 
    params: { page, size } 
  });
};

/**
 * 导出请假统计数据
 * @param params 筛选参数
 * @returns Promise
 */
export const exportLeaveStatistics = async (params: any) => {
  return await directAxios.get('/api/statistics/leaves/export', { 
    params,
    responseType: 'blob'
  });
};

/**
 * 请假统计服务API封装
 */
const LeaveStatisticsService = {
  getLeaveStatistics,
  getClassLeaveStatistics,
  getStudentLeaveRanking,
  getLeaveTrendData,
  getStudentLeaves,
  exportLeaveStatistics
};

export default LeaveStatisticsService; 