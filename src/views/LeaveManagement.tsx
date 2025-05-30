import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LeaveService from '../api/leave';
import { formatDateTime } from '../utils/dateUtils';
import { getAllStudents } from '../api/student';
import { zhCN } from 'date-fns/locale';

// 请假类型定义
interface LeaveType {
  id: number;
  studentId: number;
  studentName: string;
  className: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: string;
  approver?: string;
  createTime: string;
  student?: {
    id: number;
    name: string;
    classInfo?: {
      className: string;
    };
  };
}

// 学生类型定义
interface StudentType {
  id: number;
  name: string;
  className: string;
  classInfo?: {
    className: string;
  };
}

const LeaveManagement: React.FC = () => {
  // 状态定义
  const [loading, setLoading] = useState(false);
  const [leaveList, setLeaveList] = useState<LeaveType[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('新增请假');
  const [studentOptions, setStudentOptions] = useState<StudentType[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentLeave, setCurrentLeave] = useState<LeaveType | null>(null);
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [formStartDatePickerOpen, setFormStartDatePickerOpen] = useState(false);
  const [formEndDatePickerOpen, setFormEndDatePickerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });
  
  // 表单Ref
  const formRef = useRef<HTMLFormElement>(null);
  
  // 获取当前用户
  const { user } = useAuth();
  
  // 判断用户是否为教师角色（只读权限）
  const isTeacherRole = user?.role === 'ROLE_TEACHER';
  
  // 筛选条件
  const [filters, setFilters] = useState({
    studentName: '',
    leaveType: '',
    status: '',
    dateRange: [null, null] as (Date | null)[]
  });
  
  // 请假表单
  const [leaveForm, setLeaveForm] = useState({
    id: null as number | null,
    studentId: '',
    leaveType: '',
    dateRange: [null, null] as (Date | null)[],
    reason: ''
  });
  
  // 清除表单错误
  const clearFormErrors = () => {
    setFormErrors({});
  };
  
  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!leaveForm.studentId) {
      errors.studentId = '请选择学生';
    }
    
    if (!leaveForm.leaveType) {
      errors.leaveType = '请选择请假类型';
    }
    
    if (!leaveForm.dateRange[0] || !leaveForm.dateRange[1]) {
      errors.dateRange = '请选择请假时间';
    }
    
    if (!leaveForm.reason) {
      errors.reason = '请输入请假原因';
    } else if (leaveForm.reason.length < 5) {
      errors.reason = '请假原因至少5个字符';
    } else if (leaveForm.reason.length > 500) {
      errors.reason = '请假原因最多500个字符';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 获取请假列表
  const getLeaveList = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const pageToUse = pageOverride !== undefined ? pageOverride : currentPage;
      console.log('当前页码状态:', currentPage); // 添加日志查看状态更新情况
      console.log('实际使用的页码:', pageToUse); // 添加日志查看实际使用的页码
      
      const params = {
        studentName: filters.studentName || null,
        leaveType: filters.leaveType || null,
        status: filters.status || null,
        startDate: filters.dateRange[0] ? formatDate(filters.dateRange[0]) : null,
        endDate: filters.dateRange[1] ? formatDate(filters.dateRange[1]) : null,
        // 页码从0开始传递给后端
        page: pageToUse, 
        size: pageSize
      };
      
      console.log('请求参数:', params); // 添加日志记录请求参数
      
      const response = await LeaveService.getLeaves(params);
      
      // 处理返回的数据
      if (response && response.data) {
        console.log('返回数据:', response.data); // 添加日志记录返回数据
        
        // 根据API返回格式调整
        const content = response.data.content || response.data;
        const total = response.data.totalElements || content.length;
        
        // 转换数据格式
        const leaves = content.map((leave: any) => ({
          ...leave,
          studentName: leave.student?.name || '未知学生',
          className: leave.student?.classInfo?.className || '未知班级',
          approver: leave.approver?.name || ''
        }));
        
        setLeaveList(leaves);
        setTotal(total);
      } else {
        setLeaveList([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('获取请假列表失败:', error);
      setLeaveList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 获取学生列表
  const getStudentList = async () => {
    try {
      const response = await getAllStudents();
      if (response && response.data) {
        const students = response.data.map((student: any) => ({
          id: student.id,
          name: student.name,
          className: student.classInfo ? student.classInfo.className : '未分配班级'
        }));
        setStudentOptions(students);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    }
  };
  
  // 格式化日期
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 获取请假类型标签
  const getLeaveTypeTag = (type: string) => {
    switch (type) {
      case 'SICK':
        return <Chip label="病假" color="error" size="small" />;
      case 'PERSONAL':
        return <Chip label="事假" color="warning" size="small" />;
      default:
        return <Chip label="其他" color="default" size="small" />;
    }
  };
  
  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Chip label="待审批" color="default" size="small" />;
      case 'APPROVED':
        return <Chip label="已批准" color="success" size="small" />;
      case 'REJECTED':
        return <Chip label="已拒绝" color="error" size="small" />;
      default:
        return <Chip label="未知" size="small" />;
    }
  };
  
  // 处理搜索
  const handleSearch = () => {
    console.log('执行搜索');
    setCurrentPage(0);
    
    // 直接调用 getLeaveList 函数，但传入我们期望的参数，而不依赖于状态更新
    console.log('搜索后立即获取数据');
    getLeaveList(0); // 明确传入页码0，确保从第一页开始
  };
  
  // 重置筛选条件
  const resetFilters = () => {
    console.log('重置筛选条件');
    // 一次性更新所有状态，而不是分别更新
    const emptyFilters = {
      studentName: '',
      leaveType: '',
      status: '',
      dateRange: [null, null]
    };
    
    setFilters(emptyFilters);
    setCurrentPage(0);
    
    // 直接调用 getLeaveList 函数，但传入我们期望的参数，而不依赖于状态更新
    console.log('重置后立即获取数据');
    getLeaveList(0); // 明确传入页码0，确保从第一页开始
    
    // 添加可见的成功提示
    showSnackbar('已重置筛选条件', 'info');
  };
  
  // 处理页面大小变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    console.log('设置每页行数:', newPageSize);
    setPageSize(newPageSize);
    setCurrentPage(0);
    
    // 直接调用 getLeaveList 函数，但传入我们期望的参数
    console.log('更新每页行数后立即获取数据');
    getLeaveList(0); // 明确传入页码0，确保从第一页开始
  };
  
  // 处理页码变化
  const handleChangePage = (event: unknown, newPage: number) => {
    console.log('切换到页码:', newPage); // 添加日志
    setCurrentPage(newPage);
    
    // 直接调用 getLeaveList 函数，但传入新页码参数
    console.log('页码切换后立即获取数据:', newPage);
    getLeaveList(newPage);
  };
  
  // 打开添加对话框
  const openAddDialog = async () => {
    // 教师角色不能添加请假
    if (isTeacherRole) {
      showSnackbar('教师角色无权限添加请假记录', 'warning');
      return;
    }
    
    setDialogTitle('新增请假');
    setLeaveForm({
      id: null,
      studentId: '',
      leaveType: '',
      dateRange: [null, null],
      reason: ''
    });
    clearFormErrors();
    setIsViewMode(false);
    setCurrentLeave(null);
    setFormStartDatePickerOpen(false);
    setFormEndDatePickerOpen(false);
    
    // 确保有最新的学生列表
    await getStudentList();
    
    setDialogOpen(true);
  };
  
  // 提交请假表单
  const submitLeaveForm = async () => {
    // 教师角色不能提交表单
    if (isTeacherRole) {
      showSnackbar('教师角色无权限操作', 'warning');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);
    try {
      const leaveData = {
        studentId: parseInt(leaveForm.studentId),
        leaveType: leaveForm.leaveType,
        startDate: formatDate(leaveForm.dateRange[0]),
        endDate: formatDate(leaveForm.dateRange[1]),
        reason: leaveForm.reason.trim()
      };
      
      if (leaveForm.id) {
        // 更新请假
        await LeaveService.updateLeave(leaveForm.id, leaveData);
        showSnackbar('更新请假成功', 'success');
      } else {
        // 新增请假
        await LeaveService.createLeave(leaveData);
        showSnackbar('新增请假成功', 'success');
      }
      
      setDialogOpen(false);
      getLeaveList(); // 刷新列表
    } catch (error: any) {
      console.error('提交请假失败:', error);
      showSnackbar('提交请假失败: ' + (error.response?.data?.message || '请检查输入'), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // 批准请假
  const handleApprove = async (leave: LeaveType) => {
    // 教师角色不能批准请假
    if (isTeacherRole) {
      showSnackbar('教师角色无权限操作', 'warning');
      return;
    }
    
    if (!user || !user.id) {
      showSnackbar('获取当前用户信息失败，请重新登录', 'error');
      return;
    }
    
    // 使用通用确认对话框
    setConfirmDialog({
      open: true,
      title: '批准请假',
      content: `确定批准 ${leave.studentName} 的请假申请吗？`,
      onConfirm: async () => {
        try {
          await LeaveService.approveLeave(leave.id, user.id);
          showSnackbar('请假申请已批准', 'success');
          getLeaveList(); // 刷新列表
        } catch (error) {
          console.error('批准请假失败:', error);
          showSnackbar('批准请假失败', 'error');
        }
      }
    });
  };
  
  // 拒绝请假
  const handleReject = async (leave: LeaveType) => {
    // 教师角色不能拒绝请假
    if (isTeacherRole) {
      showSnackbar('教师角色无权限操作', 'warning');
      return;
    }
    
    if (!user || !user.id) {
      showSnackbar('获取当前用户信息失败，请重新登录', 'error');
      return;
    }
    
    openConfirmDialog(
      '拒绝请假',
      `确定拒绝 ${leave.studentName} 的请假申请吗？`,
      async () => {
        try {
          await LeaveService.rejectLeave(leave.id, user.id);
          showSnackbar('请假申请已拒绝', 'success');
          getLeaveList(); // 刷新列表
        } catch (error) {
          console.error('拒绝请假失败:', error);
          showSnackbar('拒绝请假失败', 'error');
        }
      }
    );
  };
  
  // 删除请假
  const handleDelete = async (leave: LeaveType) => {
    // 教师角色不能删除请假
    if (isTeacherRole) {
      showSnackbar('教师角色无权限操作', 'warning');
      return;
    }
    
    // 使用专门的删除确认对话框
    setConfirmDialog({
      open: true,
      title: '删除请假',
      content: `确定删除 ${leave.studentName} 的请假记录吗？`,
      onConfirm: async () => {
        try {
          await LeaveService.deleteLeave(leave.id);
          showSnackbar('请假记录已删除', 'success');
          getLeaveList(); // 刷新列表
        } catch (error) {
          console.error('删除请假失败:', error);
          showSnackbar('删除请假失败', 'error');
        }
      }
    });
  };
  
  // 查看请假详情
  const handleView = async (leave: LeaveType) => {
    try {
      setLoading(true);
      // 使用已有的leave数据而不是重新请求
      // const response = await LeaveService.getLeaveById(leave.id);
      // const leaveData = response.data;
      
      // 保存当前查看的请假详情
      setCurrentLeave(leave);
      
      setLeaveForm({
        id: leave.id,
        studentId: String(leave.studentId || leave.student?.id || ''),
        leaveType: leave.leaveType,
        dateRange: [new Date(leave.startDate), new Date(leave.endDate)],
        reason: leave.reason
      });
      
      setDialogTitle('查看请假');
      clearFormErrors();
      
      // 教师角色或查看模式都设置为只读
      setIsViewMode(true);
      
      setFormStartDatePickerOpen(false);
      setFormEndDatePickerOpen(false);
      setDialogOpen(true);
    } catch (error) {
      console.error('获取请假详情失败:', error);
      // 不使用alert，避免阻塞UI
      // alert('获取请假详情失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 处理下拉框变化
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 处理开始日期变化
  const handleStartDateChange = (newValue: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: [newValue, prev.dateRange[1]]
    }));
  };
  
  // 处理结束日期变化
  const handleEndDateChange = (newValue: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: [prev.dateRange[0], newValue]
    }));
  };
  
  // 处理表单开始日期变化
  const handleFormStartDateChange = (newValue: Date | null) => {
    setLeaveForm(prev => ({
      ...prev,
      dateRange: [newValue, prev.dateRange[1]]
    }));
    
    // 清除日期范围错误
    if (formErrors.dateRange) {
      setFormErrors(prev => ({
        ...prev,
        dateRange: ''
      }));
    }
  };
  
  // 处理表单结束日期变化
  const handleFormEndDateChange = (newValue: Date | null) => {
    setLeaveForm(prev => ({
      ...prev,
      dateRange: [prev.dateRange[0], newValue]
    }));
    
    // 清除日期范围错误
    if (formErrors.dateRange) {
      setFormErrors(prev => ({
        ...prev,
        dateRange: ''
      }));
    }
  };
  
  // 处理筛选条件变化
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
  
  // 页面加载时获取数据
  useEffect(() => {
    getLeaveList();
    getStudentList();
  }, []);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          学生请假管理
        </Typography>
        {!isTeacherRole && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            新增请假
          </Button>
        )}
      </Box>
      
      {/* 筛选区域 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 220px', maxWidth: { xs: '100%', sm: '220px' } }}>
              <TextField
                name="studentName"
                label="学生姓名"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.studentName}
                onChange={handleFilterChange}
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  )
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 220px', maxWidth: { xs: '100%', sm: '220px' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>请假类型</InputLabel>
                <Select
                  name="leaveType"
                  label="请假类型"
                  value={filters.leaveType}
                  onChange={e => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="SICK">病假</MenuItem>
                  <MenuItem value="PERSONAL">事假</MenuItem>
                  <MenuItem value="OTHER">其他</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 220px', maxWidth: { xs: '100%', sm: '220px' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>状态</InputLabel>
                <Select
                  name="status"
                  label="状态"
                  value={filters.status}
                  onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="PENDING">待审批</MenuItem>
                  <MenuItem value="APPROVED">已批准</MenuItem>
                  <MenuItem value="REJECTED">已拒绝</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 auto', maxWidth: { xs: '100%', sm: '280px' } }}>
              <Stack direction="row" spacing={1}>
                <div style={{ width: '126px' }}>
                  <DatePicker
                    label="开始日期"
                    value={filters.dateRange[0]}
                    onChange={handleStartDateChange}
                    enableAccessibleFieldDOMStructure={false}
                    slotProps={{
                      textField: { 
                        size: 'small', 
                        fullWidth: true,
                        onClick: () => setStartDatePickerOpen(true)
                      }
                    }}
                    open={startDatePickerOpen}
                    onClose={() => setStartDatePickerOpen(false)}
                  />
                </div>
                <div style={{ width: '126px' }}>
                  <DatePicker
                    label="结束日期"
                    value={filters.dateRange[1]}
                    onChange={handleEndDateChange}
                    enableAccessibleFieldDOMStructure={false}
                    slotProps={{
                      textField: { 
                        size: 'small', 
                        fullWidth: true,
                        onClick: () => setEndDatePickerOpen(true)
                      }
                    }}
                    open={endDatePickerOpen}
                    onClose={() => setEndDatePickerOpen(false)}
                  />
                </div>
              </Stack>
            </Box>
            <Box sx={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end' }}>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  startIcon={<SearchIcon />}
                  type="button"
                >
                  查询
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={(e) => {
                    e.preventDefault();
                    resetFilters();
                  }}
                  startIcon={<RefreshIcon />}
                  type="button"
                >
                  重置
                </Button>
              </Stack>
            </Box>
          </Box>
        </LocalizationProvider>
      </Paper>
      
      {/* 表格区域 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>学生姓名</TableCell>
                <TableCell>班级</TableCell>
                <TableCell>请假类型</TableCell>
                <TableCell>开始日期</TableCell>
                <TableCell>结束日期</TableCell>
                <TableCell>请假天数</TableCell>
                <TableCell>请假原因</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>审批人</TableCell>
                <TableCell>申请时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : leaveList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    没有找到请假记录
                  </TableCell>
                </TableRow>
              ) : (
                leaveList.map((leave) => (
                  <TableRow key={leave.id} hover>
                    <TableCell>{leave.studentName}</TableCell>
                    <TableCell>{leave.className}</TableCell>
                    <TableCell>{getLeaveTypeTag(leave.leaveType)}</TableCell>
                    <TableCell>{leave.startDate}</TableCell>
                    <TableCell>{leave.endDate}</TableCell>
                    <TableCell>{leave.duration}</TableCell>
                    <TableCell>
                      <Tooltip title={leave.reason}>
                        <span>{leave.reason.length > 20 ? leave.reason.substring(0, 20) + '...' : leave.reason}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{getStatusTag(leave.status)}</TableCell>
                    <TableCell>{leave.approver || '-'}</TableCell>
                    <TableCell>{formatDateTime(leave.createTime)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {!isTeacherRole && leave.status === 'PENDING' && (
                          <>
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleApprove(leave)}
                              title="批准"
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleReject(leave)}
                              title="拒绝"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleView(leave);
                          }}
                          title="查看"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {!isTeacherRole && (
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(leave)}
                            title="删除"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
        />
      </Paper>
      
      {/* 新增/编辑请假对话框 */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Box>
                  <FormControl fullWidth error={!!formErrors.studentId} disabled={isViewMode}>
                    <InputLabel>学生</InputLabel>
                    <Select
                      name="studentId"
                      label="学生"
                      value={leaveForm.studentId}
                      onChange={e => handleSelectChange(e as any)}
                      disabled={isViewMode}
                    >
                      {isViewMode && currentLeave ? (
                        // 查看模式下只显示当前学生
                        <MenuItem value={leaveForm.studentId}>
                          {currentLeave.student?.name || currentLeave.studentName || '未知学生'} 
                          ({currentLeave.student?.classInfo?.className || currentLeave.className || '未知班级'})
                        </MenuItem>
                      ) : (
                        // 编辑模式下显示所有学生
                        studentOptions.map(student => (
                          <MenuItem key={student.id} value={student.id}>
                            {student.name} ({student.className})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {formErrors.studentId && <FormHelperText>{formErrors.studentId}</FormHelperText>}
                  </FormControl>
                </Box>
                <Box>
                  <FormControl fullWidth error={!!formErrors.leaveType} disabled={isViewMode}>
                    <InputLabel>请假类型</InputLabel>
                    <Select
                      name="leaveType"
                      label="请假类型"
                      value={leaveForm.leaveType}
                      onChange={e => handleSelectChange(e as any)}
                      disabled={isViewMode}
                    >
                      <MenuItem value="SICK">病假</MenuItem>
                      <MenuItem value="PERSONAL">事假</MenuItem>
                      <MenuItem value="OTHER">其他</MenuItem>
                    </Select>
                    {formErrors.leaveType && <FormHelperText>{formErrors.leaveType}</FormHelperText>}
                  </FormControl>
                </Box>
                <Box>
                  <Stack direction="row" spacing={2}>
                    <DatePicker
                      label="开始日期"
                      value={leaveForm.dateRange[0]}
                      onChange={handleFormStartDateChange}
                      enableAccessibleFieldDOMStructure={false}
                      slotProps={{
                        textField: { 
                          fullWidth: true, 
                          error: !!formErrors.dateRange,
                          onClick: () => !isViewMode && setFormStartDatePickerOpen(true)
                        }
                      }}
                      disabled={isViewMode}
                      readOnly={isViewMode}
                      open={!isViewMode && formStartDatePickerOpen}
                      onClose={() => setFormStartDatePickerOpen(false)}
                    />
                    <DatePicker
                      label="结束日期"
                      value={leaveForm.dateRange[1]}
                      onChange={handleFormEndDateChange}
                      enableAccessibleFieldDOMStructure={false}
                      slotProps={{
                        textField: { 
                          fullWidth: true, 
                          error: !!formErrors.dateRange,
                          onClick: () => !isViewMode && setFormEndDatePickerOpen(true)
                        }
                      }}
                      disabled={isViewMode}
                      readOnly={isViewMode}
                      open={!isViewMode && formEndDatePickerOpen}
                      onClose={() => setFormEndDatePickerOpen(false)}
                    />
                  </Stack>
                  {formErrors.dateRange && (
                    <FormHelperText error>{formErrors.dateRange}</FormHelperText>
                  )}
                </Box>
                <Box>
                  <TextField
                    name="reason"
                    label="请假原因"
                    multiline
                    rows={4}
                    fullWidth
                    value={leaveForm.reason}
                    onChange={handleInputChange}
                    error={!!formErrors.reason}
                    helperText={formErrors.reason || '请输入请假原因（5-500个字符）'}
                    inputProps={{ maxLength: 500 }}
                    disabled={isViewMode}
                    InputProps={{
                      readOnly: isViewMode
                    }}
                  />
                </Box>
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDialogOpen(false)}
              type="button"
            >
              {isViewMode ? '关闭' : '取消'}
            </Button>
            {!isViewMode && !isTeacherRole && (
              <Button 
                onClick={submitLeaveForm} 
                variant="contained" 
                disabled={submitLoading}
                type="button"
              >
                {submitLoading ? <CircularProgress size={24} /> : '确定'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      
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
      
      {/* 确认对话框 */}
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
            color={confirmDialog.title === '删除请假' ? 'error' : 'primary'} 
            variant="contained"
            autoFocus
          >
            {confirmDialog.title === '删除请假' ? '确定删除' : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement; 