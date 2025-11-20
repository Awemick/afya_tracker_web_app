import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Divider,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  PregnantWoman,
  EventNote,
  Warning,
  TrendingUp,
  CalendarToday,
  ChildCare,
  MedicalServices,
  Message,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule,
  FiberManualRecord,
} from '@mui/icons-material';
import { format, differenceInWeeks, parseISO } from 'date-fns';
import { Patient, Consultation, EmergencyAlert, KickSession, Prescription, ProgressNote, MedicalRecord, Task } from '../../types';
import { patientAPI, alertAPI, messagingAPI, progressNotesAPI, patientLinksAPI, medicalRecordsAPI, tasksAPI } from '../../services/api';

interface TimelineEvent {
  id: string;
  type: 'milestone' | 'consultation' | 'kick_session' | 'alert' | 'appointment' | 'message' | 'prescription' | 'note' | 'link' | 'medical_record';
  title: string;
  description: string;
  date: string;
  week?: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  details?: any;
  expandable?: boolean;
}

interface PatientHealthTimelineProps {
  patientId: string;
  patientData?: Patient;
  compact?: boolean;
}

const PatientHealthTimeline: React.FC<PatientHealthTimelineProps> = ({
  patientId,
  patientData,
  compact = false,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Fetal development milestones
  const fetalMilestones = [
    { week: 4, title: 'Heartbeat Begins', description: 'Baby\'s heart starts beating' },
    { week: 8, title: 'Major Organs Form', description: 'All major organs have begun to form' },
    { week: 12, title: 'First Trimester Complete', description: 'Baby is fully formed with all organs, muscles, and nerves' },
    { week: 16, title: 'Movement Felt', description: 'You may start to feel baby\'s first movements' },
    { week: 20, title: 'Halfway Point', description: 'Baby is about 6 inches long and weighs about 9 ounces' },
    { week: 24, title: 'Lungs Developing', description: 'Baby\'s lungs are developing rapidly' },
    { week: 28, title: 'Brain Rapidly Developing', description: 'Baby\'s brain is growing quickly' },
    { week: 32, title: 'Practice Breathing', description: 'Baby practices breathing movements' },
    { week: 36, title: 'Lungs Mature', description: 'Baby\'s lungs are nearly fully mature' },
    { week: 40, title: 'Full Term', description: 'Baby is ready to be born' },
  ];

  useEffect(() => {
    loadTimelineData();
  }, [patientId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const timelineEvents: TimelineEvent[] = [];

      // Load patient data if not provided
      let patient = patientData;
      if (!patient) {
        const patientResponse = await patientAPI.getById(patientId);
        patient = patientResponse.data;
      }

      if (!patient) return;

      const pregnancyStart = new Date(patient.dueDate);
      pregnancyStart.setDate(pregnancyStart.getDate() - (40 * 7)); // 40 weeks back

      // Add fetal development milestones
      fetalMilestones.forEach((milestone) => {
        const milestoneDate = new Date(pregnancyStart);
        milestoneDate.setDate(milestoneDate.getDate() + (milestone.week * 7));

        if (milestoneDate <= new Date()) {
          timelineEvents.push({
            id: `milestone-${milestone.week}`,
            type: 'milestone',
            title: milestone.title,
            description: milestone.description,
            date: milestoneDate.toISOString(),
            week: milestone.week,
            icon: <ChildCare />,
            color: 'primary',
          });
        }
      });

      // Load consultations (mock data for now)
      const consultations: Consultation[] = [
        {
          id: '1',
          patientId,
          providerId: 'provider1',
          type: 'video',
          status: 'completed',
          scheduledAt: '2024-01-15T10:00:00Z',
          duration: 30,
          notes: 'Routine checkup - everything looks good',
        },
        {
          id: '2',
          patientId,
          providerId: 'provider1',
          type: 'video',
          status: 'scheduled',
          scheduledAt: '2024-02-15T10:00:00Z',
        },
      ];

      consultations.forEach((consultation) => {
        timelineEvents.push({
          id: `consultation-${consultation.id}`,
          type: 'consultation',
          title: consultation.status === 'completed' ? 'Consultation Completed' : 'Consultation Scheduled',
          description: `${consultation.type} consultation${consultation.duration ? ` (${consultation.duration} min)` : ''}`,
          date: consultation.scheduledAt,
          icon: <MedicalServices />,
          color: consultation.status === 'completed' ? 'success' : 'info',
          details: consultation,
        });
      });

      // Load kick sessions
      const kickSessions: KickSession[] = patient.kickSessions || [];

      kickSessions.forEach((session) => {
        timelineEvents.push({
          id: `kick-${session.id}`,
          type: 'kick_session',
          title: 'Fetal Kick Session',
          description: `${session.kickCount} kicks in ${session.duration} minutes`,
          date: session.date,
          icon: <TrendingUp />,
          color: 'secondary',
          details: session,
        });
      });

      // Load alerts (mock data)
      const alerts: EmergencyAlert[] = [
        {
          id: '1',
          patientId,
          type: 'reduced_movement',
          severity: 'medium',
          timestamp: '2024-01-10T14:30:00Z',
          status: 'resolved',
        },
      ];

      alerts.forEach((alert) => {
        timelineEvents.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          title: 'Health Alert',
          description: `${alert.type.replace('_', ' ')} - ${alert.severity} severity`,
          date: alert.timestamp,
          icon: <Warning />,
          color: alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info',
          details: alert,
        });
      });

      // Load progress notes
      try {
        const notesResponse = await progressNotesAPI.getPatientNotes(patientId);
        const notes: ProgressNote[] = notesResponse.data;

        notes.forEach((note) => {
          timelineEvents.push({
            id: `note-${note.id}`,
            type: 'note' as any,
            title: note.title,
            description: `${note.category} note - ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`,
            date: note.createdAt.toDate ? note.createdAt.toDate().toISOString() : note.createdAt,
            icon: <EventNote />,
            color: note.status === 'visible' ? 'success' : note.status === 'approved' ? 'info' : 'warning',
            details: note,
            expandable: true,
          });
        });
      } catch (error) {
        console.error('Error loading progress notes for timeline:', error);
      }

      // Load prescriptions (mock data)
      const prescriptions: Prescription[] = [
        {
          id: '1',
          patientId,
          doctorId: 'doc1',
          medications: [
            { id: 'med1', name: 'Prenatal Vitamins', genericName: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: 90, instructions: 'Take with food', refills: 3 },
            { id: 'med2', name: 'Iron Supplement', genericName: 'Ferrous Sulfate', dosage: '65mg', frequency: 'Once daily', duration: 90, instructions: 'Take on empty stomach', refills: 3 },
          ],
          diagnosis: 'Routine prenatal care',
          instructions: 'Take medications as prescribed. Follow up in 4 weeks.',
          status: 'active',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
          validUntil: '2024-04-10T10:00:00Z',
        },
        {
          id: '2',
          patientId,
          doctorId: 'doc1',
          medications: [
            { id: 'med3', name: 'Paracetamol', genericName: 'Acetaminophen', dosage: '500mg', frequency: 'As needed', duration: 30, instructions: 'Take for pain relief, max 4 times daily', refills: 1 },
          ],
          diagnosis: 'Mild headache',
          instructions: 'Take as needed for headache. Contact if symptoms worsen.',
          status: 'completed',
          createdAt: '2024-01-05T14:30:00Z',
          updatedAt: '2024-01-05T14:30:00Z',
          validUntil: '2024-02-05T14:30:00Z',
        },
      ];

      prescriptions.forEach((prescription) => {
        timelineEvents.push({
          id: `prescription-${prescription.id}`,
          type: 'prescription',
          title: 'Prescription Issued',
          description: `${prescription.diagnosis} - ${prescription.medications.length} medication${prescription.medications.length > 1 ? 's' : ''}`,
          date: prescription.createdAt,
          icon: <MedicalServices />,
          color: prescription.status === 'active' ? 'success' : 'info',
          details: prescription,
          expandable: true,
        });
      });

      // Load patient links
      try {
        const linksResponse = await patientLinksAPI.getPatientLinks(patientId);
        const links: any[] = linksResponse.data;

        links.forEach((link) => {
          timelineEvents.push({
            id: `link-${link.id}`,
            type: 'link',
            title: link.status === 'active' ? 'Linked to Healthcare Facility' : `Link ${link.status}`,
            description: `Institution: ${link.institutionId} • Type: ${link.linkType}`,
            date: link.linkedAt.toDate ? link.linkedAt.toDate().toISOString() : link.linkedAt,
            icon: <MedicalServices />,
            color: link.status === 'active' ? 'success' : link.status === 'pending' ? 'warning' : 'error',
            details: link,
            expandable: true,
          });
        });
      } catch (error) {
        console.error('Error loading patient links for timeline:', error);
      }

      // Load medical records
      try {
        const recordsResponse = await medicalRecordsAPI.getPatientRecords(patientId);
        const records: MedicalRecord[] = recordsResponse.data;

        records.forEach((record) => {
          timelineEvents.push({
            id: `medical-record-${record.id}`,
            type: 'medical_record',
            title: 'Medical Record Uploaded',
            description: `${record.category.replace('_', ' ')} • ${record.fileName} • ${(record.fileSize / 1024 / 1024).toFixed(2)} MB`,
            date: record.uploadedAt.toDate ? record.uploadedAt.toDate().toISOString() : record.uploadedAt,
            icon: <MedicalServices />,
            color: 'info',
            details: record,
            expandable: true,
          });
        });
      } catch (error) {
        console.error('Error loading medical records for timeline:', error);
      }

      // Load completed tasks
      try {
        const tasksResponse = await tasksAPI.getTasks(patientId, 'patient');
        const tasks: Task[] = tasksResponse.data.filter((task: Task) => task.status === 'completed');

        tasks.forEach((task) => {
          timelineEvents.push({
            id: `task-${task.id}`,
            type: 'consultation' as any, // Using consultation icon for tasks
            title: 'Task Completed',
            description: `${task.title} • ${task.category.replace('_', ' ')}`,
            date: task.completedAt ? (task.completedAt.toDate ? task.completedAt.toDate().toISOString() : task.completedAt) : task.createdAt.toDate ? task.createdAt.toDate().toISOString() : task.createdAt,
            icon: <CheckCircle />,
            color: 'success',
            details: task,
            expandable: true,
          });
        });
      } catch (error) {
        console.error('Error loading tasks for timeline:', error);
      }

      // Sort events by date (most recent first)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getCurrentWeek = () => {
    if (!patientData?.dueDate) return 0;
    const dueDate = parseISO(patientData.dueDate);
    const today = new Date();
    return Math.max(1, Math.min(40, 40 - differenceInWeeks(dueDate, today)));
  };

  const getProgressPercentage = () => {
    return (getCurrentWeek() / 40) * 100;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Health Timeline...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Health Timeline
        </Typography>
        {!compact && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Week {getCurrentWeek()} of 40
            </Typography>
            <Box sx={{ width: 100 }}>
              <LinearProgress
                variant="determinate"
                value={getProgressPercentage()}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Custom Timeline */}
      <Stack spacing={2}>
        {events.slice(0, compact ? 5 : events.length).map((event, index) => (
          <Box key={event.id} display="flex" alignItems="flex-start" gap={2}>
            {/* Timeline connector */}
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: `${event.color}.main`,
                }}
              >
                {event.icon}
              </Avatar>
              {index < events.slice(0, compact ? 5 : events.length).length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    height: 40,
                    bgcolor: 'grey.300',
                    my: 1,
                  }}
                />
              )}
            </Box>

            {/* Event content */}
            <Box flex={1}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 },
                }}
                onClick={() => handleEventClick(event)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {event.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(event.date), 'MMM dd, yyyy')}
                        {event.week && ` • Week ${event.week}`}
                      </Typography>
                    </Box>
                    {event.expandable && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(event.id);
                        }}
                      >
                        {expandedEvents.has(event.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </Box>

                  {expandedEvents.has(event.id) && event.details && (
                    <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                      {/* Additional details based on event type */}
                      {event.type === 'consultation' && (
                        <Box>
                          <Typography variant="body2">
                            <strong>Type:</strong> {event.details.type}
                          </Typography>
                          {event.details.duration && (
                            <Typography variant="body2">
                              <strong>Duration:</strong> {event.details.duration} minutes
                            </Typography>
                          )}
                          {event.details.notes && (
                            <Typography variant="body2">
                              <strong>Notes:</strong> {event.details.notes}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {event.type === 'kick_session' && (
                        <Box>
                          <Typography variant="body2">
                            <strong>Position:</strong> {event.details.position}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Intensity:</strong> {event.details.intensity}
                          </Typography>
                          {event.details.notes && (
                            <Typography variant="body2">
                              <strong>Notes:</strong> {event.details.notes}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {event.type === 'alert' && (
                        <Box>
                          <Typography variant="body2">
                            <strong>Type:</strong> {event.details.type.replace('_', ' ')}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Severity:</strong> {event.details.severity}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> {event.details.status}
                          </Typography>
                        </Box>
                      )}

                      {event.type === 'prescription' && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Diagnosis: {event.details.diagnosis}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Medications:
                          </Typography>
                          {event.details.medications.map((med: any, index: number) => (
                            <Box key={med.id} sx={{ mb: 1, pl: 2 }}>
                              <Typography variant="body2">
                                <strong>{med.name}</strong> ({med.genericName})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {med.dosage} • {med.frequency} • {med.duration} days
                              </Typography>
                              {med.instructions && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  {med.instructions}
                                </Typography>
                              )}
                            </Box>
                          ))}
                          {event.details.instructions && (
                            <Box mt={1}>
                              <Typography variant="body2" fontWeight="bold">
                                Instructions:
                              </Typography>
                              <Typography variant="body2">
                                {event.details.instructions}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {event.type === 'note' && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Category: {event.details.category}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Status: {event.details.status}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Content:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {event.details.content}
                          </Typography>
                          {event.details.tags && event.details.tags.length > 0 && (
                            <Box mt={1}>
                              <Typography variant="body2" fontWeight="bold">
                                Tags:
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                {event.details.tags.map((tag: string, index: number) => (
                                  <Chip key={index} label={tag} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}

                      {event.type === 'link' && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Institution: {event.details.institutionId}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Link Type: {event.details.linkType}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Status: {event.details.status}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Permissions:
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            {Object.entries(event.details.permissions).map(([key, value]) => (
                              <Typography key={key} variant="body2">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value ? 'Yes' : 'No'}
                              </Typography>
                            ))}
                          </Box>
                          {event.details.metadata?.notes && (
                            <Box mt={1}>
                              <Typography variant="body2" fontWeight="bold">
                                Notes:
                              </Typography>
                              <Typography variant="body2">
                                {event.details.metadata.notes}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {event.type === 'medical_record' && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            File Name: {event.details.fileName}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Category: {event.details.category.replace('_', ' ')}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            File Size: {(event.details.fileSize / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            File Type: {event.details.fileType}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Uploaded By: {event.details.uploadedBy}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Version: {event.details.version}
                          </Typography>
                          {event.details.description && (
                            <Box mt={1}>
                              <Typography variant="body2" fontWeight="bold">
                                Description:
                              </Typography>
                              <Typography variant="body2">
                                {event.details.description}
                              </Typography>
                            </Box>
                          )}
                          {event.details.tags && event.details.tags.length > 0 && (
                            <Box mt={1}>
                              <Typography variant="body2" fontWeight="bold">
                                Tags:
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                {event.details.tags.map((tag: string, index: number) => (
                                  <Chip key={index} label={tag} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        ))}
      </Stack>

      {events.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No timeline events yet. Events will appear here as your pregnancy progresses.
          </Typography>
        </Box>
      )}

      {/* Event Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEvent?.title}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedEvent.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {format(parseISO(selectedEvent.date), 'PPP')}
              </Typography>
              {selectedEvent.week && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pregnancy Week: {selectedEvent.week}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Detailed information based on event type */}
              {selectedEvent.details && (
                <Box>
                  {selectedEvent.type === 'consultation' && (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Type</Typography>
                          <Typography variant="body2">{selectedEvent.details.type}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Status</Typography>
                          <Typography variant="body2">{selectedEvent.details.status}</Typography>
                        </Box>
                      </Box>
                      {selectedEvent.details.duration && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Duration</Typography>
                          <Typography variant="body2">{selectedEvent.details.duration} minutes</Typography>
                        </Box>
                      )}
                      {selectedEvent.details.notes && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Notes</Typography>
                          <Typography variant="body2">{selectedEvent.details.notes}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {selectedEvent.type === 'kick_session' && (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Kicks</Typography>
                          <Typography variant="body2">{selectedEvent.details.kickCount}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Duration</Typography>
                          <Typography variant="body2">{selectedEvent.details.duration} minutes</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Position</Typography>
                          <Typography variant="body2">{selectedEvent.details.position}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Intensity</Typography>
                          <Typography variant="body2">{selectedEvent.details.intensity}</Typography>
                        </Box>
                      </Box>
                      {selectedEvent.details.notes && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Notes</Typography>
                          <Typography variant="body2">{selectedEvent.details.notes}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {selectedEvent.type === 'alert' && (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Type</Typography>
                          <Typography variant="body2">{selectedEvent.details.type.replace('_', ' ')}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Severity</Typography>
                          <Typography variant="body2">{selectedEvent.details.severity}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Status</Typography>
                        <Typography variant="body2">{selectedEvent.details.status}</Typography>
                      </Box>
                    </Box>
                  )}

                  {selectedEvent.type === 'prescription' && (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Diagnosis</Typography>
                        <Typography variant="body2">{selectedEvent.details.diagnosis}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Status</Typography>
                        <Typography variant="body2">{selectedEvent.details.status}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Valid Until</Typography>
                        <Typography variant="body2">{format(parseISO(selectedEvent.details.validUntil), 'PPP')}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Medications</Typography>
                        {selectedEvent.details.medications.map((med: any) => (
                          <Box key={med.id} sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {med.name} ({med.genericName})
                            </Typography>
                            <Typography variant="body2">
                              Dosage: {med.dosage} • Frequency: {med.frequency}
                            </Typography>
                            <Typography variant="body2">
                              Duration: {med.duration} days • Refills: {med.refills}
                            </Typography>
                            {med.instructions && (
                              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                Instructions: {med.instructions}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                      {selectedEvent.details.instructions && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">General Instructions</Typography>
                          <Typography variant="body2">{selectedEvent.details.instructions}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PatientHealthTimeline;