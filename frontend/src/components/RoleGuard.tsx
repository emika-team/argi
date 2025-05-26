import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Typography, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles = [],
  fallbackPath = '/dashboard',
  showUnauthorized = false
}) => {
  const { user, isAuthenticated } = useAuth();

  // ถ้าไม่ได้ login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้าไม่กำหนด roles หรือผู้ใช้เป็น admin
  if (allowedRoles.length === 0 || user?.role === 'admin') {
    return <>{children}</>;
  }

  // ตรวจสอบ role ของผู้ใช้
  const hasRequiredRole = allowedRoles.includes(user?.role || '');

  if (!hasRequiredRole) {
    if (showUnauthorized) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <BlockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              ไม่มีสิทธิ์เข้าถึง
            </Typography>
            <Typography variant="body1" color="textSecondary">
              คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              สิทธิ์ที่ต้องการ: {allowedRoles.join(', ')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              สิทธิ์ปัจจุบัน: {user?.role || 'ไม่ระบุ'}
            </Typography>
          </Paper>
        </Box>
      );
    }
    
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard; 