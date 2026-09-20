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
  Modal,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useStudyStore } from "../../hooks/useStudyStore";
import { DEMO_PERSONAS } from "../../constants/sampleData";
import {
  Gender,
  LivingEnvironment,
  EducationLevel,
  PreferredContactMethod,
  PreferredLocationType,
  TransportationAccess,
  ConsentType,
  Persona,
} from "../../constants/types";

const COMMON_CONDITIONS = [
  "Type 2 Diabetes",
  "Mild Hypertension",
  "Asthma",
  "Migraines",
  "Osteoarthritis",
  "High Cholesterol",
];

const CONSENT_LABELS: Record<ConsentType, { title: string; desc: string }> = {
  matching_communications: {
    title: "Clinical Study Matching Communications",
    desc: "Permit StudyLoop's automated matching engine to notify you of qualified clinical research trials.",
  },
  transactional_email: {
    title: "Essential Protocol & Appointment Updates",
    desc: "Receive clinic visit confirmations, screening decisions, and coordinator messages.",
  },
  sms_opt_in: {
    title: "SMS Visit & Fasting Reminders",
    desc: "Receive timely text message alerts 24 hours prior to scheduled clinic visits and blood draws.",
  },
  marketing_email: {
    title: "Educational Newsletters & Research Discoveries",
    desc: "Occasional digest of published scientific findings and new university research cores.",
  },
  terms_of_service: {
    title: "Terms of Service Agreement (v2026.1)",
    desc: "Standard platform terms governing voluntary research participation.",
  },
  privacy_policy: {
    title: "Privacy Policy Agreement (v2026.1)",
    desc: "Immutable guarantee that personal health data is never sold or brokered.",
  },
};

