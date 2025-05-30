import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Avatar,
  GridLegacy as Grid,
  TextField,
  Button,
  Divider,
  Alert,
  styled,
  Tabs,
  Tab,
  Snackbar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  School,
  Lock,
  Save,
  Edit,
  CameraAlt,
  Badge,
  SupervisorAccount
} from '@mui/icons-material';
import { debounce } from '../utils/dom-optimizer';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, changePassword } from '../api/auth';

// 默认头像
const DEFAULT_MALE_AVATAR = '/assets/images/default-male-avatar.png';
const DEFAULT_FEMALE_AVATAR = '/assets/images/default-female-avatar.png';
const DEFAULT_AVATAR = '/assets/images/default-avatar.png';

// 根据性别获取默认头像
const getDefaultAvatar = (gender?: string): string => {
  if (!gender) return DEFAULT_AVATAR;
  
  const normalizedGender = gender.toLowerCase();
  if (normalizedGender === 'male') return DEFAULT_MALE_AVATAR;
  if (normalizedGender === 'female') return DEFAULT_FEMALE_AVATAR;
  
  return DEFAULT_AVATAR;
};

// 样式化组件
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  marginBottom: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `4px solid ${theme.palette.background.paper}`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
  },
}));

const ProfileContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.spacing(3),
  boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
}));

const UserInfoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

const UserName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.5rem',
  marginBottom: theme.spacing(0.5),
  color: theme.palette.primary.main,
}));

const UserEmail = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.95rem',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  }
}));

const UserPhone = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.95rem',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  }
}));

const UserRole = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(1),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  fontWeight: 500,
  '& .MuiChip-icon': {
    color: theme.palette.primary.contrastText,
  }
}));

const ProfileContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

const AvatarUploadButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

// 模拟用户数据
const mockUserData = {
  id: 1,
  username: 'teacher123',
  name: '张老师',
  email: 'teacher123@example.com',
  phone: '13800138000',
  school: '阳光中学',
  department: '教务处',
  position: '班主任',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

// 个人资料组件
const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    id: user?.id || 0,
    username: user?.username || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    avatar: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // 加载用户资料
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        gender: user.gender || '',
        phone: user.phone || '',
      }));
      
      console.log('加载的用户数据:', user);
    }
  }, [user]);

  // 处理标签页变化
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 处理个人资料输入变化
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理密码输入变化
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 保存个人资料
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      console.log('发送更新资料请求:', profileData);
      await updateProfile(profileData);
      
      // 更新本地存储中的用户信息
      if (user) {
        const updatedUser = {
          ...user,
          name: profileData.name,
          email: profileData.email,
          gender: profileData.gender,
          phone: profileData.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setSnackbar({
        open: true,
        message: '个人资料更新成功',
        severity: 'success',
      });
    } catch (error) {
      console.error('更新个人资料失败:', error);
      setSnackbar({
        open: true,
        message: '更新个人资料失败',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    // 验证新密码和确认密码是否一致
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: '新密码和确认密码不一致',
        severity: 'error',
      });
      return;
    }

    // 验证新密码长度
    if (passwordData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: '新密码长度不能少于6个字符',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSnackbar({
        open: true,
        message: '密码修改成功',
        severity: 'success',
      });
      
      // 清空密码字段
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('修改密码失败:', error);
      
      // 提取错误信息
      let errorMessage = '修改密码失败';
      
      if (error.response) {
        // 处理后端返回的错误信息
        if (error.response.status === 401) {
          errorMessage = '当前密码不正确';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = '请求参数错误，请检查输入';
        } else if (error.response.status === 404) {
          errorMessage = 'API路径不正确，请联系管理员';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  // 获取用户头像
  const getUserAvatar = () => {
    // 如果用户有自定义头像，使用自定义头像
    if (profileData.avatar) return profileData.avatar;
    
    // 否则根据性别返回默认头像
    return getDefaultAvatar(profileData.gender);
  };

  // 将角色转换为中文
  const getRoleInChinese = (role?: string): string => {
    if (!role) return '教师';
    
    // 移除可能的 "ROLE_" 前缀
    const roleName = role.startsWith('ROLE_') ? role.substring(5) : role;
    
    // 转换为小写以便比较
    const lowerCaseRole = roleName.toLowerCase();
    
    // 角色映射表
    switch (lowerCaseRole) {
      case 'admin':
        return '管理员';
      case 'headteacher':
        return '班主任';
      case 'teacher':
        return '教师';
      default:
        return roleName; // 如果没有匹配项，返回原始角色名
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        个人资料
      </Typography>
      
      <ProfileContainer>
        <ProfileHeader>
          <ProfileAvatar src={getUserAvatar()} alt={profileData.name} />
          <UserInfoBox>
            <UserName variant="h5">
              {profileData.name}
            </UserName>
            <UserEmail>
              <Email fontSize="small" />
              {profileData.email}
            </UserEmail>
            {profileData.phone && (
              <UserPhone>
                <Phone fontSize="small" />
                {profileData.phone}
              </UserPhone>
            )}
            <UserRole 
              icon={<SupervisorAccount />} 
              label={getRoleInChinese(user?.role)} 
            />
          </UserInfoBox>
        </ProfileHeader>

        <ProfileContent>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="个人资料" />
            <Tab label="修改密码" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {/* 个人资料表单 */}
          <TabPanel hidden={activeTab !== 0}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              基本信息
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="用户名"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileInputChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="姓名"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="邮箱"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="手机号码"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="性别"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleProfileInputChange}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value=""></option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    startIcon={<Edit />}
                  >
                    {loading ? '保存中...' : '保存修改'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* 修改密码表单 */}
          <TabPanel hidden={activeTab !== 1}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              修改密码
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="当前密码"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="新密码"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="确认新密码"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? '修改中...' : '修改密码'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </ProfileContent>
      </ProfileContainer>

      {/* 提示框 */}
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
    </PageContainer>
  );
};

export default Profile; 