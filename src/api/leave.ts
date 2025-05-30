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
 * 获取请假列表
 * @param params 筛选参数
 * @returns Promise
 */
export const getLeaves = async (params: any) => {
  console.log('获取请假列表，直接请求后端');
  return await directAxios.get('/api/leaves', { params });
};

/**
 * 获取请假详情
 * @param id 请假ID
 * @returns Promise
 */
export const getLeaveById = async (id: number) => {
  return await directAxios.get(`/api/leaves/${id}`);
};

/**
 * 创建请假
 * @param leaveData 请假数据
 * @returns Promise
 */
export const createLeave = async (leaveData: any) => {
  return await directAxios.post('/api/leaves', leaveData);
};

/**
 * 更新请假
 * @param id 请假ID
 * @param leaveData 请假数据
 * @returns Promise
 */
export const updateLeave = async (id: number, leaveData: any) => {
  return await directAxios.put(`/api/leaves/${id}`, leaveData);
};

/**
 * 删除请假
 * @param id 请假ID
 * @returns Promise
 */
export const deleteLeave = async (id: number) => {
  return await directAxios.delete(`/api/leaves/${id}`);
};

/**
 * 批准请假
 * @param id 请假ID
 * @param approverId 审批人ID
 * @returns Promise
 */
export const approveLeave = async (id: number, approverId: number) => {
  return await directAxios.put(`/api/leaves/${id}/approve`, null, { params: { approverId } });
};

/**
 * 拒绝请假
 * @param id 请假ID
 * @param approverId 审批人ID
 * @returns Promise
 */
export const rejectLeave = async (id: number, approverId: number) => {
  return await directAxios.put(`/api/leaves/${id}/reject`, null, { params: { approverId } });
};

/**
 * 请假服务API封装
 */
const LeaveService = {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave
};

export default LeaveService; 