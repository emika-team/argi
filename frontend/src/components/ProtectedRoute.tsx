import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // แสดง loading ขณะตรวจสอบ authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // สำหรับ route ที่ต้องการ authentication
  if (requireAuth && !isAuthenticated) {
    // เก็บ location ปัจจุบันเพื่อ redirect กลับมาหลัง login
    return <Navigate to={redirectTo || "/login"} state={{ from: location }} replace />;
  }

  // สำหรับ route ที่ไม่ต้องการ authentication (เช่น login, register)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo || "/dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 