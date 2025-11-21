import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
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
} from '@mui/material';
import {
  PregnantWoman,
  Timeline,
  Warning,
  Add,
  TrendingUp,
  CalendarToday,
  AccessTime,
  Chat,
  Message,
  MedicalServices,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MobileAppPromotion from '../../components/common/MobileAppPromotion';
import ElsaChatbot from '../../components/common/ElsaChatbot';
import CompressedTimeline from '../../components/common/CompressedTimeline';
import AppointmentBooking from '../../components/appointments/AppointmentBooking';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientOverviewPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [kickData, setKickData] = useState({
    count: '',
    duration: '',
    position: 'sitting',
    intensity: 'medium',
    notes: '',
  });
  const [emergencyData, setEmergencyData] = useState({
    type: 'pain',
    description: '',
  });
  const [messageData, setMessageData] = useState({
    content: '',
  });

  // Mock data - replace with API calls
  const patientData = {
    name: 'Mary Wanjiku',
    pregnancyWeek: 28,
    dueDate: '2024-03-15',
    lastCheckup: '2024-01-10',
    nextAppointment: '2024-01-24',
    riskLevel: 'low' as const,
  };

  const kickChartData = [
    { date: 'Jan 8', kicks: 8 },
    { date: 'Jan 9', kicks: 10 },
    { date: 'Jan 10', kicks: 7 },
    { date: 'Jan 11', kicks: 12 },
    { date: 'Jan 12', kicks: 9 },
    { date: 'Jan 13', kicks: 11 },
    { date: 'Jan 14', kicks: 8 },
  ];

  const recentSessions = [
    { date: '2024-01-14', count: 8, duration: 12, position: 'sitting', intensity: 'medium' },
    { date: '2024-01-13', count: 10, duration: 15, position: 'lying', intensity: 'low' },
    { date: '2024-01-12', count: 7, duration: 10, position: 'standing', intensity: 'high' },
  ];

  const prescriptions = [
    {
      id: '1',
      doctorId: 'doc1',
      medications: [
        { id: 'med1', name: 'Prenatal Vitamins', dosage: '1 tablet', frequency: 'Once daily', duration: 90, instructions: 'Take with food' },
        { id: 'med2', name: 'Iron Supplement', dosage: '65mg', frequency: 'Once daily', duration: 90, instructions: 'Take on empty stomach' },
      ],
      diagnosis: 'Routine prenatal care',
      status: 'active' as const,
      createdAt: '2024-01-10T10:00:00Z',
      validUntil: '2024-04-10T10:00:00Z',
    },
  ];

  const handleRecordKick = () => {
    // Mock API call
    console.log('Recording kick session:', kickData);
    setKickDialogOpen(false);
    setKickData({ count: '', duration: '', position: 'sitting', intensity: 'medium', notes: '' });
  };

  const handleEmergencyAlert = () => {
    // Mock API call
    console.log('Sending emergency alert:', emergencyData);
    setEmergencyDialogOpen(false);
    setEmergencyData({ type: 'pain', description: '' });
  };

  const handleSendMessage = () => {
    // Mock API call
    console.log('Sending message to doctor:', messageData);
    setMessageDialogOpen(false);
    setMessageData({ content: '' });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome, {patientData.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your pregnancy journey and fetal movements
          </Typography>
        </Box>
        <Chip
          label={`Week ${patientData.pregnancyWeek}`}
          color="primary"
          variant="outlined"
          icon={<PregnantWoman />}
        />
      </Box>

      {/* Mobile App Promotion */}
      <MobileAppPromotion />

      {/* Compressed Timeline */}
      <CompressedTimeline
        patientData={{
          id: '1',
          name: patientData.name,
          pregnancyWeek: patientData.pregnancyWeek,
          dueDate: patientData.dueDate,
          riskLevel: patientData.riskLevel,
          kickSessions: recentSessions.map((session, index) => ({
            id: (index + 1).toString(),
            patientId: '1',
            date: session.date,
            duration: session.duration,
            kickCount: session.count,
            position: session.position as 'sitting' | 'lying' | 'standing',
            intensity: session.intensity as 'low' | 'medium' | 'high',
            notes: '',
          })),
        }}
      />

      {/* Quick Stats */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Card sx={{ flex: '1 1 250px' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {patientData.pregnancyWeek}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weeks Pregnant
                </Typography>
              </Box>
              <PregnantWoman sx={{ color: 'primary.main', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {new Date(patientData.dueDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
              </Box>
              <CalendarToday sx={{ color: 'success.main', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {recentSessions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kick Sessions
                </Typography>
              </Box>
              <Timeline sx={{ color: 'info.main', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color={getRiskColor(patientData.riskLevel) + '.main'}>
                  {patientData.riskLevel.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Risk Level
                </Typography>
              </Box>
              <Warning sx={{ color: getRiskColor(patientData.riskLevel) + '.main', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {prescriptions.filter(p => p.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Prescriptions
                </Typography>
              </Box>
              <MedicalServices sx={{ color: 'success.main', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Warning />}
            onClick={() => setEmergencyDialogOpen(true)}
          >
            Emergency Alert
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={() => setAppointmentDialogOpen(true)}
          >
            Schedule Appointment
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
          >
            View Full History
          </Button>
          <Button
            variant="outlined"
            startIcon={<Message />}
            onClick={() => setMessageDialogOpen(true)}
          >
            Message Doctor
          </Button>
          <Button
            variant="contained"
            startIcon={<Chat />}
            onClick={() => setChatbotOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)' },
            }}
          >
            Chat with Elsa
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {/* Kick Chart */}
        <Box flex={2}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Fetal Kick Count Trend
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setKickDialogOpen(true)}
              >
                Record Kick Session
              </Button>
            </Box>

            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kickChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="kicks" stroke="#0A8D92" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>

        {/* Recent Sessions & Actions */}
        <Box flex={1}>
          {/* Recent Sessions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Sessions
            </Typography>
            {recentSessions.slice(0, 3).map((session, index) => (
              <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 2 ? '1px solid #eee' : 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {new Date(session.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.count} kicks in {session.duration} minutes
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip label={session.position} size="small" variant="outlined" />
                  <Chip
                    label={session.intensity}
                    size="small"
                    color={session.intensity === 'low' ? 'success' : session.intensity === 'medium' ? 'warning' : 'error'}
                  />
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Current Prescriptions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Current Prescriptions
            </Typography>
            {prescriptions.filter(p => p.status === 'active').slice(0, 2).map((prescription, index) => (
              <Box key={prescription.id} sx={{ mb: 2, pb: 2, borderBottom: index < 1 ? '1px solid #eee' : 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {prescription.diagnosis}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {prescription.medications.length} medication{prescription.medications.length > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Valid until: {new Date(prescription.validUntil).toLocaleDateString()}
                </Typography>
                <Box mt={1}>
                  {prescription.medications.slice(0, 2).map((med, medIndex) => (
                    <Chip
                      key={med.id}
                      label={`${med.name} - ${med.dosage}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                  {prescription.medications.length > 2 && (
                    <Chip
                      label={`+${prescription.medications.length - 2} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            ))}
            {prescriptions.filter(p => p.status === 'active').length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No active prescriptions
              </Typography>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Warning />}
              sx={{ mb: 2 }}
              onClick={() => setEmergencyDialogOpen(true)}
            >
              Emergency Alert
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarToday />}
              sx={{ mb: 2 }}
              onClick={() => setAppointmentDialogOpen(true)}
            >
              Schedule Appointment
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUp />}
              sx={{ mb: 2 }}
            >
              View Full History
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Message />}
              sx={{ mb: 2 }}
              onClick={() => setMessageDialogOpen(true)}
            >
              Message Doctor
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Chat />}
              onClick={() => setChatbotOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)' },
              }}
            >
              Chat with Elsa
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Record Kick Session Dialog */}
      <Dialog open={kickDialogOpen} onClose={() => setKickDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Fetal Kick Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Number of Kicks"
            type="number"
            value={kickData.count}
            onChange={(e) => setKickData({ ...kickData, count: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={kickData.duration}
            onChange={(e) => setKickData({ ...kickData, duration: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Position</InputLabel>
            <Select
              value={kickData.position}
              onChange={(e) => setKickData({ ...kickData, position: e.target.value })}
              label="Position"
            >
              <MenuItem value="sitting">Sitting</MenuItem>
              <MenuItem value="lying">Lying Down</MenuItem>
              <MenuItem value="standing">Standing</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Intensity</InputLabel>
            <Select
              value={kickData.intensity}
              onChange={(e) => setKickData({ ...kickData, intensity: e.target.value })}
              label="Intensity"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={kickData.notes}
            onChange={(e) => setKickData({ ...kickData, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKickDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordKick} variant="contained">
            Record Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Alert Dialog */}
      <Dialog open={emergencyDialogOpen} onClose={() => setEmergencyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Emergency Alert
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will send an immediate alert to your healthcare provider. Use only for genuine emergencies.
          </Alert>
          <FormControl fullWidth margin="normal">
            <InputLabel>Emergency Type</InputLabel>
            <Select
              value={emergencyData.type}
              onChange={(e) => setEmergencyData({ ...emergencyData, type: e.target.value })}
              label="Emergency Type"
            >
              <MenuItem value="pain">Severe Pain</MenuItem>
              <MenuItem value="bleeding">Bleeding</MenuItem>
              <MenuItem value="reduced_movement">Reduced Fetal Movement</MenuItem>
              <MenuItem value="other">Other Emergency</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={emergencyData.description}
            onChange={(e) => setEmergencyData({ ...emergencyData, description: e.target.value })}
            margin="normal"
            required
            placeholder="Please describe your emergency situation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEmergencyAlert} variant="contained" color="error">
            Send Emergency Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Doctor Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Message Your Doctor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={messageData.content}
            onChange={(e) => setMessageData({ content: e.target.value })}
            margin="normal"
            required
            placeholder="Type your message to your healthcare provider..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained" disabled={!messageData.content.trim()}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Elsa Chatbot */}
      <ElsaChatbot
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />

      {/* Appointment Booking */}
      <AppointmentBooking
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        patientId="1" // Mock patient ID - replace with actual user ID
      />
    </Box>
  );
};

export default PatientOverviewPage;