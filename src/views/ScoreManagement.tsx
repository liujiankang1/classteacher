import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Stack,
  SelectChangeEvent,
  Snackbar,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  QuestionMark as QuestionMarkIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from 'date-fns/locale';
import axios from 'axios';

import * as examAPI from '../api/examAPI';
import * as scoreAPI from '../api/scoreAPI';
import * as studentAPI from '../api/student';
import { Exam, Score, Student, ScoreStatistics, ManualInputForm, ScoreSaveRequest } from '../types/score';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

// 扩展Student类型，添加comment和createdAt字段
interface ExtendedStudent extends Student {
  comment?: string;
  createdAt?: string;
}

const ScoreManagement: React.FC = () => {
  // 状态管理
  const [exams, setExams] = useState<Exam[]>([]);
  const [scores, setScores] = useState<ExtendedStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statistics, setStatistics] = useState<ScoreStatistics>({
    highest: 0,
    lowest: 0,
    average: 0
  });

  // 对话框状态
  const [scoreDialogVisible, setScoreDialogVisible] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedStudent | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  
  // 批量录入对话框状态
  const [batchDialogVisible, setBatchDialogVisible] = useState<boolean>(false);
  const [batchInputType, setBatchInputType] = useState<number>(1); // 1: Excel导入, 2: 手动录入
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchSelectedExam, setBatchSelectedExam] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // 手动录入表单数据
  const [manualInput, setManualInput] = useState<ManualInputForm>({
    studentNumber: '',
    studentName: '',
    scores: {}
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });

  // 添加学生列表状态
  const [students, setStudents] = useState<any[]>([]);
  const [searchStudentText, setSearchStudentText] = useState<string>('');
  const [selectedSearchStudent, setSelectedSearchStudent] = useState<any | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // 获取所有考试
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await examAPI.getAllExams();
      if (response.data && Array.isArray(response.data)) {
        setExams(response.data.map(exam => ({
          ...exam,
          name: exam.examName || exam.name,
          className: exam.classInfo?.className || '未知班级'
        })));
        
        // 检查URL参数中是否有examId
        const params = new URLSearchParams(location.search);
        const examIdFromRoute = params.get('examId');
        if (examIdFromRoute) {
          const examToSelect = response.data.find(e => String(e.id) === String(examIdFromRoute));
          if (examToSelect) {
            setSelectedExam(examToSelect.id);
          }
        }
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  // 获取考试成绩和详细信息
  const fetchExamScoresAndDetails = useCallback(async () => {
    if (!selectedExam) return;
    
    setLoading(true);
    setCurrentExam(null);
    setScores([]);
    
    try {
      const response = await examAPI.getExamById(selectedExam);
      const examData = response.data;
      
      if (examData) {
        // 映射考试科目数据，使用examSubject的ID而不是subject的ID
        const mappedSubjects = examData.examSubjects?.map(es => ({
          id: es.id || 0, // 使用examSubject的ID
          name: es.subjectName || es.subject?.name || '未命名科目',
          score: es.fullScore || 100
        })) || [];
        
        console.log('考试科目数据:', mappedSubjects);
        
        setCurrentExam({
          id: examData.id,
          name: examData.examName || examData.name,
          examDate: examData.examDate,
          className: examData.classInfo?.className || 'N/A',
          status: examData.status,
          subjects: mappedSubjects,
          classInfo: examData.classInfo
        });
        
        // 获取该考试下的成绩
        fetchScores();
      }
    } catch (error) {
      console.error('获取考试信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedExam]);

  // 获取成绩数据
  const fetchScores = useCallback(async () => {
    if (!currentExam || !currentExam.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await scoreAPI.getScoresByExamId(currentExam.id, currentPage - 1, pageSize, selectedSubject || undefined);
      
      if (response.data && response.data.content) {
        const studentScores = response.data.content;
        console.log('后端返回的学生成绩数据:', studentScores);
        console.log('当前考试科目:', currentExam.subjects);
        console.log('当前选中的科目ID:', selectedSubject);
        
        // 获取一个学生的成绩，查看科目ID
        if (studentScores.length > 0) {
          console.log('第一个学生的成绩:', studentScores[0].scores);
          console.log('可用的科目ID:', Object.keys(studentScores[0].scores));
        }
        
        // 直接使用后端返回的数据，只需要转换一下类型
        const processedScores = studentScores.map(student => ({
          ...student,
          // 确保scores是Record<number, number>类型
          scores: Object.entries(student.scores || {}).reduce((acc, [key, value]) => {
            acc[Number(key)] = value as number;
            return acc;
          }, {} as Record<number, number | null>)
        }));
        
        setScores(processedScores);
        setTotal(response.data.totalElements || processedScores.length);
        
        // 计算统计数据
        calculateStatistics(processedScores);
      }
    } catch (error) {
      console.error('获取成绩数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentExam, currentPage, pageSize, selectedSubject]);

  // 计算统计数据
  const calculateStatistics = (scoresData: ExtendedStudent[]) => {
    if (scoresData.length === 0) {
      setStatistics({
        highest: 0,
        lowest: 0,
        average: 0
      });
      return;
    }
    
    const highest = Math.max(...scoresData.map(score => score.totalScore));
    const lowest = Math.min(...scoresData.map(score => score.totalScore));
    
    const sum = scoresData.reduce((acc, score) => acc + score.totalScore, 0);
    const average = sum / scoresData.length;
    
    setStatistics({
      highest,
      lowest,
      average
    });
  };

  // 格式化日期
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    try {
      // 如果日期已经是格式化的字符串，检查格式是否符合要求
      if (typeof dateString === 'string' && dateString.includes('-')) {
        // 尝试解析并重新格式化，确保格式一致
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return formatDateToYYYYMMDD(date);
        }
        return dateString;
      }
      // 否则尝试转换为Date对象并格式化为yyyy-MM-dd
      const date = new Date(dateString);
      return formatDateToYYYYMMDD(date);
    } catch (e) {
      return '日期无效';
    }
  };

  // 将日期格式化为 yyyy-MM-dd
  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 状态样式和标签
  const getStatusType = (status: Exam['status']) => {
    switch (status) {
      case 'PENDING': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'FINISHED': return 'success';
      case 'GRADED': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Exam['status']) => {
    switch (status) {
      case 'PENDING': return '未开始';
      case 'IN_PROGRESS': return '进行中';
      case 'FINISHED': return '已结束';
      case 'GRADED': return '已评分';
      default: return '未知';
    }
  };

  // 是否是前三名学生
  const isTopStudent = (student: ExtendedStudent) => {
    return student.rank <= 3;
  };

  // 处理考试选择变化
  const handleExamChange = (event: SelectChangeEvent<number>) => {
    const examId = event.target.value as number;
    setSelectedExam(examId);
    setCurrentPage(1);
    setSelectedSubject(null);
  };

  // 处理科目选择变化
  const handleSubjectChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value;
    setSelectedSubject(value === 0 ? null : value as number);
    setCurrentPage(1); // 重置页码
  };

  // 分页处理
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleCurrentChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1);
  };

  // 处理成绩变更
  const handleScoreChange = (student: ExtendedStudent, subjectId: number, value: number) => {
    // 更新本地状态
    const updatedScores = [...scores];
    const studentIndex = updatedScores.findIndex(s => s.id === student.id);
    
    if (studentIndex !== -1) {
      // 更新成绩
      updatedScores[studentIndex].scores[subjectId] = value;
      
      // 重新计算总分
      let total = 0;
      Object.keys(updatedScores[studentIndex].scores).forEach(id => {
        total += updatedScores[studentIndex].scores[id] || 0;
      });
      updatedScores[studentIndex].totalScore = total;
      
      setScores(updatedScores);
      
      // 重新排序和更新排名
      const sortedScores = [...updatedScores].sort((a, b) => b.totalScore - a.totalScore);
      sortedScores.forEach((score, index) => {
        score.rank = index + 1;
      });
      
      // 更新统计数据
      calculateStatistics(sortedScores);
      
      // 保存成绩
      saveScore(student, subjectId, value);
    }
  };

  // 保存单个科目成绩
  const saveScore = async (student: ExtendedStudent, subjectId: number, value: number) => {
    if (!currentExam?.id) return;
    
    // 构建请求数据
    const scoreData: ScoreSaveRequest = {
      examId: currentExam.id,
      studentNumber: student.studentNumber,
      studentName: student.studentName,
      scores: { [subjectId]: value }
    };
    
    try {
      const response = await scoreAPI.saveStudentScore(scoreData);
      if (response.data && (response.data.code === 200 || response.status === 200)) {
        console.log('成绩保存成功');
      }
    } catch (error: any) {
      console.error('成绩保存失败:', error);
      showSnackbar(error.response?.data?.message || '成绩保存失败', 'error');
    }
  };

  // 编辑学生成绩
  const handleEditScore = (student: ExtendedStudent) => {
    setSelectedStudent({...student});
    setScoreDialogVisible(true);
  };

  // 显示提示信息
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 关闭提示信息
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // 保存学生成绩
  const saveStudentScore = async () => {
    if (!selectedStudent || !currentExam) return;
    setSubmitLoading(true);
    try {
      // 过滤掉 null 值，并将 number 转换为 float
      const filteredScores: Record<string, number> = {};
      Object.keys(selectedStudent.scores).forEach(subjectId => {
        const score = selectedStudent.scores[Number(subjectId)];
        if (score !== null && score !== undefined) {
          filteredScores[subjectId] = score;
        }
      });

      // 构建请求数据
      const scoreData = {
        examId: currentExam.id,
        studentNumber: selectedStudent.studentNumber,
        studentName: selectedStudent.studentName,
        scores: filteredScores
      };
      
      const response = await scoreAPI.saveStudentScore(scoreData);
      
      if (response.data && (response.data.code === 200 || response.status === 200)) {
        showSnackbar('保存成绩成功', 'success');
        setScoreDialogVisible(false);
        fetchScores();
      }
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || '保存成绩失败', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 批量录入成绩
  const handleBatchInput = () => {
    setBatchDialogVisible(true);
    setBatchInputType(1);
    setBatchSelectedExam(selectedExam);
    resetManualInput();
  };

  // 下载成绩导入模板
  const handleDownloadTemplate = () => {
    if (!batchSelectedExam) {
      return;
    }
    
    try {
      scoreAPI.downloadScoreTemplate(batchSelectedExam);
    } catch (error) {
      console.error('下载模板失败:', error);
    }
  };

  // 上传前检查
  const handleBeforeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!batchSelectedExam) {
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.type === 'application/vnd.ms-excel';
    if (!isExcel) {
      return;
    }
    
    setUploadFile(file);
  };

  // 确认批量录入
  const handleConfirmBatchInput = async () => {
    if (!batchSelectedExam) {
      showSnackbar('请选择考试', 'warning');
      return;
    }
    
    if (batchInputType === 1) {
      // Excel导入
      if (uploadFile) {
        setBatchLoading(true);
        try {
          console.log(`准备导入Excel成绩，考试ID: ${batchSelectedExam}, 文件名: ${uploadFile.name}`);
          const response = await scoreAPI.importScoresFromExcel(batchSelectedExam, uploadFile);
          console.log('导入成绩响应:', response);
          
          if (response.data && (response.data.code === 200 || response.status === 200)) {
            const result = response.data.data;
            console.log('导入结果详情:', result);
            
            let message = `成绩导入成功，共处理 ${result.totalCount} 条记录，成功 ${result.successCount} 条`;
            if (result.failCount > 0) {
              message += `，失败 ${result.failCount} 条`;
            }
            if (result.skipCount > 0) {
              message += `，跳过 ${result.skipCount} 条`;
            }
            
            if (result.errors && result.errors.length > 0) {
              console.log('导入错误:', result.errors);
              message += '。请查看控制台获取详细错误信息。';
            }
            
            showSnackbar(message, result.successCount > 0 ? 'success' : 'warning');
            
            if (result.successCount > 0) {
              setBatchDialogVisible(false);
              
              // 如果上传的成绩与当前选中的考试相同，则刷新成绩数据
              if (batchSelectedExam === selectedExam) {
                fetchExamScoresAndDetails();
              }
            }
          } else {
            console.error('导入成绩响应格式错误:', response);
            showSnackbar('导入失败，响应格式错误', 'error');
          }
        } catch (error: any) {
          console.error('成绩导入失败:', error);
          let errorMessage = '成绩导入失败';
          
          if (error.response) {
            console.error('错误响应:', error.response);
            if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.statusText) {
              errorMessage = `${errorMessage}: ${error.response.statusText}`;
            }
          } else if (error.message) {
            errorMessage = `${errorMessage}: ${error.message}`;
          }
          
          showSnackbar(errorMessage, 'error');
        } finally {
          setBatchLoading(false);
        }
      } else {
        showSnackbar('请选择Excel文件', 'warning');
      }
    } else {
      // 手动录入
      if (!manualInput.studentNumber || !manualInput.studentName) {
        showSnackbar('请选择学生', 'warning');
        return;
      }
      
      // 过滤掉 null 值，并将 number 转换为 float
      const filteredScores: Record<string, number> = {};
      Object.keys(manualInput.scores).forEach(subjectId => {
        const score = manualInput.scores[Number(subjectId)];
        if (score !== null && score !== undefined) {
          filteredScores[subjectId] = score;
        }
      });
      
      const hasScores = Object.keys(filteredScores).length > 0;
      if (!hasScores) {
        showSnackbar('请至少输入一个科目的成绩', 'warning');
        return;
      }
      
      setBatchLoading(true);
      
      try {
        // 构建请求数据
        const scoreData = {
          examId: batchSelectedExam,
          studentNumber: manualInput.studentNumber,
          studentName: manualInput.studentName,
          scores: filteredScores
        };
        
        console.log('提交手动录入成绩数据:', scoreData);
        const response = await scoreAPI.saveStudentScore(scoreData);
        console.log('手动录入成绩响应:', response);
        
        if (response.data && (response.data.code === 200 || response.status === 200)) {
          showSnackbar('成绩录入成功', 'success');
          setBatchDialogVisible(false);
          
          // 如果上传的成绩与当前选中的考试相同，则刷新成绩数据
          if (batchSelectedExam === selectedExam) {
            fetchExamScoresAndDetails();
          }
          
          // 重置手动录入表单
          resetManualInput();
          setSelectedSearchStudent(null);
        } else {
          console.error('手动录入成绩响应格式错误:', response);
          showSnackbar('录入失败，响应格式错误', 'error');
        }
      } catch (error: any) {
        console.error('手动录入成绩失败:', error);
        let errorMessage = '成绩录入失败';
        
        if (error.response) {
          console.error('错误响应:', error.response);
          if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.statusText) {
            errorMessage = `${errorMessage}: ${error.response.statusText}`;
          }
        } else if (error.message) {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
        
        showSnackbar(errorMessage, 'error');
      } finally {
        setBatchLoading(false);
      }
    }
  };

  // 重置手动录入表单
  const resetManualInput = () => {
    setManualInput({
      studentNumber: '',
      studentName: '',
      scores: {}
    });
  };

  // 导出成绩Excel
  const handleExportExcel = () => {
    if (!selectedExam) {
      return;
    }
    
    try {
      scoreAPI.exportExamScores(selectedExam);
    } catch (error) {
      console.error('成绩导出失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除该成绩记录吗？')) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/scores/${id}`);
        if (response.status === 200) {
          showSnackbar('删除成绩成功', 'success');
          fetchScores();
        }
      } catch (error: any) {
        showSnackbar(error.response?.data?.message || '删除失败', 'error');
      }
    }
  };

  // 获取学生列表
  const fetchStudents = useCallback(async () => {
    try {
      const response = await studentAPI.getAllStudents();
      if (response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    fetchExams();
    fetchStudents();
  }, [fetchExams, fetchStudents]);

  // 监听考试选择变化
  useEffect(() => {
    if (selectedExam) {
      fetchExamScoresAndDetails();
    }
  }, [selectedExam, fetchExamScoresAndDetails]);

  // 监听分页变化
  useEffect(() => {
    if (selectedExam) {
      fetchScores();
    }
  }, [currentPage, pageSize, fetchScores]);

  // 处理学生选择
  const handleStudentChange = (event: any, newValue: any) => {
    setSelectedSearchStudent(newValue);
    if (newValue) {
      setManualInput(prev => ({
        ...prev,
        studentNumber: newValue.studentNumber,
        studentName: newValue.name
      }));
    } else {
      setManualInput(prev => ({
        ...prev,
        studentNumber: '',
        studentName: ''
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box sx={{ p: 3 }} className="score-container page-container">
        <Card className="score-card apple-card" elevation={3}>
          <CardHeader
            title="成绩管理"
            action={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>选择考试</InputLabel>
                  <Select
                    value={selectedExam || ''}
                    label="选择考试"
                    onChange={(e) => handleExamChange(e as SelectChangeEvent<number>)}
                  >
                    <MenuItem value=""><em>请选择考试</em></MenuItem>
                    {exams.map((exam) => (
                      <MenuItem key={exam.id} value={exam.id}>
                        {exam.name} - {exam.className}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {currentExam && (
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>选择科目</InputLabel>
                    <Select
                      value={selectedSubject || ''}
                      label="选择科目"
                      onChange={(e) => handleSubjectChange(e as SelectChangeEvent<number>)}
                    >
                      <MenuItem value=""><em>全部科目</em></MenuItem>
                      {currentExam.subjects?.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {currentExam && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleBatchInput}
                  >
                    录入成绩
                  </Button>
                )}
                
                {currentExam && scores.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportExcel}
                  >
                    导出Excel
                  </Button>
                )}
              </Stack>
            }
            sx={{ '& .MuiCardHeader-action': { mt: {xs: 2, sm: 0}, ml: {sm: 'auto'}} }}
          />
          <CardContent>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
            
            {!loading && !currentExam && (
              <Typography sx={{ textAlign: 'center', my: 3 }}>请选择一个考试</Typography>
            )}
            
            {!loading && currentExam && scores.length === 0 && (
              <Typography sx={{ textAlign: 'center', my: 3 }}>暂无成绩数据</Typography>
            )}
            
            {!loading && currentExam && scores.length > 0 && (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                  <Typography variant="h6" gutterBottom>考试信息</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">考试名称</Typography>
                        <Typography variant="body1">{currentExam.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">考试日期</Typography>
                        <Typography variant="body1">{formatDate(currentExam.examDate)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">班级</Typography>
                        <Typography variant="body1">{currentExam.className}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">状态</Typography>
                        <Chip 
                          label={getStatusLabel(currentExam.status)} 
                          color={getStatusType(currentExam.status) as any} 
                          size="small" 
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>成绩统计</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">最高分</Typography>
                        <Typography variant="body1">{statistics.highest}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">最低分</Typography>
                        <Typography variant="body1">{statistics.lowest}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">平均分</Typography>
                        <Typography variant="body1">{statistics.average.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} elevation={0} sx={{border: '1px solid rgba(224, 224, 224, 1)'}}>
                  <Table className="score-table apple-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>学号</TableCell>
                        <TableCell>姓名</TableCell>
                        <TableCell>班级</TableCell>
                        {currentExam.subjects?.map((subject) => (
                          <TableCell key={subject.id}>{subject.name}成绩</TableCell>
                        ))}
                        <TableCell>总分</TableCell>
                        <TableCell>排名</TableCell>
                        <TableCell>评语</TableCell>
                        <TableCell>上传时间</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scores.map((student) => (
                        <TableRow 
                          key={student.studentId} 
                          sx={isTopStudent(student) ? { backgroundColor: 'rgba(76, 175, 80, 0.1)' } : {}}
                        >
                          <TableCell>{student.studentNumber}</TableCell>
                          <TableCell>{student.studentName}</TableCell>
                          <TableCell>{student.className || '-'}</TableCell>
                          {currentExam.subjects?.map((subject) => (
                            <TableCell key={subject.id}>
                              {student.scores[subject.id] !== undefined ? student.scores[subject.id] : '-'}
                            </TableCell>
                          ))}
                          <TableCell>{student.totalScore}</TableCell>
                          <TableCell>
                            <Chip 
                              label={student.rank} 
                              color={student.rank <= 3 ? 'primary' : 'default'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{student.comment || '-'}</TableCell>
                          <TableCell>{student.createdAt || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleEditScore(student)}
                            >
                              编辑
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={total}
                  page={currentPage - 1}
                  onPageChange={handleCurrentChange}
                  rowsPerPage={pageSize}
                  onRowsPerPageChange={handleSizeChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="每页行数"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
                />
              </>
            )}
          </CardContent>
        </Card>
        
        {/* 单个学生成绩编辑对话框 */}
        <Dialog
          open={scoreDialogVisible}
          onClose={() => setScoreDialogVisible(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            编辑学生成绩
            <IconButton
              aria-label="close"
              onClick={() => setScoreDialogVisible(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedStudent && (
              <Box>
                {/* 学生基本信息卡片 */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
                      <Typography variant="caption" color="textSecondary">学生姓名</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedStudent.studentName}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
                      <Typography variant="caption" color="textSecondary">学号</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedStudent.studentNumber}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
                      <Typography variant="caption" color="textSecondary">班级</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedStudent.className || '未分配班级'}</Typography>
                    </Box>
                  </Box>
                </Paper>
                
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>科目成绩</Typography>
                
                {/* 科目成绩输入区域 */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
                  {currentExam?.subjects?.map((subject) => (
                    <Box 
                      key={subject.id} 
                      sx={{ 
                        width: { xs: '100%', sm: '50%', md: '33.33%' }, 
                        p: 1 
                      }}
                    >
                      <Paper 
                        sx={{ 
                          p: 2, 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 2
                          }
                        }}
                      >
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          {subject.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <TextField
                            type="number"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={selectedStudent.scores[subject.id] || ''}
                            onChange={(e) => handleScoreChange(selectedStudent, subject.id, Number(e.target.value))}
                            inputProps={{ 
                              min: 0, 
                              max: subject.score,
                              step: 0.5,
                              style: { textAlign: 'center', fontSize: '1.2rem' }
                            }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                            / {subject.score}分
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
                
                {/* 总分和排名信息 */}
                <Paper 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-around'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">总分</Typography>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {selectedStudent.totalScore || 0}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">排名</Typography>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {selectedStudent.rank || '-'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button 
              onClick={() => setScoreDialogVisible(false)}
              variant="outlined"
            >
              取消
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveStudentScore}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ ml: 2 }}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* 批量录入成绩对话框 */}
        <Dialog
          open={batchDialogVisible}
          onClose={() => setBatchDialogVisible(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            批量录入成绩
            <IconButton
              aria-label="close"
              onClick={() => setBatchDialogVisible(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ transform: 'translateY(6px)' }}>
                <FormControl fullWidth sx={{ 
                  minHeight: '56px',
                  marginTop: '12px',
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    padding: '0 4px',
                    zIndex: 1
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper'
                  }
                }}>
                  <InputLabel id="batch-exam-select-label">选择考试</InputLabel>
                  <Select
                    labelId="batch-exam-select-label"
                    value={batchSelectedExam || ''}
                    onChange={(e) => setBatchSelectedExam(e.target.value as number)}
                    label="选择考试"
                  >
                    {exams.map((exam) => (
                      <MenuItem key={exam.id} value={exam.id}>
                        {exam.name} - {exam.className}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl component="fieldset">
                  <Typography variant="subtitle1" gutterBottom>录入方式</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant={batchInputType === 1 ? "contained" : "outlined"}
                      onClick={() => setBatchInputType(1)}
                      startIcon={<UploadIcon />}
                    >
                      Excel文件导入
                    </Button>
                    <Button
                      variant={batchInputType === 2 ? "contained" : "outlined"}
                      onClick={() => setBatchInputType(2)}
                      startIcon={<AddIcon />}
                    >
                      手动录入
                    </Button>
                  </Stack>
                </FormControl>
              </Box>

              {batchInputType === 1 ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDownloadTemplate}
                    disabled={!batchSelectedExam}
                  >
                    下载模板
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBeforeUpload}
                    style={{ display: 'none' }}
                    id="score-file-upload"
                  />
                  <label htmlFor="score-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      disabled={!batchSelectedExam}
                    >
                      选择文件
                    </Button>
                  </label>
                  {uploadFile && (
                    <Typography variant="body2" color="textSecondary">
                      已选择: {uploadFile.name}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Autocomplete
                        options={students}
                        getOptionLabel={(option) => `${option.name} (${option.studentNumber}) - ${option.classInfo?.className || '未分配班级'}`}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="搜索学生" 
                            variant="outlined"
                            fullWidth
                          />
                        )}
                        value={selectedSearchStudent}
                        onChange={handleStudentChange}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText="无匹配学生"
                        loadingText="加载中..."
                      />
                    </Box>
                    
                    {batchSelectedExam && currentExam?.subjects && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>科目成绩</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                          {currentExam.subjects.map((subject) => (
                            <Box key={subject.id}>
                              <TextField
                                fullWidth
                                label={subject.name}
                                type="number"
                                value={manualInput.scores[subject.id] || ''}
                                onChange={(e) => setManualInput(prev => ({
                                  ...prev,
                                  scores: {
                                    ...prev.scores,
                                    [subject.id]: Number(e.target.value)
                                  }
                                }))}
                                inputProps={{
                                  min: 0,
                                  max: subject.score,
                                  step: 0.5
                                }}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">满分: {subject.score}</InputAdornment>
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBatchDialogVisible(false)}>取消</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirmBatchInput}
              disabled={batchLoading || !batchSelectedExam}
              startIcon={batchLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              确认
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* 添加 Snackbar 组件 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ScoreManagement; 