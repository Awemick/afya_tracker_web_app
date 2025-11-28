import React, { useState, useEffect } from 'react';
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
  Grid,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Fab,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  Schedule,
  PriorityHigh,
  CheckCircle,
  RadioButtonUnchecked,
  Notifications,
  Person,
  CalendarToday,
  FilterList,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Task, Reminder } from '../../types';
import {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  updateTaskStatus,
} from '../../store/slices/tasksSlice';
import { tasksAPI } from '../../services/api';

interface TaskReminderSystemProps {
  patientId?: string;
  userId?: string;
  userRole: 'patient' | 'provider' | 'admin';
  compact?: boolean;
}

const TaskReminderSystem: React.FC<TaskReminderSystemProps> = ({
  patientId,
  userRole,
  compact = false,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tasks, loading, error } = useSelector((state: RootState) => state.tasks);

  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'followup' as Task['category'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    reminderDate: '',
    assignedTo: '',
    tags: [] as string[],
    isRecurring: false,
    recurrencePattern: {
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
    },
  });

  useEffect(() => {
    loadTasks();
  }, [patientId]);

  const loadTasks = async () => {
    try {
      dispatch(fetchTasksStart());
      let response;

      if (patientId) {
        response = await tasksAPI.getTasks(patientId, 'patient');
      } else if (userRole === 'provider') {
        response = await tasksAPI.getTasks(user?.id || '', 'provider');
      } else {
        response = await tasksAPI.getInstitutionTasks('default_institution');
      }

      dispatch(fetchTasksSuccess(response.data));
    } catch (error) {
      console.error('Error loading tasks:', error);
      dispatch(fetchTasksFailure('Failed to load tasks'));
    }
  };

  const handleCreateTask = async () => {
    try {
      const newTask = {
        ...taskForm,
        patientId: patientId || '',
        createdBy: user?.id || '',
        institutionId: 'default_institution',
        status: 'pending' as Task['status'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await tasksAPI.createTask(newTask);
      dispatch(addTask(response.data));

      setCreateDialogOpen(false);
      resetTaskForm();
      setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
    } catch (error) {
      console.error('Error creating task:', error);
      setSnackbar({ open: true, message: 'Failed to create task', severity: 'error' });
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      const updates = {
        ...taskForm,
        updatedAt: new Date(),
      };

      const response = await tasksAPI.updateTask(selectedTask.id, updates);
      dispatch(updateTask(response.data));

      setEditDialogOpen(false);
      setSelectedTask(null);
      resetTaskForm();
      setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating task:', error);
      setSnackbar({ open: true, message: 'Failed to update task', severity: 'error' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.deleteTask(taskId);
      dispatch(deleteTask(taskId));
      setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({ open: true, message: 'Failed to delete task', severity: 'error' });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await tasksAPI.completeTask(taskId);
      dispatch(completeTask(taskId));
      setSnackbar({ open: true, message: 'Task completed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error completing task:', error);
      setSnackbar({ open: true, message: 'Failed to complete task', severity: 'error' });
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      dispatch(updateTaskStatus({ taskId, status }));
      await tasksAPI.updateTaskStatus(taskId, status);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      category: 'followup',
      priority: 'medium',
      dueDate: '',
      reminderDate: '',
      assignedTo: '',
      tags: [],
      isRecurring: false,
      recurrencePattern: {
        frequency: 'weekly',
        interval: 1,
      },
    });
  };

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'warning';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {task.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {task.description}
            </Typography>

            <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Chip
                label={task.category.replace('_', ' ')}
                size="small"
                variant="outlined"
              />
              <Chip
                label={task.priority}
                size="small"
                color={getPriorityColor(task.priority)}
                variant="outlined"
              />
              <Chip
                label={task.status.replace('_', ' ')}
                size="small"
                color={getStatusColor(task.status)}
              />
            </Box>

            {task.dueDate && (
              <Typography variant="body2" color="text.secondary">
                <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                Due: {new Date(task.dueDate.toDate ? task.dueDate.toDate() : task.dueDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          <Box display="flex" flexDirection="column" gap={1}>
            {userRole === 'provider' && task.status !== 'completed' && (
              <IconButton
                size="small"
                onClick={() => handleCompleteTask(task.id)}
                color="success"
              >
                <CheckCircle />
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={() => {
                setSelectedTask(task);
                setTaskForm({
                  title: task.title,
                  description: task.description,
                  category: task.category,
                  priority: task.priority,
                  dueDate: task.dueDate ? new Date(task.dueDate.toDate ? task.dueDate.toDate() : task.dueDate).toISOString().split('T')[0] : '',
                  reminderDate: task.reminderDate ? new Date(task.reminderDate.toDate ? task.reminderDate.toDate() : task.reminderDate).toISOString().split('T')[0] : '',
                  assignedTo: task.assignedTo,
                  tags: task.tags,
                  isRecurring: task.isRecurring,
                  recurrencePattern: task.recurrencePattern || { frequency: 'weekly', interval: 1 },
                });
                setEditDialogOpen(true);
              }}
            >
              <Edit />
            </IconButton>

            {userRole === 'provider' && (
              <IconButton
                size="small"
                onClick={() => handleDeleteTask(task.id)}
                color="error"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (compact) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Tasks & Reminders</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Task
          </Button>
        </Box>

        <List dense>
          {filteredTasks.slice(0, 5).map((task) => (
            <ListItem key={task.id}>
              <Checkbox
                checked={task.status === 'completed'}
                onChange={() => task.status !== 'completed' && handleCompleteTask(task.id)}
              />
              <ListItemText
                primary={task.title}
                secondary={`${task.category} • ${task.priority} priority`}
              />
              <ListItemSecondaryAction>
                <Chip
                  label={task.status}
                  size="small"
                  color={getStatusColor(task.status)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {filteredTasks.length > 5 && (
          <Typography variant="body2" color="text.secondary" align="center">
            And {filteredTasks.length - 5} more tasks...
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Task & Reminder System
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Task
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Tasks" />
        <Tab label="My Tasks" />
        <Tab label="Overdue" />
        <Tab label="Completed" />
      </Tabs>

      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filterPriority}
            label="Priority"
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Box>

      {filteredTasks.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary">
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first task to get started
          </Typography>
        </Box>
      )}

      {/* Create Task Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={taskForm.category}
                  label="Category"
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as Task['category'] })}
                >
                  <MenuItem value="followup">Follow-up</MenuItem>
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="test_results">Test Results</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '150px' }}
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />

              <TextField
                sx={{ flex: '1 1 200px', minWidth: '150px' }}
                label="Reminder Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskForm.reminderDate}
                onChange={(e) => setTaskForm({ ...taskForm, reminderDate: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={taskForm.category}
                  label="Category"
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as Task['category'] })}
                >
                  <MenuItem value="followup">Follow-up</MenuItem>
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="test_results">Test Results</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '150px' }}
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />

              <TextField
                sx={{ flex: '1 1 200px', minWidth: '150px' }}
                label="Reminder Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskForm.reminderDate}
                onChange={(e) => setTaskForm({ ...taskForm, reminderDate: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateTask} variant="contained">
            Update Task
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskReminderSystem;