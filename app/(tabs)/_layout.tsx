import React, { useEffect } from "react";
import { Tabs, router, usePathname } from "expo-router";
import { Platform, View, Text, TouchableOpacity, LogBox, Modal, ScrollView } from "react-native";
LogBox.ignoreAllLogs();
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StudyStoreProvider, useStudyStore } from "../../hooks/useStudyStore";
import LoginModal from "../../components/LoginModal";
import { StudyLoopLogo } from "../../components/StudyLoopLogo";

function HeaderAuthButton() {
  const {
    userRole,
    activePI,
    currentProfile,
    openLoginModal,
    exitPIToConsumer,
    unreadNotificationCount,
    myNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStudyStore();

  const [notificationModalVisible, setNotificationModalVisible] = React.useState(false);

  if (userRole === "pi" && activePI) {
    return (
      <TouchableOpacity
        onPress={exitPIToConsumer}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "#0f172a",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 14,
          marginRight: 14,
          borderWidth: 1,
          borderColor: "#334155",
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="logout" size={13} color="#38bdf8" />
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#ffffff" }}>Exit PI</Text>
      </TouchableOpacity>
    );
  }

  // Consumer mode: Notification Bell + Persona Switcher
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 12 }}>
      {/* Notification Bell */}
      <TouchableOpacity
        onPress={() => setNotificationModalVisible(true)}
        style={{
          padding: 6,
          position: "relative",
          borderRadius: 10,
          backgroundColor: "#f8fafc",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="notifications-none" size={19} color="#0f172a" />
        {unreadNotificationCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              backgroundColor: "#ea580c",
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 9, fontWeight: "900" }}>
              {unreadNotificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Persona Pill */}
      <TouchableOpacity
        onPress={() => openLoginModal("consumer")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "#f0f9ff",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#bae6fd",
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#0284c7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#ffffff" }}>
            {currentProfile.avatarInitials}
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#0284c7" }}>
          {currentProfile.fullName.split(" ")[0]}
        </Text>
        <MaterialIcons name="unfold-more" size={12} color="#0284c7" />
      </TouchableOpacity>

      {/* Notification Center Modal */}
      <Modal visible={notificationModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialIcons name="notifications" size={20} color="#0284c7" />
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                  Notifications
                </Text>
                {unreadNotificationCount > 0 && (
                  <View
                    style={{
                      backgroundColor: "#fff7ed",
                      borderWidth: 1,
                      borderColor: "#fed7aa",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#ea580c" }}>
                      {unreadNotificationCount} new
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {myNotifications.length > 0 && (
              <TouchableOpacity
                onPress={markAllNotificationsRead}
                style={{ alignSelf: "flex-end", marginBottom: 10 }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0284c7" }}>
                  Mark all as read
                </Text>
              </TouchableOpacity>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {myNotifications.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <MaterialIcons name="notifications-off" size={36} color="#cbd5e1" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", marginTop: 8 }}>
                    No Notifications
                  </Text>
                </View>
              ) : (
                myNotifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => {
                      markNotificationRead(n.id);
                      setNotificationModalVisible(false);
                      router.push("/(tabs)/applications");
                    }}
                    style={{
                      backgroundColor: n.isRead ? "#ffffff" : "#f0f9ff",
                      borderWidth: 1,
                      borderColor: n.isRead ? "#e2e8f0" : "#bae6fd",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: n.isRead ? "700" : "800",
                          color: "#0f172a",
                          flex: 1,
                        }}
                      >
                        {n.title}
                      </Text>
                      {!n.isRead && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#0284c7",
                            marginLeft: 6,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: "#475569", lineHeight: 16 }}>
                      {n.body}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                      {n.createdAt}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabsContent() {
  const { userRole, activePI } = useStudyStore();
  const isPIMode = userRole === "pi" || userRole === "coordinator";
  const pathname = usePathname();

  useEffect(() => {
    if (isPIMode && pathname !== "/researcher") {
      router.replace("/researcher");
    } else if (!isPIMode && pathname === "/researcher") {
      router.replace("/");
    }
  }, [isPIMode, pathname]);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#0284c7",
          tabBarInactiveTintColor: "#64748b",
          headerShown: true,
          headerStatusBarHeight: 0,
          headerLeft: () => (
            <View style={{ marginLeft: 16 }}>
              <StudyLoopLogo size={24} />
            </View>
          ),
          headerRight: () => <HeaderAuthButton />,
          headerStyle: {
            backgroundColor: "#ffffff",
            height: Platform.OS === "ios" ? 92 : undefined,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 17,
            color: "#0f172a",
            letterSpacing: -0.3,
          },
          tabBarStyle: {
            display: isPIMode ? "none" : "flex",
            backgroundColor: "#ffffff",
            borderTopColor: "#e2e8f0",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 88 : 64,
            paddingBottom: Platform.OS === "ios" ? 28 : 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Discover",
            headerTitle: "Discover",
            href: isPIMode ? null : "/(tabs)",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="explore" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: "My Studies",
            headerTitle: "My Studies",
            href: isPIMode ? null : "/(tabs)/applications",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="assignment-turned-in" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: "Profile",
            href: isPIMode ? null : "/(tabs)/profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="researcher"
          options={{
            title: "PI Portal",
            headerTitle: "PI Workspace",
            href: !isPIMode ? null : "/(tabs)/researcher",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name="medical-services"
                size={size || 24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <LoginModal />
    </>
  );
}

export default function TabLayout() {
  return (
    <StudyStoreProvider>
      <TabsContent />
    </StudyStoreProvider>
  );
}
