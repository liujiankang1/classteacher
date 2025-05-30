import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Card, CardHeader, CardContent, Select, MenuItem, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, 
  TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextareaAutosize, Stack,
  FormControl, InputLabel, Alert, Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Edit, Delete, PlayArrow, Stop, Grading, Add, Close, Search } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from 'date-fns/locale'; 

import * as examAPI from '../api/examAPI';
import * as classAPI from '../api/class'; // 假设班级API文件名为 class.ts
import * as subjectAPI from '../api/subjectAPI';
import * as scoreAPI from '../api/scoreAPI';

import SearchBox from '../components/SearchBox';
import AddButton from '../components/AddButton';
import CustomInput from '../components/CustomInput'; // 假设你已经有了或者后续会创建
import CustomSelect from '../components/CustomSelect'; // 假设你已经有了或者后续会创建

// 类型定义 (基于Vue文件的结构)
interface Class {
  id: string | number;
  name: string;
}

interface Subject {
  id: string | number;
  name: string;
  score: number;
  passScore?: number;
  description?: string;
  subjectName?: string; // 兼容旧数据
  fullScore?: number; // 兼容旧数据
}

interface ExamSubject {
  id?: number;
  subjectId?: number;
  name?: string;
  score?: number;
  subject?: { id: number };
  subjectName?: string;
  fullScore?: number;
}

interface Exam {
  id: number;
  name: string;
  examName?: string;
  examDate: string;
  className?: string;
  classInfo?: {
    id: number;
    className: string;
  };
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'GRADED';
  totalScore?: number;
  examSubjects: ExamSubject[];
  description?: string;
}

interface ExamFormData {
  id?: number | null;
  name: string;
  examDate: Date | string | null;
  classId: string;
  description: string;
  subjects: ExamSubject[];
}

