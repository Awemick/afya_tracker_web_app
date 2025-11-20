import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import { Send, Person } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { messagingAPI } from '../../services/api';
import {
  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchConversationsFailure,
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addMessage,
} from '../../store/slices/messagingSlice';
import { Conversation, Message } from '../../types';

const MessagingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, messages, loading } = useSelector((state: RootState) => state.messaging);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;
    dispatch(fetchConversationsStart());
    try {
      const response = await messagingAPI.getConversations(user.id);
      dispatch(fetchConversationsSuccess(response.data));
    } catch (error) {
      dispatch(fetchConversationsFailure('Failed to load conversations'));
    }
  };

  const loadMessages = async (conversationId: string) => {
    dispatch(fetchMessagesStart());
    try {
      const response = await messagingAPI.getMessages(conversationId);
      dispatch(fetchMessagesSuccess({ conversationId, messages: response.data }));
    } catch (error) {
      dispatch(fetchMessagesFailure('Failed to load messages'));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageData = {
      conversationId: selectedConversation.id,
      senderId: user.id,
      senderRole: user.role,
      content: newMessage.trim(),
    };

    try {
      const response = await messagingAPI.sendMessage(messageData);
      dispatch(addMessage(response.data));
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentMessages = selectedConversation ? messages[selectedConversation.id] || [] : [];

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Conversations List */}
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>
          Conversations
        </Typography>
        <Divider />
        <List sx={{ overflow: 'auto', height: 'calc(100% - 60px)' }}>
          {conversations.map((conversation) => (
            <ListItem key={conversation.id} disablePadding>
              <ListItemButton
                selected={selectedConversation?.id === conversation.id}
                onClick={() => setSelectedConversation(conversation)}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Patient ${conversation.patientId}`}
                  secondary={conversation.lastMessage?.content || 'No messages yet'}
                  secondaryTypographyProps={{
                    noWrap: true,
                    style: { maxWidth: '200px' }
                  }}
                />
                {conversation.lastMessage && !conversation.lastMessage.read && (
                  <Chip label="New" size="small" color="primary" />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Chat with Patient {selectedConversation.patientId}
              </Typography>
            </Box>

            {/* Messages List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {currentMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      backgroundColor: message.senderId === user?.id ? 'primary.main' : 'grey.100',
                      color: message.senderId === user?.id ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  size="small"
                />
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagingPage;