import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  styled
} from '@mui/material';
import CustomInput from '../components/CustomInput';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from '../utils/dom-optimizer';

// 样式化组件
const LoginContainer = styled(Box)(({ theme }) => ({
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

const LoginContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '460px',
  zIndex: 1,
}));

const LoginBox = styled(Paper)(({ theme }) => ({
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

const ForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'color 0.3s',
  textAlign: 'right',
  display: 'block',
  marginTop: theme.spacing(1),
  '&:hover': {
    color: theme.palette.primary.light,
    textDecoration: 'underline',
  },
}));

const RegisterLink = styled(Link)(({ theme }) => ({
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

const LoginFooter = styled(Box)(({ theme }) => ({
  marginTop: '20px',
  color: '#5d6280',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
}));

// 登录组件
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, loading, isAuthenticated, clearError, user } = useAuth();
  
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // 如果已经登录，则重定向到仪表盘
  useEffect(() => {
    // 增加判断，避免不必要的重定向
    // 只有当用户已登录，且当前是登录页面时才重定向
    if (isAuthenticated && user && user.id) {
      // 获取当前页面的路径
      const currentPath = window.location.pathname;
      
      // 检查当前页面是否是登录页面
      const isLoginPage = currentPath === '/login' || currentPath === '/login/';
      
      // 如果当前不是登录页面，则不需要重定向
      if (isLoginPage) {
        console.log('用户已登录且在登录页面，重定向到仪表盘');
        navigate('/dashboard');
      } else {
        console.log('用户已登录但不在登录页面，不进行重定向');
      }
    }
  }, [isAuthenticated, navigate, user]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误信息
    if (error) {
      clearError();
    }
  };

  // 创建防抖版本的登录处理函数
  const debouncedLoginHandler = debounce(async (username, password) => {
    if (isProcessing) return; // 防止重复处理
    
    setIsProcessing(true);
    
    try {
      // 先清除本地可能存在的无效token和用户信息
      // 确保登录过程不受旧数据影响
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('开始登录处理:', username);
      
      await login(username, password);
      
      // 登录成功后导航到仪表盘
      console.log('登录成功，导航到仪表盘');
      navigate('/dashboard');
    } catch (error) {
      console.error('登录处理失败:', error);
    } finally {
      // 延迟重置处理状态，防止快速多次点击
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, 300);

  // 处理登录
  const handleLogin = () => {
    // 防止重复点击
    if (loading || isProcessing) {
      return;
    }
    
    // 表单验证
    if (!loginForm.username.trim()) {
      clearError();
      return;
    }
    
    if (!loginForm.password.trim()) {
      clearError();
      return;
    }
    
    // 使用防抖处理登录请求
    debouncedLoginHandler(loginForm.username, loginForm.password);
  };

  return (
    <LoginContainer>
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <LoginContent>
        <LoginBox>
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
              欢迎回来
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ margin: '0 0 20px 0' }}>
              登录您的班主任管理系统账号
            </Typography>
          </Box>
          
          <Box component="form" sx={{ width: '100%' }}>
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="username"
                value={loginForm.username}
                onChange={handleInputChange}
                placeholder="用户名" 
                prefixIcon="person"
                fullWidth
                required
              />
            </Box>
            
            <Box sx={{ marginBottom: '16px' }}>
              <CustomInput 
                name="password"
                value={loginForm.password}
                onChange={handleInputChange}
                type="password" 
                placeholder="密码" 
                prefixIcon="lock"
                showPassword
                fullWidth
                required
                onEnter={handleLogin}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <ForgotPasswordLink to="/forgot-password">
                忘记密码?
              </ForgotPasswordLink>
            </Box>
            
            <FormActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleLogin} 
                disabled={loading}
                sx={{ 
                  height: '50px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
              
              <RegisterLink to="/register">
                没有账号? 立即注册
              </RegisterLink>
            </FormActions>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ marginTop: '20px' }}>
              {error}
            </Alert>
          )}
        </LoginBox>
        
        <LoginFooter>
          <Typography variant="body2">
            © 2025 班主任管理系统 - 高效的教育管理平台
          </Typography>
        </LoginFooter>
      </LoginContent>
    </LoginContainer>
  );
};

export default Login; 