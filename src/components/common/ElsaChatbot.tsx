import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Chat,
  Send,
  Close,
  SmartToy,
  Person,
  RestaurantMenu,
  PregnantWoman,
  MedicalServices,
} from '@mui/icons-material';
import { GeminiService } from '../../services/geminiService';
import { FetalHealthService } from '../../services/fetalHealthService';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ElsaChatbotProps {
  open: boolean;
  onClose: () => void;
}

const ElsaChatbot: React.FC<ElsaChatbotProps> = ({ open, onClose }) => {
   const [messages, setMessages] = useState<Message[]>([]);
   const [inputValue, setInputValue] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
   const [fetalHealthService, setFetalHealthService] = useState<FetalHealthService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      addWelcomeMessage();
      initializeGeminiService();
      initializeFetalHealthService();
    }
  }, [open]);

  const initializeGeminiService = async () => {
    try {
      console.log('Initializing Gemini service...');
      // Initialize Gemini service with Firebase AI Logic or direct API
      const service = new GeminiService();
      setGeminiService(service);
      console.log('Gemini service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      // Still set the service so fallback responses work
      setGeminiService(null);
    }
  };

  const initializeFetalHealthService = async () => {
    try {
      const service = new FetalHealthService();
      await service.initialize();
      setFetalHealthService(service);
    } catch (error) {
      console.error('Failed to initialize Fetal Health service:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addWelcomeMessage = () => {
    const aiStatus = geminiService ? 'AI-powered' : 'basic';
    const welcomeMessage: Message = {
      text: `Hi! I'm Elsa, your ${aiStatus} health assistant. I'm here to support you throughout your pregnancy journey. Feel free to ask me anything about pregnancy, health, or wellness!

${fetalHealthService ? '✅ Fetal health AI analysis available' : '⚠️ Fetal health analysis initializing...'}
${geminiService ? '✅ AI conversations enabled' : 'ℹ️ Using basic responses (add Gemini API key for AI chat)'}

Try asking: "I felt 8 kicks in 2 hours" for AI fetal health analysis!`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const quickQuestions = [
    'How often should I feel my baby move?',
    'What foods should I eat during pregnancy?',
    'When should I call my doctor?',
    'How much weight should I gain?',
    'What exercises are safe during pregnancy?',
    'How can I track my baby\'s kicks?',
    'What are signs of labor?',
    'How to manage morning sickness?',
  ];

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      let response = '';

      // Check if this is a fetal health related query
      if (isFetalHealthQuery(text)) {
        console.log('Detected fetal health query, using ML model...');
        response = await getFetalHealthResponse(text);
      } else if (geminiService) {
        console.log('Using Gemini AI for response...');
        // Use Gemini AI for intelligent responses
        response = await geminiService.sendMessage(text);
      } else {
        console.log('Using fallback responses (Gemini not available)...');
        // Fallback to basic responses if Gemini is not available
        response = getFallbackResponse(text);
      }

      const botMessage: Message = {
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback response
      const fallbackMessage: Message = {
        text: getFallbackResponse(text),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const isFetalHealthQuery = (userMessage: string): boolean => {
    const lowerMessage = userMessage.toLowerCase();
    const fetalHealthKeywords = [
      'kick', 'kicks', 'movement', 'movements', 'fetal', 'baby moving',
      'counting kicks', 'kick count', 'fetal movement', 'baby kicks',
      'how many kicks', 'kick pattern', 'reduced kicks', 'fewer kicks'
    ];

    return fetalHealthKeywords.some((keyword) => lowerMessage.includes(keyword));
  };

  const getFetalHealthResponse = async (userMessage: string): Promise<string> => {
    try {
      // Extract kick count and duration from user message if possible
      const kickData = extractKickData(userMessage);

      if (kickData.kickCount && kickData.duration && fetalHealthService) {
        // User provided specific data - use ML model for analysis
        const assessment = await fetalHealthService.assessFetalHealth(
          kickData.kickCount,
          kickData.duration,
          28 // TODO: Get from user profile
        );

        return formatFetalHealthResponse(assessment, kickData);
      } else {
        // General fetal health question - provide guidance
        return getGeneralFetalHealthGuidance(userMessage);
      }
    } catch (e) {
      console.error('Error getting fetal health response:', e);
      return getFallbackFetalHealthResponse(userMessage);
    }
  };

  const extractKickData = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    let kickCount: number | null = null;
    let duration: number | null = null;

    // Extract kick count (look for numbers followed by kick/kicks)
    const kickRegex = /(\\d+)\\s*(?:kick|kicks)/;
    const kickMatch = lowerMessage.match(kickRegex);
    if (kickMatch) {
      kickCount = parseInt(kickMatch[1]);
    }

    // Extract duration (look for time patterns)
    const durationRegex = /(\\d+)\\s*(?:hour|hours|hr|hrs|minute|minutes|min|mins)/;
    const durationMatch = lowerMessage.match(durationRegex);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      if (unit.includes('hour') || unit.includes('hr')) {
        duration = value * 60; // Convert to minutes
      } else {
        duration = value;
      }
    }

    return { kickCount, duration };
  };

  const formatFetalHealthResponse = (assessment: any, kickData: any): string => {
    const kickCount = kickData.kickCount;
    const duration = kickData.duration;

    let statusEmoji: string;
    let statusText: string;

    switch (assessment.predictedClass) {
      case 0:
        statusEmoji = '✅';
        statusText = 'Normal fetal activity detected';
        break;
      case 1:
        statusEmoji = '⚠️';
        statusText = 'Suspect fetal activity - monitor closely';
        break;
      case 2:
        statusEmoji = '🚨';
        statusText = 'Concerning fetal activity - contact healthcare provider';
        break;
      default:
        statusEmoji = 'ℹ️';
        statusText = 'Fetal activity assessment completed';
    }

    const confidence = (assessment.confidence * 100).toFixed(1);

    return `${statusEmoji} **AI Fetal Health Analysis**

You reported: ${kickCount} kicks in ${duration} minutes

**Assessment:** ${statusText}
**AI Confidence:** ${confidence}%

${assessment.message}

**Recommendation:** ${assessment.recommendation}

⚠️ **IMPORTANT:** This is general information only and not a substitute for professional medical advice. Please consult your healthcare provider for personalized guidance.

Would you like me to help you track your kick patterns or explain more about fetal movement monitoring?`;
  };

  const getGeneralFetalHealthGuidance = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('how many') || lowerMessage.includes('normal')) {
      return `🤰 **Fetal Movement Monitoring Guide**

**Normal fetal activity typically includes:**
• 10+ kicks within 2 hours when you're active
• Movements should be felt regularly throughout the day
• Patterns may vary but should be consistent

**When to be concerned:**
• Fewer than 10 kicks in 2 hours
• Sudden decrease in movement
• No movement for 12+ hours

**AI-Powered Tracking:** Use our kick counter feature to get personalized AI analysis of your baby's movement patterns. Our ML model, trained on thousands of fetal health cases, can help assess if your kick counts are within normal ranges.

Would you like to start a kick counting session?`;
    } else if (lowerMessage.includes('reduced') || lowerMessage.includes('fewer') || lowerMessage.includes('less')) {
      return `⚠️ **Reduced Fetal Movement**

If you're experiencing reduced fetal movements, please:

1. **Try the "Kick Count Test":**
   • Lie down on your left side
   • Count kicks for 2 hours
   • Normal: 10+ kicks

2. **Contact your healthcare provider immediately if:**
   • Fewer than 10 kicks in 2 hours
   • No movement for 12+ hours
   • Sudden change in movement pattern

3. **Use our AI-powered kick counter** for personalized assessment based on medical data from thousands of pregnancies.

**Remember:** When in doubt, always contact your healthcare provider. Better safe than sorry!

Would you like me to guide you through a kick counting session?`;
    } else {
      return `👶 **Fetal Health & Movement**

Fetal movements are an important indicator of your baby's well-being. Our AI system can help you monitor and analyze kick patterns using machine learning trained on extensive medical data.

**Key points about fetal movement:**
• Usually felt around 18-20 weeks
• Should increase in frequency and strength
• Each baby has their own unique pattern
• Regular monitoring is recommended

**AI Analysis Available:** Our kick counter feature uses advanced ML to assess fetal health based on movement patterns, providing personalized insights similar to medical CTG analysis.

Would you like to learn more about kick counting or start tracking your baby's movements?`;
    }
  };

  const getFallbackFetalHealthResponse = (userMessage: string): string => {
    return `👶 **Fetal Movement Information**

Fetal movements are a great sign of your baby's health! Here's what you should know:

• **Normal activity:** Usually 10+ kicks within 2 hours
• **Daily monitoring:** Recommended for peace of mind
• **When to worry:** Fewer than 10 kicks in 2 hours, or no movement for 12+ hours

**AI Analysis:** Our kick counter feature provides AI-powered assessment of fetal health based on movement patterns.

⚠️ **Please note:** This is general information only. For specific concerns about fetal movement, please consult your healthcare provider immediately.

Would you like to start a kick counting session?`;
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
      return 'Any unusual pain during pregnancy should be evaluated by your doctor. Some discomfort is normal, but severe or persistent pain needs medical attention. Please describe your symptoms to your healthcare provider right away.';
    } else if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return 'A balanced diet is crucial during pregnancy. Focus on fruits, vegetables, lean proteins, and whole grains. Stay hydrated and consider consulting a nutritionist for personalized advice.';
    } else {
      return 'I\'m here to help! For specific medical advice, please consult with your healthcare provider. I can provide general information about pregnancy wellness and fetal development.';
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Fab
          color="secondary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: 3,
          }}
          onClick={() => {}}
        >
          <SmartToy />
        </Fab>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            maxHeight: '600px',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0A8D92 0%, #4FB3B7 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 3,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 60,
              height: 60,
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
            }}
          >
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/assets/Elsa.png`}
              alt="Elsa"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                console.log('Image failed to load:', e);
                // Fallback to SmartToy icon if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5M16 17H8v-2h8zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13"></path></svg>';
              }}
            />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Elsa
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Your AI Health Assistant
            </Typography>
          </Box>
          <Box flex={1} />
          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                    color: message.isUser ? 'white' : 'text.primary',
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body1">
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                      textAlign: message.isUser ? 'right' : 'left',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </Box>
            ))}

            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={`${process.env.PUBLIC_URL}/assets/Elsa.png`}
                    alt="Elsa"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      console.log('Image failed to load:', e);
                      // Fallback to SmartToy icon if image fails
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5M16 17H8v-2h8zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13"></path></svg>';
                    }}
                  />
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Elsa is typing...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Questions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <Chip
                    key={index}
                    label={question.length > 30 ? question.substring(0, 27) + '...' : question}
                    size="small"
                    variant="outlined"
                    onClick={() => handleQuickQuestion(question)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask Elsa anything about pregnancy..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                variant="outlined"
                size="small"
              />
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&:disabled': { bgcolor: 'grey.300' },
                }}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ElsaChatbot;