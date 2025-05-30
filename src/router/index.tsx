import { createHashRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, ReactElement } from 'react';
import { CircularProgress, Box } from '@mui/material';
import PermissionGuard from '../components/PermissionGuard';

// 懒加载组件 - 添加新创建的组件
const Login = lazy(() => import('../views/Login'));
const Register = lazy(() => import('../views/Register'));
const ForgotPassword = lazy(() => import('../views/ForgotPassword'));
const ResetPassword = lazy(() => import('../views/ResetPassword'));
const Dashboard = lazy(() => import('../views/Dashboard'));
const Home = lazy(() => import('../views/Home'));
const Profile = lazy(() => import('../views/Profile'));
const MainLayout = lazy(() => import('../components/MainLayout'));

// 新增功能页面
const StudentManagement = lazy(() => import('../views/StudentManagement'));
const ClassManagement = lazy(() => import('../views/ClassManagement'));
const ScoreManagement = lazy(() => import('../views/ScoreManagement'));
const ExamManagement = lazy(() => import('../views/ExamManagement'));
const SubjectManagement = lazy(() => import('../views/SubjectManagement'));
const ScoreStatistics = lazy(() => import('../views/ScoreStatistics'));
const LeaveManagement = lazy(() => import('../views/LeaveManagement'));
const LeaveStatistics = lazy(() => import('../views/LeaveStatistics'));
const RewardManagement = lazy(() => import('../views/RewardManagement'));
const UserManagement = lazy(() => import('../views/UserManagement'));

// 加载中组件
const LoadingComponent = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}
  >
    <CircularProgress />
  </Box>
);

// 权限校验 - 检查用户是否已登录
const RequireAuth = ({ children }: { children: ReactElement }) => {
  const token = localStorage.getItem('token');
  
  // 增加额外验证，确保token不是无效值
  if (!token || token === 'undefined' || token === 'null') {
    console.log('未登录或令牌无效，重定向到登录页');
    
    // 确保清除任何可能存在的无效token
    if (token === 'undefined' || token === 'null') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // 如果用户之前有"记住密码"，会在登录页面自动尝试登录
    return <Navigate to="/login" replace />;
  }
  
  try {
    // 验证用户信息是否有效
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (!user || !user.id) {
        console.log('用户信息无效，重定向到登录页');
        return <Navigate to="/login" replace />;
      }
    } else {
      console.log('没有用户信息，重定向到登录页');
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error('解析用户信息出错，重定向到登录页', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 处理登录页面的访问 - 防止无限刷新
const LoginPageHandler = ({ children }: { children: ReactElement }) => {
  // 我们不在这里判断是否需要重定向，
  // 而是把这个逻辑放在Login组件内部处理
  // 这样可以避免在页面刷新时导致的问题
  return children;
};

// 路由配置
const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <LoginPageHandler>
          <Login />
        </LoginPageHandler>
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      </Suspense>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'home',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: 'student-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <StudentManagement />
          </Suspense>
        ),
      },
      {
        path: 'class-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <ClassManagement />
          </Suspense>
        ),
      },
      {
        path: 'score-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <ScoreManagement />
          </Suspense>
        ),
      },
      {
        path: 'exam-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <ExamManagement />
          </Suspense>
        ),
      },
      {
        path: 'subject-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <SubjectManagement />
          </Suspense>
        ),
      },
      {
        path: 'score-statistics',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <ScoreStatistics />
          </Suspense>
        ),
      },
      {
        path: 'leave-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <LeaveManagement />
          </Suspense>
        ),
      },
      {
        path: 'leave-statistics',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <LeaveStatistics />
          </Suspense>
        ),
      },
      {
        path: 'reward-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <RewardManagement />
          </Suspense>
        ),
      },
      {
        path: 'user-management',
        element: (
          <Suspense fallback={<LoadingComponent />}>
            <PermissionGuard requiredRoles={['ROLE_ADMIN', 'ROLE_HEADTEACHER']}>
              <UserManagement />
            </PermissionGuard>
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router; 