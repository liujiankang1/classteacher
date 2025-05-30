import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  FormHelperText,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Tab,
  Tabs,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  LocalFlorist as LocalFloristIcon
} from '@mui/icons-material';
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import dayjs from 'dayjs';
import { zhCN } from 'date-fns/locale';
// 导入API服务
import * as classAPI from '../api/class';
import * as rewardAPI from '../api/rewardAPI';
import { formatDate, getCurrentMonthRange, getCurrentWeekRange, getCurrentSemesterRange } from '../utils/dateUtils';

// 定义班级对象类型
interface ClassItem {
  id: number | string;
  name?: string;
  className?: string;
  [key: string]: any;
}

// 定义统计数据类型
interface StatisticsData {
  studentCount?: number;
  totalFlowers?: number;
  todayFlowers?: number;
  averageFlowers?: number;
  maxFlowers?: number;
  studentRankings?: any[];
  reasonDistribution?: Record<string, number>;
  [key: string]: any;
}

// 在组件顶部添加接口定义
interface ClassOption { 
  label: string; 
  value: string; 
}

interface StudentOption { 
  label: string; 
  value: string; 
}

interface StudentRank {
  id: number;
  studentId: number;
  name: string;
  className: string;
  flowerCount: number;
  lastRewardDate: string;
}

