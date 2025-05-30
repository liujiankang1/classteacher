import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  styled
} from '@mui/material';
import CustomInput from '../components/CustomInput';
import { resetPassword } from '../api/auth';
import { debounce } from '../utils/dom-optimizer';

// 样式化组件
const ResetContainer = styled(Box)(({ theme }) => ({
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

const ResetContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '460px',
  zIndex: 1,
}));

const ResetBox = styled(Paper)(({ theme }) => ({
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

const ResetFooter = styled(Box)(({ theme }) => ({
  marginTop: '20px',
  color: '#5d6280',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
}));

// 重置密码组件
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resetForm, setResetForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [isProcessing, setIsProcessing] = useState(false);

  // 从URL中获取token
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessageType('error');
      setMessage('无效的重置链接，请重新获取');
    }
  }, [location]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 创建防抖版本的重置密码处理函数
  const debouncedResetHandler = debounce(async (password, resetToken) => {
    if (isProcessing) return; // 防止重复处理
    
    setIsProcessing(true);
    setLoading(true);
    setMessage('');
    
    try {
      await resetPassword({ 
        token: resetToken,
        password: password
      });
      
      // 成功重置密码
      setMessageType('success');
      setMessage('密码重置成功，请使用新密码登录');
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('重置密码失败:', error);
      setMessageType('error');
      
      if (error.response) {
        setMessage((error.response.data && error.response.data.message) || '重置密码失败');
      } else if (error.request) {
        setMessage('无法连接到服务器，请检查网络');
      } else {
        setMessage('重置密码过程中出现错误: ' + error.message);
      }
    } finally {
      setLoading(false);
      // 延迟重置处理状态，防止快速多次点击
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, 300);

  // 处理重置密码
  const handleResetPassword = () => {
    // 防止重复点击
    if (loading || isProcessing) {
      return;
    }
    
    // 表单验证
    if (!resetForm.password.trim()) {
      setMessageType('error');
      setMessage('请输入新密码');
      return;
    }
    
    if (resetForm.password.length < 6) {
      setMessageType('error');
      setMessage('密码长度不能少于6个字符');
      return;
    }
    
    if (resetForm.password !== resetForm.confirmPassword) {
      setMessageType('error');
      setMessage('两次输入的密码不一致');
      return;
    }
    
    if (!token) {
      setMessageType('error');
      setMessage('无效的重置链接，请重新获取');
      return;
    }
    
    // 使用防抖处理重置密码请求
    debouncedResetHandler(resetForm.password, token);
  };

  return (
    <ResetContainer>
      <ResetContent>
        <ResetBox>
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
              请设置您的新密码
            </Typography>
          </Box>
          
          <Box component="form" sx={{ width: '100%' }}>
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="password"
                value={resetForm.password}
                onChange={handleInputChange}
                type="password" 
                placeholder="新密码" 
                prefixIcon="lock"
                showPassword
                fullWidth
                required
              />
            </Box>
            
            <Box sx={{ marginBottom: '24px' }}>
              <CustomInput 
                name="confirmPassword"
                value={resetForm.confirmPassword}
                onChange={handleInputChange}
                type="password" 
                placeholder="确认新密码" 
                prefixIcon="lock"
                showPassword
                fullWidth
                required
                onEnter={handleResetPassword}
              />
            </Box>
            
            <FormActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleResetPassword} 
                disabled={loading || !token}
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
          
          {message && (
            <Alert severity={messageType} sx={{ marginTop: '20px' }}>
              {message}
            </Alert>
          )}
        </ResetBox>
        
        <ResetFooter>
          <Typography variant="body2">
            © 2025 班主任管理系统 - 高效的教育管理平台
          </Typography>
        </ResetFooter>
      </ResetContent>
    </ResetContainer>
  );
};

export default ResetPassword; 