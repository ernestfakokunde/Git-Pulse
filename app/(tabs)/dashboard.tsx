import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface GithubData {
  username: string;
  name: string;
  avatarUrl: string;
  publicRepos: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  days: { date: string; contributionCount: number }[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [githubUser, setGithubUser] = useState<GithubData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const storedGithub = await AsyncStorage.getItem("githubData");
      if (!storedGithub) {
        router.replace("/");
        return;
      }

      const parsedGithub = JSON.parse(storedGithub);
      setGithubUser(parsedGithub);

      const response = await fetch(`${apiUrl}/api/github/streak/${parsedGithub.username}`);
      const data = await response.json();

      if (response.ok) {
        setStreak(data);
      } else {
        setError(data.message || "Failed to load streak data");
      }
    } catch (err) {
      console.error("Fetch Error Details:", err);
      setError("Unable to connect to the server at " + apiUrl);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentXP = streak?.totalContributions || 0;
  const level = Math.floor(currentXP / 100) + 1;
  const xpInLevel = currentXP % 100;
  const progressToNextLevel = xpInLevel / 100;

  const getRank = (lvl: number, total: number) => {
    if (total >= 5000) return { name: "Legendary", color: "#FFD700" }; // Gold
    if (lvl >= 5) return { name: "Grandmaster", color: "#FF3B72" }; // Hot Pink
    if (lvl >= 4) return { name: "Master", color: "#00E884" }; // Neon Green
    if (lvl >= 3) return { name: "Pro", color: "#3B82F6" }; // Blue
    return { name: "Rookie", color: "#A7AEC4" }; // Muted
  };

  const rank = getRank(level, currentXP);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gp-canvas">
        <ActivityIndicator size="large" color="#00E884" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gp-canvas"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E884" />
      }
    >
      <View className="px-6 pt-14">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={githubUser?.avatarUrl}
              className="h-12 w-12 rounded-full border border-gp-border"
            />
            <View className="ml-3">
              <Text className="text-xl font-bold text-gp-white">
                {githubUser?.name || githubUser?.username}
              </Text>
              <View className="flex-row items-center">
                <View className="px-1.5 py-0.5 rounded bg-gp-surface border border-gp-border">
                    <Text className="text-[10px] font-black uppercase" style={{ color: rank.color }}>
                        {rank.name}
                    </Text>
                </View>
                <Text className="mx-2 text-xs text-gp-border">|</Text>
                <Text className="text-xs font-bold text-gp-neon">LVL {level}</Text>
              </View>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-full bg-gp-surface border border-gp-border"
            >
                <Feather name="bell" size={20} color="#F8FAFC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View className="mt-6">
            <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-bold text-gp-white uppercase">Progress to LVL {level + 1}</Text>
                <Text className="text-xs font-bold text-gp-muted">{xpInLevel}/100 XP</Text>
            </View>
            <View className="h-2 w-full bg-gp-surface rounded-full overflow-hidden border border-gp-border">
                <View
                    className="h-full bg-gp-neon"
                    style={{ width: `${progressToNextLevel * 100}%` }}
                />
            </View>
        </View>

        {/* Daily Quests */}
        <View className="mt-8">
            <Text className="text-lg font-bold text-gp-white mb-4">Daily Quests</Text>
            <View className="bg-gp-surface rounded-2xl border border-gp-border overflow-hidden">
                <View className="p-4 border-b border-gp-border flex-row items-center">
                    <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${streak?.days[0]?.contributionCount > 0 ? 'bg-gp-neon border-gp-neon' : 'border-gp-muted'}`}>
                        {streak?.days[0]?.contributionCount > 0 && <Feather name="check" size={14} color="#050606" />}
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className={`font-bold ${streak?.days[0]?.contributionCount > 0 ? 'text-gp-muted line-through' : 'text-gp-white'}`}>Keep the flame alive</Text>
                        <Text className="text-xs text-gp-muted">Make at least one contribution today</Text>
                    </View>
                    <Text className="text-gp-neon font-bold">+50 XP</Text>
                </View>
                <View className="p-4 flex-row items-center opacity-50">
                    <View className="h-6 w-6 rounded-full border-2 border-gp-muted items-center justify-center" />
                    <View className="ml-3 flex-1">
                        <Text className="font-bold text-gp-white">Sprint Master</Text>
                        <Text className="text-xs text-gp-muted">Commit to 3 different repositories</Text>
                    </View>
                    <Text className="text-gp-muted font-bold">+150 XP</Text>
                </View>
            </View>
        </View>

        {/* Hero Streak Card */}
        <View className="mt-8 overflow-hidden rounded-3xl bg-gp-card p-6 border border-gp-neon/20">
            <View className="flex-row items-center justify-between">
                <View>
                    <View className="flex-row items-center mb-1">
                        <Text className="text-gp-neon font-bold text-lg uppercase tracking-wider">Current Streak</Text>
                        <View className="ml-3 px-2 py-0.5 bg-gp-neon/10 rounded-full border border-gp-neon/30">
                            <Text className="text-[10px] font-bold text-gp-neon uppercase">
                                {streak?.currentStreak >= 30 ? 'Open Source Elite' :
                                 streak?.currentStreak >= 7 ? 'Rising Star' : 'Beginner'}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-baseline">
                        <Text className="text-6xl font-black text-gp-white">{streak?.currentStreak || 0}</Text>
                        <Text className="ml-2 text-xl font-bold text-gp-muted">days</Text>
                    </View>
                </View>
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-gp-neon/10">
                    <Feather name="zap" size={32} color="#00E884" />
                </View>
            </View>

            <View className="mt-6 flex-row justify-between border-t border-gp-white/5 pt-4">
                <View>
                    <Text className="text-xs text-gp-muted uppercase font-semibold">Longest</Text>
                    <Text className="text-gp-white font-bold text-lg">{streak?.longestStreak || 0} days</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-gp-muted uppercase font-semibold">Total Contributions</Text>
                    <Text className="text-gp-white font-bold text-lg">{streak?.totalContributions || 0}</Text>
                </View>
            </View>
        </View>

        {/* Contribution Grid (Simplified) */}
        <View className="mt-8">
            <Text className="text-lg font-bold text-gp-white mb-4">Last 30 Days</Text>
            <View className="flex-row flex-wrap justify-between bg-gp-surface p-4 rounded-2xl border border-gp-border">
                {streak?.days.map((day, i) => (
                    <View
                        key={day.date}
                        className={`h-4 w-4 rounded-[2px] mb-1 ${
                            day.contributionCount > 0
                            ? (day.contributionCount > 5 ? 'bg-gp-neon' : 'bg-gp-neonDim')
                            : 'bg-gp-border/30'
                        }`}
                        style={{ width: '12%', aspectRatio: 1 }}
                    />
                ))}
            </View>
        </View>

        {/* GitHub Quick Stats */}
        <View className="mt-8 flex-row justify-between">
            <View className="w-[48%] bg-gp-surface p-5 rounded-2xl border border-gp-border">
                <Feather name="box" size={20} color="#00E884" />
                <Text className="mt-2 text-2xl font-bold text-gp-white">{githubUser?.publicRepos || 0}</Text>
                <Text className="text-xs text-gp-muted font-medium">Public Repos</Text>
            </View>
             <View className="w-[48%] bg-gp-surface p-5 rounded-2xl border border-gp-border">
                <Feather name="cpu" size={20} color="#FF3B72" />
                <Text className="mt-2 text-2xl font-bold text-gp-white">
                    {streak?.days[0]?.contributionCount || 0}
                </Text>
                <Text className="text-xs text-gp-muted font-medium">Today's Commits</Text>
            </View>
        </View>

        {error ? (
          <View className="mt-6 p-4 rounded-xl bg-gp-dangerBg border border-gp-danger/20">
            <Text className="text-center text-gp-danger font-medium">{error}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
