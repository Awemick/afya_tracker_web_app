import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, Conversation } from '../../types';

interface MessagingState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  loading: boolean;
  error: string | null;
}

const initialState: MessagingState = {
  conversations: [],
  messages: {},
  loading: false,
  error: null,
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    fetchConversationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchConversationsSuccess: (state, action: PayloadAction<Conversation[]>) => {
      state.loading = false;
      state.conversations = action.payload;
      state.error = null;
    },
    fetchConversationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchMessagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
      state.loading = false;
      state.messages[action.payload.conversationId] = action.payload.messages;
      state.error = null;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(action.payload);
      // Update conversation's last message
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = action.payload;
        conversation.updatedAt = action.payload.timestamp;
      }
    },
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      // Find and mark message as read
      Object.values(state.messages).forEach(messages => {
        const message = messages.find(m => m.id === action.payload);
        if (message) {
          message.read = true;
        }
      });
    },
  },
});

export const {
  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchConversationsFailure,
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addMessage,
  markMessageAsRead,
} = messagingSlice.actions;

export default messagingSlice.reducer;