interface Score {
  id: number;
  examId: number;
  examSubjectId: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  scoreValue: number;
  rank?: number;
  subjectName: string;
  comment?: string;
  createdAt?: string;
  className?: string;
  totalScore?: number;
  scores?: Record<number, number>;
}

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalExams, setTotalExams] = useState(0);
  const [examPage, setExamPage] = useState(0);
  const [examRowsPerPage, setExamRowsPerPage] = useState(10);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [examForm, setExamForm] = useState<ExamFormData>({
    id: null,
    name: '',
    examDate: new Date(),
    classId: '',
    description: '',
    subjects: [],
  });

  const [subjectDialogVisible, setSubjectDialogVisible] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedSubjectForTable, setSelectedSubjectForTable] = useState<Subject | null>(null);

  const [scoresDialogVisible, setScoresDialogVisible] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [currentExamForScores, setCurrentExamForScores] = useState<Exam | null>(null);
  const [examScores, setExamScores] = useState<Score[]>([]);
  const [scoresTotal, setScoresTotal] = useState(0);
  const [scoresPageSize, setScoresPageSize] = useState(10);
  const [scoresCurrentPage, setScoresCurrentPage] = useState(1);
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExamFormData, string>>>({});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });

  // 添加确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  const routerPush = (path: string) => {
    // 在React中，通常使用 react-router-dom 的 useNavigate
    // 这里仅作示意，实际项目中需要正确集成路由
    console.log(`Navigating to ${path}`);
    if (path === '/home/subjects') {
        showSnackbar("请在实际项目中实现跳转到科目管理页面", 'info');
    }
  };

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

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getStatusType = (status: Exam['status']) => {
    switch (status) {
      case 'PENDING': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'FINISHED':
      case 'GRADED': return 'success';
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

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      // Vue版本中这里的筛选逻辑比较复杂，React中需要简化或后端支持更灵活的查询
      // 此处暂时简化为仅支持单个筛选条件或无筛选
      if (selectedClass) {
        response = await examAPI.getExamsByClass(selectedClass);
      } else if (selectedStatus) {
        response = await examAPI.getExamsByStatus(selectedStatus);
      } else {
        response = await examAPI.getAllExams();
      }
      
      const processedExams = response.data.map((exam: any) => ({
        ...exam,
        id: exam.id,
        name: exam.examName || exam.name,
        className: exam.classInfo?.name || exam.className || 'N/A',
        examSubjects: exam.examSubjects || [],
        description: exam.description || '',
        totalScore: exam.totalScore || 0,
      }));
      
      // 本地搜索过滤 (Vue版是重新请求，这里先做本地过滤，后续可优化)
      let filtered = processedExams;
      if(searchQuery){
        filtered = filtered.filter((exam: Exam) => 
            exam.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      // Vue版本中，如果同时有班级和状态筛选，会再次本地过滤，这里也实现
      if (selectedClass && selectedStatus) {
        filtered = filtered.filter((exam: Exam) => exam.status === selectedStatus);
      }

      setExams(filtered);
      setTotalExams(filtered.length); // 注意：分页应该基于后端返回的总数，这里暂时用过滤后的长度

    } catch (error) {
      console.error('获取考试列表失败:', error);
      showSnackbar('获取考试列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedStatus, searchQuery]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('获取班级列表失败:', error);
      showSnackbar('获取班级列表失败', 'error');
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await subjectAPI.getAllSubjects();
      const processedSubjects = (response.data || []).map((subject: any) => ({
        id: subject.id,
        name: subject.name || subject.subjectName || '未命名科目',
        score: subject.score || subject.fullScore || 100,
        passScore: subject.passScore || Math.floor((subject.score || 100) * 0.6),
        description: subject.description || '',
      }));
      setSubjects(processedSubjects);
      if (!processedSubjects.length) {
        showSnackbar('没有找到任何科目，请先在科目管理中添加科目', 'warning');
      }
    } catch (error) {
      console.error('获取科目列表失败:', error);
      showSnackbar('获取科目列表失败', 'error');
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams, examPage, examRowsPerPage]); // 依赖项改变时重新获取

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, [fetchClasses, fetchSubjects]);

  // 筛选变更处理
  const handleStatusChange = (event: any) => {
    setSelectedStatus(event.target.value as string);
    setExamPage(0); // 重置分页
  };

  const handleClassChange = (event: any) => {
    setSelectedClass(event.target.value as string);
    setExamPage(0);
  };
  
  const handleSearch = () => {
    setExamPage(0);
    fetchExams(); // 触发搜索
  };

  // 分页处理
  const handleChangePage = (event: unknown, newPage: number) => {
    setExamPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExamRowsPerPage(parseInt(event.target.value, 10));
    setExamPage(0);
  };
  
  const resetForm = () => {
    setExamForm({
      id: null,
      name: '',
      examDate: getTodayDate(), // 使用 YYYY-MM-DD 格式
      classId: '',
      description: '',
      subjects: [],
    });
    setFormErrors({});
  };

  const handleAddExam = () => {
    resetForm();
    setIsEdit(false);
    setDialogVisible(true);
  };
  
  const handleEdit = (exam: Exam) => {
    setIsEdit(true);
    setExamForm({
      id: exam.id,
      name: exam.name || exam.examName || '',
      examDate: exam.examDate ? new Date(exam.examDate) : null,
      classId: exam.classInfo?.id.toString() || '',
      description: exam.description || '',
      subjects: exam.examSubjects.map(subject => ({
        id: subject.id || (subject.subject?.id ? Number(subject.subject.id) : undefined),
        subjectId: subject.subject?.id ? Number(subject.subject.id) : undefined,
        name: subject.name || subject.subjectName || '',
        score: subject.score || subject.fullScore || 100,
        subject: subject.subject ? { id: Number(subject.subject.id) } : undefined,
        subjectName: subject.subjectName,
        fullScore: subject.fullScore
      }))
    });
    setDialogVisible(true);
  };

  // 打开确认对话框
  const openConfirmDialog = (title: string, content: string, onConfirm: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      content,
      onConfirm
    });
  };
  
  // 关闭确认对话框
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleDelete = async (exam: Exam) => {
    if (exam.status !== 'PENDING') { 
      showSnackbar('只能删除未开始的考试', 'warning');
      return;
    }
    
    openConfirmDialog(
      '删除考试',
      `确定要删除考试 ${exam.name} 吗？`,
      async () => {
        try {
          await examAPI.deleteExam(exam.id);
          showSnackbar('删除成功', 'success');
          fetchExams();
        } catch (error: any) {
          showSnackbar(error.response?.data?.message || '删除失败', 'error');
        }
      }
    );
  };

  const handleUpdateStatus = async (exam: Exam, newStatus: Exam['status']) => {
    const statusText = getStatusLabel(newStatus);
    
    openConfirmDialog(
      '更新考试状态',
      `确定要将考试 ${exam.name} 状态更改为 ${statusText} 吗？`,
      async () => {
        try {
          await examAPI.updateExamStatus(exam.id, newStatus);
          showSnackbar('状态更新成功', 'success');
          fetchExams();
        } catch (error: any) {
          showSnackbar(error.response?.data?.message || '状态更新失败', 'error');
        }
      }
    );
  };

  // 表单提交
  const validateForm = () => {
    const errors: Partial<Record<keyof ExamFormData, string>> = {};
    if (!examForm.name.trim()) errors.name = '请输入考试名称';
    if (examForm.name.trim().length < 2 || examForm.name.trim().length > 50) errors.name = '长度在 2 到 50 个字符';
    if (!examForm.examDate) errors.examDate = '请选择考试日期';
    if (!examForm.classId) errors.classId = '请选择班级';
    if (!examForm.subjects || examForm.subjects.length === 0) errors.subjects = '请至少添加一个考试科目';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmitForm = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);

    const examDateString = typeof examForm.examDate === 'string' 
      ? examForm.examDate 
      : examForm.examDate?.toISOString().split('T')[0] || '';

    const selectedClass = classes.find(c => String(c.id) === examForm.classId);
    if (!selectedClass) {
      showSnackbar('请选择有效的班级', 'error');
      setSubmitLoading(false);
      return;
    }

    const formDataToSubmit: Partial<Exam> = {
      id: examForm.id ? Number(examForm.id) : undefined,
      examName: examForm.name,
      examDate: examDateString,
      description: examForm.description || '',
      classInfo: {
        id: Number(examForm.classId),
        className: selectedClass.name
      },
      examSubjects: examForm.subjects.map(subject => ({
        subject: { id: Number(subject.subjectId || subject.id) },
        subjectName: subject.name,
        fullScore: Number(subject.score)
      }))
    };

    try {
      if (isEdit) {
        await examAPI.updateExam(examForm.id!, formDataToSubmit);
        showSnackbar('更新成功', 'success');
      } else {
        await examAPI.createExam(formDataToSubmit);
        showSnackbar('创建成功', 'success');
      }
      setDialogVisible(false);
      fetchExams();
    } catch (error: any) {
      console.error('提交失败:', error);
      showSnackbar(error.response?.data?.message || (isEdit ? '更新失败' : '创建失败'), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleFormInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setExamForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setExamForm((prev: ExamFormData) => ({ 
      ...prev, 
      examDate: date 
    }));
  };

  const handleClassIdChangeInForm = (value: string | number) => {
    setExamForm(prev => ({ ...prev, classId: String(value) }));
  };

  // 科目选择对话框逻辑
  const handleAddSubject = () => {
    setSelectedSubjectForTable(null);
    setSubjectDialogVisible(true);
    if (subjects.length === 0) {
      fetchSubjects();
    }
    setSubjectSearchQuery('');
    filterSubjectOptions();
  };
  
  const filterSubjectOptions = useCallback(() => {
    if (!subjectSearchQuery) {
      setFilteredSubjects(subjects);
    } else {
      const query = subjectSearchQuery.toLowerCase();
      setFilteredSubjects(
        subjects.filter(s => s.name.toLowerCase().includes(query))
      );
    }
  }, [subjectSearchQuery, subjects]);

  useEffect(() => {
    filterSubjectOptions();
  }, [filterSubjectOptions]);

  const handleSelectAndConfirmSubject = (subject: Subject) => {
    const existingSubject = examForm.subjects.find(
      s => (s.subjectId || s.id) === subject.id
    );
    if (existingSubject) {
      showSnackbar(`科目 "${subject.name}" 已添加到考试中`, 'warning');
      return;
    }
    const newSubjectEntry: ExamSubject = {
      subjectId: typeof subject.id === 'string' ? Number(subject.id) : subject.id, // 类型转换
      id: typeof subject.id === 'string' ? Number(subject.id) : subject.id,
      name: subject.name,
      score: subject.score || 100,
      subject: { id: typeof subject.id === 'string' ? Number(subject.id) : subject.id },
      subjectName: subject.name,
      fullScore: subject.score
    };
    setExamForm(prev => ({ ...prev, subjects: [...prev.subjects, newSubjectEntry] }));
    showSnackbar(`已添加科目: ${subject.name}`, 'success');
    setSubjectDialogVisible(false);
    setSelectedSubjectForTable(null);
  };

  const handleRemoveSubjectFromForm = (index: number) => {
    setExamForm(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };
  
  // 成绩管理对话框
  const handleManageScores = (exam: Exam) => {
    setCurrentExamForScores(exam);
    setScoresCurrentPage(1);
    setScoresPageSize(10);
    fetchExamScores(exam.id, 0, 10); // page是0-indexed
    setScoresDialogVisible(true);
  };
  
  const fetchExamScores = useCallback(async (examId: number, page: number, size: number) => {
    if (!currentExamForScores && !examId) return;
    const idToFetch = examId || currentExamForScores?.id;
    if (!idToFetch) return;

    setScoresLoading(true);
    try {
      const response = await scoreAPI.getScoresByExamId(idToFetch, page, size);
      const scores = response.data.content || [];
      // 确保所有必需的字段都存在
      const processedScores: Score[] = scores.map((score: any) => ({
        ...score,
        subjectName: score.subjectName || '',
        scoreValue: score.scoreValue || 0,
        studentNumber: score.studentNumber || '',
        studentName: score.studentName || '',
        id: score.id || 0,
        examId: score.examId || 0,
        examSubjectId: score.examSubjectId || 0,
        studentId: score.studentId || 0,
        className: score.className || '-',
        totalScore: score.totalScore || 0,
        rank: score.rank || 0,
        comment: score.comment || '-',
        createdAt: score.createdAt || null,
        scores: score.scores || {}
      }));
      setExamScores(processedScores);
      setScoresTotal(response.data.totalElements || 0);
    } catch (error) {
      console.error(`获取考试 ${currentExamForScores?.name || idToFetch} 成绩失败:`, error);
      showSnackbar('获取成绩列表失败', 'error');
      setExamScores([]);
      setScoresTotal(0);
    } finally {
      setScoresLoading(false);
    }
  }, [currentExamForScores, classes]);
  
  const handleScoresDialogClose = () => {
    setScoresDialogVisible(false);
    setCurrentExamForScores(null);
    setExamScores([]);
    setScoresTotal(0);
  };

  const handleScoresSizeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setScoresPageSize(newSize);
    setScoresCurrentPage(1); // API page is 0-indexed, mui is 1-indexed
    if(currentExamForScores) fetchExamScores(currentExamForScores.id, 0, newSize);
  };

  const handleScoresCurrentPageChange = (event: unknown, newPage: number) => {
    setScoresCurrentPage(newPage + 1); // mui is 0-indexed for event, state is 1-indexed
    if(currentExamForScores) fetchExamScores(currentExamForScores.id, newPage, scoresPageSize);
  };

  // 渲染主要考试表格数据
  const paginatedExams = exams.slice(examPage * examRowsPerPage, examPage * examRowsPerPage + examRowsPerPage);

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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box sx={{ p: 3 }} className="exam-container page-container">
        <Card className="exam-card apple-card" elevation={3}>
          <CardHeader
            title="考试列表"
            action={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>考试状态</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="考试状态"
                    onChange={handleStatusChange}
                    // className="status-select apple-search"
                  >
                    <MenuItem value=""><em>全部状态</em></MenuItem>
                    <MenuItem value="PENDING">未开始</MenuItem>
                    <MenuItem value="IN_PROGRESS">进行中</MenuItem>
                    <MenuItem value="FINISHED">已结束</MenuItem>
                    <MenuItem value="GRADED">已评分</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>班级筛选</InputLabel>
                  <Select
                    value={selectedClass}
                    label="班级筛选"
                    onChange={handleClassChange}
                    // className="class-select apple-search"
                  >
                    <MenuItem value=""><em>全部班级</em></MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls.id} value={String(cls.id)}>{cls.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <SearchBox 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  placeholder="搜索考试名称"
                />
                <AddButton onClick={handleAddExam}>创建考试</AddButton>
              </Stack>
            }
            sx={{ '& .MuiCardHeader-action': { mt: {xs: 2, sm: 0}, ml: {sm: 'auto'}} }}
          />
          <CardContent>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
            {!loading && exams.length === 0 && (
                <Typography sx={{ textAlign: 'center', my: 3 }}>暂无考试数据</Typography>
            )}
            {!loading && exams.length > 0 && (
              <TableContainer component={Paper} elevation={0} sx={{border: '1px solid rgba(224, 224, 224, 1)'}}>
                <Table stickyHeader className="exam-table apple-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>考试名称</TableCell>
                      <TableCell>考试日期</TableCell>
                      <TableCell>班级</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>总分</TableCell>
                      <TableCell>考试科目</TableCell>
                      <TableCell>描述</TableCell>
                      <TableCell sx={{minWidth: 350}}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>{exam.name}</TableCell>
                        <TableCell>{formatDate(exam.examDate)}</TableCell>
                        <TableCell>{exam.className}</TableCell>
                        <TableCell>
                          <Chip label={getStatusLabel(exam.status)} color={getStatusType(exam.status)} size="small" />
                        </TableCell>
                        <TableCell>{exam.totalScore || 0}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {(exam.examSubjects && exam.examSubjects.length > 0) ? (
                              exam.examSubjects.map((sub, idx) => (
                                <Chip 
                                  key={sub.id || sub.subject?.id || idx} 
                                  label={`${sub.name || sub.subjectName} (${sub.score || sub.fullScore || 0}分)`} 
                                  size="small" 
                                  // className="subject-tag"
                                />
                              ))
                            ) : (
                              <Typography variant="caption" className="no-subjects">暂无科目</Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{exam.description}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Button variant="contained" size="small" startIcon={<Edit />} onClick={() => handleEdit(exam)}>编辑</Button>
                            {exam.status === 'PENDING' && (
                              <Button variant="contained" color="success" size="small" startIcon={<PlayArrow />} onClick={() => handleUpdateStatus(exam, 'IN_PROGRESS')}>开始考试</Button>
                            )}
                            {exam.status === 'IN_PROGRESS' && (
                              <Button variant="contained" color="warning" size="small" startIcon={<Stop />} onClick={() => handleUpdateStatus(exam, 'FINISHED')}>结束考试</Button>
                            )}
                            <Button variant="contained" color="info" size="small" startIcon={<Grading />} onClick={() => handleManageScores(exam)}>成绩管理</Button>
                            {exam.status === 'PENDING' && (
                              <Button variant="contained" color="error" size="small" startIcon={<Delete />} onClick={() => handleDelete(exam)}>删除</Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              component="div"
              count={totalExams}
              page={examPage}
              onPageChange={handleChangePage}
              rowsPerPage={examRowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="每页行数"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
            />
          </CardContent>
        </Card>

        {/* 添加/编辑考试对话框 */}
        <Dialog 
          open={dialogVisible} 
          onClose={() => setDialogVisible(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            {isEdit ? '编辑考试' : '创建考试'}
            <IconButton
                aria-label="close"
                onClick={() => setDialogVisible(false)}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                }}
                >
                <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" noValidate autoComplete="off" sx={{p:2}}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1.5 }}>
                <Box sx={{ width: '100%', p: 1.5 }}>
                  <CustomInput
                    label="考试名称"
                    name="name"
                    value={examForm.name}
                    onChange={handleFormInputChange}
                    placeholder="考试名称"
                    required
                    fullWidth
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1.5 }}>
                  <DatePicker
                    label="考试日期"
                    value={examForm.examDate ? new Date(examForm.examDate) : null}
                    onChange={handleDateChange}
                    minDate={new Date(getTodayDate())}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{ textField: (params) => 
                        <TextField 
                            {...params} 
                            fullWidth 
                            required 
                            name="examDate" 
                            error={!!formErrors.examDate} 
                            helperText={formErrors.examDate}
                        /> 
                    }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1.5 }}>
                  <CustomSelect
                    label="选择班级"
                    value={examForm.classId}
                    onChange={(val) => handleClassIdChangeInForm(val)}
                    options={classes.map(c => ({ label: c.name, value: String(c.id) }))}
                    placeholder="选择班级"
                    fullWidth
                    required
                    error={!!formErrors.classId}
                    helperText={formErrors.classId}
                  />
                </Box>
                <Box sx={{ width: '100%', p: 1.5 }}>
                  <TextField
                    label="考试描述（选填）"
                    name="description"
                    value={examForm.description}
                    onChange={handleFormInputChange}
                    placeholder="考试描述（选填）"
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }}}
                  />
                </Box>
                
                <Box sx={{ width: '100%', p: 1.5 }}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, mb:1, textAlign: 'center', color: 'primary.main' }}>
                        考试科目
                    </Typography>
                    <Box className="subjects-divider" sx={{ display: 'flex', alignItems: 'center', mb:2}}>
                        <Box sx={{flex:1, height: '1px', background: 'rgba(0,0,0,0.1)'}} />
                        <Box sx={{flex:1, height: '1px', background: 'rgba(0,0,0,0.1)'}} />
                    </Box>
                </Box>

                <Box sx={{ width: '100%', p: 1.5 }}>
                  {examForm.subjects.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', border: '1px dashed grey', backgroundColor: '#f9f9f9'}}>
                      <Typography>还没有添加科目，请点击下方按钮添加科目</Typography>
                    </Paper>
                  ) : (
                    <Stack spacing={2}>
                      {examForm.subjects.map((subject, index) => (
                        <Paper key={subject.subjectId || subject.id || index} elevation={1} sx={{ p: 2, borderRadius: '12px'}}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>科目 {index + 1}</Typography>
                            <Button 
                                size="small" 
                                color="error" 
                                onClick={() => handleRemoveSubjectFromForm(index)} 
                                startIcon={<Delete />} 
                            >
                                删除
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f5', p:1.5, borderRadius: '8px' }}>
                            <Typography>{subject.name}</Typography>
                            <Chip label={`满分: ${subject.score}`} size="small" color="primary" />
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ width: '100%', p: 1.5, display: 'flex', justifyContent: 'center', mt: 1}}>
                  <Button 
                    variant="outlined" 
                    onClick={handleAddSubject} 
                    startIcon={<Add />} 
                    sx={{ borderRadius: '8px', textTransform: 'none'}}
                  >
                    从科目库选择科目
                  </Button>
                </Box>
                {formErrors.subjects && (
                    <Box sx={{ width: '100%', p: 1.5, mt: -1}}>
                        <Alert severity="error" sx={{width: '100%'}}>{formErrors.subjects}</Alert>
                    </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px'}}>
            <Stack direction="row" spacing={2} sx={{width: '100%', justifyContent: 'center'}}>
              <Button 
                variant="contained" 
                onClick={handleSubmitForm} 
                disabled={submitLoading} 
                sx={{flex:1, borderRadius: '12px'}} 
              >
                {submitLoading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? '保存修改' : '创建考试')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setDialogVisible(false)} 
                sx={{flex:1, borderRadius: '12px'}} 
                // className="cancel-button"
              >
                取消
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>

        {/* 科目选择对话框 */}
        <Dialog 
            open={subjectDialogVisible} 
            onClose={() => setSubjectDialogVisible(false)} 
            maxWidth="sm" 
            fullWidth 
            // custom-class="apple-dialog subject-dialog"
        >
          <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            选择科目
            <IconButton
                aria-label="close"
                onClick={() => setSubjectDialogVisible(false)}
                sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
                <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers /*className="subject-select-container"*/>
            {subjects.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px dashed grey'}} /*className="no-subjects-message"*/>
                <Typography>没有找到科目数据，请先在科目管理中添加科目</Typography>
                <Button variant="contained" onClick={() => routerPush('/home/subjects')} sx={{mt: 2}} /*className="empty-actions"*/>前往科目管理</Button>
              </Paper>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="搜索科目名称"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{mr:1, color:'action.active'}}/>,
                    sx: { borderRadius: '12px', mb: 2}
                  }}
                  // className="subject-search-input"
                />
                {filteredSubjects.length === 0 && subjectSearchQuery && (
                    <Typography sx={{textAlign: 'center', my:2}}>未找到匹配的科目</Typography>
                )}
                {filteredSubjects.length > 0 && (
                <TableContainer component={Paper} elevation={0} sx={{maxHeight: 400, border: '1px solid rgba(224, 224, 224, 1)'}}>
                  <Table stickyHeader size="small" /*className="subject-table apple-table"*/>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>科目名称</TableCell>
                        <TableCell>满分</TableCell>
                        <TableCell>及格分</TableCell>
                        <TableCell>描述</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSubjects.map((subject, index) => (
                        <TableRow 
                            key={subject.id} 
                            hover 
                            selected={selectedSubjectForTable?.id === subject.id}
                            // onClick={() => setSelectedSubjectForTable(subject)} // 如果需要点击行选中
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{subject.id}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>{subject.score}</TableCell>
                          <TableCell>{subject.passScore}</TableCell>
                          <TableCell>{subject.description}</TableCell>
                          <TableCell>
                            <Button 
                                variant="contained" 
                                size="small" 
                                onClick={() => handleSelectAndConfirmSubject(subject)} 
                                // className="select-btn"
                            >
                              选择
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px'}} /*className="button-group"*/>
            <Button variant="outlined" onClick={() => setSubjectDialogVisible(false)} sx={{borderRadius: '12px'}} /*className="cancel-button"*/>关闭</Button>
          </DialogActions>
        </Dialog>
        
        {/* 成绩管理对话框 */}
        <Dialog 
            open={scoresDialogVisible} 
            onClose={handleScoresDialogClose} 
            maxWidth="lg" 
            fullWidth 
            // custom-class="apple-dialog scores-dialog"
        >
            <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
                {currentExamForScores ? `${currentExamForScores.name} - 成绩列表` : '成绩列表'}
                <IconButton
                    aria-label="close"
                    onClick={handleScoresDialogClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers /*className="scores-dialog-content"*/>
                {scoresLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                {!scoresLoading && examScores.length === 0 && (
                    <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px dashed grey'}} /*className="no-scores-message"*/>
                         <Typography>暂无成绩数据</Typography>
                    </Paper>
                )}
                {!scoresLoading && examScores.length > 0 && (
                    <TableContainer component={Paper} elevation={0} sx={{border: '1px solid rgba(224, 224, 224, 1)'}}>
                        <Table stickyHeader /*className="scores-table apple-table"*/>
                            <TableHead>
                                <TableRow>
                                    <TableCell>学号</TableCell>
                                    <TableCell>姓名</TableCell>
                                    <TableCell>班级</TableCell>
                                    {currentExamForScores?.examSubjects?.map((subject) => (
                                        <TableCell key={subject.id || subject.subjectId}>{(subject.name || subject.subjectName)}成绩</TableCell>
                                    ))}
                                    <TableCell>总分</TableCell>
                                    <TableCell>排名</TableCell>
                                    <TableCell>评语</TableCell>
                                    <TableCell>上传时间</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {examScores.map((score, index) => (
                                    <TableRow 
                                        key={index} 
                                        sx={(score.rank || 0) <= 3 ? { backgroundColor: 'rgba(76, 175, 80, 0.1)' } : {}}
                                    >
                                        <TableCell>{score.studentNumber}</TableCell>
                                        <TableCell>{score.studentName}</TableCell>
                                        <TableCell>{score.className || '-'}</TableCell>
                                        {currentExamForScores?.examSubjects?.map((subject) => (
                                            <TableCell key={subject.id || subject.subjectId}>
                                                {score.scores && score.scores[subject.id || subject.subjectId || 0] !== undefined ? 
                                                    score.scores[subject.id || subject.subjectId || 0] : '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell>{score.totalScore}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={score.rank || 0} 
                                                color={(score.rank || 0) <= 3 ? 'primary' : 'default'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>{score.comment || '-'}</TableCell>
                                        <TableCell>{score.createdAt || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {scoresTotal > 0 && (
                    <TablePagination
                        component="div"
                        count={scoresTotal}
                        page={scoresCurrentPage - 1}
                        onPageChange={handleScoresCurrentPageChange}
                        rowsPerPage={scoresPageSize}
                        onRowsPerPageChange={handleScoresSizeChange}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="每页行数"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
                    />
                )}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px'}} /*className="button-group"*/>
                <Button variant="outlined" onClick={handleScoresDialogClose} sx={{borderRadius: '12px'}} /*className="cancel-button"*/>关闭</Button>
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
        
        {/* 添加确认对话框 */}
        <Dialog
          open={confirmDialog.open}
          onClose={closeConfirmDialog}
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.content}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirmDialog}>取消</Button>
            <Button 
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirmDialog();
              }} 
              color="error" 
              variant="contained"
              autoFocus
            >
              确定删除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ExamManagement; 