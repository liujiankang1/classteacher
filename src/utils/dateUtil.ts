// 格式化日期为YYYY-MM-DD格式
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 获取当前周的日期范围（周一到周日）
export const getCurrentWeekRange = (): [string, string] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0是周日，1-6是周一到周六
  
  // 计算本周一的日期
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // 计算本周日的日期
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek));
  
  return [formatDate(monday), formatDate(sunday)];
};

// 获取当前月的日期范围（1号到月末）
export const getCurrentMonthRange = (): [string, string] => {
  const now = new Date();
  
  // 当月第一天
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 下月第一天减一天，即当月最后一天
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return [formatDate(firstDay), formatDate(lastDay)];
};

// 获取当前学期的日期范围（1-6月或7-12月）
export const getCurrentSemesterRange = (): [string, string] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // 上半年（1-6月）或下半年（7-12月）
  if (month <= 6) {
    return [formatDate(new Date(year, 0, 1)), formatDate(new Date(year, 5, 30))];
  } else {
    return [formatDate(new Date(year, 6, 1)), formatDate(new Date(year, 11, 31))];
  }
}; 