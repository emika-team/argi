import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudOutlined,
  Check,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useCloudflareImport, CloudflareZone, ImportResult } from '../hooks/useCloudflareImport';

interface CloudflareImportProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const CloudflareImport: React.FC<CloudflareImportProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  userId 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [credentials, setCredentials] = useState({
    email: '',
    apiKey: '',
  });

  const {
    loading,
    error,
    zones,
    importResult,
    validateCredentials,
    fetchZones,
    importDomains,
    reset,
  } = useCloudflareImport();

  const steps = ['Enter Credentials', 'Preview Domains', 'Import Results'];

  const handleCredentialsSubmit = async () => {
    if (!credentials.apiKey) {
      return;
    }

    const validation = await validateCredentials(credentials);
    if (validation.valid) {
      await fetchZones(credentials);
      setActiveStep(1);
    }
  };

  const handleImport = async () => {
    const result = await importDomains({
      ...credentials,
      userId,
    });
    
    if (result) {
      setActiveStep(2);
    }
  };

  const handleClose = () => {
    reset();
    setActiveStep(0);
    setCredentials({ email: '', apiKey: '' });
    onClose();
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  const renderCredentialsStep = () => (
    <Box>
      <Typography variant="body1" gutterBottom>
        Enter your Cloudflare credentials to connect and import domains.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Option 1 (Recommended):</strong> Use an API Token with "Zone:Read" permissions<br/>
        Create one at: Cloudflare dashboard → My Profile → API Tokens → Create Token<br/>
        <br/>
        <strong>Option 2:</strong> Use your Global API Key + Email<br/>
        Find it at: Cloudflare dashboard → My Profile → API Tokens → Global API Key
      </Alert>

      <TextField
        fullWidth
        label="Email (Optional for API Token)"
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        margin="normal"
        helperText="Only required if using Global API Key (not needed for API Token)"
      />
      
      <TextField
        fullWidth
        label="API Token or API Key"
        type="password"
        value={credentials.apiKey}
        onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
        margin="normal"
        required
        helperText="Enter your API Token (recommended) or Global API Key"
      />
    </Box>
  );

  const renderPreviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Found {zones.length} domain(s) in your Cloudflare account
      </Typography>
      
      <Typography variant="body2" color="textSecondary" gutterBottom>
        The following domains will be imported:
      </Typography>

      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {zones.map((zone: CloudflareZone, index: number) => (
          <ListItem key={index} divider>
            <ListItemIcon>
              <CloudOutlined color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={zone.domain}
              secondary={
                <Box component="span" display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={zone.status} 
                    size="small" 
                    color={zone.status === 'active' ? 'success' : 'default'}
                  />
                  {zone.isPaused && (
                    <Chip label="Paused" size="small" color="warning" />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderResultsStep = () => (
    <Box>
      {importResult && (
        <>
          <Typography variant="h6" gutterBottom>
            Import Completed
          </Typography>
          
          <Box display="flex" gap={2} mb={3}>
            <Chip 
              icon={<Check />}
              label={`${importResult.importedDomains} imported`}
              color="success"
            />
            <Chip 
              icon={<Warning />}
              label={`${importResult.skippedDomains} skipped`}
              color="warning"
            />
            {importResult.errors.length > 0 && (
              <Chip 
                icon={<ErrorIcon />}
                label={`${importResult.errors.length} errors`}
                color="error"
              />
            )}
          </Box>

          {importResult.importedDomainsList.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Successfully Imported:
              </Typography>
              <List dense>
                {importResult.importedDomainsList.map((domain: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Check color="success" />
                    </ListItemIcon>
                    <ListItemText primary={domain} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {importResult.skippedDomainsList.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Skipped:
              </Typography>
              <List dense>
                {importResult.skippedDomainsList.map((item: { domain: string; reason: string }, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.domain}
                      secondary={item.reason}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {importResult.errors.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Errors:
              </Typography>
              <List dense>
                {importResult.errors.map((error: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderCredentialsStep();
      case 1:
        return renderPreviewStep();
      case 2:
        return renderResultsStep();
      default:
        return null;
    }
  };

  const getStepActions = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCredentialsSubmit}
              disabled={loading || !credentials.apiKey}
            >
              {loading ? <CircularProgress size={20} /> : 'Connect'}
            </Button>
          </>
        );
      case 1:
        return (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button 
              variant="contained" 
              onClick={handleImport}
              disabled={loading || zones.length === 0}
            >
              {loading ? <CircularProgress size={20} /> : `Import ${zones.length} Domain(s)`}
            </Button>
          </>
        );
      case 2:
        return (
          <>
            <Button variant="contained" onClick={handleFinish}>
              Done
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CloudOutlined color="primary" />
          Import Domains from Cloudflare
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        {getStepActions()}
      </DialogActions>
    </Dialog>
  );
};

export default CloudflareImport; 