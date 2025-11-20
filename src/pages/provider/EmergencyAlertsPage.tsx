import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Warning,
  Phone,
  LocationOn,
  CheckCircle,
  Notifications,
} from '@mui/icons-material';

const EmergencyAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      patientId: '1',
      patientName: 'Mary Wanjiku',
      type: 'reduced_movement' as const,
      severity: 'high' as const,
      timestamp: '2024-01-10T14:30:00Z',
      status: 'active' as const,
      location: 'Nairobi, Kenya',
      description: 'Patient reported significantly reduced fetal movement over the last 24 hours.',
    },
    {
      id: '2',
      patientId: '2',
      patientName: 'Sarah Omondi',
      type: 'pain' as const,
      severity: 'medium' as const,
      timestamp: '2024-01-09T16:45:00Z',
      status: 'active' as const,
      location: 'Kisumu, Kenya',
      description: 'Patient experiencing severe abdominal pain and discomfort.',
    },
    {
      id: '3',
      patientId: '3',
      patientName: 'Grace Kiprop',
      type: 'bleeding' as const,
      severity: 'high' as const,
      timestamp: '2024-01-08T09:15:00Z',
      status: 'resolved' as const,
      location: 'Eldoret, Kenya',
      description: 'Patient reported vaginal bleeding. Immediate medical attention required.',
    },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reduced_movement': return <Warning />;
      case 'pain': return <Warning />;
      case 'bleeding': return <Warning />;
      default: return <Notifications />;
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      ) as typeof prevAlerts
    );
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Emergency Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and respond to critical patient alerts
          </Typography>
        </Box>
        <Chip
          label={`${activeAlerts.length} Active`}
          color="error"
          variant="filled"
        />
      </Box>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} color="error">
            Active Alerts ({activeAlerts.length})
          </Typography>
          {activeAlerts.map((alert) => (
            <Paper key={alert.id} sx={{ p: 3, mb: 2, border: '2px solid', borderColor: 'error.main' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                    {getTypeIcon(alert.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {alert.patientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Chip
                    label={alert.severity.toUpperCase()}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                  />
                </Box>
              </Box>

              <Typography variant="body1" mb={2}>
                {alert.description}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {alert.location}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Phone />}
                  sx={{ flex: 1 }}
                >
                  Call Patient
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleResolveAlert(alert.id)}
                >
                  Mark Resolved
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Resolved Alerts ({resolvedAlerts.length})
          </Typography>
          {resolvedAlerts.map((alert) => (
            <Paper key={alert.id} sx={{ p: 3, mb: 2, opacity: 0.7 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {alert.patientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.type.replace('_', ' ').toUpperCase()} - RESOLVED
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="RESOLVED"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Resolved on {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {activeAlerts.length === 0 && resolvedAlerts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No emergency alerts at this time.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EmergencyAlertsPage;