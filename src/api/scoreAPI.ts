import axios from './axios';
import { Score, ScoreSaveRequest, PaginatedResponse } from '../types/score';

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

// 获取考试的成绩列表
export const getScoresByExamId = async (examId: number, page: number = 0, size: number = 10, subjectId?: number) => {
  const params: any = { page, size };
  if (subjectId) {
    params.subjectId = subjectId;
  }
  
  console.log(`正在请求成绩数据: /api/scores/student-scores/exam/${examId}?page=${page}&size=${size}${subjectId ? '&subjectId=' + subjectId : ''}`);
  return directAxios.get<PaginatedResponse<any>>(`/api/scores/student-scores/exam/${examId}`, {
    params
  });
};

// 保存学生成绩
export const saveStudentScore = async (scoreData: ScoreSaveRequest) => {
  console.log('保存学生成绩:', scoreData);
  return directAxios.post(`/api/scores/manual`, scoreData);
};

// 导出考试成绩
export const exportExamScores = async (examId: number) => {
  const response = await directAxios.get(`/api/scores/export`, {
    params: { examId },
    responseType: 'blob'
  });
  
  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition'];
  let filename = `成绩表_${examId}.xlsx`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 下载成绩导入模板
export const downloadScoreTemplate = async (examId: number) => {
  const response = await directAxios.get(`/api/scores/template/download`, {
    params: { examId },
    responseType: 'blob'
  });
  
  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `成绩导入模板_${examId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 从Excel导入成绩
export const importScoresFromExcel = async (examId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('examId', examId.toString());
  
  console.log(`正在导入成绩数据: examId=${examId}, fileName=${file.name}`);
  return directAxios.post(`/api/scores/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}; 