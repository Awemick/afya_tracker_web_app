import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
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
  Chip,
  Card,
  CardContent,
  IconButton,
  Stack,
  Divider,
  Alert,
  Fab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Schedule,
  ExpandMore,
  MedicalServices,
  Restaurant,
  FitnessCenter,
  MonitorHeart,
  LocalHospital,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ProgressNote, Recommendation, User } from '../../types';
import { progressNotesAPI, recommendationsAPI, notificationAPI, tasksAPI } from '../../services/api';
import {
  fetchNotesStart,
  fetchNotesSuccess,
  fetchNotesFailure,
  addNote,
  updateNote,
  selectNote,
  clearSelectedNote,
  fetchRecommendationsStart,
  fetchRecommendationsSuccess,
  fetchRecommendationsFailure,
  addRecommendation,
  updateRecommendation,
  completeRecommendation,
} from '../../store/slices/progressNotesSlice';
import { addNotification } from '../../store/slices/notificationsSlice';
import { RootState } from '../../store/store';

interface ProgressNotesProps {
  patientId: string;
  userRole: 'patient' | 'provider';
  userId: string;
  compact?: boolean;
}

const ProgressNotes: React.FC<ProgressNotesProps> = ({
  patientId,
  userRole,
  userId,
  compact = false,
}) => {
  const dispatch = useDispatch();
  const {
    notes,
    recommendations,
    selectedNote,
    loading,
    error,
  } = useSelector((state: RootState) => state.progressNotes);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProgressNote | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: 'consultation' as ProgressNote['category'],
    visibility: 'private' as ProgressNote['visibility'],
    tags: [] as string[],
  });
  const [recommendationForm, setRecommendationForm] = useState({
    type: 'lifestyle' as Recommendation['type'],
    title: '',
    description: '',
    priority: 'medium' as Recommendation['priority'],
  });
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadNotes();
    loadRecommendations();
  }, [patientId]);

  const loadNotes = async () => {
    try {
      dispatch(fetchNotesStart());
      let response;
      if (userRole === 'provider') {
        response = await progressNotesAPI.getPatientNotes(patientId);
      } else {
        // For patients, only show approved and visible notes
        response = await progressNotesAPI.getPatientNotes(patientId);
        // Filter for visible notes only
        response.data = response.data.filter((note: ProgressNote) =>
          note.status === 'visible' || note.status === 'approved'
        );
      }
      dispatch(fetchNotesSuccess(response.data));
    } catch (error) {
      console.error('Error loading notes:', error);
      dispatch(fetchNotesFailure('Failed to load notes'));
    }
  };

  const loadRecommendations = async () => {
    try {
      dispatch(fetchRecommendationsStart());
      const response = await recommendationsAPI.getPatientRecommendations(patientId);
      dispatch(fetchRecommendationsSuccess(response.data));
    } catch (error) {
      console.error('Error loading recommendations:', error);
      dispatch(fetchRecommendationsFailure('Failed to load recommendations'));
    }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setNoteForm({
      title: '',
      content: '',
      category: 'consultation',
      visibility: 'private',
      tags: [],
    });
    setDialogOpen(true);
  };

  const handleEditNote = (note: ProgressNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      visibility: note.visibility,
      tags: note.tags,
    });
    setDialogOpen(true);
  };

  const handleSaveNote = async () => {
    try {
      if (editingNote) {
        const response = await progressNotesAPI.updateNote(editingNote.id, {
          ...noteForm,
          doctorId: userId,
        });
        dispatch(updateNote(response.data));
      } else {
        const response = await progressNotesAPI.createNote({
          ...noteForm,
          patientId,
          doctorId: userId,
          status: 'draft',
        });
        dispatch(addNote(response.data));
      }
      setDialogOpen(false);
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleApproveNote = async (noteId: string) => {
    try {
      const response = await progressNotesAPI.approveNote(noteId, userId);
      dispatch(updateNote(response.data));
      loadNotes();
    } catch (error) {
      console.error('Error approving note:', error);
    }
  };

  const handleMakeVisible = async (noteId: string) => {
    try {
      const response = await progressNotesAPI.makeNoteVisible(noteId);
      dispatch(updateNote(response.data));
      loadNotes();
    } catch (error) {
      console.error('Error making note visible:', error);
    }
  };

  const handleAddRecommendation = async () => {
    if (!selectedNote) return;

    try {
      const response = await recommendationsAPI.createRecommendation({
        ...recommendationForm,
        noteId: selectedNote.id,
      });
      dispatch(addRecommendation(response.data));

      // Create a corresponding task for the recommendation
      try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Default due date 7 days from now

        await tasksAPI.createTask({
          patientId,
          assignedTo: userId, // Assign to the current provider
          createdBy: userId,
          institutionId: 'default_institution', // Should be from user context
          title: `Follow up: ${recommendationForm.title}`,
          description: `Recommendation: ${recommendationForm.description}. Please follow up with the patient regarding this ${recommendationForm.type} recommendation.`,
          category: 'followup',
          priority: recommendationForm.priority,
          status: 'pending',
          dueDate: dueDate.toISOString(),
          relatedRecommendationId: response.data.id,
          tags: [recommendationForm.type, 'recommendation', 'followup'],
        });
      } catch (taskError) {
        console.error('Error creating task from recommendation:', taskError);
      }

      // Create notification for the patient
      try {
        await notificationAPI.createNotification({
          userId: patientId,
          type: 'recommendation',
          title: `New ${recommendationForm.type} recommendation`,
          message: `${recommendationForm.title}: ${recommendationForm.description}`,
          relatedId: response.data.id,
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      setRecommendationForm({
        type: 'lifestyle',
        title: '',
        description: '',
        priority: 'medium',
      });
      loadRecommendations();
    } catch (error) {
      console.error('Error adding recommendation:', error);
    }
  };

  const handleCompleteRecommendation = async (recommendationId: string) => {
    try {
      const response = await recommendationsAPI.completeRecommendation(recommendationId);
      dispatch(completeRecommendation(recommendationId));
      loadRecommendations();
    } catch (error) {
      console.error('Error completing recommendation:', error);
    }
  };

  const getCategoryIcon = (category: ProgressNote['category']) => {
    switch (category) {
      case 'consultation': return <MedicalServices />;
      case 'recommendation': return <CheckCircle />;
      case 'alert': return <Schedule />;
      case 'followup': return <Schedule />;
      default: return <MedicalServices />;
    }
  };

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'lifestyle': return <Restaurant />;
      case 'medication': return <LocalHospital />;
      case 'exercise': return <FitnessCenter />;
      case 'diet': return <Restaurant />;
      case 'monitoring': return <MonitorHeart />;
      default: return <CheckCircle />;
    }
  };

  const getStatusColor = (status: ProgressNote['status']) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'approved': return 'info';
      case 'visible': return 'success';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Progress Notes & Recommendations
        </Typography>
        {userRole === 'provider' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNote}
            size="small"
          >
            Add Note
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Notes List */}
      <Stack spacing={2} mb={3}>
        {notes.map((note) => (
          <Card key={note.id} sx={{ '&:hover': { boxShadow: 2 } }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {getCategoryIcon(note.category)}
                    <Typography variant="h6">{note.title}</Typography>
                    <Chip
                      label={note.status}
                      color={getStatusColor(note.status)}
                      size="small"
                    />
                    <Chip
                      label={note.category}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {format(note.createdAt.toDate ? note.createdAt.toDate() : new Date(note.createdAt), 'MMM dd, yyyy')}
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <> • Updated {format(note.updatedAt.toDate ? note.updatedAt.toDate() : new Date(note.updatedAt), 'MMM dd, yyyy')}</>
                    )}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                  </Typography>
                  {note.tags.length > 0 && (
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      {note.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </Box>
                {userRole === 'provider' && (
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditNote(note)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    {note.status === 'draft' && (
                      <Tooltip title="Approve">
                        <IconButton size="small" onClick={() => handleApproveNote(note.id)}>
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    {note.status === 'approved' && (
                      <Tooltip title="Make Visible to Patient">
                        <IconButton size="small" onClick={() => handleMakeVisible(note.id)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>

              {/* Recommendations for this note */}
              {recommendations.filter(r => r.noteId === note.id).length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {recommendations
                      .filter(r => r.noteId === note.id)
                      .map((rec) => (
                        <ListItem key={rec.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getRecommendationIcon(rec.type)}
                                <Typography variant="body2" fontWeight="bold">
                                  {rec.title}
                                </Typography>
                                <Chip
                                  label={rec.priority}
                                  color={getPriorityColor(rec.priority)}
                                  size="small"
                                />
                                {rec.status === 'completed' && (
                                  <Chip label="Completed" color="success" size="small" />
                                )}
                              </Box>
                            }
                            secondary={rec.description}
                          />
                          {userRole === 'provider' && rec.status !== 'completed' && (
                            <ListItemSecondaryAction>
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    onChange={() => handleCompleteRecommendation(rec.id)}
                                  />
                                }
                                label="Complete"
                              />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {notes.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No progress notes yet.
            {userRole === 'provider' && ' Click "Add Note" to create the first note.'}
          </Typography>
        </Box>
      )}

      {/* Create/Edit Note Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNote ? 'Edit Progress Note' : 'Create Progress Note'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={noteForm.category}
                onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as ProgressNote['category'] })}
                label="Category"
              >
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="recommendation">Recommendation</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
                <MenuItem value="followup">Follow-up</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={noteForm.visibility}
                onChange={(e) => setNoteForm({ ...noteForm, visibility: e.target.value as ProgressNote['visibility'] })}
                label="Visibility"
              >
                <MenuItem value="private">Private (Doctors only)</MenuItem>
                <MenuItem value="shared">Shared (With patient)</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Content"
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              multiline
              rows={6}
              fullWidth
              required
              placeholder="Enter detailed progress notes..."
            />

            <TextField
              label="Tags (comma-separated)"
              value={noteForm.tags.join(', ')}
              onChange={(e) => setNoteForm({
                ...noteForm,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              })}
              fullWidth
              placeholder="e.g., pregnancy, checkup, concerns"
            />

            {/* Add Recommendation Section */}
            {editingNote && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Add Recommendation</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={recommendationForm.type}
                        onChange={(e) => setRecommendationForm({
                          ...recommendationForm,
                          type: e.target.value as Recommendation['type']
                        })}
                        label="Type"
                      >
                        <MenuItem value="lifestyle">Lifestyle</MenuItem>
                        <MenuItem value="medication">Medication</MenuItem>
                        <MenuItem value="exercise">Exercise</MenuItem>
                        <MenuItem value="diet">Diet</MenuItem>
                        <MenuItem value="monitoring">Monitoring</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Recommendation Title"
                      value={recommendationForm.title}
                      onChange={(e) => setRecommendationForm({
                        ...recommendationForm,
                        title: e.target.value
                      })}
                      fullWidth
                    />

                    <TextField
                      label="Description"
                      value={recommendationForm.description}
                      onChange={(e) => setRecommendationForm({
                        ...recommendationForm,
                        description: e.target.value
                      })}
                      multiline
                      rows={3}
                      fullWidth
                    />

                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={recommendationForm.priority}
                        onChange={(e) => setRecommendationForm({
                          ...recommendationForm,
                          priority: e.target.value as Recommendation['priority']
                        })}
                        label="Priority"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="outlined"
                      onClick={handleAddRecommendation}
                      disabled={!recommendationForm.title || !recommendationForm.description}
                    >
                      Add Recommendation
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            disabled={!noteForm.title || !noteForm.content}
          >
            {editingNote ? 'Update' : 'Create'} Note
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProgressNotes;