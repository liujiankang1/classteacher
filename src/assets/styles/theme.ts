import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0071e3', // 苹果风格的蓝色，与原项目保持一致
      light: '#42b4ff',
      dark: '#0058b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff3b30', // 苹果风格的红色
      light: '#ff6b5b',
      dark: '#c30000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#86868b',
    },
    error: {
      main: '#ff3b30',
    },
    warning: {
      main: '#ff9500',
    },
    info: {
      main: '#0071e3',
    },
    success: {
      main: '#34c759',
    },
  },
  typography: {
    fontFamily: '"SF Pro Text", "SF Pro Icons", "Helvetica Neue", Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '10px 20px',
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          background: '#0071e3',
          '&:hover': {
            background: '#0058b0',
          },
        },
        outlinedPrimary: {
          borderColor: '#0071e3',
          '&:hover': {
            backgroundColor: 'rgba(0, 113, 227, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

export default theme; 