const RewardManagement = () => {
  const [loading, setLoading] = useState(false);
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [isStudentSelectReady, setIsStudentSelectReady] = useState(false);
  const [currentClass, setCurrentClass] = useState<string>('');
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [studentCount, setStudentCount] = useState<number>(0);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [statistics, setStatistics] = useState({
    totalFlowers: 0,
    todayFlowers: 0,
    averageFlowers: 0,
    maxFlowers: 0
  });
  const [currentPeriod, setCurrentPeriod] = useState<string>('WEEK');
  const [studentRankList, setStudentRankList] = useState<StudentRank[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [flowerCount, setFlowerCount] = useState<number>(1);
  const [rewardReason, setRewardReason] = useState<string>('课堂表现优秀');
  const [rewardDate, setRewardDate] = useState<Date | null>(new Date());
  const [isRewardModalVisible, setIsRewardModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tabValue, setTabValue] = useState<string>('WEEK');
  const [rewardRemark, setRewardRemark] = useState<string>('');
  
  // 添加Snackbar状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });

  // 使用useRef来跟踪是否已经初始化和表单引用
  const initializedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsType | null>(null);

  // 在组件状态声明区域添加日期范围状态
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [isCustomDateRange, setIsCustomDateRange] = useState<boolean>(false);

  // 用于跟踪下载操作是否正在进行中
  const [isExporting, setIsExporting] = useState(false);

  // 显示消息提示
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // 渲染图表函数
  const renderChart = useCallback((reasonDistribution: Record<string, number>) => {
    // 安全检查：确保组件尚未卸载
    if (!chartRef.current) {
      console.warn('图表容器引用为空，无法渲染图表');
      return;
    }

    // 检查容器是否已连接到DOM
    if (!document.body.contains(chartRef.current)) {
      console.warn('图表容器不在DOM中，可能组件已卸载，取消渲染');
      return;
    }

    // 检查容器大小
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('图表容器尺寸为0，无法正常渲染图表:', containerWidth, containerHeight);
      return; // 确保在此处返回，防止在0尺寸容器上初始化ECharts
    }

    try {
      console.log('开始渲染图表，数据:', reasonDistribution);
      
      // 确保在创建新图表前销毁旧图表
      if (chartInstance.current) {
        console.log('销毁旧图表实例');
        try {
        chartInstance.current.dispose();
        } catch (disposeError) {
          console.error('销毁旧图表实例失败:', disposeError);
        } finally {
          chartInstance.current = null;
        }
      }

      // 创建新图表
      console.log('图表容器尺寸:', containerWidth, containerHeight);
      try {
      const chart = echarts.init(chartRef.current);
      chartInstance.current = chart;

        // 转换数据格式 - 添加默认空对象防止reasonDistribution为undefined
        const pieData = Object.entries(reasonDistribution || {}).map(([name, value]) => ({
        name,
        value
      }));
        
        console.log('转换后的图表数据:', pieData);

      // 图表配置
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '小红花发放原因',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData.length > 0 ? pieData : [
              { value: 0, name: '暂无数据' }
            ]
          }
        ]
      };

        console.log('设置图表配置:', option);
      chart.setOption(option);
        console.log('图表渲染完成');
      } catch (initError) {
        console.error('创建或初始化图表失败:', initError);
        if (chartInstance.current) {
          try {
            chartInstance.current.dispose();
          } catch (e) {
            // 忽略清理错误
          }
          chartInstance.current = null;
        }
      }
    } catch (error) {
      console.error('渲染图表过程中出错:', error);
      // 确保在出错时清理图表实例
      if (chartInstance.current) {
        try {
          chartInstance.current.dispose();
        } catch (e) {
          // 忽略清理错误
        }
        chartInstance.current = null;
      }
    }
  }, []);

  // 获取班级学生列表的专用函数
  const fetchClassStudents = useCallback(async (classId: string) => {
    if (!classId || isStudentLoading) {
      console.warn('无效的班级ID或正在加载中，无法获取学生列表');
      setIsStudentSelectReady(false);
      return;
    }
    
    console.log(`开始获取班级ID=${classId}的学生列表`);
    try {
      setIsStudentLoading(true);
      const studentsResponse = await classAPI.getStudentSelectOptions(classId);
      console.log('班级学生下拉选项原始响应:', studentsResponse);
      
      if (!studentsResponse || !studentsResponse.data) {
        throw new Error('获取学生列表响应无效');
      }
      
      const students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];
      console.log('解析后的学生列表数据:', students);
      
      if (students.length === 0) {
        console.warn('班级学生列表为空');
        setStudentOptions([]);
        setIsStudentSelectReady(false);
        return;
      }
      
      const studentOpts: StudentOption[] = students
        .filter((student: any): student is { id: number | string; name: string; studentNumber: string } => 
          Boolean(student.id && student.name && student.studentNumber))
        .map((student) => ({
          label: `${student.name} (${student.studentNumber})`,
          value: student.id.toString()
        }));
      
      console.log('最终生成的学生选项列表:', studentOpts);
      if (studentOpts.length > 0) {
        setStudentOptions(studentOpts);
        setIsStudentSelectReady(true);
        console.log('studentOptions 已更新，当前值:', studentOpts);
      } else {
        console.warn('没有生成有效的学生选项');
        setStudentOptions([]);
        setIsStudentSelectReady(false);
      }
    } catch (err) {
      console.error('获取班级学生列表出错:', err);
      showSnackbar('获取学生列表失败，请稍后重试', 'error');
      setStudentOptions([]);
      setIsStudentSelectReady(false);
    } finally {
      setIsStudentLoading(false);
    }
  }, [isStudentLoading]);

  // 获取班级统计数据的函数
  const getClassStatistics = useCallback(async (classId: string, overridePeriod?: string) => {
    if (!classId) {
      console.warn('无效的班级ID，无法获取统计数据');
      return;
    }
    
    // 如果是自定义日期范围但没有选择日期，提示用户
    if (overridePeriod === 'CUSTOM' && (!dateRange[0] || !dateRange[1])) {
      showSnackbar('请先选择自定义日期范围', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // 使用覆盖的period值或当前状态中的值
      const periodToUse = overridePeriod || tabValue || currentPeriod;
      console.log(`开始获取班级ID=${classId}的统计数据，时间段=${periodToUse}`);
      
      // 获取日期范围
      let startDate, endDate;
      switch (periodToUse) {
        case 'WEEK':
          [startDate, endDate] = getCurrentWeekRange();
          break;
        case 'MONTH':
          [startDate, endDate] = getCurrentMonthRange();
          break;
        case 'CUSTOM':
          // 对于自定义日期范围，我们使用dateRange状态的值
          if (dateRange[0] && dateRange[1]) {
            [startDate, endDate] = [dateRange[0], dateRange[1]];
          } else {
            [startDate, endDate] = getCurrentWeekRange();
          }
          break;
        default:
          [startDate, endDate] = getCurrentWeekRange();
      }

      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      // 构建请求参数
      const requestParams = {
        classId,
        period: periodToUse,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };
      
      console.log('统计数据请求参数:', requestParams);

      // 获取班级奖励统计数据
      const response = await rewardAPI.getRewardStatistics(requestParams);

      console.log('班级统计数据响应:', response);
      
      let statisticsData: StatisticsData = {};
      if (response && response.data) {
        if (response.data.data) {
          statisticsData = response.data.data as StatisticsData;
        } else if (response.data.success !== undefined) {
          statisticsData = response.data as StatisticsData;
        }
      }
      
      if (statisticsData) {
        console.log('解析后的统计数据:', statisticsData);
        
        // 更新学生数量
        setStudentCount(statisticsData.studentCount || 0);
        
        // 更新统计数据
        setStatistics({
          totalFlowers: statisticsData.totalFlowers || 0,
          todayFlowers: statisticsData.todayFlowers || 0,
          averageFlowers: typeof statisticsData.averageFlowers === 'number' ? statisticsData.averageFlowers : 0,
          maxFlowers: statisticsData.maxFlowers || 0
        });
        
        // 更新学生排名列表
        if (statisticsData.studentRankings && Array.isArray(statisticsData.studentRankings)) {
          const rankings = statisticsData.studentRankings.map((student: any, index: number) => ({
            id: index + 1,
            studentId: student.studentId || student.id,
            name: student.studentName || student.name,
            className: student.className || currentClass,
            flowerCount: student.flowerCount || 0,
            lastRewardDate: student.lastRewardDate || '未知'
          }));
          setStudentRankList(rankings);
        }
        
        // 渲染图表
        if (statisticsData.reasonDistribution) {
          console.log('获取到原因分布数据，准备渲染图表:', statisticsData.reasonDistribution);
          renderChart(statisticsData.reasonDistribution);
        } else {
          console.warn('未获取到原因分布数据');
          renderChart({});
        }
      } else {
        console.warn('未获取到有效的统计数据');
        showSnackbar('未获取到班级统计数据', 'warning');
        
        // 重置数据
        setStudentCount(0);
        setStatistics({
          totalFlowers: 0,
          todayFlowers: 0,
          averageFlowers: 0,
          maxFlowers: 0
        });
        setStudentRankList([]);
        renderChart({});
      }
    } catch (error) {
      console.error('获取班级统计数据失败:', error);
      showSnackbar('获取班级统计数据失败，请稍后重试', 'error');
      
      // 重置数据
      setStudentCount(0);
      setStatistics({
        totalFlowers: 0,
        todayFlowers: 0,
        averageFlowers: 0,
        maxFlowers: 0
      });
      setStudentRankList([]);
      renderChart({});
    } finally {
      setLoading(false);
    }
  }, [renderChart, currentClass, dateRange, showSnackbar, tabValue, currentPeriod]);

  // 获取班级列表函数
  const getClassList = useCallback(async () => {
    if (isClassLoading || initializedRef.current) {
      console.log('班级列表正在加载中或已初始化，跳过重复请求');
      return;
    }
    
    try {
      setIsClassLoading(true);
      const response = await classAPI.getAllClasses();
      console.log('班级API响应:', response);
      
      // 处理不同的响应数据结构
      let classes: ClassItem[] = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          classes = response.data as ClassItem[];
        } else if (response.data.data && Array.isArray(response.data.data)) {
          classes = response.data.data as ClassItem[];
        } else if (response.data.content && Array.isArray(response.data.content)) {
          classes = response.data.content as ClassItem[];
        } else if (typeof response.data === 'object') {
          console.log('响应结构不是预期的数组格式，尝试从对象中提取数据');
          const possibleArrayFields = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrayFields.length > 0) {
            classes = possibleArrayFields[0] as ClassItem[];
          }
        }
      }
      
      console.log('解析后的班级数据:', classes);
      
      if (classes && classes.length > 0) {
        // 将班级数据转换为下拉选项格式
        const classOpts = classes.map((cls: ClassItem) => ({
          label: cls.name || cls.className || '未命名班级',
          value: String(cls.id),
        }));
        setClassOptions(classOpts);
        
        // 只有在没有当前班级时才设置默认班级
        if (!currentClassId) {
          const firstClass = classes[0];
          const firstClassId = String(firstClass.id);
          const firstClassName = firstClass.name || firstClass.className || '未命名班级';
          
          setCurrentClass(firstClassName);
          setCurrentClassId(firstClassId);
          
          // 获取该班级的学生列表和统计数据
          console.log('初始化时获取第一个班级的学生列表和统计数据');
          await fetchClassStudents(firstClassId);
          await getClassStatistics(firstClassId);
        }
        
        // 标记为已初始化
        initializedRef.current = true;
      } else {
        console.warn('未获取到班级数据或班级列表为空');
        showSnackbar('未找到班级数据，请先创建班级', 'warning');
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
      showSnackbar('获取班级列表失败，请检查网络连接或服务器状态', 'error');
    } finally {
      setIsClassLoading(false);
    }
  }, [currentClassId, getClassStatistics, fetchClassStudents, isClassLoading]);

  // 班级选择变更处理函数
  const handleClassChange = useCallback(async (value: string) => {
    if (isClassLoading || isStudentLoading) {
      console.log('正在加载中，忽略班级切换请求');
      return;
    }
    
    // 如果选择的是当前班级，不做任何操作
    if (value === currentClassId) {
      console.log('选择的是当前班级，无需切换');
      return;
    }
    
    console.log('开始切换班级:', value);
    const selectedClass = classOptions.find(c => c.value === value);
    if (selectedClass) {
      try {
        setIsClassLoading(true);
        setIsStudentLoading(true);
        
        // 重置所有相关状态
        setIsStudentSelectReady(false);
        setSelectedStudent('');
        setStudentOptions([]);
        
        // 更新班级信息
        setCurrentClass(selectedClass.label);
        setCurrentClassId(value);
        
        // 获取新班级的学生列表
        console.log('开始获取新班级的学生列表');
        await fetchClassStudents(value);
        
        // 获取新班级的统计数据
        console.log('开始获取新班级的统计数据');
        await getClassStatistics(value);
      } catch (error) {
        console.error('切换班级时发生错误:', error);
        showSnackbar('切换班级失败，请稍后重试', 'error');
      } finally {
        setIsClassLoading(false);
        setIsStudentLoading(false);
      }
    }
  }, [isClassLoading, isStudentLoading, currentClassId, classOptions, fetchClassStudents, getClassStatistics]);

  // 组件挂载和卸载的清理
  useEffect(() => {
    console.log('组件挂载 - 设置全局清理');
    
    // 组件卸载时的清理函数
    return () => {
      console.log('组件卸载 - 执行全局清理');
      
      // 确保清理图表实例
      if (chartInstance.current) {
        try {
          console.log('组件卸载 - 清理图表实例');
          chartInstance.current.dispose();
          chartInstance.current = null;
        } catch (error) {
          console.error('图表实例清理失败:', error);
        }
      }
      
      // 清理任何可能的定时器
      const timers = [];
      // 可以在这里添加其他定时器...
      
      // 清理所有定时器
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // 窗口大小变化时重新渲染图表
  useEffect(() => {
    const initializeData = async () => {
      // 使用 initializedRef 来确保 getClassList 只在必要时调用
      if (classOptions.length === 0 && !initializedRef.current) {
        console.log('首次加载班级列表');
        await getClassList(); // getClassList 内部会设置 initializedRef.current
      }
    };
    initializeData();

    const handleResize = () => {
      // 确保图表实例存在，图表容器存在于DOM中，可见，并且有有效尺寸
      if (chartInstance.current && 
          chartRef.current && 
          chartRef.current.offsetParent !== null && // Check for visibility
          chartRef.current.clientWidth > 0 && 
          chartRef.current.clientHeight > 0) {
        console.log('窗口大小变化，重新调整图表大小');
        chartInstance.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // 添加一个延时调用，确保图表在初始渲染后，容器尺寸稳定时能正确调整大小
    const timer = setTimeout(() => {
      // 只有当图表实例已创建时才调用resize
      if (chartInstance.current) {
         console.log('延时调整图表大小');
        handleResize(); // 使用与resize事件相同的处理函数
      }
    }, 500);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      // 不在此处销毁图表实例。
      // renderChart 函数在需要时会处理旧实例的销毁和新实例的创建。
      // 组件卸载时的 useEffect (依赖项为空数组的那个) 会负责最终的图表销毁。
    };
  }, [getClassList, classOptions.length]); // 依赖 getClassList (用于初始化逻辑) 和 classOptions.length (同样用于初始化逻辑)

  // 获取学生排名数据
  const getStudentRankList = useCallback(async () => {
    if (!currentClassId) return;
    
    setLoading(true);
    try {
      // 获取日期范围
      let startDate, endDate;
      switch (currentPeriod) {
        case 'WEEK':
          [startDate, endDate] = getCurrentWeekRange();
          break;
        case 'MONTH':
          [startDate, endDate] = getCurrentMonthRange();
          break;
        case 'SEMESTER':
          [startDate, endDate] = getCurrentSemesterRange();
          break;
        default:
          [startDate, endDate] = getCurrentWeekRange();
      }

      // 获取学生排名
      const response = await rewardAPI.getStudentRanking({
        classId: currentClassId,
        period: currentPeriod,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      });

      if (response && response.data && response.data.data && response.data.data.content) {
        const rankings = response.data.data.content.map((student: any, index: number) => ({
          id: index + 1,
          studentId: student.studentId,
          name: student.studentName,
          className: student.className,
          flowerCount: student.flowerCount,
          lastRewardDate: student.lastRewardDate
        }));
        setStudentRankList(rankings);
      }
      setLoading(false);
    } catch (error) {
      console.error('获取学生排名数据失败:', error);
      showSnackbar('获取学生排名数据失败', 'error');
      setLoading(false);
    }
  }, [currentClassId, currentPeriod]);

  // 清除表单错误
  const clearFormErrors = () => {
    setFormErrors({});
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedStudent) {
      errors.studentId = '请选择学生';
    }
    
    if (!flowerCount || flowerCount < 1) {
      errors.flowerCount = '请输入有效的小红花数量';
    }
    
    if (!rewardReason) {
      errors.reason = '请选择发放原因';
    }
    
    if (!rewardDate) {
      errors.rewardDate = '请选择发放日期';
    }
    
    // 备注不是必填项，无需验证
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理发放小红花
  const handleRewardFlower = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      // 准备请求数据
      const rewardData = {
        studentId: selectedStudent,
        flowerCount,
        reason: rewardReason,
        rewardDate: formatDate(rewardDate || new Date()),
        description: rewardReason, // 保持使用description存储发放原因
        remark: rewardRemark // 使用新字段存储备注
      };

      // 发送请求
      const response = await rewardAPI.createReward(rewardData);
      
      // 增强的响应处理
      if (response && response.data) {
        const isSuccess = response.data.success !== undefined ? response.data.success : 
                        (response.data.code >= 200 && response.data.code < 300);
        
        if (isSuccess) {
          showSnackbar(`成功为学生发放 ${flowerCount} 朵小红花`);
        
        // 重新加载数据
        getClassStatistics(currentClassId);
        
          // 重置表单并关闭对话框
        setSelectedStudent('');
        setFlowerCount(1);
          setRewardReason('课堂表现优秀');
          setRewardDate(new Date());
          setRewardRemark(''); // 重置备注
          setIsRewardModalVisible(false);
          clearFormErrors();
      } else {
          // 显示后端返回的错误消息
          const errorMsg = response.data.message || '发放小红花失败';
          showSnackbar(errorMsg, 'error');
      }
      } else {
        showSnackbar('发放小红花失败', 'error');
      }
    } catch (error: any) {
      console.error('发放小红花失败:', error);
      // 提取并显示详细错误信息
      let errorMessage = '发放小红花失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 打开发放小红花对话框
  const showRewardModal = () => {
    clearFormErrors();
    formRef.current?.resetFields();
    setSelectedStudent('');
    setFlowerCount(1);
    setRewardReason('课堂表现优秀');
    setRewardDate(new Date());
    setRewardRemark(''); // 重置备注
    setIsRewardModalVisible(true);
  };

  // 关闭发放小红花对话框
  const handleCancelReward = () => {
    setIsRewardModalVisible(false);
    clearFormErrors();
    formRef.current?.resetFields();
  };

  // 处理表单字段变化
  const handleFormChange = (changedValues: any, allValues: any) => {
    // 清除对应字段的错误
    Object.keys(changedValues).forEach(key => {
      if (formErrors[key]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    });
  };

  // 处理时间段变更
  const handlePeriodChange = (period: string) => {
    console.log(`处理时间段变更: ${period}`);
    if (currentClassId) {
      getClassStatistics(currentClassId, period);
    }
  };

  // 导出数据
  const handleExportData = async () => {
    if (!currentClassId) {
      showSnackbar('请先选择班级', 'warning');
      return;
    }

    // 防止重复点击
    if (isExporting) {
      console.log('导出操作正在进行中，忽略重复点击');
      return;
    }

    try {
      setIsExporting(true);
      setLoading(true);
      
      // 构建导出请求参数
      const exportParams: any = {
        classId: currentClassId,
        period: tabValue // 使用tabValue代替currentPeriod
      };
      
      // 如果是自定义日期范围，添加日期参数
      if (tabValue === 'CUSTOM' && dateRange[0] && dateRange[1]) {
        exportParams.startDate = formatDate(dateRange[0]);
        exportParams.endDate = formatDate(dateRange[1]);
      }
      
      console.log('导出数据请求参数:', exportParams);
      
      const response = await rewardAPI.exportRewardStatistics(exportParams);
      
      // 处理文件下载 - 使用更安全的方式
      const blob = response.data; // response.data已经是blob
      const url = window.URL.createObjectURL(blob);
      const fileName = `小红花统计数据_${currentClass}_${dayjs().format('YYYYMMDD')}.xlsx`;
      
      // 使用一个独立的函数处理下载，确保即使组件卸载也能完成操作
      const performDownload = () => {
        try {
          // 创建一个新的a元素，而不是重用变量
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = fileName;
          downloadLink.style.display = 'none'; // 隐藏元素
          
          // 添加到DOM前检查document是否可用
          if (document && document.body) {
            document.body.appendChild(downloadLink);
            
            // 触发点击并立即移除
            try {
              downloadLink.click();
              // 延迟一点时间再移除元素和释放URL，防止下载未开始就清理资源
              setTimeout(() => {
                try {
                  // 检查元素是否仍然存在于DOM中
                  if (document && document.body && document.body.contains(downloadLink)) {
                    document.body.removeChild(downloadLink);
                  }
                } catch (removeError) {
                  console.error('移除下载链接元素失败:', removeError);
                }
                
                try {
      window.URL.revokeObjectURL(url);
                } catch (revokeError) {
                  console.error('释放Blob URL失败:', revokeError);
                }
              }, 300);
            } catch (clickError) {
              console.error('下载点击操作失败:', clickError);
              // 确保即使点击失败也能清理资源
              try {
                if (document && document.body && document.body.contains(downloadLink)) {
                  document.body.removeChild(downloadLink);
                }
              } catch (e) {
                console.error('移除下载链接元素失败:', e);
              }
              
              try {
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error('释放Blob URL失败:', e);
              }
            }
          } else {
            console.error('无法添加下载链接到DOM，document.body不可用');
            window.URL.revokeObjectURL(url);
          }
        } catch (downloadError) {
          console.error('执行下载操作失败:', downloadError);
          try {
            window.URL.revokeObjectURL(url);
          } catch (e) {
            // 忽略
          }
        }
      };
      
      // 执行下载
      performDownload();
      
      showSnackbar('导出成功');
    } catch (error) {
      console.error('导出数据失败:', error);
      showSnackbar('导出数据失败', 'error');
    } finally {
      setLoading(false);
      setIsExporting(false);
    }
  };

  // 处理自定义日期范围查询
  const getCustomRangeStatistics = useCallback(async (classId: string, startDate: Date, endDate: Date) => {
    if (!classId) {
      console.warn('无效的班级ID，无法获取统计数据');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`开始获取班级ID=${classId}的自定义日期范围统计数据:`, {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      });
      
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      // 构建请求参数
      const requestParams = {
        classId,
        period: 'CUSTOM', // 使用CUSTOM表示自定义日期范围
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };
      
      console.log('自定义日期范围统计数据请求参数:', requestParams);

      // 获取班级奖励统计数据
      const response = await rewardAPI.getRewardStatistics(requestParams);

      console.log('班级统计数据响应:', response);
      
      let statisticsData: StatisticsData = {};
      if (response && response.data) {
        if (response.data.data) {
          statisticsData = response.data.data as StatisticsData;
        } else if (response.data.success !== undefined) {
          statisticsData = response.data as StatisticsData;
        }
      }
      
      if (statisticsData) {
        console.log('解析后的统计数据:', statisticsData);
        
        // 更新学生数量
        setStudentCount(statisticsData.studentCount || 0);
        
        // 更新统计数据
        setStatistics({
          totalFlowers: statisticsData.totalFlowers || 0,
          todayFlowers: statisticsData.todayFlowers || 0,
          averageFlowers: typeof statisticsData.averageFlowers === 'number' ? statisticsData.averageFlowers : 0,
          maxFlowers: statisticsData.maxFlowers || 0
        });
        
        // 更新学生排名列表
        if (statisticsData.studentRankings && Array.isArray(statisticsData.studentRankings)) {
          const rankings = statisticsData.studentRankings.map((student: any, index: number) => ({
            id: index + 1,
            studentId: student.studentId || student.id,
            name: student.studentName || student.name,
            className: student.className || currentClass,
            flowerCount: student.flowerCount || 0,
            lastRewardDate: student.lastRewardDate || '未知'
          }));
          setStudentRankList(rankings);
        }
        
        // 渲染图表
        if (statisticsData.reasonDistribution) {
          renderChart(statisticsData.reasonDistribution);
        } else {
          console.warn('未获取到原因分布数据');
          renderChart({});
        }
      } else {
        console.warn('未获取到有效的统计数据');
        showSnackbar('未获取到班级统计数据', 'warning');
        
        // 重置数据
        setStudentCount(0);
        setStatistics({
          totalFlowers: 0,
          todayFlowers: 0,
          averageFlowers: 0,
          maxFlowers: 0
        });
        setStudentRankList([]);
        renderChart({});
      }
    } catch (error) {
      console.error('获取自定义日期范围统计数据失败:', error);
      showSnackbar('获取统计数据失败，请稍后重试', 'error');
      
      // 重置数据
      setStudentCount(0);
      setStatistics({
        totalFlowers: 0,
        todayFlowers: 0,
        averageFlowers: 0,
        maxFlowers: 0
      });
      setStudentRankList([]);
      renderChart({});
    } finally {
      setLoading(false);
    }
  }, [renderChart, currentClass, showSnackbar]);

  // 发放小红花对话框
  const renderRewardModal = () => {
  return (
      <Dialog
        open={isRewardModalVisible}
        onClose={handleCancelReward}
        maxWidth="md"
        fullWidth
        aria-labelledby="reward-dialog-title"
      >
        <DialogTitle id="reward-dialog-title">
          <Typography variant="h5">发放小红花</Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" ref={formRef} sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <FormControl fullWidth error={!!formErrors.studentId}>
                <InputLabel id="student-select-label">学生姓名</InputLabel>
                {isStudentSelectReady ? (
              <Select
                    labelId="student-select-label"
                    value={selectedStudent || ''}
                    onChange={(e) => {
                      const value = e.target.value as string;
                      console.log('选择学生:', value);
                      setSelectedStudent(value);
                      if (formErrors.studentId) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.studentId;
                          return newErrors;
                        });
                      }
                    }}
                    label="学生姓名"
                  >
                    {studentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                <Select
                    labelId="student-select-label"
                    value=""
                    label="学生姓名"
                    disabled
                  >
                    <MenuItem value="">加载中...</MenuItem>
                  </Select>
                )}
                {formErrors.studentId && <FormHelperText>{formErrors.studentId}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={!!formErrors.flowerCount}>
                <TextField
                  label="小红花数量"
                  type="number"
                  value={flowerCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFlowerCount(isNaN(value) ? 1 : Math.max(1, value));
                    if (formErrors.flowerCount) {
                      setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.flowerCount;
                        return newErrors;
                      });
                    }
                  }}
                  InputProps={{
                    inputProps: { min: 1, max: 100 }
                  }}
                  variant="outlined"
                />
                {formErrors.flowerCount && <FormHelperText>{formErrors.flowerCount}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={!!formErrors.reason}>
                <InputLabel id="reason-select-label">发放原因</InputLabel>
                <Select
                  labelId="reason-select-label"
                  value={rewardReason}
                  onChange={(e) => {
                    setRewardReason(e.target.value);
                    if (formErrors.reason) {
                      setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.reason;
                        return newErrors;
                      });
                    }
                  }}
                  label="发放原因"
                >
                  <MenuItem value="课堂表现优秀">课堂表现优秀</MenuItem>
                  <MenuItem value="作业完成出色">作业完成出色</MenuItem>
                  <MenuItem value="积极参与活动">积极参与活动</MenuItem>
                  <MenuItem value="其他表现">其他表现</MenuItem>
                </Select>
                {formErrors.reason && <FormHelperText>{formErrors.reason}</FormHelperText>}
              </FormControl>

              {/* 添加备注输入框 */}
              <FormControl fullWidth>
                <TextField
                  label="备注说明"
                  multiline
                  rows={3}
                  value={rewardRemark}
                  onChange={(e) => setRewardRemark(e.target.value)}
                  placeholder="请输入更详细的奖励说明（选填）"
                  variant="outlined"
                  helperText="最多200字"
                  inputProps={{ maxLength: 200 }}
                />
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
                <FormControl fullWidth error={!!formErrors.rewardDate}>
                <DatePicker
                    label="发放日期"
                    value={rewardDate}
                    onChange={(date) => {
                      setRewardDate(date);
                      if (formErrors.rewardDate) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.rewardDate;
                          return newErrors;
                        });
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: !!formErrors.rewardDate,
                        helperText: formErrors.rewardDate
                      }
                    }}
                  />
                </FormControl>
              </LocalizationProvider>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReward} color="inherit">
            取消
          </Button>
              <Button 
                onClick={handleRewardFlower}
            variant="contained" 
            color="primary"
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={24} /> : null}
          >
            发放
              </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Snackbar消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* 顶部班级选择和学生数量 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl sx={{ width: 200 }}>
            <InputLabel id="class-select-label">选择班级</InputLabel>
            <Select
              labelId="class-select-label"
              value={currentClassId}
              onChange={(e) => handleClassChange(e.target.value as string)}
              label="选择班级"
              disabled={isClassLoading}
            >
              {classOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography>
            当前班级：{currentClass} | 学生人数：{studentCount}
          </Typography>
        </Box>
      </Paper>

      {/* 统计卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 2 }}>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">本班级小红花总数</Typography>
              <Typography variant="h4" sx={{ color: '#3f8600', mt: 1 }}>{statistics.totalFlowers}</Typography>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">今日发放小红花数</Typography>
              <Typography variant="h4" sx={{ color: '#cf1322', mt: 1 }}>{statistics.todayFlowers}</Typography>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">平均每人小红花数</Typography>
              <Typography variant="h4" sx={{ color: '#1890ff', mt: 1 }}>{statistics.averageFlowers.toFixed(1)}</Typography>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">最多小红花数(学生)</Typography>
              <Typography variant="h4" sx={{ color: '#fa8c16', mt: 1 }}>{statistics.maxFlowers}</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

        {/* 学生小红花排行榜 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">学生小红花排行榜</Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={showRewardModal}
              startIcon={<LocalFloristIcon />}
              sx={{ mr: 1 }}
            >
              发放小红花
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExportData}
              startIcon={<DownloadIcon />}
              sx={{ mr: 1 }}
            >
              导出数据
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                if (currentClassId) {
                  if (tabValue === 'CUSTOM' && dateRange[0] && dateRange[1]) {
                    // 自定义日期范围查询
                    console.log('刷新：使用自定义日期范围查询');
                    getCustomRangeStatistics(currentClassId, dateRange[0], dateRange[1]);
                  } else {
                    // 使用标准时间段查询
                    console.log('刷新：使用标准时间段查询:', tabValue);
                    getClassStatistics(currentClassId, tabValue);
                  }
                } else {
                  showSnackbar('请先选择班级', 'warning');
                }
              }}
              startIcon={<RefreshIcon />}
            >
              刷新
            </Button>
          </Box>
        </Box>
        
          <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => {
            console.log(`切换到时间段: ${newValue}`);
            // 如果选择了自定义日期范围，设置标志位
            if (newValue === 'CUSTOM') {
              setIsCustomDateRange(true);
              setTabValue(newValue);
              setCurrentPeriod(newValue);
              // 如果已经选择了日期范围，则执行查询
              if (dateRange[0] && dateRange[1] && currentClassId) {
                getCustomRangeStatistics(currentClassId, dateRange[0], dateRange[1]);
              }
            } else {
              setIsCustomDateRange(false);
              // 先更新UI状态
              setTabValue(newValue);
              // 使用新值直接获取数据，而不是先更新currentPeriod状态
              if (currentClassId) {
                getClassStatistics(currentClassId, newValue);
              }
              // 最后更新currentPeriod状态以供其他地方使用
              setCurrentPeriod(newValue);
            }
          }}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab value="WEEK" label="本周" />
          <Tab value="MONTH" label="本月" />
          <Tab value="CUSTOM" label="自定义日期" />
        </Tabs>
        
        {/* 添加自定义日期范围选择器 */}
        {isCustomDateRange && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
              <DatePicker
                label="开始日期"
                value={dateRange[0]}
                onChange={(date) => {
                  setDateRange([date, dateRange[1]]);
                }}
                slotProps={{ textField: { size: 'small', sx: { mr: 2 } } }}
              />
              <DatePicker
                label="结束日期"
                value={dateRange[1]}
                onChange={(date) => {
                  setDateRange([dateRange[0], date]);
                }}
                slotProps={{ textField: { size: 'small', sx: { mr: 2 } } }}
              />
              <Button 
                variant="contained" 
                color="primary"
                disabled={!dateRange[0] || !dateRange[1]}
                onClick={() => {
                  if (dateRange[0] && dateRange[1] && currentClassId) {
                    // 设置Tab值和当前周期为CUSTOM
                    setTabValue('CUSTOM');
                    setCurrentPeriod('CUSTOM');
                    // 使用自定义日期范围获取数据
                    getCustomRangeStatistics(currentClassId, dateRange[0], dateRange[1]);
                  } else {
                    showSnackbar('请选择完整的日期范围', 'warning');
                  }
                }}
              >
                查询
              </Button>
            </LocalizationProvider>
          </Box>
        )}
        
        <TableContainer>
          <Table stickyHeader aria-label="学生排名表格">
            <TableHead>
              <TableRow>
                <TableCell>排名</TableCell>
                <TableCell>学生姓名</TableCell>
                <TableCell>班级</TableCell>
                <TableCell>小红花数量</TableCell>
                <TableCell>最近获得日期</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentRankList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                studentRankList.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.id}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#1890ff', fontWeight: 'bold' }}>
                        {student.flowerCount}
                      </Typography>
                    </TableCell>
                    <TableCell>{student.lastRewardDate}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

        {/* 小红花统计分析 */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Typography variant="h6" sx={{ mb: 2 }}>小红花统计分析</Typography>
        <Box
          sx={{ // Outer container for positioning
            position: 'relative', // For absolute positioning of loader
            height: 400,
            width: '100%',
          }}
        >
          {/* Loader: absolutely positioned on top */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional: semi-transparent overlay for better UX
                zIndex: 10, // Ensure it's on top
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {/* ECharts container: always present, loader is overlaid */}
          <Box
            ref={chartRef}
            sx={{
              height: '100%', // Takes full height of parent
              width: '100%',  // Takes full width of parent
            }}
          />
        </Box>
      </Paper>

      {/* 渲染发放小红花对话框 */}
      {renderRewardModal()}
    </Box>
  );
};

export default RewardManagement; 