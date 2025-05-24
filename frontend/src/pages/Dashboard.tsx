import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CheckCircle,
  Error,
  Pause,
  Refresh,
  TrendingUp,
  Domain,
} from '@mui/icons-material';
import { Monitor, MonitorStatus, DashboardData, DomainCheck } from '../types';
import { monitorsApi, domainApi } from '../services/api';
import DomainMonitor from '../components/DomainMonitor';
import { useDomainMonitoring } from '../hooks/useDomainMonitoring';

const Dashboard: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use domain monitoring hook for background stats
  const { domains: domainStats } = useDomainMonitoring({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await monitorsApi.getAll();
      setMonitors(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch monitors');
      console.error('Error fetching monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
    
    // Auto-refresh only monitors, not domains (domains handled by hook)
    const interval = setInterval(() => {
      fetchMonitors();
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMonitors();
    // Domain refresh is handled by the hook
  };

  const getStatusColor = (status: MonitorStatus) => {
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

  const getStatusIcon = (status: MonitorStatus) => {
    switch (status) {
      case MonitorStatus.UP:
        return <CheckCircle color="success" />;
      case MonitorStatus.DOWN:
        return <Error color="error" />;
      case MonitorStatus.PENDING:
        return <CircularProgress size={20} />;
      case MonitorStatus.PAUSED:
        return <Pause color="disabled" />;
      default:
        return <Error color="disabled" />;
    }
  };

  const stats = {
    total: monitors.length,
    up: monitors.filter(m => m.status === MonitorStatus.UP).length,
    down: monitors.filter(m => m.status === MonitorStatus.DOWN).length,
    pending: monitors.filter(m => m.status === MonitorStatus.PENDING).length,
    averageUptime: monitors.length > 0 
      ? Math.round(monitors.reduce((sum, m) => sum + m.uptimePercentage, 0) / monitors.length)
      : 0,
    domains: {
      total: domainStats.length,
      valid: domainStats.filter(d => !d.error && !d.isExpired && !d.isExpiringSoon).length,
      expiring: domainStats.filter(d => d.isExpiringSoon && !d.isExpired).length,
      expired: domainStats.filter(d => d.isExpired).length,
    }
  };

  if (loading && monitors.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center">
            <DashboardIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Monitors
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Up
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.up}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Down
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.down}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Uptime
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" color="primary.main">
                    {stats.averageUptime}%
                  </Typography>
                  <TrendingUp sx={{ ml: 1, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Domain Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Domain sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography color="textSecondary" gutterBottom>
                    Domains
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.domains.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valid Domains
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.domains.valid}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Expiring Soon
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.domains.expiring}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Expired
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.domains.expired}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Monitors */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monitors Overview
            </Typography>
            
            {monitors.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>
                No monitors configured yet. Add your first monitor to get started!
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {monitors.map((monitor) => (
                  <Grid item xs={12} md={6} key={monitor._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="between">
                          <Box>
                            <Typography variant="h6" noWrap>
                              {monitor.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {monitor.url}
                            </Typography>
                            <Box mt={1}>
                              <Chip
                                icon={getStatusIcon(monitor.status)}
                                label={monitor.status.toUpperCase()}
                                color={getStatusColor(monitor.status) as any}
                                size="small"
                              />
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="h6" color="primary.main">
                              {monitor.uptimePercentage}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Uptime
                            </Typography>
                            {monitor.lastResponseTime && (
                              <Typography variant="body2" color="textSecondary">
                                {monitor.lastResponseTime}ms
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Domain Monitoring */}
        <Box sx={{ mt: 3 }}>
          <DomainMonitor expanded={true} />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 