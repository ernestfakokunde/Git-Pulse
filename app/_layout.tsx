import "../global.css";
import { StatusBar } from "expo-status-bar";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00E884',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
  }
}

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();

    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        router.replace("/(tabs)/dashboard");
      }
    };
    checkLogin();

    // Schedule a reminder if not already scheduled
    Notifications.getAllScheduledNotificationsAsync().then(scheduled => {
        if (scheduled.length === 0) {
            Notifications.scheduleNotificationAsync({
                content: {
                    title: "Protect your streak! ⚡",
                    body: "Don't forget to push your code today to keep your GitPulse active.",
                },
                trigger: {
                    hour: 20,
                    minute: 0,
                    repeats: true,
                },
            });
        }
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050606" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
