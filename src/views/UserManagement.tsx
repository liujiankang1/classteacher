import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress,
  Stack,
  Snackbar
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, updateUser, deleteUser, updateUserRoles, getUserById } from '../api/user';
import { register } from '../api/auth';
import CustomInput from '../components/CustomInput';
import { formatDateTime } from '../utils/dateUtils';

// 扩展的当前用户类型，可能包含roles或role属性
interface CurrentUser {
  id: number;
  username: string;
  roles?: string[];
  role?: string;
}

// 用户类型定义
interface UserType {
  id: number;
  username: string;
  name: string;
  email: string;
  gender?: string;
  phone?: string;
  roles: string[];
  createdAt?: string;
}

// 用户管理页面组件
const UserManagement = () => {
  // 状态管理
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  
  // 对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // 表单数据
  const [userForm, setUserForm] = useState({
    id: null as number | null,
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: ''
  });
  
  // 角色管理数据
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  
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
  
  // 认证上下文
  const { user: authUser } = useAuth();
  // 将authUser转换为包含必要属性的CurrentUser类型
  const currentUser: CurrentUser | null = authUser ? {
    id: authUser.id,
    username: authUser.username,
    role: authUser.role,
    // 如果后端直接返回roles数组，也包含它
    roles: (authUser as any).roles
  } : null;
  
  // 检查用户是否具有特定角色的辅助函数
  const hasRole = (user: CurrentUser | null, role: string): boolean => {
    if (!user) return false;
    
    if (Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    
    return user.role === role;
  };
  
  // 检查用户是否是管理员
  const isAdmin = (user: CurrentUser | null): boolean => {
    return hasRole(user, 'ROLE_ADMIN');
  };
  
  // 检查用户是否是班主任
  const isHeadTeacher = (user: CurrentUser | null): boolean => {
    return hasRole(user, 'ROLE_HEADTEACHER');
  };
  
  // 检查用户是否有权管理用户（管理员或班主任）
  const canManageUsers = (user: CurrentUser | null): boolean => {
    return isAdmin(user) || isHeadTeacher(user);
  };
  
  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response && response.data) {
        setUsers(response.data);
        setTotal(response.data.length);
      } else {
        // 处理空响应
        setUsers([]);
        setTotal(0);
        console.warn('获取用户列表返回空数据');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      // 显示友好的错误信息
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // 过滤后的用户列表
  const filteredUsers = users.filter(user => {
    // 按角色筛选
    if (selectedRole && !user.roles.includes(selectedRole)) {
      return false;
    }
    
    // 按搜索条件筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // 分页处理的用户列表
  const paginatedUsers = filteredUsers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  
  // 处理角色标签类型
  const getRoleType = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'error';
      case 'ROLE_HEADTEACHER':
        return 'success';
      case 'ROLE_TEACHER':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // 获取角色标签名称
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return '管理员';
      case 'ROLE_HEADTEACHER':
        return '班主任';
      case 'ROLE_TEACHER':
        return '教师';
      default:
        return '未知角色';
    }
  };
  
  // 处理添加用户
  const handleAddUser = () => {
    setUserForm({
      id: null,
      username: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gender: ''
    });
    setAddDialogOpen(true);
  };
  
  // 处理编辑用户
  const handleEdit = (user: UserType) => {
    // 权限检查：管理员和班主任可编辑所有用户，普通用户只能编辑自己
    if (!currentUser) {
      alert('您需要登录才能执行此操作');
      return;
    }
    
    const isSelf = currentUser.id === user.id;
    
    // 管理员和班主任可以编辑所有用户，其他角色只能编辑自己
    if (!canManageUsers(currentUser) && !isSelf) {
      alert('权限不足：您只能编辑自己的信息或拥有管理员/班主任权限');
      return;
    }
    
    // 确保性别值统一格式
    let genderValue = user.gender;
    if (genderValue === 'MALE' || genderValue === 'male') genderValue = 'male';
    if (genderValue === 'FEMALE' || genderValue === 'female') genderValue = 'female';
    
    setUserForm({
      id: user.id,
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      confirmPassword: '',
      gender: genderValue || ''
    });
    setEditDialogOpen(true);
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
  
  // 修改处理删除点击事件的方法
  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    // 使用新的确认对话框替代旧的删除对话框
    openConfirmDialog(
      "删除用户",
      `确定要删除用户 ${user.name} (${user.username}) 吗？此操作无法撤销。`,
      () => handleDelete()
    );
  };
  
  // 修改处理删除的方法
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    setSubmitLoading(true);
    try {
      await deleteUser(selectedUser.id);
      // 使用新的Snackbar显示成功消息
      showSnackbar(`用户 ${selectedUser.name} 已成功删除`, 'success');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      // 使用新的Snackbar显示错误消息
      showSnackbar(`删除用户失败: ${(error as any)?.response?.data?.message || '未知错误'}`, 'error');
    } finally {
      setSubmitLoading(false);
      setSelectedUser(null);
    }
  };
  
  // 处理角色管理
  const handleManageRoles = (user: UserType) => {
    // 权限检查：只有管理员和班主任可以管理角色
    if (!currentUser) {
      alert('您需要登录才能执行此操作');
      return;
    }
    
    if (!canManageUsers(currentUser)) {
      alert('权限不足：只有管理员和班主任可以管理用户角色');
      return;
    }
    
    setSelectedUser(user);
    setSelectedRoles([...user.roles]);
    setRoleDialogOpen(true);
  };
  
  // 保存角色
  const saveRoles = async () => {
    if (!selectedUser) return;
    
    if (selectedRoles.length === 0) {
      alert('用户至少需要一个角色');
      return;
    }
    
    setRoleLoading(true);
    try {
      await updateUserRoles(selectedUser.id, selectedRoles);
      // 使用新的Snackbar显示成功消息
      showSnackbar(`用户 ${selectedUser.name} 的角色已更新`, 'success');
      setRoleDialogOpen(false);
      fetchUsers();
      
      if (currentUser && selectedUser.id === currentUser.id) {
        alert('您已修改自己的角色，可能需要重新登录才能生效');
      }
    } catch (error: any) {
      alert('角色更新失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setRoleLoading(false);
    }
  };
  
  // 修改提交添加表单的方法
  const submitAddForm = async () => {
    setSubmitLoading(true);
    try {
      if (userForm.password !== userForm.confirmPassword) {
        // 使用新的Snackbar显示错误消息
        showSnackbar('两次输入的密码不一致', 'error');
        setSubmitLoading(false);
        return;
      }
      
      const userData = {
        username: userForm.username,
        password: userForm.password,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone || undefined,
        gender: userForm.gender || undefined
      };
      
      await register(userData);
      // 使用新的Snackbar显示成功消息
      showSnackbar('用户添加成功', 'success');
      setAddDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('添加用户失败:', error);
      // 使用新的Snackbar显示错误消息
      showSnackbar(`添加用户失败: ${(error as any)?.response?.data?.message || '未知错误'}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // 修改提交编辑表单的方法
  const submitEditForm = async () => {
    if (!userForm.id) return;
    
    setSubmitLoading(true);
    try {
      // 检查密码是否一致（如果提供了密码）
      if (userForm.password && userForm.password !== userForm.confirmPassword) {
        // 使用新的Snackbar显示错误消息
        showSnackbar('两次输入的密码不一致', 'error');
        setSubmitLoading(false);
        return;
      }
      
      const userData = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone || undefined,
        gender: userForm.gender || undefined
      };
      
      // 只有在有输入密码时才更新密码
      if (userForm.password) {
        (userData as any).password = userForm.password;
      }
      
      await updateUser(userForm.id, userData);
      // 使用新的Snackbar显示成功消息
      showSnackbar('用户信息更新成功', 'success');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('更新用户失败:', error);
      // 使用新的Snackbar显示错误消息
      showSnackbar(`更新用户失败: ${(error as any)?.response?.data?.message || '未知错误'}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理角色选择变化
  const handleRoleChange = (role: string) => {
    const newSelectedRoles = [...selectedRoles];
    
    if (newSelectedRoles.includes(role)) {
      // 如果角色已选中，则移除
      const index = newSelectedRoles.indexOf(role);
      newSelectedRoles.splice(index, 1);
    } else {
      // 如果角色未选中，则添加
      newSelectedRoles.push(role);
    }
    
    setSelectedRoles(newSelectedRoles);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CardHeader 
          title={<Typography variant="h5">用户管理</Typography>}
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(0);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">所有用户</MenuItem>
                  <MenuItem value="ROLE_ADMIN">管理员</MenuItem>
                  <MenuItem value="ROLE_HEADTEACHER">班主任</MenuItem>
                  <MenuItem value="ROLE_TEACHER">教师</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                placeholder="搜索用户名或姓名"
                size="small"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 250 }}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleAddUser}
              >
                添加用户
              </Button>
            </Box>
          }
        />
        
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户名</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>性别</TableCell>
                  <TableCell>电话</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      没有找到用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    user && user.id ? (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.gender === 'MALE' || user.gender === 'male' ? '男' : 
                         user.gender === 'FEMALE' || user.gender === 'female' ? '女' : '未设置'}
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {Array.isArray(user.roles) && user.roles.map((role) => (
                            <Chip
                              key={role}
                              label={getRoleLabel(role)}
                              color={getRoleType(role) as any}
                              size="small"
                              sx={{ m: 0.2 }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{user.createdAt ? formatDateTime(user.createdAt) : '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            编辑
                          </Button>
                          {/* 只对管理员和班主任显示角色管理按钮 */}
                          {canManageUsers(currentUser) && (
                            <Button 
                              variant="outlined" 
                              color="success" 
                              size="small"
                              onClick={() => handleManageRoles(user)}
                            >
                              角色管理
                            </Button>
                          )}
                          {/* 只对管理员和班主任显示删除按钮 */}
                          {canManageUsers(currentUser) && (
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              onClick={() => handleDeleteClick(user)}
                              disabled={!!(Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN') && currentUser && currentUser.id !== user.id)}
                            >
                              删除
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    ) : null
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={currentPage}
            onPageChange={(e, newPage) => setCurrentPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(0);
            }}
            labelRowsPerPage="每页行数"
            rowsPerPageOptions={[5, 10, 25]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </CardContent>
      </Card>
      
      {/* 添加用户对话框 */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加用户</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="用户名"
                name="username"
                value={userForm.username}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="姓名"
                name="name"
                value={userForm.name}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="邮箱"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <FormControl fullWidth>
                <CustomInput
                  select
                  label="性别"
                  name="gender"
                  value={userForm.gender}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ 
                    style: { width: '64.14px' }
                  }}
                  sx={{ 
                    '& .MuiSelect-select': { paddingY: 1.5 },
                    '& .MuiMenu-paper': { width: 'auto', minWidth: '200px' }
                  }}
                >
                  <MenuItem value="male">男</MenuItem>
                  <MenuItem value="female">女</MenuItem>
                </CustomInput>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="电话"
                name="phone"
                value={userForm.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="密码"
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="确认密码"
                name="confirmPassword"
                type="password"
                value={userForm.confirmPassword}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
          <Button 
            onClick={submitAddForm} 
            variant="contained" 
            color="primary"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 编辑用户对话框 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="用户名"
                name="username"
                value={userForm.username}
                onChange={handleInputChange}
                required
                fullWidth
                disabled
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="姓名"
                name="name"
                value={userForm.name}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="邮箱"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <FormControl fullWidth>
                <CustomInput
                  select
                  label="性别"
                  name="gender"
                  value={userForm.gender}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ 
                    style: { width: '64.14px' }
                  }}
                  sx={{ 
                    '& .MuiSelect-select': { paddingY: 1.5 },
                    '& .MuiMenu-paper': { width: 'auto', minWidth: '200px' }
                  }}
                >
                  <MenuItem value="male">男</MenuItem>
                  <MenuItem value="female">女</MenuItem>
                </CustomInput>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="电话"
                name="phone"
                value={userForm.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="密码（不填则不更改）"
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <CustomInput
                label="确认密码"
                name="confirmPassword"
                type="password"
                value={userForm.confirmPassword}
                onChange={handleInputChange}
                fullWidth
                disabled={!userForm.password}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button 
            onClick={submitEditForm} 
            variant="contained" 
            color="primary"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 角色管理对话框 */}
      <Dialog 
        open={roleDialogOpen} 
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>角色管理</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                为 <strong>{selectedUser.name}</strong> ({selectedUser.username}) 分配角色：
              </Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedRoles.includes('ROLE_ADMIN')}
                      onChange={() => handleRoleChange('ROLE_ADMIN')}
                    />
                  }
                  label="管理员"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedRoles.includes('ROLE_HEADTEACHER')}
                      onChange={() => handleRoleChange('ROLE_HEADTEACHER')}
                    />
                  }
                  label="班主任"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedRoles.includes('ROLE_TEACHER')}
                      onChange={() => handleRoleChange('ROLE_TEACHER')}
                    />
                  }
                  label="教师"
                />
              </FormGroup>
              
              {selectedUser.id === currentUser?.id && (
                <Alert 
                  severity="warning" 
                  sx={{ mt: 2 }}
                >
                  您正在修改自己的角色，请注意：移除管理员权限后可能无法再访问此页面！
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>取消</Button>
          <Button 
            onClick={saveRoles} 
            variant="contained" 
            color="primary"
            disabled={roleLoading}
          >
            {roleLoading ? <CircularProgress size={24} /> : '保存'}
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
            color={confirmDialog.title === '删除用户' ? 'error' : 'primary'} 
            variant="contained"
            autoFocus
          >
            {confirmDialog.title === '删除用户' ? '确定删除' : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 