export interface Subject {
  id: string | number;
  name: string;
  score: number;
  passScore: number;
  description: string;
}

export interface SubjectResponse {
  content: Subject[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: {
      message?: string;
    };
  };
}

// 用于考试管理中的科目类型
export interface ExamSubject {
  id?: number;
  subjectId?: number;
  name: string;
  score: number;
  subject?: { id: number };
  subjectName?: string;
  fullScore?: number;
} 