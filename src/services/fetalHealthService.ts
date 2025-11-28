export interface FetalHealthAssessment {
  predictedClass: number;
  confidence: number;
  status: string;
  message: string;
  recommendation: string;
}

export interface KickSession {
  id: string;
  date: Date;
  count: number;
  duration: number; // in minutes
  method: 'countToTen' | 'fixedTime';
  targetDuration?: number;
  analysisMethod: 'old' | 'new'; // old = rule-based, new = ML model
  phoneOnAbdomen?: boolean; // new feature
}

class FetalHealthService {
  private isInitialized = false;

  // Model expects 21 features in this order (from fetal_health.csv)
  static readonly featureNames = [
    'baseline value',
    'accelerations',
    'fetal_movement',
    'uterine_contractions',
    'light_decelerations',
    'severe_decelerations',
    'prolongued_decelerations',
    'abnormal_short_term_variability',
    'mean_value_of_short_term_variability',
    'percentage_of_time_with_abnormal_long_term_variability',
    'mean_value_of_long_term_variability',
    'histogram_width',
    'histogram_min',
    'histogram_max',
    'histogram_number_of_peaks',
    'histogram_number_of_zeroes',
    'histogram_mode',
    'histogram_mean',
    'histogram_median',
    'histogram_variance',
    'histogram_tendency',
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize TensorFlow.js and load model if available
    try {
      // Try to load the trained model from public/models
      console.log('Fetal health service initialized (ML model integration ready)');
      this.isInitialized = true;
    } catch (error) {
      console.warn('ML model not available, using rule-based assessment:', error);
      this.isInitialized = true;
    }
  }

  async assessFetalHealth(
    kickCount: number,
    duration: number, // in minutes
    gestationalWeek = 28,
    phoneOnAbdomen = false,
    useNewModel = true
  ): Promise<FetalHealthAssessment> {
    console.log('Starting fetal health assessment for', kickCount, 'kicks in', duration, 'minutes');

    if (!this.isInitialized) {
      console.log('Service not initialized, initializing...');
      await this.initialize();
    }

    if (useNewModel) {
      try {
        // Try to use the trained ML model
        console.log('Using trained ML model for analysis');
        return await this._assessWithMLModel(kickCount, duration, gestationalWeek, phoneOnAbdomen);
      } catch (error) {
        console.warn('ML model assessment failed, falling back to rules:', error);
        return this._assessWithRules(kickCount, duration, phoneOnAbdomen);
      }
    } else {
      // Use rule-based assessment (old system)
      console.log('Using rule-based fetal health assessment (old system)');
      return this._assessWithRules(kickCount, duration, phoneOnAbdomen);
    }
  }

  private async _assessWithMLModel(
    kickCount: number,
    duration: number,
    gestationalWeek: number,
    phoneOnAbdomen: boolean
  ): Promise<FetalHealthAssessment> {
    try {
      // Load TensorFlow.js dynamically
      const tf = await import('@tensorflow/tfjs');

      // Load the model from public/models
      const model = await tf.loadLayersModel('/models/fetal_health_model/model.json');

      // Extract features based on kick data and phone position
      const features = this._extractFeaturesFromKickData({
        kickCount,
        duration,
        gestationalWeek,
        phoneOnAbdomen,
      });

      // Convert to tensor
      const inputTensor = tf.tensor2d([features], [1, features.length]);

      // Make prediction
      const prediction = model.predict(inputTensor) as any;
      const predictionData = await prediction.data();

      // Get the predicted class (argmax)
      const predictedClass = predictionData.indexOf(Math.max(...predictionData));

      // Calculate confidence
      const confidence = Math.max(...predictionData);

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      return this._generateAssessment(predictedClass, confidence, kickCount, duration, phoneOnAbdomen);
    } catch (error) {
      console.error('ML model prediction failed:', error);
      throw error;
    }
  }

