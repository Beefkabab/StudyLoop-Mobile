import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useStudyStore } from "../../hooks/useStudyStore";
import { DEMO_PERSONAS } from "../../constants/sampleData";
import { Gender, LivingEnvironment, EducationLevel } from "../../constants/types";

const COMMON_CONDITIONS = [
  "Type 2 Diabetes",
  "Mild Hypertension",
  "Asthma",
  "Migraines",
  "Osteoarthritis",
  "High Cholesterol",
];

export default function ProfileScreen() {
  const {
    activePersonaId,
    currentProfile,
    switchPersona,
    updateProfile,
    openLoginModal,
  } = useStudyStore();

  // Local form state initialized from currentProfile
  const [fullName, setFullName] = useState(currentProfile.fullName);
  const [email, setEmail] = useState(currentProfile.email);
  const [phone, setPhone] = useState(currentProfile.phone || "");
  const [age, setAge] = useState(currentProfile.age.toString());
  const [gender, setGender] = useState<Gender>(currentProfile.gender);
  const [living, setLiving] = useState<LivingEnvironment>(currentProfile.livingEnvironment);
  const [education, setEducation] = useState<EducationLevel>(currentProfile.educationLevel);
  const [city, setCity] = useState(currentProfile.city);
  const [state, setState] = useState(currentProfile.state);
  const [travelMiles, setTravelMiles] = useState(currentProfile.travelDistanceMiles.toString());
  const [isHealthy, setIsHealthy] = useState(currentProfile.isHealthyVolunteer);
  const [conditions, setConditions] = useState<string[]>(currentProfile.conditions || []);
  const [recentAntibiotics, setRecentAntibiotics] = useState(currentProfile.hasRecentAntibiotics);
  const [smokerStatus, setSmokerStatus] = useState<"never" | "former" | "current">(currentProfile.smokerStatus);

  // Sync state whenever active persona changes
  useEffect(() => {
    setFullName(currentProfile.fullName);
    setEmail(currentProfile.email);
    setPhone(currentProfile.phone || "");
    setAge(currentProfile.age.toString());
    setGender(currentProfile.gender);
    setLiving(currentProfile.livingEnvironment);
    setEducation(currentProfile.educationLevel);
    setCity(currentProfile.city);
    setState(currentProfile.state);
    setTravelMiles(currentProfile.travelDistanceMiles.toString());
    setIsHealthy(currentProfile.isHealthyVolunteer);
    setConditions(currentProfile.conditions || []);
    setRecentAntibiotics(currentProfile.hasRecentAntibiotics);
    setSmokerStatus(currentProfile.smokerStatus);
  }, [currentProfile]);

  const handleSelectPersona = (pKey: "rural_male" | "urban_student" | "chronic_patient") => {
    switchPersona(pKey);
    Alert.alert(
      "Persona Switched",
      `Active profile is now ${DEMO_PERSONAS[pKey].name}. The Discover marketplace has been re-scored dynamically!`
    );
  };

  const toggleCondition = (cond: string) => {
    if (conditions.includes(cond)) {
      setConditions(conditions.filter((c) => c !== cond));
    } else {
      setConditions([...conditions, cond]);
      setIsHealthy(false);
    }
  };

  const handleSave = () => {
    const ageNum = parseInt(age, 10) || 30;
    const travelNum = parseInt(travelMiles, 10) || 25;

    updateProfile({
      fullName,
      email,
      phone,
      age: ageNum,
      gender,
      livingEnvironment: living,
      educationLevel: education,
      city,
      state,
      travelDistanceMiles: travelNum,
      isHealthyVolunteer: isHealthy,
      conditions,
      hasRecentAntibiotics: recentAntibiotics,
      smokerStatus,
      avatarInitials: fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });

    Alert.alert(
      "Universal Profile Saved!",
      "Your health context was updated. All 5 study match algorithms have updated in real time."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Active Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentProfile.avatarInitials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{currentProfile.fullName}</Text>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#0284c7" />
                  <Text style={styles.verifiedText}>Active Match</Text>
                </View>
              </View>
              <Text style={styles.profileSub}>
                {currentProfile.isHealthyVolunteer ? "Healthy Volunteer" : "Specific Conditions"} • {currentProfile.city}, {currentProfile.state}
              </Text>
              <View style={styles.pillRow}>
                <View style={styles.tag}><Text style={styles.tagText}>Age {currentProfile.age}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{currentProfile.livingEnvironment.toUpperCase()}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{currentProfile.gender.toUpperCase()}</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.taglineBox}>
            <MaterialIcons name="info-outline" size={14} color="#0369a1" />
            <Text style={styles.taglineText}>
              {currentProfile.tagline || "Profile active for automated protocol qualification."}
            </Text>
          </View>
        </View>

        {/* Demo Persona Quick Switcher */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="swap-horiz" size={18} color="#0284c7" />
          <Text style={styles.sectionHeader}>Quick-Switch Test Personas</Text>
        </View>
        <Text style={styles.sectionSub}>
          Tap any persona to simulate different clinical recruitment demographics and observe live score changes on Discover:
        </Text>

        <View style={styles.personaGrid}>
          {Object.values(DEMO_PERSONAS).map((p) => {
            const isActive = activePersonaId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.personaCard, isActive && styles.personaCardActive]}
                onPress={() => handleSelectPersona(p.id)}
                activeOpacity={0.8}
              >
                <View style={styles.personaCardTop}>
                  <View style={[styles.personaAvatar, isActive && styles.personaAvatarActive]}>
                    <Text style={[styles.personaAvatarText, isActive && styles.personaAvatarTextActive]}>
                      {p.profile.avatarInitials}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeCheckPill}>
                      <MaterialIcons name="check" size={12} color="#ffffff" />
                      <Text style={styles.activeCheckText}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.personaName}>{p.name}</Text>
                <Text style={styles.personaDesc}>{p.roleDescription}</Text>
                <View style={[styles.personaBadge, isActive && styles.personaBadgeActive]}>
                  <Text style={[styles.personaBadgeText, isActive && styles.personaBadgeTextActive]}>
                    {p.badgeLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Universal Health Form Sections */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="assignment-ind" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Demographics & Location</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Full Legal Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max Travel (Miles)</Text>
              <TextInput style={styles.input} value={travelMiles} onChangeText={setTravelMiles} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 0.8 }}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={state} onChangeText={setState} />
            </View>
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillSelectorRow}>
            {(["male", "female", "non_binary"] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.selectorPill, gender === g && styles.selectorPillActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.selectorPillText, gender === g && styles.selectorPillTextActive]}>
                  {g === "non_binary" ? "Non-Binary" : g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Living Environment (NIH Diversity Target)</Text>
          <View style={styles.pillSelectorRow}>
            {(["rural", "suburban", "urban"] as LivingEnvironment[]).map((env) => (
              <TouchableOpacity
                key={env}
                style={[styles.selectorPill, living === env && styles.selectorPillActive]}
                onPress={() => setLiving(env)}
              >
                <Text style={[styles.selectorPillText, living === env && styles.selectorPillTextActive]}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinical Baseline & Health Context */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="medical-services" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Clinical & Health Context</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Healthy Volunteer</Text>
              <Text style={styles.switchSubtitle}>
                No chronic diagnosed medical conditions. Eligible for baseline and normal control trials.
              </Text>
            </View>
            <Switch
              value={isHealthy}
              onValueChange={(val) => {
                setIsHealthy(val);
                if (val) setConditions([]);
              }}
              trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Diagnosed Medical Conditions</Text>
          <Text style={styles.fieldHelper}>Select all that apply to test clinical trial matching:</Text>
          <View style={styles.conditionGrid}>
            {COMMON_CONDITIONS.map((cond) => {
              const isSelected = conditions.includes(cond);
              return (
                <TouchableOpacity
                  key={cond}
                  style={[styles.conditionChip, isSelected && styles.conditionChipActive]}
                  onPress={() => toggleCondition(cond)}
                >
                  <MaterialIcons
                    name={isSelected ? "check-circle" : "add-circle-outline"}
                    size={14}
                    color={isSelected ? "#0284c7" : "#64748b"}
                  />
                  <Text style={[styles.conditionChipText, isSelected && styles.conditionChipTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Recent Oral Antibiotics (30 Days)</Text>
              <Text style={styles.switchSubtitle}>Required for biomarker and immunology exclusions.</Text>
            </View>
            <Switch
              value={recentAntibiotics}
              onValueChange={setRecentAntibiotics}
              trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Smoker Status</Text>
          <View style={styles.pillSelectorRow}>
            {(["never", "former", "current"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.selectorPill, smokerStatus === s && styles.selectorPillActive]}
                onPress={() => setSmokerStatus(s)}
              >
                <Text style={[styles.selectorPillText, smokerStatus === s && styles.selectorPillTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Action */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <MaterialIcons name="save" size={18} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save Universal Profile</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Your health profile data is saved locally on your device for trial matching.
        </Text>

        {/* Institutional Investigator Access Gateway */}
        <View style={styles.institutionGatewayCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="apartment" size={16} color="#0f172a" />
              <Text style={styles.institutionGatewayTitle}>Principal Investigator or Site?</Text>
            </View>
            <Text style={styles.institutionGatewaySub}>
              Switch to the Institutional Operations Portal to manage clinical trial protocols, IRB documentation, and pre-screened candidate handoffs.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.institutionGatewayBtn}
            onPress={() => openLoginModal("institution")}
            activeOpacity={0.8}
          >
            <Text style={styles.institutionGatewayBtnText}>Institutional Sign In →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0284c7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: "#0284c7" },
  profileSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  pillRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  taglineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    marginTop: 12,
  },
  taglineText: { fontSize: 11, color: "#0369a1", flex: 1, lineHeight: 15 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionHeader: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 16 },

  personaGrid: { gap: 10, marginBottom: 24 },
  personaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  personaCardActive: {
    borderColor: "#0284c7",
    backgroundColor: "#f8fcff",
  },
  personaCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  personaAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  personaAvatarActive: { backgroundColor: "#0284c7" },
  personaAvatarText: { fontSize: 13, fontWeight: "800", color: "#475569" },
  personaAvatarTextActive: { color: "#ffffff" },
  activeCheckPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#0284c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeCheckText: { color: "#ffffff", fontSize: 10, fontWeight: "700" },
  personaName: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  personaDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  personaBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  personaBadgeActive: { backgroundColor: "#e0f2fe" },
  personaBadgeText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  personaBadgeTextActive: { color: "#0369a1" },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6, marginTop: 10 },
  fieldHelper: { fontSize: 11, color: "#64748b", marginBottom: 8 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  twoCol: { flexDirection: "row", gap: 10 },
  pillSelectorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  selectorPill: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  selectorPillActive: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  selectorPillText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  selectorPillTextActive: { color: "#ffffff" },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 4 },
  switchTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  switchSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 15 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 },

  conditionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conditionChipActive: {
    backgroundColor: "#f0f9ff",
    borderColor: "#0284c7",
  },
  conditionChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  conditionChipTextActive: { color: "#0284c7", fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#0284c7",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  footerNote: { textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 },

  institutionGatewayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 16,
    gap: 12,
  },
  institutionGatewayTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  institutionGatewaySub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
    lineHeight: 15,
  },
  institutionGatewayBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  institutionGatewayBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
});
