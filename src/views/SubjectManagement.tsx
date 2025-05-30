import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
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
  Slider,
  IconButton,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import * as subjectAPI from '../api/subjectAPI';
import { Subject, ApiError } from '../types/subject';

const SubjectManagement: React.FC = () => {
  // 状态管理
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 对话框状态
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentSubject, setCurrentSubject] = useState<Subject>({
    id: '',
    name: '',
    score: 100,
    passScore: 60,
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Subject, string>>>({});

  // 添加Snackbar状态
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

  // 获取科目列表
  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await subjectAPI.getSubjectsPaged(currentPage - 1, pageSize);
      if (response.data) {
        setSubjects(response.data.content);
        setTotal(response.data.totalElements);
      }
    } catch (error) {
      console.error('获取科目列表失败:', error);
      showSnackbar('获取科目列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 添加科目
  const handleAddSubject = () => {
    setIsEdit(false);
    setCurrentSubject({
      id: '',
      name: '',
      score: 100,
      passScore: 60,
      description: ''
    });
    setFormErrors({});
    setDialogVisible(true);
  };

  // 编辑科目
  const handleEditSubject = (subject: Subject) => {
    setIsEdit(true);
    setCurrentSubject({ ...subject });
    setFormErrors({});
    setDialogVisible(true);
  };

  // 删除科目
  const handleDeleteSubject = async (subject: Subject) => {
    openConfirmDialog(
      '删除科目',
      `确定要删除科目"${subject.name}"吗？`,
      async () => {
        try {
          setLoading(true);
          await subjectAPI.deleteSubject(subject.id);
          showSnackbar('删除成功', 'success');
          fetchSubjects();
        } catch (error) {
          console.error('删除科目失败:', error);
          showSnackbar('删除科目失败', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Subject, string>> = {};
    
    if (!currentSubject.name) {
      errors.name = '请输入科目名称';
    } else if (currentSubject.name.length > 50) {
      errors.name = '科目名称不能超过50个字符';
    }
    
    if (currentSubject.score < 0) {
      errors.score = '满分必须大于等于0';
    }
    
    if (currentSubject.passScore < 0) {
      errors.passScore = '及格分必须大于等于0';
    }
    
    if (currentSubject.passScore > currentSubject.score) {
      errors.passScore = '及格分不能大于满分';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存科目
  const saveSubject = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);
    try {
      if (isEdit) {
        await subjectAPI.updateSubject(currentSubject.id, currentSubject);
        showSnackbar('更新成功', 'success');
      } else {
        await subjectAPI.createSubject(currentSubject);
        showSnackbar('添加成功', 'success');
      }
      setDialogVisible(false);
      fetchSubjects();
    } catch (error: unknown) {
      console.error('保存科目失败:', error);
      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
        showSnackbar(apiError.response.data.message, 'error');
      } else {
        showSnackbar('保存科目失败', 'error');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // 分页处理
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleCurrentChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1);
  };

  // 初始化
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return (
    <Box className="subject-container">
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="科目管理" 
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddSubject}
            >
              添加科目
            </Button>
          }
        />
        
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="80">ID</TableCell>
                  <TableCell width="150">科目名称</TableCell>
                  <TableCell width="100">满分</TableCell>
                  <TableCell width="100">及格分</TableCell>
                  <TableCell>描述</TableCell>
                  <TableCell width="180" align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>{subject.id}</TableCell>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>{subject.score}</TableCell>
                      <TableCell>{subject.passScore}</TableCell>
                      <TableCell>{subject.description}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditSubject(subject)}
                            sx={{ 
                              minWidth: '80px',
                              whiteSpace: 'nowrap',
                              px: 1
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteSubject(subject)}
                            sx={{ 
                              minWidth: '80px',
                              whiteSpace: 'nowrap',
                              px: 1
                            }}
                          >
                            删除
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
        </CardContent>
      </Card>
      
      {/* 添加/编辑科目对话框 */}
      <Dialog
        open={dialogVisible}
        onClose={() => setDialogVisible(false)}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onEntered: () => {
            // 对话框完全打开后执行的回调，确保输入框获得焦点
            const nameInput = document.querySelector('input[name="subject-name"]');
            if (nameInput) {
              (nameInput as HTMLInputElement).focus();
            }
          }
        }}
      >
        <DialogTitle>{isEdit ? '编辑科目' : '添加科目'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 400 }}>
            <TextField
              label="科目名称"
              fullWidth
              value={currentSubject.name}
              onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
              margin="normal"
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
              name="subject-name"
              inputProps={{
                autoComplete: "off"
              }}
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>满分</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Slider
                  value={currentSubject.score}
                  onChange={(_, newValue) => {
                    const scoreValue = newValue as number;
                    // 如果新的满分小于当前及格分，自动调整及格分
                    const newPassScore = currentSubject.passScore > scoreValue 
                      ? scoreValue 
                      : currentSubject.passScore;
                    
                    setCurrentSubject({ 
                      ...currentSubject, 
                      score: scoreValue,
                      passScore: newPassScore 
                    });
                  }}
                  min={0}
                  max={150}
                  step={5}
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  value={currentSubject.score}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value, 10);
                    if (!isNaN(newValue)) {
                      // 如果新的满分小于当前及格分，自动调整及格分
                      const newPassScore = currentSubject.passScore > newValue 
                        ? newValue 
                        : currentSubject.passScore;
                      
                      setCurrentSubject({ 
                        ...currentSubject, 
                        score: newValue,
                        passScore: newPassScore
                      });
                    }
                  }}
                  type="number"
                  sx={{ width: 80 }}
                  InputProps={{ 
                    inputProps: { min: 0, max: 150 },
                    autoComplete: "off"
                  }}
                  error={!!formErrors.score}
                  helperText={formErrors.score}
                />
              </Stack>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>及格分</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Slider
                  value={currentSubject.passScore}
                  onChange={(_, newValue) => setCurrentSubject({ ...currentSubject, passScore: newValue as number })}
                  min={0}
                  max={currentSubject.score}
                  step={5}
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  value={currentSubject.passScore}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value, 10);
                    if (!isNaN(newValue)) {
                      setCurrentSubject({ ...currentSubject, passScore: newValue });
                    }
                  }}
                  type="number"
                  sx={{ width: 80 }}
                  InputProps={{ 
                    inputProps: { min: 0, max: currentSubject.score },
                    autoComplete: "off" 
                  }}
                  error={!!formErrors.passScore}
                  helperText={formErrors.passScore}
                />
              </Stack>
            </Box>
            
            <TextField
              label="描述"
              fullWidth
              multiline
              rows={4}
              value={currentSubject.description}
              onChange={(e) => setCurrentSubject({ ...currentSubject, description: e.target.value })}
              margin="normal"
              name="subject-description"
              inputProps={{
                autoComplete: "off"
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogVisible(false)}>取消</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={saveSubject}
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={24} /> : <SaveIcon />}
          >
            {isEdit ? '更新' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default SubjectManagement; 