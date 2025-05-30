import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

/**
 * 权限控制组件
 * 
 * 用于根据用户角色控制页面和功能的访问
 * 
 * @param children 子组件
 * @param requiredRoles 所需角色列表，如果为空则不检查角色
 * @param fallback 无权限时显示的内容，默认重定向到仪表盘
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRoles = [],
  fallback = <Navigate to="/dashboard" replace />
}) => {
  const { user } = useAuth();
  
  // 如果没有指定所需角色，则直接显示子组件
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }
  
  // 如果用户未登录，则显示fallback
  if (!user) {
    return <>{fallback}</>;
  }
  
  // 检查用户是否有所需角色中的任意一个
  const hasRequiredRole = requiredRoles.includes(user.role);
  
  // 如果用户有所需角色，则显示子组件，否则显示fallback
  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard; 