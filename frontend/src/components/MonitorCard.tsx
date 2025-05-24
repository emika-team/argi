import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { Monitor } from '../types';
import StatusChip from './StatusChip';
import { formatDate, truncateUrl } from '../utils/formatters';

interface MonitorCardProps {
  monitor: Monitor;
  onEdit?: (monitor: Monitor) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
          <Typography variant="h6" noWrap title={monitor.name}>
            {monitor.name}
          </Typography>
          {showActions && (
            <Box>
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={() => onEdit(monitor)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(monitor._id)}
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        <Typography 
          variant="body2" 
          color="textSecondary" 
          mb={2}
          title={monitor.url}
        >
          {truncateUrl(monitor.url)}
        </Typography>

        <Box mb={2}>
          <StatusChip status={monitor.status} />
        </Box>

        <Box display="flex" justifyContent="between" mb={2}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Uptime
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" color="primary.main">
                {monitor.uptimePercentage}%
              </Typography>
              <TrendingUp sx={{ ml: 0.5, fontSize: 16, color: 'primary.main' }} />
            </Box>
          </Box>
          
          {monitor.lastResponseTime && (
            <Box textAlign="right">
              <Typography variant="body2" color="textSecondary">
                Response Time
              </Typography>
              <Typography variant="h6">
                {monitor.lastResponseTime}ms
              </Typography>
            </Box>
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Statistics
          </Typography>
          <Typography variant="body2">
            Total: {monitor.totalChecks} | 
            Success: {monitor.successfulChecks} | 
            Failed: {monitor.failedChecks}
          </Typography>
        </Box>

        {monitor.lastCheckedAt && (
          <Box display="flex" alignItems="center">
            <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="textSecondary">
              Last check: {formatDate(monitor.lastCheckedAt)}
            </Typography>
          </Box>
        )}

        {monitor.tags && monitor.tags.length > 0 && (
          <Box mt={1}>
            {monitor.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {monitor.tags.length > 3 && (
              <Chip
                label={`+${monitor.tags.length - 3} more`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitorCard; 