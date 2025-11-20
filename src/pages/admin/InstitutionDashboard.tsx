import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Grid,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Business,
  People,
  MedicalServices,
  TrendingUp,
  CalendarToday,
  Notifications,
  Edit,
  Add,
  Delete,
  Settings,
  Analytics,
  LocationOn,
  Link as LinkIcon,
  ExpandMore,
  Dashboard,
  Assessment,
  Security,
  Backup,
  CloudUpload,
  GetApp,
  Print,
  Email,
  Sms,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchInstitutionsStart,
  fetchInstitutionsSuccess,
  fetchInstitutionsFailure,
  fetchStaffStart,
  fetchStaffSuccess,
  fetchStaffFailure,
  selectInstitution,
  updateInstitution,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
} from '../../store/slices/institutionsSlice';
import { institutionAPI, staffAPI, patientAPI, appointmentAPI, alertAPI } from '../../services/api';
import { Institution, StaffMember } from '../../types';
import PatientLinkingPortal from '../../components/common/PatientLinkingPortal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const InstitutionDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { institutions, staff, selectedInstitution, loading, error } = useSelector(
    (state: RootState) => state.institutions
  );

  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: true,
    emailReports: false,
    smsAlerts: true,
    dataRetention: 365,
    securityLevel: 'high',
  });
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [createInstitutionDialogOpen, setCreateInstitutionDialogOpen] = useState(false);
  const [newInstitutionForm, setNewInstitutionForm] = useState<Partial<Institution>>({
    type: 'clinic',
    contactInfo: { phone: '', email: '', address: '' }
  });

  // Form states
  const [institutionForm, setInstitutionForm] = useState<Partial<Institution>>({});
  const [staffForm, setStaffForm] = useState<Partial<StaffMember>>({});

  useEffect(() => {
    if (user?.role === 'admin') {
      loadInstitutions();
      loadAnalytics();
      loadSystemHealth();
    }
  }, [user]);

  const loadInstitutions = async () => {
    try {
      dispatch(fetchInstitutionsStart());
      const response = await institutionAPI.getAll();
      dispatch(fetchInstitutionsSuccess(response.data));
    } catch (error) {
      dispatch(fetchInstitutionsFailure('Failed to load institutions'));
    }
  };

  const loadStaff = async (institutionId: string) => {
    try {
      dispatch(fetchStaffStart());
      const response = await staffAPI.getByInstitution(institutionId);
      dispatch(fetchStaffSuccess(response.data));
    } catch (error) {
      dispatch(fetchStaffFailure('Failed to load staff'));
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load analytics data from various APIs
      const [patientsRes, appointmentsRes, alertsRes] = await Promise.all([
        patientAPI.getAll(),
        appointmentAPI.getAppointments('', 'provider'), // Get all appointments
        alertAPI.getAll(),
      ]);

      // Calculate additional metrics
      const patients = patientsRes.data;
      const appointments = appointmentsRes.data;
      const alerts = alertsRes.data;

      const monthlyData = [
        { month: 'Jan', patients: 45, appointments: 120, alerts: 3 },
        { month: 'Feb', patients: 52, appointments: 135, alerts: 5 },
        { month: 'Mar', patients: 48, appointments: 142, alerts: 2 },
        { month: 'Apr', patients: 61, appointments: 158, alerts: 4 },
        { month: 'May', patients: 55, appointments: 145, alerts: 6 },
        { month: 'Jun', patients: 67, appointments: 165, alerts: 3 },
      ];

      const departmentStats = [
        { department: 'Maternity', patients: 156, staff: 12, utilization: 85 },
        { department: 'Pediatrics', patients: 89, staff: 8, utilization: 72 },
        { department: 'General Medicine', patients: 134, staff: 15, utilization: 78 },
        { department: 'Emergency', patients: 67, staff: 10, utilization: 92 },
      ];

      setAnalyticsData({
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        activeAlerts: alerts.filter((alert: any) => alert.status === 'active').length,
        totalInstitutions: institutions.length,
        totalStaff: staff.length,
        monthlyData,
        departmentStats,
        avgResponseTime: '2.3 hours',
        patientSatisfaction: 4.2,
        staffUtilization: 76,
        systemUptime: 99.8,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // Mock system health data
      setSystemHealth({
        database: { status: 'healthy', uptime: '99.9%', lastBackup: '2 hours ago' },
        api: { status: 'healthy', responseTime: '45ms', throughput: '1.2k req/min' },
        storage: { status: 'healthy', usage: '67%', available: '156GB' },
        security: { status: 'secure', lastScan: '1 hour ago', threats: 0 },
        ai: { status: 'operational', modelAccuracy: '89.7%', lastUpdate: '3 days ago' },
      });
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const handleInstitutionSelect = (institution: Institution) => {
    dispatch(selectInstitution(institution));
    loadStaff(institution.id);
  };

  const handleEditInstitution = () => {
    if (selectedInstitution) {
      setInstitutionForm(selectedInstitution);
      setEditDialogOpen(true);
    }
  };

  const handleSaveInstitution = async () => {
    if (selectedInstitution && institutionForm) {
      try {
        await institutionAPI.update(selectedInstitution.id, institutionForm);
        dispatch(updateInstitution(institutionForm as Institution));
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update institution:', error);
      }
    }
  };

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setStaffForm({
      institutionId: selectedInstitution?.id || '',
      role: 'doctor',
      department: '',
      permissions: [],
      status: 'active',
    });
    setStaffDialogOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setStaffForm(staffMember);
    setStaffDialogOpen(true);
  };

  const handleSaveStaff = async () => {
    if (staffForm) {
      try {
        if (selectedStaff) {
          await staffAPI.update(selectedStaff.id, staffForm);
          dispatch(updateStaffMember(staffForm as StaffMember));
        } else {
          const response = await staffAPI.create(staffForm);
          dispatch(addStaffMember(response.data));
        }
        setStaffDialogOpen(false);
      } catch (error) {
        console.error('Failed to save staff member:', error);
      }
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await staffAPI.delete(staffId);
        dispatch(removeStaffMember(staffId));
      } catch (error) {
        console.error('Failed to delete staff member:', error);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedStaffIds.length === 0) return;

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedStaffIds.length} staff members?`)) {
        try {
          await Promise.all(selectedStaffIds.map(id => staffAPI.delete(id)));
          selectedStaffIds.forEach(id => dispatch(removeStaffMember(id)));
          setSelectedStaffIds([]);
        } catch (error) {
          console.error('Failed to delete staff members:', error);
        }
      }
    } else if (action === 'activate') {
      try {
        await Promise.all(selectedStaffIds.map(id =>
          staffAPI.update(id, { status: 'active' })
        ));
        // Update local state
        selectedStaffIds.forEach(id => {
          const staffMember = staff.find((s: any) => s.id === id);
          if (staffMember) dispatch(updateStaffMember({ ...staffMember, status: 'active' }));
        });
        setSelectedStaffIds([]);
      } catch (error) {
        console.error('Failed to activate staff members:', error);
      }
    }
    setBulkActionDialogOpen(false);
  };

  const handleCreateInstitution = async () => {
    if (newInstitutionForm) {
      try {
        const response = await institutionAPI.create(newInstitutionForm);
        dispatch(fetchInstitutionsSuccess([...institutions, response.data]));
        setCreateInstitutionDialogOpen(false);
        setNewInstitutionForm({
          type: 'clinic',
          contactInfo: { phone: '', email: '', address: '' }
        });
      } catch (error) {
        console.error('Failed to create institution:', error);
      }
    }
  };

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Institution Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage healthcare facilities and monitor operations
      </Typography>

      {/* Analytics Overview */}
      {analyticsData && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ minWidth: 250, flex: 1 }}>
            <StatCard
              title="Total Institutions"
              value={analyticsData.totalInstitutions}
              icon={<Business sx={{ color: 'primary.main' }} />}
              color="primary.main"
            />
          </Box>
          <Box sx={{ minWidth: 250, flex: 1 }}>
            <StatCard
              title="Total Staff"
              value={analyticsData.totalStaff}
              icon={<People sx={{ color: 'info.main' }} />}
              color="info.main"
            />
          </Box>
          <Box sx={{ minWidth: 250, flex: 1 }}>
            <StatCard
              title="Total Patients"
              value={analyticsData.totalPatients}
              icon={<MedicalServices sx={{ color: 'success.main' }} />}
              color="success.main"
            />
          </Box>
          <Box sx={{ minWidth: 250, flex: 1 }}>
            <StatCard
              title="Active Alerts"
              value={analyticsData.activeAlerts}
              icon={<Notifications sx={{ color: 'error.main' }} />}
              color="error.main"
            />
          </Box>
        </Box>
      )}

      {/* Institution Selection */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Healthcare Institutions ({institutions.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateInstitutionDialogOpen(true)}
            >
              Create New Institution
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {institutions.map((institution) => (
              <Box sx={{ minWidth: 300, flex: '1 1 auto' }} key={institution.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedInstitution?.id === institution.id ? '2px solid' : '1px solid',
                    borderColor: selectedInstitution?.id === institution.id ? 'primary.main' : 'grey.300',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleInstitutionSelect(institution)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Business />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{institution.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {institution.type} • {institution.contactInfo?.address || 'No address'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={institution.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${staff.filter(s => s.institutionId === institution.id).length} staff`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Institution Details */}
      {selectedInstitution && (
        <Paper sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab icon={<Business />} label="Profile" />
              <Tab icon={<People />} label="Staff" />
              <Tab icon={<Analytics />} label="Analytics" />
              <Tab icon={<LinkIcon />} label="Patient Linking" />
              <Tab icon={<Settings />} label="Settings" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Institution Profile</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEditInstitution}
                >
                  Edit Profile
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ minWidth: 300, flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedInstitution.name}</Typography>
                  <Typography><strong>Type:</strong> {selectedInstitution.type}</Typography>
                  <Typography><strong>Description:</strong> {selectedInstitution.description}</Typography>
                </Box>
                <Box sx={{ minWidth: 300, flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Typography><strong>Phone:</strong> {selectedInstitution.contactInfo.phone}</Typography>
                  <Typography><strong>Email:</strong> {selectedInstitution.contactInfo.email}</Typography>
                  <Typography><strong>Address:</strong> {selectedInstitution.contactInfo.address}</Typography>
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Staff Management ({staff.length} members)</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {selectedStaffIds.length > 0 && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setBulkActionDialogOpen(true)}
                    >
                      Bulk Actions ({selectedStaffIds.length})
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddStaff}
                  >
                    Add Staff Member
                  </Button>
                </Box>
              </Box>

              {selectedStaffIds.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {selectedStaffIds.length} staff member{selectedStaffIds.length > 1 ? 's' : ''} selected
                </Alert>
              )}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.length === staff.length && staff.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds(staff.map(s => s.id));
                            } else {
                              setSelectedStaffIds([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Active</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id} selected={selectedStaffIds.includes(member.id)}>
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.includes(member.id)}
                            onChange={() => handleStaffSelection(member.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body1">{member.userId}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {member.id.slice(-8)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.role}
                            color={member.role === 'admin' ? 'primary' : member.role === 'doctor' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{member.department || 'Not assigned'}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.status}
                            color={member.status === 'active' ? 'success' : member.status === 'inactive' ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            2 hours ago
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditStaff(member)} size="small">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteStaff(member.id)} size="small">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {staff.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <People sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Staff Members
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Add your first staff member to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddStaff}
                  >
                    Add Staff Member
                  </Button>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Institution Analytics & Performance
              </Typography>

              {/* Key Performance Indicators */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {analyticsData?.patientSatisfaction || 4.2}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Patient Satisfaction
                          </Typography>
                        </Box>
                        <TrendingUp sx={{ color: 'success.main', fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {analyticsData?.staffUtilization || 76}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Staff Utilization
                          </Typography>
                        </Box>
                        <People sx={{ color: 'info.main', fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" color="warning.main" fontWeight="bold">
                            {analyticsData?.avgResponseTime || '2.3h'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Response Time
                          </Typography>
                        </Box>
                        <CalendarToday sx={{ color: 'warning.main', fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {analyticsData?.systemUptime || 99.8}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            System Uptime
                          </Typography>
                        </Box>
                        <Dashboard sx={{ color: 'primary.main', fontSize: 40 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Monthly Trends */}
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Trends (Last 6 Months)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">New Patients</TableCell>
                          <TableCell align="right">Appointments</TableCell>
                          <TableCell align="right">Alerts</TableCell>
                          <TableCell align="right">Growth</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData?.monthlyData?.map((row: any, index: number) => (
                          <TableRow key={row.month}>
                            <TableCell>{row.month}</TableCell>
                            <TableCell align="right">{row.patients}</TableCell>
                            <TableCell align="right">{row.appointments}</TableCell>
                            <TableCell align="right">{row.alerts}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${index > 0 ? ((row.patients - analyticsData.monthlyData[index-1].patients) / analyticsData.monthlyData[index-1].patients * 100).toFixed(1) : 0}%`}
                                color={index > 0 && row.patients > analyticsData.monthlyData[index-1].patients ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department Performance
                  </Typography>
                  <Grid container spacing={2}>
                    {analyticsData?.departmentStats?.map((dept: any) => (
                      <Grid item xs={12} md={6} key={dept.department}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="h6">{dept.department}</Typography>
                              <Chip
                                label={`${dept.utilization}%`}
                                color={dept.utilization > 80 ? 'success' : dept.utilization > 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Patients: {dept.patients} | Staff: {dept.staff}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={dept.utilization}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* System Health */}
              {systemHealth && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Health Status
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(systemHealth).map(([key, value]: [string, any]) => (
                        <Grid item xs={12} md={6} key={key}>
                          <Box display="flex" alignItems="center" gap={2}>
                            {value.status === 'healthy' || value.status === 'secure' || value.status === 'operational' ? (
                              <CheckCircle sx={{ color: 'success.main' }} />
                            ) : (
                              <Warning sx={{ color: 'warning.main' }} />
                            )}
                            <Box>
                              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {value.status === 'healthy' ? `Uptime: ${value.uptime}` :
                                 value.status === 'secure' ? `Last scan: ${value.lastScan}` :
                                 value.status === 'operational' ? `Accuracy: ${value.modelAccuracy}` :
                                 `Status: ${value.status}`}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <PatientLinkingPortal
              userId={user?.id || ''}
              userRole="admin"
              institutionId={selectedInstitution?.id}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Institution Settings & Configuration
              </Typography>

              <Grid container spacing={3}>
                {/* Notifications Settings */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notifications />
                        Notification Preferences
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.notifications}
                              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                            />
                          }
                          label="Enable System Notifications"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.emailReports}
                              onChange={(e) => setSettings({ ...settings, emailReports: e.target.checked })}
                            />
                          }
                          label="Email Weekly Reports"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.smsAlerts}
                              onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                            />
                          }
                          label="SMS Emergency Alerts"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Security Settings */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security />
                        Security & Access Control
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Security Level</InputLabel>
                          <Select
                            value={settings.securityLevel}
                            onChange={(e) => setSettings({ ...settings, securityLevel: e.target.value })}
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.autoBackup}
                              onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                            />
                          }
                          label="Automatic Data Backup"
                        />
                        <TextField
                          fullWidth
                          label="Data Retention (Days)"
                          type="number"
                          value={settings.dataRetention}
                          onChange={(e) => setSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Data Management */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Backup />
                        Data Management & Backup
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{ height: 56 }}
                          >
                            Manual Backup
                          </Button>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GetApp />}
                            sx={{ height: 56 }}
                          >
                            Export Data
                          </Button>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Assessment />}
                            sx={{ height: 56 }}
                          >
                            Generate Report
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Communication Settings */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Communication Channels
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>Email Templates</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            <ListItem>
                              <ListItemIcon><Email /></ListItemIcon>
                              <ListItemText
                                primary="Appointment Reminders"
                                secondary="Automated email reminders for upcoming appointments"
                              />
                              <Button size="small">Edit</Button>
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Email /></ListItemIcon>
                              <ListItemText
                                primary="Health Reports"
                                secondary="Weekly health summary reports for patients"
                              />
                              <Button size="small">Edit</Button>
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>SMS Templates</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            <ListItem>
                              <ListItemIcon><Sms /></ListItemIcon>
                              <ListItemText
                                primary="Emergency Alerts"
                                secondary="Critical health alerts and emergency notifications"
                              />
                              <Button size="small">Edit</Button>
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Sms /></ListItemIcon>
                              <ListItemText
                                primary="Appointment Confirmations"
                                secondary="SMS confirmations for scheduled appointments"
                              />
                              <Button size="small">Edit</Button>
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                  </Card>
                </Grid>

                {/* System Maintenance */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        System Maintenance
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Last system maintenance: 2 days ago | Next scheduled: Tomorrow at 2:00 AM
                        </Typography>
                      </Alert>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="outlined" startIcon={<Settings />}>
                          Run Maintenance
                        </Button>
                        <Button variant="outlined" startIcon={<Security />}>
                          Security Scan
                        </Button>
                        <Button variant="outlined" startIcon={<Assessment />}>
                          Performance Test
                        </Button>
                        <Button variant="outlined" startIcon={<Print />}>
                          System Logs
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Paper>
      )}

      {/* Edit Institution Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Institution</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={institutionForm.name || ''}
                onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={institutionForm.type || ''}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, type: e.target.value as any })}
                >
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="clinic">Clinic</MenuItem>
                  <MenuItem value="ngo">NGO</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={institutionForm.description || ''}
              onChange={(e) => setInstitutionForm({ ...institutionForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Phone"
                value={institutionForm.contactInfo?.phone || ''}
                onChange={(e) => setInstitutionForm({
                  ...institutionForm,
                  contactInfo: { ...institutionForm.contactInfo!, phone: e.target.value }
                })}
              />
              <TextField
                fullWidth
                label="Email"
                value={institutionForm.contactInfo?.email || ''}
                onChange={(e) => setInstitutionForm({
                  ...institutionForm,
                  contactInfo: { ...institutionForm.contactInfo!, email: e.target.value }
                })}
              />
            </Box>
            <TextField
              fullWidth
              label="Address"
              value={institutionForm.contactInfo?.address || ''}
              onChange={(e) => setInstitutionForm({
                ...institutionForm,
                contactInfo: { ...institutionForm.contactInfo!, address: e.target.value }
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveInstitution} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff Dialog */}
      <Dialog open={staffDialogOpen} onClose={() => setStaffDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="User ID"
              value={staffForm.userId || ''}
              onChange={(e) => setStaffForm({ ...staffForm, userId: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={staffForm.role || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Department"
                value={staffForm.department || ''}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={staffForm.status || ''}
                onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as any })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStaff} variant="contained">
            {selectedStaff ? 'Update' : 'Add'} Staff Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Perform action on {selectedStaffIds.length} selected staff member{selectedStaffIds.length > 1 ? 's' : ''}:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleBulkAction('activate')}
              fullWidth
            >
              Activate Selected Staff
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => handleBulkAction('delete')}
              fullWidth
            >
              Delete Selected Staff
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Create Institution Dialog */}
      <Dialog open={createInstitutionDialogOpen} onClose={() => setCreateInstitutionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Institution</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Institution Name"
                value={newInstitutionForm.name || ''}
                onChange={(e) => setNewInstitutionForm({ ...newInstitutionForm, name: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newInstitutionForm.type || 'clinic'}
                  onChange={(e) => setNewInstitutionForm({ ...newInstitutionForm, type: e.target.value as any })}
                >
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="clinic">Clinic</MenuItem>
                  <MenuItem value="ngo">NGO</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newInstitutionForm.description || ''}
              onChange={(e) => setNewInstitutionForm({ ...newInstitutionForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Phone"
                value={newInstitutionForm.contactInfo?.phone || ''}
                onChange={(e) => setNewInstitutionForm({
                  ...newInstitutionForm,
                  contactInfo: { ...newInstitutionForm.contactInfo!, phone: e.target.value }
                })}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newInstitutionForm.contactInfo?.email || ''}
                onChange={(e) => setNewInstitutionForm({
                  ...newInstitutionForm,
                  contactInfo: { ...newInstitutionForm.contactInfo!, email: e.target.value }
                })}
              />
            </Box>
            <TextField
              fullWidth
              label="Address"
              value={newInstitutionForm.contactInfo?.address || ''}
              onChange={(e) => setNewInstitutionForm({
                ...newInstitutionForm,
                contactInfo: { ...newInstitutionForm.contactInfo!, address: e.target.value }
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateInstitutionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateInstitution} variant="contained">
            Create Institution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutionDashboard;