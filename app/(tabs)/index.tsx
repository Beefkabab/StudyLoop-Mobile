import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useGlobalSearchParams } from "expo-router";
import { useStudyStore, StudyWithMatch } from "../../hooks/useStudyStore";
import { DEMO_PERSONAS } from "../../constants/sampleData";

type CategoryFilter = "all" | "high_match" | "healthy" | "remote" | "clinical_trial" | "blood_draw" | "imaging_cognitive";

const CATEGORIES: { id: CategoryFilter; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: "all", label: "All Studies", icon: "dashboard" },
  { id: "high_match", label: "90%+ Match", icon: "auto-awesome" },
  { id: "healthy", label: "Healthy Volunteer", icon: "favorite" },
  { id: "remote", label: "100% Remote", icon: "home" },
  { id: "clinical_trial", label: "Clinical Trials", icon: "medication" },
  { id: "blood_draw", label: "Blood Draws", icon: "water-drop" },
  { id: "imaging_cognitive", label: "Cognitive & fMRI", icon: "psychology" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { study, login } = useGlobalSearchParams<{ study?: string; login?: string }>();
  const {
    activePersonaId,
    currentProfile,
    switchPersona,
    studies,
    toggleSaveStudy,
    submitApplication,
    openLoginModal,
  } = useStudyStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [personaSheetOpen, setPersonaSheetOpen] = useState(false);

  // Modals
  const [selectedDetailStudy, setSelectedDetailStudy] = useState<StudyWithMatch | null>(null);

  React.useEffect(() => {
    if (study) {
      const found = studies.find((s) => s.id === study);
      if (found) setSelectedDetailStudy(found);
    }
    if (login) {
      setSelectedDetailStudy(null);
      openLoginModal(login === "pi" ? "institution" : "consumer");
    }
  }, [study, login, studies]);
  const [screenerStudy, setScreenerStudy] = useState<StudyWithMatch | null>(null);
  const [screenerAnswers, setScreenerAnswers] = useState<Record<string, string>>({});
  const [screenerResult, setScreenerResult] = useState<{ passed: boolean; disqualifications: string[] } | null>(null);

  // Filter studies
  const filteredStudies = studies.filter((study) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        study.title.toLowerCase().includes(q) ||
        study.summary.toLowerCase().includes(q) ||
        study.city.toLowerCase().includes(q) ||
        study.sponsorName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory === "high_match" && study.match.score < 90) return false;
    if (selectedCategory === "healthy" && !study.healthyVolunteersAccepted) return false;
    if (selectedCategory === "remote" && study.locationType !== "remote") return false;
    if (selectedCategory === "clinical_trial" && study.studyType !== "clinical_trial") return false;
    if (selectedCategory === "blood_draw" && study.studyType !== "blood_draw") return false;
    if (
      selectedCategory === "imaging_cognitive" &&
      study.studyType !== "imaging_mri" &&
      study.studyType !== "cognitive_assessment"
    ) {
      return false;
    }

    return true;
  });

  const handleOpenScreener = (study: StudyWithMatch) => {
    setSelectedDetailStudy(null);
    setScreenerStudy(study);
    setScreenerAnswers({});
    setScreenerResult(null);
  };

  const handleAnswerQuestion = (qId: string, answer: "yes" | "no") => {
    setScreenerAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitScreener = () => {
    if (!screenerStudy) return;

    const unanswered = screenerStudy.questions.some((q) => !screenerAnswers[q.id]);
    if (unanswered) {
      Alert.alert("Incomplete", "Please answer all protocol questions before proceeding.");
      return;
    }

    let passed = true;
    const disqualifications: string[] = [];

    for (const q of screenerStudy.questions) {
      const userAns = screenerAnswers[q.id];
      if (q.isDisqualifying && userAns !== q.expectedAnswer) {
        passed = false;
        disqualifications.push(q.disqualificationReason || q.questionText);
      }
    }

    const qualificationScore = passed ? 100 : Math.max(20, 100 - disqualifications.length * 30);
    submitApplication(screenerStudy.id, screenerAnswers, passed, qualificationScore);

    setScreenerResult({ passed, disqualifications });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={17} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trials, condition, location..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Category Ribbon */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? "#ffffff" : "#64748b"}
                />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Studies List */}
      <FlatList
        data={filteredStudies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              {filteredStudies.length} matching studies near {currentProfile.city}, {currentProfile.state}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isEmerald = item.match.score >= 90;
          const isSky = item.match.score >= 70 && item.match.score < 90;

          return (
            <TouchableOpacity
              style={styles.studyCard}
              onPress={() => setSelectedDetailStudy(item)}
              activeOpacity={0.88}
            >
              {/* Header row: Study Type + Match Score Pill + Bookmark */}
              <View style={styles.cardHeader}>
                <View style={styles.cardBadgeRow}>
                  <Text style={styles.studyTypeTagText}>
                    {item.studyType.replace(/_/g, " ").toUpperCase()}
                  </Text>
                  {item.locationType === "remote" && (
                    <Text style={styles.remoteTagText}>• REMOTE</Text>
                  )}
                </View>

                <View style={styles.cardHeaderActions}>
                  <View
                    style={[
                      styles.matchBadge,
                      isEmerald
                        ? styles.matchBadgeEmerald
                        : isSky
                        ? styles.matchBadgeSky
                        : styles.matchBadgeSlate,
                    ]}
                  >
                    <MaterialIcons
                      name="auto-awesome"
                      size={10}
                      color={isEmerald ? "#059669" : isSky ? "#0284c7" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.matchBadgeScore,
                        isEmerald
                          ? styles.matchBadgeScoreEmerald
                          : isSky
                          ? styles.matchBadgeScoreSky
                          : styles.matchBadgeScoreSlate,
                      ]}
                    >
                      {item.match.score}% Match
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => toggleSaveStudy(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name={item.isSaved ? "bookmark" : "bookmark-border"}
                      size={18}
                      color={item.isSaved ? "#0284c7" : "#94a3b8"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.studyTitle} numberOfLines={2}>{item.title}</Text>

              {/* Facility & Location */}
              <Text style={styles.sponsorText} numberOfLines={1}>
                {item.sponsorName} • {item.city}, {item.state}
              </Text>

              {/* Clean Typographic Metrics Line (No nested box!) */}
              <View style={styles.metricsRow}>
                <Text style={styles.metricsPay}>${item.compensationAmount}</Text>
                <Text style={styles.metricsDot}>•</Text>
                <Text style={styles.metricsDetail}>{item.timeCommitment.split(" (")[0]}</Text>
                <Text style={styles.metricsDot}>•</Text>
                <Text style={styles.metricsDetail}>{item.locationType === "remote" ? "From Home" : "On-Site"}</Text>
              </View>

              {/* Clean Single-line Match Check (No nested green box!) */}
              {item.match.matchReasons.length > 0 && (
                <View style={styles.matchLine}>
                  <MaterialIcons name="check" size={13} color="#059669" />
                  <Text style={styles.matchLineText} numberOfLines={1}>
                    {item.match.matchReasons[0]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Quick Persona Switcher Bottom Sheet */}
      <Modal visible={personaSheetOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Switch Test Persona</Text>
                <Text style={styles.sheetSubtitle}>
                  Instantly recalculates study compatibility scores across the feed
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPersonaSheetOpen(false)}>
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetPersonasList}>
              {Object.values(DEMO_PERSONAS).map((p) => {
                const isActive = activePersonaId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.sheetPersonaCard, isActive && styles.sheetPersonaCardActive]}
                    onPress={() => {
                      switchPersona(p.id);
                      setPersonaSheetOpen(false);
                    }}
                  >
                    <View style={[styles.sheetAvatar, isActive && styles.sheetAvatarActive]}>
                      <Text style={[styles.sheetAvatarText, isActive && styles.sheetAvatarTextActive]}>
                        {p.profile.avatarInitials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetPersonaName}>{p.name}</Text>
                      <Text style={styles.sheetPersonaDesc}>{p.roleDescription}</Text>
                      <Text style={styles.sheetPersonaBadge}>{p.badgeLabel}</Text>
                    </View>
                    {isActive ? (
                      <MaterialIcons name="check-circle" size={20} color="#0284c7" />
                    ) : (
                      <MaterialIcons name="radio-button-unchecked" size={20} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => {
                setPersonaSheetOpen(false);
                router.push("/profile");
              }}
            >
              <Text style={styles.sheetCloseBtnText}>Edit Universal Health Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Protocol Details Modal */}
      <Modal visible={!!selectedDetailStudy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedDetailStudy && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.detailModalBadge}>
                      {selectedDetailStudy.studyType.replace(/_/g, " ").toUpperCase()} • {selectedDetailStudy.irbApprovalNumber}
                    </Text>
                    <Text style={styles.detailModalTitle}>{selectedDetailStudy.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedDetailStudy(null)}>
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.piBox}>
                    <MaterialIcons name="science" size={20} color="#0284c7" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.piName}>{selectedDetailStudy.piName}</Text>
                      <Text style={styles.piTitle}>{selectedDetailStudy.piTitle || selectedDetailStudy.sponsorName}</Text>
                    </View>
                  </View>

                  <Text style={styles.detailSectionTitle}>Protocol Overview</Text>
                  <Text style={styles.detailBodyText}>{selectedDetailStudy.fullDescription}</Text>

                  <Text style={styles.detailSectionTitle}>Compensation Schedule</Text>
                  <View style={styles.scheduleBox}>
                    <Text style={styles.scheduleAmount}>${selectedDetailStudy.compensationAmount}</Text>
                    <Text style={styles.scheduleText}>{selectedDetailStudy.compensationSchedule || "Full payment upon protocol completion."}</Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>Facility & Site</Text>
                  <View style={styles.facilityBox}>
                    <MaterialIcons name="location-on" size={18} color="#0284c7" />
                    <Text style={styles.facilityText}>{selectedDetailStudy.facilityAddress || `${selectedDetailStudy.city}, ${selectedDetailStudy.state}`}</Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>Target Demographics</Text>
                  <Text style={styles.detailBodyText}>
                    {selectedDetailStudy.targetDemographicFocus || "Open recruitment across eligible age and health categories."}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.startScreenerBtn}
                  onPress={() => handleOpenScreener(selectedDetailStudy)}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="assignment" size={18} color="#ffffff" />
                  <Text style={styles.startScreenerText}>Start 2-Min Pre-Screener</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Dynamic Pre-Screener Modal */}
      <Modal visible={!!screenerStudy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.screenerModalContent}>
            {screenerStudy && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.screenerSubtitle}>PROTOCOL PRE-SCREENER</Text>
                    <Text style={styles.screenerTitle}>{screenerStudy.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setScreenerStudy(null)}>
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {screenerResult ? (
                  /* Screener Verdict Screen */
                  <View style={styles.verdictContainer}>
                    {screenerResult.passed ? (
                      <View style={styles.verdictBoxSuccess}>
                        <View style={styles.verdictIconCircleSuccess}>
                          <MaterialIcons name="verified" size={40} color="#16a34a" />
                        </View>
                        <Text style={styles.verdictTitleSuccess}>Pre-Screener Qualified!</Text>
                        <Text style={styles.verdictTextSuccess}>
                          Your answers match the IRB protocol requirements. Your Universal Profile has been securely forwarded to the study coordinator.
                        </Text>
                        <View style={styles.verdictDetails}>
                          <Text style={styles.verdictDetailItem}>• Study Coordinator Sarah notified</Text>
                          <Text style={styles.verdictDetailItem}>• Visit checklist added to your My Studies tab</Text>
                          <Text style={styles.verdictDetailItem}>• Expect call/email within 48 business hours</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.verdictBoxFailure}>
                        <View style={styles.verdictIconCircleFailure}>
                          <MaterialIcons name="error-outline" size={40} color="#dc2626" />
                        </View>
                        <Text style={styles.verdictTitleFailure}>Protocol Not a Match</Text>
                        <Text style={styles.verdictTextFailure}>
                          Based on protocol-specific exclusion rules, this specific trial is not a fit right now:
                        </Text>
                        {screenerResult.disqualifications.map((reason, idx) => (
                          <Text key={idx} style={styles.disqualificationBullet}>• {reason}</Text>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.verdictDoneBtn}
                      onPress={() => {
                        setScreenerStudy(null);
                        if (screenerResult.passed) {
                          router.push("/applications");
                        }
                      }}
                    >
                      <Text style={styles.verdictDoneBtnText}>
                        {screenerResult.passed ? "View in My Studies" : "Explore Other Trials"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Questions Form */
                  <ScrollView style={styles.screenerScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.screenerIntro}>
                      Answer these {screenerStudy.questions.length} brief exclusion questions. Only qualified applicants are routed to the clinical team.
                    </Text>

                    {screenerStudy.questions.map((q, idx) => {
                      const currentAns = screenerAnswers[q.id];
                      return (
                        <View key={q.id} style={styles.questionCard}>
                          <Text style={styles.questionIndex}>QUESTION {idx + 1} OF {screenerStudy.questions.length}</Text>
                          <Text style={styles.questionPrompt}>{q.questionText}</Text>
                          {q.explanation && (
                            <Text style={styles.questionExplanation}>{q.explanation}</Text>
                          )}
                          <View style={styles.choiceRow}>
                            <TouchableOpacity
                              style={[styles.choicePill, currentAns === "yes" && styles.choicePillActive]}
                              onPress={() => handleAnswerQuestion(q.id, "yes")}
                            >
                              <MaterialIcons
                                name={currentAns === "yes" ? "radio-button-checked" : "radio-button-unchecked"}
                                size={16}
                                color={currentAns === "yes" ? "#ffffff" : "#64748b"}
                              />
                              <Text style={[styles.choicePillText, currentAns === "yes" && styles.choicePillTextActive]}>
                                Yes
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.choicePill, currentAns === "no" && styles.choicePillActive]}
                              onPress={() => handleAnswerQuestion(q.id, "no")}
                            >
                              <MaterialIcons
                                name={currentAns === "no" ? "radio-button-checked" : "radio-button-unchecked"}
                                size={16}
                                color={currentAns === "no" ? "#ffffff" : "#64748b"}
                              />
                              <Text style={[styles.choicePillText, currentAns === "no" && styles.choicePillTextActive]}>
                                No
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.submitScreenerBtn}
                      onPress={handleSubmitScreener}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.submitScreenerText}>Submit & Check Qualification</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#f8fafc",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "500" },

  categoryScrollWrapper: {
    backgroundColor: "#f8fafc",
    paddingBottom: 6,
  },
  categoryScroll: { paddingHorizontal: 16, gap: 6 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },
  categoryChipActive: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  categoryChipTextActive: { color: "#ffffff", fontWeight: "700" },

  listContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  listHeader: { marginBottom: 8, paddingHorizontal: 2 },
  listHeaderTitle: { fontSize: 12, fontWeight: "600", color: "#64748b" },

  studyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  studyTypeTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.4,
  },
  remoteTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
    letterSpacing: 0.4,
  },
  cardHeaderActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  bookmarkBtn: { padding: 2 },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  matchBadgeEmerald: { backgroundColor: "#ecfdf5" },
  matchBadgeSky: { backgroundColor: "#f0f9ff" },
  matchBadgeSlate: { backgroundColor: "#f1f5f9" },
  matchBadgeScore: { fontSize: 11, fontWeight: "700" },
  matchBadgeScoreEmerald: { color: "#059669" },
  matchBadgeScoreSky: { color: "#0284c7" },
  matchBadgeScoreSlate: { color: "#64748b" },

  studyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 20,
    marginBottom: 2,
  },
  sponsorText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 8,
  },

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  metricsPay: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  metricsDot: {
    fontSize: 12,
    color: "#cbd5e1",
  },
  metricsDetail: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
  },

  matchLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  matchLineText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    flex: 1,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  sheetSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  sheetPersonasList: { gap: 10, marginBottom: 16 },
  sheetPersonaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 14,
  },
  sheetPersonaCardActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  sheetAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAvatarActive: { backgroundColor: "#0284c7" },
  sheetAvatarText: { fontSize: 14, fontWeight: "800", color: "#475569" },
  sheetAvatarTextActive: { color: "#ffffff" },
  sheetPersonaName: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  sheetPersonaDesc: { fontSize: 11, color: "#64748b" },
  sheetPersonaBadge: { fontSize: 10, color: "#0369a1", fontWeight: "700", marginTop: 2 },
  sheetCloseBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
  },
  sheetCloseBtnText: { fontSize: 13, fontWeight: "700", color: "#0284c7" },

  detailModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  detailModalBadge: { fontSize: 10, fontWeight: "800", color: "#0284c7", letterSpacing: 0.5 },
  detailModalTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginTop: 3 },
  detailScroll: { marginBottom: 16 },
  piBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  piName: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  piTitle: { fontSize: 11, color: "#64748b" },
  detailSectionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", marginTop: 14, marginBottom: 6 },
  detailBodyText: { fontSize: 13, color: "#334155", lineHeight: 19 },
  scheduleBox: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  scheduleAmount: { fontSize: 18, fontWeight: "900", color: "#059669", marginBottom: 2 },
  scheduleText: { fontSize: 12, color: "#475569", lineHeight: 16 },
  facilityBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8fafc", padding: 10, borderRadius: 10 },
  facilityText: { fontSize: 12, color: "#334155", flex: 1 },
  startScreenerBtn: {
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    marginBottom: 10,
  },
  startScreenerText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  screenerModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  screenerSubtitle: { fontSize: 10, fontWeight: "800", color: "#0284c7", letterSpacing: 0.5 },
  screenerTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  screenerScroll: { marginVertical: 12 },
  screenerIntro: { fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 16 },
  questionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  questionIndex: { fontSize: 9, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 4 },
  questionPrompt: { fontSize: 13, fontWeight: "800", color: "#0f172a", lineHeight: 18, marginBottom: 4 },
  questionExplanation: { fontSize: 11, color: "#64748b", marginBottom: 10 },
  choiceRow: { flexDirection: "row", gap: 8 },
  choicePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    borderRadius: 10,
  },
  choicePillActive: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  choicePillText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  choicePillTextActive: { color: "#ffffff" },
  submitScreenerBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  submitScreenerText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  verdictContainer: { paddingVertical: 20, alignItems: "center" },
  verdictBoxSuccess: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  verdictIconCircleSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verdictTitleSuccess: { fontSize: 18, fontWeight: "800", color: "#166534", marginBottom: 6 },
  verdictTextSuccess: { fontSize: 12, color: "#15803d", textAlign: "center", lineHeight: 17, marginBottom: 14 },
  verdictDetails: { alignSelf: "stretch", backgroundColor: "#ffffff", padding: 12, borderRadius: 10, gap: 4 },
  verdictDetailItem: { fontSize: 11, color: "#334155", fontWeight: "600" },

  verdictBoxFailure: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  verdictIconCircleFailure: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verdictTitleFailure: { fontSize: 18, fontWeight: "800", color: "#991b1b", marginBottom: 6 },
  verdictTextFailure: { fontSize: 12, color: "#b91c1c", textAlign: "center", lineHeight: 17, marginBottom: 10 },
  disqualificationBullet: { fontSize: 11, color: "#7f1d1d", alignSelf: "flex-start", marginBottom: 4 },

  verdictDoneBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  verdictDoneBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
});
