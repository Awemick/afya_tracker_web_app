import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Referral, ReferralResponse, Institution, Patient } from '../../types';
import { referralAPI } from '../../services/api';
import {
  fetchReferralsStart,
  fetchReferralsSuccess,
  fetchReferralsFailure,
  createReferralStart,
  createReferralSuccess,
  createReferralFailure,
  updateReferralStart,
  updateReferralSuccess,
  updateReferralFailure,
  selectReferral,
  clearSelectedReferral,
} from '../../store/slices/referralsSlice';
import { RootState } from '../../store/store';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'accepted': return 'info';
    case 'completed': return 'success';
    case 'rejected': return 'error';
    case 'cancelled': return 'default';
    default: return 'default';
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'emergency': return 'error';
    case 'urgent': return 'warning';
    case 'routine': return 'info';
    default: return 'default';
  }
};

interface ReferralSystemProps {
  userId: string;
  userRole: 'patient' | 'provider';
  patientId?: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({
  userId,
  userRole,
  patientId,
}) => {
  const dispatch = useDispatch();
  const { referrals, selectedReferral, loading, error } = useSelector(
    (state: RootState) => state.referrals
  );

  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [referralForm, setReferralForm] = useState({
    patientId: patientId || '',
    specialty: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
    reason: '',
    clinicalNotes: '',
    patientConsent: false,
  });

  const [responseForm, setResponseForm] = useState({
    response: 'accept' as 'accept' | 'reject' | 'transfer',
    notes: '',
  });

  useEffect(() => {
    loadReferrals();
  }, [userId, userRole]);

  const loadReferrals = async () => {
    try {
      dispatch(fetchReferralsStart());
      const response = await referralAPI.getReferrals(userId, userRole);
      dispatch(fetchReferralsSuccess(response.data));
    } catch (error) {
      dispatch(fetchReferralsFailure('Failed to load referrals'));
    }
  };

  const handleCreateReferral = async () => {
    try {
      dispatch(createReferralStart());
      const referralData = {
        ...referralForm,
        referringDoctorId: userId,
        referringInstitutionId: 'current-institution', // This should come from context
        receivingInstitutionId: 'target-institution', // This should be selected
      };
      const response = await referralAPI.createReferral(referralData);
      dispatch(createReferralSuccess(response.data));
      setCreateDialogOpen(false);
      setSnackbar({ open: true, message: 'Referral created successfully', severity: 'success' });
      resetReferralForm();
    } catch (error) {
      dispatch(createReferralFailure('Failed to create referral'));
      setSnackbar({ open: true, message: 'Failed to create referral', severity: 'error' });
    }
  };

  const handleRespondToReferral = async () => {
    if (!selectedReferral) return;

    try {
      dispatch(updateReferralStart());
      if (responseForm.response === 'accept') {
        await referralAPI.acceptReferral(selectedReferral.id, userId, responseForm.notes);
      } else if (responseForm.response === 'reject') {
        await referralAPI.rejectReferral(selectedReferral.id, userId, responseForm.notes);
      }
      // Update local state
      const updatedReferral = { ...selectedReferral, status: (responseForm.response === 'accept' ? 'accepted' : 'rejected') as 'accepted' | 'rejected' };
      dispatch(updateReferralSuccess(updatedReferral));
      setResponseDialogOpen(false);
      setSnackbar({ open: true, message: 'Response sent successfully', severity: 'success' });
    } catch (error) {
      dispatch(updateReferralFailure('Failed to respond to referral'));
      setSnackbar({ open: true, message: 'Failed to send response', severity: 'error' });
    }
  };

  const resetReferralForm = () => {
    setReferralForm({
      patientId: patientId || '',
      specialty: '',
      urgency: 'routine',
      reason: '',
      clinicalNotes: '',
      patientConsent: false,
    });
  };

  const activeReferrals = referrals.filter(r => r.status === 'pending' || r.status === 'accepted');
  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled');

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          <MedicalServicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Referral System
        </Typography>
        {userRole === 'provider' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Referral
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Active (${activeReferrals.length})`} />
          <Tab label={`Completed (${completedReferrals.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <List>
              {activeReferrals.map((referral) => (
                <ListItem key={referral.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{referral.specialty}</Typography>
                        <Chip
                          label={referral.status.toUpperCase()}
                          color={getStatusColor(referral.status) as any}
                          size="small"
                        />
                        <Chip
                          label={referral.urgency.toUpperCase()}
                          color={getUrgencyColor(referral.urgency) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{referral.reason}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(referral.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {userRole === 'provider' && referral.status === 'pending' && (
                      <Button
                        size="small"
                        onClick={() => {
                          dispatch(selectReferral(referral));
                          setResponseDialogOpen(true);
                        }}
                      >
                        Respond
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {activeReferrals.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No active referrals
                </Typography>
              )}
            </List>
          )}

          {tabValue === 1 && (
            <List>
              {completedReferrals.map((referral) => (
                <ListItem key={referral.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{referral.specialty}</Typography>
                        <Chip
                          label={referral.status.toUpperCase()}
                          color={getStatusColor(referral.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{referral.reason}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completed: {referral.completedAt ? new Date(referral.completedAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {completedReferrals.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No completed referrals
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Paper>

      {/* Create Referral Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Referral</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Patient ID"
              value={referralForm.patientId}
              onChange={(e) => setReferralForm({ ...referralForm, patientId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Specialty"
              value={referralForm.specialty}
              onChange={(e) => setReferralForm({ ...referralForm, specialty: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={referralForm.urgency}
                onChange={(e) => setReferralForm({ ...referralForm, urgency: e.target.value as any })}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Reason for Referral"
              multiline
              rows={3}
              value={referralForm.reason}
              onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Clinical Notes"
              multiline
              rows={3}
              value={referralForm.clinicalNotes}
              onChange={(e) => setReferralForm({ ...referralForm, clinicalNotes: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={referralForm.patientConsent}
                  onChange={(e) => setReferralForm({ ...referralForm, patientConsent: e.target.checked })}
                />
              }
              label="Patient has given consent for data sharing"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateReferral} variant="contained">Create Referral</Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Referral</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Response</InputLabel>
              <Select
                value={responseForm.response}
                onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value as any })}
              >
                <MenuItem value="accept">Accept</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Response Notes"
              multiline
              rows={3}
              value={responseForm.notes}
              onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRespondToReferral} variant="contained">Send Response</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReferralSystem;