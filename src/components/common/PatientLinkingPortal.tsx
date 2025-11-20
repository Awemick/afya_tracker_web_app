import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  QrCode,
  Link as LinkIcon,
  Settings,
  Delete,
  CheckCircle,
  Cancel,
  Schedule,
  Block,
  Share,
  ContentCopy,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from 'qrcode';
import { PatientLink, LinkPermissions } from '../../types';
import { patientLinksAPI } from '../../services/api';
import {
  fetchLinksStart,
  fetchLinksSuccess,
  fetchLinksFailure,
  createLink,
  updateLink,
  deleteLink,
  selectLink,
} from '../../store/slices/patientLinksSlice';
import { RootState } from '../../store/store';

interface PatientLinkingPortalProps {
  userId: string;
  userRole: 'patient' | 'provider' | 'admin';
  institutionId?: string;
}

const PatientLinkingPortal: React.FC<PatientLinkingPortalProps> = ({
  userId,
  userRole,
  institutionId,
}) => {
  const dispatch = useDispatch();
  const { links, loading, error, selectedLink } = useSelector(
    (state: RootState) => state.patientLinks
  );

  const [activeTab, setActiveTab] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [linkCodeInput, setLinkCodeInput] = useState<string>('');
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<LinkPermissions>({
    viewRecords: false,
    createConsultations: false,
    managePrescriptions: false,
    sendNotifications: false,
    shareData: false,
  });
  const [generatingQR, setGeneratingQR] = useState(false);
  const [linkingPatient, setLinkingPatient] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadLinks();
  }, [userId, userRole, institutionId]);

  const loadLinks = async () => {
    dispatch(fetchLinksStart());
    try {
      let response;
      if (userRole === 'patient') {
        response = await patientLinksAPI.getPatientLinks(userId);
      } else if (institutionId) {
        response = await patientLinksAPI.getInstitutionLinks(institutionId);
      }
      if (response?.data) {
        dispatch(fetchLinksSuccess(response.data));
      }
    } catch (err) {
      dispatch(fetchLinksFailure('Failed to load links'));
    }
  };

  const generateQRCode = async () => {
    if (!institutionId) return;

    setGeneratingQR(true);
    try {
      const response = await patientLinksAPI.generateQRCode(institutionId);
      if (response?.data?.linkCode) {
        const qrData = `afya-link:${response.data.linkCode}`;
        const url = await QRCode.toDataURL(qrData);
        setQrCodeUrl(url);
        setReferralCode(response.data.linkCode);
        loadLinks(); // Refresh links
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const generateReferralCode = async () => {
    if (!institutionId) return;

    try {
      const response = await patientLinksAPI.generateReferralCode(institutionId, userId);
      if (response?.data?.linkCode) {
        setReferralCode(response.data.linkCode);
        loadLinks(); // Refresh links
      }
    } catch (err) {
      console.error('Failed to generate referral code:', err);
    }
  };

  const linkPatient = async () => {
    if (!linkCodeInput.trim()) return;

    setLinkingPatient(true);
    try {
      const response = await patientLinksAPI.validateAndLink(linkCodeInput, userId);
      if (response?.data) {
        dispatch(createLink(response.data));
        setLinkCodeInput('');
        loadLinks(); // Refresh links
      }
    } catch (err) {
      console.error('Failed to link patient:', err);
    } finally {
      setLinkingPatient(false);
    }
  };

  const updateLinkPermissions = async (linkId: string, permissions: LinkPermissions) => {
    try {
      const response = await patientLinksAPI.updateLink(linkId, { permissions });
      if (response?.data) {
        dispatch(updateLink(response.data));
      }
    } catch (err) {
      console.error('Failed to update permissions:', err);
    }
    setPermissionsDialog(false);
  };

  const revokeLink = async (linkId: string) => {
    try {
      await patientLinksAPI.deleteLink(linkId);
      dispatch(deleteLink(linkId));
    } catch (err) {
      console.error('Failed to revoke link:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'default';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'inactive': return <Cancel />;
      case 'revoked': return <Block />;
      default: return <Cancel />;
    }
  };

  const renderInstitutionView = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Generate Patient Linking Codes
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <QrCode sx={{ mr: 1, verticalAlign: 'middle' }} />
                QR Code Generation
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generate a QR code that patients can scan to link with your institution.
              </Typography>
              <Button
                variant="contained"
                onClick={generateQRCode}
                disabled={generatingQR}
                fullWidth
                sx={{ mt: 2 }}
              >
                {generatingQR ? <CircularProgress size={20} /> : 'Generate QR Code'}
              </Button>
              {qrCodeUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '200px' }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Code: {referralCode}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(referralCode)}
                    startIcon={<ContentCopy />}
                    sx={{ mt: 1 }}
                  >
                    Copy Code
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Referral Code Generation
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generate a referral code that can be shared with patients.
              </Typography>
              <Button
                variant="outlined"
                onClick={generateReferralCode}
                fullWidth
                sx={{ mt: 2 }}
              >
                Generate Referral Code
              </Button>
              {referralCode && !qrCodeUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="h6">{referralCode}</Typography>
                  </Paper>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(referralCode)}
                    startIcon={<ContentCopy />}
                    sx={{ mt: 1 }}
                  >
                    Copy Code
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Active Links ({links.filter(link => link.status === 'active').length})
        </Typography>
        <List>
          {links.filter(link => link.status === 'active').map((link) => (
            <ListItem key={link.id}>
              <ListItemText
                primary={`Patient ID: ${link.patientId}`}
                secondary={`Linked: ${new Date(link.linkedAt).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => {
                    setCurrentPermissions(link.permissions);
                    dispatch(selectLink(link));
                    setPermissionsDialog(true);
                  }}
                >
                  <Settings />
                </IconButton>
                <IconButton onClick={() => revokeLink(link.id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  const renderPatientView = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Link to Healthcare Facilities
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Enter Linking Code
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter a QR code or referral code from a healthcare facility to link your account.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Linking Code"
              value={linkCodeInput}
              onChange={(e) => setLinkCodeInput(e.target.value)}
              placeholder="Enter code here..."
            />
            <Button
              variant="contained"
              onClick={linkPatient}
              disabled={linkingPatient || !linkCodeInput.trim()}
            >
              {linkingPatient ? <CircularProgress size={20} /> : 'Link'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Your Linked Facilities ({links.length})
      </Typography>
      <List>
        {links.map((link) => (
          <ListItem key={link.id}>
            <ListItemText
              primary={`Institution ID: ${link.institutionId}`}
              secondary={
                <Box>
                  <Typography variant="body2">
                    Status: <Chip
                      size="small"
                      label={link.status}
                      color={getStatusColor(link.status)}
                      icon={getStatusIcon(link.status)}
                    />
                  </Typography>
                  <Typography variant="body2">
                    Linked: {new Date(link.linkedAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Permissions: {Object.entries(link.permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                      .join(', ') || 'None'}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              {link.status === 'active' && (
                <IconButton onClick={() => revokeLink(link.id)}>
                  <Delete />
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {userRole !== 'patient' ? (
        renderInstitutionView()
      ) : (
        renderPatientView()
      )}

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialog} onClose={() => setPermissionsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Link Permissions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Control what this facility can access in your health records.
          </Typography>
          <Box sx={{ mt: 2 }}>
            {Object.entries(currentPermissions).map(([key, value]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => setCurrentPermissions(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                }
                label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog(false)}>Cancel</Button>
          <Button
            onClick={() => selectedLink && updateLinkPermissions(selectedLink.id, currentPermissions)}
            variant="contained"
          >
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientLinkingPortal;