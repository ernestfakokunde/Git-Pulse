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
  Alert,
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

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  type: string;
  requiresCommit?: boolean;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [githubUser, setGithubUser] = useState<GithubData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const storedGithub = await AsyncStorage.getItem("githubData");
      const storedUserData = await AsyncStorage.getItem("userData");

      if (!storedGithub || !token) {
        router.replace("/");
        return;
      }

      const parsedGithub = JSON.parse(storedGithub);
      const parsedUser = JSON.parse(storedUserData || "{}");
      const clientDate = new Date().toISOString().split("T")[0];

      setGithubUser(parsedGithub);
      setUserStats({ xp: parsedUser.xp || 0, level: parsedUser.level || 1 });

      // Parallel fetch
      const [streakRes, missionsRes] = await Promise.all([
        fetch(`${apiUrl}/api/github/streak/${parsedGithub.username}`),
        fetch(`${apiUrl}/api/missions?clientDate=${clientDate}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const streakData = await streakRes.json();
      const missionsData = await missionsRes.json();

      if (streakRes.ok) setStreak(streakData);
      if (missionsRes.ok) setMissions(missionsData);

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

  const handleClaim = async (missionId: string) => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        const clientDate = new Date().toISOString().split("T")[0];

        const response = await fetch(`${apiUrl}/api/missions/claim`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ missionId, clientDate })
        });

        const data = await response.json();

        if (response.ok) {
            Alert.alert("Success!", `You gained ${data.xpGained} XP!`);
            // Update local state
            setUserStats({ xp: data.newTotalXp, level: data.level });

            // Re-fetch missions to show the next one in the queue
            fetchData();

            // Update stored userData
            const storedUserData = await AsyncStorage.getItem("userData");
            if (storedUserData) {
                const parsed = JSON.parse(storedUserData);
                parsed.xp = data.newTotalXp;
                parsed.level = data.level;
                await AsyncStorage.setItem("userData", JSON.stringify(parsed));
            }
        } else {
            Alert.alert("Error", data.message || "Could not claim reward");
        }
    } catch (err) {
        Alert.alert("Error", "Network error while claiming");
    }
  };

  const currentXP = userStats.xp;
  const level = userStats.level;
  const xpInLevel = currentXP % 100;
  const progressToNextLevel = xpInLevel / 100;

  const getRank = (lvl: number, total: number) => {
    if (total >= 10000) return { name: "Legendary", color: "#FFD700" };
    if (lvl >= 51) return { name: "Grandmaster", color: "#FF3B72" };
    if (lvl >= 26) return { name: "Master", color: "#00E884" };
    if (lvl >= 11) return { name: "Pro", color: "#3B82F6" };
    return { name: "Rookie", color: "#A7AEC4" };
  };

  const rank = getRank(level, currentXP);

  const getNextRankInfo = (totalXP: number) => {
    if (totalXP < 1000) return { name: "Pro", target: 1100 };
    if (totalXP < 2500) return { name: "Master", target: 2600 };
    if (totalXP < 5000) return { name: "Grandmaster", target: 5100 };
    if (totalXP < 10000) return { name: "Legendary", target: 10000 };
    return null;
  };

  const nextRank = getNextRankInfo(currentXP);
  const xpRemaining = nextRank ? nextRank.target - currentXP : 0;

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
        <View className="flex-row items-center justify-between mb-8">
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

        {/* 1. Hero Streak Card (Top Priority) */}
        <View className="overflow-hidden rounded-3xl bg-gp-card p-6 border border-gp-neon/20">
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

        {/* 2. XP Progress & Milestone Guide */}
        <View className="mt-8">
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

        <View className="mt-4 bg-gp-surface p-5 rounded-2xl border border-gp-border">
            <View className="flex-row justify-between items-end mb-4">
                <View>
                    <Text className="text-gp-muted text-xs uppercase font-bold mb-1">Total Power</Text>
                    <Text className="text-gp-white text-3xl font-black">{currentXP} XP</Text>
                </View>
                {nextRank && (
                    <View className="items-end">
                        <Text className="text-gp-neon font-black text-lg">{xpRemaining}</Text>
                        <Text className="text-gp-muted text-[10px] uppercase font-bold">XP to {nextRank.name}</Text>
                    </View>
                )}
            </View>

            <View className="flex-row justify-between pt-4 border-t border-gp-border">
                <View className="items-center">
                    <Text className="text-gp-white font-bold text-[10px]">ROOKIE</Text>
                    <Text className="text-gp-muted text-[9px]">0 - 1k</Text>
                </View>
                <View className="items-center opacity-60">
                    <Text className="text-gp-white font-bold text-[10px]">PRO</Text>
                    <Text className="text-gp-muted text-[9px]">1.1k - 2.5k</Text>
                </View>
                <View className="items-center opacity-60">
                    <Text className="text-gp-white font-bold text-[10px]">MASTER</Text>
                    <Text className="text-gp-muted text-[9px]">2.6k - 5k</Text>
                </View>
                <View className="items-center opacity-60">
                    <Text className="text-gp-white font-bold text-[10px]">LEGEND</Text>
                    <Text className="text-gp-muted text-[9px]">10k+</Text>
                </View>
            </View>
        </View>

        {/* 3. Daily Missions */}
        <View className="mt-8">
            <Text className="text-lg font-bold text-gp-white mb-4">Daily Missions</Text>
            <View className="bg-gp-surface rounded-2xl border border-gp-border overflow-hidden">
                {missions.map((mission, idx) => (
                    <View key={mission.id} className={`p-4 flex-row items-center ${idx < missions.length - 1 ? 'border-b border-gp-border' : ''}`}>
                        <View className={`h-6 w-6 rounded-full border-2 items-center justify-center ${mission.completed ? 'bg-gp-neon border-gp-neon' : 'border-gp-muted'}`}>
                            {mission.completed && <Feather name="check" size={14} color="#050606" />}
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className={`font-bold ${mission.completed ? 'text-gp-muted line-through' : 'text-gp-white'}`}>{mission.title}</Text>
                            <Text className="text-xs text-gp-muted">{mission.description}</Text>
                        </View>
                        {!mission.completed ? (
                            <TouchableOpacity
                                onPress={() => handleClaim(mission.id)}
                                className={`px-3 py-1 rounded-full ${mission.id !== 'daily_pulse' && mission.requiresCommit ? 'bg-gp-cardSoft border border-gp-neon/30' : 'bg-gp-neon'}`}
                            >
                                <Text className={`text-[10px] font-black ${mission.id !== 'daily_pulse' && mission.requiresCommit ? 'text-gp-neon' : 'text-gp-canvas'}`}>
                                    {mission.id !== 'daily_pulse' && mission.requiresCommit ? 'VERIFY' : 'CLAIM'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text className="text-gp-neon font-bold">+{mission.xpReward} XP</Text>
                        )}
                    </View>
                ))}
            </View>
        </View>

        {/* 4. Contribution Grid */}
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

        {error ? (
          <View className="mt-6 p-4 rounded-xl bg-gp-dangerBg border border-gp-danger/20">
            <Text className="text-center text-gp-danger font-medium">{error}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
