// 考试信息
export interface Exam {
  id: number;
  name: string;
  examDate: string | Date;
  className?: string;
  classId?: number;
}

// 科目信息
export interface Subject {
  id: number;
  name: string;
  fullScore?: number;
}

// 学生信息
export interface Student {
  id: number;
  name: string;
  studentNumber: string;
  className?: string;
  classId?: number;
}

// 学生成绩趋势数据点
export interface ScoreTrendPoint {
  examId: number;
  examName: string;
  examDate: string;
  score: number;
  fullScore: number;
  rank?: number;
  totalStudents?: number;
}

// 学生成绩趋势
export interface StudentScoreTrend {
  student: Student;
  trends: {
    // 按科目ID分组的成绩趋势
    [subjectId: number]: ScoreTrendPoint[];
    // 总分趋势
    total: ScoreTrendPoint[];
  };
  subjects: Subject[];
}

// 班级成绩对比
export interface ClassScoreComparison {
  exam: Exam;
  classId: number;
  className: string;
  // 各科目的成绩统计
  subjectStats: {
    [subjectId: number]: {
      subjectName: string;
      avgScore: number;
      maxScore: number;
      minScore: number;
      passRate: number;
      excellentRate: number;
      fullScore: number;
    }
  };
  // 总分统计
  totalStats: {
    avgScore: number;
    maxScore: number;
    minScore: number;
    passRate: number;
    excellentRate: number;
  };
  subjects: Subject[];
  // 分数段分布数据 - 按科目ID或total分组
  scoreRanges?: {
    [key: string]: {
      label: string;
      count: number;
      percentage: number;
    }[];
  };
}

// 班级排名
export interface ClassRanking {
  examId: number;
  examName: string;
  rankings: {
    classId: number;
    className: string;
    avgScore: number;
    rank: number;
  }[];
}

// 学生排名
export interface StudentRanking {
  examId: number;
  examName: string;
  subjectId?: number;
  subjectName?: string;
  rankings: {
    studentId: number;
    studentName: string;
    studentNumber: string;
    classId: number;
    className: string;
    score: number;
    rank: number;
    classRank: number;
  }[];
} 