export default function ProfileScreen() {
  const {
    activePersonaId,
    currentProfile,
    switchPersona,
    updateProfile,
    profileChecklist,
    myConsents,
    toggleConsent,
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

  // Phase 1 Reusable Passport fields
  const [contactMethod, setContactMethod] = useState<PreferredContactMethod>(
    currentProfile.preferredContactMethod || "email"
  );
  const [locationType, setLocationType] = useState<PreferredLocationType>(
    currentProfile.preferredLocationType || "no_preference"
  );
  const [language, setLanguage] = useState(currentProfile.preferredLanguage || "English");
  const [transit, setTransit] = useState<TransportationAccess>(
    currentProfile.transportationAccess || "personal_vehicle"
  );
  const [hasCaregiver, setHasCaregiver] = useState(Boolean(currentProfile.hasCaregiver));
  const [hasSmartphone, setHasSmartphone] = useState(
    currentProfile.hasInternetSmartphone !== false
  );
  const [accommodations, setAccommodations] = useState(currentProfile.accessibilityNeeds || "");

  // Modal for Privacy & Consents
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [showChecklistDetails, setShowChecklistDetails] = useState(false);

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
    setContactMethod(currentProfile.preferredContactMethod || "email");
    setLocationType(currentProfile.preferredLocationType || "no_preference");
    setLanguage(currentProfile.preferredLanguage || "English");
    setTransit(currentProfile.transportationAccess || "personal_vehicle");
    setHasCaregiver(Boolean(currentProfile.hasCaregiver));
    setHasSmartphone(currentProfile.hasInternetSmartphone !== false);
    setAccommodations(currentProfile.accessibilityNeeds || "");
  }, [currentProfile]);

  const handleSelectPersona = (pKey: Persona["id"]) => {
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
      preferredContactMethod: contactMethod,
      preferredLocationType: locationType,
      preferredLanguage: language,
      transportationAccess: transit,
      hasCaregiver,
      hasInternetSmartphone: hasSmartphone,
      accessibilityNeeds: accommodations || undefined,
      avatarInitials: fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });

    Alert.alert(
      "StudyLoop Passport Saved!",
      "Your reusable research profile was updated. Match scores across all protocols updated in real time."
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
                  <MaterialIcons name="verified" size={13} color="#0284c7" />
                  <Text style={styles.verifiedText}>Passport Active</Text>
                </View>
              </View>
              <Text style={styles.profileSub}>
                {currentProfile.isHealthyVolunteer ? "Healthy Volunteer" : "Diagnosed Conditions"} • {currentProfile.city}, {currentProfile.state}
              </Text>
              <View style={styles.pillRow}>
                <View style={styles.tag}><Text style={styles.tagText}>Age {currentProfile.age}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{currentProfile.livingEnvironment.toUpperCase()}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{currentProfile.gender.toUpperCase()}</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* StudyLoop Passport Completion Percentage */}
        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.completionTitle}>StudyLoop Passport Strength</Text>
              <Text style={styles.completionSub}>
                {profileChecklist.completedCount} of {profileChecklist.totalCount} sections complete
              </Text>
            </View>
            <Text style={styles.completionPercent}>{profileChecklist.score}%</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${profileChecklist.score}%` }]} />
          </View>

          {/* Expandable Checklist Toggle */}
          <TouchableOpacity
            style={styles.checklistToggleBtn}
            onPress={() => setShowChecklistDetails(!showChecklistDetails)}
          >
            <Text style={styles.checklistToggleText}>
              {showChecklistDetails ? "Hide Passport Checklist" : "View Passport Checklist"}
            </Text>
            <MaterialIcons
              name={showChecklistDetails ? "expand-less" : "expand-more"}
              size={18}
              color="#0284c7"
            />
          </TouchableOpacity>

          {showChecklistDetails && (
            <View style={styles.checklistList}>
              {profileChecklist.items.map((item) => (
                <View key={item.key} style={styles.checklistItem}>
                  <MaterialIcons
                    name={item.done ? "check-circle" : "radio-button-unchecked"}
                    size={16}
                    color={item.done ? "#16a34a" : "#cbd5e1"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checklistItemTitle, item.done && styles.checklistItemTitleDone]}>
                      {item.label}
                    </Text>
                    <Text style={styles.checklistItemDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Access to Privacy & Consents */}
        <TouchableOpacity
          style={styles.privacyBannerBtn}
          onPress={() => setPrivacyModalVisible(true)}
        >
          <MaterialIcons name="lock" size={18} color="#0284c7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyBannerTitle}>Privacy & Notification Consents</Text>
            <Text style={styles.privacyBannerSub}>Manage essential study alerts, SMS, and data protections</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Compact Demo Persona Switcher */}
        <View style={styles.personaSwitchSection}>
          <Text style={styles.personaSectionTitle}>Quick-Fill Test Persona</Text>
          <View style={styles.personaSegmentedRow}>
            {Object.values(DEMO_PERSONAS).map((p) => {
              const isActive = activePersonaId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.personaPillBtn, isActive && styles.personaPillBtnActive]}
                  onPress={() => handleSelectPersona(p.id as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.personaPillAvatar, isActive && styles.personaPillAvatarActive]}>
                    <Text style={[styles.personaPillAvatarText, isActive && styles.personaPillAvatarTextActive]}>
                      {p.profile.avatarInitials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.personaPillName, isActive && styles.personaPillNameActive]}>
                      {p.name}
                    </Text>
                    <Text style={[styles.personaPillBadge, isActive && styles.personaPillBadgeActive]} numberOfLines={1}>
                      {p.badgeLabel}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={18} color="#0284c7" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ================= SECTION 1: CONTACT & VERIFICATION ================= */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="badge" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Contact & Preferences</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Full Legal Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Preferred Contact Method</Text>
          <View style={styles.pillSelectorRow}>
            {(["email", "phone", "sms"] as PreferredContactMethod[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.selectorPill, contactMethod === m && styles.selectorPillActive]}
                onPress={() => setContactMethod(m)}
              >
                <Text style={[styles.selectorPillText, contactMethod === m && styles.selectorPillTextActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= SECTION 2: COMMUTE & PREFERENCES ================= */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="location-on" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Location & Trial Settings</Text>
        </View>

        <View style={styles.formCard}>
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

          <Text style={styles.label}>Preferred Study Setting</Text>
          <View style={styles.pillSelectorRow}>
            {(["in_person", "remote", "hybrid", "no_preference"] as PreferredLocationType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.selectorPill, locationType === t && styles.selectorPillActive]}
                onPress={() => setLocationType(t)}
              >
                <Text style={[styles.selectorPillText, locationType === t && styles.selectorPillTextActive]}>
                  {t.replace(/_/g, " ").toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= SECTION 3: CLINICAL HEALTH CONTEXT ================= */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="medical-services" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Clinical & Health Context</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Healthy Volunteer</Text>
              <Text style={styles.switchSubtitle}>
                No chronic diagnosed medical conditions. Eligible for baseline control studies.
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
          <Text style={styles.fieldHelper}>Select conditions to test protocol matching:</Text>
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
              <Text style={styles.switchSubtitle}>Required for biomarker & microbiome clinical exclusions.</Text>
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

        {/* ================= SECTION 4: LOGISTICS & ACCESSIBILITY ================= */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="accessible" size={18} color="#0f172a" />
          <Text style={styles.sectionHeader}>Logistics & Accommodations</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Transportation Access</Text>
          <View style={styles.pillSelectorRow}>
            {(["personal_vehicle", "public_transit", "rideshare", "needs_assistance"] as TransportationAccess[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.selectorPill, transit === t && styles.selectorPillActive]}
                onPress={() => setTransit(t)}
              >
                <Text style={[styles.selectorPillText, transit === t && styles.selectorPillTextActive]}>
                  {t.replace(/_/g, " ").toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Caregiver or Partner Accompaniment</Text>
              <Text style={styles.switchSubtitle}>
                A family member or caregiver assists you during clinical trial appointments.
              </Text>
            </View>
            <Switch
              value={hasCaregiver}
              onValueChange={setHasCaregiver}
              trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Reliable Smartphone / App Access</Text>
              <Text style={styles.switchSubtitle}>
                Required for decentralized trials that involve wearable sync or daily e-diaries.
              </Text>
            </View>
            <Switch
              value={hasSmartphone}
              onValueChange={setHasSmartphone}
              trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Accessibility Needs or Accommodations (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Wheelchair ramp, large-print consent forms, elevator access..."
            placeholderTextColor="#94a3b8"
            value={accommodations}
            onChangeText={setAccommodations}
          />
        </View>

        {/* Save Action */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <MaterialIcons name="save" size={18} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save StudyLoop Passport</Text>
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
              Switch to the Institutional Operations Portal to manage clinical trial protocols, IRB documentation, and pre-screened candidate pipelines.
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

      {/* ================= PRIVACY & NOTIFICATION SETTINGS MODAL ================= */}
      <Modal visible={privacyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Privacy & Notification Settings</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Trust Guarantee Alert */}
              <View style={styles.privacyTrustBox}>
                <MaterialIcons name="verified-user" size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyTrustTitle}>StudyLoop Participant Privacy Guarantee</Text>
                  <Text style={styles.privacyTrustDesc}>
                    Study matching consent is never permission to sell or broker your personal health information. We only share candidate summaries with verified research sites when you apply.
                  </Text>
                </View>
              </View>

              <Text style={styles.settingsSectionTitle}>Communication Preferences</Text>

              {(["matching_communications", "transactional_email", "sms_opt_in", "marketing_email"] as ConsentType[]).map((cType) => {
                const conf = CONSENT_LABELS[cType];
                const record = myConsents.find((c) => c.consentType === cType);
                const isGranted = Boolean(record && record.isGranted);

                return (
                  <View key={cType} style={styles.consentRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.consentTitle}>{conf.title}</Text>
                      <Text style={styles.consentDesc}>{conf.desc}</Text>
                    </View>
                    <Switch
                      value={isGranted}
                      onValueChange={() => toggleConsent(cType)}
                      trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
                    />
                  </View>
                );
              })}

              <View style={styles.divider} />

              <Text style={styles.settingsSectionTitle}>Legal Policy Agreements</Text>
              <View style={styles.policyRow}>
                <MaterialIcons name="description" size={16} color="#64748b" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.policyTitle}>Terms of Service</Text>
                  <Text style={styles.policyMeta}>Version 2026.1 • Agreed at account creation</Text>
                </View>
                <MaterialIcons name="check" size={16} color="#16a34a" />
              </View>

              <View style={styles.policyRow}>
                <MaterialIcons name="privacy-tip" size={16} color="#64748b" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                  <Text style={styles.policyMeta}>Version 2026.1 • Immutable protection record</Text>
                </View>
                <MaterialIcons name="check" size={16} color="#16a34a" />
              </View>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.closeModalBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
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

  /* Passport Completion Card */
  completionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  completionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  completionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  completionSub: { fontSize: 11, color: "#64748b", marginTop: 1 },
  completionPercent: { fontSize: 18, fontWeight: "900", color: "#0284c7" },
  progressBarBg: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#0284c7", borderRadius: 4 },
  checklistToggleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 6 },
  checklistToggleText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  checklistList: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8, gap: 8 },
  checklistItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  checklistItemTitle: { fontSize: 12, fontWeight: "700", color: "#334155" },
  checklistItemTitleDone: { color: "#16a34a" },
  checklistItemDesc: { fontSize: 10, color: "#64748b", marginTop: 1 },

  /* Privacy Button */
  privacyBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  privacyBannerTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  privacyBannerSub: { fontSize: 11, color: "#64748b", marginTop: 1 },

  personaSwitchSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  personaSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  personaSegmentedRow: { flexDirection: "column", gap: 8 },
  personaPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  personaPillBtnActive: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  personaPillAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  personaPillAvatarActive: {
    backgroundColor: "#0284c7",
  },
  personaPillAvatarText: { fontSize: 11, fontWeight: "800", color: "#475569" },
  personaPillAvatarTextActive: { color: "#ffffff" },
  personaPillName: { fontSize: 13, fontWeight: "700", color: "#334155" },
  personaPillNameActive: { color: "#0284c7", fontWeight: "800" },
  personaPillBadge: { fontSize: 11, color: "#64748b", marginTop: 1 },
  personaPillBadgeActive: { color: "#0369a1" },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionHeader: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

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
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    marginBottom: 6,
  },
  selectorPillActive: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  selectorPillText: { fontSize: 11, fontWeight: "700", color: "#475569" },
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

  /* Privacy Modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalHeaderTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  privacyTrustBox: { flexDirection: "row", gap: 10, backgroundColor: "#ecfdf5", padding: 12, borderRadius: 10, marginBottom: 16 },
  privacyTrustTitle: { fontSize: 12, fontWeight: "800", color: "#065f46" },
  privacyTrustDesc: { fontSize: 11, color: "#047857", marginTop: 2, lineHeight: 15 },
  settingsSectionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", marginTop: 10, marginBottom: 8 },
  consentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  consentTitle: { fontSize: 12, fontWeight: "700", color: "#334155" },
  consentDesc: { fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 14 },
  policyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  policyTitle: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  policyMeta: { fontSize: 10, color: "#64748b", marginTop: 1 },
  closeModalBtn: { backgroundColor: "#0284c7", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 18 },
  closeModalBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
});

