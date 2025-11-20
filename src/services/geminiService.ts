import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAI, getGenerativeModel, GoogleAIBackend } from '@firebase/ai';
import app from '../firebase';
import { geminiConfig } from '../firebase';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private ai: any = null;
  private model: any = null;
  private chat: any = null;
  private useFirebaseAI: boolean = false;

  constructor() {
    this.initializeAI();
  }

  private async initializeAI() {
    try {
      // Check if we should use Firebase AI Logic
      this.useFirebaseAI = geminiConfig.useFirebaseAI && !!app;

      if (this.useFirebaseAI && app) {
        // Initialize Firebase AI Logic with Gemini Developer API backend
        this.ai = getAI(app, { backend: new GoogleAIBackend() });

        // Create a GenerativeModel instance with Gemini 2.0 Flash
        this.model = getGenerativeModel(this.ai, {
          model: 'gemini-2.0-flash-exp',
          systemInstruction: this.getSystemInstruction()
        });
      } else {
        // Fallback to direct Google Generative AI
        const apiKey = geminiConfig.apiKey || process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY environment variable.');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: this.getSystemInstruction()
        });
      }

      // Initialize chat with history
      await this.initializeChat();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      // Continue with fallback responses
    }
  }

  private getSystemInstruction(): string {
    return `You are Elsa, a compassionate and knowledgeable AI pregnancy assistant.
    Your role is to provide helpful, evidence-based information about pregnancy, fetal development, and maternal health.

    Guidelines:
    - Always be supportive, empathetic, and encouraging
    - Provide accurate, medical information based on established guidelines
    - Never give specific medical diagnoses or treatment recommendations
    - Always advise consulting healthcare providers for personal medical concerns
    - Focus on general wellness, education, and when to seek professional help
    - Use simple, clear language that pregnant women can easily understand
    - Be culturally sensitive and inclusive

    When discussing fetal movements/kicks:
    - Normal fetal movement patterns vary by gestational age
    - Generally, 10+ kicks in 2 hours is considered reassuring
    - Decreased fetal movement should prompt immediate medical attention
    - Always err on the side of caution and recommend professional evaluation

    Remember: You are not a replacement for professional medical care.`;
  }

  private async initializeChat() {
    try {
      if (this.useFirebaseAI && this.model) {
        // Firebase AI Logic chat initialization
        this.chat = await this.model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: 'Hello, I\'m pregnant and have questions about my baby\'s health.' }],
            },
            {
              role: 'model',
              parts: [{ text: 'Hi! I\'m Elsa, your AI pregnancy assistant. I\'m here to support you throughout your pregnancy journey. I can provide general information about pregnancy wellness and fetal development, but remember that I\'m not a substitute for professional medical advice. What would you like to know?' }],
            },
          ],
        });
      } else if (this.genAI && this.model) {
        // Direct Google AI chat initialization
        this.chat = this.model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: 'Hello, I\'m pregnant and have questions about my baby\'s health.' }],
            },
            {
              role: 'model',
              parts: [{ text: 'Hi! I\'m Elsa, your AI pregnancy assistant. I\'m here to support you throughout your pregnancy journey. I can provide general information about pregnancy wellness and fetal development, but remember that I\'m not a substitute for professional medical advice. What would you like to know?' }],
            },
          ],
        });
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      // Continue without chat history
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      let aiResponse: string;

      if (this.useFirebaseAI && this.chat) {
        // Firebase AI Logic response handling
        const result = await this.chat.sendMessage(message);
        const response = result.response;
        aiResponse = response.text();
      } else if (this.genAI && this.chat) {
        // Direct Google AI response handling
        const result = await this.chat.sendMessage(message);
        const response = await result.response;
        aiResponse = response.text();
      } else {
        // No AI service available, use fallback
        return this.getFallbackResponse(message);
      }

      // Add medical disclaimer to all AI responses
      const disclaimer = '\n\n⚠️ IMPORTANT: This is general information only and not a substitute for professional medical advice. Please consult your healthcare provider for personalized guidance.';
      return aiResponse + disclaimer;
    } catch (error) {
      console.error('AI service error:', error);
      return this.getFallbackResponse(message);
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('kick') || lowerMessage.includes('movement') || lowerMessage.includes('move')) {
      return 'Fetal movements are a great sign of your baby\'s health! Try counting kicks daily. A normal pattern is usually 10 kicks within 2 hours. If you notice fewer movements, contact your healthcare provider immediately.';
    } else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
      return 'Any unusual pain during pregnancy should be evaluated by your doctor. Some discomfort is normal, but severe or persistent pain needs medical attention. Please describe your symptoms to your healthcare provider.';
    } else if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return 'A balanced diet is crucial during pregnancy. Focus on fruits, vegetables, lean proteins, and whole grains. Stay hydrated and consider consulting a nutritionist for personalized advice.';
    } else {
      return 'I\'m here to help! For specific medical advice, please consult with your healthcare provider. I can provide general information about pregnancy wellness and fetal development.';
    }
  }

  // Reset conversation if needed
  resetChat() {
    try {
      if (this.useFirebaseAI && this.model) {
        this.chat = this.model.startChat({
          history: [],
        });
      } else if (this.genAI && this.model) {
        this.chat = this.model.startChat({
          history: [],
        });
      }
    } catch (error) {
      console.error('Failed to reset chat:', error);
    }
  }
}