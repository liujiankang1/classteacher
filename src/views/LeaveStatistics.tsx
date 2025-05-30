import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Table,
  Space,
  Select,
  DatePicker,
  Spin,
  Modal,
  Tabs,
  Descriptions,
  Pagination,
  message,
  Tag
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import dayjs from 'dayjs';
import { zhCN } from 'date-fns/locale';
// 导入API服务
import * as leaveStatisticsAPI from '../api/leaveStatisticsAPI';
import * as classAPI from '../api/class';
import { formatDate, getCurrentMonthRange, getCurrentWeekRange } from '../utils/dateUtils';
import './LeaveStatistics.css'; // 导入样式文件

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// 假设有对应的服务和工具函数，后续需要创建或引入
// import LeaveService from '@/api/leaveService'; // 接口服务
// import { classAPI } from '@/services/api.service'; // 接口服务
// import { formatDate, getCurrentMonthRange, getCurrentWeekRange } from '@/utils/dateUtil'; // 日期工具

// 使用真实API服务替代模拟API


const LeaveStatistics = () => {
  const [loading, setLoading] = useState(false);
  const typeChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const typeChartInstance = useRef<EChartsType | null>(null);
  const trendChartInstance = useRef<EChartsType | null>(null);

  interface ClassOption { label: string; value: string; }
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);

  const [filters, setFilters] = useState<{
    classId: string | null;
    leaveType: string | null;
    period: string;
    dateRange: [string, string]; // 确保始终有日期范围
  }>({
    classId: null,
    leaveType: null,
    period: 'MONTH',
    dateRange: [formatDate(getCurrentMonthRange()[0]), formatDate(getCurrentMonthRange()[1])], 
  });

  interface StatisticsData {
    totalCount: number;
    sickCount: number;
    personalCount: number;
    otherCount: number;
  }
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalCount: 0,
    sickCount: 0,
    personalCount: 0,
    otherCount: 0,
  });

  interface ClassStat {
    classId: string;
    className: string;
    totalStudents: number;
    leaveStudents: number;
    leaveRate: string;
    leaveCount: number;
    totalDays: number;
    avgLeaveDays: string;
    sickLeaveCount: number;
    personalLeaveCount: number;
    otherLeaveCount: number;
  }
  const [classStatsList, setClassStatsList] = useState<ClassStat[]>([]);

  interface StudentRank {
    studentId: string;
    studentName: string;
    className: string;
    leaveCount: number;
    totalDays: number;
    sickLeaveCount: number;
    personalLeaveCount: number;
    otherLeaveCount: number;
  }
  const [studentRankList, setStudentRankList] = useState<StudentRank[]>([]);

  const [studentRankPage, setStudentRankPage] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const [classDetailVisible, setClassDetailVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassStat | null>(null);
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [classStudentsList, setClassStudentsList] = useState<StudentRank[]>([]);

  const [studentDetailVisible, setStudentDetailVisible] = useState(false);
  interface StudentDetail extends StudentRank {
    // 可能还有其他学生特有字段
  }
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [studentLeavesLoading, setStudentLeavesLoading] = useState(false);
  interface LeaveRecord {
    id: string;
    startDate: string;
    endDate: string;
    days: number;
    type?: 'SICK' | 'PERSONAL' | 'OTHER' | string; // 可选，因为可能使用leaveType
    leaveType?: 'SICK' | 'PERSONAL' | 'OTHER' | string; // 添加leaveType字段
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    createTime: string;
  }
  const [studentLeavesList, setStudentLeavesList] = useState<LeaveRecord[]>([]);
  const [studentLeavesPage, setStudentLeavesPage] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取班级列表
  const getClassList = useCallback(async () => {
    try {
      const response = await classAPI.getAllClasses(); // 使用真实API
      if (response && response.data) {
        setClassOptions(response.data.map((cls: any) => ({
          label: cls.name,
          value: cls.id,
        })));
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
      message.error('获取班级列表失败');
    }
  }, []);

  // 直接渲染请假类型图表函数
  const renderTypeChart = useCallback((data: {sickCount: number, personalCount: number, otherCount: number}) => {
    if (!typeChartRef.current) {
      console.log('图表容器不存在，无法渲染请假类型图表');
      return;
    }

    console.log('渲染请假类型图表，使用数据:', data);

    try {
      // 直接使用传入的数据
      let sickCount = data.sickCount || 0;
      let personalCount = data.personalCount || 0;
      let otherCount = data.otherCount || 0;
  
      console.log('使用数据渲染图表:', { sickCount, personalCount, otherCount });
  
      // 检查是否有数据
      const hasData = sickCount > 0 || personalCount > 0 || otherCount > 0;
  
      // 过滤掉值为0的数据，使图表更清晰
      const typeData = [
        { value: sickCount, name: '病假' },
        { value: personalCount, name: '事假' },
        { value: otherCount, name: '其他' }
      ].filter(item => item.value > 0);
  
      // 完全重置图表
      if (typeChartInstance.current) {
        typeChartInstance.current.dispose();
        typeChartInstance.current = null;
      }
      
      // 重新初始化图表
      const chart = echarts.init(typeChartRef.current);
      typeChartInstance.current = chart;
  
      const typeOption = {
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
        legend: { 
          orient: 'vertical', 
          left: 10, 
          data: ['病假', '事假', '其他'].filter(name => {
            if (name === '病假' && sickCount === 0) return false;
            if (name === '事假' && personalCount === 0) return false;
            if (name === '其他' && otherCount === 0) return false;
            return true;
          })
        },
        series: [{
          name: '请假类型',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { 
            show: true, 
            position: 'outside',
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
          labelLine: { show: true },
          data: typeData
        }]
      };
      
      chart.setOption(typeOption as any);
      
      if (!hasData) {
        chart.setOption({
          title: {
            text: '暂无数据',
            left: 'center',
            top: 'middle',
            textStyle: {
              color: '#999',
              fontSize: 16
            }
          }
        });
      }
      
      // 立即调整大小以确保正确渲染
      chart.resize();
    } catch (error) {
      console.error('渲染请假类型图表出错:', error);
    }
  }, []);

  // 更新统计数据函数 (对应 Vue 中的 updateStatistics)
  const updateStatisticsDisplay = useCallback(() => {
    console.log('更新统计数据显示');
    
    // 创建一个新的统计数据对象，避免直接修改state
    let newStats = {
      totalCount: statistics.totalCount,
      sickCount: statistics.sickCount,
      personalCount: statistics.personalCount,
      otherCount: statistics.otherCount
    };
    
    // 如果选择了班级，使用班级的统计数据
    if (filters.classId && classStatsList.length > 0) {
      const classStats = classStatsList.find((cs) => cs.classId === filters.classId);
      if (classStats) {
        console.log('使用班级数据:', classStats);
        newStats = {
          totalCount: classStats.leaveCount || 0,
          sickCount: classStats.sickLeaveCount || 0,
          personalCount: classStats.personalLeaveCount || 0,
          otherCount: classStats.otherLeaveCount || 0
        };
      }
    }

    // 如果选择了请假类型，只显示对应类型的数据
    if (filters.leaveType) {
      console.log('根据请假类型筛选:', filters.leaveType);
      switch (filters.leaveType) {
        case 'SICK':
          newStats = {
            totalCount: newStats.sickCount,
            sickCount: newStats.sickCount,
            personalCount: 0,
            otherCount: 0
          };
          break;
        case 'PERSONAL':
          newStats = {
            totalCount: newStats.personalCount,
            sickCount: 0,
            personalCount: newStats.personalCount,
            otherCount: 0
          };
          break;
        case 'OTHER':
          newStats = {
            totalCount: newStats.otherCount,
            sickCount: 0,
            personalCount: 0,
            otherCount: newStats.otherCount
          };
          break;
      }
    }
    
    console.log('更新后的统计数据:', newStats);
    
    // 更新状态
    setStatistics(newStats);
    
    // 使用requestAnimationFrame确保在下一帧渲染图表
    requestAnimationFrame(() => {
      if (typeChartRef.current) {
        renderTypeChart(newStats);
      }
    });
    
  }, [filters.classId, filters.leaveType, classStatsList, renderTypeChart, statistics]);

  // 初始化图表
  const initCharts = useCallback((statsData: StatisticsData, trendData: { dates: string[], counts: number[] }) => {
    console.log('初始化图表，统计数据:', statsData, '趋势数据:', trendData);
    
    // 先更新统计数据状态
    const newStats = {
      totalCount: statsData.totalCount || 0,
      sickCount: statsData.sickCount || 0,
      personalCount: statsData.personalCount || 0,
      otherCount: statsData.otherCount || 0,
    };
    
    // 不在这里设置统计数据状态，避免重复更新
    // setStatistics(newStats);
    
    // 不在这里渲染请假类型图表，由getStatisticsData统一处理
    // if (typeChartRef.current) {
    //   renderTypeChart(newStats);
    // }

    try {
      if (trendChartRef.current && trendData) {
        console.log('初始化请假趋势图，数据:', trendData);
        if (trendChartInstance.current) {
          trendChartInstance.current.dispose();
          trendChartInstance.current = null;
        }
        const chart = echarts.init(trendChartRef.current);
        trendChartInstance.current = chart;
        const dates = trendData.dates || [];
        const counts = trendData.counts || [];
        const trendOption = {
          tooltip: { trigger: 'axis' },
          legend: { data: ['请假数量'] },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', boundaryGap: false, data: dates },
          yAxis: { type: 'value' },
          series: [{
            name: '请假数量',
            type: 'line',
            stack: '总量',
            data: counts,
            areaStyle: {}
          }]
        };
        chart.setOption(trendOption as any);
        if (!dates.length || !counts.length) {
          chart.setOption({
            title: {
              text: '暂无数据',
              left: 'center',
              top: 'middle',
              textStyle: {
                color: '#999',
                fontSize: 16
              }
            }
          });
        }
        
        // 立即调整大小以确保正确渲染
        chart.resize();
      }
    } catch (error) {
      console.error('初始化请假趋势图表出错:', error);
    }
    
    return newStats;
  }, []);

  // 定义带有timer属性的函数类型
  interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    timer?: NodeJS.Timeout | null;
  }

  // 定义带有timer属性的函数类型，并允许isUserTriggered参数
  interface GetStatisticsDataFunction {
    (isUserTriggered?: boolean): Promise<void>;
    timer?: NodeJS.Timeout | null;
  }

  // 定义带有timer属性的函数类型
  interface LoadStudentRankingFunction {
    (isUserTriggered?: boolean): Promise<void>;
    timer?: NodeJS.Timeout | null;
  }

  // 定义带有timer属性的函数类型，用于学生请假记录加载
  interface LoadStudentLeavesFunction {
    (studentId: string, page?: number, pageSize?: number, isUserTriggered?: boolean): Promise<void>;
    timer?: NodeJS.Timeout | null;
  }

  // 获取统计数据和学生排名的状态
  const dataLoadingState = useRef({
    statisticsLoaded: false,
    studentRankingLoaded: false
  });

  // 获取统计数据
  const getStatisticsData: GetStatisticsDataFunction = useCallback(async (isUserTriggered = false) => {
    // 添加防抖，避免短时间内多次调用
    if (!isUserTriggered && getStatisticsData.timer) {
      console.log('【统计数据】取消之前的防抖请求');
      clearTimeout(getStatisticsData.timer);
    }

    const executeRequest = async () => {
      console.log('【统计数据】开始执行请求');
      setLoading(true);
      try {
        const params = {
          classId: filters.classId,
          leaveType: filters.leaveType,
          period: filters.period,
          startDate: filters.dateRange[0],
          endDate: filters.dateRange[1],
        };
        
        console.log('【统计数据】请求参数:', params);
        
        // 获取请假统计概览
        const statisticsResponse = await leaveStatisticsAPI.getLeaveStatistics(params);
        const statsData = statisticsResponse.data;
        
        console.log('【统计数据】请假统计概览数据:', statsData);

        // 获取班级请假统计
        const classStatsResponse = await leaveStatisticsAPI.getClassLeaveStatistics(params);
        const classStats = classStatsResponse.data || [];
        setClassStatsList(classStats);

        // 获取请假趋势数据
        const trendResponse = await leaveStatisticsAPI.getLeaveTrendData(params);
        
        // 初始化趋势图表，并获取基础统计数据
        const baseStats = initCharts(statsData, trendResponse.data);
        
        // 在数据加载完成后，手动处理统计数据
        const newStats = { ...baseStats };
        
        // 如果选择了班级，使用班级的统计数据
        if (filters.classId && classStats.length > 0) {
          const selectedClass = classStats.find((cs) => cs.classId === filters.classId);
          if (selectedClass) {
            console.log('使用班级数据:', selectedClass);
            Object.assign(newStats, {
              totalCount: selectedClass.leaveCount || 0,
              sickCount: selectedClass.sickLeaveCount || 0,
              personalCount: selectedClass.personalLeaveCount || 0,
              otherCount: selectedClass.otherLeaveCount || 0
            });
          }
        }

        // 如果选择了请假类型，只显示对应类型的数据
        if (filters.leaveType) {
          console.log('根据请假类型筛选:', filters.leaveType);
          switch (filters.leaveType) {
            case 'SICK':
              Object.assign(newStats, {
                totalCount: newStats.sickCount,
                personalCount: 0,
                otherCount: 0
              });
              break;
            case 'PERSONAL':
              Object.assign(newStats, {
                totalCount: newStats.personalCount,
                sickCount: 0,
                otherCount: 0
              });
              break;
            case 'OTHER':
              Object.assign(newStats, {
                totalCount: newStats.otherCount,
                sickCount: 0,
                personalCount: 0
              });
              break;
          }
        }
        
        // 更新统计数据状态
        setStatistics(newStats);
        
        // 使用setTimeout确保DOM更新后再渲染图表
        setTimeout(() => {
          if (typeChartRef.current) {
            try {
              renderTypeChart(newStats);
            } catch (error) {
              console.error('渲染请假类型图表失败:', error);
            }
          }
        }, 200);
        
        // 标记统计数据已加载
        dataLoadingState.current.statisticsLoaded = true;
        
        // 统计数据加载完成后，再加载学生排名数据
        console.log('【统计数据】加载完成，开始加载学生排名数据');
        // 使用函数调用而不是依赖注入
        if (dataLoadingState.current.statisticsLoaded && !dataLoadingState.current.studentRankingLoaded) {
          loadStudentRanking(isUserTriggered);
        }
      } catch (error) {
        console.error('【统计数据】获取失败:', error);
        message.error('获取统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    if (isUserTriggered) {
      // 用户触发的请求立即执行
      console.log('【统计数据】用户触发，立即执行');
      await executeRequest();
    } else {
      // 非用户触发的请求添加防抖
      console.log('【统计数据】系统触发，添加防抖');
      getStatisticsData.timer = setTimeout(executeRequest, 300);
    }
  }, [filters.classId, filters.leaveType, filters.period, filters.dateRange, initCharts, renderTypeChart]);

  // 初始化timer属性
  getStatisticsData.timer = null;

  // 加载学生请假排名数据
  const loadStudentRanking: LoadStudentRankingFunction = useCallback(async (isUserTriggered = false) => {
    // 添加防抖，避免短时间内多次调用
    if (!isUserTriggered && loadStudentRanking.timer) {
      console.log('【学生排名】取消之前的防抖请求');
      clearTimeout(loadStudentRanking.timer);
    }

    const executeRequest = async () => {
      try {
        console.log('【学生排名】开始执行请求，页码:', studentRankPage.currentPage, '每页条数:', studentRankPage.pageSize);
        
        const rankingParams = {
          classId: filters.classId,
          leaveType: filters.leaveType,
          period: filters.period,
          startDate: filters.dateRange[0],
          endDate: filters.dateRange[1],
          page: studentRankPage.currentPage - 1, // 确保页码从0开始（后端分页从0开始）
          size: studentRankPage.pageSize,
        };
        
        console.log('【学生排名】请求参数:', rankingParams);
        
        const rankingResponse = await leaveStatisticsAPI.getStudentLeaveRanking(rankingParams);
        
        // 检查 rankingResponse.data 是否符合预期的分页结构
        if (rankingResponse.data && rankingResponse.data.content) {
          console.log('【学生排名】获取到数据(分页):', rankingResponse.data);
          setStudentRankList(rankingResponse.data.content);
          setStudentRankPage(prev => ({ ...prev, total: rankingResponse.data.totalElements || 0 }));
        } 
        // 兼容直接返回数组的情况
        else if (Array.isArray(rankingResponse.data)) { 
          console.log('【学生排名】获取到数据(数组):', rankingResponse.data);
          const dataArray = rankingResponse.data as StudentRank[]; // 类型断言
          setStudentRankList(dataArray);
          setStudentRankPage(prev => ({ ...prev, total: dataArray.length }));
        } else {
          // 如果数据格式不符合预期，可以设置为空或给出提示
          console.warn('【学生排名】收到意外的数据格式:', rankingResponse.data);
          setStudentRankList([]);
          setStudentRankPage(prev => ({ ...prev, total: 0 }));
        }
        
        // 标记学生排名数据已加载
        dataLoadingState.current.studentRankingLoaded = true;
      } catch (error) {
        console.error('【学生排名】获取数据失败:', error);
        message.error('获取学生排名数据失败');
      }
    };

    if (isUserTriggered) {
      // 用户触发的请求立即执行
      console.log('【学生排名】用户触发，立即执行');
      await executeRequest();
    } else {
      // 非用户触发的请求添加防抖
      console.log('【学生排名】系统触发，添加防抖');
      loadStudentRanking.timer = setTimeout(executeRequest, 300);
    }
  }, [filters.classId, filters.leaveType, filters.period, filters.dateRange, studentRankPage.currentPage, studentRankPage.pageSize]);
  
  // 初始化timer属性
  loadStudentRanking.timer = null;

  // 查看学生详情
  const handleViewStudentDetail = (record: StudentRank | StudentDetail) => {
    setSelectedStudent(record as StudentDetail); // 类型断言
    setStudentDetailVisible(true);
    // 重置分页到第一页
    setStudentLeavesPage(prev => ({ ...prev, currentPage: 1 })); 
    // 加载学生请假记录，使用第1页
    loadStudentLeaves(record.studentId, 1, studentLeavesPage.pageSize, true); // 标记为用户触发，立即执行
  };
  
  // 加载学生请假记录
  const loadStudentLeaves: LoadStudentLeavesFunction = useCallback(async (
    studentId: string, 
    page: number = studentLeavesPage.currentPage, 
    pageSize: number = studentLeavesPage.pageSize,
    isUserTriggered = false
  ) => {
    if (!studentId) return;
    
    // 添加防抖，避免短时间内多次调用
    if (!isUserTriggered && loadStudentLeaves.timer) {
      clearTimeout(loadStudentLeaves.timer);
    }
    
    const executeRequest = async () => {
      setStudentLeavesLoading(true);
      try {
        console.log(`加载学生请假记录，学生ID: ${studentId}, 页码: ${page}, 每页条数: ${pageSize}`);
        
        // 确保页码从0开始（后端分页从0开始）
        const pageIndex = page - 1;
        
        const response = await leaveStatisticsAPI.getStudentLeaves(
          studentId,
          pageIndex,
          pageSize
        );
        
        if (response.data && response.data.content) {
          console.log('获取到学生请假记录:', response.data);
          const leaveRecords = response.data.content.map((leave: any) => {
            // 检查并确保类型字段存在
            if (!leave.type && leave.leaveType) {
              leave.type = leave.leaveType; // 如果后端返回的是leaveType而不是type
            }
            
            // 计算天数
            const days = leave.days || Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            console.log('处理请假记录:', { ...leave, days, type: leave.type || leave.leaveType || 'UNKNOWN' });
            
            return {
              ...leave,
              days,
              type: leave.type || leave.leaveType || 'UNKNOWN' // 确保type字段存在
            };
          });
          
          console.log('处理后的请假记录:', leaveRecords);
          setStudentLeavesList(leaveRecords);
          setStudentLeavesPage(prev => ({ ...prev, total: response.data.totalElements || 0 }));
        } else if (Array.isArray(response.data)) { // 兼容直接返回数组的情况
           console.log('获取到学生请假记录(数组):', response.data);
           const dataArray = response.data as LeaveRecord[];
           const leaveRecords = dataArray.map((leave: any) => {
            // 检查并确保类型字段存在
            if (!leave.type && leave.leaveType) {
              leave.type = leave.leaveType; // 如果后端返回的是leaveType而不是type
            }
            
            // 计算天数
            const days = leave.days || Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            console.log('处理请假记录:', { ...leave, days, type: leave.type || leave.leaveType || 'UNKNOWN' });
            
            return {
              ...leave,
              days,
              type: leave.type || leave.leaveType || 'UNKNOWN' // 确保type字段存在
            };
          });
          
          console.log('处理后的请假记录:', leaveRecords);
          setStudentLeavesList(leaveRecords);
          setStudentLeavesPage(prev => ({ ...prev, total: dataArray.length }));
        }
      } catch (error) {
        console.error('获取学生请假记录失败:', error);
        message.error('获取学生请假记录失败');
      } finally {
        setStudentLeavesLoading(false);
      }
    };
    
    if (isUserTriggered) {
      // 用户触发的请求立即执行
      await executeRequest();
    } else {
      // 非用户触发的请求添加防抖
      loadStudentLeaves.timer = setTimeout(executeRequest, 300);
    }
  }, []);
  
  // 初始化timer属性
  loadStudentLeaves.timer = null;

  // 学生请假记录分页变化
  const handleStudentLeavesPageChange = (page: number, pageSize?: number) => {
    console.log(`分页变化: 页码=${page}, 每页条数=${pageSize}`);
    const newPageSize = pageSize || studentLeavesPage.pageSize;
    
    // 先更新分页状态
    setStudentLeavesPage(prev => ({ 
      ...prev, 
      currentPage: page, 
      pageSize: newPageSize 
    }));
    
    // 然后重新加载数据，使用新的分页参数
    if (selectedStudent?.studentId) {
      loadStudentLeaves(selectedStudent.studentId, page, newPageSize, true); // 标记为用户触发，立即执行
    }
  };

  // 获取请假类型名称 (辅助函数)
  const getLeaveTypeName = (type: string) => {
    switch (type) {
      case 'SICK': return '病假';
      case 'PERSONAL': return '事假';
      case 'OTHER': return '其他';
      default: return '未知';
    }
  };

  // 获取请假状态名称 (辅助函数)
  const getLeaveStatusName = (status: string) => {
    switch (status) {
      case 'PENDING': return '待审批';
      case 'APPROVED': return '已批准';
      case 'REJECTED': return '已拒绝';
      default: return '未知';
    }
  };
  
  // 班级详情对话框关闭
  const handleClassDialogClosed = () => {
    setClassDetailVisible(false);
    // Vue 版本中不清空 selectedClass 和 classStudentsList，这里保持一致
    // setSelectedClass(null);
    // setClassStudentsList([]); 
  };

  // 学生详情对话框关闭
  const handleStudentDialogClosed = () => {
    setStudentDetailVisible(false);
    setSelectedStudent(null);
    setStudentLeavesList([]);
    setStudentLeavesPage(prev => ({ ...prev, currentPage: 1, total: 0 }));
  };

  // 组件挂载后初始化
  useEffect(() => {
    console.log('【组件初始化】开始获取数据');
    // 获取班级列表
    getClassList();
    
    // 确保组件完全挂载后再加载数据
    const timer = setTimeout(() => {
      console.log('【组件初始化】延迟加载数据');
      // 只在组件初始化时加载一次数据
      getStatisticsData(true); // 标记为用户触发，立即执行
      
      // 不在这里调用loadStudentRanking，避免重复请求
      // loadStudentRanking会在getStatisticsData完成后自动调用
    }, 300);
    
    return () => {
      clearTimeout(timer);
      // 清理防抖计时器
      if (loadStudentRanking.timer) {
        clearTimeout(loadStudentRanking.timer);
      }
      if (getStatisticsData.timer) {
        clearTimeout(getStatisticsData.timer);
      }
      if (loadStudentLeaves.timer) {
        clearTimeout(loadStudentLeaves.timer);
      }
      // 清理图表实例
      if (typeChartInstance.current) {
        typeChartInstance.current.dispose();
        typeChartInstance.current = null;
      }
      if (trendChartInstance.current) {
        trendChartInstance.current.dispose();
        trendChartInstance.current = null;
      }
    };
  }, [getClassList, getStatisticsData]);

  // 监听筛选条件变化，重新获取数据
  // 使用useRef来避免首次渲染时触发
  const isInitialRender = useRef(true);
  const isInitialStudentRankingRender = useRef(true);
  
  // 合并处理筛选条件变化，避免重复请求
  useEffect(() => {
    if (isInitialRender.current) {
      console.log('【筛选条件】首次渲染，跳过请求');
      isInitialRender.current = false;
      return;
    }
    
    console.log('【筛选条件变化】重新获取数据:', filters);
    
    // 重置加载状态
    dataLoadingState.current = {
      statisticsLoaded: false,
      studentRankingLoaded: false
    };
    
    // 使用防抖获取统计数据
    getStatisticsData(); 
    // 不在这里调用loadStudentRanking，避免重复请求
  }, [filters.classId, filters.leaveType, filters.period, filters.dateRange, getStatisticsData]);
  
  // 只监听学生排名分页变化，不监听筛选条件变化
  useEffect(() => {
    if (isInitialStudentRankingRender.current) {
      console.log('【学生排名】首次渲染，跳过请求');
      isInitialStudentRankingRender.current = false;
      return;
    }
    
    // 只有当分页参数变化时才重新加载学生排名
    console.log('【学生排名分页参数变化】重新加载排名数据');
    loadStudentRanking();
  }, [studentRankPage.currentPage, studentRankPage.pageSize, loadStudentRanking]);

  // 处理周期变化 (对应 Vue handlePeriodChange)
  const handlePeriodChange = (value: string) => {
    console.log('周期变化:', value);
    // 确保newDateRange始终有值
    let newDateRange: [string, string] = filters.dateRange; 
    if (value === 'WEEK') {
      const weekRange = getCurrentWeekRange();
      newDateRange = [formatDate(weekRange[0]), formatDate(weekRange[1])];
    } else if (value === 'MONTH') {
      const monthRange = getCurrentMonthRange();
      newDateRange = [formatDate(monthRange[0]), formatDate(monthRange[1])];
    } else if (value === 'CUSTOM') { 
      // 当选择 CUSTOM 时，保持当前日期范围不变
      // 无需额外处理，因为newDateRange已经初始化为filters.dateRange
    }
    setFilters(prev => ({ ...prev, period: value, dateRange: newDateRange }));
    // 周期变化后，图表会通过useEffect自动更新
  };
  
  // 查询处理
  const handleSearch = () => {
    console.log('【用户操作】执行查询，筛选条件:', filters);
    getStatisticsData(true); // 标记为用户触发，立即执行
    // 不需要单独调用loadStudentRanking，它会在getStatisticsData完成后自动调用
  };

  // 重置筛选
  const resetFilters = () => {
    console.log('【用户操作】重置筛选条件');
    const monthRange = getCurrentMonthRange();
    setFilters({
      classId: null,
      leaveType: null,
      period: 'MONTH',
      dateRange: [formatDate(monthRange[0]), formatDate(monthRange[1])],
    });
    // filters 的变化会自动触发数据重新加载
  };

  // 刷新数据
  const refreshData = () => {
    console.log('【用户操作】手动刷新数据');
    getStatisticsData(true); // 标记为用户触发，立即执行
    // 不需要单独调用loadStudentRanking，它会在getStatisticsData完成后自动调用
  };
  
  // 导出数据
  const exportData = async () => {
    const params = {
      classId: filters.classId,
      leaveType: filters.leaveType,
      period: filters.period,
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
    };
    setLoading(true);
    try {
      const response = await leaveStatisticsAPI.exportLeaveStatistics(params);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 从响应头获取文件名，如果没有则使用默认名
      const contentDisposition = response.headers['content-disposition'];
      let filename = '请假统计数据.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('统计数据导出成功');
    } catch (error) {
      console.error('导出统计数据失败:', error);
      message.error('导出统计数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义 - 班级统计
  const classStatsColumns = [
    { title: '班级', dataIndex: 'className', key: 'className', width: 150 },
    { title: '班级人数', dataIndex: 'totalStudents', key: 'totalStudents', width: 100 },
    { title: '请假人数', dataIndex: 'leaveStudents', key: 'leaveStudents', width: 100 },
    { title: '请假率', dataIndex: 'leaveRate', key: 'leaveRate', width: 100, render: (text: string) => `${text}%` },
    { title: '请假次数', dataIndex: 'leaveCount', key: 'leaveCount', width: 100 },
    { title: '请假总天数', dataIndex: 'totalDays', key: 'totalDays', width: 120 },
    { title: '人均请假天数', dataIndex: 'avgLeaveDays', key: 'avgLeaveDays', width: 120 },
    { title: '病假次数', dataIndex: 'sickLeaveCount', key: 'sickLeaveCount', width: 100 },
    { title: '事假次数', dataIndex: 'personalLeaveCount', key: 'personalLeaveCount', width: 100 },
    { title: '其他请假次数', dataIndex: 'otherLeaveCount', key: 'otherLeaveCount', width: 120 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: ClassStat) => (
        <Button type="primary" size="small" onClick={() => handleViewClassDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  // 表格列定义 - 学生排名
  const studentRankColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 80, render: (text:any, record:any, index:number) => (studentRankPage.currentPage - 1) * studentRankPage.pageSize + index + 1 },
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
    { title: '班级', dataIndex: 'className', key: 'className', width: 150 },
    { title: '请假次数', dataIndex: 'leaveCount', key: 'leaveCount', width: 100 },
    { title: '请假总天数', dataIndex: 'totalDays', key: 'totalDays', width: 120 },
    { title: '病假次数', dataIndex: 'sickLeaveCount', key: 'sickLeaveCount', width: 100 },
    { title: '事假次数', dataIndex: 'personalLeaveCount', key: 'personalLeaveCount', width: 100 },
    { title: '其他请假次数', dataIndex: 'otherLeaveCount', key: 'otherLeaveCount', width: 120 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: StudentRank) => (
        <Button type="primary" size="small" onClick={() => handleViewStudentDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];
  
  // 学生请假记录表格列定义
  const studentLeavesColumns = [
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 120 },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 120 },
    { title: '天数', dataIndex: 'days', key: 'days', width: 80 },
    {
      title: '请假类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string, record: any) => {
        console.log('渲染请假类型:', type, '完整记录:', record);
        let color = '';
        if (type === 'SICK') color = 'volcano';
        else if (type === 'PERSONAL') color = 'orange';
        else if (type === 'OTHER') color = 'geekblue';
        
        // 如果type为空，尝试使用leaveType
        const displayType = type || record.leaveType || 'UNKNOWN';
        
        return <Tag color={color}>{getLeaveTypeName(displayType)}</Tag>;
      },
    },
    { title: '请假原因', dataIndex: 'reason', key: 'reason' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = '';
        if (status === 'PENDING') color = 'gold';
        else if (status === 'APPROVED') color = 'green';
        else if (status === 'REJECTED') color = 'red';
        return <Tag color={color}>{getLeaveStatusName(status)}</Tag>;
      },
    },
    { title: '申请时间', dataIndex: 'createTime', key: 'createTime', width: 180, render: (text: string) => text ? new Date(text).toLocaleString() : '' },
  ];


  // 查看班级详情
  const handleViewClassDetail = async (record: ClassStat) => {
    setSelectedClass(record);
    setClassDetailVisible(true);
    setClassStudentsLoading(true);
    try {
      const params = {
        classId: record.classId,
        leaveType: filters.leaveType,
        period: filters.period,
        startDate: filters.dateRange?.[0],
        endDate: filters.dateRange?.[1],
        page: 0, 
        size: 50 
      };
      const response = await leaveStatisticsAPI.getStudentLeaveRanking(params);
      if (response.data && response.data.content) {
        setClassStudentsList(response.data.content);
      } else if (Array.isArray(response.data)) {
        setClassStudentsList(response.data as StudentRank[]);
      }
    } catch (error) {
      console.error('获取班级学生请假排名失败:', error);
      message.error('获取班级学生请假排名失败');
    } finally {
      setClassStudentsLoading(false);
    }
  };

  // 窗口大小变化时重新调整图表大小
  useEffect(() => {
    const resizeHandler = () => {
      console.log('窗口大小变化，调整图表大小');
      try {
        if (typeChartInstance.current) {
          typeChartInstance.current.resize();
        }
        if (trendChartInstance.current) {
          trendChartInstance.current.resize();
        }
      } catch (error) {
        console.error('调整图表大小失败:', error);
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // 初始调整一次大小
    setTimeout(resizeHandler, 500);
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (typeChartInstance.current) {
        typeChartInstance.current.dispose();
        typeChartInstance.current = null;
      }
      if (trendChartInstance.current) {
        trendChartInstance.current.dispose();
        trendChartInstance.current = null;
      }
    };
  }, []);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      console.log('【组件卸载】清理所有资源');
      // 重置加载状态
      dataLoadingState.current = {
        statisticsLoaded: false,
        studentRankingLoaded: false
      };
      
      // 清理所有定时器
      if (getStatisticsData.timer) {
        clearTimeout(getStatisticsData.timer);
        getStatisticsData.timer = null;
      }
      
      if (loadStudentRanking.timer) {
        clearTimeout(loadStudentRanking.timer);
        loadStudentRanking.timer = null;
      }
      
      if (loadStudentLeaves.timer) {
        clearTimeout(loadStudentLeaves.timer);
        loadStudentLeaves.timer = null;
      }
      
      // 清理图表实例
      if (typeChartInstance.current) {
        typeChartInstance.current.dispose();
        typeChartInstance.current = null;
      }
      
      if (trendChartInstance.current) {
        trendChartInstance.current.dispose();
        trendChartInstance.current = null;
      }
    };
  }, []);

  // JSX 结构
  return (
    <div className="leave-statistics-container" style={{ padding: '20px'}}>
      <Spin spinning={loading}>
        {/* 页面头部 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <h2 style={{ margin: 0, fontWeight: 600, color: '#333' }}>学生请假统计</h2>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<DownloadOutlined />} onClick={exportData}>
                导出统计数据
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refreshData}>
                刷新数据
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card style={{ marginBottom: 20 }}>
          <Space wrap style={{width: '100%'}}>
             <Select
                value={filters.classId}
                onChange={(value: string | null) => setFilters(prev => ({ ...prev, classId: value }))}
                options={classOptions}
                placeholder="请选择班级"
                allowClear
                style={{ width: 150 }}
              />
             <Select
                value={filters.leaveType}
                onChange={(value: string | null) => setFilters(prev => ({ ...prev, leaveType: value }))}
                options={[
                  { label: '病假', value: 'SICK' },
                  { label: '事假', value: 'PERSONAL' },
                  { label: '其他', value: 'OTHER' }
                ]}
                placeholder="请选择类型"
                allowClear
                style={{ width: 150 }}
              />
            <Select
              value={filters.period}
              onChange={handlePeriodChange}
              options={[
                { label: '本周', value: 'WEEK' },
                { label: '本月', value: 'MONTH' },
                { label: '自定义', value: 'CUSTOM' } // 移除本学期选项
              ]}
              placeholder="请选择统计周期"
              style={{ width: 150 }}
            />
            {filters.period === 'CUSTOM' && (
              <RangePicker
                value={[
                  dayjs(filters.dateRange[0]), 
                  dayjs(filters.dateRange[1])
                ]}
                onChange={(dates, dateStrings) => {
                  console.log('自定义日期范围变化:', dateStrings);
                  // 确保始终有有效的日期范围
                  const validDateRange: [string, string] = dateStrings[0] && dateStrings[1] 
                    ? [dateStrings[0], dateStrings[1]] 
                    : filters.dateRange;
                  setFilters(prev => ({ ...prev, dateRange: validDateRange }));
                  // 日期范围变化后，图表会通过useEffect自动更新
                }}
                format="YYYY-MM-DD"
              />
            )}
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            <Button onClick={resetFilters}>重置</Button>
          </Space>
        </Card>

        {/* 统计概览 */}
        <Row gutter={20} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #6b73ff 0%, #8f93fb 100%)' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>{statistics.totalCount}</div>
              <div style={{ fontSize: 16 }}>请假总数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #ff7676 0%, #f54ea2 100%)' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>{statistics.sickCount}</div>
              <div style={{ fontSize: 16 }}>病假数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #42b4ff 0%, #4262ff 100%)' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>{statistics.personalCount}</div>
              <div style={{ fontSize: 16 }}>事假数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #ffb199 0%, #ff0844 100%)' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>{statistics.otherCount}</div>
              <div style={{ fontSize: 16 }}>其他请假</div>
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={20} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12}>
            <Card title="请假类型分布" styles={{header: {textAlign: 'center', fontWeight: 500}}}>
              <div ref={typeChartRef} className="chart-container"></div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="请假趋势" styles={{header: {textAlign: 'center', fontWeight: 500}}}>
              <div ref={trendChartRef} className="chart-container"></div>
            </Card>
          </Col>
        </Row>

        {/* 班级请假统计表格 */}
        <Card title="班级请假统计" style={{ marginBottom: 20 }} styles={{header: {fontWeight: 500}}}>
          <Table
            columns={classStatsColumns}
            dataSource={classStatsList}
            rowKey="classId"
            bordered
            scroll={{ x: 'max-content' }}
            pagination={false} // Vue版本似乎没有分页
          />
        </Card>

        {/* 学生请假排名表格 */}
        <Card title="学生请假排名" style={{ marginBottom: 20 }} styles={{header: {fontWeight: 500}}}>
          <Table
            columns={studentRankColumns}
            dataSource={studentRankList}
            rowKey="studentId"
            bordered
            scroll={{ x: 'max-content' }}
            pagination={{
              current: studentRankPage.currentPage,
              pageSize: studentRankPage.pageSize,
              total: studentRankPage.total,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page: number, pageSize: number) => {
                console.log(`学生排名分页变化: 页码=${page}, 每页条数=${pageSize}`);
                setStudentRankPage({ 
                  currentPage: page, 
                  pageSize: pageSize || studentRankPage.pageSize, 
                  total: studentRankPage.total 
                });
                // 页码变化会通过useEffect触发loadStudentRanking
              },
              onShowSizeChange: (current: number, size: number) => {
                console.log(`学生排名每页条数变化: 页码=${current}, 新的每页条数=${size}`);
                setStudentRankPage({ 
                  currentPage: 1, // 改为重置到第一页
                  pageSize: size, 
                  total: studentRankPage.total 
                });
                // 每页条数变化会通过useEffect触发loadStudentRanking
              },
              showTotal: (total: number) => `共 ${total} 条`,
            }}
          />
        </Card>
        
        {/* 班级详情对话框 */}
        <Modal
          title="班级请假详情"
          open={classDetailVisible}
          onCancel={handleClassDialogClosed}
          footer={null} // 无底部按钮
          width="80%"
          destroyOnHidden // 替换过时的 destroyOnClose
          style={{ top: 20 }}
          zIndex={1050}
          centered
          className="leave-statistics-modal"
        >
          {selectedClass && (
            <div className="class-detail">
              <Descriptions title={selectedClass.className} bordered column={3} style={{marginBottom: 20}}>
                <Descriptions.Item label="班级人数">{selectedClass.totalStudents}</Descriptions.Item>
                <Descriptions.Item label="请假人数">{selectedClass.leaveStudents}</Descriptions.Item>
                <Descriptions.Item label="请假率">{selectedClass.leaveRate}%</Descriptions.Item>
              </Descriptions>
              <Tabs defaultActiveKey="stats">
                <TabPane tab="请假统计" key="stats">
                  <Descriptions bordered column={3}>
                    <Descriptions.Item label="请假总次数">{selectedClass.leaveCount}</Descriptions.Item>
                    <Descriptions.Item label="请假总天数">{selectedClass.totalDays}</Descriptions.Item>
                    <Descriptions.Item label="人均请假天数">{selectedClass.avgLeaveDays}</Descriptions.Item>
                    <Descriptions.Item label="病假次数">{selectedClass.sickLeaveCount}</Descriptions.Item>
                    <Descriptions.Item label="事假次数">{selectedClass.personalLeaveCount}</Descriptions.Item>
                    <Descriptions.Item label="其他请假次数">{selectedClass.otherLeaveCount}</Descriptions.Item>
                  </Descriptions>
                </TabPane>
                <TabPane tab="班级学生请假排名" key="ranking">
                  <Spin spinning={classStudentsLoading}>
                    <Table
                      columns={studentRankColumns.filter(col => col.key !== 'action').map(col => ({...col, fixed: col.fixed ? col.fixed as 'left' | 'right' | undefined : undefined}))}
                      dataSource={classStudentsList}
                      rowKey="studentId"
                      bordered
                      pagination={false}
                    />
                  </Spin>
                </TabPane>
              </Tabs>
            </div>
          )}
        </Modal>

        {/* 学生详情对话框 */}
        <Modal
          title="学生请假详情"
          open={studentDetailVisible}
          onCancel={handleStudentDialogClosed}
          footer={null}
          width="80%"
          destroyOnHidden
          style={{ top: 20 }}
          zIndex={1050}
          centered
          className="leave-statistics-modal"
        >
          {selectedStudent && (
            <div className="student-detail">
               <Descriptions title={selectedStudent.studentName} bordered column={3} style={{marginBottom: 20}}>
                <Descriptions.Item label="班级">{selectedStudent.className}</Descriptions.Item>
                <Descriptions.Item label="请假总次数">{selectedStudent.leaveCount}</Descriptions.Item>
                <Descriptions.Item label="请假总天数">{selectedStudent.totalDays}</Descriptions.Item>
              </Descriptions>
              <Tabs defaultActiveKey="stats">
                <TabPane tab="请假统计" key="stats">
                   <Descriptions bordered column={3}>
                    <Descriptions.Item label="病假次数">{selectedStudent.sickLeaveCount}</Descriptions.Item>
                    <Descriptions.Item label="事假次数">{selectedStudent.personalLeaveCount}</Descriptions.Item>
                    <Descriptions.Item label="其他请假次数">{selectedStudent.otherLeaveCount}</Descriptions.Item>
                  </Descriptions>
                </TabPane>
                <TabPane tab="请假记录" key="records">
                  <Spin spinning={studentLeavesLoading}>
                    <Table
                      columns={studentLeavesColumns}
                      dataSource={studentLeavesList}
                      rowKey="id"
                      bordered
                      pagination={{
                        current: studentLeavesPage.currentPage,
                        pageSize: studentLeavesPage.pageSize,
                        total: studentLeavesPage.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: handleStudentLeavesPageChange,
                        onShowSizeChange: (current: number, size: number) => handleStudentLeavesPageChange(1, size), // 页大小变化重置到第一页
                        showTotal: (total: number) => `共 ${total} 条`,
                      }}
                    />
                  </Spin>
                </TabPane>
              </Tabs>
            </div>
          )}
        </Modal>

      </Spin>
    </div>
  );
};

export default LeaveStatistics; 