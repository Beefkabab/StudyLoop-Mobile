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
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useStudyStore } from "../../hooks/useStudyStore";
import { ApplicationStatus } from "../../constants/types";

const statusConfig: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string }> = {
  screener_passed: { label: "Qualified Site Handoff", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  scheduled: { label: "Initial Visit Booked", bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  enrolled: { label: "Enrolled in Trial", bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
  pending_contact: { label: "Coordinator Review", bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  screened_out: { label: "Protocol Excluded", bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  completed: { label: "Completed Protocol", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  withdrawn: { label: "Withdrawn", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const {
    applications,
    reminders,
    toggleReminder,
    studies,
    savedStudyIds,
    toggleSaveStudy,
  } = useStudyStore();

  const [activeTab, setActiveTab] = useState<"apps" | "reminders" | "saved">("apps");

  const savedStudiesList = studies.filter((s) => savedStudyIds.includes(s.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 3-Way Sub Tabs */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "apps" && styles.tabBtnActive]}
            onPress={() => setActiveTab("apps")}
          >
            <Text style={[styles.tabBtnText, activeTab === "apps" && styles.tabBtnTextActive]}>
              Applications ({applications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "reminders" && styles.tabBtnActive]}
            onPress={() => setActiveTab("reminders")}
          >
            <Text style={[styles.tabBtnText, activeTab === "reminders" && styles.tabBtnTextActive]}>
              Schedule ({reminders.length})
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

      {/* Tab 1: Applications */}
      {activeTab === "apps" && (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.tabIntro}>
              <Text style={styles.tabIntroTitle}>Application Funnel & Site Handoffs</Text>
              <Text style={styles.tabIntroSubtitle}>
                Only applicants who pass dynamic pre-screeners reach clinical research coordinators.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <MaterialIcons name="assignment-late" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Applications</Text>
              <Text style={styles.emptySub}>Explore trials on the Discover tab and complete a 2-minute pre-screener to apply.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const conf = statusConfig[item.status] || statusConfig.screener_passed;
            return (
              <View style={styles.appCard}>
                <View style={styles.appCardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                    <Text style={[styles.statusBadgeText, { color: conf.text }]}>{conf.label}</Text>
                  </View>
                  <Text style={styles.appPay}>${item.compensationAmount}</Text>
                </View>

                <Text style={styles.appTitle}>{item.studyTitle}</Text>
                <Text style={styles.appSponsor}>{item.sponsorName}</Text>

                {item.appointmentDate && (
                  <View style={styles.appointmentRow}>
                    <MaterialIcons name="event" size={14} color="#0284c7" />
                    <Text style={styles.appointmentText}>{item.appointmentDate}</Text>
                  </View>
                )}

                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Coordinator Update:</Text>
                  <Text style={styles.notesText}>{item.researcherNotes || "Application under active coordinator review."}</Text>
                </View>

                <View style={styles.appCardFooter}>
                  <Text style={styles.appTimestamp}>Applied {item.createdAt}</Text>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() =>
                      Alert.alert(
                        "Study Coordinator Contact",
                        `In a production trial, this connects you to Sarah Lindquist at ${item.sponsorName} via secure phone or encrypted portal message.`
                      )
                    }
                  >
                    <MaterialIcons name="mail-outline" size={13} color="#0284c7" />
                    <Text style={styles.contactBtnText}>Message Site</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Tab 2: Reminders & Schedule */}
      {activeTab === "reminders" && (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.tabIntro}>
              <Text style={styles.tabIntroTitle}>Visit Reminders & Preparation</Text>
              <Text style={styles.tabIntroSubtitle}>
                Protocol adherence checklists automatically scheduled based on your trials.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <MaterialIcons name="event-available" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Pending Reminders</Text>
              <Text style={styles.emptySub}>Reminders appear here automatically when pre-screeners pass.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.reminderCard, item.isCompleted && styles.reminderCardDone]}
              onPress={() => toggleReminder(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.reminderTop}>
                <TouchableOpacity onPress={() => toggleReminder(item.id)}>
                  <MaterialIcons
                    name={item.isCompleted ? "check-box" : "check-box-outline-blank"}
                    size={22}
                    color={item.isCompleted ? "#16a34a" : "#0284c7"}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.reminderTitle, item.isCompleted && styles.reminderTitleDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.reminderStudy} numberOfLines={1}>{item.studyTitle}</Text>
                </View>
                <View style={styles.channelBadge}>
                  <Text style={styles.channelBadgeText}>{item.channel.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.scheduleRow}>
                <MaterialIcons name="alarm" size={13} color="#64748b" />
                <Text style={styles.scheduleTime}>{item.scheduledFor}</Text>
              </View>

              <Text style={styles.reminderNotes}>{item.notes}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Tab 3: Saved Studies */}
      {activeTab === "saved" && (
        <FlatList
          data={savedStudiesList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.tabIntro}>
              <Text style={styles.tabIntroTitle}>Bookmarked Opportunities</Text>
              <Text style={styles.tabIntroSubtitle}>
                Trials you saved to review protocol criteria and screen when ready.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <MaterialIcons name="bookmark-border" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Saved Studies</Text>
              <Text style={styles.emptySub}>Tap the bookmark icon on any card in the Discover tab to save it here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.savedCard}>
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
                onPress={() => router.push("/(tabs)")}
              >
                <Text style={styles.savedScreenBtnText}>Open in Discover & Screen</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#0284c7" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  tabBtnText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  tabBtnTextActive: { color: "#0f172a", fontWeight: "800" },

  listContent: { padding: 16, paddingBottom: 36 },
  tabIntro: { marginBottom: 14 },
  tabIntroTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  tabIntroSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginTop: 10 },
  emptySub: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 4, lineHeight: 16 },

  /* App Card */
  appCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  appCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "800" },
  appPay: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  appTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
  appSponsor: { fontSize: 12, color: "#64748b", marginTop: 2, marginBottom: 8 },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  appointmentText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  notesBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 10,
  },
  notesLabel: { fontSize: 10, fontWeight: "700", color: "#64748b", marginBottom: 2 },
  notesText: { fontSize: 11, color: "#334155", lineHeight: 15 },
  appCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appTimestamp: { fontSize: 10, color: "#94a3b8" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
  },
  contactBtnText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },

  /* Reminder Card */
  reminderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  reminderCardDone: { backgroundColor: "#f8fafc", opacity: 0.75 },
  reminderTop: { flexDirection: "row", alignItems: "flex-start" },
  reminderTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  reminderTitleDone: { textDecorationLine: "line-through", color: "#64748b" },
  reminderStudy: { fontSize: 11, color: "#64748b", marginTop: 1 },
  channelBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelBadgeText: { fontSize: 9, fontWeight: "800", color: "#64748b" },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 4 },
  scheduleTime: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  reminderNotes: { fontSize: 11, color: "#475569", lineHeight: 15 },

  /* Saved Card */
  savedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  savedCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  savedTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  savedSponsor: { fontSize: 11, color: "#64748b", marginTop: 2 },
  savedDetailsRow: { flexDirection: "row", gap: 12, alignItems: "center", marginVertical: 10 },
  savedPay: { fontSize: 15, fontWeight: "900", color: "#059669" },
  savedMatch: { fontSize: 11, fontWeight: "800", color: "#0284c7", backgroundColor: "#f0f9ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  savedCommitment: { fontSize: 11, color: "#64748b" },
  savedScreenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  savedScreenBtnText: { fontSize: 12, fontWeight: "700", color: "#0284c7" },
});
