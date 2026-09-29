export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language_preference: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  allow_anonymous_posting: boolean | null;
  email_notifications: boolean | null;
  role: 'patient' | 'physician' | 'nurse' | 'lab' | 'pharma_company' | 'admin';
  is_verified: boolean;
  license_number: string | null;
  specialty: string | null;
  specialties: string[] | null;
  languages_spoken: string[] | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  available_for_online_consultation: boolean | null;
  institution: string | null;
  medicine_system: 'allopathy' | 'homeopathy' | 'ayurveda' | 'siddha' | 'unani' | 'naturopathy' | 'other' | null;
  company_name: string | null;
  company_registration_number: string | null;
  company_type: string | null;
  headquarters_location: string | null;
  founded_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatientJourney {
  id: string;
  user_id: string;
  title: string;
  condition: string;
  symptoms_description: string | null;
  symptoms_started_date: string | null;
  diagnosis_date: string | null;
  current_status: 'ongoing' | 'resolved' | 'improved' | 'worsened';
  outcome_description: string | null;
  is_anonymous: boolean;
  country: string | null;
  view_count: number;
  helpful_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ProviderReview {
  id: string;
  user_id: string;
  journey_id: string | null;
  provider_type: 'doctor' | 'hospital' | 'lab' | 'nurse' | 'clinic';
  provider_name: string;
  provider_specialty: string | null;
  location_country: string | null;
  location_city: string | null;
  location_address: string | null;
  overall_rating: number;
  communication_rating: number | null;
  expertise_rating: number | null;
  facility_rating: number | null;
  wait_time_rating: number | null;
  review_text: string | null;
  visit_date: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  journey_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface JourneyComment {
  id: string;
  journey_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_anonymous: boolean;
  helpful_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: JourneyComment[];
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_anonymous: boolean;
  helpful_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: ReviewComment[];
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  parent_reply_id: string | null;
  content: string;
  is_helpful: boolean;
  helpful_count: number;
  reply_count: number;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: DiscussionReply[];
}

export interface CommentReaction {
  id: string;
  user_id: string;
  comment_type: 'journey' | 'review' | 'discussion';
  comment_id: string;
  reaction_type: 'helpful' | 'like';
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  journey_id: string | null;
  review_id: string | null;
  created_at: string;
}

export interface ProfessionalPost {
  id: string;
  professional_id: string;
  title: string;
  content: string;
  category: 'advice' | 'research' | 'announcement' | 'education';
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ConsultationRequest {
  id: string;
  member_id: string;
  professional_id: string;
  journey_id: string | null;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'converted_to_appointment';
  service_id?: string | null;
  request_type?: 'advice' | 'second_opinion' | 'televisit' | 'in_person';
  symptoms_description?: string | null;
  urgency_level?: 'routine' | 'urgent' | 'emergency';
  provider_response?: string | null;
  response_date?: string | null;
  created_at: string;
  updated_at?: string;
  patient_profile?: Profile;
  professional_profile?: Profile;
}

export interface ConsultationResponse {
  id: string;
  consultation_id: string;
  professional_id: string;
  message: string;
  created_at: string;
  profiles?: Profile;
}

export interface PatientDataAccessRequest {
  id: string;
  patient_id: string;
  pharma_company_id: string;
  request_reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_at: string;
  responded_at: string | null;
  access_expires_at: string | null;
  patient_notes: string | null;
  created_at: string;
  updated_at: string;
  patient_profile?: Profile;
  pharma_profile?: Profile;
}

export interface PharmaPhysicianMessage {
  id: string;
  pharma_company_id: string;
  physician_id: string;
  thread_id: string;
  sender_id: string;
  message_content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_profile?: Profile;
  pharma_profile?: Profile;
  physician_profile?: Profile;
}

export interface AdminPrivileges {
  id: string;
  admin_id: string;
  can_manage_users: boolean;
  can_reset_passwords: boolean;
  can_verify_physicians: boolean;
  can_moderate_content: boolean;
  can_view_all_data: boolean;
  can_manage_access_requests: boolean;
  can_manage_system_settings: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordRequest {
  id: string;
  patient_id: string;
  requester_id: string;
  requester_role: 'physician' | 'pharma_company' | 'hospital' | 'lab' | 'nurse';
  request_reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  requested_at: string;
  responded_at: string | null;
  expires_at: string | null;
  patient_response_notes: string | null;
  records_shared: any;
  created_at: string;
  updated_at: string;
  patient_profile?: Profile;
  requester_profile?: Profile;
}

export interface MedicalRecordShare {
  id: string;
  request_id: string;
  patient_id: string;
  recipient_id: string;
  record_name: string;
  record_url: string;
  record_type: 'lab_report' | 'prescription' | 'imaging' | 'diagnosis' | 'consultation' | 'other';
  shared_at: string;
  access_expires_at: string | null;
  download_count: number;
  last_accessed_at: string | null;
  created_at: string;
  patient_profile?: Profile;
  recipient_profile?: Profile;
}

export interface UserConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
  requester_profile?: Profile;
  receiver_profile?: Profile;
}

export interface Appointment {
  id: string;
  service_request_id?: string | null;
  patient_id: string;
  provider_id: string;
  appointment_type: 'consultation' | 'follow_up' | 'procedure' | 'teleconsultation';
  title: string;
  description?: string | null;
  scheduled_date: string;
  duration_minutes: number;
  location: string;
  meeting_link?: string | null;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  patient_notes?: string | null;
  provider_notes?: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  patient_profile?: Profile;
  provider_profile?: Profile;
}

export interface DependentChild {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  relationship?: 'father' | 'mother' | 'son' | 'daughter' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'friend' | 'other';
  blood_group?: string;
  is_elderly?: boolean;
  is_blind?: boolean;
  is_physically_challenged?: boolean;
  disability_description?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  vaccination_records?: any;
  notes?: string;
  consent_given: boolean;
  consent_date?: string;
  consent_signature_url?: string;
  caregiver_name?: string;
  caregiver_relationship?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildMedicalRecord {
  id: string;
  child_id: string;
  parent_id: string;
  record_type: 'lab_report' | 'prescription' | 'imaging' | 'diagnosis' | 'vaccination' | 'other';
  record_name: string;
  record_url: string;
  record_date: string;
  description?: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildHealthIssue {
  id: string;
  child_id: string;
  parent_id: string;
  issue_title: string;
  symptoms_description: string;
  symptom_started_date: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  body_temperature?: number;
  additional_notes?: string;
  status: 'active' | 'improving' | 'resolved' | 'worsening';
  created_at: string;
  updated_at: string;
}

export interface PediatricConsultationRequest {
  id: string;
  child_id: string;
  parent_id: string;
  pediatrician_id: string;
  health_issue_id?: string;
  request_type: 'general_checkup' | 'illness' | 'vaccination' | 'emergency' | 'follow_up';
  urgency_level: 'routine' | 'urgent' | 'emergency';
  symptoms_summary: string;
  parent_concerns?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'converted_to_appointment';
  pediatrician_response?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
  child?: DependentChild;
  parent_profile?: Profile;
  pediatrician_profile?: Profile;
}

export interface PediatricAppointment {
  id: string;
  consultation_request_id?: string;
  child_id: string;
  parent_id: string;
  pediatrician_id: string;
  appointment_type: 'checkup' | 'vaccination' | 'illness' | 'follow_up' | 'emergency';
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  location: string;
  meeting_link?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  diagnosis_summary?: string;
  treatment_plan?: string;
  follow_up_required: boolean;
  parent_notes?: string;
  pediatrician_notes?: string;
  created_at: string;
  updated_at: string;
  child?: DependentChild;
  parent_profile?: Profile;
  pediatrician_profile?: Profile;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  role: 'patient' | 'physician' | 'nurse' | 'lab' | 'pharma_company' | 'admin';
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;
  tier: 'free' | 'premium' | 'professional' | 'enterprise';
  is_active: boolean;
  trial_days: number;
  features: string[];
  limits: Record<string, number>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  feature_key: string;
  current_usage: number;
  usage_limit: number | null;
  reset_date: string | null;
  period_start: string;
  period_end: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  subscription_id: string | null;
  action: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'payment_succeeded' | 'payment_failed' | 'trial_started' | 'trial_ended';
  old_plan_id: string | null;
  new_plan_id: string | null;
  amount: number | null;
  currency: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  credits_earned: number;
  credits_used: number;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralUsage {
  id: string;
  referral_code_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  reward_granted: boolean;
  reward_amount: number;
  created_at: string;
}
