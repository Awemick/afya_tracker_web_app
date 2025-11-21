import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    location: '',
    pregnancyWeek: '',
    dueDate: null as Date | null,
    bloodType: '',
    allergies: '',
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    loadExistingData();
  }, [user]);

  const loadExistingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (!db) {
        console.error('Firestore not initialized');
        setError('Database not available. Please try again.');
        return;
      }

      const docRef = doc(db, 'users', user.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          displayName: data.displayName || data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          pregnancyWeek: data.pregnancyWeek?.toString() || '',
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          bloodType: data.bloodType || '',
          allergies: data.allergies || '',
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      setError('Failed to load existing data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      if (!db) {
        throw new Error('Database not available');
      }

      const profileData = {
        uid: user.id,
        email: user.email,
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        pregnancyWeek: parseInt(formData.pregnancyWeek) || 0,
        dueDate: formData.dueDate?.toISOString().split('T')[0] || null,
        bloodType: formData.bloodType,
        allergies: formData.allergies.trim(),
        role: 'patient',
        profileCompleted: true,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.id), profileData, { merge: true });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Typography variant="h3" color="white">👤</Typography>
            </Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Complete Your Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Help us personalize your pregnancy journey
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Basic Information
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  placeholder="e.g., Nairobi, Kenya"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Pregnancy Information
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Pregnancy Week"
                  type="number"
                  value={formData.pregnancyWeek}
                  onChange={(e) => handleInputChange('pregnancyWeek', e.target.value)}
                  required
                  inputProps={{ min: 1, max: 42 }}
                  helperText="Enter a number between 1-42"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date (Optional)"
                  value={formData.dueDate}
                  onChange={(date) => handleInputChange('dueDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Medical Information
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Blood Type (Optional)</InputLabel>
                  <Select
                    value={formData.bloodType}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    label="Blood Type (Optional)"
                  >
                    {bloodTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Allergies (Optional)"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="List any allergies or medical conditions"
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
                sx={{
                  minWidth: 150,
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
                  },
                }}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : 'Complete Setup'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={handleSkip}
                disabled={saving}
                sx={{ minWidth: 150 }}
              >
                Skip for Now
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ProfileSetupPage;