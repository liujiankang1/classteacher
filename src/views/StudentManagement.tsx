import React, { useState, useEffect, useRef } from 'react';
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
  GridLegacy as Grid,
  Tooltip,
  InputAdornment,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  styled,
  FormHelperText,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import * as studentAPI from '../api/student';
import * as classAPI from '../api/class';
import { useAuth } from '../contexts/AuthContext';

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

const UploadArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

// 学生类型定义
interface Student {
  id: number;
  name: string;
  studentNumber: string;
  gender: string;
  birthDate: string;
  classInfo: any;
  classId?: number;
  className?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  notes?: string;
}

// 班级类型定义
interface Class {
  id: number;
  name: string;
  grade?: string;
}

// 添加一个统一的高度样式
const commonHeight = '40px';

// 学生管理组件
const StudentManagement: React.FC = () => {
  // 状态
  const { user } = useAuth();
  // 判断用户是否为教师角色（只读权限）
  const isTeacherRole = user?.role === 'ROLE_TEACHER';
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    studentNumber: '',
    gender: 'MALE',
    birthday: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    address: '',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // 删除确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });
  
  // 批量导入相关状态
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取学生列表
  const fetchStudents = async () => {
    setLoading(true);
    try {
      let response;
      
      if (selectedClass) {
        response = await studentAPI.getStudentsByClassPaged(Number(selectedClass), page, rowsPerPage);
      } else if (searchTerm) {
        response = await studentAPI.searchStudentsPaged(searchTerm, page, rowsPerPage);
      } else {
        response = await studentAPI.getAllStudentsPaged(page, rowsPerPage);
      }
      
      // 处理返回的分页数据
      const pagedData = response?.data;
      
      if (!pagedData || !pagedData.content) {
        setSnackbar({
          open: true,
          message: '服务器返回的数据格式不正确',
          severity: 'error',
        });
        setStudents([]);
        setTotalCount(0);
        return;
      }
      
      // 处理学生数据，确保班级信息正确
      const processedStudents = pagedData.content.map((student: any) => {
        // 处理班级信息
        let className = '无班级';
        let classId: number | undefined = undefined;
        
        if (student.classInfo) {
          if (typeof student.classInfo === 'object') {
            className = student.classInfo.name || '未知班级';
            classId = student.classInfo.id;
          } else if (typeof student.classInfo === 'number') {
            const foundClass = Array.isArray(classes) ? classes.find(cls => cls.id === student.classInfo) : null;
            if (foundClass) {
              className = foundClass.name;
              classId = foundClass.id;
            } else {
              className = `班级ID: ${student.classInfo}`;
              classId = student.classInfo;
            }
          }
        }
        
        return {
          ...student,
          className,
          classId
        };
      });
      
      setStudents(processedStudents);
      setTotalCount(pagedData.totalElements || 0);
    } catch (error: any) {
      console.error('获取学生列表失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '获取学生列表失败',
        severity: 'error',
      });
      setStudents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 获取班级列表
  const fetchClasses = async () => {
    try {
      const response = await classAPI.getAllClasses();
      if (response && response.data) {
        setClasses(response.data || []);
      } else {
        console.error('获取班级列表返回空数据');
        setClasses([]);
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
      setClasses([]);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchClasses();
  }, []);
  
  useEffect(() => {
    fetchStudents();
  }, [page, rowsPerPage, selectedClass]);

  // 处理搜索
  const handleSearch = () => {
    setPage(0);
    fetchStudents();
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
    fetchStudents();
  };
  
  // 处理班级筛选变化
  const handleClassChange = (event: any) => {
    setSelectedClass(event.target.value);
    setPage(0);
  };

  // 处理页面变化
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 处理每页行数变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开添加学生对话框
  const handleAddStudent = () => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限添加学生', 'warning');
      return;
    }
    
    setDialogMode('add');
    setFormData({
      name: '',
      studentNumber: '',
      gender: 'MALE',
      birthday: '',
      classId: '',
      parentName: '',
      parentPhone: '',
      address: '',
      notes: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // 打开编辑学生对话框
  const handleEdit = (student: Student) => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限编辑学生', 'warning');
      return;
    }
    
    setDialogMode('edit');
    setCurrentStudent(student);
    
    // 填充表单数据
    setFormData({
      name: student.name || '',
      studentNumber: student.studentNumber || '',
      gender: student.gender || 'MALE',
      birthday: student.birthDate || '',
      classId: student.classId || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      notes: student.notes || '',
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
      errors.name = '请输入学生姓名';
    }
    
    if (!formData.studentNumber?.trim()) {
      errors.studentNumber = '请输入学号';
    }
    
    if (!formData.gender) {
      errors.gender = '请选择性别';
    }
    
    if (!formData.birthday) {
      errors.birthday = '请选择出生日期';
    }
    
    if (!formData.classId) {
      errors.classId = '请选择班级';
    }
    
    if (formData.parentPhone && !/^1[3-9]\d{9}$/.test(formData.parentPhone)) {
      errors.parentPhone = '请输入有效的手机号码';
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

  // 保存学生
  const handleSaveStudent = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // 创建要发送的数据对象
      const studentData = {
        ...formData,
        birthDate: formData.birthday, // 将birthday字段映射为birthDate
      };
      
      // 如果选择了班级，添加classInfo对象
      if (formData.classId) {
        studentData.classInfo = { id: formData.classId };
      }
      
      if (dialogMode === 'add') {
        await studentAPI.createStudent(studentData);
        showSnackbar('添加学生成功', 'success');
      } else if (dialogMode === 'edit' && currentStudent) {
        await studentAPI.updateStudent(currentStudent.id, studentData);
        showSnackbar('更新学生信息成功', 'success');
      }
      
      handleCloseDialog();
      fetchStudents();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || '保存学生信息失败', 'error');
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

  // 删除学生
  const handleDelete = async (id: number) => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限删除学生', 'warning');
      return;
    }
    
    // 查找要删除的学生
    const studentToDelete = students.find(student => student.id === id);
    if (!studentToDelete) return;
    
    openConfirmDialog(
      '删除学生',
      `确定要删除学生"${studentToDelete.name}"吗？此操作不可撤销。`,
      async () => {
        setLoading(true);
        try {
          await studentAPI.deleteStudent(id);
          showSnackbar('删除学生成功', 'success');
          fetchStudents();
        } catch (error: any) {
          showSnackbar(error.response?.data?.message || '删除学生失败', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // 批量导入相关函数
  const handleBatchImport = () => {
    if (isTeacherRole) {
      showSnackbar('教师角色无权限批量导入学生', 'warning');
      return;
    }
    
    setImportDialogVisible(true);
    setUploadFile(null);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
    }
  };
  
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // 检查文件类型
      if (files[0].type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setUploadFile(files[0]);
      } else {
        showSnackbar('只能上传.xlsx格式的Excel文件', 'warning');
      }
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const confirmImport = async () => {
    if (!uploadFile) {
      showSnackbar('请先选择文件', 'warning');
      return;
    }
    
    setImportLoading(true);
    
    try {
      // 创建表单数据
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      // 添加班级ID
      if (selectedClass) {
        formData.append('classId', selectedClass.toString());
      }
      
      const response = await studentAPI.batchImportStudents(formData);
      
      showSnackbar(`导入成功，共导入 ${response.data.length || 0} 名学生`, 'success');
      
      setImportDialogVisible(false);
      fetchStudents();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || '导入失败', 'error');
    } finally {
      setImportLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    // 创建一个临时链接用于下载
    const link = document.createElement('a');
    link.href = '/templates/学生导入模版.xlsx'; // 修正模板文件路径
    link.download = '学生导入模版.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <PageHeader>
        <Typography variant="h5" component="h1">
          学生管理
        </Typography>
        {!isTeacherRole && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddStudent}
            >
              添加学生
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CloudUploadIcon />}
              onClick={handleBatchImport}
            >
              批量导入
            </Button>
          </Box>
        )}
      </PageHeader>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="class-select-label">按班级筛选</InputLabel>
          <Select
            labelId="class-select-label"
            value={selectedClass}
            label="按班级筛选"
            onChange={handleClassChange}
            sx={{ height: commonHeight }}
          >
            <MenuItem value="">全部班级</MenuItem>
            {Array.isArray(classes) && classes.map((classItem: Class) => (
              <MenuItem key={classItem.id} value={classItem.id}>
                {classItem.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="搜索学生姓名"
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
          onClick={() => fetchStudents()}
          sx={{ height: commonHeight }}
        >
          刷新
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>学号</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>性别</TableCell>
              <TableCell>班级</TableCell>
              <TableCell>出生日期</TableCell>
              <TableCell>家庭住址</TableCell>
              <TableCell>家长姓名</TableCell>
              <TableCell>家长电话</TableCell>
              <TableCell>备注</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            )}
            {!loading && students.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  暂无学生数据
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.gender === 'MALE' ? '男' : '女'}</TableCell>
                  <TableCell>{student.className}</TableCell>
                  <TableCell>{student.birthDate}</TableCell>
                  <TableCell>{student.address}</TableCell>
                  <TableCell>{student.parentName}</TableCell>
                  <TableCell>{student.parentPhone}</TableCell>
                  <TableCell>{student.notes}</TableCell>
                  <TableCell align="center">
                    {!isTeacherRole && (
                      <ActionButtonsContainer>
                        <Tooltip title="编辑">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(student)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(student.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ActionButtonsContainer>
                    )}
                    {isTeacherRole && (
                      <Typography variant="body2" color="textSecondary">
                        无权限操作
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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

      {/* 添加/编辑学生对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? '添加学生' : '编辑学生信息'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: 16 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="studentNumber"
                label="学号"
                fullWidth
                value={formData.studentNumber || ''}
                onChange={handleInputChange}
                error={!!formErrors.studentNumber}
                helperText={formErrors.studentNumber}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="姓名"
                fullWidth
                value={formData.name || ''}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.gender} required>
                <FormLabel id="gender-radio-group-label">性别</FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender || 'MALE'}
                  onChange={handleInputChange}
                >
                  <FormControlLabel value="MALE" control={<Radio />} label="男" />
                  <FormControlLabel value="FEMALE" control={<Radio />} label="女" />
                </RadioGroup>
                {formErrors.gender && (
                  <FormHelperText error>{formErrors.gender}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.classId} required>
                <InputLabel>班级</InputLabel>
                <Select
                  name="classId"
                  value={formData.classId || ''}
                  label="班级"
                  onChange={handleInputChange}
                >
                  {Array.isArray(classes) && classes.map((classItem: Class) => (
                    <MenuItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.classId && (
                  <FormHelperText error>{formErrors.classId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="birthday"
                label="出生日期"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.birthday || ''}
                onChange={handleInputChange}
                error={!!formErrors.birthday}
                helperText={formErrors.birthday}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="parentName"
                label="家长姓名"
                fullWidth
                value={formData.parentName || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="parentPhone"
                label="家长电话"
                fullWidth
                value={formData.parentPhone || ''}
                onChange={handleInputChange}
                error={!!formErrors.parentPhone}
                helperText={formErrors.parentPhone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="address"
                label="家庭住址"
                fullWidth
                value={formData.address || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="备注"
                fullWidth
                multiline
                rows={2}
                value={formData.notes || ''}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveStudent}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 批量导入对话框 */}
      <Dialog open={importDialogVisible} onClose={() => setImportDialogVisible(false)} maxWidth="md" fullWidth>
        <DialogTitle>批量导入学生</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              请上传Excel文件(.xlsx格式)，模板格式包含以下字段：学号、姓名、性别、出生日期、家长姓名、家长电话、家庭住址、备注
            </Typography>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx"
              onChange={handleFileUpload}
            />
            
            <UploadArea
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                {uploadFile ? `已选择文件: ${uploadFile.name}` : '将文件拖到此处，或点击上传'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                只能上传.xlsx格式的Excel文件
              </Typography>
            </UploadArea>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
              >
                下载模板
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogVisible(false)}>取消</Button>
          <Button
            onClick={confirmImport}
            variant="contained"
            color="primary"
            disabled={importLoading || !uploadFile}
            startIcon={importLoading ? <CircularProgress size={20} /> : null}
          >
            {importLoading ? '导入中...' : '上传并导入'}
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

export default StudentManagement; 