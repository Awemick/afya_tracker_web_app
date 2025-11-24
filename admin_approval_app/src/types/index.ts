export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'provider' | 'institution' | 'admin';
  avatar?: string;
  status?: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  registrationDate?: string;
  specialization?: string;
  licenseNumber?: string;
  institutionName?: string;
  verified?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  pregnancyWeek: number;
  dueDate: string;
  lastCheckup: string;
  riskLevel: 'low' | 'medium' | 'high';
  kickSessions: KickSession[];
}

export interface KickSession {
  id: string;
  patientId: string;
  date: string;
  duration: number; // in minutes
  kickCount: number;
  position: 'sitting' | 'lying' | 'standing';
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  type: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration?: number;
  notes?: string;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  type: 'reduced_movement' | 'pain' | 'bleeding' | 'other';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  status: 'active' | 'resolved';
  location?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'patient' | 'provider';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  patientId: string;
  providerId: string;
  lastMessage?: Message;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'message' | 'appointment' | 'risk_alert' | 'recommendation';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  relatedId?: string; // ID of related entity (alert, message, etc.)
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  institutionId?: string;
  scheduledTime: string; // ISO timestamp
  duration: number; // minutes
  type: 'virtual' | 'physical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  doctorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  blockedSlots: string[]; // ISO date strings
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: number; // days
  instructions: string;
  refills: number;
  sideEffects?: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  institutionId?: string;
  medications: Medication[];
  diagnosis?: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string; // Firebase Timestamp
  updatedAt: string; // Firebase Timestamp
  validUntil: string; // Firebase Timestamp
  qrCode?: string; // For pharmacy access
}

export interface ProgressNote {
  id: string;
  patientId: string;
  doctorId: string;
  institutionId?: string;
  title: string;
  content: string;
  category: 'consultation' | 'recommendation' | 'alert' | 'followup';
  status: 'draft' | 'approved' | 'visible' | 'archived';
  visibility: 'private' | 'shared' | 'public';
  tags: string[];
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  approvedAt?: any; // Firebase Timestamp
  approvedBy?: string;
  followUpDate?: any; // Firebase Timestamp
  attachments?: string[]; // file URLs
}

