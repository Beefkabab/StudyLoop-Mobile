export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type EducationLevel = "high_school_or_less" | "some_college" | "bachelors" | "graduate_degree";
export type LivingEnvironment = "urban" | "suburban" | "rural";
export type StudyType = "clinical_trial" | "blood_draw" | "observational_survey" | "imaging_mri" | "cognitive_assessment";
export type LocationType = "in_person" | "remote" | "hybrid";
export type ApplicationStatus = "screener_passed" | "screened_out" | "pending_contact" | "scheduled" | "enrolled" | "completed" | "withdrawn";

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
  appointmentDate?: string;
  createdAt: string;
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
  id: "rural_male" | "urban_student" | "chronic_patient";
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
