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

type FilterId = "all" | "remote" | "healthy" | "paid_high" | "clinical_trial";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "remote", label: "Remote Only" },
  { id: "healthy", label: "Healthy Volunteers" },
  { id: "paid_high", label: "Paid $500+" },
  { id: "clinical_trial", label: "Clinical Trials" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { study, login } = useGlobalSearchParams<{ study?: string; login?: string }>();
  const {
    studies,
    toggleSaveStudy,
    submitApplication,
    openLoginModal,
  } = useStudyStore();

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterId>("all");

  // Modals
  const [selectedDetailStudy, setSelectedDetailStudy] = useState<StudyWithMatch | null>(null);
  const [screenerStudy, setScreenerStudy] = useState<StudyWithMatch | null>(null);
  const [screenerAnswers, setScreenerAnswers] = useState<Record<string, string>>({});
  const [screenerResult, setScreenerResult] = useState<{ passed: boolean; disqualifications: string[] } | null>(null);

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

  // Filter studies
  const filteredStudies = studies.filter((s) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.sponsorName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Filter selection
    if (selectedFilter === "remote" && s.locationType !== "remote") return false;
    if (selectedFilter === "healthy" && !s.healthyVolunteersAccepted) return false;
    if (selectedFilter === "paid_high" && s.compensationAmount < 500) return false;
    if (selectedFilter === "clinical_trial" && s.studyType !== "clinical_trial") return false;

    return true;
  });

  const handleOpenScreener = (s: StudyWithMatch) => {
    setSelectedDetailStudy(null);
    setScreenerStudy(s);
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
      Alert.alert("Incomplete", "Please answer all questions before submitting.");
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
      {/* Prominent Search Bar (Uber-inspired clarity) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search condition, location, or sponsor..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="cancel" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Useful Filters (Restrained, approachable pills) */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Studies Feed */}
      <FlatList
        data={filteredStudies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {filteredStudies.length} {filteredStudies.length === 1 ? "study" : "studies"} available
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={44} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No matching studies found</Text>
            <Text style={styles.emptySubtitle}>
              Try clearing your search term or switching filter options to see more opportunities.
            </Text>
            {(search.length > 0 || selectedFilter !== "all") && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSearch("");
                  setSelectedFilter("all");
                }}
              >
                <Text style={styles.resetButtonText}>Reset filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedDetailStudy(item)}
            activeOpacity={0.88}
          >
            {/* Top Row: Category tag and Bookmark button */}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardCategory} numberOfLines={1}>
                {item.studyType.replace(/_/g, " ").toUpperCase()} • {item.sponsorName.toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  toggleSaveStudy(item.id);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={item.isSaved ? "Saved study" : "Save study"}
              >
                <MaterialIcons
                  name={item.isSaved ? "bookmark" : "bookmark-border"}
                  size={24}
                  color={item.isSaved ? "#0284c7" : "#94a3b8"}
                />
              </TouchableOpacity>
            </View>

            {/* 1. What is the study? (Naturally wrapped title + summary) */}
            <Text style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text style={styles.cardSummary} numberOfLines={2}>
              {item.summary}
            </Text>

            {/* 2. Is it remote or nearby? */}
            <View style={styles.metaRow}>
              <MaterialIcons
                name={item.locationType === "remote" ? "home" : "location-on"}
                size={16}
                color="#475569"
                style={styles.metaIcon}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.locationType === "remote"
                  ? "100% Remote • Nationwide"
                  : `${item.city}, ${item.state} • On-Site`}
              </Text>
            </View>

            {/* 3. What is the compensation and time commitment? */}
            <View style={styles.metaRow}>
              <MaterialIcons
                name="payments"
                size={16}
                color="#0284c7"
                style={styles.metaIcon}
              />
              <Text style={styles.compensationText}>
                ${item.compensationAmount}
                <Text style={styles.commitmentText}> • {item.timeCommitment}</Text>
              </Text>
            </View>

            {/* 4. How do I learn more? */}
            <View style={styles.cardFooter}>
              <Text style={styles.learnMoreText}>View details & criteria</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#0284c7" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Protocol Details Modal (Approachable Consumer Sheet) */}
      <Modal visible={!!selectedDetailStudy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedDetailStudy && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.modalCategoryTag}>
                      {selectedDetailStudy.studyType.replace(/_/g, " ").toUpperCase()} • {selectedDetailStudy.irbApprovalNumber}
                    </Text>
                    <Text style={styles.modalTitle}>{selectedDetailStudy.title}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDetailStudy(null)}
                    style={styles.modalCloseButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="close" size={22} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {/* Quick Metric Tiles */}
                  <View style={styles.metricTilesRow}>
                    <View style={styles.metricTile}>
                      <Text style={styles.metricTileLabel}>Stipend</Text>
                      <Text style={styles.metricTileValue}>${selectedDetailStudy.compensationAmount}</Text>
                    </View>
                    <View style={styles.metricTile}>
                      <Text style={styles.metricTileLabel}>Location</Text>
                      <Text style={styles.metricTileValue}>
                        {selectedDetailStudy.locationType === "remote" ? "Remote" : selectedDetailStudy.city}
                      </Text>
                    </View>
                    <View style={styles.metricTile}>
                      <Text style={styles.metricTileLabel}>Volunteers</Text>
                      <Text style={styles.metricTileValue}>
                        {selectedDetailStudy.healthyVolunteersAccepted ? "Healthy" : "Condition"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailSectionTitle}>Protocol Overview</Text>
                  <Text style={styles.detailBodyText}>{selectedDetailStudy.fullDescription}</Text>

                  <Text style={styles.detailSectionTitle}>Compensation Schedule</Text>
                  <Text style={styles.detailBodyText}>
                    {selectedDetailStudy.compensationSchedule || `Full stipend of $${selectedDetailStudy.compensationAmount} disbursed across scheduled visits.`}
                  </Text>

                  <Text style={styles.detailSectionTitle}>Location & Facility</Text>
                  <Text style={styles.detailBodyText}>
                    {selectedDetailStudy.facilityAddress || `${selectedDetailStudy.city}, ${selectedDetailStudy.state}`}
                  </Text>

                  <Text style={styles.detailSectionTitle}>Eligibility Requirements</Text>
                  <View style={styles.eligibilityCard}>
                    <Text style={styles.eligibilityRow}>• Age requirement: {selectedDetailStudy.minAge} to {selectedDetailStudy.maxAge} years</Text>
                    <Text style={styles.eligibilityRow}>
                      • Healthy volunteers: {selectedDetailStudy.healthyVolunteersAccepted ? "Accepted" : "Specific diagnosis required"}
                    </Text>
                    {selectedDetailStudy.targetDemographicFocus && (
                      <Text style={styles.eligibilityRow}>• Focus cohort: {selectedDetailStudy.targetDemographicFocus}</Text>
                    )}
                  </View>
                  <Text style={styles.disclaimerText}>
                    Note: StudyLoop supports initial participant discovery. Final eligibility and medical determinations are made exclusively by the research team during informed consent.
                  </Text>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => handleOpenScreener(selectedDetailStudy)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryActionText}>Check Eligibility (2-min screener)</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
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
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.modalCategoryTag}>PRE-SCREENER</Text>
                    <Text style={styles.modalTitle} numberOfLines={2}>{screenerStudy.title}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setScreenerStudy(null)}
                    style={styles.modalCloseButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="close" size={22} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                {screenerResult ? (
                  /* Verdict View */
                  <View style={styles.verdictContainer}>
                    {screenerResult.passed ? (
                      <View style={styles.verdictBoxSuccess}>
                        <View style={styles.verdictIconSuccess}>
                          <MaterialIcons name="check" size={32} color="#059669" />
                        </View>
                        <Text style={styles.verdictTitleSuccess}>Preliminary Criteria Aligned</Text>
                        <Text style={styles.verdictTextSuccess}>
                          Your answers match the initial criteria for this protocol. Your application has been submitted to the study team.
                        </Text>
                        <Text style={styles.verdictSubtext}>
                          A study coordinator will review your responses and reach out to discuss next steps and informed consent.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.verdictBoxFailure}>
                        <View style={styles.verdictIconFailure}>
                          <MaterialIcons name="info-outline" size={32} color="#dc2626" />
                        </View>
                        <Text style={styles.verdictTitleFailure}>Protocol Not a Match</Text>
                        <Text style={styles.verdictTextFailure}>
                          Based on the early protocol criteria, this study is not an aligned fit right now.
                        </Text>
                        {screenerResult.disqualifications.map((reason, idx) => (
                          <Text key={idx} style={styles.disqualificationBullet}>• {reason}</Text>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => {
                        setScreenerStudy(null);
                        if (screenerResult.passed) {
                          router.push("/(tabs)/applications");
                        }
                      }}
                    >
                      <Text style={styles.primaryActionText}>
                        {screenerResult.passed ? "View in My Studies" : "Explore Other Studies"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Questions Form */
                  <ScrollView style={styles.screenerScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.screenerIntro}>
                      Answer these {screenerStudy.questions.length} brief questions to check whether this protocol fits your background.
                    </Text>

                    {screenerStudy.questions.map((q, idx) => {
                      const currentAns = screenerAnswers[q.id];
                      return (
                        <View key={q.id} style={styles.questionCard}>
                          <Text style={styles.questionIndex}>
                            QUESTION {idx + 1} OF {screenerStudy.questions.length}
                          </Text>
                          <Text style={styles.questionPrompt}>{q.questionText}</Text>
                          {q.explanation && (
                            <Text style={styles.questionExplanation}>{q.explanation}</Text>
                          )}
                          <View style={styles.choiceRow}>
                            <TouchableOpacity
                              style={[styles.choicePill, currentAns === "yes" && styles.choicePillActive]}
                              onPress={() => handleAnswerQuestion(q.id, "yes")}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons
                                name={currentAns === "yes" ? "radio-button-checked" : "radio-button-unchecked"}
                                size={18}
                                color={currentAns === "yes" ? "#0284c7" : "#64748b"}
                              />
                              <Text style={[styles.choiceText, currentAns === "yes" && styles.choiceTextActive]}>
                                Yes
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.choicePill, currentAns === "no" && styles.choicePillActive]}
                              onPress={() => handleAnswerQuestion(q.id, "no")}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons
                                name={currentAns === "no" ? "radio-button-checked" : "radio-button-unchecked"}
                                size={18}
                                color={currentAns === "no" ? "#0284c7" : "#64748b"}
                              />
                              <Text style={[styles.choiceText, currentAns === "no" && styles.choiceTextActive]}>
                                No
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleSubmitScreener}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryActionText}>Submit & Check Eligibility</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /* Search Header (Uber-inspired) */
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },

  /* Horizontal Filter Chips */
  filterScrollWrapper: {
    backgroundColor: "#ffffff",
    paddingBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  /* List & Feed */
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },

  /* Study Card (Instagram-like simplicity & clarity) */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    width: "100%",
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 23,
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaIcon: {
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },
  compensationText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  commitmentText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#475569",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0284c7",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },

  /* Modal Base */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  detailModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "90%",
  },
  screenerModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "90%",
  },

  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 14,
  },
  modalCategoryTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 24,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  detailScroll: {
    marginBottom: 16,
  },
  metricTilesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metricTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  metricTileLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 2,
  },
  metricTileValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
  },

  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 14,
    marginBottom: 6,
  },
  detailBodyText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },
  eligibilityCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 6,
  },
  eligibilityRow: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },

  modalFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  primaryActionButton: {
    backgroundColor: "#0284c7",
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Pre-screener */
  screenerScroll: {
    marginBottom: 12,
  },
  screenerIntro: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  questionIndex: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionPrompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
    marginBottom: 6,
  },
  questionExplanation: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
    marginBottom: 10,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 10,
  },
  choicePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  choicePillActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  choiceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  choiceTextActive: {
    color: "#0284c7",
    fontWeight: "700",
  },

  /* Verdict */
  verdictContainer: {
    paddingVertical: 12,
    gap: 16,
  },
  verdictBoxSuccess: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  verdictIconSuccess: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  verdictTitleSuccess: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 6,
    textAlign: "center",
  },
  verdictTextSuccess: {
    fontSize: 13,
    color: "#15803d",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  verdictSubtext: {
    fontSize: 12,
    color: "#166534",
    textAlign: "center",
    lineHeight: 16,
  },

  verdictBoxFailure: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  verdictIconFailure: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  verdictTitleFailure: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: 6,
    textAlign: "center",
  },
  verdictTextFailure: {
    fontSize: 13,
    color: "#b91c1c",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  disqualificationBullet: {
    fontSize: 12,
    color: "#7f1d1d",
    lineHeight: 16,
    textAlign: "left",
    alignSelf: "flex-start",
  },
});
