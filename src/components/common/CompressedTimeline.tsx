import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  PregnantWoman,
  Timeline,
  CalendarToday,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

interface CompressedTimelineProps {
  patientData: {
    id: string;
    name: string;
    pregnancyWeek: number;
    dueDate: string;
    riskLevel: 'low' | 'medium' | 'high';
    kickSessions: any[];
  };
}

const CompressedTimeline: React.FC<CompressedTimelineProps> = ({ patientData }) => {
  const totalWeeks = 40;
  const progressPercentage = (patientData.pregnancyWeek / totalWeeks) * 100;

  const recentMilestones = [
    { week: patientData.pregnancyWeek - 2, event: 'Fetal movement felt', completed: true },
    { week: patientData.pregnancyWeek - 1, event: 'Ultrasound scan', completed: true },
    { week: patientData.pregnancyWeek, event: 'Current week', completed: true },
    { week: patientData.pregnancyWeek + 1, event: 'Next checkup', completed: false },
    { week: patientData.pregnancyWeek + 4, event: 'Anatomy scan', completed: false },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Pregnancy Progress
        </Typography>
        <Chip
          label={`Week ${patientData.pregnancyWeek} of ${totalWeeks}`}
          color="primary"
          variant="outlined"
          icon={<PregnantWoman />}
        />
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Pregnancy Progress
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {Math.round(progressPercentage)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: 'primary.main',
            },
          }}
        />
      </Box>

      {/* Key Stats */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarToday sx={{ color: 'success.main' }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Due Date
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {new Date(patientData.dueDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Timeline sx={{ color: 'info.main' }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Kick Sessions
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {patientData.kickSessions.length} recorded
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircle sx={{ color: getRiskColor(patientData.riskLevel) + '.main' }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Risk Level
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {patientData.riskLevel.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Recent Milestones */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
          Recent & Upcoming Milestones
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {recentMilestones.slice(0, 5).map((milestone, index) => (
            <Chip
              key={index}
              label={`Week ${milestone.week}: ${milestone.event}`}
              size="small"
              color={milestone.completed ? 'success' : 'default'}
              variant={milestone.completed ? 'filled' : 'outlined'}
              icon={milestone.completed ? <CheckCircle /> : <Schedule />}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default CompressedTimeline;
export {};