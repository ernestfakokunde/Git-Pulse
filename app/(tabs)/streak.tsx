import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function StreakDetail() {
  const [streak, setStreak] = useState<any>(null);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const storedGithub = await AsyncStorage.getItem("githubData");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (storedGithub) {
          const { username } = JSON.parse(storedGithub);
          const res = await fetch(`${apiUrl}/api/github/streak/${username}`);
          const data = await res.json();
          setStreak(data);
        }

        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUserStats({ xp: parsedUser.xp || 0, level: parsedUser.level || 1 });
        }
      } catch (err) {
        console.error("Error fetching streak data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRank = (lvl: number, total: number) => {
    if (total >= 10000) return { name: "Legendary", color: "#FFD700" };
    if (lvl >= 51) return { name: "Grandmaster", color: "#FF3B72" };
    if (lvl >= 26) return { name: "Master", color: "#00E884" };
    if (lvl >= 11) return { name: "Pro", color: "#3B82F6" };
    return { name: "Rookie", color: "#A7AEC4" };
  };

  const rank = getRank(userStats.level, userStats.xp);

  if (loading) return <View className="flex-1 bg-gp-canvas items-center justify-center"><ActivityIndicator color="#00E884" /></View>;

  return (
    <ScrollView className="flex-1 bg-gp-canvas px-6 pt-14">
      <Text className="text-3xl font-black text-gp-white mb-6">Streak Detail</Text>

      <View className="bg-gp-surface p-6 rounded-3xl border border-gp-border mb-6">
        <View className="items-center">
            <View className="h-24 w-24 rounded-full bg-gp-neon/10 items-center justify-center mb-4 relative">
                <Feather name="zap" size={48} color="#00E884" />
                {streak?.currentStreak > 0 && (
                    <View className="absolute -top-1 -right-1 bg-gp-hot px-2 py-1 rounded-full border-2 border-gp-surface">
                        <Text className="text-[10px] font-black text-gp-white uppercase">ON FIRE</Text>
                    </View>
                )}
            </View>
            <Text className="text-5xl font-black text-gp-white">{streak?.currentStreak || 0}</Text>
            <Text className="text-gp-neon font-bold uppercase tracking-widest mt-1">Day Streak</Text>

            <View className="mt-4 px-4 py-1.5 rounded-full bg-gp-canvas border border-gp-border">
                <Text className="text-xs font-black uppercase tracking-widest" style={{ color: rank.color }}>
                   Rank: {rank.name}
                </Text>
            </View>
        </View>
      </View>

      {/* Streak Protection / Milestones */}
      <View className="mb-8">
          <Text className="text-gp-white font-bold text-lg mb-4">Milestones</Text>
          <View className="bg-gp-surface rounded-3xl border border-gp-border p-5">
              <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                      <View className="h-10 w-10 rounded-full bg-gp-cardSoft items-center justify-center">
                          <Feather name="award" size={20} color="#00E884" />
                      </View>
                      <View className="ml-3">
                          <Text className="text-gp-white font-bold">7 Day Challenge</Text>
                          <Text className="text-xs text-gp-muted">Next up: 14 days</Text>
                      </View>
                  </View>
                  <Text className="text-gp-neon font-black text-sm">{Math.min(streak?.currentStreak, 7)}/7</Text>
              </View>
              <View className="h-1.5 w-full bg-gp-canvas rounded-full overflow-hidden">
                  <View
                    className="h-full bg-gp-neon"
                    style={{ width: `${Math.min((streak?.currentStreak / 7) * 100, 100)}%` }}
                  />
              </View>
          </View>
      </View>

      <View className="mb-8 bg-gp-dangerBg border border-gp-danger/20 rounded-2xl p-4 flex-row items-center">
          <Feather name="shield" size={24} color="#FF3D00" />
          <View className="ml-3 flex-1">
              <Text className="text-gp-white font-bold">Streak Freeze Active</Text>
              <Text className="text-xs text-gp-muted">Your legacy is protected for 24 hours.</Text>
          </View>
      </View>

      <View className="flex-row justify-between mb-8">
        <View className="w-[48%] bg-gp-surface p-4 rounded-2xl border border-gp-border items-center">
            <Text className="text-gp-muted text-xs uppercase font-bold">Longest</Text>
            <Text className="text-gp-white text-xl font-bold">{streak?.longestStreak || 0}</Text>
        </View>
        <View className="w-[48%] bg-gp-surface p-4 rounded-2xl border border-gp-border items-center">
            <Text className="text-gp-muted text-xs uppercase font-bold">Total</Text>
            <Text className="text-gp-white text-xl font-bold">{streak?.totalContributions || 0}</Text>
        </View>
      </View>

      <Text className="text-gp-white font-bold text-lg mb-4">Activity Heatmap</Text>
      <View className="flex-row flex-wrap gap-2 bg-gp-surface p-4 rounded-2xl border border-gp-border">
          {streak?.days?.map((day: any) => (
              <View
                key={day.date}
                className={`h-8 w-8 rounded-md ${
                    day.contributionCount > 0 ? 'bg-gp-neon' : 'bg-gp-border/20'
                }`}
                style={{ opacity: day.contributionCount > 0 ? Math.min(0.2 + (day.contributionCount * 0.2), 1) : 1 }}
              />
          ))}
      </View>
    </ScrollView>
  );
}
