import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, Reminder } from '../../types';

interface TasksState {
  tasks: Task[];
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  reminders: [],
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Task CRUD operations
    fetchTasksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      state.loading = false;
      state.tasks = action.payload;
      state.error = null;
    },
    fetchTasksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    completeTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
      }
    },
    updateTaskStatus: (state, action: PayloadAction<{ taskId: string; status: Task['status'] }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
        if (action.payload.status === 'completed') {
          task.completedAt = new Date();
        }
        task.updatedAt = new Date();
      }
    },

    // Reminder operations
    fetchRemindersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRemindersSuccess: (state, action: PayloadAction<Reminder[]>) => {
      state.loading = false;
      state.reminders = action.payload;
      state.error = null;
    },
    fetchRemindersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addReminder: (state, action: PayloadAction<Reminder>) => {
      state.reminders.push(action.payload);
    },
    updateReminder: (state, action: PayloadAction<Reminder>) => {
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload.id);
      if (index !== -1) {
        state.reminders[index] = action.payload;
      }
    },
    deleteReminder: (state, action: PayloadAction<string>) => {
      state.reminders = state.reminders.filter(reminder => reminder.id !== action.payload);
    },
    markReminderSent: (state, action: PayloadAction<string>) => {
      const reminder = state.reminders.find(r => r.id === action.payload);
      if (reminder) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
      }
    },

    // Bulk operations
    bulkUpdateTasks: (state, action: PayloadAction<Task[]>) => {
      action.payload.forEach(updatedTask => {
        const index = state.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
      });
    },

    // Clear operations
    clearTasks: (state) => {
      state.tasks = [];
      state.reminders = [];
      state.error = null;
    },
  },
});

export const {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  updateTaskStatus,
  fetchRemindersStart,
  fetchRemindersSuccess,
  fetchRemindersFailure,
  addReminder,
  updateReminder,
  deleteReminder,
  markReminderSent,
  bulkUpdateTasks,
  clearTasks,
} = tasksSlice.actions;

export default tasksSlice.reducer;
export {};