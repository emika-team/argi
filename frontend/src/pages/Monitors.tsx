import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Monitor as MonitorIcon,
  CheckCircle,
  Error,
  Pause,
} from '@mui/icons-material';
import { Monitor, MonitorStatus, MonitorType, CreateMonitorRequest } from '../types';
import { monitorsApi } from '../services/api';

const Monitors: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [formData, setFormData] = useState<CreateMonitorRequest>({
    name: '',
    url: '',
    type: MonitorType.HTTPS,
    interval: 60,
    timeout: 30000,
    maxRetries: 3,
    description: '',
    tags: [],
    enableEmailAlerts: true,
    alertEmails: [],
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
  }, []);

  const handleOpenDialog = (monitor?: Monitor) => {
    if (monitor) {
      setEditingMonitor(monitor);
      setFormData({
        name: monitor.name,
        url: monitor.url,
        type: monitor.type,
        interval: monitor.interval,
        timeout: monitor.timeout,
        maxRetries: monitor.maxRetries,
        description: monitor.description || '',
        tags: monitor.tags,
        enableEmailAlerts: monitor.enableEmailAlerts,
        alertEmails: monitor.alertEmails,
      });
    } else {
      setEditingMonitor(null);
      setFormData({
        name: '',
        url: '',
        type: MonitorType.HTTPS,
        interval: 60,
        timeout: 30000,
        maxRetries: 3,
        description: '',
        tags: [],
        enableEmailAlerts: true,
        alertEmails: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMonitor(null);
  };

  const handleSave = async () => {
    try {
      if (editingMonitor) {
        await monitorsApi.update(editingMonitor._id, formData);
      } else {
        await monitorsApi.create(formData);
      }
      handleCloseDialog();
      fetchMonitors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save monitor');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this monitor?')) {
      try {
        await monitorsApi.delete(id);
        fetchMonitors();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete monitor');
      }
    }
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
          <Box display="flex" alignItems="center">
            <MonitorIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Monitors
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mr: 1 }}
            >
              Add Monitor
            </Button>
            <IconButton onClick={fetchMonitors} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : monitors.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <MonitorIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No monitors yet
                </Typography>
                <Typography color="textSecondary" mb={3}>
                  Get started by adding your first monitor
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Monitor
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {monitors.map((monitor) => (
              <Grid item xs={12} md={6} lg={4} key={monitor._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
                      <Typography variant="h6" noWrap>
                        {monitor.name}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(monitor)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(monitor._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="textSecondary" noWrap mb={2}>
                      {monitor.url}
                    </Typography>

                    <Box mb={2}>
                      <Chip
                        icon={getStatusIcon(monitor.status)}
                        label={monitor.status.toUpperCase()}
                        color={getStatusColor(monitor.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box display="flex" justifyContent="between">
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Uptime
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {monitor.uptimePercentage}%
                        </Typography>
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

                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary">
                        Checks: {monitor.totalChecks} | 
                        Success: {monitor.successfulChecks} | 
                        Failed: {monitor.failedChecks}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Add/Edit Monitor Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMonitor ? 'Edit Monitor' : 'Add New Monitor'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            variant="outlined"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MonitorType })}
            >
              <MenuItem value={MonitorType.HTTP}>HTTP</MenuItem>
              <MenuItem value={MonitorType.HTTPS}>HTTPS</MenuItem>
              <MenuItem value={MonitorType.PING}>PING</MenuItem>
              <MenuItem value={MonitorType.TCP}>TCP</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Check Interval (seconds)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.interval}
            onChange={(e) => setFormData({ ...formData, interval: Number(e.target.value) })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Timeout (milliseconds)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.timeout}
            onChange={(e) => setFormData({ ...formData, timeout: Number(e.target.value) })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingMonitor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Monitors; 