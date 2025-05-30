import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  styled,
  alpha,
  ListSubheader
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  School,
  Assessment,
  EventNote,
  MenuBook,
  BarChart,
  EventBusy,
  Person,
  Logout,
  Settings,
  ChevronLeft,
  ChevronRight,
  AdminPanelSettings,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.5)}`,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.6)}, transparent)`,
  }
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: '8px',
  margin: '4px 8px',
  padding: '8px 12px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: '60%',
      width: '4px',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 4px 4px 0',
    }
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  backgroundColor: 'transparent',
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: '1.5rem',
  paddingLeft: theme.spacing(3),
  marginTop: theme.spacing(1)
}));

// 菜单项类型定义
interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  role?: string | string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// 菜单项分组
const menuGroups: MenuGroup[] = [
  {
    title: '概览',
    items: [
      { text: '仪表盘', icon: <Dashboard />, path: '/dashboard' },
    ]
  },
  {
    title: '教学管理',
    items: [
      { text: '学生管理', icon: <People />, path: '/student-management' },
      { text: '班级管理', icon: <School />, path: '/class-management' },
      { text: '学科管理', icon: <MenuBook />, path: '/subject-management' },
    ]
  },
  {
    title: '考勤成绩',
    items: [
      { text: '考试管理', icon: <EventNote />, path: '/exam-management' },
      { text: '成绩管理', icon: <Assessment />, path: '/score-management' },
      { text: '成绩统计', icon: <BarChart />, path: '/score-statistics' },
      { text: '请假管理', icon: <EventBusy />, path: '/leave-management' },
      { text: '请假统计', icon: <BarChart />, path: '/leave-statistics' },
      { text: '奖励表彰', icon: <EmojiEvents />, path: '/reward-management' },
    ]
  },
  {
    title: '系统设置',
    items: [
      { text: '用户管理', icon: <AdminPanelSettings />, path: '/user-management', role: ['ROLE_ADMIN', 'ROLE_HEADTEACHER'] },
    ]
  }
];

// 主布局组件
const MainLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // 检查用户是否具有特定角色
  const hasRole = (role?: string | string[]) => {
    if (!role || !user) return true;
    
    // 如果role是数组，检查用户是否拥有其中任一角色
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    // 如果role是字符串，直接比较
    return user.role === role;
  };
  
  // 处理侧边栏开关
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  // 处理用户菜单开关
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // 处理菜单项点击
  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };
  
  // 处理退出登录
  const handleLogout = async () => {
    console.log('调用退出登录功能');
    
    try {
      // 使用AuthContext的logout函数
      await logout();
      
      // 关闭菜单
      handleCloseMenu();
      
      // 使用navigate导航到登录页
      console.log('导航到登录页');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };
  
  // 处理个人资料
  const handleProfile = () => {
    navigate('/profile');
    handleCloseMenu();
  };
  
  // 获取用户头像
  const getUserAvatar = () => {
    // 如果用户有自定义头像，可以在这里返回
    // 根据性别返回默认头像
    return getDefaultAvatar(user?.gender);
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* 顶部导航栏 */}
      <AppBarStyled position="fixed" open={open}>
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          height: '64px',
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                backgroundColor: alpha('#fff', 0.1),
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.2),
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <School 
                sx={{ 
                  mr: 1, 
                  fontSize: '1.8rem',
                  display: { xs: 'none', sm: 'block' }
                }} 
              />
              班主任管理系统
            </Typography>
          </Box>
          
          {/* 用户头像和菜单 */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha('#fff', 0.1),
            borderRadius: '30px',
            padding: '4px 16px 4px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.15),
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }
          }}>
            {/* 显示用户姓名 */}
            <Typography 
              variant="body1" 
              sx={{ 
                mr: 2, 
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {user?.name || ''}
            </Typography>
            <Tooltip title="账号设置">
              <IconButton 
                onClick={handleMenu} 
                sx={{ 
                  p: 0.5,
                  border: `2px solid ${alpha('#fff', 0.3)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    border: `2px solid ${alpha('#fff', 0.5)}`,
                  }
                }}
              >
                <Avatar 
                  alt={user?.name || '用户'} 
                  src={getUserAvatar()} 
                  sx={{ width: 36, height: 36 }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  borderRadius: '12px',
                  minWidth: '180px',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <Person fontSize="small" color="primary" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>个人资料</Typography>
              </MenuItem>
              <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500} color="error.main">退出登录</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      
      {/* 侧边栏 */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
      >
        <LogoContainer>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, transparent)`,
            padding: '8px 12px',
            borderRadius: '12px',
          }}>
            <img 
              src="https://img.icons8.com/color/48/000000/school.png" 
              alt="Logo" 
              style={{ 
                width: '36px', 
                height: '36px', 
                marginRight: '12px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} 
            />
            <Box>
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: theme.palette.primary.main,
                  textShadow: `0 1px 2px ${alpha('#000', 0.1)}`,
                  letterSpacing: '0.5px'
                }}
              >
                班主任系统
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  color: theme.palette.text.secondary,
                  marginTop: '-4px',
                  letterSpacing: '1px'
                }}
              >
                CLASS TEACHER
              </Typography>
            </Box>
          </Box>
        </LogoContainer>
        
        <Box sx={{ overflow: 'auto', py: 1 }}>
          {menuGroups.map((group, index) => {
            // 过滤出当前用户有权限查看的菜单项
            const visibleItems = group.items.filter(item => !item.role || hasRole(item.role));
            
            // 如果该分组没有可见项，则不显示该分组
            if (visibleItems.length === 0) return null;
            
            return (
              <React.Fragment key={group.title}>
                {index > 0 && <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />}
                <StyledListSubheader>{group.title}</StyledListSubheader>
                <List disablePadding>
                  {visibleItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <StyledListItemButton 
                        selected={location.pathname === item.path}
                        onClick={() => handleMenuItemClick(item.path)}
                      >
                        <ListItemIcon 
                          sx={{ 
                            minWidth: '40px',
                            color: location.pathname === item.path ? 'primary.main' : 'text.secondary'
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: location.pathname === item.path ? 600 : 400
                          }}
                        />
                      </StyledListItemButton>
                    </ListItem>
                  ))}
                </List>
              </React.Fragment>
            );
          })}
        </Box>
      </Drawer>
      
      {/* 主内容区域 */}
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default MainLayout; 