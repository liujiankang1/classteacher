/**
 * 格式化日期时间
 * @param dateTime 日期时间字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateTime: string | Date | undefined | any): string => {
  if (!dateTime) return '';
  
  try {
    // 处理数组格式的日期 [年, 月, 日, 时, 分, 秒]
    if (Array.isArray(dateTime)) {
      const [year, month, day, hour = 0, minute = 0] = dateTime;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    
    // 处理普通日期对象或字符串
    const date = new Date(dateTime);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return String(dateTime);
    }
    
    // 获取年、月、日、时、分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // 返回格式化后的日期时间字符串
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('日期格式化错误:', error, dateTime);
    return String(dateTime);
  }
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // 获取年、月、日
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // 返回格式化后的日期字符串
  return `${year}-${month}-${day}`;
};

/**
 * 格式化时间
 * @param time 时间字符串或Date对象
 * @returns 格式化后的时间字符串
 */
export const formatTime = (time: string | Date | undefined): string => {
  if (!time) return '';
  
  const timeObj = new Date(time);
  
  // 获取时、分、秒
  const hours = String(timeObj.getHours()).padStart(2, '0');
  const minutes = String(timeObj.getMinutes()).padStart(2, '0');
  const seconds = String(timeObj.getSeconds()).padStart(2, '0');
  
  // 返回格式化后的时间字符串
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 获取当前周的日期范围
 * @returns [开始日期, 结束日期]
 */
export const getCurrentWeekRange = (): [Date, Date] => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 周日为0，转换为7
  
  // 计算本周的第一天 (周一)
  const firstDay = new Date(now);
  firstDay.setDate(now.getDate() - dayOfWeek + 1);
  firstDay.setHours(0, 0, 0, 0);
  
  // 计算本周的最后一天 (周日)
  const lastDay = new Date(now);
  lastDay.setDate(now.getDate() + (7 - dayOfWeek));
  lastDay.setHours(23, 59, 59, 999);
  
  return [firstDay, lastDay];
};

/**
 * 获取当前月的日期范围
 * @returns [开始日期, 结束日期]
 */
export const getCurrentMonthRange = (): [Date, Date] => {
  const now = new Date();
  
  // 计算本月的第一天
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  // 计算本月的最后一天
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  
  return [firstDay, lastDay];
};

/**
 * 获取当前学期的日期范围
 * @returns [开始日期, 结束日期]
 */
export const getCurrentSemesterRange = (): [Date, Date] => {
  const now = new Date();
  let firstDay: Date;
  let lastDay: Date;
  
  // 上半年为第一学期，下半年为第二学期
  if (now.getMonth() < 6) { // 1月-6月
    firstDay = new Date(now.getFullYear(), 0, 1); // 1月1日
    lastDay = new Date(now.getFullYear(), 5, 30); // 6月30日
  } else { // 7月-12月
    firstDay = new Date(now.getFullYear(), 6, 1); // 7月1日
    lastDay = new Date(now.getFullYear(), 11, 31); // 12月31日
  }
  
  firstDay.setHours(0, 0, 0, 0);
  lastDay.setHours(23, 59, 59, 999);
  
  return [firstDay, lastDay];
}; 