import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  GridLegacy as Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Button,
  styled,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Popover,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getTeacherSchedule, saveTeacherSchedule } from '../api/dashboard';

// 定义类型
interface TimeSlot {
  startTime: string;
  endTime: string;
  periodName: string;
}

interface ScheduleRow {
  id: number;
  time: string;
  startTime: string;
  endTime: string;
  periodName: string;
  [key: string]: any; // 用于存储周一到周五的课程内容
}

interface WeekDay {
  label: string;
  value: string;
}

interface Statistics {
  teacherCount: number;
  studentCount: number;
  classCount: number;
}

// 样式化组件
const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const ScheduleCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  marginTop: theme.spacing(4),
  overflow: 'visible',
}));

const ScheduleHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ScheduleTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const TimeCell = styled(TableCell)(({ theme }) => ({
  position: 'relative',
  whiteSpace: 'pre-line',
  minWidth: '150px',
  maxWidth: '150px',
  width: '150px',
}));

const EditTimeButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  right: '24px',
  padding: '4px',
  opacity: 0.5,
  '&:hover': {
    opacity: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

// 仪表盘组件
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    teacherCount: 0,
    studentCount: 0,
    classCount: 0,
  });

  // 课程表相关状态
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  const [editableSchedule, setEditableSchedule] = useState<ScheduleRow[]>([]);
  const [scheduleDialogVisible, setScheduleDialogVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [timeEditAnchorEl, setTimeEditAnchorEl] = useState<null | HTMLElement>(null);
  const [currentEditingTime, setCurrentEditingTime] = useState<ScheduleRow | null>(null);
  
  // 周一到周五
  const weekDays: WeekDay[] = [
    { label: '周一', value: 'monday' },
    { label: '周二', value: 'tuesday' },
    { label: '周三', value: 'wednesday' },
    { label: '周四', value: 'thursday' },
    { label: '周五', value: 'friday' },
  ];

  // 默认时间段配置
  const defaultTimeSlots: TimeSlot[] = [
    { startTime: '08:00', endTime: '08:45', periodName: '第一节' },
    { startTime: '08:55', endTime: '09:40', periodName: '第二节' },
    { startTime: '10:00', endTime: '10:45', periodName: '第三节' },
    { startTime: '10:55', endTime: '11:40', periodName: '第四节' },
    { startTime: '14:00', endTime: '14:45', periodName: '第五节' },
    { startTime: '14:55', endTime: '15:40', periodName: '第六节' },
    { startTime: '16:00', endTime: '16:45', periodName: '第七节' },
    { startTime: '16:55', endTime: '17:40', periodName: '第八节' },
  ];

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response && response.data) {
        setStatistics({
          teacherCount: response.data.teacherCount || 0,
          studentCount: response.data.studentCount || 0,
          classCount: response.data.classCount || 0,
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 使用默认数据
      setStatistics({
        teacherCount: 0,
        studentCount: 0,
        classCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化课程表数据
  const initScheduleData = async () => {
    try {
      const response = await getTeacherSchedule();
      if (response && response.data && response.data.scheduleData) {
        try {
          // 后端返回的是JSON字符串，需要解析
          const parsedSchedule = JSON.parse(response.data.scheduleData);
          
          // 确保每行数据都有完整的时间信息
          setScheduleData(parsedSchedule.map((row: any, index: number) => {
            // 如果没有时间相关属性，则添加
            if (!row.startTime || !row.endTime) {
              const defaultSlot = defaultTimeSlots[index] || {
                startTime: '00:00',
                endTime: '00:00',
                periodName: `第${index + 1}节`
              };
              
              // 从时间字符串中解析
              const timeParts = row.time.split('\n')[0].split('-');
              
              return {
                ...row,
                id: index + 1,
                startTime: timeParts[0] || defaultSlot.startTime,
                endTime: timeParts[1] || defaultSlot.endTime,
                periodName: row.time.split('\n')[1] || defaultSlot.periodName,
              };
            }
            
            return { ...row, id: index + 1 };
          }));
        } catch (error) {
          console.error('解析课程表数据失败:', error);
          createDefaultSchedule();
        }
      } else {
        // 没有数据或格式不对，创建默认课程表
        createDefaultSchedule();
      }
    } catch (error) {
      console.error('获取课程表数据失败:', error);
      createDefaultSchedule();
    }
  };

  // 创建默认课程表
  const createDefaultSchedule = () => {
    // 创建空的课程表
    const newScheduleData = defaultTimeSlots.map((slot, index) => {
      const timeStr = `${slot.startTime}-${slot.endTime}\n${slot.periodName}`;
      const row: ScheduleRow = { 
        id: index + 1,
        time: timeStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        periodName: slot.periodName,
      };
      
      weekDays.forEach(day => {
        row[day.value] = '';
      });
      
      return row;
    });
    
    setScheduleData(newScheduleData);
  };

  // 处理编辑课程表
  const handleEditSchedule = () => {
    setEditableSchedule(JSON.parse(JSON.stringify(scheduleData)));
    setScheduleDialogVisible(true);
  };

  // 打开时间编辑弹出框
  const handleTimeEditClick = (event: React.MouseEvent<HTMLButtonElement>, row: ScheduleRow) => {
    setTimeEditAnchorEl(event.currentTarget);
    setCurrentEditingTime({...row});
  };

  // 关闭时间编辑弹出框
  const handleTimeEditClose = () => {
    setTimeEditAnchorEl(null);
    setCurrentEditingTime(null);
  };

  // 更新时间槽
  const updateTimeSlot = () => {
    if (!currentEditingTime) return;
    
    if (currentEditingTime.startTime && currentEditingTime.endTime) {
      const startTime = currentEditingTime.startTime;
      const endTime = currentEditingTime.endTime;
      const periodName = currentEditingTime.periodName || '';
      
      const updatedRow = {
        ...currentEditingTime,
        startTime,
        endTime,
        time: `${startTime}-${endTime}\n${periodName}`,
      };
      
      // 更新scheduleData中的对应行
      const updatedScheduleData = scheduleData.map(row => 
        row.id === updatedRow.id ? updatedRow : row
      );
      
      setScheduleData(updatedScheduleData);
      
      // 检查用户登录状态
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        showSnackbar('登录已过期，请重新登录', 'warning');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      // 自动保存到服务器
      saveTeacherSchedule(updatedScheduleData)
        .then(() => {
          showSnackbar('时间更新成功并已保存', 'success');
        })
        .catch(error => {
          console.error('保存课程表失败:', error);
          if (error.response?.status === 403 || error.response?.status === 401) {
            showSnackbar('登录已过期或权限不足，请重新登录', 'warning');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          } else {
            showSnackbar('保存失败: ' + (error.response?.data?.message || '请稍后重试'), 'error');
          }
        });
      
      handleTimeEditClose();
    }
  };

  // 保存课程表
  const handleSaveSchedule = async () => {
    setSubmitLoading(true);
    
    // 检查用户登录状态
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      showSnackbar('登录已过期，请重新登录', 'warning');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      setSubmitLoading(false);
      return;
    }
    
    try {
      await saveTeacherSchedule(editableSchedule);
      setScheduleData(JSON.parse(JSON.stringify(editableSchedule)));
      setScheduleDialogVisible(false);
      showSnackbar('课程表保存成功', 'success');
    } catch (error: any) {
      console.error('保存课程表失败:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        showSnackbar('登录已过期或权限不足，请重新登录', 'warning');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      } else {
        showSnackbar('保存课程表失败: ' + (error.response?.data?.message || '请稍后重试'), 'error');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // 处理课程内容变化
  const handleScheduleChange = (rowIndex: number, dayKey: string, value: string) => {
    const updatedSchedule = [...editableSchedule];
    updatedSchedule[rowIndex][dayKey] = value;
    setEditableSchedule(updatedSchedule);
  };

  // 处理时间输入变化
  const handleTimeChange = (field: 'startTime' | 'endTime' | 'periodName', value: string) => {
    if (currentEditingTime) {
      setCurrentEditingTime({
        ...currentEditingTime,
        [field]: value
      });
    }
  };

  // 模拟统计数据
  const statsData = [
    {
      title: '教师总数',
      value: statistics.teacherCount,
      icon: <PeopleIcon color="primary" fontSize="large" />,
      color: 'primary.main',
    },
    {
      title: '学生总数',
      value: statistics.studentCount,
      icon: <SchoolIcon sx={{ color: '#34c759' }} fontSize="large" />,
      color: 'success.main',
    },
    {
      title: '班级总数',
      value: statistics.classCount,
      icon: <AssessmentIcon sx={{ color: '#ff9500' }} fontSize="large" />,
      color: 'warning.main',
    },
  ];

  // 初始化数据
  useEffect(() => {
    fetchStatistics();
    initScheduleData();
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        仪表盘
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ marginBottom: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} lg={4}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: `${stat.color}15`,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        ))}
      </Grid>

      {/* 课程表 */}
      <ScheduleCard>
        <ScheduleHeader>
          <Typography variant="h6">我的课程表</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditSchedule}
          >
            编辑课程表
          </Button>
        </ScheduleHeader>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="150px">时间</TableCell>
                  {weekDays.map((day) => (
                    <TableCell key={day.value}>{day.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduleData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                    <TimeCell>
                      {row.time}
                      <Tooltip title="编辑时间">
                        <EditTimeButton size="small" onClick={(e) => handleTimeEditClick(e, row)}>
                          <EditIcon fontSize="small" />
                        </EditTimeButton>
                      </Tooltip>
                    </TimeCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.value}>
                        {row[day.value]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </ScheduleCard>

      {/* 编辑课程表对话框 */}
      <Dialog 
        open={scheduleDialogVisible} 
        onClose={() => setScheduleDialogVisible(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>编辑课程表</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            请在对应时间段填写课程内容，留空表示没有课程
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="150px">时间</TableCell>
                  {weekDays.map((day) => (
                    <TableCell key={day.value}>{day.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {editableSchedule.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell width="150px">{row.time}</TableCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.value}>
                        <ScheduleTextField
                          value={row[day.value] || ''}
                          onChange={(e) => handleScheduleChange(rowIndex, day.value, e.target.value)}
                          placeholder="请输入课程"
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogVisible(false)}>取消</Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained" 
            color="primary"
            disabled={submitLoading}
            startIcon={submitLoading ? null : <SaveIcon />}
          >
            {submitLoading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 时间编辑弹出框 */}
      <Popover
        open={Boolean(timeEditAnchorEl)}
        anchorEl={timeEditAnchorEl}
        onClose={handleTimeEditClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>编辑时间</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>开始时间</Typography>
            <TextField
              type="time"
              value={currentEditingTime?.startTime || ''}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5分钟步长
              }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>结束时间</Typography>
            <TextField
              type="time"
              value={currentEditingTime?.endTime || ''}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5分钟步长
              }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>课时名称</Typography>
            <TextField
              value={currentEditingTime?.periodName || ''}
              onChange={(e) => handleTimeChange('periodName', e.target.value)}
              placeholder="例如：第一节"
              size="small"
              fullWidth
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleTimeEditClose} sx={{ mr: 1 }}>
              取消
            </Button>
            <Button onClick={updateTimeSlot} variant="contained" color="primary">
              确认
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 