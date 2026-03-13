import { Tabs } from "expo-router";
import { LayoutDashboard, Grid3X3, ShoppingBag, UtensilsCrossed, BarChart3, Settings } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: t('tables'),
          tabBarIcon: ({ color, size }) => <Grid3X3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="takeaway"
        options={{
          title: t('takeaway'),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('menu'),
          tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
