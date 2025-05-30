import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  InputAdornment,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  styled,
  GridLegacy as Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as classAPI from '../api/class';
import { getAllTeachers } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/dateUtils';

// 统一的高度样式
const commonHeight = '40px';

// 样式化组件
const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
}));

const StatCard = styled(Card)(({ theme }) => ({
  minWidth: 200,
  flex: 1,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const StatIconBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

// 班级类型定义 - 匹配后端模型
interface Class {
  id: number;
  name: string;
  className: string;
  grade: string;
  headTeacher: {
    id: number;
    name: string;
    username: string;
  } | null;
  studentCount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 教师类型定义
interface Teacher {
  id: number;
  name: string;
  username: string;
}

// 班级管理组件
const ClassManagement: React.FC = () => {
  // 状态
  const { user } = useAuth();
  // 判断用户是否为教师角色（只读权限）
  const isTeacherRole = user?.role === 'ROLE_TEACHER';
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    grade: '',
    headTeacher: null,
    description: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageStudentsPerClass: 0,
  });
  
  // 分配班主任对话框状态
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // 删除确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  // 获取班级列表
  const fetchClasses = async () => {
    setLoading(true);
    try {
      let response;
      if (searchTerm.trim()) {
        response = await classAPI.searchClasses(searchTerm);
      } else {
        response = await classAPI.getAllClasses();
      }
      
      // 数据在response或response.data中
      const responseData = response.data || response;
      
      if (responseData) {
        // 判断是否为数组
        if (Array.isArray(responseData)) {
          setClasses(responseData);
          setTotalCount(responseData.length);
          
          // 计算统计数据
          calculateStats(responseData);
        } else if (typeof responseData === 'object' && responseData !== null) {
          // 如果是对象，可能是单个班级或特殊格式
          
          // 检查是否有数组属性
          const possibleArrays = Object.values(responseData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            // 使用找到的第一个数组
            const classArray = possibleArrays[0] as Class[];
            setClasses(classArray);
            setTotalCount(classArray.length);
            calculateStats(classArray);
          } else {
            // 包装为数组
            const singleItem = responseData as any;
            if (singleItem.id) {
              // 看起来是单个班级对象
              const classArray = [singleItem] as Class[];
              setClasses(classArray);
              setTotalCount(1);
              calculateStats(classArray);
            } else {
              setClasses([]);
              setTotalCount(0);
              setStats({
                totalClasses: 0,
                totalStudents: 0,
                averageStudentsPerClass: 0
              });
            }
          }
        } else {
          setClasses([]);
          setTotalCount(0);
          setStats({
            totalClasses: 0,
            totalStudents: 0,
            averageStudentsPerClass: 0
          });
        }
      } else {
        setClasses([]);
        setTotalCount(0);
        setStats({
          totalClasses: 0,
          totalStudents: 0,
          averageStudentsPerClass: 0
        });
      }
    } catch (error: any) {
      console.error('获取班级列表失败:', error);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '获取班级列表失败',
        severity: 'error',
      });
      setClasses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 获取教师列表
  const fetchTeachers = async () => {
    try {
      const response = await getAllTeachers();
      
      // 获取响应数据
      const responseData = response.data || response;
      
      if (responseData && Array.isArray(responseData)) {
        setTeachers(responseData);
      } else if (responseData && typeof responseData === 'object') {
        // 尝试从对象中提取数组
        const possibleArrays = Object.values(responseData).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          const teacherArray = possibleArrays[0] as Teacher[];
          setTeachers(teacherArray);
        } else {
          // 如果是单个对象，包装为数组
          setTeachers([responseData as Teacher]);
        }
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('获取教师列表失败:', error);
      setTeachers([]);
    }
  };

  // 计算统计数据
  const calculateStats = (classData: Class[]) => {
    const totalClasses = classData.length;
    let totalStudents = 0;
    
    classData.forEach(classItem => {
      totalStudents += classItem.studentCount || 0;
    });
    
    const averageStudentsPerClass = totalClasses > 0 ? (totalStudents / totalClasses) : 0;
    
    setStats({
      totalClasses,
      totalStudents,
      averageStudentsPerClass
    });
  };

  // 初始加载
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);
  
  // 处理搜索时重新加载
  useEffect(() => {
    if (searchTerm === '') {
      fetchClasses();
    }
  }, [searchTerm]);

  // 处理搜索
  const handleSearch = () => {
    fetchClasses();
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 处理分页数据
  const paginatedClasses = classes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 处理页面变化
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 处理每页行数变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开添加班级对话框
  const handleAddClass = () => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限添加班级', 'warning');
      return;
    }
    
    setDialogMode('add');
    setFormData({
      name: '',
      grade: '',
      headTeacher: null,
      description: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // 打开编辑班级对话框
  const handleEdit = (classItem: Class) => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限编辑班级', 'warning');
      return;
    }
    
    setDialogMode('edit');
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name || '',
      grade: classItem.grade || '',
      headTeacher: classItem.headTeacher || null,
      description: classItem.description || '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 处理表单输入变化
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = '请输入班级名称';
    }
    
    if (!formData.grade?.trim()) {
      errors.grade = '请输入年级';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  // 保存班级
  const handleSaveClass = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // 准备要发送的数据
      const classData = {
        ...formData,
        // 名称字段需要同时设置name和className
        name: formData.name.trim(),
        className: formData.name.trim(),
        grade: formData.grade.trim(),
        description: formData.description?.trim() || '',
        // 不需要发送headTeacher字段，避免类型错误
        headTeacher: undefined
      };
      
      if (dialogMode === 'add') {
        await classAPI.createClass(classData);
        showSnackbar('添加班级成功', 'success');
      } else if (dialogMode === 'edit' && currentClass) {
        await classAPI.updateClass(currentClass.id, classData);
        showSnackbar('更新班级信息成功', 'success');
      }
      
      handleCloseDialog();
      fetchClasses();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || (dialogMode === 'edit' ? '更新失败' : '添加失败'), 'error');
    } finally {
      setLoading(false);
    }
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

  // 删除班级
  const handleDelete = async (id: number) => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限删除班级', 'warning');
      return;
    }
    
    // 查找要删除的班级
    const classItemToDelete = classes.find(classItem => classItem.id === id);
    if (!classItemToDelete) return;
    
    openConfirmDialog(
      '删除班级',
      `确定要删除班级"${classItemToDelete.name || classItemToDelete.className}"吗？此操作不可撤销，且会影响所有关联的学生数据。`,
      async () => {
        setLoading(true);
        try {
          await classAPI.deleteClass(id);
          showSnackbar('删除班级成功', 'success');
          fetchClasses();
        } catch (error: any) {
          showSnackbar(error.response?.data?.message || '删除班级失败', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };
  
  // 打开分配班主任对话框
  const handleOpenAssignDialog = (classItem: Class) => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限分配班主任', 'warning');
      return;
    }
    
    setSelectedClassId(classItem.id);
    setSelectedTeacherId(classItem.headTeacher?.id || '');
    setAssignDialogOpen(true);
  };
  
  // 关闭分配班主任对话框
  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedTeacherId('');
    setSelectedClassId(null);
  };
  
  // 分配班主任
  const handleAssignHeadTeacher = async () => {
    if (!selectedClassId || selectedTeacherId === '') {
      showSnackbar('请选择班主任', 'warning');
      return;
    }
    
    setAssignLoading(true);
    try {
      await classAPI.assignHeadTeacher(selectedClassId, selectedTeacherId as number);
      showSnackbar('分配班主任成功', 'success');
      handleCloseAssignDialog();
      fetchClasses();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || '分配班主任失败', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <PageHeader>
        <Typography variant="h5" component="h1">
          班级管理
        </Typography>
        {!isTeacherRole && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClass}
          >
            添加班级
          </Button>
        )}
      </PageHeader>

      {/* 统计卡片 */}
      <StatsContainer>
        <StatCard>
          <CardContent>
            <StatIconBox>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                班级总数
              </Typography>
            </StatIconBox>
            <StatValue>{stats.totalClasses}</StatValue>
          </CardContent>
        </StatCard>
        <StatCard>
          <CardContent>
            <StatIconBox>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                学生总数
              </Typography>
            </StatIconBox>
            <StatValue>{stats.totalStudents}</StatValue>
          </CardContent>
        </StatCard>
        <StatCard>
          <CardContent>
            <StatIconBox>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                平均班级人数
              </Typography>
            </StatIconBox>
            <StatValue>{stats.averageStudentsPerClass.toFixed(1)}</StatValue>
          </CardContent>
        </StatCard>
      </StatsContainer>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="搜索班级"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            style: { height: commonHeight }
          }}
        />
        
        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ height: commonHeight }}
        >
          搜索
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchClasses()}
          sx={{ height: commonHeight }}
        >
          刷新
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>班级名称</TableCell>
              <TableCell>年级</TableCell>
              <TableCell>班主任</TableCell>
              <TableCell>学生人数</TableCell>
              <TableCell>班级描述</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : (!Array.isArray(paginatedClasses) || paginatedClasses.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  暂无班级数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedClasses.map((classItem: any) => (
                <TableRow key={classItem.id || 'unknown'}>
                  <TableCell>{classItem.id || '-'}</TableCell>
                  <TableCell>{classItem.name || classItem.className || '-'}</TableCell>
                  <TableCell>{classItem.grade || '-'}</TableCell>
                  <TableCell>{classItem.headTeacher ? classItem.headTeacher.name : '未分配'}</TableCell>
                  <TableCell>{classItem.studentCount || 0}</TableCell>
                  <TableCell>{classItem.description || '-'}</TableCell>
                  <TableCell>{classItem.createdAt ? formatDateTime(classItem.createdAt) : '-'}</TableCell>
                  <TableCell align="center">
                    {!isTeacherRole ? (
                      <ActionButtonsContainer>
                        <Tooltip title="编辑">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(classItem)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="分配班主任">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenAssignDialog(classItem)}
                          >
                            <PersonIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(classItem.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ActionButtonsContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        无权限操作
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`}`
          }
        />
      </TableContainer>

      {/* 添加/编辑班级对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? '添加班级' : '编辑班级信息'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: 16 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="班级名称"
                fullWidth
                value={formData.name || ''}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="grade"
                label="年级"
                fullWidth
                value={formData.grade || ''}
                onChange={handleInputChange}
                error={!!formErrors.grade}
                helperText={formErrors.grade}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="班级描述"
                fullWidth
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveClass}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 分配班主任对话框 */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>分配班主任</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="assign-teacher-label">选择班主任</InputLabel>
              <Select
                labelId="assign-teacher-label"
                value={selectedTeacherId}
                label="选择班主任"
                onChange={(e) => setSelectedTeacherId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>未分配</em>
                </MenuItem>
                {Array.isArray(teachers) && teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>取消</Button>
          <Button
            onClick={handleAssignHeadTeacher}
            variant="contained"
            color="primary"
            disabled={assignLoading}
            startIcon={assignLoading ? <CircularProgress size={20} /> : null}
          >
            {assignLoading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示框 */}
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
            color="error" 
            variant="contained"
            autoFocus
          >
            确定删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassManagement; 