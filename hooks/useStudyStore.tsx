import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { router } from "expo-router";
import {
  ParticipantProfile,
  Study,
  StudyApplication,
  StudyReminder,
  MatchResult,
  ApplicationStatus,
  UserRole,
  PIData,
} from "../constants/types";
import {
  DEMO_PERSONAS,
  PROTOCOL_STUDIES,
  INITIAL_APPLICATIONS,
  INITIAL_REMINDERS,
  PI_ACCOUNTS,
} from "../constants/sampleData";
import { calculateMatchScore } from "./matchingEngine";

export interface StudyWithMatch extends Study {
  match: MatchResult;
  isSaved: boolean;
}

interface StudyStoreContextType {
  userRole: UserRole;
  activePI: PIData | null;
  loginModalVisible: boolean;
  setLoginModalVisible: (visible: boolean) => void;
  loginModalAudience: "consumer" | "institution";
  openLoginModal: (audience?: "consumer" | "institution") => void;
  exitPIToConsumer: () => void;
  activePersonaId: string;
  currentProfile: ParticipantProfile;
  switchPersona: (personaId: "rural_male" | "urban_student" | "chronic_patient") => void;
  loginAsConsumer: (personaId: "rural_male" | "urban_student" | "chronic_patient") => void;
  loginAsPI: (piId: string) => void;
  logout: () => void;
  updateProfile: (updated: Partial<ParticipantProfile>) => void;
  studies: StudyWithMatch[];
  savedStudyIds: string[];
  toggleSaveStudy: (studyId: string) => boolean;
  updateStudy: (studyId: string, updated: Partial<Study>) => void;
  createStudy: (newStudy: Study) => void;
  applications: StudyApplication[];
  submitApplication: (
    studyId: string,
    answers: Record<string, string>,
    passed: boolean,
    score: number
  ) => void;
  reminders: StudyReminder[];
  toggleReminder: (reminderId: string) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
}

const StudyStoreContext = React.createContext<StudyStoreContextType | null>(null);

