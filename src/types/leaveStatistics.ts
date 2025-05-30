// 筛选条件类型
export interface LeaveStatisticsFilters {
  classId: string | null;
  leaveType: string | null;
  period: 'WEEK' | 'MONTH' | 'SEMESTER' | 'CUSTOM';
  dateRange: [Date | null, Date | null];
}

// 统计数据类型
export interface StatisticsData {
  totalCount: number;
  sickCount: number;
  personalCount: number;
  otherCount: number;
}

// 班级统计数据类型
export interface ClassStatistics {
  classId: number;
  className: string;
  totalStudents: number;
  leaveStudents: number;
  leaveRate: number;
  leaveCount: number;
  totalDays: number;
  avgLeaveDays: number;
  sickLeaveCount: number;
  personalLeaveCount: number;
  otherLeaveCount: number;
}

// 学生排名数据类型
export interface StudentRanking {
  studentId: number;
  studentName: string;
  className: string;
  leaveCount: number;
  totalDays: number;
  sickLeaveCount: number;
  personalLeaveCount: number;
  otherLeaveCount: number;
}

// 学生请假记录类型
export interface StudentLeave {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  type: string;
  reason: string;
  status: string;
  createTime: string;
}

// 趋势数据类型
export interface TrendData {
  dates: string[];
  counts: number[];
}

// 分页类型
export interface Pagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

// 班级选项类型
export interface ClassOption {
  id: number;
  name: string;
} 