import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export class GeminiService {
  private model: any = null;
  private chat: any = null;

  constructor() {
    this.initializeModel();
  }

  private initializeModel() {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
      });
      this.chat = this.model.startChat();
      console.log('Gemini model initialized successfully with: gemini-2.0-flash-lite');
    } catch (e) {
      console.error('Failed to initialize Gemini model:', e);
      // Will use fallback responses in sendMessage
    }
  }

  private detectLanguage(message: string): string {
    // Convert to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();

    // Swahili keywords and patterns
    const swahiliKeywords = [
      'habari', 'nzuri', 'asante', 'karibu', 'pole', 'samahani', 'tafadhali',
      'ndio', 'hapana', 'nini', 'wapi', 'lini', 'kwa nini', 'vipi',
      'mama', 'mtoto', 'ujauzito', 'mimba', 'kukimbia', 'kicheko',
      'chakula', 'maji', 'nyumba', 'shule', 'daktari', 'hospitali'
    ];

    // Check for Swahili characters (ng', ny, ch, sh, etc.)
    const swahiliChars = /ṅ|ṇ|ṅ|ṉ|ñ|ṅ|c|č|ç|ṣ|š|ş|ṭ|ṭ|ţ|ḍ|ḍ|đ|ṅ|ṅ|ñ|ṇ|ṇ|ñ|ṁ|ṁ|ṃ|ṅ|ṅ|ñ/g;
    const hasSwahiliChars = swahiliChars.test(lowerMessage);

    // Count Swahili keywords
    let swahiliWordCount = 0;
    for (const keyword of swahiliKeywords) {
      if (lowerMessage.includes(keyword)) {
        swahiliWordCount++;
      }
    }

    // Determine language
    if (hasSwahiliChars || swahiliWordCount >= 2) {
      return 'Swahili (Kiswahili)';
    } else {
      return 'English';
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      console.log('Sending message to Gemini API:', message.substring(0, Math.min(50, message.length)) + '...');

      if (!this.chat) {
        console.log('Chat session not initialized, initializing...');
        this.initializeModel();
      }

      // Detect language from user message
      const detectedLanguage = this.detectLanguage(message);
      console.log('Detected language:', detectedLanguage);

      // Include system instructions in the message for medical context
      const systemPrompt = `You are Elsa, a compassionate and knowledgeable AI pregnancy assistant. Your role is to provide helpful, evidence-based information about pregnancy, fetal development, and maternal health.

Guidelines:
- Always be supportive, empathetic, and encouraging
- Provide accurate, medical information based on established guidelines
- Never give specific medical diagnoses or treatment recommendations
- Always advise consulting healthcare providers for personal medical concerns
- Focus on general wellness, education, and when to seek professional help
- Use simple, clear language that pregnant women can easily understand
- Be culturally sensitive and inclusive

LANGUAGE INSTRUCTION: The user is asking in ${detectedLanguage}. You MUST respond in ${detectedLanguage}. Use appropriate medical terminology in that language. If the user asks in Swahili, respond in Swahili. If they ask in English, respond in English.

When discussing fetal movements/kicks:
- Normal fetal movement patterns vary by gestational age
- Generally, 10+ kicks in 2 hours is considered reassuring
- Decreased fetal movement should prompt immediate medical attention
- Always err on the side of caution and recommend professional evaluation

Remember: You are not a replacement for professional medical care.

User question: ${message}

Please provide a helpful, accurate response following the guidelines above. Respond in ${detectedLanguage}.`;

      console.log('Sending request to Gemini API...');
      const result = await this.chat.sendMessage(systemPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      if (!aiResponse || aiResponse.trim().length === 0) {
        console.log('Gemini API returned empty response');
        throw new Error('Empty response from API');
      }

      console.log('Gemini API response received successfully');
      console.log('Using Gemini AI response');

      // Add medical disclaimer to all AI responses
      const disclaimer = '\n\n⚠️ IMPORTANT: This is general information only and not a substitute for professional medical advice. Please consult your healthcare provider for personalized guidance.';
      return aiResponse + disclaimer;

    } catch (error) {
      console.error('Gemini API error:', error);
      console.log('Falling back to offline chatbot and rule-based responses');
      const detectedLanguage = this.detectLanguage(message);
      return this.getFallbackResponse(message, detectedLanguage);
    }
  }

  private getFallbackResponse(message: string, language: string = 'English'): string {
    const lowerMessage = message.toLowerCase();
    const isSwahili = language.includes('Swahili');

    if (lowerMessage.includes('kick') || lowerMessage.includes('movement') || lowerMessage.includes('move') ||
        lowerMessage.includes('patada') || lowerMessage.includes('harakati') || lowerMessage.includes('mtoto anasonga')) {
      if (isSwahili) {
        return 'Harakati za mtoto mimba ni ishara nzuri ya afya ya mtoto wako! Jaribu kuhesabu mipigo kila siku. Mfumo wa kawaida kwa kawaida ni mipigo 10 ndani ya saa 2. Ukiona harakati chache, wasiliana na daktari wako mara moja.';
      }
      return 'Fetal movements are a great sign of your baby\'s health! Try counting kicks daily. A normal pattern is usually 10 kicks within 2 hours. If you notice fewer movements, contact your healthcare provider immediately.';
    } else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache') ||
        lowerMessage.includes('maumivu') || lowerMessage.includes('uchungu')) {
      if (isSwahili) {
        return 'Maumivu yoyote yasiyo ya kawaida wakati wa ujauzito yanapaswa kutathminiwa na daktari wako. Baadhi ya maumivu ni ya kawaida, lakini maumivu makali au ya kuendelea yanahitaji uangalizi wa matibabu. Tafadhali elezea dalili zako kwa daktari wako mara moja.';
      }
      return 'Any unusual pain during pregnancy should be evaluated by your doctor. Some discomfort is normal, but severe or persistent pain needs medical attention. Please describe your symptoms to your healthcare provider right away.';
    } else if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat') ||
        lowerMessage.includes('chakula') || lowerMessage.includes('kula')) {
      if (isSwahili) {
        return 'Chakula cha usawa ni muhimu sana wakati wa ujauzito. Zingatia matunda, mboga, protini nyepesi, na nafaka kamili. Kunywa maji mengi na fikiria kushauriana na mtaalamu wa lishe kwa ushauri wa kibinafsi.';
      }
      return 'A balanced diet is crucial during pregnancy. Focus on fruits, vegetables, lean proteins, and whole grains. Stay hydrated and consider consulting a nutritionist for personalized advice.';
    } else {
      if (isSwahili) {
        return 'Niko hapa kukusaidia! Kwa ushauri maalum wa matibabu, tafadhali shauriana na daktari wako. Ninaweza kutoa taarifa za jumla kuhusu ustawi wa ujauzito na maendeleo ya mtoto.';
      }
      return 'I\'m here to help! For specific medical advice, please consult with your healthcare provider. I can provide general information about pregnancy wellness and fetal development.';
    }
  }

  resetChat() {
    try {
      this.chat = this.model.startChat();
      console.log('Chat session reset successfully');
    } catch (e) {
      console.error('Failed to reset chat session:', e);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Gemini API connection...');
      const response = await this.sendMessage('Hello');
      const isWorking = response.includes('Elsa') || !response.includes('fallback');
      console.log('Gemini API test result:', isWorking);
      return isWorking;
    } catch (e) {
      console.error('Gemini API connection test failed:', e);
      return false;
    }
  }
}