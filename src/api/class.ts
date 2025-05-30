import axiosInstance from './axios';
import axios from 'axios';

interface ClassInfo {
  id?: number;
  name: string;
  className?: string;
  grade: string;
  headTeacher?: any;
  studentCount?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
 * 获取所有班级
 * @returns Promise
 */
export const getAllClasses = async () => {
  try {
    console.log('开始获取所有班级数据');
    
    // 检查认证令牌
    const token = localStorage.getItem('token');
    console.log('当前认证令牌:', token ? '有效' : '无效或不存在');

    // 直接请求后端
    console.log('直接请求后端 http://124.70.74.246:8081/api/classes');
    const response = await directAxios.get('/api/classes');
    console.log('获取班级成功:', response);
    return response;
  } catch (error: any) {
    console.error('获取所有班级失败:', error);
    console.error('错误详情:', error.response ? {
      状态码: error.response.status,
      数据: error.response.data,
      请求头: error.response.headers
    } : '无响应详情');
    
    // 如果是认证错误，提示用户
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('认证失败，请确保已登录并有权限访问班级信息');
    }
    
    throw error; // 将错误抛出，由调用方处理
  }
};

/**
 * 根据ID获取班级
 * @param id 班级ID
 * @returns Promise
 */
export const getClassById = async (id: number) => {
  try {
    return await directAxios.get(`/api/classes/${id}`);
  } catch (error) {
    console.error(`获取班级ID=${id}失败:`, error);
    throw error;
  }
};

/**
 * 搜索班级
 * @param query 搜索关键词
 * @returns Promise
 */
export const searchClasses = async (query: string) => {
  try {
    return await directAxios.get(`/api/classes/search?query=${query}`);
  } catch (error) {
    console.error(`搜索班级"${query}"失败:`, error);
    throw error;
  }
};

/**
 * 根据班主任ID获取班级
 * @param teacherId 班主任ID
 * @returns Promise
 */
export const getClassesByTeacher = async (teacherId: number) => {
  try {
    return await directAxios.get(`/api/classes/teacher/${teacherId}`);
  } catch (error) {
    console.error(`获取班主任ID=${teacherId}的班级失败:`, error);
    throw error;
  }
};

/**
 * 创建班级
 * @param classInfo 班级信息
 * @returns Promise
 */
export const createClass = async (classInfo: ClassInfo) => {
  try {
    return await directAxios.post('/api/classes', classInfo);
  } catch (error) {
    console.error('创建班级失败:', error);
    throw error;
  }
};

/**
 * 更新班级信息
 * @param id 班级ID
 * @param classInfo 班级信息
 * @returns Promise
 */
export const updateClass = async (id: number, classInfo: ClassInfo) => {
  try {
    return await directAxios.put(`/api/classes/${id}`, classInfo);
  } catch (error) {
    console.error(`更新班级ID=${id}失败:`, error);
    throw error;
  }
};

/**
 * 删除班级
 * @param id 班级ID
 * @returns Promise
 */
export const deleteClass = async (id: number) => {
  try {
    return await directAxios.delete(`/api/classes/${id}`);
  } catch (error) {
    console.error(`删除班级ID=${id}失败:`, error);
    throw error;
  }
};

/**
 * 分配班主任
 * @param classId 班级ID
 * @param teacherId 班主任ID
 * @returns Promise
 */
export const assignHeadTeacher = async (classId: number, teacherId: number) => {
  try {
    return await directAxios.put(`/api/classes/${classId}/assign/${teacherId}`);
  } catch (error) {
    console.error(`为班级ID=${classId}分配班主任ID=${teacherId}失败:`, error);
    throw error;
  }
};

/**
 * 获取班级学生列表
 * @param classId 班级ID
 * @returns Promise
 */
export const getClassStudents = async (classId: string | number) => {
  try {
    console.log(`开始获取班级ID=${classId}的学生列表`);
    return await directAxios.get(`/api/classes/${classId}/students`);
  } catch (error) {
    console.error(`获取班级ID=${classId}的学生列表失败:`, error);
    throw error;
  }
};

/**
 * 获取班级学生下拉选项
 * @param classId 班级ID
 * @returns Promise
 */
export const getStudentSelectOptions = async (classId: string | number) => {
  try {
    console.log(`开始获取班级ID=${classId}的学生下拉选项`);
    return await directAxios.get(`/api/students/class/${classId}/select`);
  } catch (error) {
    console.error(`获取班级ID=${classId}的学生下拉选项失败:`, error);
    throw error;
  }
}; 