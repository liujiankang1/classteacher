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

interface Student {
  id?: number;
  name: string;
  studentNumber: string;
  gender: string;
  birthday?: string;
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  notes?: string;
  classInfo?: any;
  classId?: number;
  className?: string;
}

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
  message?: string;
}

/**
 * 获取所有学生
 * @returns Promise
 */
export const getAllStudents = async () => {
  return await directAxios.get('/api/students');
};

/**
 * 分页获取所有学生
 * @param page 页码
 * @param size 每页大小
 * @returns Promise
 */
export const getAllStudentsPaged = async (page: number = 0, size: number = 10) => {
  console.log('开始获取学生分页数据，直接请求后端');
  return await directAxios.get(`/api/students/paged?page=${page}&size=${size}`);
};

/**
 * 根据班级ID获取学生
 * @param classId 班级ID
 * @returns Promise
 */
export const getStudentsByClass = async (classId: number) => {
  return await directAxios.get(`/api/students/class/${classId}`);
};

/**
 * 分页获取班级学生
 * @param classId 班级ID
 * @param page 页码
 * @param size 每页大小
 * @returns Promise
 */
export const getStudentsByClassPaged = async (classId: number, page: number = 0, size: number = 10) => {
  return await directAxios.get(`/api/students/class/${classId}/paged?page=${page}&size=${size}`);
};

/**
 * 根据姓名搜索学生
 * @param name 学生姓名
 * @returns Promise
 */
export const searchStudents = async (name: string) => {
  return await directAxios.get(`/api/students/search?name=${name}`);
};

/**
 * 分页搜索学生
 * @param name 学生姓名
 * @param page 页码
 * @param size 每页大小
 * @returns Promise
 */
export const searchStudentsPaged = async (name: string, page: number = 0, size: number = 10) => {
  return await directAxios.get(`/api/students/search/paged?name=${name}&page=${page}&size=${size}`);
};

/**
 * 根据ID获取学生
 * @param id 学生ID
 * @returns Promise
 */
export const getStudentById = async (id: number) => {
  return await directAxios.get(`/api/students/${id}`);
};

/**
 * 根据学号获取学生
 * @param studentNumber 学号
 * @returns Promise
 */
export const getStudentByNumber = async (studentNumber: string) => {
  return await directAxios.get(`/api/students/number/${studentNumber}`);
};

/**
 * 创建学生
 * @param student 学生信息
 * @returns Promise
 */
export const createStudent = async (student: Student) => {
  return await directAxios.post('/api/students', student);
};

/**
 * 更新学生信息
 * @param id 学生ID
 * @param student 学生信息
 * @returns Promise
 */
export const updateStudent = async (id: number, student: Student) => {
  return await directAxios.put(`/api/students/${id}`, student);
};

/**
 * 删除学生
 * @param id 学生ID
 * @returns Promise
 */
export const deleteStudent = async (id: number) => {
  return await directAxios.delete(`/api/students/${id}`);
};

/**
 * 分配学生到班级
 * @param studentId 学生ID
 * @param classId 班级ID
 * @returns Promise
 */
export const assignStudentToClass = async (studentId: number, classId: number) => {
  return await directAxios.put(`/api/students/${studentId}/assign/${classId}`);
};

/**
 * 批量导入学生
 * @param formData 包含文件和班级ID的表单数据
 * @returns Promise
 */
export const batchImportStudents = async (formData: FormData) => {
  return await directAxios.post('/api/students/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}; 