import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useStudyStore } from "../../hooks/useStudyStore";
import {
  ApplicationStatus,
  TaskType,
  StudyApplication,
  ParticipantProfile,
} from "../../constants/types";
import ManageStudyModal from "../../components/ManageStudyModal";
import { DEMO_PERSONAS } from "../../constants/sampleData";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  draft: { label: "Draft", bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", icon: "edit-note" },
  submitted: { label: "Submitted", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: "send" },
  under_review: { label: "Under Review", bg: "#fef3c7", border: "#fde68a", text: "#b45309", icon: "hourglass-top" },
  action_needed: { label: "Action Needed", bg: "#fee2e2", border: "#fca5a5", text: "#b91c1c", icon: "warning" },
  pre_screening: { label: "Pre-Screening", bg: "#e0f2fe", border: "#7dd3fc", text: "#0369a1", icon: "assignment" },
  eligible_next_step: { label: "Eligible / Next Step", bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", icon: "check-circle" },
  enrolled: { label: "Enrolled", bg: "#f3e8ff", border: "#d8b4fe", text: "#7e22ce", icon: "verified-user" },
  completed: { label: "Completed", bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", icon: "task-alt" },
  not_selected: { label: "Not Selected", bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", icon: "cancel" },
  withdrawn: { label: "Withdrawn", bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "remove-circle" },
  study_closed: { label: "Study Closed", bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", icon: "lock" },
  // legacy
  screener_passed: { label: "Pre-Screen Passed", bg: "#e0f2fe", border: "#7dd3fc", text: "#0369a1", icon: "assignment" },
  scheduled: { label: "Scheduled", bg: "#fef3c7", border: "#fde68a", text: "#b45309", icon: "event" },
  rejected: { label: "Not Selected", bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", icon: "cancel" },
};

const ALL_11_STATUSES: { id: ApplicationStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under Review" },
  { id: "action_needed", label: "Action Needed" },
  { id: "pre_screening", label: "Pre-Screening" },
  { id: "eligible_next_step", label: "Eligible / Next Step" },
  { id: "enrolled", label: "Enrolled" },
  { id: "completed", label: "Completed" },
  { id: "not_selected", label: "Not Selected" },
  { id: "withdrawn", label: "Withdrawn" },
  { id: "study_closed", label: "Study Closed" },
];

const TASK_TYPE_OPTIONS: { id: TaskType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: "document_upload", label: "Lab / Document Upload", icon: "upload-file" },
  { id: "survey", label: "Health Survey", icon: "rate-review" },
  { id: "scheduling", label: "Visit Scheduling", icon: "calendar-today" },
  { id: "consent", label: "Informed Consent", icon: "draw" },
  { id: "profile_update", label: "Profile Update", icon: "badge" },
  { id: "visit", label: "In-Person Clinic Visit", icon: "domain" },
];

const COORDINATOR_OPTIONS = [
  { id: "coord_sarah", name: "Sarah Lindquist, CRC" },
  { id: "coord_patel", name: "Dr. David Patel, MD" },
  { id: "coord_elena", name: "Elena Vance, Lead RN" },
];

export default function ResearcherScreen() {
  const {
    applications,
    updateApplicationStatusWithNotes,
    createTask,
    closeStudyRecruitment,
    userRole,
    activePI,
    openLoginModal,
    exitPIToConsumer,
    studies,
  } = useStudyStore();

  const [activeSegment, setActiveSegment] = useState<"pipeline" | "diversity" | "protocols">("pipeline");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [manageModalVisible, setManageModalVisible] = useState(false);

  // Candidate Detail Drawer / Modal
  const [selectedApp, setSelectedApp] = useState<StudyApplication | null>(null);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>("submitted");
  const [participantNote, setParticipantNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [assignedCoord, setAssignedCoord] = useState<{ id: string; name: string }>(COORDINATOR_OPTIONS[0]);

  // Task Assignment Modal
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("document_upload");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("Within 3 business days");

  // For a PI, ALWAYS strictly scope to their single study - NO other studies accessible!
  const isPI = Boolean(userRole === "pi" && activePI && activePI.studyId !== "all");

  const currentPIStudy = activePI
    ? (studies.find((s) => s.id === activePI.studyId) || studies[0])
    : null;

  const baseApplications = isPI
    ? applications.filter((a) => a.studyId === activePI!.studyId)
    : applications;

  // SLA calculations (>48h pending review)
  const getPendingHours = (appliedDate?: string) => {
    if (!appliedDate) return 0;
    const diffMs = Date.now() - new Date(appliedDate).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  };

  const isOverdueReview = (app: StudyApplication) => {
    if (app.status !== "submitted" && app.status !== "under_review") return false;
    return getPendingHours(app.appliedDate || app.createdAt) >= 48;
  };

  const overdueCount = baseApplications.filter(isOverdueReview).length;

  // Filtered applications
  const displayedApplications = baseApplications.filter((app) => {
    // Pipeline status filter
    if (pipelineFilter === "needs_review") {
      if (app.status !== "submitted" && app.status !== "under_review") return false;
    } else if (pipelineFilter === "action_needed") {
      if (app.status !== "action_needed") return false;
    } else if (pipelineFilter === "pre_screening") {
      if (app.status !== "pre_screening" && app.status !== "screener_passed") return false;
    } else if (pipelineFilter === "eligible") {
      if (app.status !== "eligible_next_step" && app.status !== "scheduled") return false;
    } else if (pipelineFilter === "enrolled") {
      if (app.status !== "enrolled") return false;
    } else if (pipelineFilter === "completed") {
      if (app.status !== "completed") return false;
    } else if (pipelineFilter === "closed") {
      if (app.status !== "not_selected" && app.status !== "withdrawn" && app.status !== "study_closed" && (app.status as string) !== "rejected") {
        return false;
      }
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = getCandidateName(app.profileId).toLowerCase();
      const study = (app.studyTitle || "").toLowerCase();
      return name.includes(q) || study.includes(q) || app.id.toLowerCase().includes(q);
    }

    return true;
  });

  // Funnel calculations based on current view scope
  const totalApplicants = baseApplications.length;
  const qualifiedCount = baseApplications.filter(
    (a) =>
      a.status === "pre_screening" ||
      a.status === "eligible_next_step" ||
      a.status === "enrolled" ||
      a.status === "completed" ||
      a.status === "screener_passed" ||
      a.status === "scheduled"
  ).length;
  const enrolledCount = baseApplications.filter(
    (a) => a.status === "enrolled" || a.status === "completed"
  ).length;
  const efficiencyRate = totalApplicants > 0 ? Math.round((qualifiedCount / totalApplicants) * 100) : 100;

  function getCandidateName(profileId: string): string {
    if (profileId === "user_marcus" || profileId === "prof_marcus") return "Marcus Davis";
    if (profileId === "user_chloe" || profileId === "prof_chloe") return "Chloe Martinez";
    if (profileId === "user_robert" || profileId === "prof_robert") return "Robert Chen";
    return "Clinical Volunteer";
  }

  function getCandidateProfile(profileId: string): ParticipantProfile | null {
    if (profileId === "user_marcus" || profileId === "prof_marcus") return DEMO_PERSONAS.rural_male.profile;
    if (profileId === "user_chloe" || profileId === "prof_chloe") return DEMO_PERSONAS.urban_student.profile;
    if (profileId === "user_robert" || profileId === "prof_robert") return DEMO_PERSONAS.chronic_patient.profile;
    return DEMO_PERSONAS.rural_male.profile;
  }

  const openCandidateDrawer = (app: StudyApplication) => {
    setSelectedApp(app);
    setEditStatus(app.status);
    setParticipantNote(app.participantNotes || "");
    setInternalNote(app.internalNotes || "");
    const matchedCoord = COORDINATOR_OPTIONS.find((c) => c.name === app.assignedCoordinatorName) || COORDINATOR_OPTIONS[0];
    setAssignedCoord(matchedCoord);
  };

  const handleSaveCandidateStatus = () => {
    if (!selectedApp) return;

    updateApplicationStatusWithNotes(
      selectedApp.id,
      editStatus,
      participantNote,
      internalNote,
      assignedCoord.id,
      assignedCoord.name
    );

    Alert.alert(
      "Lifecycle Updated",
      `Candidate status changed to "${STATUS_CONFIG[editStatus]?.label || editStatus}". Participant-facing note has been posted to volunteer's portal.`
    );
    setSelectedApp(null);
  };

  const handleOpenTaskModal = () => {
    if (!selectedApp) return;
    setTaskTitle(`Complete Protocol Intake for ${selectedApp.studyTitle.slice(0, 24)}...`);
    setTaskType("document_upload");
    setTaskDesc("Please upload or verify your clinical requirements to proceed to the next milestone.");
    setTaskDueDate("Within 3 business days");
    setTaskModalVisible(true);
  };

  const handleCreateTaskSubmit = () => {
    if (!selectedApp) return;
    if (!taskTitle.trim()) {
      Alert.alert("Missing Title", "Please enter a task title for the candidate.");
      return;
    }

    createTask(
      selectedApp.id,
      taskTitle.trim(),
      taskDesc.trim() || "Action requested by clinical trial study coordinator.",
      taskType,
      taskDueDate.trim() || "Within 3 business days"
    );

    setTaskModalVisible(false);
    Alert.alert(
      "Action Assigned",
      `Task "${taskTitle}" assigned to participant. Application status transitioned to Action Needed and alert triggered.`
    );
    setSelectedApp(null);
  };

  const handleCloseStudyRecruitment = (studyId: string, studyTitle: string) => {
    Alert.alert(
      "Close Study Recruitment",
      `Are you sure you want to stop accepting new participants for "${studyTitle}"? Pending applications will be marked as Study Closed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Close",
          style: "destructive",
          onPress: () => {
            closeStudyRecruitment(studyId);
            Alert.alert("Recruitment Closed", "Study has been archived and pending applicants notified.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ================= HEADER BANNER: PI vs COORDINATOR ================= */}
        {userRole === "pi" && activePI ? (
          <View style={styles.piBanner}>
            <View style={styles.piBannerTop}>
              <View style={styles.piAvatar}>
                <MaterialIcons name="medical-services" size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text style={styles.piBannerName}>{activePI.name}</Text>
                  <View style={styles.piBadge}>
                    <Text style={styles.piBadgeText}>PRINCIPAL INVESTIGATOR</Text>
                  </View>
                </View>
                <Text style={styles.piBannerSub}>{activePI.institution}</Text>
              </View>
            </View>

            {/* Protocol Tag Box */}
            <View style={styles.piProtocolBox}>
              <MaterialIcons name="biotech" size={16} color="#38bdf8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.piProtocolTitle}>{activePI.studyTitle}</Text>
                <Text style={styles.piProtocolMeta}>
                  IRB: {activePI.irbNumber} • Stipend: {activePI.compensation}
                </Text>
              </View>
            </View>

            {/* Quick Actions Row */}
            <View style={styles.piActionsRow}>
              <TouchableOpacity
                style={styles.manageStudyBtn}
                onPress={() => setManageModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="settings" size={13} color="#ffffff" />
                <Text style={styles.manageStudyBtnText}>Manage Study</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchRoleBtn}
                onPress={() => openLoginModal("institution")}
                activeOpacity={0.7}
              >
                <MaterialIcons name="sync-alt" size={13} color="#ffffff" />
                <Text style={styles.switchRoleBtnText}>Switch PI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitToConsumerBtn}
                onPress={exitPIToConsumer}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={13} color="#94a3b8" />
                <Text style={styles.exitToConsumerBtnText}>Exit PI View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.coordBanner}>
            <View style={styles.coordBannerTop}>
              <View style={styles.coordAvatar}>
                <MaterialIcons name="local-hospital" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.coordName}>Sarah Lindquist, CRC</Text>
                  <View style={styles.coordBadge}>
                    <Text style={styles.coordBadgeText}>LEAD COORDINATOR</Text>
                  </View>
                </View>
                <Text style={styles.coordSub}>Triangle Clinical Research Center & Associated Sites</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.coordSwitchBtn, { flex: 1 }]}
                onPress={() => openLoginModal("institution")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="vpn-key" size={13} color="#0284c7" />
                <Text style={styles.coordSwitchBtnText}>Switch PI / Protocol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.coordSwitchBtn, { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }]}
                onPress={exitPIToConsumer}
                activeOpacity={0.8}
              >
                <MaterialIcons name="logout" size={13} color="#64748b" />
                <Text style={[styles.coordSwitchBtnText, { color: "#64748b" }]}>Exit PI View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4-Stat Metric Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalApplicants}</Text>
            <Text style={styles.statLabel}>
              {isPI ? "Protocol Applicants" : "Total Applicants"}
            </Text>
            <Text style={styles.statSub}>Screening queue</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#059669" }]}>{qualifiedCount}</Text>
            <Text style={styles.statLabel}>Pre-Screen Passed</Text>
            <Text style={styles.statSub}>Qualified cohorts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#7c3aed" }]}>{enrolledCount}</Text>
            <Text style={styles.statLabel}>Enrolled / Active</Text>
            <Text style={styles.statSub}>Protocol retention</Text>
          </View>

          <View style={styles.statCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[styles.statValue, overdueCount > 0 ? { color: "#dc2626" } : { color: "#0284c7" }]}>
                {overdueCount}
              </Text>
              {overdueCount > 0 && (
                <View style={styles.slaBadgeMini}>
                  <Text style={styles.slaBadgeMiniText}>&gt;48H SLA</Text>
                </View>
              )}
            </View>
            <Text style={styles.statLabel}>Review Backlog</Text>
            <Text style={styles.statSub}>{overdueCount > 0 ? "Pending SLA actions" : "Queue on time"}</Text>
          </View>
        </View>

        {/* Segmented View Selector */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === "pipeline" && styles.segmentBtnActive]}
            onPress={() => setActiveSegment("pipeline")}
          >
            <Text style={[styles.segmentBtnText, activeSegment === "pipeline" && styles.segmentBtnTextActive]}>
              Candidate Pipeline ({totalApplicants})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === "diversity" && styles.segmentBtnActive]}
            onPress={() => setActiveSegment("diversity")}
          >
            <Text style={[styles.segmentBtnText, activeSegment === "diversity" && styles.segmentBtnTextActive]}>
              Diversity Quotas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === "protocols" && styles.segmentBtnActive]}
            onPress={() => setActiveSegment("protocols")}
          >
            <Text style={[styles.segmentBtnText, activeSegment === "protocols" && styles.segmentBtnTextActive]}>
              {isPI ? "My Protocol" : `Protocols (${studies.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Candidate Pipeline */}
        {activeSegment === "pipeline" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="people" size={18} color="#0f172a" />
              <Text style={styles.sectionHeader}>
                {isPI ? "Protocol Screening Queue" : "Candidate Lifecycle Pipeline"}
              </Text>
              {isPI && (
                <View style={styles.scopedTag}>
                  <Text style={styles.scopedTagText}>1 STUDY SCOPED</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSub}>
              Review candidate pre-screeners, manage 11 lifecycle statuses, assign participant tasks, and inspect commute & logistics:
            </Text>

            {/* SLA Overdue Notice Banner if any */}
            {overdueCount > 0 && (
              <View style={styles.slaAlertBanner}>
                <MaterialIcons name="alarm" size={20} color="#b91c1c" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slaAlertTitle}>{overdueCount} Candidate{overdueCount > 1 ? "s" : ""} Pending Review &gt;48 Hours</Text>
                  <Text style={styles.slaAlertDesc}>
                    Institutional SLA recommends responding within 48 hours to maintain high volunteer engagement.
                  </Text>
                </View>
              </View>
            )}

            {/* Search Input */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search candidate name, ID, or study..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {[
                { id: "all", label: "All Applicants" },
                { id: "needs_review", label: `Needs Review (${baseApplications.filter((a) => a.status === "submitted" || a.status === "under_review").length})` },
                { id: "action_needed", label: `Action Needed (${baseApplications.filter((a) => a.status === "action_needed").length})` },
                { id: "pre_screening", label: `Pre-Screening (${baseApplications.filter((a) => a.status === "pre_screening" || a.status === "screener_passed").length})` },
                { id: "eligible", label: `Eligible / Next Step (${baseApplications.filter((a) => a.status === "eligible_next_step" || a.status === "scheduled").length})` },
                { id: "enrolled", label: `Enrolled (${baseApplications.filter((a) => a.status === "enrolled").length})` },
                { id: "completed", label: `Completed (${baseApplications.filter((a) => a.status === "completed").length})` },
                { id: "closed", label: "Closed / Archived" },
              ].map((chip) => {
                const isActive = pipelineFilter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setPipelineFilter(chip.id)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {displayedApplications.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="inbox" size={36} color="#94a3b8" />
                <Text style={styles.emptyCardTitle}>No Candidates in This View</Text>
                <Text style={styles.emptyCardSub}>
                  Try clearing your search query or switching filter tabs to see active trial volunteers.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => {
                    setPipelineFilter("all");
                    setSearchQuery("");
                  }}
                >
                  <Text style={styles.emptyActionText}>Reset Pipeline Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayedApplications.map((app) => {
                const candidateName = getCandidateName(app.profileId);
                const candidateProfile = getCandidateProfile(app.profileId);
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
                const overdue = isOverdueReview(app);
                const pendingHours = getPendingHours(app.appliedDate || app.createdAt);

                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.candidateCard, overdue && styles.candidateCardOverdue]}
                    onPress={() => openCandidateDrawer(app)}
                    activeOpacity={0.85}
                  >
                    {/* Top Row: Candidate info + Status Badge */}
                    <View style={styles.candidateTop}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <View style={styles.candidateAvatar}>
                          <Text style={styles.candidateAvatarText}>
                            {candidateProfile?.avatarInitials || candidateName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Text style={styles.candidateName}>{candidateName}</Text>
                            {candidateProfile?.livingEnvironment === "rural" && (
                              <View style={styles.diversityTag}>
                                <Text style={styles.diversityTagText}>RURAL</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.candidateStudy} numberOfLines={1}>{app.studyTitle}</Text>
                          <Text style={styles.candidateLocation}>
                            {candidateProfile ? `${candidateProfile.city}, ${candidateProfile.state} • ${candidateProfile.travelDistanceMiles} mi radius` : "Triangle Region, NC"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
                        ]}
                      >
                        <MaterialIcons name={statusCfg.icon} size={11} color={statusCfg.text} />
                        <Text style={[styles.statusBadgeText, { color: statusCfg.text }]}>
                          {statusCfg.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* SLA Warning Banner if >48h */}
                    {overdue && (
                      <View style={styles.slaWarningBadge}>
                        <MaterialIcons name="alarm" size={13} color="#b91c1c" />
                        <Text style={styles.slaWarningText}>
                          {pendingHours}h in review queue (&gt;48h SLA Warning)
                        </Text>
                      </View>
                    )}

                    {/* Score & Assignment Row */}
                    <View style={styles.scoreRow}>
                      <View style={styles.scorePill}>
                        <MaterialIcons name="verified" size={13} color="#059669" />
                        <Text style={styles.scorePillText}>{app.qualificationScore}% Pre-screen Score</Text>
                      </View>

                      <View style={styles.coordTag}>
                        <MaterialIcons name="person-outline" size={12} color="#0284c7" />
                        <Text style={styles.coordTagText}>
                          {app.assignedCoordinatorName ? app.assignedCoordinatorName.split(",")[0] : "CRC Unassigned"}
                        </Text>
                      </View>
                    </View>

                    {/* Dual Note Previews */}
                    {app.participantNotes && (
                      <View style={styles.noteSnippetBox}>
                        <View style={styles.noteSnippetHeader}>
                          <MaterialIcons name="visibility" size={11} color="#0284c7" />
                          <Text style={styles.noteSnippetLabel}>Participant-Facing Note:</Text>
                        </View>
                        <Text style={styles.noteSnippetText} numberOfLines={2}>
                          {app.participantNotes}
                        </Text>
                      </View>
                    )}

                    {app.internalNotes && (
                      <View style={[styles.noteSnippetBox, { backgroundColor: "#fffbeb", borderColor: "#fef3c7" }]}>
                        <View style={styles.noteSnippetHeader}>
                          <MaterialIcons name="lock" size={11} color="#b45309" />
                          <Text style={[styles.noteSnippetLabel, { color: "#b45309" }]}>Confidential Staff Note:</Text>
                        </View>
                        <Text style={[styles.noteSnippetText, { color: "#78350f" }]} numberOfLines={2}>
                          {app.internalNotes}
                        </Text>
                      </View>
                    )}

                    {/* Quick CTA Bottom */}
                    <View style={styles.candidateFooter}>
                      <Text style={styles.candidateFooterMeta}>
                        Applied: {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => openCandidateDrawer(app)}
                      >
                        <MaterialIcons name="tune" size={12} color="#ffffff" />
                        <Text style={styles.reviewBtnText}>Review &amp; Decide</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Section 2: Diversity & Representation Quotas */}
        {activeSegment === "diversity" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="equalizer" size={18} color="#0f172a" />
              <Text style={styles.sectionHeader}>NIH Representation &amp; Diversity Metrics</Text>
            </View>
            <Text style={styles.sectionSub}>
              Live cohort distribution computed from active Universal Profiles:
            </Text>

            {/* Diversity Card 1: Male Recruitment */}
            <View style={styles.diversityCard}>
              <View style={styles.diversityHeader}>
                <Text style={styles.diversityTitle}>Male Representation Target</Text>
                <Text style={styles.diversityTarget}>Target: 40% • Actual: 67%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "67%", backgroundColor: "#0284c7" }]} />
              </View>
              <Text style={styles.diversityExplanation}>
                StudyLoop algorithm successfully prioritized male volunteers to balance cognitive trial cohorts.
              </Text>
            </View>

            {/* Diversity Card 2: Rural / Non-Academic */}
            <View style={styles.diversityCard}>
              <View style={styles.diversityHeader}>
                <Text style={styles.diversityTitle}>Rural / Non-Metro Community Reach</Text>
                <Text style={styles.diversityTarget}>Target: 30% • Actual: 50%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "50%", backgroundColor: "#059669" }]} />
              </View>
              <Text style={styles.diversityExplanation}>
                Sanford and non-academic geographic outreach bonus incentivized non-urban trial enrollment.
              </Text>
            </View>

            {/* Diversity Card 3: Educational Diversity */}
            <View style={styles.diversityCard}>
              <View style={styles.diversityHeader}>
                <Text style={styles.diversityTitle}>Non-College Educated Representation</Text>
                <Text style={styles.diversityTarget}>Target: 25% • Actual: 33%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "33%", backgroundColor: "#7c3aed" }]} />
              </View>
              <Text style={styles.diversityExplanation}>
                Transparent plain-language study cards remove academic medical jargon barriers.
              </Text>
            </View>
          </View>
        )}

        {/* Section 3: Active Protocols */}
        {activeSegment === "protocols" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="folder-shared" size={18} color="#0f172a" />
              <Text style={styles.sectionHeader}>
                {isPI ? "My Protocol Capacity & Quotas" : "Active Protocol Enrollment Capacity"}
              </Text>
            </View>
            <Text style={styles.sectionSub}>
              {isPI
                ? "Live enrollment metrics and quota parameters for your clinical trial:"
                : "Live recruitment meters across trial portfolio:"}
            </Text>

            {isPI && (
              <TouchableOpacity
                style={styles.manageProtocolActionBtn}
                onPress={() => setManageModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="settings" size={15} color="#ffffff" />
                <Text style={styles.manageProtocolActionBtnText}>
                  Manage Protocol &amp; Recruitment Quotas
                </Text>
              </TouchableOpacity>
            )}

            {(isPI && currentPIStudy ? [currentPIStudy] : studies).map((study) => {
              const isAssignedToPI = Boolean(activePI && activePI.studyId === study.id);
              const pct = Math.round((study.currentEnrolled / study.targetEnrollment) * 100);
              const isClosed = study.recruitmentStatus === "closed";

              return (
                <View
                  key={study.id}
                  style={[
                    styles.protocolCard,
                    isAssignedToPI && styles.protocolCardAssigned,
                    isClosed && { opacity: 0.75, backgroundColor: "#f8fafc" },
                  ]}
                >
                  <View style={styles.protocolCardTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text style={styles.protocolTitle}>{study.title}</Text>
                        {isAssignedToPI && (
                          <View style={styles.assignedBadge}>
                            <Text style={styles.assignedBadgeText}>YOUR PROTOCOL</Text>
                          </View>
                        )}
                        {isClosed && (
                          <View style={[styles.assignedBadge, { backgroundColor: "#64748b" }]}>
                            <Text style={styles.assignedBadgeText}>RECRUITMENT CLOSED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.protocolSponsor}>
                        {study.sponsorName} • {study.irbApprovalNumber}
                      </Text>
                      <Text style={styles.protocolPI}>PI: {study.piName}</Text>
                    </View>
                    <Text style={styles.protocolEnrolled}>
                      {study.currentEnrolled} / {study.targetEnrollment}
                    </Text>
                  </View>

                  <View style={styles.protocolProgressBar}>
                    <View
                      style={[
                        styles.protocolProgressFill,
                        {
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: isClosed ? "#94a3b8" : isAssignedToPI ? "#0284c7" : "#64748b",
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.protocolFooter}>
                    <Text style={styles.protocolPct}>{pct}% target achieved</Text>
                    <Text style={styles.protocolPay}>${study.compensationAmount} stipend</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    {isAssignedToPI && (
                      <TouchableOpacity
                        style={[styles.cardManageBtn, { flex: 1 }]}
                        onPress={() => setManageModalVisible(true)}
                      >
                        <MaterialIcons name="edit" size={13} color="#0284c7" />
                        <Text style={styles.cardManageBtnText}>Edit Parameters</Text>
                      </TouchableOpacity>
                    )}

                    {!isClosed && (
                      <TouchableOpacity
                        style={[
                          styles.cardManageBtn,
                          { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
                          !isAssignedToPI && { flex: 1 },
                        ]}
                        onPress={() => handleCloseStudyRecruitment(study.id, study.title)}
                      >
                        <MaterialIcons name="lock-outline" size={13} color="#b91c1c" />
                        <Text style={[styles.cardManageBtnText, { color: "#b91c1c" }]}>
                          Close Recruitment
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: CANDIDATE DETAIL & DECISION DRAWER ================= */}
      <Modal
        visible={Boolean(selectedApp)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedApp(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle}>Candidate Decision &amp; Notes</Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                {selectedApp ? `${getCandidateName(selectedApp.profileId)} • ${selectedApp.studyTitle}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedApp(null)}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedApp && (
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* SLA Backlog Warning if overdue */}
              {isOverdueReview(selectedApp) && (
                <View style={styles.slaModalWarning}>
                  <MaterialIcons name="alarm" size={18} color="#b91c1c" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slaModalWarningTitle}>Review SLA Backlog Alert</Text>
                    <Text style={styles.slaModalWarningSub}>
                      This applicant submitted {getPendingHours(selectedApp.appliedDate || selectedApp.createdAt)} hours ago (exceeds 48h institutional SLA target).
                    </Text>
                  </View>
                </View>
              )}

              {/* Participant Profile Card */}
              {(() => {
                const profile = getCandidateProfile(selectedApp.profileId);
                if (!profile) return null;
                return (
                  <View style={styles.profileSummaryCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <View style={styles.profileAvatarLg}>
                        <Text style={styles.profileAvatarLgText}>{profile.avatarInitials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileNameLg}>{profile.fullName}</Text>
                        <Text style={styles.profileContactLg}>{profile.email} • {profile.phone}</Text>
                        <Text style={styles.profileLocationLg}>
                          {profile.city}, {profile.state} {profile.zipCode} • Max Travel: {profile.travelDistanceMiles} mi
                        </Text>
                      </View>
                    </View>

                    <View style={styles.profileGrid}>
                      <View style={styles.profileGridItem}>
                        <Text style={styles.profileGridLabel}>Age / Gender</Text>
                        <Text style={styles.profileGridValue}>{profile.age} yo / {profile.gender}</Text>
                      </View>
                      <View style={styles.profileGridItem}>
                        <Text style={styles.profileGridLabel}>Environment</Text>
                        <Text style={styles.profileGridValue}>{profile.livingEnvironment.toUpperCase()}</Text>
                      </View>
                      <View style={styles.profileGridItem}>
                        <Text style={styles.profileGridLabel}>Transit Mode</Text>
                        <Text style={styles.profileGridValue}>
                          {profile.transportationAccess ? profile.transportationAccess.replace(/_/g, " ") : "Personal Vehicle"}
                        </Text>
                      </View>
                      <View style={styles.profileGridItem}>
                        <Text style={styles.profileGridLabel}>Language</Text>
                        <Text style={styles.profileGridValue}>{profile.preferredLanguage}</Text>
                      </View>
                    </View>

                    {profile.conditions && profile.conditions.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.profileConditionsLabel}>Declared Health Conditions:</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {profile.conditions.map((c, i) => (
                            <View key={i} style={styles.conditionChip}>
                              <Text style={styles.conditionChipText}>{c}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Status Transition Picker across all 11 normalized statuses */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>1. Advance Lifecycle Status</Text>
                <Text style={styles.formSectionSub}>
                  Select the candidate&apos;s new normalized recruitment state:
                </Text>

                <View style={styles.statusPillsGrid}>
                  {ALL_11_STATUSES.map((st) => {
                    const isCurrent = editStatus === st.id;
                    const cfg = STATUS_CONFIG[st.id] || STATUS_CONFIG.submitted;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.statusPickerPill,
                          isCurrent && { backgroundColor: cfg.bg, borderColor: cfg.border, borderWidth: 2 },
                        ]}
                        onPress={() => setEditStatus(st.id)}
                      >
                        <MaterialIcons
                          name={cfg.icon}
                          size={13}
                          color={isCurrent ? cfg.text : "#64748b"}
                        />
                        <Text
                          style={[
                            styles.statusPickerPillText,
                            isCurrent && { color: cfg.text, fontWeight: "800" },
                          ]}
                        >
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Coordinator Assignment */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>2. Clinical Coordinator Assignment</Text>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {COORDINATOR_OPTIONS.map((c) => {
                    const isSelected = assignedCoord.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.coordOptionChip, isSelected && styles.coordOptionChipActive]}
                        onPress={() => setAssignedCoord(c)}
                      >
                        <MaterialIcons
                          name="person"
                          size={13}
                          color={isSelected ? "#0284c7" : "#64748b"}
                        />
                        <Text style={[styles.coordOptionChipText, isSelected && styles.coordOptionChipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Dual Notes: Participant-Facing Explanation */}
              <View style={styles.formSection}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={styles.formSectionTitle}>3. Participant-Facing Explanation</Text>
                  <View style={styles.publicNoteBadge}>
                    <MaterialIcons name="visibility" size={11} color="#0284c7" />
                    <Text style={styles.publicNoteBadgeText}>VISIBLE TO VOLUNTEER</Text>
                  </View>
                </View>
                <Text style={styles.formSectionSub}>
                  Shown on participant&apos;s &quot;My Studies&quot; dashboard and notifications. Explain next steps or requirements clearly:
                </Text>
                <TextInput
                  style={styles.textInputArea}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g., Your pre-screen was accepted. Coordinator Sarah will call on Thursday to schedule your baseline clinic visit."
                  placeholderTextColor="#94a3b8"
                  value={participantNote}
                  onChangeText={setParticipantNote}
                />
              </View>

              {/* Dual Notes: Confidential Staff Note */}
              <View style={styles.formSection}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={styles.formSectionTitle}>4. Confidential Clinical Staff Note</Text>
                  <View style={styles.confidentialNoteBadge}>
                    <MaterialIcons name="lock" size={11} color="#b45309" />
                    <Text style={styles.confidentialNoteBadgeText}>INTERNAL CRC / PI ONLY</Text>
                  </View>
                </View>
                <Text style={styles.formSectionSub}>
                  Never shared with participants. Use for lab evaluations, inclusion/exclusion discussions, or PI notes:
                </Text>
                <TextInput
                  style={[styles.textInputArea, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g., Participant disclosed mild asthma controlled by albuterol. Confirmed eligible per section 4.2 of IRB protocol."
                  placeholderTextColor="#b45309"
                  value={internalNote}
                  onChangeText={setInternalNote}
                />
              </View>

              {/* Task Creation Button */}
              <View style={styles.formSection}>
                <TouchableOpacity
                  style={styles.assignActionBtn}
                  onPress={handleOpenTaskModal}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add-task" size={16} color="#0284c7" />
                  <Text style={styles.assignActionBtnText}>Assign Action / Create Participant Task</Text>
                </TouchableOpacity>
              </View>

              {/* Save Status Button */}
              <TouchableOpacity
                style={styles.saveStatusBtn}
                onPress={handleSaveCandidateStatus}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={18} color="#ffffff" />
                <Text style={styles.saveStatusBtnText}>Save Status &amp; Update Candidate</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ================= MODAL: CREATE PARTICIPANT TASK ================= */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle}>Assign Participant Action</Text>
              <Text style={styles.modalHeaderSub}>
                Creates an interactive checklist task on volunteer&apos;s &quot;My Studies&quot; screen
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setTaskModalVisible(false)}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Task Type</Text>
            <View style={styles.taskTypeGrid}>
              {TASK_TYPE_OPTIONS.map((tt) => {
                const isSelected = taskType === tt.id;
                return (
                  <TouchableOpacity
                    key={tt.id}
                    style={[styles.taskTypeCard, isSelected && styles.taskTypeCardActive]}
                    onPress={() => setTaskType(tt.id)}
                  >
                    <MaterialIcons
                      name={tt.icon}
                      size={18}
                      color={isSelected ? "#0284c7" : "#64748b"}
                    />
                    <Text style={[styles.taskTypeCardText, isSelected && styles.taskTypeCardTextActive]}>
                      {tt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.formLabel, { marginTop: 14 }]}>Task Title</Text>
            <TextInput
              style={styles.singleLineInput}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g., Upload Recent Metabolic Lab Results"
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.formLabel, { marginTop: 14 }]}>Instructions for Participant</Text>
            <TextInput
              style={styles.textInputArea}
              multiline
              numberOfLines={3}
              value={taskDesc}
              onChangeText={setTaskDesc}
              placeholder="Provide clear instructions for what volunteer must complete..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.formLabel, { marginTop: 14 }]}>Due Date / SLA</Text>
            <TextInput
              style={styles.singleLineInput}
              value={taskDueDate}
              onChangeText={setTaskDueDate}
              placeholder="e.g., Within 3 business days, or by Friday"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.saveStatusBtn, { marginTop: 24 }]}
              onPress={handleCreateTaskSubmit}
            >
              <MaterialIcons name="send" size={16} color="#ffffff" />
              <Text style={styles.saveStatusBtnText}>Assign Task &amp; Notify Participant</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Protocol Edit Modal */}
      <ManageStudyModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        studyToEdit={currentPIStudy}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, paddingBottom: 40 },

  // PI Banner Styles
  piBanner: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  piBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  piAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  piBannerName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  piBadge: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  piBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  piBannerSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  piProtocolBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  piProtocolTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
    lineHeight: 16,
  },
  piProtocolMeta: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  piActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  manageStudyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0284c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageStudyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  exitToConsumerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1e293b",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  exitToConsumerBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  // Coordinator Banner
  coordBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  coordBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    alignItems: "center",
    justifyContent: "center",
  },
  coordName: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  coordBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  coordBadgeText: { fontSize: 8, fontWeight: "800", color: "#166534" },
  coordSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  coordSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    paddingVertical: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  coordSwitchBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#334155", marginTop: 2 },
  statSub: { fontSize: 10, color: "#94a3b8", marginTop: 1 },
  slaBadgeMini: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  slaBadgeMiniText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#b91c1c",
  },

  segmentBar: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentBtnText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  segmentBtnTextActive: { color: "#0f172a", fontWeight: "800" },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionHeader: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  scopedTag: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  scopedTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ffffff",
  },
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 16 },

  // SLA Alert Banner
  slaAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    marginBottom: 12,
  },
  slaAlertTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#b91c1c",
  },
  slaAlertDesc: {
    fontSize: 11,
    color: "#991b1b",
    marginTop: 2,
    lineHeight: 15,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    padding: 0,
  },

  // Filter Chips
  filterChipRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // Candidate Card
  candidateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  candidateCardOverdue: {
    borderColor: "#fca5a5",
    borderWidth: 1.5,
  },
  candidateTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  candidateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  candidateAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0284c7",
  },
  candidateName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  diversityTag: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  diversityTagText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#059669",
  },
  candidateStudy: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    marginTop: 1,
  },
  candidateLocation: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  slaWarningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  slaWarningText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b91c1c",
  },

  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  scorePillText: { fontSize: 10, fontWeight: "800", color: "#059669" },
  coordTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  coordTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
  },

  noteSnippetBox: {
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    marginTop: 6,
  },
  noteSnippetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  noteSnippetLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0369a1",
    letterSpacing: 0.3,
  },
  noteSnippetText: {
    fontSize: 11,
    color: "#1e293b",
    lineHeight: 15,
  },

  candidateFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  candidateFooterMeta: {
    fontSize: 10,
    color: "#94a3b8",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reviewBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Diversity & Representation Quotas
  diversityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  diversityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  diversityTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  diversityTarget: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  diversityExplanation: { fontSize: 11, color: "#64748b", lineHeight: 15 },

  // Protocol Card
  protocolCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  protocolCardAssigned: {
    borderColor: "#0284c7",
    borderWidth: 2,
    backgroundColor: "#f0f9ff",
  },
  protocolCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  protocolTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", lineHeight: 18 },
  assignedBadge: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  assignedBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ffffff",
  },
  protocolSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  protocolPI: { fontSize: 10, color: "#0284c7", fontWeight: "700", marginTop: 2 },
  protocolEnrolled: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  protocolProgressBar: {
    height: 7,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  protocolProgressFill: { height: "100%", borderRadius: 4 },
  protocolFooter: { flexDirection: "row", justifyContent: "space-between" },
  protocolPct: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  protocolPay: { fontSize: 11, color: "#059669", fontWeight: "800" },

  manageProtocolActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  manageProtocolActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardManageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 8,
    paddingVertical: 7,
  },
  cardManageBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
  },
  emptyCardSub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Modal Common Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalHeaderSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  modalBody: {
    padding: 16,
    paddingBottom: 40,
  },

  // Modal Elements
  slaModalWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  slaModalWarningTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#b91c1c",
  },
  slaModalWarningSub: {
    fontSize: 11,
    color: "#991b1b",
    marginTop: 2,
  },

  profileSummaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  profileAvatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  profileAvatarLgText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0284c7",
  },
  profileNameLg: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileContactLg: {
    fontSize: 11,
    color: "#475569",
    marginTop: 1,
  },
  profileLocationLg: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
  },
  profileGridItem: {
    flex: 1,
    minWidth: "45%",
  },
  profileGridLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "700",
  },
  profileGridValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 1,
  },
  profileConditionsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  conditionChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  conditionChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#334155",
  },

  formSection: {
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  formSectionSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 15,
  },
  statusPillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusPickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  statusPickerPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },

  coordOptionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  coordOptionChipActive: {
    backgroundColor: "#f0f9ff",
    borderColor: "#0284c7",
  },
  coordOptionChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  coordOptionChipTextActive: {
    fontWeight: "700",
    color: "#0284c7",
  },

  publicNoteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicNoteBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#0284c7",
  },
  confidentialNoteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidentialNoteBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#b45309",
  },

  textInputArea: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    fontSize: 12,
    color: "#0f172a",
    textAlignVertical: "top",
    minHeight: 64,
  },
  singleLineInput: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0f172a",
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },

  assignActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    borderWidth: 1.5,
    borderColor: "#0284c7",
    borderRadius: 10,
    paddingVertical: 10,
  },
  assignActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284c7",
  },

  saveStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  saveStatusBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },

  // Task Type Selector in Task Modal
  taskTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  taskTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: "47%",
    flex: 1,
  },
  taskTypeCardActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  taskTypeCardText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  taskTypeCardTextActive: {
    color: "#0284c7",
    fontWeight: "800",
  },
});
