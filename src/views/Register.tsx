import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  MenuItem,
  styled,
  GlobalStyles
} from '@mui/material';
import CustomInput from '../components/CustomInput';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from '../utils/dom-optimizer';

// 全局样式定义
const GlobalStylesCustom = () => (
  <GlobalStyles styles={{
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
        transform: 'translateY(-10px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)'
      }
    },
    '@keyframes slideIn': {
      '0%': {
        opacity: 0,
        transform: 'translateX(-10px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateX(0)'
      }
    }
  }} />
);

// 自定义Alert样式
const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  border: '1px solid',
  borderColor: severity === 'success' 
    ? theme.palette.success.light 
    : severity === 'error' 
    ? theme.palette.error.light
    : theme.palette.warning.light,
  '& .MuiAlert-icon': {
    fontSize: '20px',
    opacity: 0.9,
    marginRight: '12px'
  },
  '& .MuiAlert-message': {
    padding: '4px 0'
  }
}));

// 样式化组件
const RegisterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  padding: '40px 0',
  boxSizing: 'border-box',
}));

const RegisterContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '460px',
  zIndex: 1,
}));

const RegisterBox = styled(Paper)(({ theme }) => ({
  width: '100%',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  margin: '20px 0',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
}));

const LogoImgContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'white',
  boxShadow: '0 8px 16px rgba(0, 113, 227, 0.3)',
  marginBottom: '15px',
  overflow: 'hidden',
}));

const FormActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginTop: '30px',
  width: '100%',
}));

const LoginLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'color 0.3s',
  textAlign: 'center',
  display: 'block',
  marginTop: theme.spacing(2),
  '&:hover': {
    color: theme.palette.primary.light,
    textDecoration: 'underline',
  },
}));

const RegisterFooter = styled(Box)(({ theme }) => ({
  marginTop: '20px',
  color: '#5d6280',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
}));