export function StudyStoreProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("consumer");
  const [activePI, setActivePI] = useState<PIData | null>(null);
  const [loginModalVisible, setLoginModalVisible] = useState<boolean>(false);
  const [loginModalAudience, setLoginModalAudience] = useState<"consumer" | "institution">("consumer");

  const openLoginModal = (audience?: "consumer" | "institution") => {
    if (audience) {
      setLoginModalAudience(audience);
    } else {
      setLoginModalAudience(userRole === "pi" ? "institution" : "consumer");
    }
    setLoginModalVisible(true);
  };

  const exitPIToConsumer = () => {
    setUserRole("consumer");
    setActivePI(null);
    try {
      router.replace("/");
    } catch (e) {}
  };

  const [activePersonaId, setActivePersonaId] = useState<string>("rural_male");
  const [currentProfile, setCurrentProfile] = useState<ParticipantProfile>(
    DEMO_PERSONAS.rural_male.profile
  );
  const [studiesList, setStudiesList] = useState<Study[]>(PROTOCOL_STUDIES);
  const [savedStudyIds, setSavedStudyIds] = useState<string[]>(["study_1"]);
  const [applications, setApplications] = useState<StudyApplication[]>(INITIAL_APPLICATIONS);
  const [reminders, setReminders] = useState<StudyReminder[]>(INITIAL_REMINDERS);

  const switchPersona = (personaId: "rural_male" | "urban_student" | "chronic_patient") => {
    setActivePersonaId(personaId);
    if (DEMO_PERSONAS[personaId]) {
      setCurrentProfile({ ...DEMO_PERSONAS[personaId].profile });
    }
  };

  const loginAsConsumer = (personaId: "rural_male" | "urban_student" | "chronic_patient") => {
    switchPersona(personaId);
    setUserRole("consumer");
    setActivePI(null);
    setLoginModalVisible(false);
    try {
      router.replace("/(tabs)");
    } catch (e) {}
  };

  const loginAsPI = (piId: string) => {
    const found = PI_ACCOUNTS.find((p) => p.id === piId || p.username === piId);
    if (found) {
      setActivePI(found);
      setUserRole(found.id === "coordinator_sarah" ? "coordinator" : "pi");
      setLoginModalVisible(false);
      try {
        router.replace("/(tabs)/researcher");
      } catch (e) {}
    }
  };

  const logout = () => {
    setUserRole("consumer");
    setActivePI(null);
    switchPersona("rural_male");
  };

  const updateProfile = (updated: Partial<ParticipantProfile>) => {
    setCurrentProfile((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const updateStudy = (studyId: string, updated: Partial<Study>) => {
    setStudiesList((prev) =>
      prev.map((s) => (s.id === studyId ? { ...s, ...updated } : s))
    );
    if (activePI && activePI.studyId === studyId) {
      setActivePI((prev) =>
        prev
          ? {
              ...prev,
              studyTitle: updated.title || prev.studyTitle,
              compensation: updated.compensationAmount
                ? `$${updated.compensationAmount}`
                : prev.compensation,
            }
          : prev
      );
    }
  };

  const createStudy = (newStudy: Study) => {
    setStudiesList((prev) => [newStudy, ...prev]);
    if (activePI) {
      setActivePI((prev) =>
        prev
          ? {
              ...prev,
              studyId: newStudy.id,
              studyTitle: newStudy.title,
              compensation: `$${newStudy.compensationAmount}`,
            }
          : prev
      );
    }
  };

  const toggleSaveStudy = (studyId: string): boolean => {
    let nowSaved = false;
    setSavedStudyIds((prev) => {
      if (prev.includes(studyId)) {
        nowSaved = false;
        return prev.filter((id) => id !== studyId);
      } else {
        nowSaved = true;
        return [...prev, studyId];
      }
    });
    return nowSaved;
  };

  const submitApplication = (
    studyId: string,
    answers: Record<string, string>,
    passed: boolean,
    score: number
  ) => {
    const targetStudy = studiesList.find((s) => s.id === studyId);
    if (!targetStudy) return;

    const newAppId = `app_${Date.now()}`;
    const newApp: StudyApplication = {
      id: newAppId,
      studyId,
      profileId: currentProfile.id,
      studyTitle: targetStudy.title,
      sponsorName: targetStudy.sponsorName,
      compensationAmount: targetStudy.compensationAmount,
      status: passed ? "screener_passed" : "screened_out",
      qualificationScore: score,
      answers,
      researcherNotes: passed
        ? `Pre-screener passed by ${currentProfile.fullName}. Eligible for protocol onboarding.`
        : "Did not meet specific inclusion criteria.",
      appointmentDate: passed ? "Pending Coordinator Outreach" : undefined,
      createdAt: "Just now",
    };

    setApplications((prev) => [newApp, ...prev]);

    if (passed) {
      const newReminder: StudyReminder = {
        id: `rem_${Date.now()}`,
        applicationId: newAppId,
        studyTitle: targetStudy.title,
        title: "Study Coordinator Protocol Orientation",
        scheduledFor: "Within 48 hours",
        notes: "Coordinator outreach expected via phone or email to discuss informed consent packet.",
        isCompleted: false,
        channel: "in_app",
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  const toggleReminder = (reminderId: string) => {
    setReminders((prev) =>
      prev.map((rem) =>
        rem.id === reminderId ? { ...rem, isCompleted: !rem.isCompleted } : rem
      )
    );
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
              appointmentDate:
                status === "scheduled" ? "Tomorrow at 10:00 AM" : app.appointmentDate,
            }
          : app
      )
    );
  };

  // Re-score studies dynamically whenever currentProfile, studiesList or savedStudyIds change
  const studiesWithMatch: StudyWithMatch[] = useMemo(() => {
    return studiesList
      .map((study) => {
        const match = calculateMatchScore(study, currentProfile);
        const isSaved = savedStudyIds.includes(study.id);
        return {
          ...study,
          match,
          isSaved,
        };
      })
      .sort((a, b) => b.match.score - a.match.score);
  }, [studiesList, currentProfile, savedStudyIds]);

  return (
    <StudyStoreContext.Provider
      value={{
        userRole,
        activePI,
        loginModalVisible,
        setLoginModalVisible,
        loginModalAudience,
        openLoginModal,
        exitPIToConsumer,
        activePersonaId,
        currentProfile,
        switchPersona,
        loginAsConsumer,
        loginAsPI,
        logout,
        updateProfile,
        studies: studiesWithMatch,
        savedStudyIds,
        toggleSaveStudy,
        updateStudy,
        createStudy,
        applications,
        submitApplication,
        reminders,
        toggleReminder,
        updateApplicationStatus,
      }}
    >
      {children}
    </StudyStoreContext.Provider>
  );
}

export function useStudyStore() {
  const context = React.useContext(StudyStoreContext);
  if (!context) {
    throw new Error("useStudyStore must be used within a StudyStoreProvider");
  }
  return context;
}
