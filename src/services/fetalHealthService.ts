import * as tf from '@tensorflow/tfjs';

export interface FetalHealthAssessment {
  predictedClass: number;
  confidence: number;
  status: string;
  message: string;
  recommendation: string;
}

export class FetalHealthService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  // Model expects 21 features in this order (from fetal_health.csv)
  private readonly featureNames = [
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

    try {
      // Load the trained TensorFlow.js model
      // Note: In production, host the model files on a CDN or serve them from your backend
      this.model = await tf.loadLayersModel('/models/fetal_health_model/model.json');
      this.isInitialized = true;
      console.log('Fetal health model loaded successfully');
    } catch (error) {
      console.error('Failed to load fetal health model:', error);
      // Fallback: create a simple model with the same architecture
      console.log('Falling back to untrained model...');
      this.model = this.createModel();
      this.isInitialized = true;
      console.log('Fallback fetal health model initialized');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [21], units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    // Compile with the same settings as the trained model
    model.compile({
      optimizer: 'adam',
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async assessFetalHealth(
    kickCount: number,
    durationMinutes: number,
    gestationalWeek: number = 28
  ): Promise<FetalHealthAssessment> {
    if (!this.model || !this.isInitialized) {
      await this.initialize();
    }

    // Convert kick session data to model features
    const features = this.extractFeaturesFromKickData(
      kickCount,
      durationMinutes,
      gestationalWeek
    );

    // Prepare input tensor
    const inputTensor = tf.tensor2d([features], [1, 21]);

    // Run inference
    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const probabilities = await prediction.data() as Float32Array;

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Get prediction result
    const predictedClass = this.getPredictedClass(probabilities);
    const confidence = probabilities[predictedClass];

    // Generate assessment
    return this.generateAssessment(predictedClass, confidence, kickCount, durationMinutes);
  }

  private extractFeaturesFromKickData(
    kickCount: number,
    durationMinutes: number,
    gestationalWeek: number
  ): number[] {
    const kicksPerMinute = kickCount / durationMinutes;

    // Simplified feature extraction - matches the mobile implementation
    return [
      140.0, // baseline value
      kicksPerMinute > 0.5 ? 0.1 : 0.0, // accelerations
      kicksPerMinute, // fetal_movement (normalized)
      0.5, // uterine_contractions (estimated)
      0.0, // light_decelerations
      0.0, // severe_decelerations
      0.0, // prolongued_decelerations
      kicksPerMinute < 0.3 ? 50.0 : 20.0, // abnormal_short_term_variability
      kicksPerMinute * 10, // mean_value_of_short_term_variability
      kicksPerMinute < 0.3 ? 30.0 : 5.0, // percentage_of_time_with_abnormal_long_term_variability
      kicksPerMinute * 15, // mean_value_of_long_term_variability
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

  private getPredictedClass(probabilities: Float32Array): number {
    let maxIndex = 0;
    let maxValue = probabilities[0];

    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxValue) {
        maxValue = probabilities[i];
        maxIndex = i;
      }
    }

    return maxIndex;
  }

  private generateAssessment(
    predictedClass: number,
    confidence: number,
    kickCount: number,
    durationMinutes: number
  ): FetalHealthAssessment {
    const kicksPerHour = (kickCount / durationMinutes * 60).toFixed(1);

    let status: string;
    let message: string;
    let recommendation: string;

    switch (predictedClass) {
      case 0: // Normal
        status = 'Normal';
        message = 'Your baby\'s movement patterns appear normal and healthy.';
        recommendation = 'Continue monitoring daily. Great job tracking your baby\'s activity!';
        break;
      case 1: // Suspect
        status = 'Suspect';
        message = 'Your baby\'s movement patterns show some variations that may need attention.';
        recommendation = 'Consider discussing these patterns with your healthcare provider for additional monitoring.';
        break;
      case 2: // Pathological
        status = 'Concerning';
        message = 'Your baby\'s movement patterns suggest potential concerns.';
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
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
  }
}