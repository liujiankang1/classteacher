import { css } from '@emotion/react';

export const globalStyles = css`
  :root {
    --gradient-bg: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }

  body {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Roboto, Arial, sans-serif;
    color: #1d1d1f;
    line-height: 1.47059;
    overflow-x: hidden;
    min-height: 100vh;
    background: var(--gradient-bg);
    background-size: 400% 400%;
    animation: gradientAnimation 15s ease infinite;
  }

  #root {
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* 动态背景形状 */
  .bg-shapes {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
  }

  .shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
  }

  .shape-1 {
    width: 600px;
    height: 600px;
    background: rgba(38, 133, 255, 0.2);
    top: -250px;
    left: -100px;
    animation: float 30s infinite ease-in-out;
  }

  .shape-2 {
    width: 700px;
    height: 700px;
    background: rgba(131, 96, 195, 0.15);
    bottom: -300px;
    right: -200px;
    animation: float 35s infinite ease-in-out reverse;
  }

  .shape-3 {
    width: 400px;
    height: 400px;
    background: rgba(255, 149, 0, 0.15);
    top: 30%;
    right: 5%;
    animation: float 25s infinite ease-in-out 5s;
  }

  .shape-4 {
    width: 500px;
    height: 500px;
    background: rgba(52, 199, 89, 0.15);
    bottom: 10%;
    left: 10%;
    animation: float 40s infinite ease-in-out 10s;
  }

  @keyframes float {
    0% {
      transform: translate(0, 0) rotate(0deg);
    }
    25% {
      transform: translate(50px, 30px) rotate(5deg);
    }
    50% {
      transform: translate(20px, 60px) rotate(10deg);
    }
    75% {
      transform: translate(-30px, 40px) rotate(5deg);
    }
    100% {
      transform: translate(0, 0) rotate(0deg);
    }
  }

  @keyframes gradientAnimation {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 113, 227, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 113, 227, 0.5);
  }

  /* 全局过渡效果 */
  .fade-enter {
    opacity: 0;
  }
  .fade-enter-active {
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  .fade-exit {
    opacity: 1;
  }
  .fade-exit-active {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
`;

export default globalStyles; 