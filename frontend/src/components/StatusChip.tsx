import React from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { CheckCircle, Error, Pause, Schedule } from '@mui/icons-material';
import { MonitorStatus } from '../types';
import { getStatusText } from '../utils/formatters';

interface StatusChipProps {
  status: MonitorStatus;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const getStatusColor = () => {
    switch (status) {
      case MonitorStatus.UP:
        return 'success';
      case MonitorStatus.DOWN:
        return 'error';
      case MonitorStatus.PENDING:
        return 'warning';
      case MonitorStatus.PAUSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case MonitorStatus.UP:
        return <CheckCircle />;
      case MonitorStatus.DOWN:
        return <Error />;
      case MonitorStatus.PENDING:
        return <Schedule />;
      case MonitorStatus.PAUSED:
        return <Pause />;
      default:
        return <Error />;
    }
  };

  return (
    <Chip
      icon={getStatusIcon()}
      label={getStatusText(status)}
      color={getStatusColor() as any}
      size={size}
      variant="filled"
    />
  );
};

export default StatusChip; 