// 考试状态类型
export type ExamStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'GRADED';

// 考试科目类型
export interface ExamSubject {
  id: number;
  name: string;
  score: number; // 满分
}

// 班级信息类型
export interface ClassInfo {
  id: number;
  className: string;
  grade?: string;
  description?: string;
}

// 考试类型
export interface Exam {
  id: number;
  name: string;
  examName?: string; // 添加可选字段以兼容后端返回的数据
  examDate: string | Date;
  className: string;
  status: ExamStatus;
  subjects: ExamSubject[];
  classInfo?: ClassInfo;
  examSubjects?: Array<{
    id?: number;
    subject?: { id: number; name?: string };
    subjectName?: string;
    fullScore?: number;
  }>;
}

// 成绩类型
export interface Score {
  id: number;
  examId: number;
  examSubjectId: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  scoreValue: number;
  rank?: number;
  subjectName?: string;
  comment?: string;
  createdAt?: string;
  className?: string; // 班级名称
}

// 学生成绩类型（前端展示用）
export interface Student {
  id: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  scores: Record<number, number | null>; // 科目ID -> 分数
  totalScore: number;
  rank: number;
  className?: string; // 班级名称
}

// 成绩统计类型
export interface ScoreStatistics {
  highest: number;
  lowest: number;
  average: number;
}

// 手动录入表单类型
export interface ManualInputForm {
  studentNumber: string;
  studentName: string;
  scores: Record<number, number | null>; // 科目ID -> 分数
}

// 成绩保存请求类型
export interface ScoreSaveRequest {
  examId: number;
  studentNumber: string;
  studentName: string;
  scores: Record<number, number | null>; // 科目ID -> 分数
}

// 分页响应类型
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
} 