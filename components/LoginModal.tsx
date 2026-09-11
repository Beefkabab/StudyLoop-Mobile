import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useStudyStore } from "../hooks/useStudyStore";
import { PI_ACCOUNTS } from "../constants/sampleData";
import { PIData } from "../constants/types";
import { StudyLoopLogo } from "./StudyLoopLogo";

export default function LoginModal() {
  const router = useRouter();
  const {
    loginModalVisible,
    setLoginModalVisible,
    loginModalAudience,
    loginAsConsumer,
    loginAsPI,
    activePersonaId,
    activePI,
    userRole,
  } = useStudyStore();

  const [audience, setAudience] = useState<"consumer" | "institution">("consumer");
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Keep audience synchronized with store
  useEffect(() => {
    if (loginModalAudience) {
      setAudience(loginModalAudience);
    }
  }, [loginModalAudience, loginModalVisible]);

  const handleConsumerQuickLogin = (personaKey: "rural_male" | "urban_student" | "chronic_patient", name: string) => {
    loginAsConsumer(personaKey);
    Alert.alert("Welcome Back!", `Signed in as ${name}. Redirecting to Participant Discover Marketplace.`);
    router.push("/(tabs)");
  };

  const handlePIQuickLogin = (pi: PIData) => {
    loginAsPI(pi.id);
    Alert.alert(
      "Protocol Access Granted",
      `Logged in as ${pi.name}.\n\nEntering protocol portal for:\n"${pi.studyTitle}"`
    );
    router.push("/(tabs)/researcher");
  };

  const handleConsumerFormSubmit = () => {
    if (!username.trim()) {
      Alert.alert("Required", "Please enter your username.");
      return;
    }
    if (username.toLowerCase().includes("chloe")) {
      handleConsumerQuickLogin("urban_student", "Chloe Martinez");
    } else if (username.toLowerCase().includes("robert")) {
      handleConsumerQuickLogin("chronic_patient", "Robert Chen");
    } else {
      handleConsumerQuickLogin("rural_male", fullName || "Marcus Davis");
    }
  };

  const handleInstitutionFormSubmit = () => {
    if (!username.trim()) {
      Alert.alert("Required", "Please enter your username or staff ID.");
      return;
    }
    const clean = username.trim().toLowerCase();
    const found = PI_ACCOUNTS.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.username.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );

    if (found) {
      handlePIQuickLogin(found);
    } else {
      const coord = PI_ACCOUNTS.find((p) => p.id === "coordinator_sarah")!;
      handlePIQuickLogin(coord);
    }
  };

  return (
    <Modal
      visible={loginModalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setLoginModalVisible(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header Bar */}
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerLogoRow}>
                <StudyLoopLogo size={24} />
                <Text style={styles.headerLogoText}>StudyLoop</Text>
              </View>
              <Text style={styles.headerTitle}>
                {audience === "consumer" ? "Participant Sign In" : "Research Portal Sign In"}
              </Text>
              <Text style={styles.headerSub}>
                {audience === "consumer"
                  ? "Access clinical trials, study stipends, and visit milestones."
                  : "Investigator login to manage trial protocols and screening queues."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setLoginModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Clean Segmented Switcher */}
          <View style={styles.audienceSegmentContainer}>
            <TouchableOpacity
              style={[
                styles.audienceSegmentBtn,
                audience === "consumer" && styles.audienceSegmentBtnActiveConsumer,
              ]}
              onPress={() => setAudience("consumer")}
            >
              <MaterialIcons
                name="person"
                size={16}
                color={audience === "consumer" ? "#ffffff" : "#64748b"}
              />
              <Text
                style={[
                  styles.audienceSegmentText,
                  audience === "consumer" && styles.audienceSegmentTextActive,
                ]}
              >
                Participant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.audienceSegmentBtn,
                audience === "institution" && styles.audienceSegmentBtnActiveInst,
              ]}
              onPress={() => setAudience("institution")}
            >
              <MaterialIcons
                name="domain"
                size={16}
                color={audience === "institution" ? "#ffffff" : "#64748b"}
              />
              <Text
                style={[
                  styles.audienceSegmentText,
                  audience === "institution" && styles.audienceSegmentTextActive,
                ]}
              >
                Institution & PI
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ================= CONSUMER VIEW ================= */}
            {audience === "consumer" && (
              <View style={styles.sectionWrap}>
                {/* 1-Tap Demo Logins */}
                <View style={styles.quickCard}>
                  <View style={styles.quickHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MaterialIcons name="auto-awesome" size={16} color="#d97706" />
                      <Text style={styles.quickTitle}>1-Tap Participant Demo Logins</Text>
                    </View>
                    <Text style={styles.quickHint}>Instant Access</Text>
                  </View>

                  {/* Persona 1: Marcus */}
                  <TouchableOpacity
                    style={[
                      styles.personaCard,
                      userRole === "consumer" && activePersonaId === "rural_male" && styles.personaCardActive,
                    ]}
                    onPress={() => handleConsumerQuickLogin("rural_male", "Marcus Davis")}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.personaAvatar, { backgroundColor: "#e0f2fe" }]}>
                      <Text style={[styles.personaAvatarText, { color: "#0369a1" }]}>MD</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.personaName}>Marcus Davis</Text>
                        <View style={[styles.badgePill, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
                          <Text style={[styles.badgePillText, { color: "#059669" }]}>Diversity Target</Text>
                        </View>
                      </View>
                      <Text style={styles.personaDesc}>Rural Male Volunteer • Sanford, NC</Text>
                      <Text style={styles.personaSub}>Matches Cognitive Aging Study (98%)</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                  </TouchableOpacity>

                  {/* Persona 2: Chloe */}
                  <TouchableOpacity
                    style={[
                      styles.personaCard,
                      userRole === "consumer" && activePersonaId === "urban_student" && styles.personaCardActive,
                    ]}
                    onPress={() => handleConsumerQuickLogin("urban_student", "Chloe Martinez")}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.personaAvatar, { backgroundColor: "#ccfbf1" }]}>
                      <Text style={[styles.personaAvatarText, { color: "#0f766e" }]}>CM</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.personaName}>Chloe Martinez</Text>
                        <View style={[styles.badgePill, { backgroundColor: "#f0fdfa", borderColor: "#99f6e4" }]}>
                          <Text style={[styles.badgePillText, { color: "#0f766e" }]}>Healthy Control</Text>
                        </View>
                      </View>
                      <Text style={styles.personaDesc}>Urban Student Control • Durham, NC</Text>
                      <Text style={styles.personaSub}>Matches Immunology & Digital Sleep</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                  </TouchableOpacity>

                  {/* Persona 3: Robert */}
                  <TouchableOpacity
                    style={[
                      styles.personaCard,
                      userRole === "consumer" && activePersonaId === "chronic_patient" && styles.personaCardActive,
                    ]}
                    onPress={() => handleConsumerQuickLogin("chronic_patient", "Robert Chen")}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.personaAvatar, { backgroundColor: "#f3e8ff" }]}>
                      <Text style={[styles.personaAvatarText, { color: "#7e22ce" }]}>RC</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.personaName}>Robert Chen</Text>
                        <View style={[styles.badgePill, { backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }]}>
                          <Text style={[styles.badgePillText, { color: "#7e22ce" }]}>Metabolic Trial</Text>
                        </View>
                      </View>
                      <Text style={styles.personaDesc}>Type 2 Diabetes Patient • Cary, NC</Text>
                      <Text style={styles.personaSub}>Matches GLP-1 Diabetes Trial (95%)</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Consumer Credentials Form */}
                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Text style={styles.formCardTitle}>
                      {authMode === "signin" ? "Volunteer Credentials Sign In" : "Register Universal Volunteer Profile"}
                    </Text>
                    <View style={styles.formCardBadge}>
                      <Text style={styles.formCardBadgeText}>CONSUMER</Text>
                    </View>
                  </View>

                  {authMode === "register" && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Legal Name</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Jordan Miller"
                          value={fullName}
                          onChangeText={setFullName}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="jordan@example.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username or Email</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. marcus_volunteer"
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitBtnConsumer}
                    onPress={handleConsumerFormSubmit}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="login" size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      {authMode === "signin" ? "Sign In as Volunteer" : "Create Profile Account"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeSwitchBtn}
                    onPress={() => setAuthMode(authMode === "signin" ? "register" : "signin")}
                  >
                    <Text style={styles.modeSwitchText}>
                      {authMode === "signin"
                        ? "Need an account? Create a free universal profile"
                        : "Already registered? Sign in with your credentials"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hand-off to Institution Login */}
                <View style={styles.audienceHandoffCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceHandoffTitle}>Principal Investigator or Site?</Text>
                    <Text style={styles.audienceHandoffSub}>Access protocol workspaces and screening queues.</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.audienceHandoffBtn}
                    onPress={() => setAudience("institution")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.audienceHandoffBtnText}>Institutional Sign In →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ================= INSTITUTION / PI VIEW ================= */}
            {audience === "institution" && (
              <View style={styles.sectionWrap}>
                {/* Principal Investigator & Coordinator List */}
                <View style={styles.piSectionCard}>
                  <View style={styles.piSectionHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MaterialIcons name="medical-services" size={18} color="#0284c7" />
                      <Text style={styles.piSectionTitle}>Principal Investigator & PI Portals</Text>
                    </View>
                    <View style={styles.ssoBadge}>
                      <Text style={styles.ssoBadgeText}>INSTITUTIONAL SSO</Text>
                    </View>
                  </View>
                  <Text style={styles.piSectionSub}>
                    Select your clinical trial protocol to enter the dedicated investigator portal:
                  </Text>

                  {PI_ACCOUNTS.map((pi) => {
                    const isSelected = userRole === "pi" && activePI?.id === pi.id;
                    const isCoordinator = pi.id === "coordinator_sarah";
                    return (
                      <View
                        key={pi.id}
                        style={[
                          styles.piCard,
                          isSelected && styles.piCardSelected,
                        ]}
                      >
                        <View style={styles.piCardTop}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <Text style={styles.piName}>{pi.name}</Text>
                              <View
                                style={[
                                  styles.piBadge,
                                  isCoordinator ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" } : undefined,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.piBadgeText,
                                    isCoordinator ? { color: "#166534" } : undefined,
                                  ]}
                                >
                                  {isCoordinator ? "LEAD COORDINATOR" : "PI"}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.piInstitution}>{pi.institution}</Text>
                          </View>
                        </View>

                        {/* Assigned Study Protocol */}
                        <View style={styles.protocolBox}>
                          <MaterialIcons name="biotech" size={15} color="#059669" style={{ marginTop: 1 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.protocolTitle}>{pi.studyTitle}</Text>
                            <Text style={styles.protocolMeta}>
                              IRB: {pi.irbNumber} • Stipend: {pi.compensation}
                            </Text>
                          </View>
                        </View>

                        {/* Enter Study Button */}
                        <TouchableOpacity
                          style={[
                            styles.enterStudyBtn,
                            isSelected && styles.enterStudyBtnActive,
                          ]}
                          onPress={() => handlePIQuickLogin(pi)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.enterStudyBtnText}>
                            {isSelected
                              ? "Currently Active in Portal"
                              : isCoordinator
                              ? "Enter Multi-Site Operations"
                              : "Enter Study Portal as PI"}
                          </Text>
                          <MaterialIcons
                            name={isSelected ? "check" : "arrow-forward"}
                            size={14}
                            color="#ffffff"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Institutional Staff Credentials Form */}
                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Text style={styles.formCardTitle}>Custom Institutional Staff Credentials</Text>
                    <View style={[styles.formCardBadge, { backgroundColor: "#0f172a" }]}>
                      <Text style={[styles.formCardBadgeText, { color: "#ffffff" }]}>RESEARCH OPS</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username / Staff ID</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. coordinator_sarah or pi_whitman"
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Institutional Password</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitBtnInst}
                    onPress={handleInstitutionFormSubmit}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="domain" size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Sign In to Researcher Workspace</Text>
                  </TouchableOpacity>
                </View>

                {/* Hand-off to Consumer Login */}
                <View style={styles.audienceHandoffCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceHandoffTitle}>Looking to join a trial as a volunteer?</Text>
                    <Text style={styles.audienceHandoffSub}>Browse compensated studies matching your health background.</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.audienceHandoffBtn}
                    onPress={() => setAudience("consumer")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.audienceHandoffBtnText}>Volunteer Sign In →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer Trust Badge */}
            <View style={styles.footerTrust}>
              <MaterialIcons name="verified-user" size={14} color="#64748b" />
              <Text style={styles.footerTrustText}>
                IRB-compliant credential exchange and encrypted candidate handoffs.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    gap: 12,
  },
  headerTitleWrap: { flex: 1 },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  headerLogoText: { fontSize: 16, fontWeight: "900", color: "#0f172a", letterSpacing: -0.3 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  audienceSegmentContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  audienceSegmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  audienceSegmentBtnActiveConsumer: {
    backgroundColor: "#0284c7",
    shadowColor: "#0284c7",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  audienceSegmentBtnActiveInst: {
    backgroundColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  audienceSegmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  audienceSegmentTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionWrap: {
    gap: 14,
  },
  quickCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  quickHint: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
  },
  personaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  personaCardActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  personaAvatarText: {
    fontSize: 13,
    fontWeight: "900",
  },
  personaName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: "800",
  },
  personaDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  personaSub: {
    fontSize: 10,
    color: "#0284c7",
    fontWeight: "600",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  formCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
    marginBottom: 14,
  },
  formCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
  },
  formCardBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formCardBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748b",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0f172a",
  },
  submitBtnConsumer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284c7",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  submitBtnInst: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  modeSwitchBtn: {
    alignItems: "center",
    marginTop: 12,
  },
  modeSwitchText: {
    fontSize: 11,
    color: "#0284c7",
    fontWeight: "600",
  },
  audienceHandoffCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  audienceHandoffTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  audienceHandoffSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 14,
  },
  audienceHandoffBtn: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    flexShrink: 0,
  },
  audienceHandoffBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0f172a",
  },
  piSectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  piSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  piSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  ssoBadge: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ssoBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#ffffff",
  },
  piSectionSub: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 15,
  },
  piCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    marginBottom: 10,
  },
  piCardSelected: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  piCardTop: {
    marginBottom: 8,
  },
  piName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  piBadge: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  piBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#0284c7",
  },
  piInstitution: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  protocolBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 10,
  },
  protocolTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 15,
  },
  protocolMeta: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },
  enterStudyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  enterStudyBtnActive: {
    backgroundColor: "#059669",
  },
  enterStudyBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  footerTrust: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  footerTrustText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
});
