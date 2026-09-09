import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useStudyStore } from "../../hooks/useStudyStore";
import { ApplicationStatus } from "../../constants/types";
import ManageStudyModal from "../../components/ManageStudyModal";

export default function ResearcherScreen() {
  const {
    applications,
    updateApplicationStatus,
    userRole,
    activePI,
    openLoginModal,
    exitPIToConsumer,
    studies,
  } = useStudyStore();

  const [activeSegment, setActiveSegment] = useState<"pipeline" | "diversity" | "protocols">("pipeline");
  const [manageModalVisible, setManageModalVisible] = useState(false);

  // For a PI, ALWAYS strictly scope to their single study - NO other studies accessible!
  const isPI = Boolean(userRole === "pi" && activePI && activePI.studyId !== "all");

  const currentPIStudy = activePI
    ? (studies.find((s) => s.id === activePI.studyId) || studies[0])
    : null;

  const displayedApplications = isPI
    ? applications.filter((a) => a.studyId === activePI!.studyId)
    : applications;

  // Funnel calculations based on current view scope
  const totalApplicants = displayedApplications.length;
  const qualifiedCount = displayedApplications.filter(
    (a) => a.status === "screener_passed" || a.status === "scheduled" || a.status === "enrolled"
  ).length;
  const scheduledCount = displayedApplications.filter((a) => a.status === "scheduled").length;
  const efficiencyRate = totalApplicants > 0 ? Math.round((qualifiedCount / totalApplicants) * 100) : 100;

  const cycleStatus = (appId: string, currentStatus: ApplicationStatus) => {
    let next: ApplicationStatus = "scheduled";
    if (currentStatus === "screener_passed") next = "scheduled";
    else if (currentStatus === "scheduled") next = "enrolled";
    else if (currentStatus === "enrolled") next = "completed";
    else next = "screener_passed";

    updateApplicationStatus(appId, next);
    Alert.alert("Status Updated", `Candidate status transitioned to ${next.replace(/_/g, " ").toUpperCase()}`);
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
            <Text style={styles.statSub}>Dynamic screeners</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#059669" }]}>{qualifiedCount}</Text>
            <Text style={styles.statLabel}>Site Handoffs</Text>
            <Text style={styles.statSub}>100% Pre-qualified</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#0284c7" }]}>{scheduledCount}</Text>
            <Text style={styles.statLabel}>Visits Booked</Text>
            <Text style={styles.statSub}>Calendar confirmed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#7c3aed" }]}>{efficiencyRate}%</Text>
            <Text style={styles.statLabel}>Recruit Efficiency</Text>
            <Text style={styles.statSub}>Zero phone tag</Text>
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
              {isPI ? "My Protocol & Quotas" : `Protocols (${studies.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Candidate Pipeline */}
        {activeSegment === "pipeline" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="people" size={18} color="#0f172a" />
              <Text style={styles.sectionHeader}>
                {isPI ? "Protocol Screening Queue" : "Qualified Candidate Queue"}
              </Text>
              {isPI && (
                <View style={styles.scopedTag}>
                  <Text style={styles.scopedTagText}>1 STUDY SCOPED</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSub}>
              {isPI
                ? `Candidates pre-screened specifically for "${activePI!.studyTitle}":`
                : "Tap 'Advance Status' to move candidates through the clinical recruitment lifecycle:"}
            </Text>

            {displayedApplications.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="inbox" size={32} color="#94a3b8" />
                <Text style={styles.emptyCardTitle}>No Candidates in Queue</Text>
                <Text style={styles.emptyCardSub}>
                  As volunteers complete the matching pre-screener, qualified candidates will appear here instantly.
                </Text>
              </View>
            ) : (
              displayedApplications.map((app) => (
                <View key={app.id} style={styles.candidateCard}>
                  <View style={styles.candidateTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.candidateName}>
                        {app.profileId === "user_marcus"
                          ? "Marcus Davis"
                          : app.profileId === "user_chloe"
                          ? "Chloe Martinez"
                          : "Robert Chen"}
                      </Text>
                      <Text style={styles.candidateStudy}>{app.studyTitle}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        app.status === "enrolled"
                          ? { backgroundColor: "#f3e8ff", borderColor: "#d8b4fe" }
                          : app.status === "scheduled"
                          ? { backgroundColor: "#e0f2fe", borderColor: "#7dd3fc" }
                          : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          app.status === "enrolled"
                            ? { color: "#7e22ce" }
                            : app.status === "scheduled"
                            ? { color: "#0369a1" }
                            : undefined,
                        ]}
                      >
                        {app.status.replace(/_/g, " ").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={styles.scorePill}>
                      <MaterialIcons name="verified" size={13} color="#059669" />
                      <Text style={styles.scorePillText}>{app.qualificationScore}% Pre-screen Score</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => cycleStatus(app.id, app.status)}
                    >
                      <Text style={styles.advanceBtnText}>Advance Status →</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.candidateNotesBox}>
                    <Text style={styles.candidateNotesLabel}>Clinical Note:</Text>
                    <Text style={styles.candidateNotesText}>
                      {app.researcherNotes || "Applicant screened through universal matching engine."}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Section 2: Diversity & Representation Quotas */}
        {activeSegment === "diversity" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="equalizer" size={18} color="#0f172a" />
              <Text style={styles.sectionHeader}>NIH Representation & Diversity Metrics</Text>
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
                  Manage Protocol & Recruitment Quotas
                </Text>
              </TouchableOpacity>
            )}

            {(isPI && currentPIStudy ? [currentPIStudy] : studies).map((study) => {
              const isAssignedToPI = Boolean(activePI && activePI.studyId === study.id);
              const pct = Math.round((study.currentEnrolled / study.targetEnrollment) * 100);
              return (
                <View
                  key={study.id}
                  style={[
                    styles.protocolCard,
                    isAssignedToPI && styles.protocolCardAssigned,
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
                          backgroundColor: isAssignedToPI ? "#0284c7" : "#64748b",
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.protocolFooter}>
                    <Text style={styles.protocolPct}>{pct}% target achieved</Text>
                    <Text style={styles.protocolPay}>${study.compensationAmount} stipend</Text>
                  </View>

                  {isAssignedToPI && (
                    <TouchableOpacity
                      style={styles.cardManageBtn}
                      onPress={() => setManageModalVisible(true)}
                    >
                      <MaterialIcons name="edit" size={13} color="#0284c7" />
                      <Text style={styles.cardManageBtnText}>Edit Protocol Parameters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

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
  filterScopeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0284c7",
  },
  filterScopeBtnInactive: {
    backgroundColor: "transparent",
    borderColor: "#334155",
  },
  filterScopeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  filterScopeBtnTextInactive: {
    color: "#94a3b8",
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
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 16 },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
  },
  emptySub: {
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

  candidateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  candidateTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  candidateStudy: { fontSize: 14, fontWeight: "800", color: "#0f172a", lineHeight: 18 },
  candidateSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  scorePill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  scorePillText: { fontSize: 10, fontWeight: "800", color: "#059669" },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
  },
  statusBox: { flex: 1 },
  statusLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "700" },
  statusVal: { fontSize: 12, fontWeight: "800", color: "#0284c7", marginTop: 1 },
  cycleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cycleBtnText: { fontSize: 11, fontWeight: "700", color: "#ffffff" },
  notesContainer: { marginTop: 4 },
  candidateNotesLabel: { fontSize: 10, fontWeight: "700", color: "#64748b" },
  candidateNotesText: { fontSize: 11, color: "#334155", lineHeight: 15, marginTop: 1 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  dateText: { fontSize: 11, color: "#0284c7", fontWeight: "600" },

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

  manageStudyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0284c7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  manageStudyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
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
    marginTop: 10,
  },
  cardManageBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
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
  candidateName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  advanceBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  advanceBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  candidateNotesBox: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginTop: 4,
  },
});
