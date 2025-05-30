import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardHeader,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Autocomplete,
  TextField,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Timeline as TimelineIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import * as examAPI from '../api/examAPI';
import * as scoreStatisticsAPI from '../api/scoreStatisticsAPI';
import * as studentAPI from '../api/student';
import { 
  Exam, 
  Subject, 
  Student, 
  StudentScoreTrend, 
  ClassScoreComparison
} from '../types/scoreStatistics';
import StudentScoreTrendChart from '../components/charts/StudentScoreTrendChart';
import ClassScoreComparisonChart from '../components/charts/ClassScoreComparisonChart';

// Tab面板接口
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab面板组件
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`statistics-tabpanel-${index}`}
      aria-labelledby={`statistics-tab-${index}`}
      {...other}
      style={{ marginTop: '16px' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Tab属性生成函数
function a11yProps(index: number) {
  return {
    id: `statistics-tab-${index}`,
    'aria-controls': `statistics-tabpanel-${index}`,
  };
}

const ScoreStatistics: React.FC = () => {
  const { user } = useAuth();
  
  // 状态管理
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | string>('');
  const [selectedSubject, setSelectedSubject] = useState<number | string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  
  // 数据状态
  const [studentsTrendData, setStudentsTrendData] = useState<StudentScoreTrend[]>([]);
  const [classComparisonData, setClassComparisonData] = useState<ClassScoreComparison | null>(null);
  const [scoreDistributionSubject, setScoreDistributionSubject] = useState<string>('total');
  const [scoreRangeData, setScoreRangeData] = useState<{[key: string]: {label: string; count: number; percentage: number;}[]}>({});
  
  // 消息提示
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'info' | 'success' | 'warning'
  });
  
  // 获取所有考试
  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await examAPI.getAllExams();
      if (response.data && Array.isArray(response.data)) {
        const mappedExams: Exam[] = response.data.map(exam => ({
          id: exam.id,
          name: exam.examName || exam.name,
          examDate: exam.examDate,
          className: exam.classInfo?.className,
          classId: exam.classInfo?.id
        }));
        setExams(mappedExams);
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
      showSnackbar('获取考试列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取考试科目
  const fetchSubjects = async (examId: number) => {
    setLoading(true);
    try {
      const response = await examAPI.getExamById(examId);
      if (response.data && response.data.examSubjects) {
        const subjectsData = response.data.examSubjects.map((es: any) => ({
          id: es.subject.id,
          name: es.subjectName || es.subject.name,
          fullScore: es.fullScore
        }));
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error('获取科目列表失败:', error);
      showSnackbar('获取科目列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取学生列表
  const fetchStudents = async (classId?: number) => {
    try {
      let response;
      if (classId) {
        response = await studentAPI.getStudentsByClass(classId);
      } else if (user && user.role === 'ROLE_HEADTEACHER' && user.classId) {
        // 班主任只查看自己班级的学生
        response = await studentAPI.getStudentsByClass(user.classId);
      } else {
        // 管理员可以查看所有学生
        response = await studentAPI.getAllStudents();
      }
      
      if (response.data) {
        setStudents(response.data.content || response.data);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    }
  };
  
  // 获取学生成绩趋势
  const fetchStudentScoreTrend = async () => {
    if (selectedStudents.length === 0) {
      showSnackbar('请至少选择一名学生', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // 存储所有请求的Promise
      const requests = selectedStudents.map(student => 
        scoreStatisticsAPI.getStudentScoreTrend(
          student.id,
          selectedSubject ? Number(selectedSubject) : undefined,
          selectedExam && selectedExam !== '' ? [Number(selectedExam)] : undefined
        )
      );
      
      // 并行请求所有学生数据
      const responses = await Promise.all(requests);
      
      // 提取数据
      const trendData = responses.map(response => response.data).filter(Boolean);
      setStudentsTrendData(trendData);
    } catch (error) {
      console.error('获取学生成绩趋势失败:', error);
      showSnackbar('获取学生成绩趋势失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取班级成绩对比
  const fetchClassScoreComparison = async () => {
    if (!selectedExam) {
      showSnackbar('请先选择考试', 'warning');
      return;
    }
    
    let classId: number | undefined;
    // 如果是班主任，只能查看自己班级
    if (user && user.role === 'ROLE_HEADTEACHER' && user.classId) {
      classId = user.classId;
    } else {
      // 查找选中考试的班级ID
      const selectedExamObj = exams.find(e => e.id === Number(selectedExam));
      if (selectedExamObj && selectedExamObj.classId) {
        classId = selectedExamObj.classId;
      }
    }
    
    if (!classId) {
      showSnackbar('无法确定班级信息', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const response = await scoreStatisticsAPI.getClassScoreComparison(
        classId,
        Number(selectedExam),
        selectedSubject ? Number(selectedSubject) : undefined
      );
      
      if (response.data) {
        // 使用深拷贝来避免引用问题
        let rawData = JSON.parse(JSON.stringify(response.data));
        
        // 强制初始化一个新的分数段数据对象
        const newScoreRanges: {[key: string]: {label: string; count: number; percentage: number;}[]} = {};
        
        try {
          // 处理各科目分数段
          if (rawData.subjectStats) {
            Object.keys(rawData.subjectStats).forEach(subjectId => {
              // 确保科目ID是字符串
              const subjectIdStr = String(subjectId);
              
              if (rawData.scoreRanges && rawData.scoreRanges[subjectIdStr]) {
                newScoreRanges[subjectIdStr] = Array.isArray(rawData.scoreRanges[subjectIdStr]) 
                  ? [...rawData.scoreRanges[subjectIdStr]] 
                  : [];
              } else {
                newScoreRanges[subjectIdStr] = [];
              }
            });
          }
        } catch (e) {
          console.error('分数段数据处理错误:', e);
        }
        
        // 更新分数段数据状态
        setScoreRangeData(newScoreRanges);
        
        // 设置班级对比数据
        if (!rawData.scoreRanges) {
          rawData.scoreRanges = {};
        }
        setClassComparisonData(rawData);
        
        // 设置默认的分数段分布科目为第一个科目（如果有科目的话）
        if (rawData.subjectStats && Object.keys(rawData.subjectStats).length > 0) {
          setScoreDistributionSubject(Object.keys(rawData.subjectStats)[0]);
        }
      }
    } catch (error) {
      console.error('获取班级成绩对比失败:', error);
      showSnackbar('获取班级成绩对比失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理考试选择变化
  const handleExamChange = (event: SelectChangeEvent<typeof selectedExam>) => {
    const examId = event.target.value;
    setSelectedExam(examId);
    setSelectedSubject('');
    
    if (examId && examId !== '') {
      fetchSubjects(Number(examId));
      
      // 查找选中考试的班级ID，获取该班级的学生
      const selectedExamObj = exams.find(e => e.id === Number(examId));
      if (selectedExamObj && selectedExamObj.classId) {
        fetchStudents(selectedExamObj.classId);
      }
    } else {
      setSubjects([]);
      // 根据用户角色获取学生列表
      if (user && user.role === 'ROLE_HEADTEACHER' && user.classId) {
        fetchStudents(user.classId);
      } else {
        fetchStudents();
      }
    }
  };
  
  // 处理科目选择变化
  const handleSubjectChange = (event: SelectChangeEvent<typeof selectedSubject>) => {
    setSelectedSubject(event.target.value);
  };
  
  // 处理分数段分布科目选择变化
  const handleScoreDistributionSubjectChange = (event: SelectChangeEvent<string>) => {
    const newSubjectId = event.target.value;
    
    // 强制更新状态以确保UI刷新
    setScoreDistributionSubject('');
    
    // 使用setTimeout确保状态更新并触发重新渲染
    setTimeout(() => {
      setScoreDistributionSubject(newSubjectId);
    }, 0);
  };
  
  // 处理学生选择变化 - 修改为多选
  const handleStudentsChange = (event: React.SyntheticEvent, value: Student[]) => {
    // 限制最多选择两个学生
    if (value.length > 2) {
      showSnackbar('最多只能选择两名学生进行对比', 'warning');
      return;
    }
    setSelectedStudents(value);
  };
  
  // 处理Tab切换
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // 清空之前的数据
    if (newValue === 0) {
      setStudentsTrendData([]);
    } else if (newValue === 1) {
      setClassComparisonData(null);
    }
  };
  
  // 处理查询按钮点击
  const handleQuery = () => {
    if (tabValue === 0) {
      fetchStudentScoreTrend();
    } else if (tabValue === 1) {
      fetchClassScoreComparison();
    }
  };
  
  // 显示提示信息
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
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
  
  // 根据用户角色设置默认值和获取数据
  useEffect(() => {
    // 根据用户角色获取学生列表
    if (user && user.role === 'ROLE_HEADTEACHER' && user.classId) {
      fetchStudents(user.classId);
    } else {
      fetchStudents();
    }
  }, [user]);
  
  // 初始化
  useEffect(() => {
    fetchExams();
  }, []);
  
  // 渲染学生成绩趋势图
  const renderStudentTrendCharts = () => {
    if (!studentsTrendData.length) return null;
    
    return (
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {studentsTrendData.map((studentData, index) => {
            const data: { [key: string]: any[] } = {};
            const subjectNames: { [key: string]: string } = {};
            
            if (selectedSubject && selectedSubject !== '') {
              // 显示指定科目的成绩趋势
              const subjectId = selectedSubject.toString();
              if (studentData.trends[subjectId]) {
                data[subjectId] = studentData.trends[subjectId];
                
                // 查找科目名称
                const subject = studentData.subjects.find(s => s.id.toString() === subjectId);
                if (subject) {
                  subjectNames[subjectId] = subject.name;
                } else {
                  subjectNames[subjectId] = `科目${subjectId}`;
                }
              }
            } else {
              // 显示所有科目的成绩趋势，但不包括总分
              studentData.subjects.forEach(subject => {
                const subjectId = subject.id.toString();
                if (studentData.trends[subjectId]) {
                  data[subjectId] = studentData.trends[subjectId];
                  subjectNames[subjectId] = subject.name;
                }
              });
            }
            
            return (
              <Box 
                key={index}
                sx={{ width: '100%' }}
              >
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {studentData.student.name} ({studentData.student.studentNumber}) 
                    {studentData.student.className && (
                      <Chip label={studentData.student.className} size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <StudentScoreTrendChart
                    data={data}
                    subjectNames={subjectNames}
                    loading={loading}
                    height={350}
                    title={`${studentData.student.name} - 成绩趋势`}
                  />
                </Paper>
              </Box>
            );
          })}
        </Box>
        
        {/* 成绩列表 */}
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>成绩列表</Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>考试</TableCell>
                  <TableCell>科目</TableCell>
                  {studentsTrendData.map((data, index) => (
                    <TableCell key={index}>
                      {data.student.name} ({data.student.studentNumber})
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getScoreTableRows().map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    <TableCell>{row.examName}</TableCell>
                    <TableCell>{row.subjectName}</TableCell>
                    {row.scores.map((score, scoreIndex) => (
                      <TableCell key={scoreIndex}>
                        {score.score !== undefined ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{score.score}</Typography>
                            {score.rank && score.totalStudents && (
                              <Typography variant="caption" color="textSecondary">
                                排名: {score.rank}/{score.totalStudents}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };
  
  // 获取成绩表格行数据
  const getScoreTableRows = () => {
    if (!studentsTrendData.length) return [];
    
    const allExams = new Set<string>();
    const allSubjects = new Set<string>();
    const examSubjectMap: Record<string, Record<string, any[]>> = {};
    
    // 收集所有考试和科目，并按考试和科目分组存储成绩
    studentsTrendData.forEach((studentData, studentIndex) => {      
      // 处理各科目，不包括总分
      Object.keys(studentData.trends).forEach(subjectId => {
        if (subjectId === 'total') return; // 跳过总分
        
        const subject = studentData.subjects.find(s => s.id.toString() === subjectId);
        const subjectName = subject ? subject.name : `科目${subjectId}`;
        
        studentData.trends[subjectId].forEach(point => {
          const examKey = `${point.examId}-${point.examName}`;
          const subjectKey = `${subjectId}-${subjectName}`;
          
          allExams.add(examKey);
          allSubjects.add(subjectKey);
          
          if (!examSubjectMap[examKey]) {
            examSubjectMap[examKey] = {};
          }
          
          if (!examSubjectMap[examKey][subjectKey]) {
            // 初始化数组，使用空对象数组而不是填充相同的对象引用
            examSubjectMap[examKey][subjectKey] = Array(studentsTrendData.length).fill(null).map(() => ({}));
          }
          
          examSubjectMap[examKey][subjectKey][studentIndex] = {
            score: point.score,
            fullScore: point.fullScore,
            rank: point.rank,
            totalStudents: point.totalStudents
          };
        });
      });
    });
    
    // 转换为表格行数据
    const rows: Array<{
      examName: string;
      subjectName: string;
      scores: Array<{
        score?: number;
        fullScore?: number;
        rank?: number;
        totalStudents?: number;
      }>;
    }> = [];
    
    // 按考试和科目排序
    const sortedExams = Array.from(allExams).sort();
    const sortedSubjects = Array.from(allSubjects).sort();
    
    sortedExams.forEach(examKey => {
      const [, examName] = examKey.split('-');
      
      sortedSubjects.forEach(subjectKey => {
        // 跳过总分
        if (subjectKey === 'total') return;
        
        let [, subjectName] = subjectKey.split('-');
        
        if (examSubjectMap[examKey] && examSubjectMap[examKey][subjectKey]) {
          rows.push({
            examName,
            subjectName,
            scores: examSubjectMap[examKey][subjectKey]
          });
        }
      });
    });
    
    return rows;
  };
  
  // 修改：渲染班级成绩对比图方法中传递给图表组件的参数
  const renderClassComparisonChart = () => {
    if (!classComparisonData) return null;
    
    const data: { [key: string]: any } = {};
    
    if (selectedSubject && selectedSubject !== '') {
      // 显示指定科目的成绩对比
      const subjectId = selectedSubject.toString();
      const subjectStat = classComparisonData.subjectStats[subjectId];
      if (subjectStat) {
        data[subjectId] = subjectStat;
      }
    } else {
      // 显示所有科目的成绩对比
      Object.keys(classComparisonData.subjectStats).forEach(subjectId => {
        data[subjectId] = classComparisonData.subjectStats[subjectId];
      });
    }
    
    return (
      <>
        <ClassScoreComparisonChart
          data={data}
          totalStats={classComparisonData.totalStats}
          loading={loading}
          height={500}
          title={`${classComparisonData.className} - ${classComparisonData.exam.name} - 成绩对比`}
          showType={'score'} // 修改：默认只显示分数
          scoreType={'total'} // 修改：固定使用总分
        />
        
        {/* 班级成绩列表 */}
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>班级成绩详情</Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>科目</TableCell>
                  <TableCell align="center">平均分</TableCell>
                  <TableCell align="center">最高分</TableCell>
                  <TableCell align="center">最低分</TableCell>
                  <TableCell align="center">及格率</TableCell>
                  <TableCell align="center">优秀率</TableCell>
                  <TableCell align="center">满分</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(classComparisonData.subjectStats).map((subjectId) => {
                  const stats = classComparisonData.subjectStats[subjectId];
                  return (
                    <TableRow key={subjectId} hover>
                      <TableCell>{stats.subjectName}</TableCell>
                      <TableCell align="center">{stats.avgScore.toFixed(2)}</TableCell>
                      <TableCell align="center">{stats.maxScore}</TableCell>
                      <TableCell align="center">{stats.minScore}</TableCell>
                      <TableCell align="center">{(stats.passRate * 100).toFixed(2)}%</TableCell>
                      <TableCell align="center">{(stats.excellentRate * 100).toFixed(2)}%</TableCell>
                      <TableCell align="center">{stats.fullScore}</TableCell>
                    </TableRow>
                  );
                })}
                {/* 总分行 */}
                <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>总分</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{classComparisonData.totalStats.avgScore.toFixed(2)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{classComparisonData.totalStats.maxScore}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{classComparisonData.totalStats.minScore}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{(classComparisonData.totalStats.passRate * 100).toFixed(2)}%</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{(classComparisonData.totalStats.excellentRate * 100).toFixed(2)}%</TableCell>
                  <TableCell align="center">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* 成绩分布情况 */}
        <Paper sx={{ p: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              单科分数段分布
            </Typography>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="score-distribution-subject-label">选择科目</InputLabel>
              <Select
                labelId="score-distribution-subject-label"
                id="score-distribution-subject"
                value={scoreDistributionSubject}
                label="选择科目"
                onChange={handleScoreDistributionSubjectChange}
              >
                {Object.keys(classComparisonData.subjectStats).map((subjectId) => (
                  <MenuItem key={subjectId} value={subjectId}>
                    {classComparisonData.subjectStats[subjectId].subjectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* 当前选择的科目信息 */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
            <Typography variant="body2">
              当前选择: {classComparisonData.subjectStats[scoreDistributionSubject]?.subjectName || scoreDistributionSubject}
              {scoreRangeData[scoreDistributionSubject] && ` (共${scoreRangeData[scoreDistributionSubject].length}个分数段)`}
            </Typography>
          </Box>
          
          {scoreRangeData && scoreDistributionSubject && 
           scoreRangeData[scoreDistributionSubject] && 
           Array.isArray(scoreRangeData[scoreDistributionSubject]) && 
           scoreRangeData[scoreDistributionSubject].length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="40%">分数段</TableCell>
                    <TableCell align="center" width="30%">人数</TableCell>
                    <TableCell align="center" width="30%">占比</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scoreRangeData[scoreDistributionSubject].map((range, index) => (
                    <TableRow key={`range-${scoreDistributionSubject}-${index}`} hover>
                      <TableCell>{range.label || '未命名'}</TableCell>
                      <TableCell align="center">{range.count || 0}</TableCell>
                      <TableCell align="center">{((range.percentage || 0) * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                暂无分数段分布数据
              </Typography>
            </Box>
          )}
        </Paper>
      </>
    );
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        成绩统计
      </Typography>
      
      {/* 选项卡 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="统计分析选项卡">
          <Tab label="学生个人成绩趋势" {...a11yProps(0)} />
          <Tab label="班级考试成绩对比" {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      {/* 学生个人成绩趋势 */}
      <TabPanel value={tabValue} index={0}>
        {/* 学生成绩趋势筛选条件 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexBasis: { xs: '100%', sm: '23%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="exam-select-label">选择考试</InputLabel>
                  <Select
                    labelId="exam-select-label"
                    id="exam-select"
                    value={selectedExam}
                    label="选择考试"
                    onChange={handleExamChange}
                  >
                    <MenuItem value=""><em>所有考试</em></MenuItem>
                    {exams.map((exam) => (
                      <MenuItem key={exam.id} value={exam.id}>
                        {exam.name} {exam.className ? `(${exam.className})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '23%' } }}>
                <FormControl fullWidth size="small" disabled={!selectedExam || subjects.length === 0}>
                  <InputLabel id="subject-select-label">选择科目</InputLabel>
                  <Select
                    labelId="subject-select-label"
                    id="subject-select"
                    value={selectedSubject}
                    label="选择科目"
                    onChange={handleSubjectChange}
                  >
                    <MenuItem value=""><em>所有科目</em></MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '23%' } }}>
                <Autocomplete
                  multiple
                  id="students-select"
                  options={students}
                  getOptionLabel={(option) => `${option.name} (${option.studentNumber})`}
                  value={selectedStudents}
                  onChange={handleStudentsChange}
                  renderInput={(params) => (
                    <TextField {...params} label="选择学生(最多2名)" size="small" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.name} ({option.studentNumber})
                      {option.className && <Chip 
                        label={option.className} 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />}
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={index}
                        label={`${option.name} (${option.studentNumber})`}
                        size="small"
                      />
                    ))
                  }
                />
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '23%' } }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  disabled={loading}
                  onClick={handleQuery}
                >
                  {loading ? <CircularProgress size={24} /> : '查询'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 3 }}>
          {studentsTrendData.length > 0 ? (
            <>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  学生成绩趋势对比
                </Typography>
                <Chip 
                  label={`已选择 ${studentsTrendData.length} 名学生`} 
                  color="primary" 
                />
              </Stack>
              {renderStudentTrendCharts()}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="body1" color="textSecondary">
                请选择学生并点击查询按钮查看成绩趋势
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      {/* 班级考试成绩对比 */}
      <TabPanel value={tabValue} index={1}>
        {/* 班级成绩对比筛选条件 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="exam-select-label">选择考试</InputLabel>
                  <Select
                    labelId="exam-select-label"
                    id="exam-select"
                    value={selectedExam}
                    label="选择考试"
                    onChange={handleExamChange}
                  >
                    <MenuItem value=""><em>所有考试</em></MenuItem>
                    {exams.map((exam) => (
                      <MenuItem key={exam.id} value={exam.id}>
                        {exam.name} {exam.className ? `(${exam.className})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '45%' } }}>
                <FormControl fullWidth size="small" disabled={!selectedExam || subjects.length === 0}>
                  <InputLabel id="subject-select-label">选择科目</InputLabel>
                  <Select
                    labelId="subject-select-label"
                    id="subject-select"
                    value={selectedSubject}
                    label="选择科目"
                    onChange={handleSubjectChange}
                  >
                    <MenuItem value=""><em>所有科目</em></MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flexBasis: { xs: '100%', sm: '100%' }, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                  onClick={handleQuery}
                  sx={{ minWidth: '120px' }}
                >
                  {loading ? <CircularProgress size={24} /> : '查询'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 3 }}>
          {classComparisonData ? (
            <>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  {classComparisonData.className} - {classComparisonData.exam.name} 成绩对比
                </Typography>
              </Stack>
              {renderClassComparisonChart()}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="body1" color="textSecondary">
                请选择考试并点击查询按钮查看班级成绩对比
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      {/* 提示信息 */}
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
  );
};

export default ScoreStatistics; 