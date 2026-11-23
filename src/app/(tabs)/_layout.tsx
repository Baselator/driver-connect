import { Tabs } from "expo-router";
import { Icon } from "@/components/ui";
import { colors } from "@/constants/theme";

/** Bottom navigation: Map | Facilities | My Bookings | Profile */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.offWhite },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Map", tabBarIcon: ({ color, size }) => <Icon name="map-outline" color={color} size={size + 2} /> }}
      />
      <Tabs.Screen
        name="facilities"
        options={{
          title: "Facilities",
          tabBarIcon: ({ color, size }) => <Icon name="format-list-bulleted" color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "My Bookings",
          tabBarIcon: ({ color, size }) => <Icon name="ticket-confirmation-outline" color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="account-circle-outline" color={color} size={size + 2} />,
        }}
      />
    </Tabs>
  );
}
