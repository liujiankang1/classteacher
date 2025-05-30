import React, { useState, forwardRef } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  TextFieldProps,
  styled
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock, 
  Email, 
  Phone,
  Search
} from '@mui/icons-material';

// 样式化的TextField组件
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      backgroundColor: '#fff',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 2px rgba(0, 113, 227, 0.2)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px 16px',
  },
  '& .MuiInputLabel-outlined': {
    transform: 'translate(16px, 15px) scale(1)',
  },
  '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
    transform: 'translate(16px, -6px) scale(0.75)',
  },
}));

// 图标映射
const iconMap: { [key: string]: React.ReactElement } = {
  'person': <Person />,
  'lock': <Lock />,
  'email': <Email />,
  'phone': <Phone />,
  'search': <Search />
};

// 自定义输入组件属性
interface CustomInputProps extends Omit<TextFieldProps, 'variant'> {
  prefixIcon?: string;
  showPassword?: boolean;
  onEnter?: () => void;
}

// 自定义输入组件
const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  ({ prefixIcon, showPassword, onEnter, onChange, ...props }, ref) => {
    const [showPasswordValue, setShowPasswordValue] = useState(false);

    // 处理回车键按下事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && onEnter) {
        onEnter();
      }
      // 确保原始的onKeyDown事件也被调用
      if (props.onKeyDown) {
        props.onKeyDown(e as any);
      }
    };

    // 处理密码可见性切换
    const handleClickShowPassword = () => {
      setShowPasswordValue(!showPasswordValue);
    };

    // 获取密码输入类型
    const getType = () => {
      if (props.type === 'password') {
        return showPasswordValue ? 'text' : 'password';
      }
      return props.type;
    };

    // 获取前缀图标
    const getPrefixIcon = () => {
      if (!prefixIcon) return null;
      return iconMap[prefixIcon] || null;
    };

    // 确保onChange事件被正确处理
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e as any);
      }
    };

    return (
      <StyledTextField
        ref={ref}
        variant="outlined"
        fullWidth
        {...props}
        type={getType()}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        InputProps={{
          ...props.InputProps,
          startAdornment: prefixIcon ? (
            <InputAdornment position="start">
              {getPrefixIcon()}
            </InputAdornment>
          ) : props.InputProps?.startAdornment,
          endAdornment: props.type === 'password' && showPassword ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
                size="large"
              >
                {showPasswordValue ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ) : props.InputProps?.endAdornment,
        }}
      />
    );
  }
);

export default CustomInput; 