export interface Recommendation {
  id: string;
  noteId: string;
  type: 'lifestyle' | 'medication' | 'exercise' | 'diet' | 'monitoring';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'cancelled';
  dueDate?: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  website?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface WorkingHours {
  monday: { open: string; close: string; isOpen: boolean };
  tuesday: { open: string; close: string; isOpen: boolean };
  wednesday: { open: string; close: string; isOpen: boolean };
  thursday: { open: string; close: string; isOpen: boolean };
  friday: { open: string; close: string; isOpen: boolean };
  saturday: { open: string; close: string; isOpen: boolean };
  sunday: { open: string; close: string; isOpen: boolean };
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number; // minutes
  actions: string[];
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface Institution {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'ngo' | 'government';
  description: string;
  logo?: string;
  contactInfo: ContactInfo;
  location: GeoPoint;
  settings: InstitutionSettings;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface InstitutionSettings {
  timezone: string;
  workingHours: WorkingHours;
  departments: string[];
  emergencyProtocols: EmergencyProtocol[];
  branding: BrandingSettings;
}

export interface StaffMember {
  id: string;
  institutionId: string;
  userId: string;
  role: 'admin' | 'doctor' | 'nurse' | 'staff';
  department: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: any; // Firebase Timestamp
}

export interface PatientLink {
  id: string;
  patientId: string;
  institutionId: string;
  linkType: 'qr' | 'referral' | 'manual';
  linkCode: string; // QR or referral code
  permissions: LinkPermissions;
  status: 'pending' | 'active' | 'inactive' | 'revoked';
  linkedAt: any; // Firebase Timestamp
  linkedBy: string; // user who created the link
  expiresAt?: any; // Firebase Timestamp
  metadata: LinkMetadata;
}

export interface LinkPermissions {
  viewRecords: boolean;
  createConsultations: boolean;
  managePrescriptions: boolean;
  sendNotifications: boolean;
  shareData: boolean;
}

export interface LinkMetadata {
  source: 'walkin' | 'referral' | 'online';
  referrer?: string;
  notes?: string;
  tags: string[];
}

export interface AnalyticsData {
  id: string;
  institutionId: string;
  metricType: 'patients' | 'consultations' | 'alerts' | 'appointments' | 'prescriptions';
  date: any; // Firebase Timestamp
  value: number;
  metadata: Record<string, any>;
  createdAt: any; // Firebase Timestamp
}

export interface Report {
  id: string;
  institutionId: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  dateRange: DateRange;
  metrics: string[];
  generatedAt: any; // Firebase Timestamp
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
}

export interface DateRange {
  startDate: any; // Firebase Timestamp
  endDate: any; // Firebase Timestamp
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  institutionId: string;
  uploadedBy: string; // doctor/provider ID
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string; // Firebase Storage URL
  category: 'ultrasound' | 'lab_results' | 'prescription' | 'consultation' | 'other';
  tags: string[];
  description?: string;
  isConfidential: boolean;
  accessPermissions: FilePermissions;
  uploadedAt: any; // Firebase Timestamp
  lastAccessed?: any; // Firebase Timestamp
  version: number;
}

export interface FilePermissions {
  view: string[]; // user IDs with view access
  download: string[]; // user IDs with download access
  share: string[]; // user IDs with sharing permissions
}

export interface Referral {
  id: string;
  patientId: string;
  referringDoctorId: string;
  referringInstitutionId: string;
  receivingDoctorId?: string;
  receivingInstitutionId: string;
  specialty: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  reason: string;
  clinicalNotes: string;
  diagnosis?: string;
  requestedTests?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  patientConsent: boolean;
  consentGivenAt?: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  acceptedAt?: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
  responseNotes?: string;
  attachments?: string[]; // file URLs
}

export interface ReferralResponse {
  id: string;
  referralId: string;
  respondingDoctorId: string;
  response: 'accept' | 'reject' | 'transfer';
  notes: string;
  proposedDate?: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  endDate?: any; // Firebase Timestamp
}

export interface Reminder {
  id: string;
  taskId: string;
  type: 'email' | 'push' | 'sms';
  scheduledFor: any; // Firebase Timestamp
  sentAt?: any; // Firebase Timestamp
  status: 'scheduled' | 'sent' | 'failed';
  message: string;
}

export interface Task {
  id: string;
  patientId: string;
  assignedTo: string; // provider ID
  createdBy: string; // provider ID who created the task
  institutionId: string;
  title: string;
  description: string;
  category: 'followup' | 'medication' | 'test_results' | 'consultation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
  reminderDate?: any; // Firebase Timestamp
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  relatedConsultationId?: string;
  relatedRecommendationId?: string;
  tags: string[];
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

// Payment-related interfaces
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'stripe' | 'mpesa';
  provider: 'stripe' | 'safaricom';
  details: StripePaymentMethod | MpesaPaymentMethod;
  isDefault: boolean;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface StripePaymentMethod {
  paymentMethodId: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface MpesaPaymentMethod {
  phoneNumber: string;
  accountReference?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userType: 'patient' | 'provider';
  planId: string;
  planName: string;
  amount: number; // in cents for Stripe, in KES for M-Pesa
  currency: 'usd' | 'kes';
  interval: 'month' | 'year';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: any; // Firebase Timestamp
  currentPeriodEnd: any; // Firebase Timestamp
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
  providerSubscriptionId?: string; // Stripe subscription ID or M-Pesa reference
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface Payment {
  id: string;
  userId: string;
  type: 'subscription' | 'one_time' | 'commission' | 'emergency_premium';
  amount: number; // in cents for Stripe, in KES for M-Pesa
  currency: 'usd' | 'kes';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethodId: string;
  providerPaymentId?: string; // Stripe payment intent ID or M-Pesa transaction ID
  description: string;
  metadata: Record<string, any>;
  relatedEntityId?: string; // appointment, report, etc.
  createdAt: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
}

export interface Commission {
  id: string;
  providerId: string;
  amount: number; // in KES
  percentage: number;
  type: 'appointment' | 'lab_test' | 'consultation';
  relatedEntityId: string; // appointment or test ID
  status: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  createdAt: any; // Firebase Timestamp
  paidAt?: any; // Firebase Timestamp
}

export interface EmergencyPremium {
  id: string;
  patientId: string;
  providerId: string;
  amount: number; // in KES
  serviceType: string;
  status: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  createdAt: any; // Firebase Timestamp
  paidAt?: any; // Firebase Timestamp
}

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number; // monthly amount
  currency: 'usd' | 'kes';
  interval: 'month' | 'year';
  features: string[];
  targetUser: 'patient' | 'provider';
  isActive: boolean;
  createdAt: any; // Firebase Timestamp
}

export interface Transaction {
  id: string;
  paymentId: string;
  provider: 'stripe' | 'mpesa';
  providerTransactionId: string;
  amount: number;
  currency: 'usd' | 'kes';
  status: 'success' | 'failed' | 'pending';
  responseData: Record<string, any>;
  createdAt: any; // Firebase Timestamp
}
