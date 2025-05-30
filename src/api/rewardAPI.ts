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

// 添加/api前缀以适配后端context-path配置
const API_URL = `/api/rewards`;
const STATISTICS_API_URL = `/api/statistics/rewards`;

// 创建奖励记录
export const createReward = async (rewardData: any) => {
  return directAxios.post(API_URL, rewardData);
};

// 更新奖励记录
export const updateReward = async (id: string, rewardData: any) => {
  return directAxios.put(`${API_URL}/${id}`, rewardData);
};

// 删除奖励记录
export const deleteReward = async (id: string) => {
  return directAxios.delete(`${API_URL}/${id}`);
};

// 获取奖励记录详情
export const getRewardById = async (id: string) => {
  return directAxios.get(`${API_URL}/${id}`);
};

// 获取学生的奖励记录
export const getRewardsByStudentId = async (
  studentId: string,
  page: number = 0,
  size: number = 10
) => {
  return directAxios.get(`${API_URL}/student/${studentId}?page=${page}&size=${size}`);
};

// 获取班级的奖励记录
export const getRewardsByClassId = async (
  classId: string,
  page: number = 0,
  size: number = 10
) => {
  return directAxios.get(`${API_URL}/class/${classId}?page=${page}&size=${size}`);
};

// 获取班级奖励统计数据
export const getClassRewardStatistics = async (params: {
  classId: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, period, startDate, endDate } = params;
  
  let url = `${STATISTICS_API_URL}/classes`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}&endDate=${endDate}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  return directAxios.get(url);
};

// 获取学生奖励排名
export const getStudentRanking = async (params: {
  classId: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) => {
  const { classId, period, startDate, endDate, page = 0, size = 10 } = params;
  
  let url = `${STATISTICS_API_URL}/students/ranking`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}`);
    queryParams.push(`endDate=${endDate}`);
  }
  
  if (page !== undefined) {
    queryParams.push(`page=${page}`);
  }
  
  if (size !== undefined) {
    queryParams.push(`size=${size}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('请求学生排名URL:', url);
  console.log('排名请求参数详情:', {classId, period, startDate, endDate, page, size});
  return directAxios.get(url);
};

// 获取奖励原因分布
export const getReasonDistribution = async (classId: string) => {
  // 注意：后端可能没有对应的接口，需要确认是否存在
  return directAxios.get(`${STATISTICS_API_URL}/reason-distribution?classId=${classId}`);
};

// 获取奖励时间趋势
export const getTrendData = async (params: {
  classId: string;
  startDate: string;
  endDate: string;
  period?: string;
}) => {
  const { classId, startDate, endDate, period = 'MONTH' } = params;
  
  let url = `${STATISTICS_API_URL}/trend`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}`);
    queryParams.push(`endDate=${endDate}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('请求趋势数据URL:', url);
  console.log('趋势请求参数详情:', {classId, period, startDate, endDate});
  return directAxios.get(url);
};

// 使用统计控制器的API

// 获取奖励统计概览
export const getRewardStatistics = async (params: {
  classId: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, period, startDate, endDate } = params;
  
  let url = `${STATISTICS_API_URL}`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}`);
    queryParams.push(`endDate=${endDate}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('请求统计数据URL:', url);
  console.log('请求参数详情:', {classId, period, startDate, endDate});
  
  return directAxios.get(url);
};

// 获取小红花趋势数据
export const getRewardTrend = async (params: {
  classId: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, period, startDate, endDate } = params;
  
  // 使用正确的API路径 - 统一使用RewardStatisticsController的接口
  let url = `${STATISTICS_API_URL}/trend`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}`);
    queryParams.push(`endDate=${endDate}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('请求趋势数据URL:', url);
  console.log('趋势请求参数详情:', {classId, period, startDate, endDate});
  return directAxios.get(url);
};

// 导出小红花统计数据
export const exportRewardStatistics = async (params: {
  classId: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { classId, period, startDate, endDate } = params;
  
  // 使用RewardStatisticsController的导出接口
  let url = `${STATISTICS_API_URL}/export`;
  const queryParams: string[] = [];
  
  if (classId) {
    queryParams.push(`classId=${classId}`);
  }
  
  if (period) {
    queryParams.push(`period=${period}`);
  }
  
  if (startDate && endDate) {
    queryParams.push(`startDate=${startDate}`);
    queryParams.push(`endDate=${endDate}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('请求导出数据URL:', url);
  console.log('导出请求参数详情:', {classId, period, startDate, endDate});
  return directAxios.get(url, { responseType: 'blob' });
}; 