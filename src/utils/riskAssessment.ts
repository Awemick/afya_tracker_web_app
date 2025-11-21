import { KickSession } from '../types';
import { GeminiService } from '../services/geminiService';

export const assessFetalRisk = (kickSessions: KickSession[]): 'low' | 'medium' | 'high' => {
  if (kickSessions.length === 0) return 'medium';

  // Get sessions from last 24 hours
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const recentSessions = kickSessions.filter(session =>
    new Date(session.date) >= last24Hours
  );

  if (recentSessions.length === 0) return 'medium';

  const totalKicks = recentSessions.reduce((sum, session) => sum + session.kickCount, 0);
  const averageKicks = totalKicks / recentSessions.length;

  // Thresholds based on medical guidelines (simplified)
  if (averageKicks < 5) return 'high';
  if (averageKicks < 10) return 'medium';
  return 'low';
};

export const shouldNotifyDoctor = (currentRisk: string, newRisk: string): boolean => {
  // Notify if risk increases
  const riskLevels = { low: 1, medium: 2, high: 3 };
  return riskLevels[newRisk as keyof typeof riskLevels] > riskLevels[currentRisk as keyof typeof riskLevels];
};

// AI-powered risk assessment with detailed analysis
export const assessFetalRiskWithAI = async (
  kickSessions: KickSession[],
  gestationalAge?: number,
  maternalFactors?: {
    age?: number;
    medicalHistory?: string[];
    currentSymptoms?: string[];
  }
): Promise<{
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  analysis: string;
  recommendations: string[];
  shouldConsultDoctor: boolean;
}> => {
  try {
    // Basic statistical analysis
    const basicRisk = assessFetalRisk(kickSessions);

    // Prepare data for AI analysis
    const kickData = kickSessions.slice(-10); // Last 10 sessions
    const analysisPrompt = `
Analyze fetal health based on kick count data and provide a comprehensive assessment.

Patient Data:
- Gestational Age: ${gestationalAge || 'Unknown'} weeks
- Recent Kick Sessions: ${JSON.stringify(kickData.map(s => ({
      date: s.date,
      kicks: s.kickCount,
      duration: s.duration
    })), null, 2)}
- Maternal Factors: ${JSON.stringify(maternalFactors || {}, null, 2)}

Current Basic Risk Assessment: ${basicRisk}

Please provide:
1. Overall risk level (low/medium/high)
2. Confidence percentage (0-100)
3. Detailed analysis explaining the assessment
4. Specific recommendations for the patient
5. Whether immediate medical consultation is needed

Format your response as JSON with keys: risk, confidence, analysis, recommendations, shouldConsultDoctor
`;

    const geminiService = new GeminiService();
    const aiResponse = await geminiService.sendMessage(analysisPrompt);

    // Try to parse AI response as JSON
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          risk: parsedResponse.risk || basicRisk,
          confidence: parsedResponse.confidence || 70,
          analysis: parsedResponse.analysis || 'AI analysis completed',
          recommendations: Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : [],
          shouldConsultDoctor: parsedResponse.shouldConsultDoctor || basicRisk === 'high'
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback');
    }

    // Fallback response
    return {
      risk: basicRisk,
      confidence: 70,
      analysis: `Based on your kick count data, the fetal activity appears to be ${basicRisk === 'low' ? 'within normal ranges' : basicRisk === 'medium' ? 'borderline' : 'below expected levels'}.`,
      recommendations: [
        'Continue monitoring kick counts daily',
        'Maintain a healthy diet and adequate rest',
        'Contact your healthcare provider if concerned'
      ],
      shouldConsultDoctor: basicRisk === 'high'
    };

  } catch (error) {
    console.error('AI risk assessment failed:', error);

    // Ultimate fallback to basic assessment
    const basicRisk = assessFetalRisk(kickSessions);
    return {
      risk: basicRisk,
      confidence: 50,
      analysis: 'Basic risk assessment completed. AI analysis unavailable.',
      recommendations: ['Continue regular monitoring', 'Consult healthcare provider for concerns'],
      shouldConsultDoctor: basicRisk === 'high'
    };
  }
};

// AI-powered symptom analysis
export const analyzeSymptomsWithAI = async (
  symptoms: string[],
  gestationalAge?: number,
  severity: 'mild' | 'moderate' | 'severe' = 'mild'
): Promise<{
  urgency: 'low' | 'medium' | 'high';
  analysis: string;
  recommendations: string[];
  shouldSeekCare: boolean;
}> => {
  try {
    const analysisPrompt = `
Analyze pregnancy symptoms and provide medical guidance.

Patient Information:
- Gestational Age: ${gestationalAge || 'Unknown'} weeks
- Symptoms: ${symptoms.join(', ')}
- Reported Severity: ${severity}

Please assess:
1. Urgency level (low/medium/high)
2. Medical analysis of symptoms
3. Specific recommendations
4. Whether immediate medical care is needed

Consider pregnancy-specific concerns and when symptoms warrant medical attention.

Format response as JSON with keys: urgency, analysis, recommendations, shouldSeekCare
`;

    const geminiService = new GeminiService();
    const aiResponse = await geminiService.sendMessage(analysisPrompt);

    // Try to parse AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          urgency: parsedResponse.urgency || 'medium',
          analysis: parsedResponse.analysis || 'Symptoms analyzed',
          recommendations: Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : [],
          shouldSeekCare: parsedResponse.shouldSeekCare || false
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse AI symptom analysis');
    }

    // Fallback response
    return {
      urgency: severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low',
      analysis: `Symptoms reported: ${symptoms.join(', ')}. Please monitor closely and consult healthcare provider if symptoms worsen.`,
      recommendations: [
        'Monitor symptoms closely',
        'Stay hydrated and rest',
        'Contact healthcare provider if symptoms persist or worsen'
      ],
      shouldSeekCare: severity === 'severe'
    };

  } catch (error) {
    console.error('AI symptom analysis failed:', error);

    return {
      urgency: 'medium',
      analysis: 'Unable to perform AI analysis. Please consult healthcare provider.',
      recommendations: ['Contact healthcare provider for symptom evaluation'],
      shouldSeekCare: true
    };
  }
};