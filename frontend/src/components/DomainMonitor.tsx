import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  IconButton,
  Tooltip,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Domain,
  Warning,
  CheckCircle,
  Error,
  Add,
  Refresh,
  ExpandMore,
  CalendarToday,
  Delete,
} from '@mui/icons-material';
import { DomainCheck } from '../types';
import { useDomainMonitoring } from '../hooks/useDomainMonitoring';

interface DomainMonitorProps {
  expanded?: boolean;
}

const DomainMonitor: React.FC<DomainMonitorProps> = ({ expanded = false }) => {
  const [newDomain, setNewDomain] = useState('');
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(expanded);

  // Default domains to monitor
  const defaultDomains: string[] = [];

  const {
    domains,
    loading,
    error,
    fetchDomains,
    fetchDomainsWithStatus,
    addDomain,
    removeDomain,
    stats,
  } = useDomainMonitoring({
    domains: defaultDomains,
    autoRefresh: true, // Enable automatic refresh
    refreshInterval: 300000, // 5 minutes
    autoRefreshStatus: false, // Not needed - will use background checks
  });

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    try {
      await addDomain(newDomain);
      setNewDomain('');
    } catch (err: any) {
      // Error is handled by the hook
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    try {
      await removeDomain(domain);
    } catch (err: any) {
      // Error is handled by the hook and displayed in the error alert
      console.error('Failed to remove domain:', err);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await fetchDomainsWithStatus();
    } catch (err: any) {
      console.error('Failed to refresh domain status:', err);
    }
  };

  const getStatusIcon = (domain: DomainCheck) => {
    if (domain.error) {
      return <Error color="error" />;
    }
    if (domain.isExpired) {
      return <Error color="error" />;
    }
    if (domain.isExpiringSoon) {
      return <Warning color="warning" />;
    }
    return <CheckCircle color="success" />;
  };

  const getStatusColor = (domain: DomainCheck) => {
    if (domain.error) return 'error';
    if (domain.isExpired) return 'error';
    if (domain.isExpiringSoon) return 'warning';
    return 'success';
  };

  const getStatusText = (domain: DomainCheck) => {
    if (domain.error) return 'Error';
    if (domain.isExpired) return 'Expired';
    if (domain.isExpiringSoon) return 'Expiring Soon';
    return 'Valid';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Accordion 
      expanded={isAccordionExpanded} 
      onChange={(_, expanded) => setIsAccordionExpanded(expanded)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" width="100%">
          <Domain sx={{ mr: 2, color: 'primary.main' }} />
          <Box flexGrow={1}>
            <Typography variant="h6">
              Domain Monitoring
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monitor domain expiration dates
            </Typography>
          </Box>
          <Box display="flex" gap={1} mr={2}>
            <Chip 
              label={`${stats.valid} Valid`} 
              color="success" 
              size="small" 
            />
            {stats.expiring > 0 && (
              <Chip 
                label={`${stats.expiring} Expiring`} 
                color="warning" 
                size="small" 
              />
            )}
            {stats.expired > 0 && (
              <Chip 
                label={`${stats.expired} Expired`} 
                color="error" 
                size="small" 
              />
            )}
          </Box>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Add Domain Section */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  label="Add Domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddDomain}
                  disabled={loading || !newDomain.trim()}
                >
                  Add
                </Button>
                <Tooltip title="Refresh all domains">
                  <IconButton onClick={() => fetchDomains()} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Check domain status (slow)">
                  <IconButton onClick={handleRefreshStatus} disabled={loading}>
                    <Domain />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {/* Domain List */}
          {loading && domains.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {domains.map((domain, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                          {domain.domain}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={getStatusIcon(domain)}
                            label={getStatusText(domain)}
                            color={getStatusColor(domain) as any}
                            size="small"
                          />
                          <Tooltip title="Remove domain">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveDomain(domain.domain)}
                              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      {!domain.error && (
                        <Box>
                          <Box display="flex" alignItems="center" mb={1}>
                            <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary">
                              Expires: {formatDate(domain.expiryDate)}
                            </Typography>
                          </Box>
                          
                          {domain.daysUntilExpiry !== undefined && (
                            <Typography 
                              variant="body2" 
                              color={domain.daysUntilExpiry < 30 ? 'error.main' : 'text.secondary'}
                            >
                              {domain.daysUntilExpiry > 0 
                                ? `${domain.daysUntilExpiry} days remaining`
                                : `Expired ${Math.abs(domain.daysUntilExpiry)} days ago`
                              }
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {domain.error && (
                        <Typography variant="body2" color="error.main">
                          {typeof domain.error === 'string' ? domain.error : JSON.stringify(domain.error)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {domains.length === 0 && !loading && (
            <Typography color="textSecondary" textAlign="center" py={4}>
              No domains configured. Add your first domain to get started!
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default DomainMonitor; 