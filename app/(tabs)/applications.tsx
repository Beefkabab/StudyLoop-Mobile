import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useStudyStore, StudyWithMatch } from "../../hooks/useStudyStore";
import { ApplicationStatus, ParticipantTask, StudyApplication } from "../../constants/types";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  action_needed: { label: "Action Needed", bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  under_review: { label: "Under Review", bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  submitted: { label: "Submitted", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  pre_screening: { label: "Pre-Screening", bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
  eligible_next_step: { label: "Eligible for Next Step", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  enrolled: { label: "Enrolled in Trial", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  completed: { label: "Completed Protocol", bg: "#f8fafc", text: "#0f172a", border: "#cbd5e1" },
  not_selected: { label: "Not Selected", bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  withdrawn: { label: "Withdrawn", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  study_closed: { label: "Recruitment Closed", bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  draft: { label: "Draft", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  // Legacy mappings
  screener_passed: { label: "Qualified Site Handoff", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  scheduled: { label: "Initial Visit Booked", bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  pending_contact: { label: "Coordinator Review", bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  screened_out: { label: "Protocol Excluded", bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
};

const NEXT_STEP_GUIDE: Record<string, string> = {
  action_needed: "Your action is required to advance this application. See task details below.",
  under_review: "The clinical team is reviewing your medical screener against protocol criteria.",
  submitted: "Application received. Waiting for research team intake assignment.",
  pre_screening: "Coordinator phone intake or baseline qualification in progress.",
  eligible_next_step: "Pre-screen verified! You are approved to schedule your initial clinic visit.",
  enrolled: "Active protocol participant. Attend scheduled appointments and log daily reports.",
  completed: "Protocol completed. Thank you for contributing to clinical research.",
  not_selected: "Protocol inclusion targets did not match your profile. You remain active for other studies.",
  withdrawn: "Application respectfully withdrawn at your request.",
  study_closed: "Recruitment reached capacity. Check alternative study recommendations below.",
  draft: "Complete and submit your pre-screener answers to apply.",
};

const WITHDRAW_REASONS = [
  "Schedule conflict or timing issues",
  "Travel distance to site is too far",
  "Enrolled in another clinical study",
  "Personal, health, or family reasons",
  "Prefer not to specify",
];

export default function ApplicationsScreen() {
  const router = useRouter();
  const {
    inProgressApplications,
    activeApplications,
    historyApplications,
    recommendedStudies,
    myTasks,
    completeTask,
    withdrawApplication,
    reminders,
    toggleReminder,
    savedStudyIds,
    toggleSaveStudy,
    studies,
  } = useStudyStore();

  const [activeTab, setActiveTab] = useState<"lifecycle" | "tasks" | "saved">("lifecycle");

  // Task resolution modal
  const [selectedTask, setSelectedTask] = useState<ParticipantTask | null>(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Withdraw modal
  const [withdrawModalApp, setWithdrawModalApp] = useState<StudyApplication | null>(null);
  const [selectedWithdrawReason, setSelectedWithdrawReason] = useState<string>(WITHDRAW_REASONS[0]);

  // Coordinator contact modal
  const [contactModalApp, setContactModalApp] = useState<StudyApplication | null>(null);
  const [contactMessage, setContactMessage] = useState("");

  const savedStudiesList = studies.filter((s) => savedStudyIds.includes(s.id));
  const totalMyStudies = inProgressApplications.length + activeApplications.length;

  const handleResolveTask = () => {
    if (!selectedTask) return;
    setTaskSubmitting(true);
    setTimeout(() => {
      completeTask(selectedTask.id);
      setTaskSubmitting(false);
      setSelectedTask(null);
      Alert.alert(
        "Task Completed!",
        `"${selectedTask.title}" has been completed and coordinator Sarah Lindquist has been notified.`
      );
    }, 400);
  };

  const handleConfirmWithdraw = () => {
    if (!withdrawModalApp) return;
    withdrawApplication(withdrawModalApp.id, selectedWithdrawReason);
    setWithdrawModalApp(null);
    Alert.alert(
      "Application Withdrawn",
      "Your application was respectfully withdrawn. We've suggested top alternative studies below."
    );
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      Alert.alert("Please enter a message", "Type a note to the study coordinator.");
      return;
    }
    Alert.alert(
      "Message Sent",
      `Your secure message was transmitted to coordinator Sarah Lindquist at ${contactModalApp?.sponsorName}.`
    );
    setContactMessage("");
    setContactModalApp(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sub Tabs */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "lifecycle" && styles.tabBtnActive]}
            onPress={() => setActiveTab("lifecycle")}
          >
            <Text style={[styles.tabBtnText, activeTab === "lifecycle" && styles.tabBtnTextActive]}>
              My Studies ({totalMyStudies})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "tasks" && styles.tabBtnActive]}
            onPress={() => setActiveTab("tasks")}
          >
            <Text style={[styles.tabBtnText, activeTab === "tasks" && styles.tabBtnTextActive]}>
              Schedule & Tasks ({myTasks.filter((t) => t.status === "pending").length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "saved" && styles.tabBtnActive]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={[styles.tabBtnText, activeTab === "saved" && styles.tabBtnTextActive]}>
              Saved ({savedStudiesList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab 1: Participant Lifecycle Platform (4 Sections) */}
      {activeTab === "lifecycle" && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Medical Disclaimer Banner */}
          <View style={styles.disclaimerBanner}>
            <MaterialIcons name="security" size={16} color="#0284c7" />
            <Text style={styles.disclaimerText}>
              <Text style={{ fontWeight: "700" }}>Trust & Safety Notice:</Text> StudyLoop does not provide medical advice or determine clinical eligibility. Trial eligibility is confirmed directly by study teams.
            </Text>
          </View>

          {/* ================= SECTION 1: IN PROGRESS ================= */}
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionDotInProgress} />
            <Text style={styles.sectionHeading}>In Progress ({inProgressApplications.length})</Text>
          </View>
          <Text style={styles.sectionSub}>
            Applications under active coordinator review, pre-screening, or requiring your input.
          </Text>

          {inProgressApplications.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="assignment-late" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Applications In Progress</Text>
              <Text style={styles.emptySub}>
                Explore available clinical trials on the Discover tab to start an application.
              </Text>
            </View>
          ) : (
            inProgressApplications.map((app) => {
              const conf = statusConfig[app.status] || statusConfig.submitted;
              const isActionNeeded = app.status === "action_needed";
              const isWaiting =
                app.status === "submitted" ||
                app.status === "under_review" ||
                app.status === "pre_screening";
              const appTasks = myTasks.filter((t) => t.applicationId === app.id && t.status === "pending");

              return (
                <View key={app.id} style={[styles.appCard, isActionNeeded && styles.appCardAction]}>
                  {/* Top Bar: Badge & Stipend */}
                  <View style={styles.appCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                      <Text style={[styles.statusBadgeText, { color: conf.text }]}>{conf.label}</Text>
                    </View>
                    <Text style={styles.appPay}>${app.compensationAmount}</Text>
                  </View>

                  <Text style={styles.appTitle}>{app.studyTitle}</Text>
                  <Text style={styles.appSponsor}>
                    {app.sponsorName} {app.assignedCoordinatorName ? `• ${app.assignedCoordinatorName}` : ""}
                  </Text>

                  {/* "What Happens Next?" Guidance */}
                  <View style={styles.guideBox}>
                    <MaterialIcons
                      name={isActionNeeded ? "error-outline" : "info-outline"}
                      size={14}
                      color={isActionNeeded ? "#ea580c" : "#0284c7"}
                    />
                    <Text style={styles.guideText}>
                      {NEXT_STEP_GUIDE[app.status] || "Your application is being processed."}
                    </Text>
                  </View>

                  {/* State Flag: Waiting on Study Team vs Action Needed */}
                  <View style={styles.stateFlagRow}>
                    {isWaiting && (
                      <View style={styles.waitingFlag}>
                        <MaterialIcons name="schedule" size={12} color="#64748b" />
                        <Text style={styles.waitingFlagText}>Waiting on Study Team</Text>
                      </View>
                    )}
                    {isActionNeeded && (
                      <View style={styles.actionFlag}>
                        <MaterialIcons name="notification-important" size={12} color="#ea580c" />
                        <Text style={styles.actionFlagText}>Action Required from You</Text>
                      </View>
                    )}
                    {app.statusUpdatedAt && (
                      <Text style={styles.updatedText}>Updated {app.statusUpdatedAt}</Text>
                    )}
                  </View>

                  {/* Participant-Facing Coordinator Note */}
                  {app.participantFacingNote && (
                    <View style={styles.notesRow}>
                      <MaterialIcons name="record-voice-over" size={13} color="#0f172a" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notesLabel}>Coordinator Update:</Text>
                        <Text style={styles.notesText}>{app.participantFacingNote}</Text>
                      </View>
                    </View>
                  )}

                  {/* Pending Action Task Box */}
                  {appTasks.length > 0 && (
                    <View style={styles.taskAlertBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskAlertTitle}>Requested Action:</Text>
                        <Text style={styles.taskAlertDesc}>{appTasks[0].title}</Text>
                        {appTasks[0].dueDate && (
                          <Text style={styles.taskAlertDue}>Due: {appTasks[0].dueDate}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.taskAlertBtn}
                        onPress={() => setSelectedTask(appTasks[0])}
                      >
                        <Text style={styles.taskAlertBtnText}>Complete Task</Text>
                        <MaterialIcons name="arrow-forward" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Card Actions Footer */}
                  <View style={styles.appCardFooter}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => setContactModalApp(app)}
                    >
                      <MaterialIcons name="mail-outline" size={13} color="#0284c7" />
                      <Text style={styles.contactBtnText}>Message Coordinator</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      onPress={() => setWithdrawModalApp(app)}
                    >
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* ================= SECTION 2: ACTIVE STUDIES ================= */}
          <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
            <View style={styles.sectionDotActive} />
            <Text style={styles.sectionHeading}>Active Studies ({activeApplications.length})</Text>
          </View>
          <Text style={styles.sectionSub}>
            Trials in which you are currently enrolled and participating.
          </Text>

          {activeApplications.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="check-circle-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Enrolled Studies</Text>
              <Text style={styles.emptySub}>
                When you pass screening and complete baseline intake, your enrolled studies will appear here.
              </Text>
            </View>
          ) : (
            activeApplications.map((app) => (
              <View key={app.id} style={styles.activeCard}>
                <View style={styles.activeCardTop}>
                  <View style={styles.enrolledBadge}>
                    <MaterialIcons name="verified" size={13} color="#16a34a" />
                    <Text style={styles.enrolledBadgeText}>ENROLLED PARTICIPANT</Text>
                  </View>
                  <Text style={styles.activePay}>${app.compensationAmount}</Text>
                </View>

                <Text style={styles.activeTitle}>{app.studyTitle}</Text>
                <Text style={styles.activeSponsor}>{app.sponsorName}</Text>

                {app.appointmentDate && (
                  <View style={styles.activeMilestoneRow}>
                    <MaterialIcons name="event" size={14} color="#16a34a" />
                    <Text style={styles.activeMilestoneText}>Next Milestone: {app.appointmentDate}</Text>
                  </View>
                )}

                {app.participantFacingNote && (
                  <Text style={styles.activeNote}>{app.participantFacingNote}</Text>
                )}

                <TouchableOpacity
                  style={styles.activeContactBtn}
                  onPress={() => setContactModalApp(app)}
                >
                  <MaterialIcons name="chat" size={14} color="#ffffff" />
                  <Text style={styles.activeContactBtnText}>Contact Protocol Team</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* ================= SECTION 3: RECOMMENDED FOR YOU ================= */}
          <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
            <MaterialIcons name="auto-awesome" size={18} color="#0284c7" />
            <Text style={styles.sectionHeading}>Recommended for You ({recommendedStudies.length})</Text>
          </View>
          <Text style={styles.sectionSub}>
            Opportunities matching your health profile, commute radius, and study preferences.
          </Text>

          {recommendedStudies.map((study) => (
            <View key={study.id} style={styles.recCard}>
              <View style={styles.recTopRow}>
                <View style={styles.recMatchBadge}>
                  <MaterialIcons name="auto-awesome" size={12} color="#0284c7" />
                  <Text style={styles.recMatchText}>{study.match.score}% Match</Text>
                </View>
                <Text style={styles.recPay}>${study.compensationAmount}</Text>
              </View>

              <Text style={styles.recTitle}>{study.title}</Text>
              <Text style={styles.recSponsor}>{study.sponsorName} • {study.city}, {study.state}</Text>

              {study.match.matchReasons && study.match.matchReasons.length > 0 && (
                <View style={styles.matchReasonRow}>
                  <MaterialIcons name="check" size={12} color="#059669" />
                  <Text style={styles.matchReasonText}>
                    {study.match.matchReasons.slice(0, 2).join(" • ")}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.recApplyBtn}
                onPress={() => router.push({ pathname: "/(tabs)", params: { study: study.id } })}
              >
                <Text style={styles.recApplyBtnText}>View Study & Pre-Screen</Text>
                <MaterialIcons name="arrow-forward" size={13} color="#0284c7" />
              </TouchableOpacity>
            </View>
          ))}

          {/* ================= SECTION 4: STUDY HISTORY ================= */}
          <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
            <MaterialIcons name="history" size={18} color="#64748b" />
            <Text style={styles.sectionHeading}>Study History ({historyApplications.length})</Text>
          </View>
          <Text style={styles.sectionSub}>
            Completed protocols, respectfully declined screeners, closed studies, and withdrawn applications.
          </Text>

          {historyApplications.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="history-toggle-off" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Study History</Text>
              <Text style={styles.emptySub}>Past closed or completed studies will be archived here.</Text>
            </View>
          ) : (
            historyApplications.map((app) => {
              const conf = statusConfig[app.status] || statusConfig.not_selected;
              return (
                <View key={app.id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                      <Text style={[styles.statusBadgeText, { color: conf.text }]}>{conf.label}</Text>
                    </View>
                    <Text style={styles.historyPay}>${app.compensationAmount}</Text>
                  </View>

                  <Text style={styles.historyTitle}>{app.studyTitle}</Text>
                  <Text style={styles.historySponsor}>{app.sponsorName}</Text>

                  {/* Respectful guidance */}
                  <View style={styles.historyGuidanceBox}>
                    <MaterialIcons name="info-outline" size={13} color="#64748b" />
                    <Text style={styles.historyGuidanceText}>
                      {app.participantFacingNote ||
                        NEXT_STEP_GUIDE[app.status] ||
                        "This trial record is now closed. Your profile remains active for other studies."}
                    </Text>
                  </View>

                  {app.withdrawalReason && (
                    <Text style={styles.withdrawalReasonText}>
                      Reason noted: {app.withdrawalReason}
                    </Text>
                  )}

                  {/* Alternative suggestions nudge */}
                  <TouchableOpacity
                    style={styles.historyExploreBtn}
                    onPress={() => router.push("/(tabs)")}
                  >
                    <MaterialIcons name="explore" size={13} color="#0284c7" />
                    <Text style={styles.historyExploreBtnText}>Browse Active Alternatives in Discover</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Tab 2: Schedule & Tasks */}
      {activeTab === "tasks" && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.tabIntroTitle}>Participant Tasks & Action Items</Text>
          <Text style={styles.tabIntroSubtitle}>
            Tasks requested by study teams to verify contact info, confirm clinic visit dates, or complete screeners.
          </Text>

          {myTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="task-alt" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>No pending tasks right now. Coordinators will alert you here if needed.</Text>
            </View>
          ) : (
            myTasks.map((t) => {
              const isDone = t.status === "completed";
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.taskCard, isDone && styles.taskCardDone]}
                  onPress={() => !isDone && setSelectedTask(t)}
                  activeOpacity={0.8}
                >
                  <View style={styles.taskCardTop}>
                    <MaterialIcons
                      name={isDone ? "check-circle" : "radio-button-unchecked"}
                      size={20}
                      color={isDone ? "#16a34a" : "#ea580c"}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{t.title}</Text>
                      <Text style={styles.taskDesc}>{t.description}</Text>
                    </View>
                  </View>

                  <View style={styles.taskFooter}>
                    {t.dueDate && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MaterialIcons name="schedule" size={12} color="#64748b" />
                        <Text style={styles.taskDueText}>Due: {t.dueDate}</Text>
                      </View>
                    )}
                    {!isDone ? (
                      <View style={styles.taskActionBadge}>
                        <Text style={styles.taskActionBadgeText}>Tap to Complete</Text>
                      </View>
                    ) : (
                      <Text style={styles.taskCompletedText}>Completed {t.completedAt || ""}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Clinic Visit Reminders */}
          <Text style={[styles.tabIntroTitle, { marginTop: 24 }]}>Clinic Visit Milestones</Text>
          <Text style={styles.tabIntroSubtitle}>Scheduled appointments and fasting reminders.</Text>

          {reminders.map((rem) => (
            <TouchableOpacity
              key={rem.id}
              style={[styles.reminderCard, rem.isCompleted && styles.reminderCardDone]}
              onPress={() => toggleReminder(rem.id)}
            >
              <View style={styles.reminderTop}>
                <MaterialIcons
                  name={rem.isCompleted ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={rem.isCompleted ? "#16a34a" : "#0284c7"}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.reminderTitle, rem.isCompleted && styles.reminderTitleDone]}>
                    {rem.title}
                  </Text>
                  <Text style={styles.reminderStudy}>{rem.studyTitle}</Text>
                </View>
              </View>
              <View style={styles.scheduleRow}>
                <MaterialIcons name="alarm" size={13} color="#64748b" />
                <Text style={styles.scheduleTime}>{rem.scheduledFor}</Text>
              </View>
              <Text style={styles.reminderNotes}>{rem.notes}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab 3: Saved Trials */}
      {activeTab === "saved" && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.tabIntroTitle}>Bookmarked Opportunities</Text>
          <Text style={styles.tabIntroSubtitle}>Studies you saved to review criteria and apply later.</Text>

          {savedStudiesList.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="bookmark-border" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Saved Studies</Text>
              <Text style={styles.emptySub}>Tap the bookmark icon on any study card in Discover to save it here.</Text>
            </View>
          ) : (
            savedStudiesList.map((item) => (
              <View key={item.id} style={styles.savedCard}>
                <View style={styles.savedCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedTitle}>{item.title}</Text>
                    <Text style={styles.savedSponsor}>{item.sponsorName} • {item.city}, {item.state}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleSaveStudy(item.id)} style={{ padding: 4 }}>
                    <MaterialIcons name="bookmark" size={22} color="#0284c7" />
                  </TouchableOpacity>
                </View>
                <View style={styles.savedDetailsRow}>
                  <Text style={styles.savedPay}>${item.compensationAmount}</Text>
                  <Text style={styles.savedMatch}>{item.match.score}% Match</Text>
                  <Text style={styles.savedCommitment}>{item.timeCommitment.split(" (")[0]}</Text>
                </View>
                <TouchableOpacity
                  style={styles.savedScreenBtn}
                  onPress={() => router.push({ pathname: "/(tabs)", params: { study: item.id } })}
                >
                  <Text style={styles.savedScreenBtnText}>Open in Discover & Screen</Text>
                  <MaterialIcons name="arrow-forward" size={14} color="#0284c7" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ================= MODAL 1: TASK RESOLUTION ================= */}
      <Modal visible={Boolean(selectedTask)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Participant Task</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.taskModalTypeBadge}>
                  <MaterialIcons name="assignment" size={14} color="#0284c7" />
                  <Text style={styles.taskModalTypeText}>
                    {selectedTask.taskType.replace(/_/g, " ").toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.taskModalTitle}>{selectedTask.title}</Text>
                <Text style={styles.taskModalDesc}>{selectedTask.description}</Text>

                <View style={styles.taskModalMetaRow}>
                  <Text style={styles.taskModalMetaLabel}>Requested by:</Text>
                  <Text style={styles.taskModalMetaVal}>{selectedTask.createdByName || "Study Coordinator"}</Text>
                </View>

                {selectedTask.dueDate && (
                  <View style={styles.taskModalMetaRow}>
                    <Text style={styles.taskModalMetaLabel}>Due date:</Text>
                    <Text style={styles.taskModalMetaVal}>{selectedTask.dueDate}</Text>
                  </View>
                )}

                <View style={styles.taskConfirmationBox}>
                  <MaterialIcons name="verified-user" size={16} color="#059669" />
                  <Text style={styles.taskConfirmationText}>
                    By confirming this action, you verify that your availability or information has been confirmed for the research team.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.taskModalSubmitBtn, taskSubmitting && { opacity: 0.7 }]}
                  onPress={handleResolveTask}
                  disabled={taskSubmitting}
                >
                  <MaterialIcons name="check" size={16} color="#ffffff" />
                  <Text style={styles.taskModalSubmitBtnText}>
                    {taskSubmitting ? "Updating Status..." : "Confirm & Complete Task"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: APPLICATION WITHDRAWAL ================= */}
      <Modal visible={Boolean(withdrawModalApp)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Withdraw Application</Text>
              <TouchableOpacity onPress={() => setWithdrawModalApp(null)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {withdrawModalApp && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.withdrawModalSub}>
                  Are you sure you want to withdraw your application for:
                </Text>
                <Text style={styles.withdrawModalStudyTitle}>{withdrawModalApp.studyTitle}</Text>

                <Text style={styles.withdrawReasonHeader}>Select a reason (optional):</Text>
                {WITHDRAW_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.withdrawReasonOption,
                      selectedWithdrawReason === r && styles.withdrawReasonOptionActive,
                    ]}
                    onPress={() => setSelectedWithdrawReason(r)}
                  >
                    <MaterialIcons
                      name={selectedWithdrawReason === r ? "radio-button-checked" : "radio-button-unchecked"}
                      size={18}
                      color={selectedWithdrawReason === r ? "#0284c7" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.withdrawReasonText,
                        selectedWithdrawReason === r && styles.withdrawReasonTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.withdrawNoteBox}>
                  <Text style={styles.withdrawNoteText}>
                    Withdrawing will respectfully notify the coordinator and release your interview slot. You can still apply to other studies at any time.
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => setWithdrawModalApp(null)}
                  >
                    <Text style={styles.cancelModalBtnText}>Keep Application</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmWithdrawBtn}
                    onPress={handleConfirmWithdraw}
                  >
                    <Text style={styles.confirmWithdrawBtnText}>Confirm Withdrawal</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: COORDINATOR CONTACT ================= */}
      <Modal visible={Boolean(contactModalApp)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Message Study Coordinator</Text>
              <TouchableOpacity onPress={() => setContactModalApp(null)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {contactModalApp && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.coordinatorInfoCard}>
                  <MaterialIcons name="person" size={24} color="#0284c7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.coordinatorInfoName}>
                      {contactModalApp.assignedCoordinatorName || "Sarah Lindquist, CRC"}
                    </Text>
                    <Text style={styles.coordinatorInfoSponsor}>
                      Clinical Research Coordinator • {contactModalApp.sponsorName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Your Message:</Text>
                <TextInput
                  style={styles.messageInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Ask a question about protocol visit times, compensation, or study requirements..."
                  placeholderTextColor="#94a3b8"
                  value={contactMessage}
                  onChangeText={setContactMessage}
                />

                <TouchableOpacity
                  style={styles.sendMessageBtn}
                  onPress={handleSendMessage}
                >
                  <MaterialIcons name="send" size={15} color="#ffffff" />
                  <Text style={styles.sendMessageBtnText}>Send Encrypted Message</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  tabBarContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabBtnText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  tabBtnTextActive: { color: "#0f172a", fontWeight: "800" },

  listContent: { padding: 16, paddingBottom: 40 },

  /* Trust Banner */
  disclaimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  disclaimerText: { fontSize: 11, color: "#0369a1", flex: 1, lineHeight: 15 },

  /* Section Headings */
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  sectionDotInProgress: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0284c7" },
  sectionDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  sectionHeading: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: 12 },

  /* Empty States */
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginTop: 8 },
  emptySub: { fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 4, lineHeight: 15 },

  /* In Progress Cards */
  appCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  appCardAction: {
    borderColor: "#fdba74",
    backgroundColor: "#fffdfa",
  },
  appCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  appPay: { fontSize: 16, fontWeight: "900", color: "#059669" },
  appTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
  appSponsor: { fontSize: 11, color: "#64748b", marginTop: 2, marginBottom: 8 },

  guideBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  guideText: { fontSize: 11, color: "#334155", flex: 1, lineHeight: 15 },

  stateFlagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  waitingFlag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waitingFlagText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  actionFlag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffedd5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionFlagText: { fontSize: 10, fontWeight: "800", color: "#c2410c" },
  updatedText: { fontSize: 10, color: "#94a3b8" },

  notesRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#fafaf9",
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0284c7",
    marginBottom: 10,
  },
  notesLabel: { fontSize: 10, fontWeight: "800", color: "#0f172a" },
  notesText: { fontSize: 11, color: "#334155", marginTop: 1, lineHeight: 15 },

  taskAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  taskAlertTitle: { fontSize: 10, fontWeight: "800", color: "#9a3412" },
  taskAlertDesc: { fontSize: 12, fontWeight: "700", color: "#7c2d12", marginTop: 1 },
  taskAlertDue: { fontSize: 10, color: "#c2410c", marginTop: 2 },
  taskAlertBtn: {
    backgroundColor: "#ea580c",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  taskAlertBtnText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },

  appCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  contactBtnText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  withdrawBtn: { padding: 4 },
  withdrawBtnText: { fontSize: 11, fontWeight: "600", color: "#94a3b8" },

  /* Active Study Cards */
  activeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  activeCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  enrolledBadgeText: { fontSize: 10, fontWeight: "800", color: "#16a34a" },
  activePay: { fontSize: 16, fontWeight: "900", color: "#059669" },
  activeTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  activeSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  activeMilestoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  activeMilestoneText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  activeNote: { fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 15 },
  activeContactBtn: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  activeContactBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },

  /* Recommended Card */
  recCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  recTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  recMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  recMatchText: { fontSize: 10, fontWeight: "800", color: "#0284c7" },
  recPay: { fontSize: 15, fontWeight: "900", color: "#059669" },
  recTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  recSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  matchReasonRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  matchReasonText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  recApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 8,
  },
  recApplyBtnText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },

  /* History Card */
  historyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    opacity: 0.9,
  },
  historyCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  historyPay: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  historyTitle: { fontSize: 14, fontWeight: "800", color: "#334155" },
  historySponsor: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  historyGuidanceBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  historyGuidanceText: { fontSize: 11, color: "#64748b", flex: 1, lineHeight: 15 },
  withdrawalReasonText: { fontSize: 10, fontStyle: "italic", color: "#94a3b8", marginTop: 4 },
  historyExploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  historyExploreBtnText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },

  /* Tasks tab */
  tabIntroTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  tabIntroSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2, marginBottom: 14 },
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
    marginBottom: 10,
  },
  taskCardDone: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", opacity: 0.8 },
  taskCardTop: { flexDirection: "row", alignItems: "flex-start" },
  taskTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  taskTitleDone: { textDecorationLine: "line-through", color: "#64748b" },
  taskDesc: { fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 15 },
  taskFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  taskDueText: { fontSize: 10, color: "#64748b" },
  taskActionBadge: { backgroundColor: "#ea580c", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  taskActionBadgeText: { fontSize: 9, fontWeight: "800", color: "#ffffff" },
  taskCompletedText: { fontSize: 10, color: "#16a34a", fontWeight: "700" },

  /* Reminder card */
  reminderCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10 },
  reminderCardDone: { backgroundColor: "#f8fafc", opacity: 0.7 },
  reminderTop: { flexDirection: "row", alignItems: "flex-start" },
  reminderTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  reminderTitleDone: { textDecorationLine: "line-through", color: "#64748b" },
  reminderStudy: { fontSize: 11, color: "#64748b" },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  scheduleTime: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  reminderNotes: { fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 14 },

  /* Saved Card */
  savedCard: { backgroundColor: "#ffffff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
  savedCardTop: { flexDirection: "row", justifyContent: "space-between" },
  savedTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  savedSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  savedDetailsRow: { flexDirection: "row", gap: 12, alignItems: "center", marginVertical: 10 },
  savedPay: { fontSize: 15, fontWeight: "900", color: "#059669" },
  savedMatch: { fontSize: 11, fontWeight: "800", color: "#0284c7", backgroundColor: "#f0f9ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  savedCommitment: { fontSize: 11, color: "#64748b" },
  savedScreenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  savedScreenBtnText: { fontSize: 12, fontWeight: "700", color: "#0284c7" },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalHeaderTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },

  taskModalTypeBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f0f9ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 8 },
  taskModalTypeText: { fontSize: 10, fontWeight: "800", color: "#0284c7" },
  taskModalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  taskModalDesc: { fontSize: 13, color: "#475569", lineHeight: 18, marginBottom: 12 },
  taskModalMetaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  taskModalMetaLabel: { fontSize: 12, color: "#64748b" },
  taskModalMetaVal: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  taskConfirmationBox: { flexDirection: "row", gap: 8, backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginVertical: 14 },
  taskConfirmationText: { fontSize: 11, color: "#065f46", flex: 1, lineHeight: 15 },
  taskModalSubmitBtn: { backgroundColor: "#0284c7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  taskModalSubmitBtnText: { fontSize: 14, fontWeight: "800", color: "#ffffff" },

  withdrawModalSub: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  withdrawModalStudyTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 14 },
  withdrawReasonHeader: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 8 },
  withdrawReasonOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 6 },
  withdrawReasonOptionActive: { borderColor: "#0284c7", backgroundColor: "#f0f9ff" },
  withdrawReasonText: { fontSize: 12, color: "#475569" },
  withdrawReasonTextActive: { color: "#0284c7", fontWeight: "700" },
  withdrawNoteBox: { backgroundColor: "#f8fafc", padding: 10, borderRadius: 8, marginVertical: 10 },
  withdrawNoteText: { fontSize: 11, color: "#64748b", lineHeight: 15 },
  cancelModalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center" },
  cancelModalBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  confirmWithdrawBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#dc2626", alignItems: "center" },
  confirmWithdrawBtnText: { fontSize: 12, fontWeight: "800", color: "#ffffff" },

  coordinatorInfoCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14 },
  coordinatorInfoName: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  coordinatorInfoSponsor: { fontSize: 11, color: "#64748b", marginTop: 1 },
  label: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  messageInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, fontSize: 13, color: "#0f172a", textAlignVertical: "top", minHeight: 90, marginBottom: 14 },
  sendMessageBtn: { backgroundColor: "#0284c7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  sendMessageBtnText: { fontSize: 13, fontWeight: "800", color: "#ffffff" },
});

