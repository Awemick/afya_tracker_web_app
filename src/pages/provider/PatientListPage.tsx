import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Visibility,
  Warning,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  name: string;
  pregnancyWeek: number;
  lastSession: string;
  kickCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
}

const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with API call
  const patients: Patient[] = [
    {
      id: '1',
      name: 'Mary Wanjiku',
      pregnancyWeek: 28,
      lastSession: '2 hours ago',
      kickCount: 8,
      riskLevel: 'medium',
      status: 'active',
    },
    {
      id: '2',
      name: 'Sarah Omondi',
      pregnancyWeek: 32,
      lastSession: '5 hours ago',
      kickCount: 12,
      riskLevel: 'low',
      status: 'active',
    },
    {
      id: '3',
      name: 'Grace Akinyi',
      pregnancyWeek: 24,
      lastSession: '1 day ago',
      kickCount: 6,
      riskLevel: 'high',
      status: 'active',
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Patient Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your patients' maternal health
          </Typography>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <IconButton>
            <FilterList />
          </IconButton>
        </Box>
      </Paper>

      {/* Patients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Pregnancy Week</TableCell>
              <TableCell>Last Session</TableCell>
              <TableCell>Last Kick Count</TableCell>
              <TableCell>Risk Level</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow
                key={patient.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    cursor: 'pointer',
                  },
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {patient.riskLevel === 'high' && (
                      <Warning color="error" fontSize="small" />
                    )}
                    <Typography fontWeight="medium">
                      {patient.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`Week ${patient.pregnancyWeek}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{patient.lastSession}</TableCell>
                <TableCell>
                  <Typography
                    fontWeight="bold"
                    color={
                      patient.kickCount < 6 ? 'error.main' :
                      patient.kickCount < 10 ? 'warning.main' : 'success.main'
                    }
                  >
                    {patient.kickCount} kicks
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.riskLevel}
                    color={getRiskColor(patient.riskLevel)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => navigate(`/provider/patients/${patient.id}`)}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PatientListPage;