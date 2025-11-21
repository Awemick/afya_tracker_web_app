import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
} from '@mui/material';
import {
  Add,
  Delete,
  QrCode,
  Save,
  Person,
  MedicalServices,
  AccessTime,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
// @ts-ignore
import * as QRCodeLib from 'qrcode';
import { Prescription, Medication, Patient } from '../../types';
import { prescriptionAPI, patientAPI } from '../../services/api';
import {
  createPrescriptionStart,
  createPrescriptionSuccess,
  createPrescriptionFailure,
} from '../../store/slices/prescriptionsSlice';

interface PrescriptionWriterProps {
  patientId?: string;
  onSave?: (prescription: Prescription) => void;
  onCancel?: () => void;
}

const PrescriptionWriter: React.FC<PrescriptionWriterProps> = ({
  patientId,
  onSave,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: any) => state.prescriptions);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');

  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrDialog, setShowQrDialog] = useState(false);

  // Mock medication database - in real app, this would come from an API
  const medicationOptions = [
    { name: 'Paracetamol', genericName: 'Acetaminophen', commonDosages: ['500mg', '1000mg'] },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', commonDosages: ['200mg', '400mg', '600mg'] },
    { name: 'Amoxicillin', genericName: 'Amoxicillin', commonDosages: ['250mg', '500mg'] },
    { name: 'Omeprazole', genericName: 'Omeprazole', commonDosages: ['20mg', '40mg'] },
    { name: 'Metformin', genericName: 'Metformin', commonDosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Amlodipine', genericName: 'Amlodipine', commonDosages: ['5mg', '10mg'] },
    { name: 'Simvastatin', genericName: 'Simvastatin', commonDosages: ['10mg', '20mg', '40mg'] },
    { name: 'Lisinopril', genericName: 'Lisinopril', commonDosages: ['5mg', '10mg', '20mg'] },
    { name: 'Levothyroxine', genericName: 'Levothyroxine', commonDosages: ['25mcg', '50mcg', '75mcg', '100mcg'] },
    { name: 'Prednisone', genericName: 'Prednisone', commonDosages: ['5mg', '10mg', '20mg'] },
  ];

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
  ];

  useEffect(() => {
    loadPatients();
    if (patientId) {
      loadPatient(patientId);
    }
  }, [patientId]);

  const loadPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadPatient = async (id: string) => {
    try {
      const response = await patientAPI.getById(id);
      setPatient(response.data);
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  };

  const handlePatientChange = (event: any, newValue: Patient | null) => {
    setPatient(newValue);
    setSelectedPatientId(newValue?.id || '');
  };

  const addMedication = () => {
    const newMedication: Medication = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: '',
      duration: 7, // default 7 days
      instructions: '',
      refills: 0,
    };
    setMedications([...medications, newMedication]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setMedications(updatedMedications);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationSelect = (index: number, medication: any) => {
    updateMedication(index, 'name', medication.name);
    updateMedication(index, 'genericName', medication.genericName);
    // Suggest first common dosage
    if (medication.commonDosages && medication.commonDosages.length > 0) {
      updateMedication(index, 'dosage', medication.commonDosages[0]);
    }
  };

  const generateQrCode = async (prescriptionId: string) => {
    try {
      const qrData = {
        prescriptionId,
        patientId: selectedPatientId,
        doctorId: 'current-doctor-id', // This should come from auth context
        timestamp: new Date().toISOString(),
      };

      const qrString = JSON.stringify(qrData);
      const dataUrl = await QRCodeLib.toDataURL(qrString);
      setQrCodeDataUrl(dataUrl);
      setShowQrDialog(true);
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId || medications.length === 0) {
      alert('Please select a patient and add at least one medication');
      return;
    }

    const prescriptionData = {
      patientId: selectedPatientId,
      doctorId: 'current-doctor-id', // This should come from auth context
      medications,
      diagnosis,
      instructions,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    dispatch(createPrescriptionStart());

    try {
      const response = await prescriptionAPI.createPrescription(prescriptionData);
      const prescription = response.data;

      // Generate QR code
      const qrCode = await generateQrCode(prescription.id);
      if (qrCode) {
        // Update prescription with QR code
        await prescriptionAPI.updatePrescription(prescription.id, { qrCode });
        prescription.qrCode = qrCode;
      }

      dispatch(createPrescriptionSuccess(prescription));

      if (onSave) {
        onSave(prescription);
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      dispatch(createPrescriptionFailure('Failed to save prescription'));
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Digital Prescription Writer
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Patient Selection */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Patient Information
            </Typography>
            <Autocomplete
              options={patients}
              getOptionLabel={(option) => `${option.name} - ${option.email}`}
              value={patient}
              onChange={handlePatientChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patient"
                  required
                  fullWidth
                />
              )}
              disabled={!!patientId}
            />
            {patient && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Pregnancy Week: {patient.pregnancyWeek} | Due Date: {new Date(patient.dueDate).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} />
              Diagnosis
            </Typography>
            <TextField
              label="Diagnosis/Condition"
              multiline
              rows={2}
              fullWidth
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis or medical condition"
            />
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Medications
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addMedication}
              >
                Add Medication
              </Button>
            </Box>

            {medications.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No medications added yet. Click "Add Medication" to get started.
              </Typography>
            )}

            <Stack spacing={2}>
              {medications.map((medication, index) => (
                <Card key={medication.id} variant="outlined">
                  <CardContent>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Box flex={1} minWidth="200px">
                          <Autocomplete
                            options={medicationOptions}
                            getOptionLabel={(option) => `${option.name} (${option.genericName})`}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Medication Name"
                                required
                              />
                            )}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleMedicationSelect(index, newValue);
                              }
                            }}
                            value={medicationOptions.find(m => m.name === medication.name) || null}
                          />
                        </Box>

                        <Box flex={1} minWidth="150px">
                          <TextField
                            label="Dosage"
                            fullWidth
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                          />
                        </Box>

                        <Box flex={1} minWidth="150px">
                          <FormControl fullWidth>
                            <InputLabel>Frequency</InputLabel>
                            <Select
                              value={medication.frequency}
                              onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                              label="Frequency"
                            >
                              {frequencyOptions.map((freq) => (
                                <MenuItem key={freq} value={freq}>
                                  {freq}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Box flex={1} minWidth="150px">
                          <TextField
                            label="Duration (days)"
                            type="number"
                            fullWidth
                            value={medication.duration}
                            onChange={(e) => updateMedication(index, 'duration', parseInt(e.target.value) || 0)}
                            inputProps={{ min: 1 }}
                          />
                        </Box>

                        <Box flex={1} minWidth="150px">
                          <TextField
                            label="Refills"
                            type="number"
                            fullWidth
                            value={medication.refills}
                            onChange={(e) => updateMedication(index, 'refills', parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0 }}
                          />
                        </Box>

                        <Box flex={2} minWidth="200px">
                          <TextField
                            label="Special Instructions"
                            multiline
                            rows={2}
                            fullWidth
                            value={medication.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="e.g., Take with food, avoid alcohol"
                          />
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="flex-end">
                        <IconButton
                          color="error"
                          onClick={() => removeMedication(index)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* General Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
              General Instructions
            </Typography>
            <TextField
              label="Additional Instructions"
              multiline
              rows={3}
              fullWidth
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="General instructions for the patient"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading || !selectedPatientId || medications.length === 0}
          >
            {loading ? 'Saving...' : 'Save Prescription'}
          </Button>
        </Box>
      </Stack>

      {/* QR Code Dialog */}
      <Dialog
        open={showQrDialog}
        onClose={() => setShowQrDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <QrCode sx={{ mr: 1, verticalAlign: 'middle' }} />
          Prescription QR Code
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="Prescription QR Code"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
            <Typography variant="body2" color="text.secondary" mt={2}>
              Scan this QR code at the pharmacy to access prescription details
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQrDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PrescriptionWriter;