import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={(theme) => ({
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          width: '100%',
          height: '100%',
          backgroundColor: theme.palette.background.default,
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        '.app': {
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          overflow: 'hidden',
        },
        '.bg-shapes': {
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: -1,
          overflow: 'hidden',
        },
        '.shape': {
          position: 'absolute',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(0, 113, 227, 0.1) 0%, rgba(0, 113, 227, 0.05) 100%)',
          filter: 'blur(50px)',
          zIndex: -1,
        },
        '.shape-1': {
          width: '400px',
          height: '400px',
          top: '-100px',
          right: '-100px',
          background: 'linear-gradient(45deg, rgba(0, 113, 227, 0.1) 0%, rgba(0, 113, 227, 0.05) 100%)',
          animation: 'floatAnimation 15s ease-in-out infinite',
        },
        '.shape-2': {
          width: '300px',
          height: '300px',
          bottom: '-50px',
          left: '-50px',
          background: 'linear-gradient(45deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.05) 100%)',
          animation: 'floatAnimation 20s ease-in-out infinite reverse',
        },
        '.shape-3': {
          width: '200px',
          height: '200px',
          top: '30%',
          left: '20%',
          background: 'linear-gradient(45deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 149, 0, 0.05) 100%)',
          animation: 'floatAnimation 25s ease-in-out infinite',
        },
        '.shape-4': {
          width: '250px',
          height: '250px',
          bottom: '20%',
          right: '10%',
          background: 'linear-gradient(45deg, rgba(88, 86, 214, 0.1) 0%, rgba(88, 86, 214, 0.05) 100%)',
          animation: 'floatAnimation 30s ease-in-out infinite reverse',
        },
        '@keyframes floatAnimation': {
          '0%': {
            transform: 'translate(0, 0) rotate(0deg)',
          },
          '25%': {
            transform: 'translate(10px, 15px) rotate(5deg)',
          },
          '50%': {
            transform: 'translate(5px, 10px) rotate(10deg)',
          },
          '75%': {
            transform: 'translate(15px, 5px) rotate(5deg)',
          },
          '100%': {
            transform: 'translate(0, 0) rotate(0deg)',
          },
        },
        '.text-primary': {
          color: theme.palette.primary.main,
        },
        '.text-secondary': {
          color: theme.palette.secondary.main,
        },
        '.text-error': {
          color: theme.palette.error.main,
        },
        '.text-success': {
          color: theme.palette.success.main,
        },
        '.text-warning': {
          color: theme.palette.warning.main,
        },
        '.text-info': {
          color: theme.palette.info.main,
        },
        '.text-center': {
          textAlign: 'center',
        },
        '.text-right': {
          textAlign: 'right',
        },
        '.text-left': {
          textAlign: 'left',
        },
        '.font-bold': {
          fontWeight: 700,
        },
        '.font-medium': {
          fontWeight: 500,
        },
        '.font-normal': {
          fontWeight: 400,
        },
        '.font-light': {
          fontWeight: 300,
        },
        '.cursor-pointer': {
          cursor: 'pointer',
        },
        '.flex': {
          display: 'flex',
        },
        '.flex-col': {
          flexDirection: 'column',
        },
        '.items-center': {
          alignItems: 'center',
        },
        '.justify-center': {
          justifyContent: 'center',
        },
        '.justify-between': {
          justifyContent: 'space-between',
        },
        '.w-full': {
          width: '100%',
        },
        '.h-full': {
          height: '100%',
        },
        '.m-0': {
          margin: 0,
        },
        '.p-0': {
          padding: 0,
        },
      })}
    />
  );
};

export default GlobalStyles; 