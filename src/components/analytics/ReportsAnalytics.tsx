import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import { RootState } from '../../store/store';
import {
  fetchAnalyticsStart,
  fetchAnalyticsSuccess,
  fetchAnalyticsFailure,
  fetchReportsStart,
  fetchReportsSuccess,
  fetchReportsFailure,
} from '../../store/slices/analyticsSlice';
import { analyticsAPI } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsAnalytics: React.FC = () => {
  const dispatch = useDispatch();
  const {
    analyticsData,
    reports,
    loading,
    error,
  } = useSelector((state: RootState) => state.analytics);

  const [activeTab, setActiveTab] = useState(0);

  // Mock institution ID - in real app, get from auth context
  const institutionId = 'mock-institution-id';

  useEffect(() => {
    loadAnalyticsData();
    loadReports();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      dispatch(fetchAnalyticsStart());
      const response = await analyticsAPI.getAnalyticsData(institutionId);
      dispatch(fetchAnalyticsSuccess(response.data));
    } catch (err) {
      dispatch(fetchAnalyticsFailure('Failed to load analytics data'));
    }
  };

  const loadReports = async () => {
    try {
      dispatch(fetchReportsStart());
      const response = await analyticsAPI.getReports(institutionId);
      dispatch(fetchReportsSuccess(response.data));
    } catch (err) {
      dispatch(fetchReportsFailure('Failed to load reports'));
    }
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export logic
    console.log('Exporting CSV...');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export logic
    console.log('Exporting PDF...');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="Reports" />
          <Tab label="Analytics Data" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {/* Dashboard Tab */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Key Metrics Cards */}
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">Total Patients</Typography>
              <Typography variant="h4">
                {analyticsData.filter((d: any) => d.metricType === 'patients').reduce((sum: number, d: any) => sum + d.value, 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">Consultations</Typography>
              <Typography variant="h4">
                {analyticsData.filter((d: any) => d.metricType === 'consultations').reduce((sum: number, d: any) => sum + d.value, 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">Appointments</Typography>
              <Typography variant="h4">
                {analyticsData.filter((d: any) => d.metricType === 'appointments').reduce((sum: number, d: any) => sum + d.value, 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">Alerts</Typography>
              <Typography variant="h4">
                {analyticsData.filter((d: any) => d.metricType === 'alerts').reduce((sum: number, d: any) => sum + d.value, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Reports Tab */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ mr: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Generated At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>{report.generatedAt?.toDate?.()?.toLocaleDateString() || report.generatedAt}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={
                          report.status === 'completed' ? 'success' :
                          report.status === 'generating' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Analytics Data Tab */}
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Metric Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Metadata</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.map((data: any) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.date?.toDate?.()?.toLocaleDateString() || data.date}</TableCell>
                    <TableCell>{data.metricType}</TableCell>
                    <TableCell>{data.value}</TableCell>
                    <TableCell>{JSON.stringify(data.metadata)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
    </Box>
  );
};

export default ReportsAnalytics;