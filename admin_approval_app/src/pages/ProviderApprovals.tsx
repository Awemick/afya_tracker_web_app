import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import { Person, CheckCircle, Cancel, Email, Phone, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { providerApprovalAPI } from '../services/api';

interface Provider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
  institutionId?: string;
  institutionName?: string;
  registrationDate: string;
  status: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

const ProviderApprovals: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadPendingProviders();
  }, []);

  const loadPendingProviders = async () => {
    try {
      setLoading(true);
      const response = await providerApprovalAPI.getPendingProviders();
      setProviders(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (provider: Provider) => {
    try {
      setActionLoading(true);
      await providerApprovalAPI.approveProvider(provider.id);
      await loadPendingProviders(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to approve provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (provider: Provider) => {
    setSelectedProvider(provider);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProvider) return;

    try {
      setActionLoading(true);
      await providerApprovalAPI.rejectProvider(selectedProvider.id, rejectionReason);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedProvider(null);
      await loadPendingProviders(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to reject provider');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'warning';
      case 'active':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
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
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Provider Approvals
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {providers.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No pending provider approvals
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                All providers have been reviewed.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', gap: 3 }}>
            {providers.map((provider) => (
              <Box key={provider.id} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2 }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {provider.name}
                        </Typography>
                        <Chip
                          label={provider.status.replace('_', ' ')}
                          color={getStatusColor(provider.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{provider.email}</Typography>
                      </Box>
                      {provider.phone && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{provider.phone}</Typography>
                        </Box>
                      )}
                      {provider.specialty && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{provider.specialty}</Typography>
                        </Box>
                      )}
                      {provider.institutionName && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{provider.institutionName}</Typography>
                        </Box>
                      )}
                      {provider.licenseNumber && (
                        <Typography variant="body2" color="text.secondary">
                          License: {provider.licenseNumber}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Registered: {new Date(provider.registrationDate).toLocaleDateString()}
                    </Typography>

                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApprove(provider)}
                        disabled={actionLoading}
                        fullWidth
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleReject(provider)}
                        disabled={actionLoading}
                        fullWidth
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Provider</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting {selectedProvider?.name}:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please explain why this provider application is being rejected..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Reject Provider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProviderApprovals;