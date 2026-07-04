import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View, Alert } from "react-native";

export default function SettingsPage() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("userData").then((data) => {
      if (data) {
        const user = JSON.parse(data);
        setUsername(user.username || user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["userToken", "userData", "githubData"]);
            router.replace("/");
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gp-canvas px-6 pt-14">
      <View className="flex-row items-center mb-10">
        <Pressable onPress={() => router.replace("/(tabs)/dashboard")} className="mr-4">
          <Feather name="arrow-left" size={24} color="#F8FAFC" />
        </Pressable>
        <Text className="text-2xl font-bold text-gp-white">Settings</Text>
      </View>

      <View className="bg-gp-surface rounded-2xl border border-gp-border overflow-hidden">
        <View className="p-4 border-b border-gp-border flex-row items-center justify-between">
          <Text className="text-gp-muted font-medium">Account</Text>
          <Text className="text-gp-white font-bold">{username}</Text>
        </View>

        <Pressable
          onPress={() => {}}
          className="p-4 border-b border-gp-border flex-row items-center justify-between active:bg-gp-white/5"
        >
          <Text className="text-gp-white font-medium">Notifications</Text>
          <Feather name="chevron-right" size={20} color="#A7AEC4" />
        </Pressable>

        <Pressable
          onPress={() => {}}
          className="p-4 border-b border-gp-border flex-row items-center justify-between active:bg-gp-white/5"
        >
          <Text className="text-gp-white font-medium">Privacy Policy</Text>
          <Feather name="chevron-right" size={20} color="#A7AEC4" />
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogout}
        className="mt-8 h-14 flex-row items-center justify-center rounded-2xl bg-gp-dangerBg border border-gp-danger/20"
      >
        <Feather name="log-out" size={20} color="#FF3D00" />
        <Text className="ml-3 text-lg font-bold text-gp-danger">Sign Out</Text>
      </Pressable>

      <Text className="mt-auto mb-8 text-center text-gp-muted text-xs">
        GitPulse v1.0.0
      </Text>
    </View>
  );
}