// 注册组件
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, loading, isAuthenticated, clearError } = useAuth();
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    role: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 如果已经登录，则重定向到仪表盘
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误信息
    if (error) {
      clearError();
    }
    
    // 清除表单错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      setFormErrorMessage('');
    }
  };

  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!registerForm.username.trim()) {
      errors.username = '请输入用户名';
    } else if (registerForm.username.length < 3 || registerForm.username.length > 20) {
      errors.username = '用户名长度应在3-20个字符之间';
    }
    
    if (!registerForm.name.trim()) {
      errors.name = '请输入姓名';
    } else if (registerForm.name.length < 2 || registerForm.name.length > 20) {
      errors.name = '姓名长度应在2-20个字符之间';
    }
    
    if (!registerForm.email.trim()) {
      errors.email = '请输入邮箱';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        errors.email = '请输入有效的邮箱地址';
      }
    }
    
    if (!registerForm.password) {
      errors.password = '请输入密码';
    } else if (registerForm.password.length < 6 || registerForm.password.length > 40) {
      errors.password = '密码长度应在6-40个字符之间';
    }
    
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!registerForm.gender) {
      errors.gender = '请选择性别';
    }
    
    if (!registerForm.role) {
      errors.role = '请选择角色';
    }
    
    setFormErrors(errors);
    
    // 设置表单错误消息
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setFormErrorMessage(firstError);
    } else {
      setFormErrorMessage('');
    }
    
    return Object.keys(errors).length === 0;
  };

  // 创建防抖版本的注册处理函数
  const debouncedRegisterHandler = debounce(async (userData) => {
    if (isProcessing) return; // 防止重复处理
    
    setIsProcessing(true);
    
    try {
      const response = await register(userData);
      console.log('注册成功:', response);
      
      // 显示成功消息
      setSuccessMessage('注册成功！即将跳转到登录页面...');
      
      // 延迟2秒后跳转到登录页面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('注册失败:', err);
      setSuccessMessage('');
    } finally {
      // 延迟重置处理状态，防止快速多次点击
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, 300);

  // 处理注册
  const handleRegister = () => {
    // 防止重复点击
    if (loading || isProcessing) {
      return;
    }
    
    // 表单验证
    if (!validateForm()) {
      // 滚动到页面顶部以显示错误信息
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // 准备注册数据 - 根据后端API要求映射角色值
    const roleMapping: Record<string, string> = {
      'ROLE_HEADTEACHER': 'headteacher',
      'ROLE_TEACHER': 'teacher'
    };
    
    // 确保发送正确的小写性别值和角色值
    const registerData = {
      username: registerForm.username,
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
      gender: registerForm.gender, // 已经是小写的"male"或"female"
      role: roleMapping[registerForm.role]
    };
    
    console.log('发送注册数据:', registerData);
    
    // 使用防抖处理注册请求
    debouncedRegisterHandler(registerData);
  };

  return (
    <RegisterContainer>
      <GlobalStylesCustom />
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <RegisterContent>
        <RegisterBox>
          <Box sx={{ textAlign: 'center', marginBottom: '30px' }}>
            <LogoContainer>
              <LogoImgContainer>
                <img 
                  src="https://img.icons8.com/color/96/000000/school.png" 
                  alt="学校Logo" 
                  style={{ width: '90%', height: '90%', objectFit: 'contain' }} 
                />
              </LogoImgContainer>
            </LogoContainer>
            <Typography variant="h4" sx={{ margin: '0 0 10px 0', fontWeight: 600, letterSpacing: '-0.5px' }}>
              创建账号
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ margin: '0 0 20px 0' }}>
              注册班主任管理系统账号
            </Typography>
          </Box>
          
          {successMessage && (
            <Box sx={{ 
              marginBottom: '20px', 
              animation: 'fadeIn 0.5s ease-in-out',
              transition: 'all 0.3s ease'
            }}>
              <StyledAlert 
                severity="success"
                sx={{
                  animation: 'slideIn 0.3s ease-in-out forwards',
                  position: 'relative'
                }}
              >
                {successMessage}
              </StyledAlert>
            </Box>
          )}
          
          {error && !successMessage && (
            <Box sx={{ 
              marginBottom: '20px', 
              animation: 'fadeIn 0.5s ease-in-out',
              transition: 'all 0.3s ease'
            }}>
              <StyledAlert 
                severity="error"
                sx={{
                  animation: 'slideIn 0.3s ease-in-out forwards',
                  position: 'relative'
                }}
              >
                {error}
              </StyledAlert>
            </Box>
          )}
          
          {formErrorMessage && !error && !successMessage && (
            <Box sx={{ 
              marginBottom: '20px', 
              animation: 'fadeIn 0.5s ease-in-out',
              transition: 'all 0.3s ease'
            }}>
              <StyledAlert 
                severity="warning"
                sx={{
                  animation: 'slideIn 0.3s ease-in-out forwards',
                  position: 'relative'
                }}
              >
                {formErrorMessage}
              </StyledAlert>
            </Box>
          )}
          
          <Box component="form" sx={{ width: '100%' }}>
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="username"
                value={registerForm.username}
                onChange={handleInputChange}
                placeholder="用户名" 
                prefixIcon="person"
                fullWidth
                required
                error={!!formErrors.username}
                helperText={formErrors.username}
              />
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="name"
                value={registerForm.name}
                onChange={handleInputChange}
                placeholder="姓名" 
                prefixIcon="badge"
                fullWidth
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="email"
                value={registerForm.email}
                onChange={handleInputChange}
                type="email"
                placeholder="邮箱" 
                prefixIcon="email"
                fullWidth
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                select
                name="gender"
                value={registerForm.gender}
                onChange={handleInputChange}
                label="性别" 
                prefixIcon="wc"
                fullWidth
                required
                error={!!formErrors.gender}
                helperText={formErrors.gender}
              >
                <MenuItem value="male">男</MenuItem>
                <MenuItem value="female">女</MenuItem>
              </CustomInput>
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                select
                name="role"
                value={registerForm.role}
                onChange={handleInputChange}
                label="角色" 
                prefixIcon="school"
                fullWidth
                required
                error={!!formErrors.role}
                helperText={formErrors.role}
              >
                <MenuItem value="ROLE_HEADTEACHER">班主任</MenuItem>
                <MenuItem value="ROLE_TEACHER">教师</MenuItem>
              </CustomInput>
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="password"
                value={registerForm.password}
                onChange={handleInputChange}
                type="password" 
                placeholder="密码" 
                prefixIcon="lock"
                showPassword
                fullWidth
                required
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleInputChange}
                type="password" 
                placeholder="确认密码" 
                prefixIcon="lock"
                showPassword
                fullWidth
                required
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                onEnter={handleRegister}
              />
            </Box>
            
            <FormActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRegister} 
                disabled={loading || isProcessing}
                sx={{ 
                  height: '50px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {loading || isProcessing ? '注册中...' : '注册'}
              </Button>
              
              <LoginLink to="/login">
                已有账号? 立即登录
              </LoginLink>
            </FormActions>
          </Box>
        </RegisterBox>
        
        <RegisterFooter>
          <Typography variant="body2">
            © 2025 班主任管理系统 - 高效的教育管理平台
          </Typography>
        </RegisterFooter>
      </RegisterContent>
    </RegisterContainer>
  );
};

export default Register; 