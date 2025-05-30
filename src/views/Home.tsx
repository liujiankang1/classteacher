import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  GridLegacy as Grid,
  Avatar,
  styled
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  EventNote as EventNoteIcon,
  MenuBook as MenuBookIcon,
  BarChart as BarChartIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 样式化组件
const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const ModuleCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  borderRadius: '16px',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const ModuleIcon = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  marginBottom: theme.spacing(2),
}));

// 功能模块数据
const modules = [
  {
    title: '仪表盘',
    description: '查看重要数据统计和通知',
    icon: <DashboardIcon fontSize="large" />,
    color: '#0071e3',
    path: '/dashboard',
  },
  {
    title: '学生管理',
    description: '管理学生信息和档案',
    icon: <PeopleIcon fontSize="large" />,
    color: '#34c759',
    path: '/student-management',
  },
  {
    title: '班级管理',
    description: '管理班级信息和结构',
    icon: <SchoolIcon fontSize="large" />,
    color: '#ff9500',
    path: '/class-management',
  },
  {
    title: '成绩管理',
    description: '录入和管理学生成绩',
    icon: <AssessmentIcon fontSize="large" />,
    color: '#5856d6',
    path: '/score-management',
  },
  {
    title: '考试管理',
    description: '创建和安排考试',
    icon: <EventNoteIcon fontSize="large" />,
    color: '#ff3b30',
    path: '/exam-management',
  },
  {
    title: '学科管理',
    description: '管理学科和课程信息',
    icon: <MenuBookIcon fontSize="large" />,
    color: '#007aff',
    path: '/subject-management',
  },
  {
    title: '成绩统计',
    description: '查看成绩分析和报告',
    icon: <BarChartIcon fontSize="large" />,
    color: '#af52de',
    path: '/score-statistics',
  },
  {
    title: '请假管理',
    description: '处理学生请假申请',
    icon: <EventBusyIcon fontSize="large" />,
    color: '#ff9f0a',
    path: '/leave-management',
  },
];

// 主页组件
const Home: React.FC = () => {
  const navigate = useNavigate();

  // 处理模块点击
  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  return (
    <PageContainer>
      <WelcomeSection>
        <Typography variant="h4" component="h1" gutterBottom>
          欢迎使用班主任管理系统
        </Typography>
        <Typography variant="body1" color="textSecondary">
          请选择您要使用的功能模块
        </Typography>
      </WelcomeSection>

      <Grid container spacing={4}>
        {modules.map((module, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
            <ModuleCard>
              <CardActionArea 
                onClick={() => handleModuleClick(module.path)}
                sx={{ padding: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}
              >
                <ModuleIcon sx={{ bgcolor: module.color }}>
                  {module.icon}
                </ModuleIcon>
                <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {module.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </ModuleCard>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default Home; 