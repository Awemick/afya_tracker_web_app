import React from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  CircularProgress,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  PregnantWoman,
  Timeline,
  Warning,
  BabyChangingStation,
  EmojiEvents,
  WavingHand,
  TrendingUp,
  CalendarToday,
  Chat,
  Message,
  MedicalServices,
  Assignment,
  Search,
} from '@mui/icons-material';
import MobileAppPromotion from '../../components/common/MobileAppPromotion';
import ElsaChatbot from '../../components/common/ElsaChatbot';
import AppointmentBooking from '../../components/appointments/AppointmentBooking';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchUserSubscription } from '../../store/slices/subscriptionSlice';
import { hybridPaymentService, PaymentMethod } from '../../services/hybridPaymentService';

const PatientDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentSubscription, loading: subscriptionLoading } = useSelector((state: RootState) => state.subscription);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [kickData, setKickData] = useState({
    count: '',
    duration: '',
    position: 'sitting',
    intensity: 'medium',
    notes: '',
  });
  const [tapCount, setTapCount] = useState(0);
  const [emergencyData, setEmergencyData] = useState({
    type: 'pain',
    description: '',
  });
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageData, setMessageData] = useState({
    content: '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchUserSubscription() as any);
    }
  }, [user, dispatch]);

  interface Activity {
    time: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    timestamp: Date;
  }

  // Mock data - replace with API calls
  const patientData = {
    name: 'Mary Wanjiku',
    pregnancyWeek: 28,
    dueDate: '2024-03-15',
  };

  const recentSessions = [
    { date: '2024-01-14', count: 8, duration: 12, position: 'sitting', intensity: 'medium' },
    { date: '2024-01-13', count: 10, duration: 15, position: 'lying', intensity: 'low' },
    { date: '2024-01-12', count: 7, duration: 10, position: 'standing', intensity: 'high' },
  ];

  const todayKicks = recentSessions.reduce((sum, session) => sum + session.count, 0);
  const goals = [{ title: 'Daily Kick Count', current: todayKicks, target: 10, unit: 'kicks', isCompleted: todayKicks >= 10 }];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getComparisonText = (todayKicks: number) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKicks = 6; // Mock data
    const difference = todayKicks - yesterdayKicks;
    if (difference > 0) return `+${difference} vs yesterday`;
    if (difference < 0) return `${difference} vs yesterday`;
    return 'Same as yesterday';
  };

  const getRecentActivities = (): Activity[] => {
    const activities: Activity[] = [];
    // Add kick sessions
    recentSessions.slice(0, 3).forEach((session, index) => {
      activities.push({
        time: new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: 'Kick session recorded',
        subtitle: `${session.count} kicks in ${session.duration} minutes`,
        icon: BabyChangingStation,
        color: '#FFB6C1',
        timestamp: new Date(session.date),
      });
    });
    // Add goal progress
    goals.forEach(goal => {
      activities.push({
        time: 'Recent',
        title: `${goal.title} progress`,
        subtitle: `${goal.current.toFixed(1)} / ${goal.target} ${goal.unit}`,
        icon: EmojiEvents,
        color: '#48BB78',
        timestamp: new Date(),
      });
    });

    // Filter activities based on search term
    const filteredActivities = searchTerm
      ? activities.filter(activity =>
          activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : activities;

    return filteredActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  };

  const handleRecordKick = () => {
    const finalCount = tapCount > 0 ? tapCount.toString() : kickData.count;
    console.log('Recording kick session:', { ...kickData, count: finalCount });
    setKickDialogOpen(false);
    setKickData({ count: '', duration: '', position: 'sitting', intensity: 'medium', notes: '' });
    setTapCount(0);
  };

  const handleEmergencyAlert = () => {
    console.log('Sending emergency alert:', emergencyData);
    setEmergencyDialogOpen(false);
    setEmergencyData({ type: 'pain', description: '' });
  };

  const handleSubscribe = async () => {
    if (!user?.email) return;

    const reference = `sub_${Date.now()}`;

    try {
      await hybridPaymentService.initiatePaystackPayment({
        amount: 30000, // KES 300 * 100
        email: user.email,
        reference,
        currency: 'KES',
        callback: async (response: any) => {
          if (response.status === 'success') {
            await hybridPaymentService.verifyPaystackPayment(reference);
            await hybridPaymentService.createSubscription({
              email: user.email,
              amount: 300,
              planName: 'premium',
              method: PaymentMethod.PAYSTACK,
            });
            dispatch(fetchUserSubscription() as any);
            setSubscriptionDialogOpen(false);
            // Show success message
          }
        },
        onClose: () => {
          console.log('Payment modal closed');
        },
      });
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  return (
    <Box sx={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Top App Bar */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {getGreeting()}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
              Hello Mama
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'primary.container',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/patient/profile')}
          >
            <WavingHand sx={{ color: 'primary.main' }} />
          </Avatar>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 2 }}>
        {/* Summary Card */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, #0A8D92 0%, #4FB3B7 100%)',
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            mb: 3
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {todayKicks}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  kicks today
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {getComparisonText(todayKicks)}
                </Typography>
              </Box>
              <Box>
                <CircularProgress
                  variant="determinate"
                  value={(todayKicks / 10) * 100}
                  size={80}
                  thickness={6}
                  sx={{
                    color: 'rgba(255,255,255,0.3)',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round((todayKicks / 10) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Premium Banner */}
        {!currentSubscription && !subscriptionLoading && (
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: 'white',
              borderRadius: 3,
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Upgrade to Premium
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    Unlock unlimited kick monitoring, AI insights, personalized meal plans, and more!
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      }
                    }}
                    onClick={() => setSubscriptionDialogOpen(true)}
                  >
                    Upgrade Now - KES 300/month
                  </Button>
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', opacity: 0.8 }}>
                    ⭐
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* Quick Stats */}
        <Box display="flex" gap={2} mb={3}>
          <Card sx={{ flex: 1, p: 2, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <PregnantWoman sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {patientData.pregnancyWeek}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Week
                </Typography>
              </Box>
            </Box>
          </Card>
          <Card sx={{ flex: 1, p: 2, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Timeline sx={{ color: 'secondary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  {recentSessions.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sessions
                </Typography>
              </Box>
            </Box>
          </Card>
          <Card sx={{ flex: 1, p: 2, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <EmojiEvents sx={{ color: 'tertiary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'tertiary.main' }}>
                  {goals.filter(g => g.isCompleted).length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Goals
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Quick Actions */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
          Quick Actions
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={2} mb={4}>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => setKickDialogOpen(true)}>
            <BabyChangingStation sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Record Kick
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => setEmergencyDialogOpen(true)}>
            <Warning sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Emergency
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => setChatbotOpen(true)}>
            <Chat sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Chat Elsa
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => navigate('/patient/timeline')}>
            <Timeline sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Timeline
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => navigate('/patient/tasks')}>
            <Assignment sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tasks
            </Typography>
          </Card>
          <Card sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2 }} onClick={() => navigate('/patient/appointments')}>
            <CalendarToday sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Appointments
            </Typography>
          </Card>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search activities, sessions, goals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        {/* Recent Activity */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
           Recent Activity
         </Typography>

        {getRecentActivities().length > 0 ? (
          getRecentActivities().map((activity, index) => (
            <Card key={index} sx={{ mb: 2, borderRadius: 2 }}>
              <Box sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: `${activity.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <activity.icon sx={{ color: activity.color, fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {activity.subtitle}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {activity.time}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))
        ) : (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Start tracking to see your progress here
            </Typography>
          </Card>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
          }
        }}
        onClick={() => setKickDialogOpen(true)}
      >
        <BabyChangingStation />
      </Fab>

      {/* Record Kick Session Dialog */}
      <Dialog open={kickDialogOpen} onClose={() => setKickDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Fetal Kick Session</DialogTitle>
        <DialogContent>
          {/* Tap Counter Section */}
          <Box sx={{ textAlign: 'center', mb: 3, p: 2, border: '2px dashed', borderColor: 'primary.main', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Tap to Count Kicks
            </Typography>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
              onClick={() => setTapCount(prev => prev + 1)}
            >
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {tapCount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setTapCount(0)}
                sx={{ minWidth: 60 }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setTapCount(prev => Math.max(0, prev - 1))}
                sx={{ minWidth: 60 }}
              >
                -1
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Or enter manually:
          </Typography>

          <TextField
            fullWidth
            label="Number of Kicks"
            type="number"
            value={tapCount > 0 ? tapCount.toString() : kickData.count}
            onChange={(e) => {
              const value = e.target.value;
              setTapCount(parseInt(value) || 0);
              setKickData({ ...kickData, count: value });
            }}
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

      {/* Elsa Chatbot */}
      <ElsaChatbot
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />

      {/* Premium Subscription Dialog */}
      <Dialog
        open={subscriptionDialogOpen}
        onClose={() => setSubscriptionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Upgrade to Premium
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Premium Plan - KES 300/month
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                'Unlimited kick monitoring trends',
                'Premium pregnancy insights',
                'Personalized meal plans by AI',
                'Unlimited Ask-Elsa AI questions',
                'Downloadable pregnancy reports',
                'Save emergency contacts',
                'Mood tracker + mental health tools',
                'Vaccination reminders',
                'Weekly doctor-reviewed tips',
              ].map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: 'primary.main' }}>✓</Typography>
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Cancel anytime. 7-day free trial available for new subscribers.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscriptionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubscribe}
            disabled={subscriptionLoading}
          >
            {subscriptionLoading ? <CircularProgress size={20} /> : 'Subscribe Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDashboard;