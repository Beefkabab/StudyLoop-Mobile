import React, { createContext, useContext, useState, useMemo } from "react";
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
  ParticipantTask,
  ParticipantConsent,
  AppNotification,
  TaskType,
  ConsentType,
  Persona,
} from "../constants/types";
import {
  DEMO_PERSONAS,
  PROTOCOL_STUDIES,
  INITIAL_APPLICATIONS,
  INITIAL_REMINDERS,
  PI_ACCOUNTS,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONSENTS,
} from "../constants/sampleData";
import { calculateMatchScore } from "./matchingEngine";

export interface StudyWithMatch extends Study {
  match: MatchResult;
  isSaved: boolean;
}

export interface ProfileChecklistResult {
  score: number;
  completedCount: number;
  totalCount: number;
  items: { key: string; label: string; done: boolean; description: string }[];
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
  switchPersona: (personaId: Persona["id"]) => void;
  loginAsConsumer: (personaId: Persona["id"]) => void;
  loginAsPI: (piId: string) => void;
  logout: () => void;
  updateProfile: (updated: Partial<ParticipantProfile>) => void;
  profileChecklist: ProfileChecklistResult;
  studies: StudyWithMatch[];
  savedStudyIds: string[];
  toggleSaveStudy: (studyId: string) => boolean;
  updateStudy: (studyId: string, updated: Partial<Study>) => void;
  createStudy: (newStudy: Study) => void;
  closeStudyRecruitment: (studyId: string) => void;
  applications: StudyApplication[];
  myApplications: StudyApplication[];
  inProgressApplications: StudyApplication[];
  activeApplications: StudyApplication[];
  historyApplications: StudyApplication[];
  recommendedStudies: StudyWithMatch[];
  submitApplication: (
    studyId: string,
    answers: Record<string, string>,
    passed: boolean,
    score: number
  ) => void;
  withdrawApplication: (applicationId: string, reason?: string) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  updateApplicationStatusWithNotes: (
    applicationId: string,
    newStatus: ApplicationStatus,
    participantNote?: string,
    internalNote?: string,
    coordinatorId?: string,
    coordinatorName?: string
  ) => void;
  // Tasks
  tasks: ParticipantTask[];
  myTasks: ParticipantTask[];
  pendingTasks: ParticipantTask[];
  completeTask: (taskId: string) => void;
  createTask: (
    applicationId: string,
    title: string,
    description: string,
    taskType: TaskType,
    dueDate?: string
  ) => void;
  // Notifications
  notifications: AppNotification[];
  myNotifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Consents & Preferences
  consents: ParticipantConsent[];
  myConsents: ParticipantConsent[];
  toggleConsent: (consentType: ConsentType) => void;
  // Reminders
  reminders: StudyReminder[];
  toggleReminder: (reminderId: string) => void;
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
  const [tasks, setTasks] = useState<ParticipantTask[]>(INITIAL_TASKS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [consents, setConsents] = useState<ParticipantConsent[]>(INITIAL_CONSENTS);

  const switchPersona = (personaId: Persona["id"]) => {
    setActivePersonaId(personaId);
    if (DEMO_PERSONAS[personaId]) {
      setCurrentProfile({ ...DEMO_PERSONAS[personaId].profile });
    }
  };

  const loginAsConsumer = (personaId: Persona["id"]) => {
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

  const updateStudy = (studyId: string, updated: Partial<Study>) => {
    setStudiesList((prev) =>
      prev.map((s) => (s.id === studyId ? { ...s, ...updated } : s))
    );
  };

  const createStudy = (newStudy: Study) => {
    setStudiesList((prev) => [newStudy, ...prev]);
  };

  const closeStudyRecruitment = (studyId: string) => {
    setStudiesList((prev) =>
      prev.map((s) => (s.id === studyId ? { ...s, status: "closed" } : s))
    );
    // Update any non-enrolled apps
    setApplications((prev) =>
      prev.map((app) => {
        if (app.studyId === studyId && app.status !== "enrolled" && app.status !== "completed") {
          return {
            ...app,
            status: "study_closed",
            participantFacingNote:
              "This study has reached its enrollment target and recruitment is now closed. Thank you for your interest!",
            statusUpdatedAt: "Just now",
          };
        }
        return app;
      })
    );
    // Add notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      profileKey: currentProfile.id,
      eventType: "study_closed",
      title: "Recruitment Closed",
      body: "A study in your pipeline has reached capacity and closed recruitment.",
      studyId,
      isRead: false,
      createdAt: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Applications scoped to current profile
  const myApplications = useMemo(() => {
    return applications.filter((a) => a.profileId === currentProfile.id);
  }, [applications, currentProfile.id]);

  const inProgressApplications = useMemo(() => {
    const inProgressStatuses: ApplicationStatus[] = [
      "draft",
      "submitted",
      "under_review",
      "action_needed",
      "pre_screening",
      "eligible_next_step",
      "screener_passed",
      "scheduled",
      "pending_contact",
    ];
    return myApplications.filter((a) => inProgressStatuses.includes(a.status));
  }, [myApplications]);

  const activeApplications = useMemo(() => {
    return myApplications.filter((a) => a.status === "enrolled");
  }, [myApplications]);

  const historyApplications = useMemo(() => {
    const historyStatuses: ApplicationStatus[] = [
      "completed",
      "not_selected",
      "withdrawn",
      "study_closed",
      "screened_out",
    ];
    return myApplications.filter((a) => historyStatuses.includes(a.status));
  }, [myApplications]);

  // Recommended studies (high match, not yet applied)
  const recommendedStudies = useMemo(() => {
    const appliedStudyIds = new Set(myApplications.map((a) => a.studyId));
    return studiesWithMatch
      .filter((s) => !appliedStudyIds.has(s.id) && s.status !== "closed")
      .slice(0, 3);
  }, [studiesWithMatch, myApplications]);

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
      status: passed ? "submitted" : "not_selected",
      qualificationScore: score,
      answers,
      participantFacingNote: passed
        ? "Application received! The study coordinator is reviewing your pre-screener qualification."
        : "Thank you for completing the screener. This study has strict protocol inclusion criteria that your current profile does not match.",
      internalStaffNote: passed
        ? `Pre-screener passed by ${currentProfile.fullName}. Eligible for coordinator review.`
        : "Did not meet specific inclusion criteria.",
      appointmentDate: passed ? "Pending Review" : undefined,
      statusUpdatedAt: "Just now",
      createdAt: "Just now",
    };

    setApplications((prev) => [newApp, ...prev]);

    // Create notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      profileKey: currentProfile.id,
      eventType: "application_submitted",
      title: "Application Submitted",
      body: `Your application to ${targetStudy.title} has been received.`,
      studyId,
      applicationId: newAppId,
      isRead: false,
      createdAt: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (passed) {
      const newReminder: StudyReminder = {
        id: `rem_${Date.now()}`,
        applicationId: newAppId,
        studyTitle: targetStudy.title,
        title: "Study Coordinator Protocol Orientation",
        scheduledFor: "Within 48 hours",
        notes: "Coordinator outreach expected to review informed consent packet.",
        isCompleted: false,
        channel: "in_app",
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  const withdrawApplication = (applicationId: string, reason?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: "withdrawn",
              withdrawalReason: reason || "Participant requested withdrawal.",
              participantFacingNote:
                "Application respectfully withdrawn. You remain eligible for future study opportunities.",
              statusUpdatedAt: "Just now",
            }
          : app
      )
    );

    const targetApp = applications.find((a) => a.id === applicationId);
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      profileKey: currentProfile.id,
      eventType: "status_changed",
      title: "Application Withdrawn",
      body: `You withdrew your application for ${targetApp?.studyTitle || "the study"}.`,
      studyId: targetApp?.studyId,
      applicationId,
      isRead: false,
      createdAt: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
              statusUpdatedAt: "Just now",
              appointmentDate:
                status === "eligible_next_step" || status === "scheduled"
                  ? "Tomorrow at 10:00 AM"
                  : app.appointmentDate,
            }
          : app
      )
    );
  };

  const updateApplicationStatusWithNotes = (
    applicationId: string,
    newStatus: ApplicationStatus,
    participantNote?: string,
    internalNote?: string,
    coordinatorId?: string,
    coordinatorName?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          status: newStatus,
          participantFacingNote: participantNote || app.participantFacingNote,
          internalStaffNote: internalNote || app.internalStaffNote,
          assignedCoordinatorId: coordinatorId || app.assignedCoordinatorId,
          assignedCoordinatorName: coordinatorName || app.assignedCoordinatorName,
          lastStatusChangedByName: coordinatorName || activePI?.name || "Coordinator",
          statusUpdatedAt: "Just now",
          appointmentDate:
            newStatus === "enrolled" ? "Active in Trial Protocol" : app.appointmentDate,
        };
      })
    );

    const targetApp = applications.find((a) => a.id === applicationId);
    if (targetApp) {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        profileKey: targetApp.profileId,
        eventType: "status_changed",
        title: `Status Updated: ${newStatus.replace(/_/g, " ").toUpperCase()}`,
        body:
          participantNote ||
          `Your application for ${targetApp.studyTitle} has moved to ${newStatus.replace(/_/g, " ")}.`,
        studyId: targetApp.studyId,
        applicationId,
        isRead: false,
        createdAt: "Just now",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Tasks logic
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.profileKey === currentProfile.id);
  }, [tasks, currentProfile.id]);

  const pendingTasks = useMemo(() => {
    return myTasks.filter((t) => t.status === "pending");
  }, [myTasks]);

  const completeTask = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "completed", completedAt: "Just now" }
          : t
      )
    );

    // If associated with an app, update app
    if (targetTask.applicationId) {
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === targetTask.applicationId && app.status === "action_needed") {
            return {
              ...app,
              status: "under_review",
              participantFacingNote:
                "Task completed! Coordinator Sarah is reviewing your submission.",
              statusUpdatedAt: "Just now",
            };
          }
          return app;
        })
      );
    }

    // Add confirmation notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      profileKey: currentProfile.id,
      eventType: "task_completed",
      title: "Task Completed",
      body: `You completed "${targetTask.title}". The study team has been notified.`,
      applicationId: targetTask.applicationId,
      taskId,
      isRead: false,
      createdAt: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const createTask = (
    applicationId: string,
    title: string,
    description: string,
    taskType: TaskType,
    dueDate?: string
  ) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    const newTaskId = `task_${Date.now()}`;
    const newTask: ParticipantTask = {
      id: newTaskId,
      applicationId,
      profileKey: targetApp ? targetApp.profileId : currentProfile.id,
      taskType,
      title,
      description,
      status: "pending",
      dueDate: dueDate || "Within 48 hours",
      createdByName: activePI?.name || "Study Coordinator",
      createdAt: "Just now",
    };

    setTasks((prev) => [newTask, ...prev]);

    // Transition application status to action_needed
    if (targetApp) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status: "action_needed",
                participantFacingNote: `Action requested: ${title}. Please complete this task to advance your application.`,
                statusUpdatedAt: "Just now",
              }
            : app
        )
      );

      // Notification
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        profileKey: targetApp.profileId,
        eventType: "action_required",
        title: "Action Required: " + title,
        body: description,
        studyId: targetApp.studyId,
        applicationId,
        taskId: newTaskId,
        isRead: false,
        createdAt: "Just now",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Notifications logic
  const myNotifications = useMemo(() => {
    return notifications.filter((n) => n.profileKey === currentProfile.id);
  }, [notifications, currentProfile.id]);

  const unreadNotificationCount = useMemo(() => {
    return myNotifications.filter((n) => !n.isRead).length;
  }, [myNotifications]);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.profileKey === currentProfile.id ? { ...n, isRead: true } : n
      )
    );
  };

  // Consents logic
  const myConsents = useMemo(() => {
    return consents.filter((c) => c.profileKey === currentProfile.id);
  }, [consents, currentProfile.id]);

  const toggleConsent = (consentType: ConsentType) => {
    setConsents((prev) => {
      const existing = prev.find(
        (c) => c.profileKey === currentProfile.id && c.consentType === consentType
      );
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                isGranted: !c.isGranted,
                revokedAt: c.isGranted ? "Just now" : undefined,
                grantedAt: !c.isGranted ? "Just now" : c.grantedAt,
              }
            : c
        );
      } else {
        const newConsent: ParticipantConsent = {
          id: `consent_${Date.now()}`,
          profileKey: currentProfile.id,
          consentType,
          version: "2026.1",
          isGranted: true,
          grantedAt: "Just now",
        };
        return [...prev, newConsent];
      }
    });
  };

  // Reminders
  const toggleReminder = (reminderId: string) => {
    setReminders((prev) =>
      prev.map((rem) =>
        rem.id === reminderId ? { ...rem, isCompleted: !rem.isCompleted } : rem
      )
    );
  };

  // Profile completion score and checklist
  const profileChecklist: ProfileChecklistResult = useMemo(() => {
    const items = [
      {
        key: "contact",
        label: "Contact & Identity",
        done: Boolean(currentProfile.fullName && currentProfile.email && currentProfile.phone),
        description: "Full legal name, email, and phone for coordinator outreach",
      },
      {
        key: "location",
        label: "Location & Travel",
        done: Boolean(currentProfile.city && currentProfile.state && currentProfile.travelDistanceMiles),
        description: "Commute radius and NIH geographic representation context",
      },
      {
        key: "health",
        label: "Clinical Health Context",
        done: Boolean(
          currentProfile.isHealthyVolunteer ||
            (currentProfile.conditions && currentProfile.conditions.length > 0)
        ),
        description: "Healthy volunteer declaration or disclosed medical conditions",
      },
      {
        key: "logistics",
        label: "Logistics & Accommodations",
        done: Boolean(
          currentProfile.preferredContactMethod &&
            currentProfile.transportationAccess &&
            currentProfile.preferredLocationType
        ),
        description: "Transit access, trial setting preference, and caregiver needs",
      },
      {
        key: "consents",
        label: "Privacy & Matching Consent",
        done: Boolean(
          myConsents.find((c) => c.consentType === "matching_communications" && c.isGranted)
        ),
        description: "Consent for matching algorithm and essential trial updates",
      },
    ];

    const completed = items.filter((i) => i.done).length;
    const score = Math.round((completed / items.length) * 100);

    return {
      score,
      completedCount: completed,
      totalCount: items.length,
      items,
    };
  }, [currentProfile, myConsents]);

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
        profileChecklist,
        studies: studiesWithMatch,
        savedStudyIds,
        toggleSaveStudy,
        updateStudy,
        createStudy,
        closeStudyRecruitment,
        applications,
        myApplications,
        inProgressApplications,
        activeApplications,
        historyApplications,
        recommendedStudies,
        submitApplication,
        withdrawApplication,
        updateApplicationStatus,
        updateApplicationStatusWithNotes,
        tasks,
        myTasks,
        pendingTasks,
        completeTask,
        createTask,
        notifications,
        myNotifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        consents,
        myConsents,
        toggleConsent,
        reminders,
        toggleReminder,
      }}
    >
      {children}
    </StudyStoreContext.Provider>
  );
}

export function useStudyStore() {
  const context = useContext(StudyStoreContext);
  if (!context) {
    throw new Error("useStudyStore must be used within a StudyStoreProvider");
  }
  return context;
}

