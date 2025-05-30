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

// 获取学生个人考试成绩趋势
export const getStudentScoreTrend = async (
  studentId: number, 
  subjectId?: number, 
  examIds?: number[]
) => {
  const params: any = { studentId };
  if (subjectId) params.subjectId = subjectId;
  if (examIds && examIds.length > 0) params.examIds = examIds.join(',');
  
  console.log('获取学生成绩趋势，直接请求后端');
  return directAxios.get('/api/statistics/student/trend', { params });
};

// 获取班级考试成绩柱状对比
export const getClassScoreComparison = async (
  classId: number, 
  examId?: number, 
  subjectId?: number
) => {
  const params: any = { classId };
  if (examId) params.examId = examId;
  if (subjectId) params.subjectId = subjectId;
  
  return directAxios.get('/api/statistics/class/comparison', { params });
};

// 获取班级平均分排名
export const getClassRanking = async (examId: number) => {
  return directAxios.get('/api/statistics/class/ranking', { params: { examId } });
};

// 获取学生排名
export const getStudentRanking = async (
  examId: number, 
  classId?: number,
  subjectId?: number
) => {
  const params: any = { examId };
  if (classId) params.classId = classId;
  if (subjectId) params.subjectId = subjectId;
  
  return directAxios.get('/api/statistics/student/ranking', { params });
};

// 获取考试科目列表
export const getExamSubjects = async (examId: number) => {
  return directAxios.get(`/api/statistics/exam/${examId}/subjects`);
};

// 获取所有可用考试
export const getAvailableExams = async () => {
  return directAxios.get('/api/statistics/exams/available');
}; 