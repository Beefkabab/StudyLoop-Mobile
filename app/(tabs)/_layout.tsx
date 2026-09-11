import React, { useEffect } from "react";
import { Tabs, router, usePathname } from "expo-router";
import { Platform, View, Text, TouchableOpacity, LogBox } from "react-native";
LogBox.ignoreAllLogs();
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StudyStoreProvider, useStudyStore } from "../../hooks/useStudyStore";
import LoginModal from "../../components/LoginModal";
import { StudyLoopLogo } from "../../components/StudyLoopLogo";

function HeaderAuthButton() {
  const { userRole, activePI, currentProfile, openLoginModal, exitPIToConsumer } = useStudyStore();

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

  // Consumer mode
  return (
    <TouchableOpacity
      onPress={() => openLoginModal("consumer")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#f0f9ff",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 16,
        marginRight: 14,
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
            headerTitle: "Health Profile",
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
