import axios from 'axios';
import { Exam } from '../types/score';
import axiosInstance from './axios';

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

interface ExamSubjectDTO {
  subject: {
    id: number;
  };
  subjectName: string;
  fullScore: number;
}

interface ExamForm {
  id?: number | null;
  examName: string;
  examDate: string;
  description?: string;
  classInfo?: {
    id: number;
  } | null;
  examSubjects: ExamSubjectDTO[];
}

// 获取所有考试
export const getAllExams = async () => {
  console.log('获取所有考试，直接请求后端');
  return directAxios.get<Exam[]>('/api/exams');
};

// 根据ID获取考试详情
export const getExamById = async (examId: number) => {
  return directAxios.get<Exam>(`/api/exams/${examId}`);
};

// 根据班级获取考试
export const getExamsByClass = (classId: string) => {
  return directAxios.get(`/api/exams/class/${classId}`);
};

// 根据状态获取考试
export const getExamsByStatus = (status: string) => {
  return directAxios.get(`/api/exams/status/${status}`);
};

// 创建新考试
export const createExam = async (examData: Partial<Exam>) => {
  return directAxios.post('/api/exams', examData);
};

// 更新考试信息
export const updateExam = async (examId: number, examData: Partial<Exam>) => {
  return directAxios.put(`/api/exams/${examId}`, examData);
};

// 删除考试
export const deleteExam = async (examId: number) => {
  return directAxios.delete(`/api/exams/${examId}`);
};

// 更新考试状态
export const updateExamStatus = async (examId: number, status: Exam['status']) => {
  return directAxios.patch(`/api/exams/${examId}/status`, { status });
}; 