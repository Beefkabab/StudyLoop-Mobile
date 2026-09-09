import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useStudyStore } from "../hooks/useStudyStore";
import { Study } from "../constants/types";

interface ManageStudyModalProps {
  visible: boolean;
  onClose: () => void;
  studyToEdit: Study | null;
}

export default function ManageStudyModal({
  visible,
  onClose,
  studyToEdit,
}: ManageStudyModalProps) {
  const { updateStudy, createStudy, activePI } = useStudyStore();

  const [mode, setMode] = useState<"edit" | "create">("edit");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [compensationAmount, setCompensationAmount] = useState("650");
  const [compensationSchedule, setCompensationSchedule] = useState("$200 visit 1, $450 visit 2");
  const [timeCommitment, setTimeCommitment] = useState("3 visits over 6 weeks");
  const [targetEnrollment, setTargetEnrollment] = useState("50");
  const [currentEnrolled, setCurrentEnrolled] = useState("12");
  const [minAge, setMinAge] = useState("50");
  const [maxAge, setMaxAge] = useState("85");
  const [healthyVolunteers, setHealthyVolunteers] = useState(true);
  const [city, setCity] = useState("Durham");
  const [state, setState] = useState("NC");

  useEffect(() => {
    if (studyToEdit) {
      setMode("edit");
      setTitle(studyToEdit.title || "");
      setSummary(studyToEdit.summary || "");
      setFullDescription(studyToEdit.fullDescription || "");
      setCompensationAmount(studyToEdit.compensationAmount?.toString() || "650");
      setCompensationSchedule(studyToEdit.compensationSchedule || "$200 visit 1, $450 visit 2");
      setTimeCommitment(studyToEdit.timeCommitment || "3 visits over 6 weeks");
      setTargetEnrollment(studyToEdit.targetEnrollment?.toString() || "50");
      setCurrentEnrolled(studyToEdit.currentEnrolled?.toString() || "0");
      setMinAge(studyToEdit.minAge?.toString() || "18");
      setMaxAge(studyToEdit.maxAge?.toString() || "85");
      setHealthyVolunteers(studyToEdit.healthyVolunteersAccepted ?? true);
      setCity(studyToEdit.city || "Durham");
      setState(studyToEdit.state || "NC");
    } else {
      setMode("create");
      setTitle("");
      setSummary("");
      setFullDescription("");
      setCompensationAmount("500");
      setCompensationSchedule("$250 per visit (2 visits total)");
      setTimeCommitment("2 visits, 45 mins each");
      setTargetEnrollment("60");
      setCurrentEnrolled("0");
      setMinAge("18");
      setMaxAge("75");
      setHealthyVolunteers(true);
      setCity("Durham");
      setState("NC");
    }
  }, [studyToEdit, visible]);

  const handleSave = () => {
    if (!title.trim() || !summary.trim()) {
      Alert.alert("Required Information", "Please provide a protocol title and summary.");
      return;
    }

    const payNum = parseInt(compensationAmount, 10) || 500;
    const targetNum = parseInt(targetEnrollment, 10) || 50;
    const enrolledNum = parseInt(currentEnrolled, 10) || 0;
    const minAgeNum = parseInt(minAge, 10) || 18;
    const maxAgeNum = parseInt(maxAge, 10) || 85;

    if (mode === "edit" && studyToEdit) {
      updateStudy(studyToEdit.id, {
        title,
        summary,
        fullDescription,
        compensationAmount: payNum,
        compensationSchedule,
        timeCommitment,
        targetEnrollment: targetNum,
        currentEnrolled: enrolledNum,
        minAge: minAgeNum,
        maxAge: maxAgeNum,
        healthyVolunteersAccepted: healthyVolunteers,
        city,
        state,
      });

      Alert.alert(
        "Protocol Updated!",
        `Changes saved for "${title}". All candidate screening matching and quota bars have updated live.`
      );
      onClose();
    } else {
      const newStudyId = `study_custom_${Date.now()}`;
      const newStudy: Study = {
        id: newStudyId,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        sponsorName: activePI?.institution || "Triangle Research Network",
        sponsorType: "university",
        piName: activePI?.name || "Principal Investigator",
        piTitle: "Principal Investigator",
        studyType: "clinical_trial",
        compensationAmount: payNum,
        compensationType: "Direct Payment (Stipend)",
        compensationSchedule,
        timeCommitment,
        durationWeeks: 6,
        locationType: "in_person",
        city,
        state,
        facilityAddress: "300 Science Dr, Durham, NC 27708",
        summary,
        fullDescription: fullDescription || summary,
        irbApprovalNumber: `IRB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        targetEnrollment: targetNum,
        currentEnrolled: enrolledNum,
        minAge: minAgeNum,
        maxAge: maxAgeNum,
        targetGender: "all",
        healthyVolunteersAccepted: healthyVolunteers,
        questions: [
          {
            id: `q_${Date.now()}_1`,
            questionText: "Can you attend scheduled visits at our clinical research facility?",
            expectedAnswer: "yes",
            isDisqualifying: true,
          },
        ],
      };

      createStudy(newStudy);
      Alert.alert(
        "Study Protocol Created!",
        `New protocol "${title}" is now active in your portal and available in the volunteer Discover marketplace.`
      );
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {mode === "edit" ? "MANAGE STUDY PROTOCOL" : "REGISTER NEW TRIAL"}
                  </Text>
                </View>
                <View style={styles.piBadge}>
                  <Text style={styles.piBadgeText}>1 STUDY SCOPE</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>
                {mode === "edit" ? "Manage Your Study" : "Create New Protocol"}
              </Text>
              <Text style={styles.headerSub}>
                {mode === "edit"
                  ? "Update compensation, target cohorts, and clinical inclusion criteria."
                  : "Publish a new trial protocol to recruit qualified participants."}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "edit" && styles.modeTabActive]}
              onPress={() => setMode("edit")}
              disabled={!studyToEdit}
            >
              <MaterialIcons
                name="settings"
                size={14}
                color={mode === "edit" ? "#0284c7" : "#94a3b8"}
              />
              <Text style={[styles.modeTabText, mode === "edit" && styles.modeTabTextActive]}>
                Edit Active Protocol
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === "create" && styles.modeTabActive]}
              onPress={() => setMode("create")}
            >
              <MaterialIcons
                name="add-circle"
                size={14}
                color={mode === "create" ? "#0284c7" : "#94a3b8"}
              />
              <Text style={[styles.modeTabText, mode === "create" && styles.modeTabTextActive]}>
                Register New Study
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* 1. Protocol Identity */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="biotech" size={16} color="#0284c7" />
                <Text style={styles.sectionTitle}>1. Protocol Identification</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Protocol Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Multi-Sensory Neural Resilience Study"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Facility City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Durham"
                  />
                </View>
                <View style={[styles.inputGroup, { width: 80 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={state}
                    onChangeText={setState}
                    placeholder="NC"
                  />
                </View>
              </View>
            </View>

            {/* 2. Compensation & Logistics */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="payments" size={16} color="#059669" />
                <Text style={styles.sectionTitle}>2. Compensation & Commitment</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Total Pay ($ USD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={compensationAmount}
                    onChangeText={setCompensationAmount}
                    placeholder="650"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Time Commitment</Text>
                  <TextInput
                    style={styles.textInput}
                    value={timeCommitment}
                    onChangeText={setTimeCommitment}
                    placeholder="3 visits over 6 weeks"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Schedule Breakdown</Text>
                <TextInput
                  style={styles.textInput}
                  value={compensationSchedule}
                  onChangeText={setCompensationSchedule}
                  placeholder="e.g. $200 Visit 1, $450 Visit 2 upon completion"
                />
              </View>
            </View>

            {/* 3. Enrollment Quotas */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="groups" size={16} color="#7c3aed" />
                <Text style={styles.sectionTitle}>3. Recruitment Capacity & Cohort</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Target Cohort (N=)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={targetEnrollment}
                    onChangeText={setTargetEnrollment}
                    placeholder="50"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Currently Enrolled</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={currentEnrolled}
                    onChangeText={setCurrentEnrolled}
                    placeholder="12"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Min Age (Years)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={minAge}
                    onChangeText={setMinAge}
                    placeholder="18"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Max Age (Years)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={maxAge}
                    onChangeText={setMaxAge}
                    placeholder="85"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchTitle}>Healthy Volunteers Eligible</Text>
                  <Text style={styles.switchSubtitle}>Allow non-condition participants to qualify.</Text>
                </View>
                <Switch
                  value={healthyVolunteers}
                  onValueChange={setHealthyVolunteers}
                  trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
                />
              </View>
            </View>

            {/* 4. Plain-Language Summaries */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={16} color="#ea580c" />
                <Text style={styles.sectionTitle}>4. Descriptions & Procedures</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Marketplace Summary (Short) *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={2}
                  value={summary}
                  onChangeText={setSummary}
                  placeholder="2-3 sentences explaining the study in friendly, clear language."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Protocol Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { height: 90 }]}
                  multiline
                  numberOfLines={4}
                  value={fullDescription}
                  onChangeText={setFullDescription}
                  placeholder="Detailed visit requirements, blood draws, and informed consent info."
                />
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <MaterialIcons name="save" size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>
                {mode === "edit" ? "Save Protocol Changes" : "Publish New Protocol"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  headerBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tag: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  tagText: { fontSize: 9, fontWeight: "800", color: "#0284c7" },
  piBadge: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  piBadgeText: { fontSize: 9, fontWeight: "800", color: "#38bdf8" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 15 },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    marginLeft: 10,
  },

  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  modeTabText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  modeTabTextActive: { color: "#0284c7", fontWeight: "800" },

  formContainer: { padding: 16, paddingBottom: 40, gap: 14 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },

  inputGroup: { gap: 4 },
  label: { fontSize: 11, fontWeight: "700", color: "#475569" },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0f172a",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  row: { flexDirection: "row", gap: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  switchTitle: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  switchSubtitle: { fontSize: 10, color: "#64748b" },

  saveBtn: {
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
    shadowColor: "#0284c7",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
});