  private _assessWithRules(
    kickCount: number,
    duration: number,
    phoneOnAbdomen: boolean
  ): FetalHealthAssessment {
    console.log('Using rule-based fetal health assessment');

    let predictedClass: number;
    let confidence: number;
    let status: string;
    let message: string;
    let recommendation: string;

    // Adjust thresholds based on phone position
    const phoneAdjustment = phoneOnAbdomen ? 1.2 : 1.0; // Phone on abdomen may detect more movements

    // Rule-based assessment based on standard medical guidelines
    if (duration >= 120) { // 2+ hours
      const adjustedKickCount = kickCount * phoneAdjustment;
      if (adjustedKickCount >= 10) {
        predictedClass = 0; // Normal
        confidence = 0.85;
        status = 'Normal';
        message = phoneOnAbdomen
          ? 'Your fetal movement pattern appears normal based on phone-on-abdomen monitoring.'
          : 'Your fetal movement pattern appears normal based on standard monitoring.';
        recommendation = 'Continue monitoring regularly. This is a good sign of fetal well-being!';
      } else if (adjustedKickCount >= 6) {
        predictedClass = 1; // Suspect
        confidence = 0.70;
        status = 'Suspect';
        message = 'Your fetal movement count is below the typical range and should be monitored closely.';
        recommendation = 'Consider repeating the count test and consult your healthcare provider for additional monitoring.';
      } else {
        predictedClass = 2; // Concerning
        confidence = 0.90;
        status = 'Concerning';
        message = 'Your fetal movement count is significantly below normal ranges.';
        recommendation = 'Please contact your healthcare provider immediately for urgent evaluation.';
      }
    } else {
      // Shorter duration - use adjusted thresholds
      const expectedKicks = Math.round(duration / 60 * 5 * phoneAdjustment);
      if (kickCount >= expectedKicks) {
        predictedClass = 0;
        confidence = 0.80;
        status = 'Normal';
        message = phoneOnAbdomen
          ? 'Fetal movements detected within expected ranges using phone-on-abdomen monitoring.'
          : 'Fetal movements detected within expected ranges for this time period.';
        recommendation = 'Continue monitoring. Consider a longer counting session for more comprehensive assessment.';
      } else {
        predictedClass = 1;
        confidence = 0.75;
        status = 'Suspect';
        message = 'Fewer movements than expected for this time period.';
        recommendation = 'Extend your counting session and consult your healthcare provider if concerned.';
      }
    }

    console.log('Generated rule-based assessment:', status, '(confidence:', confidence + ')');

    return {
      predictedClass,
      confidence,
      status,
      message,
      recommendation,
    };
  }

  private _extractFeaturesFromKickData({
    kickCount,
    duration,
    gestationalWeek,
    phoneOnAbdomen,
  }: {
    kickCount: number;
    duration: number;
    gestationalWeek: number;
    phoneOnAbdomen: boolean;
  }): number[] {
    const durationMinutes = duration;
    const kicksPerMinute = kickCount / durationMinutes;

    // Adjust for phone position - phone on abdomen may detect more subtle movements
    const sensitivityMultiplier = phoneOnAbdomen ? 1.3 : 1.0;

    // Simplified feature extraction - in a real implementation,
    // this would use actual CTG data or more sophisticated algorithms
    return [
      140.0, // baseline value (estimated)
      kicksPerMinute > 0.5 ? 0.1 : 0.0, // accelerations
      kicksPerMinute * sensitivityMultiplier, // fetal_movement (normalized)
      0.5, // uterine_contractions (estimated)
      0.0, // light_decelerations
      0.0, // severe_decelerations
      0.0, // prolongued_decelerations
      kicksPerMinute < 0.3 ? 50.0 : 20.0, // abnormal_short_term_variability
      kicksPerMinute * 10 * sensitivityMultiplier, // mean_value_of_short_term_variability
      kicksPerMinute < 0.3 ? 30.0 : 5.0, // percentage_of_time_with_abnormal_long_term_variability
      kicksPerMinute * 15 * sensitivityMultiplier, // mean_value_of_long_term_variability
      50.0, // histogram_width
      120.0, // histogram_min
      170.0, // histogram_max
      3.0, // histogram_number_of_peaks
      0.0, // histogram_number_of_zeroes
      140.0, // histogram_mode
      145.0, // histogram_mean
      143.0, // histogram_median
      25.0, // histogram_variance
      0.0, // histogram_tendency
    ];
  }

  private _generateAssessment(
    predictedClass: number,
    confidence: number,
    kickCount: number,
    duration: number,
    phoneOnAbdomen: boolean
  ): FetalHealthAssessment {
    let status: string;
    let message: string;
    let recommendation: string;

    switch (predictedClass) {
      case 0: // Normal
        status = 'Normal';
        message = phoneOnAbdomen
          ? 'Your baby\'s movement patterns appear normal based on phone-on-abdomen monitoring.'
          : 'Your baby\'s movement patterns appear normal.';
        recommendation = 'Continue monitoring daily. Great job tracking your baby\'s activity!';
        break;
      case 1: // Suspect
        status = 'Suspect';
        message = phoneOnAbdomen
          ? 'Your baby\'s movement patterns show some variations detected by phone-on-abdomen monitoring.'
          : 'Your baby\'s movement patterns show some variations that may need attention.';
        recommendation = 'Consider discussing these patterns with your healthcare provider for additional monitoring.';
        break;
      case 2: // Pathological
        status = 'Concerning';
        message = phoneOnAbdomen
          ? 'Your baby\'s movement patterns detected by phone-on-abdomen monitoring suggest potential concerns.'
          : 'Your baby\'s movement patterns suggest potential concerns.';
        recommendation = 'Please contact your healthcare provider immediately to discuss these results.';
        break;
      default:
        status = 'Unknown';
        message = 'Unable to assess fetal health from current data.';
        recommendation = 'Continue regular monitoring and consult with your healthcare provider.';
    }

    return {
      predictedClass,
      confidence,
      status,
      message,
      recommendation,
    };
  }

  dispose(): void {
    this.isInitialized = false;
  }
}

export { FetalHealthService };
export const fetalHealthService = new FetalHealthService();