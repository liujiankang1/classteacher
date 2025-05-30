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

interface DashboardStats {
  teacherCount: number;
  studentCount: number;
  classCount: number;
  recentLeaves?: any[];
  classDistribution?: any[];
  genderDistribution?: any;
  attendanceRate?: number;
}

interface TeacherScheduleResponse {
  scheduleData: string;
}

/**
 * 获取仪表盘统计数据
 * @returns Promise
 */
export const getDashboardStats = async (): Promise<{data: DashboardStats}> => {
  console.log('获取仪表盘统计数据，直接请求后端');
  return await directAxios.get('/api/dashboard/statistics');
};

/**
 * 获取班级学生分布
 * @returns Promise
 */
export const getClassDistribution = async () => {
  return await directAxios.get('/api/dashboard/class-distribution');
};

/**
 * 获取性别分布
 * @returns Promise
 */
export const getGenderDistribution = async () => {
  return await directAxios.get('/api/dashboard/gender-distribution');
};

/**
 * 获取最近请假记录
 * @param limit 限制数量
 * @returns Promise
 */
export const getRecentLeaves = async (limit: number = 5) => {
  return await directAxios.get(`/api/dashboard/recent-leaves?limit=${limit}`);
};

/**
 * 获取教师课程表
 * @returns Promise
 */
export const getTeacherSchedule = async (): Promise<{data: TeacherScheduleResponse}> => {
  console.log('获取教师课程表，直接请求后端');
  return await directAxios.get('/api/dashboard/schedule');
};

/**
 * 保存教师课程表
 * @param scheduleData 课程表数据
 * @returns Promise
 */
export const saveTeacherSchedule = async (scheduleData: any) => {
  const jsonScheduleData = JSON.stringify(scheduleData);
  return await directAxios.post('/api/dashboard/schedule', { scheduleData: jsonScheduleData });
}; 