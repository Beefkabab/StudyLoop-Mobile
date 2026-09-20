export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type EducationLevel = "high_school_or_less" | "some_college" | "bachelors" | "graduate_degree";
export type LivingEnvironment = "urban" | "suburban" | "rural";
export type StudyType = "clinical_trial" | "blood_draw" | "observational_survey" | "imaging_mri" | "cognitive_assessment";
export type LocationType = "in_person" | "remote" | "hybrid";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "action_needed"
  | "pre_screening"
  | "eligible_next_step"
  | "enrolled"
  | "completed"
  | "not_selected"
  | "withdrawn"
  | "study_closed"
  | "screener_passed"
  | "screened_out"
  | "pending_contact"
  | "scheduled";

export type PreferredContactMethod = "email" | "phone" | "sms";
export type PreferredLocationType = "in_person" | "remote" | "hybrid" | "no_preference";
export type TransportationAccess = "personal_vehicle" | "public_transit" | "rideshare" | "needs_assistance" | "none";

export interface ParticipantProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  age: number;
  gender: Gender;
  educationLevel: EducationLevel;
  livingEnvironment: LivingEnvironment;
  city: string;
  state: string;
  zipCode?: string;
  travelDistanceMiles: number;
  isHealthyVolunteer: boolean;
  conditions: string[];
  medications: string[];
  hasRecentAntibiotics: boolean;
  smokerStatus: "never" | "former" | "current";
  avatarInitials: string;
  tagline: string;
  // Phase 1 Reusable Passport fields
  preferredContactMethod?: PreferredContactMethod;
  isContactVerified?: boolean;
  preferredLocationType?: PreferredLocationType;
  preferredLanguage?: string;
  transportationAccess?: TransportationAccess;
  accessibilityNeeds?: string;
  hasCaregiver?: boolean;
  hasInternetSmartphone?: boolean;
}

export type TaskType =
  | "complete_profile"
  | "finish_screener"
  | "confirm_contact"
  | "confirm_availability"
  | "review_study_details"
  | "contact_support"
  | "custom_request"
  | "document_upload"
  | "survey"
  | "scheduling"
  | "consent"
  | "profile_update"
  | "visit";

export type TaskStatus = "pending" | "completed" | "expired" | "canceled";

export interface ParticipantTask {
  id: string;
  applicationId?: string;
  profileKey: string;
  taskType: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;
  actionUrl?: string;
  createdAt: string;
  completedAt?: string;
  createdByName?: string;
}

export type ConsentType =
  | "terms_of_service"
  | "privacy_policy"
  | "matching_communications"
  | "transactional_email"
  | "marketing_email"
  | "sms_opt_in";

export interface ParticipantConsent {
  id: string;
  profileKey: string;
  consentType: ConsentType;
  version: string;
  isGranted: boolean;
  grantedAt: string;
  revokedAt?: string;
}

export type NotificationEventType =
  | "action_required"
  | "status_changed"
  | "application_submitted"
  | "screener_passed"
  | "study_closed"
  | "task_completed";

export interface AppNotification {
  id: string;
  profileKey: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  actionUrl?: string;
  studyId?: string;
  applicationId?: string;
  taskId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedByName: string;
  participantFacingNote?: string;
  internalNote?: string;
  createdAt: string;
}

export interface ScreenerQuestion {
  id: string;
  questionText: string;
  explanation?: string;
  expectedAnswer: "yes" | "no";
  isDisqualifying: boolean;
  disqualificationReason?: string;
}

export interface Study {
  id: string;
  slug: string;
  title: string;
  sponsorName: string;
  sponsorType: "university" | "hospital" | "biotech" | "pharma" | "research_center";
  piName: string;
  piTitle?: string;
  studyType: StudyType;
  compensationAmount: number;
  compensationType: string;
  compensationSchedule?: string;
  timeCommitment: string;
  durationWeeks: number;
  locationType: LocationType;
  city: string;
  state: string;
  facilityAddress?: string;
  summary: string;
  fullDescription: string;
  irbApprovalNumber: string;
  targetEnrollment: number;
  currentEnrolled: number;
  minAge: number;
  maxAge: number;
  targetGender: "all" | "male" | "female";
  healthyVolunteersAccepted: boolean;
  requiredConditions?: string[];
  excludedConditions?: string[];
  targetDemographicFocus?: string;
  isFeatured?: boolean;
  isSponsored?: boolean;
  status?: "recruiting" | "waitlist" | "closed" | "archived";
  recruitmentStatus?: "recruiting" | "waitlist" | "closed" | "archived";
  questions: ScreenerQuestion[];
}

export interface MatchResult {
  score: number;
  matchReasons: string[];
  flags: string[];
}

export interface StudyApplication {
  id: string;
  studyId: string;
  profileId: string;
  studyTitle: string;
  sponsorName: string;
  compensationAmount: number;
  status: ApplicationStatus;
  qualificationScore: number;
  answers: Record<string, string>;
  disqualificationNotes?: string;
  researcherNotes?: string;
  participantFacingNote?: string;
  internalStaffNote?: string;
  participantNotes?: string;
  internalNotes?: string;
  assignedCoordinatorId?: string;
  assignedCoordinatorName?: string;
  statusUpdatedAt?: string;
  lastStatusChangedByName?: string;
  withdrawalReason?: string;
  appointmentDate?: string;
  appliedDate?: string;
  createdAt: string;
  history?: ApplicationStatusHistory[];
}

export interface StudyReminder {
  id: string;
  applicationId: string;
  studyTitle: string;
  title: string;
  scheduledFor: string;
  notes: string;
  isCompleted: boolean;
  channel: "sms" | "email" | "in_app";
}

export interface Persona {
  id:
    | "rural_male"
    | "urban_student"
    | "chronic_patient"
    | "senior_control"
    | "respiratory_patient"
    | "bilingual_caregiver"
    | "veteran_volunteer";
  name: string;
  roleDescription: string;
  badgeLabel: string;
  profile: ParticipantProfile;
}

export type UserRole = "consumer" | "pi" | "coordinator";

export interface PIData {
  id: string;
  username: string;
  name: string;
  title: string;
  institution: string;
  studyId: string;
  studySlug: string;
  studyTitle: string;
  compensation: string;
  irbNumber: string;
}

