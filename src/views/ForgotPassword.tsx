import React, { useState, FormEvent, useEffect, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../api/axios';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  styled,
  Stack,
  IconButton,
  GlobalStyles
} from '@mui/material';
import CustomInput from '../components/CustomInput';
// import { forgotPassword, sendVerificationCode, resetPasswordWithCode } from '../api/auth';
import { resetPasswordWithCode, verifyUsernameEmail } from '../api/auth';
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
    },
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.4)'
      },
      '70%': {
        boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)'
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)'
      }
    },
    '@keyframes bounce': {
      '0%, 20%, 50%, 80%, 100%': {
        transform: 'translateY(0)'
      },
      '40%': {
        transform: 'translateY(-10px)'
      },
      '60%': {
        transform: 'translateY(-5px)'
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

// 成功提示框样式
const SuccessAlert = styled(StyledAlert)(({ theme }) => ({
  backgroundColor: 'rgba(237, 247, 237, 0.9)',
  borderColor: theme.palette.success.main,
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
  padding: '16px',
  '& .MuiAlert-icon': {
    fontSize: '24px',
    color: theme.palette.success.main
  },
  '& .MuiAlert-message': {
    fontSize: '15px',
    fontWeight: 600
  }
}));

// 样式化组件
const ForgotContainer = styled(Box)(({ theme }) => ({
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

const ForgotContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '460px',
  zIndex: 1,
}));

const ForgotBox = styled(Paper)(({ theme }) => ({
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

const ForgotFooter = styled(Box)(({ theme }) => ({
  marginTop: '20px',
  color: '#5d6280',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
}));

// 忘记密码组件
const ForgotPassword: React.FC = () => {
  // const navigate = useNavigate();
  const navigateRef = useRef(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [isProcessing, setIsProcessing] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // 阻止所有导航
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!navigateRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 当用户名或邮箱变化时，重置验证状态
    if (name === 'username' || name === 'email') {
      setEmailVerified(false);
    }
  };
  
  // 发送验证码 - 使用axios直接请求而非axiosInstance
  const sendVerificationCodeDirectly = async (email: string) => {
    try {
      console.log('发送验证码请求...');
      // 使用直接请求，确保请求发送到正确的路径
      const baseURL = process.env.REACT_APP_API_URL || 'http://124.70.74.246:8081';
      const response = await axios.post(`${baseURL}/api/auth/send-verification-code`, { email });
      console.log('验证码发送成功响应:', response);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("发送验证码失败:", error);
      return { success: false, error };
    }
  };

  // 验证用户名和邮箱是否匹配
  const verifyUsernameAndEmail = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      return false;
    }
    
    try {
      const result = await verifyUsernameEmail({
        username: formData.username,
        email: formData.email
      });
      
      if (result.success) {
        setEmailVerified(true);
        return true;
      } else {
        setEmailVerified(false);
        setMessageType('error');
        setMessage('用户名与邮箱不匹配，请检查输入');
        return false;
      }
    } catch (error) {
      console.error('验证用户名和邮箱出错:', error);
      setEmailVerified(false);
      setMessageType('error');
      setMessage('验证用户名和邮箱时出现错误');
      return false;
    }
  };

  // 处理发送验证码
  const handleSendVerificationCode = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // 阻止默认行为
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopPropagation) event.stopPropagation();
    
    // 检查按钮状态
    if (codeSending || countdown > 0) {
      console.log('按钮已禁用或倒计时中');
      return false;
    }
    
    // 验证邮箱
    if (!formData.username?.trim()) {
      setMessageType('error');
      setMessage('请输入用户名');
      return false;
    }
    
    if (!formData.email?.trim()) {
      setMessageType('error');
      setMessage('请输入邮箱');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessageType('error');
      setMessage('请输入有效的邮箱地址');
      return false;
    }
    
    // 验证用户名和邮箱是否匹配
    const isVerified = await verifyUsernameAndEmail();
    if (!isVerified) {
      return false;
    }
    
    // 设置状态
    setCodeSending(true);
    setMessage('');
    
    try {
      // 使用直接的fetch方法发送请求
      console.log('开始发送验证码...');
      const result = await sendVerificationCodeDirectly(formData.email);
      
      if (result.success) {
        console.log('验证码发送成功');
        setMessageType('success');
        setMessage('验证码已发送到您的邮箱，请查收');
        
        // 设置倒计时
        setCountdown(60);
        const intervalId = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(intervalId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.log('验证码发送失败', result.error);
        setMessageType('error');
        setMessage('发送验证码失败，请稍后重试');
      }
    } catch (error) {
      console.error('发送验证码过程中出错:', error);
      setMessageType('error');
      setMessage('发送验证码过程中出现错误，请稍后重试');
    } finally {
      setCodeSending(false);
    }
    
    return false;
  };

  // 创建防抖版本的重置密码处理函数
  const debouncedResetHandler = debounce(async (data) => {
    if (isProcessing) return; // 防止重复处理
    
    setIsProcessing(true);
    setLoading(true);
    setMessage('');
    
    try {
      console.log('准备发送重置密码请求:', { 
        username: data.username, 
        email: data.email, 
        code: data.code, 
        newPassword: '***' 
      });
      
      const response = await resetPasswordWithCode({
        username: data.username,
        email: data.email,
        code: data.code,
        newPassword: data.newPassword
      });
      
      console.log('重置密码请求成功:', response);
      
      // 成功重置密码
      setMessageType('success');
      setMessage('密码重置成功，请使用新密码登录');
      setResetSuccess(true);
      
      // 清空表单数据
      setFormData({
        username: '',
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // 滚动到顶部以确保用户看到成功消息
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 设置倒计时
      setRedirectCountdown(3);
      const intervalId = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            // 跳转到登录页面
            navigateRef.current = true;
            window.location.href = '/login';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('重置密码请求失败:', error);
      setMessageType('error');
      setResetSuccess(false);
      
      if (error.response) {
        console.error('错误响应数据:', error.response.data);
        console.error('错误状态码:', error.response.status);
        setMessage((error.response.data && error.response.data.message) || '重置密码失败');
      } else if (error.request) {
        console.error('请求已发送但未收到响应');
        setMessage('无法连接到服务器，请检查网络');
      } else {
        console.error('请求设置时出错:', error.message);
        setMessage('重置密码过程中出现错误: ' + error.message);
      }
      
      // 滚动到顶部以确保用户看到错误消息
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
      // 延迟重置处理状态，防止快速多次点击
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, 0);

  // 处理表单提交，阻止默认行为
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return false;
  };

  // 处理重置密码
  const handleResetPassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // 阻止默认行为和事件冒泡
    e.preventDefault();
    e.stopPropagation();
    
    // 防止重复点击
    if (loading || isProcessing) {
      return;
    }
    
    // 表单验证
    if (!formData.username.trim()) {
      setMessageType('error');
      setMessage('请输入用户名');
      return;
    }
    
    if (!formData.email.trim()) {
      setMessageType('error');
      setMessage('请输入邮箱');
      return;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessageType('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }
    
    // 验证用户名和邮箱是否匹配
    if (!emailVerified) {
      const isVerified = await verifyUsernameAndEmail();
      if (!isVerified) {
        return;
      }
    }
    
    if (!formData.code.trim()) {
      setMessageType('error');
      setMessage('请输入验证码');
      return;
    }
    
    if (!formData.newPassword.trim()) {
      setMessageType('error');
      setMessage('请输入新密码');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessageType('error');
      setMessage('密码长度不能少于6个字符');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessageType('error');
      setMessage('两次输入的密码不一致');
      return;
    }
    
    // 使用防抖处理重置密码请求
    debouncedResetHandler(formData);
    
    // 阻止可能的导航
    return false;
  };

  return (
    <ForgotContainer>
      <GlobalStylesCustom />
      <ForgotContent>
        <ForgotBox>
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
              重置密码
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ margin: '0 0 20px 0' }}>
              请填写以下信息重置您的密码
            </Typography>
          </Box>
          
          {message && (
            <Box sx={{ 
              marginBottom: '20px', 
              animation: resetSuccess ? 'fadeIn 0.8s ease-in-out' : 'fadeIn 0.5s ease-in-out',
              transition: 'all 0.3s ease'
            }}>
              {resetSuccess ? (
                <SuccessAlert 
                  severity="success"
                  sx={{
                    animation: 'slideIn 0.5s ease-in-out forwards, pulse 2s infinite ease-in-out',
                    position: 'relative'
                  }}
                >
                  <Box>
                    {message}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        marginTop: '8px', 
                        fontWeight: 500,
                        animation: 'bounce 1s infinite'
                      }}
                    >
                      {redirectCountdown}秒后自动跳转到登录页面...
                    </Typography>
                  </Box>
                </SuccessAlert>
              ) : (
                <StyledAlert 
                  severity={messageType}
                  sx={{
                    animation: 'slideIn 0.3s ease-in-out forwards',
                    position: 'relative'
                  }}
                >
                  {message}
                </StyledAlert>
              )}
            </Box>
          )}
          
          {!resetSuccess && (
            <Box 
              component="form" 
              sx={{ width: '100%' }} 
              onSubmit={handleFormSubmit} 
              noValidate
            >
              <Box sx={{ marginBottom: '16px' }}>
                <CustomInput 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="用户名" 
                  prefixIcon="person"
                  fullWidth
                  required
                />
              </Box>
              
              <Box sx={{ marginBottom: '16px' }}>
                <CustomInput 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="邮箱" 
                  prefixIcon="email"
                  type="email"
                  fullWidth
                  required
                />
              </Box>
              
              <Box sx={{ marginBottom: '16px' }}>
                <Stack direction="row" spacing={1}>
                  <Box sx={{ flex: '1 1 65%' }}>
                    <CustomInput 
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="验证码" 
                      prefixIcon="key"
                      fullWidth
                      required
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 35%' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSendVerificationCode} 
                      type="button"
                      disabled={codeSending || countdown > 0}
                      sx={{ 
                        height: '50px',
                        borderRadius: '12px',
                        width: '100%',
                        boxShadow: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        padding: '0 8px',
                        minWidth: '100px',
                        '&:hover': {
                          boxShadow: '0 3px 5px rgba(0, 113, 227, 0.3)',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(0, 113, 227, 0.12)',
                          color: 'rgba(0, 113, 227, 0.5)',
                        }
                      }}
                    >
                      {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
              
              <Box sx={{ marginBottom: '16px' }}>
                <CustomInput 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="新密码" 
                  prefixIcon="lock"
                  type="password"
                  fullWidth
                  required
                />
              </Box>
              
              <Box sx={{ marginBottom: '16px' }}>
                <CustomInput 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="确认新密码" 
                  prefixIcon="lock"
                  type="password"
                  fullWidth
                  required
                />
              </Box>
              
              <FormActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleResetPassword} 
                  type="button"
                  disabled={loading}
                  sx={{ 
                    height: '50px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  {loading ? '重置中...' : '重置密码'}
                </Button>
                
                <LoginLink to="/login">
                  返回登录
                </LoginLink>
              </FormActions>
            </Box>
          )}
          
          {resetSuccess && (
            <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                component={Link} 
                to="/login"
                sx={{ 
                  height: '50px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 500,
                  width: '100%',
                  marginTop: '20px'
                }}
              >
                立即返回登录
              </Button>
            </Box>
          )}
        </ForgotBox>
        
        <ForgotFooter>
          <Typography variant="body2">
            © 2025 班主任管理系统 - 高效的教育管理平台
          </Typography>
        </ForgotFooter>
      </ForgotContent>
    </ForgotContainer>
  );
};

export default ForgotPassword; 