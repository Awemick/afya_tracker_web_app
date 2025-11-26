import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  PhoneAndroid,
  TouchApp,
  Timeline,
  Info,
} from '@mui/icons-material';
import { fetalHealthService, FetalHealthAssessment, KickSession } from '../../services/fetalHealthService';
import { doc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface KickCounterProps {
  open: boolean;
  onClose: () => void;
  onSessionComplete?: (session: KickSession, assessment: FetalHealthAssessment) => void;
}

enum CountingMethod {
  countToTen = 'countToTen',
  fixedTime = 'fixedTime',
}

const KickCounter: React.FC<KickCounterProps> = ({
  open,
  onClose,
  onSessionComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<CountingMethod>(CountingMethod.countToTen);
  const [kickCount, setKickCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [targetDuration, setTargetDuration] = useState(60); // minutes
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phoneOnAbdomen, setPhoneOnAbdomen] = useState(false);
  const [useNewModel, setUseNewModel] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentSessions, setRecentSessions] = useState<KickSession[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecentSessions();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (isCounting && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCounting, startTime]);

  const loadRecentSessions = async () => {
    if (!auth?.currentUser) return;

    try {
      const q = query(
        collection(db!, 'kick_sessions'),
        where('userId', '==', auth!.currentUser!.uid),
        orderBy('date', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as KickSession[];

      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setIsCounting(true);
    setKickCount(0);
    setStartTime(new Date());
    setEndTime(null);
    setElapsedTime(0);
  };

  const recordKick = () => {
    if (!isCounting) return;

    setKickCount(prev => {
      const newCount = prev + 1;

      if (selectedMethod === CountingMethod.countToTen && newCount >= 10) {
        setEndTime(new Date());
      }

      return newCount;
    });
  };

  const submitSession = async () => {
    if (!startTime) return;

    const sessionEndTime = selectedMethod === CountingMethod.countToTen && endTime
      ? endTime
      : new Date();

    const duration = Math.floor((sessionEndTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes

    const session: KickSession = {
      id: Date.now().toString(),
      date: new Date(),
      count: kickCount,
      duration,
      method: selectedMethod,
      targetDuration: selectedMethod === CountingMethod.fixedTime ? targetDuration : undefined,
      analysisMethod: useNewModel ? 'new' : 'old',
      phoneOnAbdomen,
    };

    setIsAnalyzing(true);

    try {
      // Save session to Firestore
      await setDoc(doc(collection(db!, 'kick_sessions'), session.id), {
        ...session,
        userId: auth?.currentUser?.uid,
        date: session.date,
      });

      // Perform fetal health assessment
      const assessment = await fetalHealthService.assessFetalHealth(
        kickCount,
        duration,
        28, // default gestational week
        phoneOnAbdomen,
        useNewModel
      );

      // Reload recent sessions
      await loadRecentSessions();

      // Call callback if provided
      if (onSessionComplete) {
        onSessionComplete(session, assessment);
      }

      // Show results dialog
      showResultsDialog(session, assessment);

    } catch (error) {
      console.error('Error analyzing session:', error);
      // Show fallback results
      showFallbackResultsDialog(session);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showResultsDialog = (session: KickSession, assessment: FetalHealthAssessment) => {
    const statusColor = assessment.predictedClass === 0 ? '#48BB78' :
                       assessment.predictedClass === 1 ? '#FFA500' : '#FF6B6B';

    const statusIcon = assessment.predictedClass === 0 ? '✅' :
                      assessment.predictedClass === 1 ? '⚠️' : '🚨';

    // Create a simple dialog using window.alert for now
    const message = `
${statusIcon} Fetal Health Assessment Results

Session: ${session.count} kicks in ${session.duration} minutes
${phoneOnAbdomen ? '📱 Phone on abdomen: Yes' : '👋 Manual counting: Yes'}
Analysis Method: ${useNewModel ? 'AI Model' : 'Rule-based'}

Status: ${assessment.status}
Confidence: ${(assessment.confidence * 100).toFixed(1)}%

${assessment.message}

Recommendation:
${assessment.recommendation}
    `;

    window.alert(message);

    // Reset session
    resetSession();
  };

  const showFallbackResultsDialog = (session: KickSession) => {
    const message = `
Session Complete!

You counted ${session.count} kicks in ${session.duration} minutes.
${phoneOnAbdomen ? '📱 Phone on abdomen monitoring' : '👋 Manual kick counting'}

AI analysis is currently unavailable. Please consult your healthcare provider for proper assessment.
    `;

    window.alert(message);
    resetSession();
  };

  const resetSession = () => {
    setIsCounting(false);
    setKickCount(0);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
  };

  const cancelSession = () => {
    resetSession();
  };

  const getProgressValue = () => {
    if (selectedMethod === CountingMethod.countToTen) {
      return (kickCount / 10) * 100;
    } else {
      if (!startTime) return 0;
      const elapsedMinutes = elapsedTime / (1000 * 60);
      return Math.min((elapsedMinutes / targetDuration) * 100, 100);
    }
  };

  const canSubmit = () => {
    if (!isCounting || !startTime) return false;

    if (selectedMethod === CountingMethod.countToTen) {
      return kickCount >= 10;
    } else {
      const elapsedMinutes = elapsedTime / (1000 * 60);
      return elapsedMinutes >= targetDuration;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Fetal Kick Counter</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={phoneOnAbdomen}
                  onChange={(e) => setPhoneOnAbdomen(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PhoneAndroid fontSize="small" />
                  <Typography variant="body2">Phone on Abdomen</Typography>
                </Box>
              }
            />
            <Tooltip title="Place your phone directly on your abdomen for more accurate movement detection">
              <Info fontSize="small" color="action" />
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!isCounting ? (
          // Setup screen
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Choose Counting Method
                </Typography>

                <Box display="flex" gap={2} mb={3}>
                  <Button
                    variant={selectedMethod === CountingMethod.countToTen ? 'contained' : 'outlined'}
                    onClick={() => setSelectedMethod(CountingMethod.countToTen)}
                    fullWidth
                  >
                    Count to 10 Kicks
                  </Button>
                  <Button
                    variant={selectedMethod === CountingMethod.fixedTime ? 'contained' : 'outlined'}
                    onClick={() => setSelectedMethod(CountingMethod.fixedTime)}
                    fullWidth
                  >
                    Fixed Time Period
                  </Button>
                </Box>

                <Typography variant="body1" paragraph>
                  {selectedMethod === CountingMethod.countToTen
                    ? 'Count until you feel 10 distinct kicks or movements from your baby.'
                    : `Count kicks for ${targetDuration} minutes.`}
                </Typography>

                {selectedMethod === CountingMethod.fixedTime && (
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Duration: {targetDuration} minutes
                    </Typography>
                    <Box display="flex" gap={1}>
                      {[30, 45, 60, 90, 120].map((duration) => (
                        <Chip
                          key={duration}
                          label={`${duration}min`}
                          clickable
                          color={targetDuration === duration ? 'primary' : 'default'}
                          onClick={() => setTargetDuration(duration)}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useNewModel}
                        onChange={(e) => setUseNewModel(e.target.checked)}
                      />
                    }
                    label="Use AI Model Analysis"
                  />
                  <Tooltip title="Enable AI-powered analysis using trained machine learning model">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {phoneOnAbdomen
                      ? '📱 Phone-on-abdomen mode: Place your phone directly on your abdomen for enhanced movement detection.'
                      : '👋 Manual mode: Tap the screen each time you feel a kick.'}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="center" mb={3}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={startSession}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 2,
                  background: 'linear-gradient(45deg, #FF6B9D 30%, #C44569 90%)',
                }}
              >
                Start Counting
              </Button>
            </Box>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recent Sessions
                  </Typography>
                  {recentSessions.map((session) => (
                    <Box key={session.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        {session.date.toLocaleDateString()}: {session.count} kicks in {session.duration}min
                        {session.phoneOnAbdomen && ' 📱'}
                        {session.analysisMethod === 'new' && ' 🤖'}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          // Counting screen
          <Box textAlign="center">
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {kickCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {selectedMethod === CountingMethod.countToTen ? 'of 10 kicks' : 'kicks counted'}
                </Typography>

                {startTime && (
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {formatDuration(elapsedTime)}
                  </Typography>
                )}

                <Box sx={{ mt: 3, mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressValue()}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #FF6B9D 30%, #C44569 90%)',
                        borderRadius: 6,
                      },
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {selectedMethod === CountingMethod.countToTen
                    ? `${10 - kickCount} kicks remaining`
                    : `${Math.max(0, targetDuration - Math.floor(elapsedTime / (1000 * 60)))} minutes remaining`}
                </Typography>
              </CardContent>
            </Card>

            <Box mb={3}>
              <IconButton
                onClick={recordKick}
                sx={{
                  width: 120,
                  height: 120,
                  background: 'linear-gradient(45deg, #FF6B9D 30%, #C44569 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #C44569 30%, #FF6B9D 90%)',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                  boxShadow: 3,
                }}
              >
                <TouchApp sx={{ fontSize: 48 }} />
              </IconButton>
            </Box>

            <Typography variant="body1" gutterBottom>
              {phoneOnAbdomen
                ? '📱 Tap when you feel movement through your phone'
                : '👋 Tap each time you feel a kick'}
            </Typography>

            {canSubmit() && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Ready to analyze! Click submit to get AI assessment.
              </Alert>
            )}
          </Box>
        )}

        {isAnalyzing && (
          <Box textAlign="center" py={4}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6">Analyzing fetal health...</Typography>
            <Typography variant="body2" color="text.secondary">
              Using {useNewModel ? 'AI model' : 'rule-based'} analysis
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {isCounting ? (
          <>
            <Button
              onClick={cancelSession}
              startIcon={<Stop />}
              color="secondary"
            >
              Cancel Session
            </Button>
            {canSubmit() && (
              <Button
                onClick={submitSession}
                variant="contained"
                startIcon={<Refresh />}
                disabled={isAnalyzing}
                sx={{
                  background: 'linear-gradient(45deg, #48BB78 30%, #38A169 90%)',
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Submit & Analyze'}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default KickCounter;